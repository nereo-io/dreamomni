import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { VIDEO_OPTIMIZATION_PROMPTS } from "@/config/prompts/video-optimization";

// 初始化阿里云 Qwen 客户端（国际端点 - 新加坡）
const qwenClientIntl = createDeepSeek({
  apiKey: process.env.ALI_API_KEY_INTL ?? "",
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

const ANIMATION_STYLE_PATTERN =
  /\b(?:2d|3d|animated|animation|anime|cartoon|comic|manga|stylized|stylised|illustrated|illustration|toon|cel[- ]shaded|pixar|ghibli|cgi)\b/i;
const REALISM_STYLE_PATTERN =
  /\b(?:photorealistic|photo-realistic|live action|live-action|realistic human)\b/i;
const TEXT_LOCK_PATTERN =
  /\b(?:on[- ]screen text|text on screen|english text|english words|english letters|subtitle|caption|logo|wordmark|typography|lettering|title card|text reads|text says)\b/i;
const QUOTED_TEXT_PATTERN = /["“]([^"”]{1,120})["”]/g;

function normalizePrompt(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractQuotedLatinSegments(prompt: string): string[] {
  return Array.from(prompt.matchAll(QUOTED_TEXT_PATTERN))
    .map((match) => match[1]?.trim())
    .filter((segment): segment is string => Boolean(segment && /[A-Za-z]/.test(segment)));
}

export function shouldBypassVideoPromptOptimization(originalPrompt: string): boolean {
  const normalizedPrompt = normalizePrompt(originalPrompt);
  const hasAnimationStyle = ANIMATION_STYLE_PATTERN.test(normalizedPrompt);
  const hasExplicitTextConstraint =
    TEXT_LOCK_PATTERN.test(normalizedPrompt) ||
    extractQuotedLatinSegments(normalizedPrompt).length > 0;

  return hasAnimationStyle && hasExplicitTextConstraint;
}

export function sanitizeOptimizedVideoPrompt(
  originalPrompt: string,
  optimizedPrompt: string
): string {
  const trimmedOptimized = optimizedPrompt.trim();
  const normalizedOriginal = normalizePrompt(originalPrompt);
  const normalizedOptimized = normalizePrompt(trimmedOptimized);

  if (!trimmedOptimized) {
    return originalPrompt;
  }

  if (shouldBypassVideoPromptOptimization(originalPrompt)) {
    return originalPrompt;
  }

  const quotedSegments = extractQuotedLatinSegments(normalizedOriginal);
  if (quotedSegments.length > 0) {
    const optimizedLower = normalizedOptimized.toLowerCase();
    const lostQuotedText = quotedSegments.some(
      (segment) => !optimizedLower.includes(segment.toLowerCase())
    );

    if (lostQuotedText) {
      return originalPrompt;
    }
  }

  if (ANIMATION_STYLE_PATTERN.test(normalizedOriginal)) {
    const keepsAnimationStyle = ANIMATION_STYLE_PATTERN.test(normalizedOptimized);
    const introducesRealism = REALISM_STYLE_PATTERN.test(normalizedOptimized);

    if (!keepsAnimationStyle || introducesRealism) {
      return originalPrompt;
    }
  }

  return trimmedOptimized;
}

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
    if (shouldBypassVideoPromptOptimization(originalPrompt)) {
      console.log(
        "[PromptOptimization] Bypassing optimization for animation + text fidelity prompt"
      );
      return originalPrompt;
    }

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

      return sanitizeOptimizedVideoPrompt(originalPrompt, result.text);
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

      return sanitizeOptimizedVideoPrompt(originalPrompt, result.text);
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
