import { fal } from "@fal-ai/client";
import { respData, respErr } from "@/lib/resp";

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
    if (!model || !requestId) {
      return respErr("model 和 requestId 参数是必需的");
    }

    // 检查API密钥
    if (!process.env.FAL_KEY) {
      return respErr("FAL_KEY 环境变量未配置");
    }

    console.log(`获取视频生成结果，模型: ${model}，请求ID: ${requestId}`);

    // 获取结果
    const result = await fal.queue.result(model, {
      requestId: requestId,
    });

    console.log("视频生成结果:", result);

    return respData({
      video_url: result.data.video?.url,
      seed: result.data.seed,
      model: model,
      requestId: result.requestId,
      duration: result.data.duration || null,
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
