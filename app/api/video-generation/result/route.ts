import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getVideoModel } from "@/config/video-models";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const model = url.searchParams.get("model");
    const requestId = url.searchParams.get("requestId");

    // 验证必需参数
    if (!requestId) {
      return respErr("requestId 参数是必需的");
    }

    // API密钥检查会在provider中处理

    console.log(`获取视频生成结果，模型: ${model}，请求ID: ${requestId}`);

    if (!model) {
      return respErr("model 参数是必需的");
    }

    const modelConfig = getVideoModel(model);
    if (!modelConfig) {
      return respErr(`不支持的模型: ${model}`);
    }

    try {
      // 动态导入Provider Factory以避免build时环境变量检查
      const { ProviderFactory } = await import("@/services/providers");
      const provider = ProviderFactory.getProvider(model);
      
      const result = await provider.result(model, requestId);

      console.log("从provider获取的结果:", result);

      return respData({
        requestId: requestId,
        model: model,
        result: result,
        data: result.data || result,
        video_url: result.video_url || null,
        success: true,
        provider: modelConfig.provider,
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
