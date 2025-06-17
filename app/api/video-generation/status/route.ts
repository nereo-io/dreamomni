import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import {
  getVideoGenerationById,
  getVideoGenerationByFalRequestId,
  getVideoGenerationByVolcanoRequestId,
} from "@/models/videoGeneration";
import { getVideoModel, VideoModelProvider } from "@/config/video-models";
import { ProviderFactory } from "@/services/providers";

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
    } else if (requestId) {
      // 尝试通过各种requestId查找记录
      videoGeneration = await getVideoGenerationByFalRequestId(requestId) ||
                       await getVideoGenerationByVolcanoRequestId(requestId);
      
      if (!videoGeneration) {
        return respErr("未找到对应的视频生成记录");
      }
    }

    // 获取模型配置信息
    let modelConfig;
    if (videoGeneration?.model_id) {
      modelConfig = getVideoModel(videoGeneration.model_id);
    }

    // 确定使用的requestId
    const finalRequestId = requestId || 
                           videoGeneration?.fal_request_id || 
                           videoGeneration?.volcano_request_id;

    return respData({
      id: videoGeneration?.id,
      requestId: finalRequestId,
      status: videoGeneration?.status || "unknown",
      prompt: videoGeneration?.prompt,
      optimized_prompt: videoGeneration?.optimized_prompt,
      logs: videoGeneration?.logs || [],
      metrics: videoGeneration?.metrics || {},
      videoGeneration: videoGeneration
        ? {
            ...videoGeneration,
            modelConfig: modelConfig
              ? {
                  id: modelConfig.id,
                  displayName: modelConfig.displayName,
                  type: modelConfig.type,
                  provider: modelConfig.provider,
                }
              : null,
          }
        : null,
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

    // API密钥检查会在provider中处理

    console.log(`检查视频生成状态，生成ID: ${id}`);

    // 1. 优先从数据库获取状态
    let videoGeneration = await getVideoGenerationById(id);

    if (videoGeneration) {
      console.log("从数据库获取的状态:", videoGeneration.status);

      // 如果状态不是最终状态，且有请求ID，则查询provider获取最新状态
      if (
        videoGeneration.status !== "COMPLETED" &&
        videoGeneration.status !== "SAVED_TO_R2" &&
        videoGeneration.status !== "FAILED" &&
        (videoGeneration.fal_request_id || videoGeneration.volcano_request_id) &&
        videoGeneration.model_id
      ) {
        try {
          // 获取正确的模型配置和provider
          const modelConfig = getVideoModel(videoGeneration.model_id);
          if (!modelConfig) {
            console.error(`未找到模型配置: ${videoGeneration.model_id}`);
            throw new Error(`不支持的模型: ${videoGeneration.model_id}`);
          }

          // 确定使用哪个请求ID
          const requestId = videoGeneration.fal_request_id || 
                           videoGeneration.volcano_request_id;

          if (!requestId) {
            throw new Error("No valid request ID found");
          }

          console.log(`使用provider查询状态: ${modelConfig.provider}, requestId: ${requestId}`);

          const provider = ProviderFactory.getProvider(videoGeneration.model_id);
          const providerStatus = await provider.status(videoGeneration.model_id, requestId);

          console.log("从provider获取的最新状态:", providerStatus.status);

          // 如果provider状态有更新，更新数据库状态
          if (providerStatus.status !== videoGeneration.status) {
            console.log(
              `状态更新: ${videoGeneration.status} -> ${providerStatus.status}`
            );

            try {
              // 准备更新参数
              const updateParams: any = {
                status: providerStatus.status,
              };

              // 如果有 logs，更新 logs
              if (providerStatus.logs && Array.isArray(providerStatus.logs)) {
                updateParams.logs = providerStatus.logs;
              }

              // 如果有 metrics，更新 metrics
              if (providerStatus.metrics) {
                updateParams.metrics = providerStatus.metrics;
              }

              // 如果任务完成，尝试获取结果
              if (providerStatus.status === "COMPLETED") {
                try {
                  const result = await provider.result(videoGeneration.model_id, requestId);

                  console.log("获取到生成结果:", result);

                  if (result && result.video_url) {
                    // 根据provider类型设置对应的video URL字段
                    if (modelConfig.provider === VideoModelProvider.VOLCANO) {
                      updateParams.video_url_volcano = result.video_url;
                    } else if (modelConfig.provider === VideoModelProvider.FAL) {
                      updateParams.video_url_fal = result.video_url;
                    }
                    
                    // 如果result包含seed信息，也更新
                    if ((result as any).data?.seed) {
                      updateParams.seed = (result as any).data.seed;
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
              // 如果更新失败，使用provider最新状态但保持数据库记录不变，只更新内存中的状态
              videoGeneration = {
                ...videoGeneration,
                status: providerStatus.status as any,
              };
            }
          } else {
            // 如果状态没有变化，但可能有新的logs，也合并一下
            if (providerStatus.logs) {
              videoGeneration = {
                ...videoGeneration,
                logs: providerStatus.logs,
              };
            }
          }
        } catch (providerError) {
          console.error("查询provider状态失败:", providerError);
          // 如果provider查询失败，仍然返回数据库中的状态
        }
      }

      // 返回扁平化格式（与前端期望保持一致）
      return respData({
        id: videoGeneration.id,
        status: videoGeneration.status,
        requestId: videoGeneration.fal_request_id || 
                   videoGeneration.volcano_request_id,
        model: videoGeneration.model_id,
        prompt: videoGeneration.prompt,
        optimized_prompt: videoGeneration.optimized_prompt,
        video_url:
          videoGeneration.video_url_r2 || 
          videoGeneration.video_url_volcano || 
          videoGeneration.video_url_fal,
        video_url_r2: videoGeneration.video_url_r2,
        video_url_fal: videoGeneration.video_url_fal,
        video_url_volcano: videoGeneration.video_url_volcano,
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
