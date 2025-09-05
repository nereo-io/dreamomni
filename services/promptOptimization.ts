import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText } from "ai";

// 初始化阿里云 Qwen 客户端
const qwenClient = createDeepSeek({
  apiKey: process.env.ALI_API_KEY ?? "",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

/**
 * 优化视频生成提示词
 * @param originalPrompt 原始提示词
 * @param modelType 视频模型类型（可选，用于针对性优化）
 * @returns 优化后的提示词
 */
export async function optimizeVideoPrompt(
  originalPrompt: string,
  modelType?: string
): Promise<string> {
  try {
    const systemPrompt = `你是一个专业的视频生成提示词优化专家。你的任务是将用户输入的简单描述优化为能够生成高质量、充满画面感和情感的详细视频提示词。

优化要求：
1. 画面层次丰富 - 描述前景、中景、背景的具体细节和层次关系
2. 光影氛围营造 - 详细描述光线质感、色彩氛围、视觉情绪
3. 镜头运动设计 - 添加镜头移动、转场、聚焦等电影化表现手法
4. 情感与意境 - 融入诗意、浪漫、梦幻等情感元素
5. 风格统一 - 添加适合的艺术风格词汇
6. 使用英文输出 - 最终提示词必须是英文
7. 长度适中 - 优化后的提示词应在80-250词之间

请直接输出优化后的英文提示词，不要包含任何解释或说明。

参考示例风格：
原始：一只猫在花园里玩耍
优化：In a dreamlike scene bathed in soft golden sunlight, a graceful orange tabby cat dances playfully through an enchanted garden. Delicate flower petals drift through the air like living confetti, swirling around the cat as it leaps between blooming rose bushes. The camera slowly orbits around the scene, capturing the cat's joyful movements from different angles before gently zooming in to focus on its bright, curious eyes reflecting the warm light. Background shows a blur of vibrant colors - emerald leaves, coral blooms, and dancing light rays. Style: whimsical, Studio Ghibli-inspired, soft lighting, poetic, romantic, gentle color palette, cinematic depth

原始：城市夜景
优化：A breathtaking urban symphony unfolds as twilight embraces the metropolitan skyline. Countless windows glow like scattered diamonds against the deep indigo sky, while neon reflections paint the wet streets below in streams of electric color. The camera begins with a sweeping aerial view, slowly descending through layers of light and shadow, weaving between illuminated skyscrapers. Gentle rain creates shimmering bokeh effects as droplets catch the city lights. The movement culminates in a close focus on raindrops sliding down a window, with the entire glowing cityscape softly blurred in the background. Style: cinematic noir, atmospheric lighting, romantic urban aesthetic, rich color contrast, moody and poetic`;

    const result = await generateText({
      model: qwenClient("qwen-turbo-latest"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: originalPrompt },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    return result.text.trim();
  } catch (error) {
    console.error("视频提示词优化失败:", error);
    // 如果优化失败，返回原始提示词
    return originalPrompt;
  }
}

/**
 * 优化图片生成提示词
 * @param originalPrompt 原始提示词
 * @param modelType 图片模型类型（可选，用于针对性优化）
 * @returns 优化后的提示词
 */
export async function optimizeImagePrompt(
  originalPrompt: string,
  modelType?: string
): Promise<string> {
  try {
    const systemPrompt = `你是一个专业的图片生成提示词优化专家。你的任务是将用户输入的简单描述优化为能够生成高质量、充满细节和艺术感的详细图片提示词。

优化要求：
1. 视觉细节丰富 - 描述主体、背景、纹理、材质等具体细节
2. 光影氛围营造 - 详细描述光线质感、色彩氛围、视觉情绪
3. 构图设计 - 添加构图、角度、景深等摄影技巧
4. 艺术风格 - 融入适合的艺术风格和美学元素
5. 情感表达 - 加入诗意、美感、情感等元素
6. 使用英文输出 - 最终提示词必须是英文
7. 长度适中 - 优化后的提示词应在60-200词之间

请直接输出优化后的英文提示词，不要包含任何解释或说明。

参考示例风格：
原始：一只猫在花园里
优化：A graceful orange tabby cat sits elegantly in an enchanted garden, surrounded by blooming roses and delicate wildflowers. Soft golden hour sunlight filters through verdant leaves, casting dappled shadows across the scene. The cat's bright amber eyes reflect the warm light, while its fur shows rich textures and subtle color variations. Background features a dreamy bokeh effect with vibrant flower petals and dancing light rays. Style: photorealistic, warm color palette, soft lighting, shallow depth of field, artistic photography

原始：城市夜景
优化：A stunning urban nightscape showcases a glittering metropolitan skyline against a deep indigo sky. Countless illuminated windows create a tapestry of warm golden lights, while neon signs cast colorful reflections on rain-slicked streets below. The composition captures both architectural grandeur and intimate street-level details, with bokeh effects from distant lights creating a magical atmosphere. Style: cinematic photography, dramatic lighting, rich color contrast, urban aesthetic, high dynamic range

原始：美丽的花朵
优化：Exquisite blooming flowers display intricate petal details with dewdrops catching morning light. Each flower showcases unique textures and vibrant color gradients, from deep crimson centers to delicate pink edges. The composition features shallow depth of field with a dreamy bokeh background, while soft natural lighting creates gentle shadows and highlights. Artistic photography style with macro lens perspective, romantic atmosphere, and painterly quality reminiscent of classical botanical illustrations.`;

    const result = await generateText({
      model: qwenClient("qwen-turbo-latest"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: originalPrompt },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    return result.text.trim();
  } catch (error) {
    console.error("图片提示词优化失败:", error);
    // 如果优化失败，返回原始提示词
    return originalPrompt;
  }
}

/**
 * 带超时的视频提示词优化
 * @param originalPrompt 原始提示词
 * @param modelType 视频模型类型（可选）
 * @param timeoutMs 超时时间（毫秒）
 * @returns 优化后的提示词或原始提示词（如果超时或失败）
 */
export async function optimizeVideoPromptWithTimeout(
  originalPrompt: string,
  modelType?: string,
  timeoutMs: number = 30000
): Promise<string> {
  try {
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("视频提示词优化超时")), timeoutMs);
    });

    const optimizePromise = optimizeVideoPrompt(originalPrompt, modelType);

    // 使用 Promise.race 实现超时控制
    return await Promise.race([optimizePromise, timeoutPromise]);
  } catch (error) {
    console.error("视频提示词优化失败或超时:", error);
    // 如果优化失败或超时，返回原始提示词
    return originalPrompt;
  }
}

/**
 * 带超时的图片提示词优化
 * @param originalPrompt 原始提示词
 * @param modelType 图片模型类型（可选）
 * @param timeoutMs 超时时间（毫秒）
 * @returns 优化后的提示词或原始提示词（如果超时或失败）
 */
export async function optimizeImagePromptWithTimeout(
  originalPrompt: string,
  modelType?: string,
  timeoutMs: number = 30000
): Promise<string> {
  try {
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("图片提示词优化超时")), timeoutMs);
    });

    const optimizePromise = optimizeImagePrompt(originalPrompt, modelType);

    // 使用 Promise.race 实现超时控制
    return await Promise.race([optimizePromise, timeoutPromise]);
  } catch (error) {
    console.error("图片提示词优化失败或超时:", error);
    // 如果优化失败或超时，返回原始提示词
    return originalPrompt;
  }
}
