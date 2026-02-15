/**
 * Veo3 分辨率升级服务
 *
 * 职责：
 * - 检查视频是否需要分辨率升级
 * - 处理 1080P 升级（同步轮询）
 * - 触发 4K 升级（异步回调）
 * - 管理升级相关的 metadata
 *
 * 设计原则：
 * - 高内聚：所有升级逻辑集中在此服务
 * - 低耦合：通过清晰的接口与 webhook 交互
 * - 可扩展：便于添加新的分辨率支持
 */

import { newStorage } from "@/lib/storage";
import { VIDEO_CACHE_CONTROL } from "@/lib/cache-control";
import { isKieAiVeo3Model, calculateCredits } from "@/config/video-models";
import { KieAiVeo3Provider } from "@/services/providers/KieAiVeo3Provider";
import { updateVideoGenerationByVeo3RequestId } from "@/models/videoGeneration";
import { increaseCredits, CreditsTransType } from "@/services/credit";

// ==================== 类型定义 ====================

export type Resolution = "720p" | "1080p" | "4k";

export interface UpscaleRequirement {
  needs1080PUpscale: boolean;
  needs4KUpscale: boolean;
  requestedResolution: Resolution;
}

export interface Upscale1080PResult {
  success: boolean;
  videoUrl?: string;
  r2Url?: string;
  message: string;
}

export interface Trigger4KResult {
  success: boolean;
  taskId?: string;
  message: string;
}

export interface UpscaleMetadata {
  upscale_4k_status?: "processing" | "completed" | "failed";
  upscale_1080p_status?: "completed" | "failed";
  base_video_url?: string;
  base_video_url_r2?: string;
  video_url_1080p?: string;
  original_veo3_request_id?: string;
  upscale_4k_task_id?: string;
}

// ==================== 服务类 ====================

export class Veo3UpscaleService {
  /**
   * 检查视频是否需要分辨率升级
   *
   * @param modelId 视频模型 ID
   * @param requestedResolution 用户请求的分辨率
   * @returns 升级需求信息
   */
  static checkUpscaleRequirement(
    modelId: string,
    requestedResolution?: string
  ): UpscaleRequirement {
    const resolution = (requestedResolution || "720p") as Resolution;
    const isVeo3Model = isKieAiVeo3Model(modelId);

    let needs1080PUpscale = false;
    let needs4KUpscale = false;

    if (isVeo3Model) {
      if (resolution === "4k") {
        needs4KUpscale = true;
      } else if (resolution === "1080p") {
        needs1080PUpscale = true;
      }
      // 720p 不需要升级，直接使用基础视频
    }

    return {
      needs1080PUpscale,
      needs4KUpscale,
      requestedResolution: resolution,
    };
  }

  /**
   * 在开始分辨率升级前，更新数据库状态为 IN_PROGRESS
   *
   * 目的：让前端在升级轮询期间显示"处理中"状态，而不是旧状态
   *
   * @param requestId 视频生成任务 ID
   * @param videoGeneration 视频生成记录
   * @param baseVideoUrl 基础视频 URL（原始）
   * @param baseR2Url 基础视频 R2 URL
   * @param resolution 目标分辨率（1080p 或 4k）
   */
  static async markUpscaleInProgress(
    requestId: string,
    videoGeneration: any,
    baseVideoUrl: string,
    baseR2Url?: string | null,
    resolution: "1080p" | "4k" = "1080p"
  ): Promise<void> {
    console.log(`🎬 ${resolution.toUpperCase()} 升级开始，更新状态为 IN_PROGRESS: ${requestId}`);

    const statusKey = resolution === "4k" ? "upscale_4k_status" : "upscale_1080p_status";

    const updateParams = {
      status: "IN_PROGRESS" as const,
      metadata: {
        ...videoGeneration.metadata,
        [statusKey]: "processing",
        base_video_url: baseVideoUrl,
        base_video_url_r2: baseR2Url || undefined,
      },
    };

    await updateVideoGenerationByVeo3RequestId(requestId, updateParams);
  }

