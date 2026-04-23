import { getVideoModel, VideoModelProvider } from "@/config/video-models";
import { VIDEO_CACHE_CONTROL } from "@/lib/cache-control";
import { updateVideoGenerationById } from "@/models/videoGeneration";
import { getStatusProviderForFallback } from "@/services/seedanceFallbackService";

const STATUS_SYNC_MIN_INTERVAL_MS = 15000;

export interface VideoStatusResult {
  id: string;
  status: string;
  requestId: string | null;
  model: string;
  prompt: string;
  optimized_prompt?: string;
  video_url?: string;
  video_url_r2?: string;
  video_url_fal?: string;
  video_url_volcano?: string;
  video_url_veo3?: string;
  video_url_ali?: string;
  video_url_pixverse?: string;
  video_url_sora?: string;
  video_url_provider?: string;
  upsample_video_url_veo3?: string;
  video_url_4k?: string;
  video_url_4k_r2?: string;
  upscale_4k_status?: string;
  is_downgraded_to_720p?: boolean;
  error_message?: string;
  logs?: any[];
  metrics?: any;
  created_at: string;
  updated_at: string;
  aspect_ratio?: string;
  duration_seconds?: number;
  image_url?: string;
}

export class VideoStatusService {
  /**
   * 获取视频生成状态，包括从 provider 同步最新状态
   */
  static async getVideoStatus(
    videoGeneration: any
  ): Promise<VideoStatusResult> {
    console.log("从数据库获取的状态:", videoGeneration.status);

    // 如果状态不是最终状态，且有请求ID，则查询provider获取最新状态
    if (
      this.shouldUpdateFromProvider(videoGeneration) &&
      !this.isSyncCooldownActive(videoGeneration)
    ) {
      try {
        const updatedGeneration = await this.syncStatusFromProvider(
          videoGeneration
        );
        videoGeneration = updatedGeneration;
      } catch (error) {
        console.error("查询provider状态失败:", error);
        // 如果provider查询失败，仍然返回数据库中的状态
      }
    }

    return this.formatVideoStatusResult(videoGeneration);
  }

  /**
   * 判断是否需要从 provider 更新状态
   */
  private static shouldUpdateFromProvider(videoGeneration: any): boolean {
    const isNotFinalStatus = !["COMPLETED", "SAVED_TO_R2", "FAILED"].includes(
      videoGeneration.status
    );

    const hasRequestId = !!(
      videoGeneration.fal_request_id ||
      videoGeneration.volcano_request_id ||
      videoGeneration.veo3_request_id ||
      videoGeneration.ali_request_id ||
      videoGeneration.pixverse_request_id ||
      videoGeneration.sora_request_id ||
      videoGeneration.provider_request_id
    );

    // 如果正在进行分辨率升级（1080P/4K），不要从 provider 更新状态（由 webhook 处理）
    // 只有在 upscale_*_status === "processing" 时才阻止，这样标准视频生成期间可以正常显示进度
    const isUpscaleInProgress =
      videoGeneration.metadata?.upscale_4k_status === "processing" ||
      videoGeneration.metadata?.upscale_1080p_status === "processing";

    return isNotFinalStatus && hasRequestId && videoGeneration.model_id && !isUpscaleInProgress;
  }

  private static isSyncCooldownActive(videoGeneration: any): boolean {
    const lastSync = videoGeneration.metadata?.last_status_sync_at;
    if (!lastSync) {
      return false;
    }
    const lastSyncTime = Date.parse(lastSync);
    if (Number.isNaN(lastSyncTime)) {
      return false;
    }
    return Date.now() - lastSyncTime < STATUS_SYNC_MIN_INTERVAL_MS;
  }

