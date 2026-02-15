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

/**
 * 构建统一系统提示词 - LLM 自动判断场景类型
 */
function buildSystemPrompt(): string {
  return `You are a professional image generation prompt expansion expert.
Your task is to analyze the user's input, identify the scene type, and expand it into multiple detailed prompts covering different angles, scenes, and lighting effects.

STEP 1: Scene Type Identification
First, analyze the user's prompt and identify which scene type it belongs to:

1. **E-commerce/Product Photography**: Product shots, merchandise, commercial items, things meant to be sold
   - Focus: Product details, textures, clean backgrounds, brand aesthetics
   - Examples: "wireless headphones", "coffee mug", "leather bag", "skincare bottle"

2. **Comic/Story/Narrative**: Characters, storylines, manga-style, sequential art, dramatic scenes
   - Focus: Story coherence, character consistency, cinematic angles, emotional impact
   - Examples: "a hero fighting a dragon", "girl walking in rain", "detective in dark alley"

3. **General/Artistic**: Landscapes, abstract art, conceptual pieces, general scenes
   - Focus: Artistic expression, diverse perspectives, creative interpretation
   - Examples: "sunset over mountains", "abstract colorful patterns", "futuristic city"

4. **Other Scenarios**: Use your judgment to create appropriate variations
   - Examples: architecture, food photography, portraits, nature, etc.

STEP 2: Expansion Rules (Apply Based on Scene Type)

**Core Rules (All Scenarios):**
1. Maintain consistency of the original subject/product/character across all variations
2. Each expanded prompt must be independent and complete, ready for direct use in image generation
3. Cover multiple viewing angles: front view, side view, top-down view, 45-degree angle, close-up, wide shot, etc.
4. Cover multiple scenes/backgrounds: studio, outdoor, lifestyle, minimalist, contextual, etc.
5. Cover multiple lighting effects: natural light, studio lighting, dramatic shadows, soft diffused light, golden hour, etc.
6. Each prompt should be 1-2 sentences, detailed but concise
7. Output as a JSON array of strings
8. Write all prompts in English

**Scene-Specific Enhancement:**

For E-commerce:
- Emphasize product details, textures, and material quality
- Include clean backgrounds with white space for potential text overlay
- Add lifestyle context showing product in use
- Ensure premium feel and brand aesthetics
- Multiple practical angles for online shopping

For Comic/Story:
- Maintain character consistency across all variations
- Use cinematic camera angles and dynamic composition
- Add dramatic lighting for emotional impact
- Include action poses and movement
- Ensure narrative coherence between different angles

For General/Artistic:
- Emphasize artistic interpretation and creative freedom
- Explore diverse visual styles and moods
- Balance between realistic and stylized approaches
- Focus on composition and visual impact

For Other Scenarios:
- Apply the most relevant principles from above
- Use professional photography/art direction standards
- Adapt to the specific subject matter appropriately

STEP 3: Output Format
Return ONLY a JSON array of prompt strings. Do not include scene type analysis in the output.

Example output:
["A sleek wireless headphone on white studio background, front view, soft natural lighting, product photography, 8k resolution", "A sleek wireless headphone in modern living room setting, 45-degree angle view, warm ambient light, lifestyle photography", ...]`;
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
    ? `IMPORTANT: The user has provided reference images (attached below). Analyze these images carefully:
- Identify the visual style, color palette, and artistic direction
- Note the character/object design, proportions, and key features
- Understand the mood, atmosphere, and aesthetic preferences
- Maintain STRICT visual consistency with the reference images in all expanded prompts
- Preserve the character/object identity and style across different angles and scenes
- If it's a character, keep their appearance, clothing, and distinctive features consistent
- If it's a product, maintain its design, materials, and brand identity`
    : "Create diverse variations while maintaining consistency with the described subject."
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
 * 扩展图片提示词 - LLM 自动判断场景类型
 *
 * @param originalPrompt - 用户原始提示词
 * @param imageCount - 需要生成的图片数量 (6, 9, 或 12)
 * @param referenceImageUrls - 参考图片 URL 数组（可选）
 * @returns 扩展后的提示词数组
 */
export async function expandImagePrompts(
  originalPrompt: string,
  imageCount: number,
  referenceImageUrls?: string[]
): Promise<string[]> {
  // 验证 API 配置
  if (!process.env.EVOLINK_API_KEY) {
    throw new Error("EVOLINK_API_KEY is not configured");
  }

  // 验证图片数量
  if (![6, 9, 12].includes(imageCount)) {
    throw new Error(`Invalid image count: ${imageCount}. Must be 6, 9, or 12.`);
  }

  const hasReferenceImages = !!(
    referenceImageUrls && referenceImageUrls.length > 0
  );

  console.log(
    `[PromptExpander] Expanding prompt to ${imageCount} variations...`
  );
  console.log(
    `[PromptExpander] Original: "${originalPrompt.substring(0, 100)}..."`
  );
  console.log(
    `[PromptExpander] Reference images: ${
      hasReferenceImages ? referenceImageUrls!.length : 0
    }`
  );

  try {
    const systemPrompt = buildSystemPrompt();
    const userMessage = buildUserMessage(
      originalPrompt,
      imageCount,
      hasReferenceImages
    );

    // 构建消息内容 - 支持 vision 模式
    const messages: any[] = [{ role: "system", content: systemPrompt }];

    // 如果有参考图片，使用 vision 格式
    if (
      hasReferenceImages &&
      referenceImageUrls &&
      referenceImageUrls.length > 0
    ) {
      const contentParts: any[] = [{ type: "text", text: userMessage }];

      // 添加所有参考图片
      for (const imageUrl of referenceImageUrls) {
        contentParts.push({
          type: "image_url",
          image_url: { url: imageUrl },
        });
      }

      messages.push({
        role: "user",
        content: contentParts,
      });
    } else {
      // 纯文本模式
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    const response = await llmClient.chat.completions.create({
      model: "gemini-3-pro-preview",
      messages,
      temperature: 0.8, // 适度的创意性
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    const expandedPrompts = parseExpandedPrompts(content);
    // console.log(content);
    console.log(expandedPrompts);

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
