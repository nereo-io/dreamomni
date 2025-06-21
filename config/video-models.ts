// 视频模型类型
export enum VideoModelType {
  TEXT_TO_VIDEO = "text-to-video",
  IMAGE_TO_VIDEO = "image-to-video",
}

// 视频模型提供商
export enum VideoModelProvider {
  FAL = "fal", // fal.ai 提供的各种模型 (Seedance, Kling, VEO等)
  VOLCANO = "volcano", // 火山引擎提供的模型 (Doubao-Seedance等)
  APICORE = "apicore", // APICore 提供的模型 (Veo3等)
}

// 视频模型配置接口
export interface VideoModelConfig {
  id: string;
  name: string;
  type: VideoModelType;
  provider: VideoModelProvider;
  falEndpoint?: string; // Optional for non-fal providers
  volcanoModel?: string; // Volcano Engine model ID
  displayName: string;
  perSecondCredits: number; // 每秒积分消耗
  description?: string;
  features?: string[];
  maxDuration?: number;
  supportedAspectRatios?: string[];
  supportsAudio?: boolean;
  supportedDurations?: number[];
  supportedResolutions?: string[]; // 支持的分辨率
  audioPremiumCredits?: number; // 音频额外费用
  estimatedGenerationTime?: number; // 预估生成时间（秒），用于前端倒计时
}