  /**
   * 从 provider 同步最新状态
   */
  private static async syncStatusFromProvider(
    videoGeneration: any
  ): Promise<any> {
    const requestId = this.getRequestId(videoGeneration);
    if (!requestId) {
      throw new Error("No valid request ID found");
    }

    // Handle PixVerse requests separately (they don't use ProviderFactory)
    if (videoGeneration.pixverse_request_id) {
      const { PixVerseStatusService } = await import("./pixverseStatusService");
      return await PixVerseStatusService.syncPixVerseStatus(videoGeneration);
    }

    const modelConfig = getVideoModel(videoGeneration.model_id);
    if (!modelConfig) {
      throw new Error(`不支持的模型: ${videoGeneration.model_id}`);
    }

    // === Volcano 降级检查：根据 actual_provider 判断实际使用的 Provider ===
    const actualProvider = videoGeneration.actual_provider;
    const fallbackProvider = getStatusProviderForFallback(actualProvider);

    // === 通用降级检查：根据 metadata.fallback_model_id 获取降级模型的 Provider ===
    const fallbackModelId = videoGeneration.metadata?.fallback_model_id;
    const { ProviderFactory } = await import("@/services/providers");
    let provider;
    if (fallbackProvider) {
      provider = fallbackProvider;
    } else if (fallbackModelId) {
      provider = ProviderFactory.getProvider(fallbackModelId);
    } else {
      provider = ProviderFactory.getProvider(videoGeneration.model_id);
    }

    console.log(
      `使用provider查询状态: ${fallbackProvider ? "volcano (fallback)" : fallbackModelId ? `fallback (${fallbackModelId})` : modelConfig.provider}, requestId: ${requestId}`
    );

    const statusModelId = fallbackModelId || videoGeneration.model_id;
    const providerStatus = await provider.status(
      statusModelId,
      requestId
    );

    console.log("从provider获取的最新状态:", providerStatus.status);

    const nowIso = new Date().toISOString();
    const nextMetadata = {
      ...(videoGeneration.metadata || {}),
      last_status_sync_at: nowIso,
    };

    // 如果provider返回COMPLETED，但视频需要分辨率升级，不更新状态，等待webhook处理
    const { isKieAiVeo3Model } = await import("@/config/video-models");
    const needsResolutionUpgrade =
      isKieAiVeo3Model(videoGeneration.model_id) &&
      videoGeneration.metadata?.requested_resolution &&
      videoGeneration.metadata.requested_resolution !== "720p";

    if (providerStatus.status.toLowerCase() === "completed" && needsResolutionUpgrade) {
      console.log("🎬 视频需要分辨率升级，跳过COMPLETED状态同步，等待webhook处理");
      return await updateVideoGenerationById(videoGeneration.id, {
        metadata: nextMetadata,
      });
    }

    const mappedStatus = this.mapProviderStatusToDbStatus(
      providerStatus.status
    );

    // 如果provider状态有更新，更新数据库状态
    if (mappedStatus !== videoGeneration.status) {
      console.log(
        `状态更新: ${videoGeneration.status} -> ${providerStatus.status} -> ${mappedStatus}`
      );

      const updateParams = await this.buildUpdateParams(
        providerStatus,
        modelConfig,
        videoGeneration,
        requestId
      );

      updateParams.metadata = this.mergeMetadata(
        videoGeneration.metadata,
        updateParams.metadata,
        { last_status_sync_at: nowIso }
      );

      return await updateVideoGenerationById(videoGeneration.id, updateParams);
    } else {
      const updateParams: any = {
        metadata: nextMetadata,
      };
      if (providerStatus.logs) {
        updateParams.logs = providerStatus.logs;
      }
      if (providerStatus.metrics) {
        updateParams.metrics = providerStatus.metrics;
      }
      if (providerStatus.error_message) {
        updateParams.error_message = providerStatus.error_message;
      }

      return await updateVideoGenerationById(videoGeneration.id, updateParams);
    }
  }

  private static mergeMetadata(
    baseMetadata: any,
    updateMetadata: any,
    extraMetadata: any
  ) {
    return {
      ...(baseMetadata || {}),
      ...(updateMetadata || {}),
      ...(extraMetadata || {}),
    };
  }

  /**
   * 获取请求ID
   */
  private static getRequestId(videoGeneration: any): string | null {
    return (
      videoGeneration.fal_request_id ||
      videoGeneration.volcano_request_id ||
      videoGeneration.veo3_request_id ||
      videoGeneration.ali_request_id ||
      videoGeneration.pixverse_request_id ||
      videoGeneration.sora_request_id ||
      videoGeneration.provider_request_id
    );
  }

