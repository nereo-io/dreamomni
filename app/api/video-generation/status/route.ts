import { fal } from "@fal-ai/client";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import {
  getVideoGenerationById,
  getVideoGenerationByFalRequestId,
} from "@/models/videoGeneration";
import { getVideoModel } from "@/config/video-models";

// 配置fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const requestId = searchParams.get("requestId");

    if (!id && !requestId) {
      return respErr("需要提供 id 或 requestId 参数");
    }

    // 认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("用户未登录");
    }

    let videoGeneration;

    if (id) {
      // 通过数据库ID查询
      videoGeneration = await getVideoGenerationById(id);
      if (!videoGeneration) {
        return respErr("未找到视频生成记录");
      }
    }

    // 如果有 requestId，查询 fal 状态
    let falStatus: any = null;
    const finalRequestId = requestId || videoGeneration?.fal_request_id;

    if (finalRequestId) {
      try {
        falStatus = await fal.queue.status(
          "fal-ai/kling-video/v1.6/standard/text-to-video",
          {
            requestId: finalRequestId,
          }
        );
      } catch (error) {
        // 如果默认endpoint失败，尝试使用数据库中的模型信息
        if (videoGeneration?.model_id) {
          const modelConfig = getVideoModel(videoGeneration.model_id);
          if (modelConfig) {
            try {
              falStatus = await fal.queue.status(modelConfig.falEndpoint, {
                requestId: finalRequestId,
              });
            } catch (retryError) {
              console.error("重试查询fal状态失败:", retryError);
            }
          }
        }

        if (!falStatus) {
          console.error("查询fal状态失败:", error);
        }
      }
    }

    // 获取模型配置信息
    let modelConfig;
    if (videoGeneration?.model_id) {
      modelConfig = getVideoModel(videoGeneration.model_id);
    }

    return respData({
      id: videoGeneration?.id,
      requestId: finalRequestId,
      status: falStatus?.status || videoGeneration?.status || "unknown",
      logs: falStatus?.logs || [],
      metrics: falStatus?.metrics || {},
      videoGeneration: videoGeneration
        ? {
            ...videoGeneration,
            modelConfig: modelConfig
              ? {
                  id: modelConfig.id,
                  displayName: modelConfig.displayName,
                  type: modelConfig.type,
                }
              : null,
          }
        : null,
      falStatus,
    });
  } catch (error) {
    console.error("查询视频生成状态失败:", error);
    return respErr("查询视频生成状态失败");
  }
}

