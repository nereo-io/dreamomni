import { respData, respErr } from "@/lib/resp";
import {
  getVideoGenerationByFalRequestId,
  updateVideoGenerationByFalRequestId,
} from "@/models/videoGeneration";
import { newStorage } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const webhookData = await req.json();

    console.log("收到 fal.ai webhook 回调:", webhookData);

    // 验证 webhook 数据结构
    if (!webhookData.status || !webhookData.request_id) {
      return respErr("无效的 webhook 数据格式");
    }

    const {
      status,
      request_id,
      logs = [],
      metrics,
      error,
      payload,
    } = webhookData;

    // 查找对应的数据库记录
    const videoGeneration = await getVideoGenerationByFalRequestId(request_id);
    if (!videoGeneration) {
      console.warn(`未找到对应的视频生成记录: ${request_id}`);
      return respData({
        message: "记录未找到，但webhook已处理",
        request_id,
      });
    }

    // 处理不同的状态
    switch (status) {
      case "OK":
        console.log(`视频生成完成，请求ID: ${request_id}`);

        try {
          // 1. 获取视频URL
          const videoUrl = payload?.video?.url;
          if (!videoUrl) {
            throw new Error("响应中没有视频URL");
          }

          // 2. 上传到R2
          let r2VideoUrl = null;
          try {
            const storage = newStorage();
            const fileName = `videos/${videoGeneration.id}-${Date.now()}.mp4`;

            const uploadResult = await storage.downloadAndUpload({
              url: videoUrl,
              key: fileName,
              contentType: "video/mp4",
            });

            r2VideoUrl = uploadResult.url;
            console.log(`视频已上传到R2: ${r2VideoUrl}`);
          } catch (uploadError) {
            console.error("R2上传失败:", uploadError);
            // 即使R2上传失败，也要更新状态，但使用原始URL
          }

          // 3. 更新数据库
          await updateVideoGenerationByFalRequestId(request_id, {
            status: r2VideoUrl ? "SAVED_TO_R2" : "COMPLETED",
            video_url_fal: videoUrl,
            video_url_r2: r2VideoUrl || undefined,
            logs,
            metrics,
          });

          return respData({
            message: "视频生成完成并已保存",
            request_id,
            video_url: r2VideoUrl || videoUrl,
            r2_uploaded: !!r2VideoUrl,
            processing_time: metrics?.inference_time || null,
          });
        } catch (processError) {
          console.error("处理完成状态失败:", processError);

          // 更新为失败状态
          await updateVideoGenerationByFalRequestId(request_id, {
            status: "FAILED",
            error_message: `处理失败: ${
              processError instanceof Error
                ? processError.message
                : String(processError)
            }`,
            logs,
          });

          return respErr(
            `处理完成状态失败: ${
              processError instanceof Error
                ? processError.message
                : String(processError)
            }`
          );
        }

      case "ERROR":
        console.error(`视频生成失败，请求ID: ${request_id}，错误:`, error);

        await updateVideoGenerationByFalRequestId(request_id, {
          status: "FAILED",
          error_message: error || "未知错误",
          logs,
        });

        return respData({
          message: "视频生成失败",
          request_id,
          error: error || "未知错误",
        });

      case "IN_QUEUE":
        console.log(`任务在队列中，请求ID: ${request_id}`);

        await updateVideoGenerationByFalRequestId(request_id, {
          status: "IN_QUEUE",
          logs,
        });

        return respData({
          message: "任务在队列中等待",
          request_id,
          queue_position: webhookData.queue_position || null,
        });

      case "IN_PROGRESS":
        console.log(`视频生成进行中，请求ID: ${request_id}`);

        await updateVideoGenerationByFalRequestId(request_id, {
          status: "IN_PROGRESS",
          logs,
        });

        return respData({
          message: "视频生成进行中",
          request_id,
          progress: webhookData.progress || null,
        });

      default:
        console.log(`未知状态，请求ID: ${request_id}，状态: ${status}`);

        // 对于未知状态，仍然更新日志
        await updateVideoGenerationByFalRequestId(request_id, {
          logs,
        });

        return respData({
          message: "收到状态更新",
          request_id,
          status,
        });
    }
  } catch (error) {
    console.error("处理 webhook 失败:", error);

    let errorMessage = "处理 webhook 失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}

// 支持 GET 请求用于验证 webhook 端点
export async function GET() {
  return respData({
    message: "Webhook 端点正常运行",
    endpoint: "/api/video-generation/webhook",
    supported_methods: ["POST"],
    description: "处理来自 fal.ai 的视频生成状态回调",
    expected_statuses: ["IN_QUEUE", "IN_PROGRESS", "COMPLETED", "FAILED"],
  });
}
