/**
 * AI服务提供商前端配置
 * Frontend configuration for AI service providers
 */

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  providerDisplayName: string;
  credits: number;
  description: string;
  available: boolean;
  features: string[];
  maxResolution?: string;
  aspectRatios?: string[];
}

export interface AIProviderType {
  id: string;
  name: string;
  description: string;
  models: AIModel[];
}

// AI服务提供商配置
export const AI_PROVIDERS: Record<string, { id: string; name: string; displayName: string; status: string }> = {
  nano_banana: {
    id: 'nano_banana',
    name: 'nano-banana',
    displayName: 'Kie.ai Nano Banana',
    status: 'active'
  },
  openai: {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    status: 'active'
  },
  stable_diffusion: {
    id: 'stable_diffusion',
    name: 'stable-diffusion',
    displayName: 'Stability AI',
    status: 'active'
  },
  midjourney: {
    id: 'midjourney',
    name: 'midjourney',
    displayName: 'Midjourney',
    status: 'inactive'
  },
  replicate: {
    id: 'replicate',
    name: 'replicate',
    displayName: 'Replicate',
    status: 'active'
  }
};

// 图片生成功能分类和模型配置
export const IMAGE_GENERATION_TYPES: AIProviderType[] = [
  {
    id: "text-to-image",
    name: "Text to Image",
    description: "Generate images from text descriptions",
    models: [
      {
        id: "google/nano-banana",
        name: "nano-banana",
        displayName: "Nano Banana",
        provider: "nano_banana",
        providerDisplayName: "Kie.ai Nano Banana",
        credits: 2,
        description: "Advanced AI model for natural language-driven image generation",
        available: true,
        features: ["high-quality", "fast-generation"],
        maxResolution: "1024x1024",
        aspectRatios: ["1:1", "16:9", "9:16"]
      },
      {
        id: "dall-e-3",
        name: "dall-e-3",
        displayName: "DALL-E 3",
        provider: "openai",
        providerDisplayName: "OpenAI",
        credits: 3,
        description: "OpenAI's most advanced image generation model",
        available: false, // TODO: 实现OpenAI集成
        features: ["ultra-high-quality", "precise-prompts"],
        maxResolution: "1792x1792",
        aspectRatios: ["1:1", "1792:1024", "1024:1792"]
      },
      {
        id: "sd-xl-1.0",
        name: "stable-diffusion-xl",
        displayName: "Stable Diffusion XL",
        provider: "stable_diffusion",
        providerDisplayName: "Stability AI",
        credits: 1,
        description: "High-quality open-source text-to-image generation",
        available: false, // TODO: 实现Stable Diffusion集成
        features: ["open-source", "customizable"],
        maxResolution: "1024x1024",
        aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"]
      },
      {
        id: "midjourney-v6",
        name: "midjourney-v6",
        displayName: "Midjourney v6",
        provider: "midjourney",
        providerDisplayName: "Midjourney",
        credits: 2,
        description: "Artistic image generation with unique aesthetic",
        available: false, // TODO: 实现Midjourney集成
        features: ["artistic", "stylized"],
        maxResolution: "1024x1024",
        aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2"]
      }
    ]
  },
  {
    id: "image-to-image",
    name: "Image to Image",
    description: "Edit and transform existing images",
    models: [
      {
        id: "nano-banana-edit",
        name: "nano-banana-edit",
        displayName: "Nano Banana Edit",
        provider: "nano_banana",
        providerDisplayName: "Kie.ai Nano Banana",
        credits: 2,
        description: "Image editing with natural language prompts",
        available: true,
        features: ["natural-language-editing", "precise-control"],
        maxResolution: "1024x1024",
        aspectRatios: ["1:1"]
      },
      {
        id: "sd-xl-img2img",
        name: "stable-diffusion-xl-img2img",
        displayName: "Stable Diffusion XL Img2Img",
        provider: "stable_diffusion",
        providerDisplayName: "Stability AI",
        credits: 2,
        description: "Image-to-image transformation using Stable Diffusion",
        available: false, // TODO: 实现Stable Diffusion Img2Img
        features: ["flexible-strength", "style-transfer"],
        maxResolution: "1024x1024",
        aspectRatios: ["1:1", "16:9", "9:16"]
      },
      {
        id: "dalle-edit",
        name: "dall-e-edit",
        displayName: "DALL-E Edit",
        provider: "openai",
        providerDisplayName: "OpenAI",
        credits: 3,
        description: "Precise image editing with DALL-E",
        available: false, // TODO: 实现OpenAI图片编辑
        features: ["inpainting", "outpainting"],
        maxResolution: "1024x1024",
        aspectRatios: ["1:1"]
      }
    ]
  }
];

/**
 * 根据提供商ID获取提供商信息
 */
export function getProviderById(providerId: string) {
  return AI_PROVIDERS[providerId] || null;
}

/**
 * 根据模型ID获取模型信息
 */
export function getModelById(modelId: string): AIModel | null {
  for (const type of IMAGE_GENERATION_TYPES) {
    const model = type.models.find(m => m.id === modelId);
    if (model) {
      return model;
    }
  }
  return null;
}

/**
 * 根据模型ID获取提供商ID
 */
export function getProviderByModelId(modelId: string): string | null {
  const model = getModelById(modelId);
  return model ? model.provider : null;
}

/**
 * 获取可用的模型
 */
export function getAvailableModels(): AIModel[] {
  const allModels: AIModel[] = [];
  
  for (const type of IMAGE_GENERATION_TYPES) {
    allModels.push(...type.models.filter(model => model.available));
  }
  
  return allModels;
}

/**
 * 根据功能类型获取可用模型
 */
export function getAvailableModelsByType(typeId: string): AIModel[] {
  const type = IMAGE_GENERATION_TYPES.find(t => t.id === typeId);
  return type ? type.models.filter(model => model.available) : [];
}

/**
 * 获取推荐的模型（按类型）
 */
export function getRecommendedModel(typeId: string): AIModel | null {
  const availableModels = getAvailableModelsByType(typeId);
  
  // 优先级：最少积分消耗 + 可用性
  return availableModels.sort((a, b) => a.credits - b.credits)[0] || null;
}

/**
 * 计算生成所需积分
 */
export function calculateRequiredCredits(
  modelId: string, 
  options: {
    quality?: string;
    count?: number;
  } = {}
): number {
  const model = getModelById(modelId);
  if (!model) {
    return 1; // 默认积分
  }
  
  let credits = model.credits;
  
  // 根据质量调整
  if (options.quality === 'high') {
    credits = Math.ceil(credits * 1.5);
  } else if (options.quality === 'ultra') {
    credits = Math.ceil(credits * 2);
  }
  
  // 根据数量调整
  if (options.count && options.count > 1) {
    credits *= options.count;
  }
  
  return credits;
}

/**
 * 验证模型是否支持指定功能
 */
export function validateModelFeature(modelId: string, feature: string): boolean {
  const model = getModelById(modelId);
  return model ? model.features.includes(feature) : false;
}

/**
 * 获取模型支持的宽高比
 */
export function getSupportedAspectRatios(modelId: string): string[] {
  const model = getModelById(modelId);
  return model?.aspectRatios || ["1:1"];
}
