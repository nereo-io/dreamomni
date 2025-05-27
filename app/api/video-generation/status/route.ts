import { fal } from "@fal-ai/client";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import {
  getVideoGenerationById,
  getVideoGenerationByFalRequestId,
} from "@/models/videoGeneration";

// 配置fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

// 支持的视频模型配置（与submit接口保持一致）
const VIDEO_MODELS = {
  // 文本转视频模型
  "minimax-text-to-video": "fal-ai/minimax/video-01",
  "haiper-text-to-video": "fal-ai/haiper-video-2/text-to-video",
  "hunyuan-text-to-video": "fal-ai/hunyuan-video",
  "mochi-text-to-video": "fal-ai/mochi-v1",
  "kling-1-6-text-to-video": "fal-ai/kling-video/v1.6/standard/text-to-video",

  // 图片转视频模型
  "minimax-image-to-video": "fal-ai/minimax/video-01/image-to-video",
  "luma-dream-machine": "fal-ai/luma-dream-machine/image-to-video",
  "kling-2-0-master": "fal-ai/kling-video/v2/master/image-to-video",
  "kling-1-6": "fal-ai/kling-video/v1.6/standard/image-to-video",
  pixverse: "fal-ai/pixverse/image-to-video",
  "veo-2": "fal-ai/veo2/image-to-video",
  "wan-image-to-video": "fal-ai/wan-i2v",
  framepack: "fal-ai/framepack",
};

export async function GET(req: Request) {
  try {
    // 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("用户未登录");
    }

    const url = new URL(req.url);
    const model = url.searchParams.get("model");
    const requestId = url.searchParams.get("requestId");

    // 验证必需参数
    if (!requestId) {
      return respErr("requestId 参数是必需的");
    }

    // 检查API密钥
    if (!process.env.FAL_KEY) {
      return respErr("FAL_KEY 环境变量未配置");
    }

    console.log(`检查视频生成状态，模型: ${model}，请求ID: ${requestId}`);

    // 1. 优先从数据库获取状态
    let videoGeneration = null;
    if (requestId) {
      videoGeneration = await getVideoGenerationByFalRequestId(requestId);
    }

    if (videoGeneration) {
      // 从数据库返回状态
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
      });
    }

    // 2. 如果数据库中没有找到记录，且有requestId和model，则查询fal.ai
    if (requestId && model) {
      // 获取正确的模型端点
      const modelEndpoint =
        VIDEO_MODELS[model as keyof typeof VIDEO_MODELS] || model;

      const status = await fal.queue.status(modelEndpoint, {
        requestId: requestId,
        logs: true,
      });

      console.log("从fal.ai获取的任务状态:", status);

      const statusResult = status as any;

      return respData({
        status: status.status,
        requestId: requestId,
        model: model,
        logs: statusResult.logs || [],
        response_url: status.response_url || null,
        completed_at: statusResult.completed_at || null,
        queued_at: statusResult.queued_at || null,
        started_at: statusResult.started_at || null,
        source: "fal_api", // 标识数据来源
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
          // 获取正确的模型端点
          const modelEndpoint =
            VIDEO_MODELS[videoGeneration.model_id as keyof typeof VIDEO_MODELS];
          if (!modelEndpoint) {
            console.error(`未找到模型端点: ${videoGeneration.model_id}`);
            throw new Error(`不支持的模型: ${videoGeneration.model_id}`);
          }

          console.log(`使用模型端点查询状态: ${modelEndpoint}`);

          const falStatus = await fal.queue.status(modelEndpoint, {
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
                  const result = await fal.queue.result(modelEndpoint, {
                    requestId: videoGeneration.fal_request_id,
                  });

                  console.log("获取到生成结果:", result);

                  if (result && (result as any).data) {
                    const resultData = (result as any).data;
                    if (resultData.video_url) {
                      updateParams.video_url_fal = resultData.video_url;
                    }
                    if (resultData.seed) {
                      updateParams.seed = resultData.seed;
                    }
                  }
                } catch (resultError) {
                  console.error("获取结果失败:", resultError);
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

              // 返回更新后的数据
              return respData({
                id: updatedRecord.id,
                status: updatedRecord.status,
                requestId: updatedRecord.fal_request_id,
                model: updatedRecord.model_id,
                prompt: updatedRecord.prompt,
                video_url:
                  updatedRecord.video_url_r2 || updatedRecord.video_url_fal,
                video_url_r2: updatedRecord.video_url_r2,
                video_url_fal: updatedRecord.video_url_fal,
                error_message: updatedRecord.error_message,
                logs: updatedRecord.logs || [],
                metrics: updatedRecord.metrics,
                created_at: updatedRecord.created_at,
                updated_at: updatedRecord.updated_at,
                aspect_ratio: updatedRecord.aspect_ratio,
                duration_seconds: updatedRecord.duration_seconds,
              });
            } catch (updateError) {
              console.error("更新数据库状态失败:", updateError);
              // 即使更新失败，仍然返回最新状态
            }
          }

          // 返回fal.ai的最新状态（如果没有更新或更新失败）
          return respData({
            id: videoGeneration.id,
            status: falStatus.status,
            requestId: videoGeneration.fal_request_id,
            model: videoGeneration.model_id,
            prompt: videoGeneration.prompt,
            video_url:
              videoGeneration.video_url_r2 || videoGeneration.video_url_fal,
            video_url_r2: videoGeneration.video_url_r2,
            video_url_fal: videoGeneration.video_url_fal,
            error_message: videoGeneration.error_message,
            logs: (falStatus as any).logs || [],
            metrics: videoGeneration.metrics,
            created_at: videoGeneration.created_at,
            updated_at: videoGeneration.updated_at,
            aspect_ratio: videoGeneration.aspect_ratio,
            duration_seconds: videoGeneration.duration_seconds,
          });
        } catch (falError) {
          console.error("查询fal.ai状态失败:", falError);
          // 如果fal.ai查询失败，仍然返回数据库中的状态
        }
      }

      // 从数据库返回状态
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
