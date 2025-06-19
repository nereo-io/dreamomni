import { respData, respErr } from "@/lib/resp";
import {
  getVideoGenerationByFalRequestId,
  updateVideoGenerationByFalRequestId,
  getVideoGenerationByVolcanoRequestId,
  updateVideoGenerationByVolcanoRequestId,
} from "@/models/videoGeneration";
import { newStorage } from "@/lib/storage";
import { getVideoModel, VideoModelProvider } from "@/config/video-models";

export async function POST(req: Request) {
  try {
    const webhookData = await req.json();

    console.log("收到 webhook 回调:", webhookData);

    // 确定webhook类型和数据结构
    let request_id: string;
    let status: string;
    let logs: any[] = [];
    let metrics: any = {};
    let error: string | null = null;
    let payload: any = null;
    let isVolcanoWebhook = false;

    // 尝试识别是fal.ai还是Volcano Engine的webhook
    if (webhookData.request_id) {
      // fal.ai format
      request_id = webhookData.request_id;
      status = webhookData.status;
      logs = webhookData.logs || [];
      metrics = webhookData.metrics || {};
      error = webhookData.error;
      payload = webhookData.payload;
    } else if (webhookData.id || webhookData.task_id) {
      // Volcano Engine format (基于API文档)
      isVolcanoWebhook = true;
      request_id = webhookData.id || webhookData.task_id;

      // 映射Volcano状态到标准状态
      switch (webhookData.status) {
        case "queued":
          status = "IN_QUEUE";
          break;
        case "running":
          status = "IN_PROGRESS";
          break;
        case "succeeded":
          status = "OK"; // 使用 "OK" 以便与下面的 switch 语句兼容
          break;
        case "failed":
          status = "ERROR";
          break;
        case "cancelled":
          status = "CANCELLED";
          break;
        default:
          status = webhookData.status;
      }

      // Volcano的payload结构不同
      if (webhookData.content?.video_url) {
        payload = {
          video: {
            url: webhookData.content.video_url,
          },
        };
      }

      if (webhookData.error) {
        error = webhookData.error.message || webhookData.error;
      }
    } else {
      return respErr("无效的 webhook 数据格式");
    }

    // 查找对应的数据库记录 - 简化查找逻辑
    let videoGeneration = await getVideoGenerationByFalRequestId(request_id);

    if (!videoGeneration) {
      // 尝试按volcano_request_id查找
      videoGeneration = await getVideoGenerationByVolcanoRequestId(request_id);
    }

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
          const maxRetries = 3;
          let lastError = null;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const storage = newStorage();
              const fileName = `videos/${videoGeneration.id}-${Date.now()}.mp4`;

              console.log(`尝试上传到R2 (第${attempt}次/${maxRetries}次)`);

              const uploadResult = await storage.downloadAndUpload({
                url: videoUrl,
                key: fileName,
                contentType: "video/mp4",
              });

              r2VideoUrl = uploadResult.url;
              console.log(`视频已上传到R2: ${r2VideoUrl}`);
              break; // 上传成功，跳出循环
            } catch (uploadError) {
              lastError = uploadError;
              console.error(
                `R2上传失败 (第${attempt}次/${maxRetries}次):`,
                uploadError
              );

              // 如果不是最后一次尝试，等待一段时间后重试
              if (attempt < maxRetries) {
                const delay = attempt * 1000; // 递增延迟: 1s, 2s, 3s
                console.log(`等待 ${delay}ms 后重试...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
              }
            }
          }

          // 如果所有重试都失败了
          if (!r2VideoUrl && lastError) {
            console.error(`R2上传最终失败，已重试${maxRetries}次:`, lastError);
            // 即使R2上传失败，也要更新状态，但使用原始URL
          }

          // 3. 更新数据库
          const updateParams: any = {
            status: r2VideoUrl ? "SAVED_TO_R2" : "COMPLETED",
            video_url_r2: r2VideoUrl || undefined,
            logs,
            metrics,
          };

          // 根据provider类型设置对应的video URL字段
          const modelConfig = getVideoModel(videoGeneration.model_id);
          if (modelConfig?.provider === VideoModelProvider.VOLCANO) {
            updateParams.video_url_volcano = videoUrl;
          } else if (modelConfig?.provider === VideoModelProvider.FAL) {
            updateParams.video_url_fal = videoUrl;
          }

          // 使用合适的更新函数
          if (videoGeneration.volcano_request_id) {
            await updateVideoGenerationByVolcanoRequestId(
              request_id,
              updateParams
            );
          } else if (videoGeneration.fal_request_id) {
            await updateVideoGenerationByFalRequestId(request_id, updateParams);
          } else {
            console.error("No valid request ID field found for update");
            throw new Error("No valid request ID field found for update");
          }

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
          const failureParams = {
            status: "FAILED" as const,
            error_message: `处理失败: ${
              processError instanceof Error
                ? processError.message
                : String(processError)
            }`,
            logs,
          };

          // 使用合适的更新函数
          if (videoGeneration.volcano_request_id) {
            await updateVideoGenerationByVolcanoRequestId(
              request_id,
              failureParams
            );
          } else if (videoGeneration.fal_request_id) {
            await updateVideoGenerationByFalRequestId(
              request_id,
              failureParams
            );
          }

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

        const errorParams = {
          status: "FAILED" as const,
          error_message: error || "未知错误",
          logs,
        };

        // 使用合适的更新函数
        if (videoGeneration.volcano_request_id) {
          await updateVideoGenerationByVolcanoRequestId(
            request_id,
            errorParams
          );
        } else if (videoGeneration.fal_request_id) {
          await updateVideoGenerationByFalRequestId(request_id, errorParams);
        }

        return respData({
          message: "视频生成失败",
          request_id,
          error: error || "未知错误",
        });

      case "IN_QUEUE":
        console.log(`任务在队列中，请求ID: ${request_id}`);

        const queueParams = {
          status: "IN_QUEUE" as const,
          logs,
        };

        // 使用合适的更新函数
        if (videoGeneration.volcano_request_id) {
          await updateVideoGenerationByVolcanoRequestId(
            request_id,
            queueParams
          );
        } else if (videoGeneration.fal_request_id) {
          await updateVideoGenerationByFalRequestId(request_id, queueParams);
        }

        return respData({
          message: "任务在队列中等待",
          request_id,
          queue_position: webhookData.queue_position || null,
        });

      case "IN_PROGRESS":
        console.log(`视频生成进行中，请求ID: ${request_id}`);

        const progressParams = {
          status: "IN_PROGRESS" as const,
          logs,
        };

        // 使用合适的更新函数
        if (videoGeneration.volcano_request_id) {
          await updateVideoGenerationByVolcanoRequestId(
            request_id,
            progressParams
          );
        } else if (videoGeneration.fal_request_id) {
          await updateVideoGenerationByFalRequestId(request_id, progressParams);
        }

        return respData({
          message: "视频生成进行中",
          request_id,
          progress: webhookData.progress || null,
        });

      default:
        console.log(`未知状态，请求ID: ${request_id}，状态: ${status}`);

        // 对于未知状态，仍然更新日志
        const unknownParams = { logs };

        // 使用合适的更新函数
        if (videoGeneration.volcano_request_id) {
          await updateVideoGenerationByVolcanoRequestId(
            request_id,
            unknownParams
          );
        } else if (videoGeneration.fal_request_id) {
          await updateVideoGenerationByFalRequestId(request_id, unknownParams);
        }

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
