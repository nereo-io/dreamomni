// 视频模型类型
export enum VideoModelType {
  TEXT_TO_VIDEO = "text-to-video",
  IMAGE_TO_VIDEO = "image-to-video",
}

// 视频模型配置接口
export interface VideoModelConfig {
  id: string;
  name: string;
  type: VideoModelType;
  falEndpoint: string;
  displayName: string;
  credits5s: number;
  credits10s?: number;
  description?: string;
  features?: string[];
  maxDuration?: number;
  supportedAspectRatios?: string[];
}

// 视频模型配置
export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  // Kling 1.6 文本转视频模型
  "kling-1-6-text-to-video-std": {
    id: "kling-1-6-text-to-video-std",
    name: "Kling 1.6 Text-to-Video Standard",
    type: VideoModelType.TEXT_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v1.6/standard/text-to-video",
    displayName: "Kling 1.6 (Standard)",
    credits5s: 10,
    credits10s: 20,
    description: "Cost-effective text-to-video model",
    features: ["High value", "Fast generation", "Stable quality"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },
  "kling-1-6-text-to-video-pro": {
    id: "kling-1-6-text-to-video-pro",
    name: "Kling 1.6 Text-to-Video Pro",
    type: VideoModelType.TEXT_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v1.6/pro/text-to-video",
    displayName: "Kling 1.6 (Pro)",
    credits5s: 20,
    credits10s: 40,
    description: "Professional text-to-video model with higher quality",
    features: ["Professional quality", "Fine control", "Rich details"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },
  "kling-2-1-text-to-video-master": {
    id: "kling-2-1-text-to-video-master",
    name: "Kling 2.1 Text-to-Video Master",
    type: VideoModelType.TEXT_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v2.1/master/text-to-video",
    displayName: "Kling 2.1 (Master)",
    credits5s: 60,
    credits10s: 120,
    description: "Latest generation text-to-video model with top-tier quality",
    features: ["Latest technology", "Cinematic quality", "Smooth motion"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },

  // Kling 图片转视频模型
  "kling-1-6-image-to-video-std": {
    id: "kling-1-6-image-to-video-std",
    name: "Kling 1.6 Image-to-Video Standard",
    type: VideoModelType.IMAGE_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v1.6/standard/image-to-video",
    displayName: "Kling 1.6 (Standard)",
    credits5s: 10,
    credits10s: 20,
    description: "Cost-effective image-to-video model",
    features: ["High value", "Fast generation", "Stable quality"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },
  "kling-2-1-image-to-video-std": {
    id: "kling-2-1-image-to-video-std",
    name: "Kling 2.1 Image-to-Video Standard",
    type: VideoModelType.IMAGE_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v2.1/standard/image-to-video",
    displayName: "Kling 2.1 (Standard)",
    credits5s: 10,
    credits10s: 20,
    description: "Next-generation image-to-video standard model",
    features: ["New technology", "Enhanced quality", "Natural motion"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },
  "kling-2-1-image-to-video-pro": {
    id: "kling-2-1-image-to-video-pro",
    name: "Kling 2.1 Image-to-Video Pro",
    type: VideoModelType.IMAGE_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v2.1/pro/image-to-video",
    displayName: "Kling 2.1 (Pro)",
    credits5s: 20,
    credits10s: 40,
    description: "Professional image-to-video model",
    features: ["Professional quality", "Fine control", "Rich details"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },
  "kling-2-1-image-to-video-master": {
    id: "kling-2-1-image-to-video-master",
    name: "Kling 2.1 Image-to-Video Master",
    type: VideoModelType.IMAGE_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v2.1/master/image-to-video",
    displayName: "Kling 2.1 (Master)",
    credits5s: 60,
    credits10s: 120,
    description: "Top-tier image-to-video model with highest quality",
    features: ["Latest technology", "Cinematic quality", "Smooth motion"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },

  // 向后兼容
  "kling-1-6-text-to-video": {
    id: "kling-1-6-text-to-video",
    name: "Kling 1.6 Text-to-Video (Legacy)",
    type: VideoModelType.TEXT_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v1.6/standard/text-to-video",
    displayName: "Kling 1.6 (Legacy)",
    credits5s: 10,
    credits10s: 20,
    description: "Legacy compatibility version",
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
  },
  "kling-1-6": {
    id: "kling-1-6",
    name: "Kling 1.6 Image-to-Video (Legacy)",
    type: VideoModelType.IMAGE_TO_VIDEO,
    falEndpoint: "fal-ai/kling-video/v1.6/standard/image-to-video",
    displayName: "Kling 1.6 (Legacy)",
    credits5s: 10,
    credits10s: 20,
    description: "Legacy compatibility version",
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
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

export function calculateCredits(modelId: string, duration: number): number {
  const model = getVideoModel(modelId);
  if (!model) return 0;

  if (duration <= 5) {
    return model.credits5s;
  } else if (duration <= 10 && model.credits10s) {
    return model.credits10s;
  }

  // 默认按5秒计算
  return model.credits5s;
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