// 视频模型配置
export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  // Doubao-Seedance 1.0 Pro 文本转视频模型 (Volcano Engine)
  "doubao-seedance-1-0-pro-text-to-video": {
    id: "doubao-seedance-1-0-pro-text-to-video",
    name: "Doubao-Seedance 1.0 Pro Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    volcanoModel: "doubao-seedance-1-0-pro-250528",
    displayName: "Seedance 1.0 Pro",
    perSecondCredits: 2, // 7.5 tokens for 5s = 1.5 tokens/second
    description: "Advanced 1080p video generation with cinematic quality",
    features: ["Professional cinematography", "Complex prompt understanding"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportedResolutions: ["480p", "1080p"],
    supportsAudio: false,
    estimatedGenerationTime: 45, // Seedance 预估45秒
    supportedDurations: [5, 10],
  },

  // Doubao-Seedance 1.0 Pro 图片转视频模型 (Volcano Engine)
  "doubao-seedance-1-0-pro-image-to-video": {
    id: "doubao-seedance-1-0-pro-image-to-video",
    name: "Doubao-Seedance 1.0 Pro Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    volcanoModel: "doubao-seedance-1-0-pro-250528",
    displayName: "Seedance 1.0 Pro",
    perSecondCredits: 2, // 7.5 tokens for 5s = 1.5 tokens/second
    description:
      "Transform images into professional 1080p videos with cinematic motion",
    features: ["1080p quality", "Style versatility", "Natural motion"],
    maxDuration: 10,
    supportedAspectRatios: ["adaptive"], // 图片转视频跟随图片尺寸
    supportedResolutions: ["480p", "1080p"],
    supportsAudio: false,
    estimatedGenerationTime: 45, // Seedance 图片转视频预估45秒
    supportedDurations: [5, 10],
  },

  // // Kling 1.6 文本转视频模型 (via fal.ai)
  // "kling-1-6-text-to-video-std": {
  //   id: "kling-1-6-text-to-video-std",
  //   name: "Kling 1.6 Text-to-Video Standard",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/kling-video/v1.6/standard/text-to-video",
  //   displayName: "Kling 1.6 (Standard)",
  //   perSecondCredits: 2, // 10积分/5秒 = 2积分/秒
  //   description: "Cost-effective text-to-video model",
  //   features: ["High value", "Stable quality"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   supportedDurations: [5, 10],
  // },
  // "kling-1-6-text-to-video-pro": {
  //   id: "kling-1-6-text-to-video-pro",
  //   name: "Kling 1.6 Text-to-Video Pro",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/kling-video/v1.6/pro/text-to-video",
  //   displayName: "Kling 1.6 (Pro)",
  //   perSecondCredits: 4, // 20积分/5秒 = 4积分/秒
  //   description: "Professional text-to-video model with higher quality",
  //   features: ["Professional quality", "Fine control", "Rich details"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 120, // Kling Pro 预估2分钟
  //   supportedDurations: [5, 10],
  // },
  // "kling-2-1-text-to-video-master": {
  //   id: "kling-2-1-text-to-video-master",
  //   name: "Kling 2.1 Text-to-Video Master",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/kling-video/v2.1/master/text-to-video",
  //   displayName: "Kling 2.1 (Master)",
  //   perSecondCredits: 12, // 60积分/5秒 = 12积分/秒
  //   description: "Latest generation text-to-video model with top-tier quality",
  //   features: ["Latest technology", "Cinematic quality", "Smooth motion"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   supportedDurations: [5, 10],
  // },

  // // Kling 图片转视频模型 (via fal.ai)
  // "kling-1-6-image-to-video-std": {
  //   id: "kling-1-6-image-to-video-std",
  //   name: "Kling 1.6 Image-to-Video Standard",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/kling-video/v1.6/standard/image-to-video",
  //   displayName: "Kling 1.6 (Standard)",
  //   perSecondCredits: 2, // 10积分/5秒 = 2积分/秒
  //   description: "Cost-effective image-to-video model",
  //   features: ["High value", "Fast generation", "Stable quality"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   supportedDurations: [5, 10],
  // },
  // "kling-2-1-image-to-video-std": {
  //   id: "kling-2-1-image-to-video-std",
  //   name: "Kling 2.1 Image-to-Video Standard",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/kling-video/v2.1/standard/image-to-video",
  //   displayName: "Kling 2.1 (Standard)",
  //   perSecondCredits: 2, // 10积分/5秒 = 2积分/秒
  //   description: "Next-generation image-to-video standard model",
  //   features: ["New technology", "Enhanced quality", "Natural motion"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   supportedDurations: [5, 10],
  // },
  // "kling-2-1-image-to-video-pro": {
  //   id: "kling-2-1-image-to-video-pro",
  //   name: "Kling 2.1 Image-to-Video Pro",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/kling-video/v2.1/pro/image-to-video",
  //   displayName: "Kling 2.1 (Pro)",
  //   perSecondCredits: 4, // 20积分/5秒 = 4积分/秒
  //   description: "Professional image-to-video model",
  //   features: ["Professional quality", "Fine control", "Rich details"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 150, // Kling 2.1 Pro 预估2.5分钟
  //   supportedDurations: [5, 10],
  // },
  // "kling-2-1-image-to-video-master": {
  //   id: "kling-2-1-image-to-video-master",
  //   name: "Kling 2.1 Image-to-Video Master",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/kling-video/v2.1/master/image-to-video",
  //   displayName: "Kling 2.1 (Master)",
  //   perSecondCredits: 12, // 60积分/5秒 = 12积分/秒
  //   description: "Top-tier image-to-video model with highest quality",
  //   features: ["Latest technology", "Cinematic quality", "Smooth motion"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   supportedDurations: [5, 10],
  // },

  // Veo3 APICore 文本转视频模型（新ID）
  "veo3-apicore-text-to-video": {
    id: "veo3-apicore-text-to-video",
    name: "Veo3 APICore Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.APICORE,
    displayName: "Veo 3",
    perSecondCredits: 5,
    description: "Google's Veo3 model for text-to-video generation",
    features: ["High quality", "Upsample support", "Audio generation"],
    maxDuration: 8, // 根据用户要求设置为8秒
    supportedAspectRatios: ["adaptive"], // 根据用户要求设置为adaptive
    supportsAudio: true, // 根据用户要求支持音频
    estimatedGenerationTime: 240, // Veo3 预估4分钟（基于实际数据：平均3.77分钟，取整到4分钟）
    supportedDurations: [8],
    supportedResolutions: ["1080p"], // Veo3支持高分辨率
  },

  // Veo3 APICore 图片转视频模型
  // "veo3-apicore-image-to-video": {
  //   id: "veo3-apicore-image-to-video",
  //   name: "Veo3 APICore Image-to-Video",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.APICORE,
  //   displayName: "Veo 3",
  //   perSecondCredits: 5, // 与文本转视频同样的积分消耗
  //   description: "Google's Veo3 model for image-to-video generation",
  //   features: ["High quality", "Upsample support", "Audio generation"],
  //   maxDuration: 8,
  //   supportedAspectRatios: ["adaptive"], // 图片转视频跟随图片尺寸
  //   supportsAudio: true,
  //   estimatedGenerationTime: 240, // 与文本转视频相同的预估时间
  //   supportedDurations: [8],
  //   supportedResolutions: ["1080p"],
  // },
};

// 辅助函数
export function getVideoModel(modelId: string): VideoModelConfig | undefined {
  return VIDEO_MODELS[modelId];
}

