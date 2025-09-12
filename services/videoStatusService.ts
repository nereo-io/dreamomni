import { getVideoModel, VideoModelProvider } from "@/config/video-models";
import { updateVideoGenerationById } from "@/models/videoGeneration";

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
  upsample_video_url_veo3?: string;
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
    if (this.shouldUpdateFromProvider(videoGeneration)) {
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
      videoGeneration.pixverse_request_id
    );

    return isNotFinalStatus && hasRequestId && videoGeneration.model_id;
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

    console.log(
      `使用provider查询状态: ${modelConfig.provider}, requestId: ${requestId}`
    );
    const { ProviderFactory } = await import("@/services/providers");
    const provider = ProviderFactory.getProvider(videoGeneration.model_id);
    const providerStatus = await provider.status(
      videoGeneration.model_id,
      requestId
    );

    console.log("从provider获取的最新状态:", providerStatus.status);

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

      return await updateVideoGenerationById(videoGeneration.id, updateParams);
    } else {
      // 如果状态没有变化，但可能有新的logs，也合并一下
      if (providerStatus.logs) {
        return {
          ...videoGeneration,
          logs: providerStatus.logs,
        };
      }
    }

    return videoGeneration;
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
      videoGeneration.pixverse_request_id
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
<<<<<<< HEAD
    
    // 从 raw_data 中提取更详细的错误信息
    if (providerStatus.raw_data) {
      const rawData = providerStatus.raw_data;
      
=======

    // 从 raw_data 中提取更详细的错误信息
    if (providerStatus.raw_data) {
      const rawData = providerStatus.raw_data;

>>>>>>> upstream/main
      // 优先使用 errorMessage，然后是 errorCode
      if (rawData.errorMessage) {
        updateParams.error_message = rawData.errorMessage;
      } else if (rawData.errorCode) {
        updateParams.error_message = `错误代码: ${rawData.errorCode}`;
      }
<<<<<<< HEAD
      
=======

>>>>>>> upstream/main
      // 如果有额外的错误详情，添加到 logs 中
      if (rawData.errorCode || rawData.errorMessage) {
        const errorLog = {
          timestamp: new Date().toISOString(),
          level: "ERROR",
          message: rawData.errorMessage || `Error code: ${rawData.errorCode}`,
          errorCode: rawData.errorCode,
<<<<<<< HEAD
          provider: "KieAI"
        };
        
=======
          provider: "KieAI",
        };

>>>>>>> upstream/main
        updateParams.logs = updateParams.logs || [];
        updateParams.logs.push(errorLog);
      }
    }
<<<<<<< HEAD
    
=======

>>>>>>> upstream/main
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
      const { ProviderFactory } = await import("@/services/providers");
<<<<<<< HEAD
    const provider = ProviderFactory.getProvider(videoGeneration.model_id);
=======
      const provider = ProviderFactory.getProvider(videoGeneration.model_id);
>>>>>>> upstream/main
      const result = await provider.result(videoGeneration.model_id, requestId);

      console.log("获取到生成结果:", result);

      const hasVideoData =
        result && (result.video_url || (result as any).upsample_video_url);

      if (hasVideoData) {
        this.setVideoUrlByProvider(updateParams, modelConfig.provider, result);

        // 如果result包含seed信息，也更新
        if ((result as any).data?.seed) {
          updateParams.seed = (result as any).data.seed;
        }

        // 对于 APICore Veo3，尝试上传到 R2
        if (modelConfig.provider === VideoModelProvider.APICORE) {
          await this.uploadToR2ForApiCore(
            updateParams,
            result,
            videoGeneration
          );
        }

        // 对于 KieAI Veo3，也可以尝试上传到 R2（可选）
        if (modelConfig.provider === VideoModelProvider.KIEAI) {
          await this.uploadToR2ForKieAi(updateParams, result, videoGeneration);
        }

        // 对于 ALI，上传到 R2
        if (modelConfig.provider === VideoModelProvider.ALI) {
          await this.uploadToR2ForAli(updateParams, result, videoGeneration);
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
    result: any
  ): void {
    switch (provider) {
      case VideoModelProvider.VOLCANO:
        updateParams.video_url_volcano = result.video_url;
        break;
      case VideoModelProvider.FAL:
        updateParams.video_url_fal = result.video_url;
        break;
      case VideoModelProvider.APICORE:
      case VideoModelProvider.KIEAI:
        if (result.video_url) {
          updateParams.video_url_veo3 = result.video_url;
        }
        // For KieAI: map hd_video_url to upsample_video_url_veo3
        // For APICore: map upsample_video_url to upsample_video_url_veo3
        if (result.hd_video_url) {
          updateParams.upsample_video_url_veo3 = result.hd_video_url;
        } else if ((result as any).upsample_video_url) {
          updateParams.upsample_video_url_veo3 = (
            result as any
          ).upsample_video_url;
        }
        break;
      case VideoModelProvider.ALI:
        updateParams.video_url_ali = result.video_url;
        break;
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
      console.log("开始为 KieAI Veo3 上传视频到 R2");
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
      });

      if (uploadResult?.url) {
        updateParams.video_url_r2 = uploadResult.url;
        updateParams.status = "SAVED_TO_R2";
        console.log(
          `KieAI Veo3 ${isHD ? "高清1080P" : "标准"}视频已上传到R2: ${
            uploadResult.url
          }`
        );
      }
    } catch (r2Error) {
      console.error("KieAI Veo3 R2上传失败:", r2Error);
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
    return {
      id: videoGeneration.id,
      status: videoGeneration.status,
      requestId:
        videoGeneration.fal_request_id ||
        videoGeneration.volcano_request_id ||
        videoGeneration.veo3_request_id ||
        videoGeneration.ali_request_id ||
        videoGeneration.pixverse_request_id,
      model: videoGeneration.model_id,
      prompt: videoGeneration.prompt,
      optimized_prompt: videoGeneration.optimized_prompt,
      video_url:
        videoGeneration.video_url_r2 ||
        videoGeneration.upsample_video_url_veo3 ||
        videoGeneration.video_url_veo3 ||
        videoGeneration.video_url_pixverse ||
        videoGeneration.video_url_volcano ||
        videoGeneration.video_url_ali ||
        videoGeneration.video_url_fal,
      video_url_r2: videoGeneration.video_url_r2,
      video_url_fal: videoGeneration.video_url_fal,
      video_url_volcano: videoGeneration.video_url_volcano,
      video_url_veo3: videoGeneration.video_url_veo3,
      video_url_ali: videoGeneration.video_url_ali,
      video_url_pixverse: videoGeneration.video_url_pixverse,
      upsample_video_url_veo3: videoGeneration.upsample_video_url_veo3,
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