  /**
   * 处理 1080P 升级（同步轮询）
   *
   * 流程：
   * 1. 调用 Kie.ai API 轮询 1080P 视频
   * 2. 成功后上传到 R2
   * 3. 失败则返回失败信息（调用方负责退款）
   *
   * @param requestId 原始视频生成任务 ID
   * @param videoGenerationId 数据库记录 ID
   * @returns 升级结果
   */
  static async process1080PUpscale(
    requestId: string,
    videoGenerationId: string
  ): Promise<Upscale1080PResult> {
    console.log(`🎬 开始1080P升级处理: ${requestId}`);

    const apiKey = process.env.KIE_AI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        message: "KIE_AI_API_KEY not configured",
      };
    }

    try {
      const provider = new KieAiVeo3Provider(apiKey);
      // 同步轮询1080P，最多重试15次，每次间隔20秒（总计约5分钟）
      const result = await provider.request1080P(requestId, 15, 20000);

      if (!result.success || !result.video_url) {
        console.warn(`⚠️ 1080P升级失败: ${result.message}`);
        return {
          success: false,
          message: result.message,
        };
      }

      // 1080P 成功，上传到 R2
      const r2Url = await this.uploadVideoToR2(
        result.video_url,
        videoGenerationId,
        "1080p"
      );

      console.log(`✅ 1080P升级成功: ${r2Url || result.video_url}`);
      return {
        success: true,
        videoUrl: result.video_url,
        r2Url: r2Url || result.video_url,
        message: "1080P upgrade successful",
      };
    } catch (error) {
      console.error("1080P升级处理失败:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "1080P upgrade failed",
      };
    }
  }

  /**
   * 触发 4K 升级（异步回调）
   *
   * 流程：
   * 1. 调用 Kie.ai API 触发 4K 升级
   * 2. 获取新的 taskId
   * 3. 更新数据库的 veo3_request_id 为新 taskId（以便 4K 回调能找到记录）
   * 4. 记录原始 taskId 到 metadata
   *
   * @param requestId 原始视频生成任务 ID
   * @param videoGeneration 视频生成记录
   * @param baseVideoUrl 基础视频 URL（原始）
   * @param baseR2Url 基础视频 R2 URL
   * @returns 触发结果
   */
  static async trigger4KUpscale(
    requestId: string,
    videoGeneration: any,
    baseVideoUrl: string,
    baseR2Url?: string | null
  ): Promise<Trigger4KResult> {
    console.log(`🎬 触发4K升级: ${requestId}`);

    const apiKey = process.env.KIE_AI_API_KEY;
    if (!apiKey) {
      console.error("KIE_AI_API_KEY not configured for 4K upscaling");
      return {
        success: false,
        message: "KIE_AI_API_KEY not configured",
      };
    }

    try {
      const provider = new KieAiVeo3Provider(apiKey);
      const webhook4kUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/video-generation/webhook/veo3-4k`;

      const upscaleResult = await provider.request4K(requestId, webhook4kUrl);
      console.log(`🎬 4K upscaling triggered: ${upscaleResult.message}`);

      // 如果成功触发且返回了新的 taskId，更新 veo3_request_id
      if (upscaleResult.success && upscaleResult.taskId) {
        const new4KTaskId = upscaleResult.taskId;
        console.log(`🔄 Updating veo3_request_id: ${requestId} -> ${new4KTaskId}`);

        // 更新数据库：veo3_request_id 改为 4K 任务 ID，原始 ID 存入 metadata
        await updateVideoGenerationByVeo3RequestId(requestId, {
          veo3_request_id: new4KTaskId,
          metadata: {
            ...videoGeneration.metadata,
            upscale_4k_status: "processing",
            base_video_url: baseVideoUrl,
            base_video_url_r2: baseR2Url || undefined,
            original_veo3_request_id: requestId,
            upscale_4k_task_id: new4KTaskId,
          },
        });

        console.log(`✅ veo3_request_id updated to 4K taskId: ${new4KTaskId}`);
        return {
          success: true,
          taskId: new4KTaskId,
          message: "4K upgrade triggered successfully",
        };
      }

      return {
        success: upscaleResult.success,
        message: upscaleResult.message,
      };
    } catch (error) {
      console.error("4K upscaling request failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "4K upgrade trigger failed",
      };
    }
  }

  /**
   * 退还 1080P 升级部分费用
   *
   * 定价: 720p=12积分, 1080p=16积分
   * 退款 = 1080P费用 - 720p基础费用 = 16 - 12 = 4积分
   */
  static async refund1080PUpgradeCost(videoGeneration: any): Promise<void> {
    try {
      const metadata = videoGeneration.metadata || {};
      const creditDeduction = metadata.credit_deduction;

      // 跳过预扣费的 agent 任务
      if (creditDeduction?.skipped) {
        console.log(
          `ℹ️ Skip 1080P refund: agent precharged for video generation ${videoGeneration.id}`
        );
        return;
      }

      // 检查是否有扣费记录
      if (
        !creditDeduction ||
        !creditDeduction.pools ||
        creditDeduction.pools.length === 0
      ) {
        console.error(
          `❌ Missing credit_deduction metadata for 1080P refund: ${videoGeneration.id}`
        );
        return;
      }

      const duration = videoGeneration.duration_seconds || 8;
      const hasAudio = videoGeneration.has_audio || false;

      // 计算退款金额
      const cost1080P = calculateCredits(
        videoGeneration.model_id,
        duration,
        hasAudio,
        "1080p"
      );
      const costBase = calculateCredits(
        videoGeneration.model_id,
        duration,
        hasAudio,
        "720p"
      );
      const refundAmount = cost1080P - costBase;

      if (refundAmount <= 0) {
        console.log(
          `ℹ️ No refund needed for 1080P: cost1080P=${cost1080P}, costBase=${costBase}`
        );
        return;
      }

      console.log(
        `💰 计算1080P退款: 1080P费用=${cost1080P}, 基础费用=${costBase}, 退款=${refundAmount}`
      );

      // 从第一个池退款
      const firstPool = creditDeduction.pools[0];
      await increaseCredits({
        user_uuid: videoGeneration.user_id,
        trans_type: CreditsTransType.RefundVideoGenerationFailed,
        credits: refundAmount,
        order_no: firstPool.order_no,
        expired_at: firstPool.expired_at,
      });

      console.log(
        `✅ 1080P升级费用已退还: ${refundAmount} credits for video ${videoGeneration.id}`
      );
    } catch (refundError) {
      console.error("退还1080P升级费用失败:", refundError);
      // 退款失败不影响主流程
    }
  }

  /**
   * 构建升级相关的 metadata
   *
   * @param existingMetadata 现有 metadata
   * @param options 升级选项
   * @returns 更新后的 metadata
   */
  static buildUpscaleMetadata(
    existingMetadata: any,
    options: {
      type: "4k_processing" | "1080p_completed" | "1080p_failed" | "none";
      baseVideoUrl: string;
      baseR2Url?: string | null;
      video1080PUrl?: string | null;
    }
  ): any {
    const base = { ...existingMetadata };

    switch (options.type) {
      case "4k_processing":
        return {
          ...base,
          upscale_4k_status: "processing",
          base_video_url: options.baseVideoUrl,
          base_video_url_r2: options.baseR2Url || undefined,
        };

      case "1080p_completed":
        return {
          ...base,
          upscale_1080p_status: "completed",
          base_video_url: options.baseVideoUrl,
          base_video_url_r2: options.baseR2Url || undefined,
          video_url_1080p: options.video1080PUrl || undefined,
        };

      case "1080p_failed":
        return {
          ...base,
          upscale_1080p_status: "failed",
          base_video_url: options.baseVideoUrl,
          base_video_url_r2: options.baseR2Url || undefined,
        };

      case "none":
      default:
        return base;
    }
  }

  /**
   * 根据升级结果决定最终状态和视频 URL
   *
   * @param options 选项
   * @returns 最终状态和视频 URL
   */
  static determineFinalResult(options: {
    needs4KUpscale: boolean;
    needs1080PUpscale: boolean;
    upscale1080PResult?: Upscale1080PResult;
    baseR2Url?: string | null;
  }): {
    status: string;
    videoUrlR2?: string;
    responseMessage: string;
  } {
    const { needs4KUpscale, needs1080PUpscale, upscale1080PResult, baseR2Url } =
      options;

    if (needs4KUpscale) {
      // 4K: 状态保持 IN_PROGRESS，等待异步回调
      return {
        status: "IN_PROGRESS",
        // 不设置 video_url_r2，等4K完成后设置
        responseMessage: "视频生成完成，4K升级处理中",
      };
    }

    if (needs1080PUpscale) {
      // 1080P: 使用 1080P 视频（或降级到基础视频）
      const videoUrl = upscale1080PResult?.r2Url || baseR2Url || undefined;
      const isSuccess = upscale1080PResult?.success;

      return {
        status: baseR2Url || videoUrl ? "SAVED_TO_R2" : "COMPLETED",
        videoUrlR2: videoUrl,
        responseMessage: isSuccess
          ? "视频生成完成，1080P升级成功"
          : "视频生成完成，1080P升级失败，使用基础视频",
      };
    }

    // 720p 或其他：直接使用基础视频
    return {
      status: baseR2Url ? "SAVED_TO_R2" : "COMPLETED",
      videoUrlR2: baseR2Url || undefined,
      responseMessage: "视频生成完成并已保存",
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 上传视频到 R2
   */
  private static async uploadVideoToR2(
    videoUrl: string,
    videoGenerationId: string,
    suffix: string
  ): Promise<string | null> {
    try {
      const storage = newStorage();
      const fileName = `videos/${videoGenerationId}-${suffix}-${Date.now()}.mp4`;

      const uploadResult = await storage.downloadAndUpload({
        url: videoUrl,
        key: fileName,
        contentType: "video/mp4",
        cacheControl: VIDEO_CACHE_CONTROL,
      });

      console.log(`视频已上传到R2: ${uploadResult.url}`);
      return uploadResult.url ?? null;
    } catch (uploadError) {
      console.error(`视频R2上传失败 (${suffix}):`, uploadError);
      return null;
    }
  }
}

export default Veo3UpscaleService;
