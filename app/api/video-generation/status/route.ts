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
      const status = await fal.queue.status(model, {
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
