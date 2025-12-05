/**
 * Prompt Expander Service
 * 提示词扩展服务 - 使用 LLM 将用户提示词扩展为多角度版本
 *
 * 使用 Evolink API (支持 Gemini/GPT 等模型)
 */

import OpenAI from "openai";

// 初始化 LLM 客户端
const llmClient = new OpenAI({
  apiKey: process.env.EVOLINK_API_KEY || "",
  baseURL: process.env.EVOLINK_BASE_URL || "https://api.evolink.ai/v1",
});

// 用户场景类型
export type UserContext = "ecommerce" | "comic" | "general";

// 扩展提示词结果
export interface ExpandedPromptsResult {
  prompts: string[];
  originalPrompt: string;
  context: UserContext;
}

/**
 * 构建系统提示词
 */
function buildSystemPrompt(context: UserContext): string {
  const base = `You are a professional image generation prompt expansion expert.
Your task is to expand a simple user prompt into multiple detailed prompts covering different angles, scenes, and lighting effects.

Rules:
1. Maintain consistency of the original subject/product/character
2. Each expanded prompt must be independent and complete, ready for direct use in image generation
3. Cover multiple viewing angles: front view, side view, top-down view, 45-degree angle, close-up, etc.
4. Cover multiple scenes: studio, outdoor, lifestyle, minimalist background, etc.
5. Cover multiple lighting effects: natural light, studio lighting, dramatic shadows, soft diffused light, etc.
6. Each prompt should be 1-2 sentences, detailed but concise
7. Output as a JSON array of strings
8. Write all prompts in English`;

  if (context === "ecommerce") {
    return (
      base +
      `

Special focus for e-commerce:
- Product details and textures
- Clean backgrounds with appropriate white space for text overlay
- Brand aesthetics and premium feel
- Multiple product angles for online shopping
- Lifestyle shots showing the product in use`
    );
  } else if (context === "comic") {
    return (
      base +
      `

Special focus for comic/manga:
- Story coherence and narrative flow
- Character consistency across different scenes
- Cinematic camera angles and composition
- Dramatic lighting for emotional impact
- Action poses and dynamic compositions`
    );
  }

  return base;
}

/**
 * 构建用户消息
 */
function buildUserMessage(
  prompt: string,
  count: number,
  hasReferenceImages: boolean
): string {
  let message = `Original prompt: "${prompt}"

Please expand this into ${count} different detailed prompts, each covering a unique combination of:
- Viewing angle (front, side, top-down, 45-degree, close-up, etc.)
- Scene/background (studio, outdoor, lifestyle, minimalist, etc.)
- Lighting (natural, studio, dramatic, soft, etc.)

${
  hasReferenceImages
    ? "Note: The user has provided reference images, so maintain visual consistency with the reference style."
    : ""
}

Output format: A JSON array of ${count} complete prompt strings. Each prompt should be ready for direct use in image generation.

Example output format:
["A sleek wireless headphone on white studio background, front view, soft natural lighting, product photography, 8k resolution", "A sleek wireless headphone in modern living room setting, 45-degree angle view, warm ambient light, lifestyle photography", ...]`;

  return message;
}

/**
 * 解析 LLM 返回的扩展提示词
 */
