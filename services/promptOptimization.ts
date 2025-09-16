import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { VIDEO_OPTIMIZATION_PROMPTS } from "@/config/prompts/video-optimization";

// 初始化阿里云 Qwen 客户端（国际端点 - 新加坡）
const qwenClientIntl = createDeepSeek({
  apiKey: process.env.ALI_API_KEY_INTL ?? "",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

/**
 * 优化视频生成提示词（支持可选的图片输入）
 * @param originalPrompt 原始提示词
 * @param modelType 视频模型类型（可选，用于针对性优化）
 * @param imageUrl 图片URL（可选，用于多模态优化）
 * @returns 优化后的提示词
 */
export async function optimizeVideoPrompt(
  originalPrompt: string,
  modelType?: string,
  imageUrl?: string
): Promise<string> {
  try {
    // 根据是否有图片选择不同的系统提示词和模型
    if (imageUrl) {
      // 构建多模态消息
      const messages = [
        {
          role: "system" as const,
          content: VIDEO_OPTIMIZATION_PROMPTS.withImage,
        },
        {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              image: imageUrl,
            },
            {
              type: "text" as const,
              text: originalPrompt,
            },
          ],
        },
      ];

      // 尝试使用阿里云国际版 Qwen-VL
      const result = await generateText({
        model: qwenClientIntl("qwen-vl-plus-latest"),
        messages,
        maxTokens: 500,
        temperature: 0.7,
      });

      return result.text.trim();
    } else {
      // 无图片时使用纯文本提示词
      const result = await generateText({
        model: qwenClientIntl("qwen-plus-latest"),
        messages: [
          { role: "system", content: VIDEO_OPTIMIZATION_PROMPTS.textOnly },
          { role: "user", content: originalPrompt },
        ],
        maxTokens: 500,
        temperature: 0.7,
      });

      return result.text.trim();
    }
  } catch (error) {
    console.error("视频提示词优化失败:", error);
    // 如果优化失败，返回原始提示词
    return originalPrompt;
  }
}
/**
 * 带超时的视频提示词优化
 * @param originalPrompt 原始提示词
 * @param modelType 视频模型类型（可选）
 * @param timeoutMs 超时时间（毫秒）
 * @param imageUrl 图片URL（可选）
 * @returns 优化后的提示词或原始提示词（如果超时或失败）
 */
export async function optimizeVideoPromptWithTimeout(
  originalPrompt: string,
  modelType?: string,
  timeoutMs: number = 30000,
  imageUrl?: string
): Promise<string> {
  try {
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("视频提示词优化超时")), timeoutMs);
    });

    // 直接调用统一的优化函数
    const optimizePromise = optimizeVideoPrompt(
      originalPrompt,
      modelType,
      imageUrl
    );

    // 使用 Promise.race 实现超时控制
    return await Promise.race([optimizePromise, timeoutPromise]);
  } catch (error) {
    console.error("视频提示词优化失败或超时:", error);
    // 如果优化失败或超时，返回原始提示词
    return originalPrompt;
  }
}
