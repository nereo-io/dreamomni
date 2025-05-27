import { fal } from "@fal-ai/client";
import { respData, respErr } from "@/lib/resp";

// 配置fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

// 支持的视频模型配置（与submit和status接口保持一致）
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
    const url = new URL(req.url);
    const model = url.searchParams.get("model");
    const requestId = url.searchParams.get("requestId");

    // 验证必需参数
    if (!model || !requestId) {
      return respErr("model 和 requestId 参数是必需的");
    }

    // 检查API密钥
    if (!process.env.FAL_KEY) {
      return respErr("FAL_KEY 环境变量未配置");
    }

    // 获取正确的模型端点
    const modelEndpoint = VIDEO_MODELS[model as keyof typeof VIDEO_MODELS];
    if (!modelEndpoint) {
      return respErr(`不支持的模型: ${model}`);
    }

    console.log(
      `获取视频生成结果，模型: ${model} -> ${modelEndpoint}，请求ID: ${requestId}`
    );

    // 获取结果
    const result = await fal.queue.result(modelEndpoint, {
      requestId: requestId,
    });

    console.log("视频生成结果:", result);

    // 提取视频URL，支持不同的数据结构
    let videoUrl = null;
    if (result.data) {
      // 尝试不同的可能路径
      videoUrl =
        result.data.video?.url ||
        result.data.video_url ||
        result.data.video ||
        (Array.isArray(result.data.videos) && result.data.videos[0]?.url) ||
        null;
    }

    return respData({
      video_url: videoUrl,
      seed: result.data?.seed || null,
      model: model,
      modelEndpoint: modelEndpoint,
      requestId: result.requestId || requestId,
      duration: result.data?.duration || null,
      data: result.data,
    });
  } catch (error) {
    console.error("获取结果失败:", error);

    let errorMessage = "获取结果失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