function parseExpandedPrompts(content: string | null): string[] {
  if (!content) {
    throw new Error("Empty response from LLM");
  }

  // 尝试提取 JSON 数组
  let jsonStr = content;

  // 如果内容包含 markdown 代码块，提取其中的 JSON
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // 尝试找到 JSON 数组
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    jsonStr = arrayMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    // 确保所有元素都是字符串
    const prompts = parsed.map((item, index) => {
      if (typeof item === "string") {
        return item;
      }
      if (typeof item === "object" && item.prompt) {
        return item.prompt;
      }
      throw new Error(`Invalid item at index ${index}`);
    });

    return prompts;
  } catch (error) {
    console.error("[PromptExpander] Failed to parse JSON:", error);
    console.error("[PromptExpander] Raw content:", content);
    throw new Error(
      `Failed to parse expanded prompts: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * 扩展图片提示词
 *
 * @param originalPrompt - 用户原始提示词
 * @param imageCount - 需要生成的图片数量 (6, 9, 或 12)
 * @param hasReferenceImages - 是否有参考图片
 * @param userContext - 用户场景 ('ecommerce', 'comic', 或 'general')
 * @returns 扩展后的提示词数组
 */
export async function expandImagePrompts(
  originalPrompt: string,
  imageCount: number,
  hasReferenceImages: boolean = false,
  userContext: UserContext = "general"
): Promise<string[]> {
  // 验证 API 配置
  if (!process.env.EVOLINK_API_KEY) {
    throw new Error("EVOLINK_API_KEY is not configured");
  }

  // 验证图片数量
  if (![6, 9, 12].includes(imageCount)) {
    throw new Error(`Invalid image count: ${imageCount}. Must be 6, 9, or 12.`);
  }

  console.log(
    `[PromptExpander] Expanding prompt to ${imageCount} variations...`
  );
  console.log(
    `[PromptExpander] Original: "${originalPrompt.substring(0, 100)}..."`
  );
  console.log(
    `[PromptExpander] Context: ${userContext}, Has reference: ${hasReferenceImages}`
  );

  try {
    const systemPrompt = buildSystemPrompt(userContext);
    const userMessage = buildUserMessage(
      originalPrompt,
      imageCount,
      hasReferenceImages
    );

    const response = await llmClient.chat.completions.create({
      model: "gemini-3-pro-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8, // 适度的创意性
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    const expandedPrompts = parseExpandedPrompts(content);

    // 验证数量
    if (expandedPrompts.length !== imageCount) {
      console.warn(
        `[PromptExpander] Expected ${imageCount} prompts, got ${expandedPrompts.length}`
      );

      // 如果数量不够，用原始提示词填充
      while (expandedPrompts.length < imageCount) {
        expandedPrompts.push(
          `${originalPrompt}, variation ${expandedPrompts.length + 1}`
        );
      }

      // 如果数量过多，截断
      if (expandedPrompts.length > imageCount) {
        expandedPrompts.length = imageCount;
      }
    }

    console.log(
      `[PromptExpander] Successfully expanded to ${expandedPrompts.length} prompts`
    );

    return expandedPrompts;
  } catch (error) {
    console.error("[PromptExpander] Error expanding prompts:", error);

    // 降级处理：返回基本的变体提示词
    console.log("[PromptExpander] Falling back to basic variations...");

    const fallbackPrompts: string[] = [];
    const angles = [
      "front view",
      "side view",
      "45-degree angle",
      "top-down view",
      "close-up",
      "wide shot",
    ];
    const scenes = [
      "studio background",
      "minimalist white background",
      "outdoor natural setting",
      "lifestyle context",
    ];
    const lightings = [
      "natural lighting",
      "soft studio light",
      "dramatic lighting",
      "warm ambient light",
    ];

    for (let i = 0; i < imageCount; i++) {
      const angle = angles[i % angles.length];
      const scene = scenes[Math.floor(i / angles.length) % scenes.length];
      const lighting = lightings[i % lightings.length];

      fallbackPrompts.push(
        `${originalPrompt}, ${angle}, ${scene}, ${lighting}, high quality, detailed`
      );
    }

    return fallbackPrompts;
  }
}

/**
 * 获取单个扩展提示词（用于测试或单独调用）
 */
export async function expandSinglePrompt(
  originalPrompt: string,
  angle: string,
  scene: string,
  lighting: string
): Promise<string> {
  const expandedPrompts = await expandImagePrompts(originalPrompt, 1);
  return (
    expandedPrompts[0] || `${originalPrompt}, ${angle}, ${scene}, ${lighting}`
  );
}
