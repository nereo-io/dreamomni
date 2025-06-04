import { fal } from "@fal-ai/client";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getVideoModel } from "@/config/video-models";

// 配置fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function GET(req: Request) {
  try {
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

    console.log(`获取视频生成结果，模型: ${model}，请求ID: ${requestId}`);

    // 确定要使用的模型端点
    let endpoint = "fal-ai/kling-video/v1.6/standard/text-to-video"; // 默认端点

    if (model) {
      const modelConfig = getVideoModel(model);
      if (modelConfig) {
        endpoint = modelConfig.falEndpoint;
      } else {
        return respErr(`不支持的模型: ${model}`);
      }
    }

    try {
      const result = await fal.queue.result(endpoint, {
        requestId: requestId,
      });

      console.log("从fal.ai获取的结果:", result);

      return respData({
        requestId: requestId,
        model: model,
        result: result,
        data: result.data || result,
        video_url: result.data?.video_url || result.data?.video?.url || null,
        success: true,
      });
    } catch (error: any) {
      console.error("获取结果失败:", error);
      return respErr(`获取结果失败: ${error.message}`);
    }
  } catch (error) {
    console.error("获取视频生成结果失败:", error);
    let errorMessage = "获取视频生成结果失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
