// 视频模型类型
export enum VideoModelType {
  TEXT_TO_VIDEO = "text-to-video",
  IMAGE_TO_VIDEO = "image-to-video",
}

// 视频模型提供商
export enum VideoModelProvider {
  KLING = "kling",
  VEO2 = "veo2",
  VEO3 = "veo3",
}

// 视频模型配置接口
export interface VideoModelConfig {
  id: string;
  name: string;
  type: VideoModelType;
  provider: VideoModelProvider;
  falEndpoint: string;
  displayName: string;
  perSecondCredits: number; // 每秒积分消耗
  description?: string;
  features?: string[];
  maxDuration?: number;
  supportedAspectRatios?: string[];
  supportsAudio?: boolean;
  supportedDurations?: number[];
  audioPremiumCredits?: number; // 音频额外费用
}

// 视频模型配置
export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  // Kling 1.6 文本转视频模型
  "kling-1-6-text-to-video-std": {
    id: "kling-1-6-text-to-video-std",
    name: "Kling 1.6 Text-to-Video Standard",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.KLING,
    falEndpoint: "fal-ai/kling-video/v1.6/standard/text-to-video",
    displayName: "Kling 1.6 (Standard)",
    perSecondCredits: 2, // 10积分/5秒 = 2积分/秒
    description: "Cost-effective text-to-video model",
    features: ["High value", "Stable quality"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: false,
    supportedDurations: [5, 10],
  },
  "kling-1-6-text-to-video-pro": {
    id: "kling-1-6-text-to-video-pro",
    name: "Kling 1.6 Text-to-Video Pro",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.KLING,
    falEndpoint: "fal-ai/kling-video/v1.6/pro/text-to-video",
    displayName: "Kling 1.6 (Pro)",
    perSecondCredits: 4, // 20积分/5秒 = 4积分/秒
    description: "Professional text-to-video model with higher quality",
    features: ["Professional quality", "Fine control", "Rich details"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: false,
    supportedDurations: [5, 10],
  },
  "kling-2-1-text-to-video-master": {
    id: "kling-2-1-text-to-video-master",
    name: "Kling 2.1 Text-to-Video Master",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.KLING,
    falEndpoint: "fal-ai/kling-video/v2.1/master/text-to-video",
    displayName: "Kling 2.1 (Master)",
    perSecondCredits: 12, // 60积分/5秒 = 12积分/秒
    description: "Latest generation text-to-video model with top-tier quality",
    features: ["Latest technology", "Cinematic quality", "Smooth motion"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: false,
    supportedDurations: [5, 10],
  },

  // Kling 图片转视频模型
  "kling-1-6-image-to-video-std": {
    id: "kling-1-6-image-to-video-std",
    name: "Kling 1.6 Image-to-Video Standard",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.KLING,
    falEndpoint: "fal-ai/kling-video/v1.6/standard/image-to-video",
    displayName: "Kling 1.6 (Standard)",
    perSecondCredits: 2, // 10积分/5秒 = 2积分/秒
    description: "Cost-effective image-to-video model",
    features: ["High value", "Fast generation", "Stable quality"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: false,
    supportedDurations: [5, 10],
  },
  // "kling-2-1-image-to-video-std": {
  //   id: "kling-2-1-image-to-video-std",
  //   name: "Kling 2.1 Image-to-Video Standard",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.KLING,
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
  "kling-2-1-image-to-video-pro": {
    id: "kling-2-1-image-to-video-pro",
    name: "Kling 2.1 Image-to-Video Pro",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.KLING,
    falEndpoint: "fal-ai/kling-video/v2.1/pro/image-to-video",
    displayName: "Kling 2.1 (Pro)",
    perSecondCredits: 4, // 20积分/5秒 = 4积分/秒
    description: "Professional image-to-video model",
    features: ["Professional quality", "Fine control", "Rich details"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: false,
    supportedDurations: [5, 10],
  },
  "kling-2-1-image-to-video-master": {
    id: "kling-2-1-image-to-video-master",
    name: "Kling 2.1 Image-to-Video Master",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.KLING,
    falEndpoint: "fal-ai/kling-video/v2.1/master/image-to-video",
    displayName: "Kling 2.1 (Master)",
    perSecondCredits: 12, // 60积分/5秒 = 12积分/秒
    description: "Top-tier image-to-video model with highest quality",
    features: ["Latest technology", "Cinematic quality", "Smooth motion"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: false,
    supportedDurations: [5, 10],
  },

  // VEO2 模型系列
  "veo2-image-to-video": {
    id: "veo2-image-to-video",
    name: "Veo2 Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.VEO2,
    falEndpoint: "fal-ai/veo2/image-to-video",
    displayName: "Veo2 (Image)",
    perSecondCredits: 20, // $0.50 = 20积分/秒
    description: "Convert static images into animated videos",
    features: ["720p resolution", "Natural animations", "Image input"],
    maxDuration: 8,
    supportedAspectRatios: ["16:9", "9:16"],
    supportsAudio: false,
    supportedDurations: [5, 8],
  },

  // Veo3 模型系列
  "veo3-text-to-video": {
    id: "veo3-text-to-video",
    name: "Veo3 Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.VEO3,
    falEndpoint: "fal-ai/veo3",
    displayName: "Veo3 (Audio)",
    perSecondCredits: 20, // $0.50 = 20积分/秒 (无音频)
    description: "Latest generation text-to-video with audio (16:9, 8s only)",
    features: ["720p resolution", "Audio generation", "Latest technology"],
    maxDuration: 8,
    supportedAspectRatios: ["16:9"], // 仅支持 16:9
    supportsAudio: true,
    supportedDurations: [8], // 仅支持 8 秒
    audioPremiumCredits: 10, // $0.25 = 10积分/秒 音频额外费用
  },
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

export function calculateCredits(
  modelId: string,
  duration: number,
  hasAudio: boolean = false
): number {
  const model = getVideoModel(modelId);
  if (!model) return 0;

  // 统一按秒计费
  let totalCredits = duration * model.perSecondCredits;

  // Veo3 模型支持音频，需要额外费用
  if (
    model.provider === VideoModelProvider.VEO3 &&
    hasAudio &&
    model.audioPremiumCredits
  ) {
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