export function getVideoModelsByType(type: VideoModelType): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter((model) => model.type === type);
}

export function getTextToVideoModels(): VideoModelConfig[] {
  return getVideoModelsByType(VideoModelType.TEXT_TO_VIDEO).filter(
    (model) => !model.name.includes("Legacy")
  );
}

export function getImageToVideoModels(): VideoModelConfig[] {
  return getVideoModelsByType(VideoModelType.IMAGE_TO_VIDEO).filter(
    (model) => !model.name.includes("Legacy")
  );
}

export function getFalModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.provider === VideoModelProvider.FAL
  );
}

export function getVolcanoModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.provider === VideoModelProvider.VOLCANO
  );
}

export function getVeo3Models(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.provider === VideoModelProvider.APICORE
  );
}

export function getKlingModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter((model) =>
    model.id.includes("kling-")
  );
}

// 兼容性函数 - 获取所有 Seedance 模型（不分提供商）
export function getSeedanceModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.name.includes("Seedance") || model.id.includes("seedance")
  );
}

export function calculateCredits(
  modelId: string,
  duration: number,
  hasAudio: boolean = false,
  resolution: string = "1080p"
): number {
  const model = getVideoModel(modelId);
  if (!model) return 0;

  // 统一按秒计费，基础积分以 480p 为基准
  let totalCredits = duration * model.perSecondCredits;

  // 根据分辨率调整积分（仅对 Seedance 模型生效）
  if (isSeedanceModel(modelId)) {
    if (resolution === "1080p") {
      // 1080p 价格是 480p 的 5 倍
      totalCredits *= 5;
    }
    // 480p 保持原价格不变
  }

  // Veo3 模型支持音频，需要额外费用
  if (model.id.includes("veo3") && hasAudio && model.audioPremiumCredits) {
    totalCredits += duration * model.audioPremiumCredits;
  }

  return Math.round(totalCredits);
}

// 获取所有支持的模型ID（用于API验证）
export function getSupportedModelIds(): string[] {
  return Object.keys(VIDEO_MODELS);
}

// 检查模型是否为图片转视频类型
export function isImageToVideoModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  return model?.type === VideoModelType.IMAGE_TO_VIDEO;
}

// 检查模型是否为Kling模型
export function isKlingModel(modelId: string): boolean {
  return modelId.includes("kling-");
}

// 检查模型是否为Veo2模型
export function isVeo2Model(modelId: string): boolean {
  return modelId.includes("veo2-");
}

// 检查模型是否为Veo3模型
export function isVeo3Model(modelId: string): boolean {
  return modelId.includes("veo3-");
}

// 检查模型是否为Seedance模型（兼容两种提供商）
export function isSeedanceModel(modelId: string): boolean {
  return modelId.includes("seedance-");
}

// 检查模型是否为Volcano Engine模型
export function isVolcanoModel(modelId: string): boolean {
  return modelId.includes("doubao-");
}

// 检查模型是否为fal.ai提供的模型
export function isFalModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  return model?.provider === VideoModelProvider.FAL;
}

// 检查模型是否为Veo3 APICore模型
export function isVeo3ApicoreModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  return model?.provider === VideoModelProvider.APICORE;
}

// 检查模型是否为Veo系列模型
export function isVeoModel(modelId: string): boolean {
  return isVeo2Model(modelId) || isVeo3Model(modelId);
}

// 获取模型提供商
export function getModelProvider(modelId: string): VideoModelProvider | null {
  const model = getVideoModel(modelId);
  return model?.provider || null;
}

// 检查模型是否支持音频
export function modelSupportsAudio(modelId: string): boolean {
  const model = getVideoModel(modelId);
  return model?.supportsAudio || false;
}

// 获取模型价格信息（每秒）
export function getModelPricing(modelId: string): {
  perSecondCredits: number;
  perSecondUSD: number;
  audioExtraCredits?: number;
  audioExtraUSD?: number;
} | null {
  const model = getVideoModel(modelId);
  if (!model) return null;

  const result = {
    perSecondCredits: model.perSecondCredits,
    perSecondUSD: model.perSecondCredits * 0.025, // 1积分 = $0.025
  };

  if (model.audioPremiumCredits) {
    return {
      ...result,
      audioExtraCredits: model.audioPremiumCredits,
      audioExtraUSD: model.audioPremiumCredits * 0.025,
    };
  }

  return result;
}