  /**
   * 映射 provider 状态到数据库状态
   */
  private static mapProviderStatusToDbStatus(providerStatus: string): string {
    switch (providerStatus.toLowerCase()) {
      case "completed":
        return "COMPLETED";
      case "failed":
        return "FAILED";
      case "in_progress":
        return "IN_PROGRESS";
      case "in_queue":
        return "IN_QUEUE";
      case "submitted":
        return "submitted";
      default:
        return providerStatus;
    }
  }

  /**
   * 构建更新参数
   */
  private static async buildUpdateParams(
    providerStatus: any,
    modelConfig: any,
    videoGeneration: any,
    requestId: string
  ): Promise<any> {
    const updateParams: any = {
      status: this.mapProviderStatusToDbStatus(providerStatus.status),
    };

    // 如果有 logs，更新 logs
    if (providerStatus.logs && Array.isArray(providerStatus.logs)) {
      updateParams.logs = providerStatus.logs;
    }

    // 如果有 metrics，更新 metrics
    if (providerStatus.metrics) {
      updateParams.metrics = providerStatus.metrics;
    }

    // 如果有错误信息，更新 error_message
    if (providerStatus.error_message) {
      updateParams.error_message = providerStatus.error_message;
    }

    // 如果任务完成，尝试获取结果
    if (providerStatus.status.toLowerCase() === "completed") {
      await this.handleCompletedStatus(
        updateParams,
        modelConfig,
        videoGeneration,
        requestId
      );
    }

    // 如果任务失败，记录详细错误信息
    if (providerStatus.status.toLowerCase() === "failed") {
      await this.handleFailedStatus(updateParams, providerStatus);
    }

    // 如果任务失败，记录详细错误信息
    if (providerStatus.status.toLowerCase() === "failed") {
      await this.handleFailedStatus(updateParams, providerStatus);
    }

    return updateParams;
  }

  /**
   * 处理失败状态
   */
  private static async handleFailedStatus(
    updateParams: any,
    providerStatus: any
  ): Promise<void> {
    console.log("处理失败状态，提取错误信息");

    // 从 raw_data 中提取更详细的错误信息
    if (providerStatus.raw_data) {
      const rawData = providerStatus.raw_data;
      // 优先使用 errorMessage，然后是 errorCode
      if (rawData.errorMessage) {
        updateParams.error_message = rawData.errorMessage;
      } else if (rawData.errorCode) {
        updateParams.error_message = `错误代码: ${rawData.errorCode}`;
      }

      // 如果有额外的错误详情，添加到 logs 中
      if (rawData.errorCode || rawData.errorMessage) {
        const errorLog = {
          timestamp: new Date().toISOString(),
          level: "ERROR",
          message: rawData.errorMessage || `Error code: ${rawData.errorCode}`,
          errorCode: rawData.errorCode,
          provider: "KieAI",
        };
        updateParams.logs = updateParams.logs || [];
        updateParams.logs.push(errorLog);
      }
    }

    console.log("失败状态处理完成，错误信息:", updateParams.error_message);
  }