// 添加POST方法支持（匹配前端调用）
export async function POST(req: Request) {
  try {
    // 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("用户未登录");
    }

    const body = await req.json();
    const { id, requestId, model } = body;

    console.log("POST 状态查询请求参数:", { id, requestId, model });

    // 验证必需参数（id 是我们内部的生成记录ID）
    if (!id) {
      return respErr("id 参数是必需的");
    }

    // 检查API密钥
    if (!process.env.FAL_KEY) {
      return respErr("FAL_KEY 环境变量未配置");
    }

    console.log(`检查视频生成状态，生成ID: ${id}`);

    // 1. 优先从数据库获取状态
    let videoGeneration = await getVideoGenerationById(id);

    if (videoGeneration) {
      console.log("从数据库获取的状态:", videoGeneration.status);

      // 如果状态不是最终状态，且有fal_request_id，则查询fal.ai获取最新状态
      if (
        videoGeneration.status !== "COMPLETED" &&
        videoGeneration.status !== "SAVED_TO_R2" &&
        videoGeneration.status !== "FAILED" &&
        videoGeneration.fal_request_id &&
        videoGeneration.model_id
      ) {
        try {
          // 获取正确的模型端点 - 使用新的配置系统
          const modelConfig = getVideoModel(videoGeneration.model_id);
          if (!modelConfig) {
            console.error(`未找到模型配置: ${videoGeneration.model_id}`);
            throw new Error(`不支持的模型: ${videoGeneration.model_id}`);
          }

          console.log(`使用模型端点查询状态: ${modelConfig.falEndpoint}`);

          const falStatus = await fal.queue.status(modelConfig.falEndpoint, {
            requestId: videoGeneration.fal_request_id,
            logs: true,
          });

          console.log("从fal.ai获取的最新状态:", falStatus.status);

          // 如果fal.ai状态有更新，更新数据库状态
          if (falStatus.status !== videoGeneration.status) {
            console.log(
              `状态更新: ${videoGeneration.status} -> ${falStatus.status}`
            );

            try {
              // 准备更新参数
              const updateParams: any = {
                status: falStatus.status,
              };

              // 如果有 logs，更新 logs
              if (
                (falStatus as any).logs &&
                Array.isArray((falStatus as any).logs)
              ) {
                updateParams.logs = (falStatus as any).logs;
              }

              // 如果任务完成，尝试获取结果
              if (falStatus.status === "COMPLETED") {
                try {
                  const result = await fal.queue.result(
                    modelConfig.falEndpoint,
                    {
                      requestId: videoGeneration.fal_request_id,
                    }
                  );

                  console.log("获取到生成结果:", result);

                  if (result && (result as any).data) {
                    const resultData = (result as any).data;
                    if (resultData.video_url) {
                      updateParams.video_url_fal = resultData.video_url;
                    }
                    if (resultData.seed) {
                      updateParams.seed = resultData.seed;
                    }
                  } else {
                    // 如果结果为空或没有数据，标记为失败
                    console.error("获取结果成功但数据为空:", result);
                    updateParams.status = "FAILED";
                    updateParams.error_message =
                      "Video generation completed but no result data available";
                  }
                } catch (resultError) {
                  console.error("获取结果失败:", resultError);
                  // 获取结果失败时，将状态更新为FAILED
                  updateParams.status = "FAILED";

                  // 检查是否是 Unprocessable Entity 错误
                  const errorMessage =
                    resultError instanceof Error
                      ? resultError.message
                      : String(resultError);

                  if (
                    errorMessage.includes("Unprocessable Entity") ||
                    errorMessage.includes("422") ||
                    errorMessage.toLowerCase().includes("unprocessable")
                  ) {
                    updateParams.error_message =
                      "There's an issue with your input or settings. Please check and try again.";
                  } else {
                    updateParams.error_message =
                      "Failed to retrieve video result. Please try again.";
                  }
                }
              }

              // 更新数据库
              const { updateVideoGenerationById } = await import(
                "@/models/videoGeneration"
              );
              const updatedRecord = await updateVideoGenerationById(
                videoGeneration.id,
                updateParams
              );

              console.log("数据库状态已更新:", updatedRecord.status);

              // 使用更新后的记录
              videoGeneration = updatedRecord;
            } catch (updateError) {
              console.error("更新数据库状态失败:", updateError);
              // 如果更新失败，使用fal最新状态但保持数据库记录不变，只更新内存中的状态
              videoGeneration = {
                ...videoGeneration,
                status: falStatus.status,
              };
            }
          } else {
            // 如果状态没有变化，但可能有新的logs，也合并一下
            if ((falStatus as any).logs) {
              videoGeneration = {
                ...videoGeneration,
                logs: (falStatus as any).logs,
              };
            }
          }
        } catch (falError) {
          console.error("查询fal.ai状态失败:", falError);
          // 如果fal.ai查询失败，仍然返回数据库中的状态
        }
      }

      // 返回扁平化格式（与前端期望保持一致）
      return respData({
        id: videoGeneration.id,
        status: videoGeneration.status,
        requestId: videoGeneration.fal_request_id,
        model: videoGeneration.model_id,
        prompt: videoGeneration.prompt,
        video_url:
          videoGeneration.video_url_r2 || videoGeneration.video_url_fal,
        video_url_r2: videoGeneration.video_url_r2,
        video_url_fal: videoGeneration.video_url_fal,
        error_message: videoGeneration.error_message,
        logs: videoGeneration.logs || [],
        metrics: videoGeneration.metrics,
        created_at: videoGeneration.created_at,
        updated_at: videoGeneration.updated_at,
        aspect_ratio: videoGeneration.aspect_ratio,
        duration_seconds: videoGeneration.duration_seconds,
      });
    }

    return respErr("未找到对应的视频生成记录");
  } catch (error) {
    console.error("状态查询失败:", error);

    let errorMessage = "状态查询失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
