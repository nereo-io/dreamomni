import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { optimizePromptWithTimeout } from "@/services/promptOptimization";
import { updateVideoGenerationById } from "@/models/videoGeneration";

export async function POST(req: NextRequest) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    const { videoGenerationId, originalPrompt, modelType } = await req.json();

    // 2. 验证必需参数
    if (!videoGenerationId || !originalPrompt) {
      return respErr("videoGenerationId 和 originalPrompt 参数是必需的");
    }

    // 3. 更新状态为 PROMPT_OPTIMIZING
    await updateVideoGenerationById(videoGenerationId, {
      status: "PROMPT_OPTIMIZING",
    });

    // 4. 优化提示词（30秒超时）
    const optimizedPrompt = await optimizePromptWithTimeout(
      originalPrompt,
      modelType,
      30000
    );

    // 5. 更新数据库记录
    const updatedRecord = await updateVideoGenerationById(videoGenerationId, {
      optimized_prompt: optimizedPrompt,
      status: "IN_QUEUE", // 优化完成后进入队列
    });

    return respData({
      id: videoGenerationId,
      originalPrompt,
      optimizedPrompt,
      status: "optimized",
      message: "提示词优化完成",
    });
  } catch (error) {
    console.error("提示词优化失败:", error);

    let errorMessage = "提示词优化失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
