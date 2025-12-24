import { VIDEO_CACHE_CONTROL } from "@/lib/cache-control";
import { updateVideoGenerationById } from "@/models/videoGeneration";

/**
 * PixVerse 状态查询服务
 */
export class PixVerseStatusService {
  /**
   * 同步 PixVerse 视频生成状态
   */
  static async syncPixVerseStatus(videoGeneration: any): Promise<any> {
    const pixverseRequestId = videoGeneration.pixverse_request_id;
    if (!pixverseRequestId) {
      throw new Error("No PixVerse request ID found");
    }

    console.log(`查询 PixVerse 状态, requestId: ${pixverseRequestId}`);

    try {
      // 调用 PixVerse 状态查询 API
      const PIXVERSE_API_KEY = process.env.PIXVERSE_API_KEY;
      const response = await fetch(
        `https://app-api.pixverse.ai/openapi/v2/video/result/${pixverseRequestId}`,
        {
          headers: {
            "API-KEY": PIXVERSE_API_KEY!,
            "Ai-trace-id": `veo3-status-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`PixVerse status query failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.ErrCode !== 0) {
        const errorMessage = result.ErrMsg || "Unknown error";
        console.error(
          `PixVerse API error (ErrCode: ${result.ErrCode}):`,
          errorMessage
        );
        throw new Error(errorMessage);
      }

      const pixverseData = result.Resp;
      const currentStatus = pixverseData.status;

      console.log("从 PixVerse 获取的最新状态:", currentStatus);

      const mappedStatus = this.mapPixVerseStatusToDbStatus(currentStatus);

      console.log(
        `PixVerse 当前状态: ${videoGeneration.status} -> ${currentStatus} -> ${mappedStatus}`
      );

      const updateParams: any = {
        status: mappedStatus,
      };

      let shouldUpdate = false;

      // 状态发生变化时需要更新
      if (mappedStatus !== videoGeneration.status) {
        shouldUpdate = true;
        console.log(`状态变化，需要更新数据库`);
      }

      // 如果完成，添加视频URL
      if (currentStatus === 1 && pixverseData.url) {
        updateParams.video_url_pixverse = pixverseData.url;
        updateParams.video_url_veo3 = pixverseData.url; // 兼容性

        // 如果视频URL还没有被保存，需要更新
        if (!videoGeneration.video_url_pixverse || videoGeneration.video_url_pixverse !== pixverseData.url) {
          shouldUpdate = true;
          console.log(`视频URL需要更新: ${pixverseData.url}`);
        }

        // 尝试上传到 R2
        if (!videoGeneration.video_url_r2) {
          try {
            console.log("开始为 PixVerse 上传视频到 R2");
            const { newStorage } = await import("@/lib/storage");
            const storage = newStorage();

            const fileName = `videos/${videoGeneration.id}-${Date.now()}-pixverse.mp4`;
            const uploadResult = await storage.downloadAndUpload({
              url: pixverseData.url,
              key: fileName,
              contentType: "video/mp4",
              cacheControl: VIDEO_CACHE_CONTROL,
            });

            if (uploadResult?.url) {
              updateParams.video_url_r2 = uploadResult.url;
              updateParams.status = "SAVED_TO_R2";
              shouldUpdate = true;
              console.log(`PixVerse 视频已上传到R2: ${uploadResult.url}`);
            }
          } catch (r2Error) {
            console.error("PixVerse R2上传失败:", r2Error);
          }
        }
      }

      // 如果失败，添加错误信息
      if ([6, 7, 8].includes(currentStatus)) {
        const errorMessages = {
          6: "Video was deleted",
          7: "Content moderation failed",
          8: "Video generation failed",
        };
        const errorMessage = errorMessages[currentStatus as keyof typeof errorMessages] || "Generation failed";
        updateParams.error_message = errorMessage;
        
        if (videoGeneration.error_message !== errorMessage) {
          shouldUpdate = true;
          console.log(`错误信息需要更新: ${errorMessage}`);
        }
      }

      // 只有需要更新时才写入数据库
      if (shouldUpdate) {
        console.log("更新数据库记录:", updateParams);
        return await updateVideoGenerationById(videoGeneration.id, updateParams);
      } else {
        console.log("状态无变化，不需要更新数据库");
      }

      return videoGeneration;
    } catch (error) {
      console.error("PixVerse 状态查询失败:", error);
      throw error;
    }
  }

  /**
   * 映射 PixVerse 状态码到数据库状态
   */
  private static mapPixVerseStatusToDbStatus(pixverseStatus: number): string {
    switch (pixverseStatus) {
      case 1:
        return "COMPLETED";
      case 5:
        return "IN_PROGRESS";
      case 6:
      case 7:
      case 8:
        return "FAILED";
      default:
        return "IN_PROGRESS";
    }
  }
}