  /**
   * 处理完成状态
   */
  private static async handleCompletedStatus(
    updateParams: any,
    modelConfig: any,
    videoGeneration: any,
    requestId: string
  ): Promise<void> {
    try {
      // === Volcano 降级检查：根据 actual_provider 判断实际使用的 Provider ===
      const actualProvider = videoGeneration.actual_provider;
      const fallbackProvider = getStatusProviderForFallback(actualProvider);

      // === 通用降级检查：根据 metadata.fallback_model_id 获取降级模型的 Provider ===
      const fallbackModelId = videoGeneration.metadata?.fallback_model_id;

      const { ProviderFactory } = await import("@/services/providers");
      let provider;
      if (fallbackProvider) {
        provider = fallbackProvider;
      } else if (fallbackModelId) {
        provider = ProviderFactory.getProvider(fallbackModelId);
      } else {
        provider = ProviderFactory.getProvider(videoGeneration.model_id);
      }
      const resultModelId = fallbackModelId || videoGeneration.model_id;
      const result = await provider.result(resultModelId, requestId);

      console.log("获取到生成结果:", result);

      const hasVideoData =
        result && (result.video_url || (result as any).upsample_video_url);

      // 降级场景下（如 Volcano→Evolink），modelConfig.provider 是原始 provider，
      // 实际生成方是 actual_provider，字段归属和 R2 上传都应按实际 provider 判断。
      const effectiveProvider = (actualProvider ||
        modelConfig.provider) as VideoModelProvider;

      if (hasVideoData) {
        this.setVideoUrlByProvider(
          updateParams,
          effectiveProvider,
          result,
          videoGeneration.model_id
        );

        // 如果result包含seed信息，也更新
        if ((result as any).data?.seed) {
          updateParams.seed = (result as any).data.seed;
        }

        // 对于 APICore Veo3，尝试上传到 R2
        if (effectiveProvider === VideoModelProvider.APICORE) {
          await this.uploadToR2ForApiCore(
            updateParams,
            result,
            videoGeneration
          );
        }

        // 对于 KieAI 模型，也可以尝试上传到 R2（可选）
        if (effectiveProvider === VideoModelProvider.KIEAI) {
          await this.uploadToR2ForKieAi(updateParams, result, videoGeneration);
        }

        // 对于 ALI，上传到 R2
        if (effectiveProvider === VideoModelProvider.ALI) {
          await this.uploadToR2ForAli(updateParams, result, videoGeneration);
        }

        // 对于 EVOLINK（含 Seedance 降级场景），上传到 R2
        if (effectiveProvider === VideoModelProvider.EVOLINK && result.video_url) {
          await this.uploadToR2(updateParams, result.video_url, videoGeneration, "Evolink");
        }
      } else {
        console.error("获取结果成功但数据为空:", result);
        updateParams.status = "FAILED";
        updateParams.error_message =
          "Video generation completed but no result data available";
      }
    } catch (resultError) {
      console.error("获取结果失败:", resultError);
      updateParams.status = "FAILED";
      updateParams.error_message = this.getErrorMessage(resultError);
    }
  }

  /**
   * 根据 provider 设置视频URL
   */
  private static setVideoUrlByProvider(
    updateParams: any,
    provider: VideoModelProvider,
    result: any,
    modelIdFromGeneration?: string
  ): void {
    const { isSora2Model, isKieAiVeo3Model } = require("@/config/video-models");
    const resolvedModelId =
      modelIdFromGeneration ||
      result.model ||
      result.data?.model ||
      "";

    switch (provider) {
      case VideoModelProvider.VOLCANO:
      case VideoModelProvider.BYTEPLUS:
        // BytePlus 和 Volcano 使用相同的字段
        updateParams.video_url_volcano = result.video_url;
        break;
      case VideoModelProvider.FAL:
        updateParams.video_url_fal = result.video_url;
        break;
      case VideoModelProvider.APICORE:
        if (result.video_url) {
          updateParams.video_url_veo3 = result.video_url;
        }
        if ((result as any).upsample_video_url) {
          updateParams.upsample_video_url_veo3 = (
            result as any
          ).upsample_video_url;
        }
        break;
      case VideoModelProvider.KIEAI:
        // Check if it's a Sora model based on model id from provider or DB
        if (resolvedModelId && isSora2Model(resolvedModelId)) {
          // Sora 2 使用专用字段
          if (result.video_url) {
            updateParams.video_url_sora = result.video_url;
          }
        } else if (resolvedModelId && isKieAiVeo3Model(resolvedModelId)) {
          // Veo3 使用原有字段
          if (result.video_url) {
            updateParams.video_url_veo3 = result.video_url;
          }
          if (result.hd_video_url) {
            updateParams.upsample_video_url_veo3 = result.hd_video_url;
          }
        } else {
          // Kling/Hailuo/Wan 等新模型仅走通用字段 video_url_provider
        }
        break;
      case VideoModelProvider.ALI:
        updateParams.video_url_ali = result.video_url;
        break;
      case VideoModelProvider.EVOLINK:
        // Evolink Sora 使用 video_url_sora 字段，Seedance 2.0 仅走通用 video_url_provider
        if (result.video_url && resolvedModelId && isSora2Model(resolvedModelId)) {
          updateParams.video_url_sora = result.video_url;
        }
        break;
      default:
        // Unknown provider — use generic field only
        if (result.video_url) {
          updateParams.video_url_provider = result.video_url;
        }
        break;
    }

    // Always set generic video_url_provider for uniform access
    if (result.video_url) {
      updateParams.video_url_provider = result.video_url;
    }
  }

  /**
   * 为 APICore 上传视频到 R2
   */
  private static async uploadToR2ForApiCore(
    updateParams: any,
    result: any,
    videoGeneration: any
  ): Promise<void> {
    try {
      console.log("开始为 APICore Veo3 上传视频到 R2");
      const { newStorage } = await import("@/lib/storage");
      const storage = newStorage();

      const videoToUpload =
        (result as any).upsample_video_url || result.video_url;
      const isUpsample = !!(result as any).upsample_video_url;
      const fileName = `videos/${videoGeneration.id}-${Date.now()}${
        isUpsample ? "-upsample" : ""
      }.mp4`;

      console.log(
        `上传${
          isUpsample ? "高质量upsample" : "原始"
        }视频到 R2: ${videoToUpload}`
      );

      const uploadResult = await storage.downloadAndUpload({
        url: videoToUpload,
        key: fileName,
        contentType: "video/mp4",
        cacheControl: VIDEO_CACHE_CONTROL,
      });

      if (uploadResult?.url) {
        updateParams.video_url_r2 = uploadResult.url;
        updateParams.status = "SAVED_TO_R2";
        console.log(
          `APICore Veo3 ${isUpsample ? "高质量" : "原始"}视频已上传到R2: ${
            uploadResult.url
          }`
        );
      }
    } catch (r2Error) {
      console.error("APICore Veo3 R2上传失败:", r2Error);
      // R2上传失败不影响主流程，状态仍为COMPLETED
    }
  }

  /**
   * 为 KieAI 上传视频到 R2
   */
  private static async uploadToR2ForKieAi(
    updateParams: any,
    result: any,
    videoGeneration: any
  ): Promise<void> {
    try {
      console.log("开始为 KieAI 上传视频到 R2");
      const { newStorage } = await import("@/lib/storage");
      const storage = newStorage();

      // For KieAI: prioritize hd_video_url (1080P) over video_url (standard)
      const videoToUpload = result.hd_video_url || result.video_url;
      const isHD = !!result.hd_video_url;
      const fileName = `videos/${videoGeneration.id}-${Date.now()}${
        isHD ? "-hd" : ""
      }.mp4`;

      console.log(
        `上传${isHD ? "高清1080P" : "标准"}视频到 R2: ${videoToUpload}`
      );

      const uploadResult = await storage.downloadAndUpload({
        url: videoToUpload,
        key: fileName,
        contentType: "video/mp4",
        cacheControl: VIDEO_CACHE_CONTROL,
      });

      if (uploadResult?.url) {
        updateParams.video_url_r2 = uploadResult.url;
        updateParams.status = "SAVED_TO_R2";
        console.log(
          `KieAI ${isHD ? "高清1080P" : "标准"}视频已上传到R2: ${
            uploadResult.url
          }`
        );
      }
    } catch (r2Error) {
      console.error("KieAI R2上传失败:", r2Error);
      // R2上传失败不影响主流程，状态仍为COMPLETED
    }
  }

  /**
   * 为 ALI 上传视频到 R2
   */
  private static async uploadToR2ForAli(
    updateParams: any,
    result: any,
    videoGeneration: any
  ): Promise<void> {
    try {
      console.log("开始为阿里百炼上传视频到 R2");
      const { newStorage } = await import("@/lib/storage");
      const storage = newStorage();

      const videoToUpload = result.video_url;
      const fileName = `videos/${videoGeneration.id}-${Date.now()}.mp4`;

      console.log(`上传阿里百炼视频到 R2: ${videoToUpload}`);

      const uploadResult = await storage.downloadAndUpload({
        url: videoToUpload,
        key: fileName,
        contentType: "video/mp4",
        cacheControl: VIDEO_CACHE_CONTROL,
      });

      if (uploadResult?.url) {
        updateParams.video_url_r2 = uploadResult.url;
        updateParams.status = "SAVED_TO_R2";
        console.log(`阿里百炼视频已上传到R2: ${uploadResult.url}`);
      }
    } catch (r2Error) {
      console.error("阿里百炼 R2上传失败:", r2Error);
      // R2上传失败不影响主流程，状态仍为COMPLETED
    }
  }

  /**
   * 通用 R2 上传（适用于只需上传 video_url 的 provider）
   */
  private static async uploadToR2(
    updateParams: any,
    videoUrl: string,
    videoGeneration: any,
    label: string
  ): Promise<void> {
    try {
      console.log(`开始为 ${label} 上传视频到 R2`);
      const { newStorage } = await import("@/lib/storage");
      const storage = newStorage();

      const fileName = `videos/${videoGeneration.id}-${Date.now()}.mp4`;

      const uploadResult = await storage.downloadAndUpload({
        url: videoUrl,
        key: fileName,
        contentType: "video/mp4",
        cacheControl: VIDEO_CACHE_CONTROL,
      });

      if (uploadResult?.url) {
        updateParams.video_url_r2 = uploadResult.url;
        updateParams.status = "SAVED_TO_R2";
        console.log(`${label} 视频已上传到R2: ${uploadResult.url}`);
      }
    } catch (r2Error) {
      console.error(`${label} R2上传失败:`, r2Error);
    }
  }

  /**
   * 获取错误信息
   */
  private static getErrorMessage(error: any): string {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("Unprocessable Entity") ||
      errorMessage.includes("422") ||
      errorMessage.toLowerCase().includes("unprocessable")
    ) {
      return "There's an issue with your input or settings. Please check and try again.";
    }

    return "Failed to retrieve video result. Please try again.";
  }

  /**
   * 格式化返回结果
   */
  private static formatVideoStatusResult(
    videoGeneration: any
  ): VideoStatusResult {
    // 从 metadata 中提取 4K 相关信息
    const metadata = videoGeneration.metadata || {};
    const video_url_4k = metadata.video_url_4k;
    const video_url_4k_r2 = metadata.video_url_4k_r2;
    const upscale_4k_status = metadata.upscale_4k_status;
    const upscale_1080p_status = metadata.upscale_1080p_status;
    const requested_resolution = metadata.requested_resolution;

    // Determine if video was downgraded to 720p
    // User requested 1080p or 4k, but upscale failed
    const is_downgraded_to_720p =
      (requested_resolution === "1080p" && upscale_1080p_status === "failed") ||
      (requested_resolution === "4k" && upscale_4k_status === "failed");

    // 确定最佳视频 URL（优先使用 4K R2 URL）
    const bestVideoUrl =
      video_url_4k_r2 ||
      video_url_4k ||
      videoGeneration.video_url_r2 ||
      videoGeneration.upsample_video_url_veo3 ||
      videoGeneration.video_url_veo3 ||
      videoGeneration.video_url_sora ||
      videoGeneration.video_url_pixverse ||
      videoGeneration.video_url_volcano ||
      videoGeneration.video_url_ali ||
      videoGeneration.video_url_provider ||
      videoGeneration.video_url_fal;

    return {
      id: videoGeneration.id,
      status: videoGeneration.status,
      requestId:
        videoGeneration.fal_request_id ||
        videoGeneration.volcano_request_id ||
        videoGeneration.veo3_request_id ||
        videoGeneration.ali_request_id ||
        videoGeneration.pixverse_request_id ||
        videoGeneration.sora_request_id ||
        videoGeneration.provider_request_id,
      model: videoGeneration.model_id,
      prompt: videoGeneration.prompt,
      optimized_prompt: videoGeneration.optimized_prompt,
      video_url: bestVideoUrl,
      video_url_r2: videoGeneration.video_url_r2,
      video_url_fal: videoGeneration.video_url_fal,
      video_url_volcano: videoGeneration.video_url_volcano,
      video_url_veo3: videoGeneration.video_url_veo3,
      video_url_sora: videoGeneration.video_url_sora,
      video_url_provider: videoGeneration.video_url_provider,
      video_url_ali: videoGeneration.video_url_ali,
      video_url_pixverse: videoGeneration.video_url_pixverse,
      upsample_video_url_veo3: videoGeneration.upsample_video_url_veo3,
      video_url_4k,
      video_url_4k_r2,
      upscale_4k_status,
      is_downgraded_to_720p,
      error_message: videoGeneration.error_message,
      logs: videoGeneration.logs || [],
      metrics: videoGeneration.metrics,
      created_at: videoGeneration.created_at,
      updated_at: videoGeneration.updated_at,
      aspect_ratio: videoGeneration.aspect_ratio,
      duration_seconds: videoGeneration.duration_seconds,
      image_url: videoGeneration.input_image_url,
    };
  }
}
