// 视频模型类型
export enum VideoModelType {
  TEXT_TO_VIDEO = "text-to-video",
  IMAGE_TO_VIDEO = "image-to-video",
}

// 视频模型提供商
export enum VideoModelProvider {
  FAL = "fal", // fal.ai 提供的各种模型 (Seedance, Kling, VEO等)
  VOLCANO = "volcano", // 火山引擎提供的模型 (Doubao-Seedance等)
  BYTEPLUS = "byteplus", // BytePlus 提供的模型 (Southeast Asia)
  APICORE = "apicore", // APICore 提供的模型 (Veo3等)
  KIEAI = "kieai", // Kie.ai 提供的模型 (Veo3等)
  ALI = "ali", // 阿里百炼提供的模型
  EVOLINK = "evolink", // Evolink 提供的模型
}

// 实际 AI 模型枚举（与 model_id/provider 无关）
export enum VideoModel {
  SEEDANCE_1_5_PRO = "seedance-1.5-pro",
  SEEDANCE_1_0_PRO = "seedance-1.0-pro",
  VEO3 = "veo3",
  SORA2 = "sora2",
}

// 视频模型配置接口
export interface VideoModelConfig {
  id: string;
  name: string;
  type: VideoModelType;
  provider: VideoModelProvider;
  falEndpoint?: string; // Optional for non-fal providers
  volcanoModel?: string; // Volcano Engine model ID
  aliModel?: string; // Ali Cloud model ID
  providerModelId?: string; // Provider API 使用的模型标识（通用字段，新 provider 统一用此字段）
  displayName: string;
  perSecondCredits: number; // 每秒积分消耗
  description?: string;
  features?: string[];
  maxDuration?: number;
  supportedAspectRatios?: string[];
  supportsAudio?: boolean;
  audioOptional?: boolean; // true = user can toggle audio; false/undefined = audio always on (if supportsAudio)
  supportedDurations?: number[];
  internalSupportedDurations?: number[]; // 仅内部 API 可用的额外时长（不在前端 UI 展示）
  supportedResolutions?: string[]; // 支持的分辨率
  audioPremiumCredits?: number; // 音频额外费用
  estimatedGenerationTime?: number; // 预估生成时间（秒），用于前端倒计时
  requiresMembership?: boolean; // 是否需要会员才能选择
  generationType?: string; // 视频生成类型（如 REFERENCE_2_VIDEO）
  internal?: boolean; // 是否为内部使用模型，不在前端UI显示（如 Storyboard）
  imageCapabilities?: {
    maxImages: number; // 支持的最大图片数量（1-3）
    minImages?: number; // 最小图片数量（可选）
    labels?: string[]; // 图片标签，如 ['First Frame', 'Last Frame']
  };
  /** The actual AI model this config represents */
  modelName?: VideoModel;
  /**
   * Fallback model IDs (keys in VIDEO_MODELS) tried in order when primary fails.
   * Fallback entries should be internal models (internal: true).
   */
  fallbackProvider?: string[];
}

// 视频模型配置
export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  // BytePlus Seedance 1.5 Pro 文本转视频模型 (Southeast Asia)
  "byteplus-seedance-1-5-pro-text-to-video": {
    id: "byteplus-seedance-1-5-pro-text-to-video",
    name: "BytePlus Seedance 1.5 Pro Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.BYTEPLUS,
    modelName: VideoModel.SEEDANCE_1_5_PRO,
    volcanoModel: "ep-20251223205943-d8rhb", //hugeroger@gmail.com
    // volcanoModel: "ep-20251228123459-x2ccs",   //mackensonsouverain34@gmail.com
    // volcanoModel: "ep-20251230222441-b27wd",   //baziai012@gmail.com
    displayName: "Seedance 1.5 Pro",
    perSecondCredits: 1,
    description: "ByteDance's lastest video model",
    features: ["Wait 60s", "Audio"],
    maxDuration: 12,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supportedResolutions: ["480p", "720p", "1080p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 60,
    supportedDurations: [4, 8, 10, 12],
    internalSupportedDurations: [5],
  },

  // BytePlus Seedance 1.5 Pro 图片转视频模型 (Southeast Asia)
  "byteplus-seedance-1-5-pro-image-to-video": {
    id: "byteplus-seedance-1-5-pro-image-to-video",
    name: "BytePlus Seedance 1.5 Pro Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.BYTEPLUS,
    modelName: VideoModel.SEEDANCE_1_5_PRO,
    volcanoModel: "ep-20251223205943-d8rhb", //hugeroger@gmail.com
    // volcanoModel: "ep-20251228123459-x2ccs",   //mackensonsouverain34@gmail.com
    // volcanoModel: "ep-20251230222441-b27wd",   //baziai012@gmail.com
    displayName: "Seedance 1.5 Pro",
    perSecondCredits: 1,
    description: "ByteDance's lastest video model",
    features: ["Wait 60s", "Audio", "Surpport 2 images"],
    maxDuration: 12,
    supportedAspectRatios: ["Auto"],
    supportedResolutions: ["480p", "720p", "1080p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 60,
    supportedDurations: [4, 8, 10, 12],
    internalSupportedDurations: [5],
    imageCapabilities: {
      maxImages: 2,
      labels: ["First Frame", "Last Frame"],
    },
  },

  // Kie.ai Veo3 文本转视频模型(基于 Kie.ai API)
  "kie-veo3-text-to-video": {
    id: "kie-veo3-text-to-video",
    name: "Kie.ai Veo3 Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.KIEAI,
    modelName: VideoModel.VEO3,
    displayName: "Veo 3.1",
    perSecondCredits: 0.75,
    description: "Google's Veo3.1 model, starting at $0.36/video",
    features: ["Wait 120s", "Audio"],
    maxDuration: 8, // Kie.ai Veo3 默认5秒
    supportedAspectRatios: ["Auto", "16:9", "9:16"],
    supportsAudio: true, // 根据用户要求支持音频
    estimatedGenerationTime: 120,
    supportedDurations: [8],
    supportedResolutions: ["720p", "1080p", "4k"], // 支持720p/1080p/4K分辨率
  },

  // Kie.ai Veo3 图片转视频模型
  "kie-veo3-image-to-video": {
    id: "kie-veo3-image-to-video",
    name: "Kie.ai Veo3 Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.KIEAI,
    modelName: VideoModel.VEO3,
    displayName: "Veo 3.1",
    perSecondCredits: 0.75, // 与文本转视频同样的积分消耗
    description: "Google's Veo3.1 model, starting at $0.36/video",
    features: ["Wait 120s", "Audio", "Support 2 images"],
    maxDuration: 8, // Kie.ai Veo3 默认5秒
    supportedAspectRatios: ["Auto", "16:9", "9:16"],
    supportsAudio: true, // 根据用户要求支持音频
    estimatedGenerationTime: 120,
    supportedDurations: [8],
    supportedResolutions: ["720p", "1080p", "4k"], // 支持720p/1080p/4K分辨率
    imageCapabilities: {
      maxImages: 2, // 支持1-2张图片(首帧、尾帧)
      labels: ["First Frame", "Last Frame"],
    },
  },

  // Kie.ai Veo3 Reference-to-Video 模型(一致角色生成)
  "kie-veo3-reference-to-video": {
    id: "kie-veo3-reference-to-video", // 使用独立的 ID,通过 generationType 区分
    name: "Veo3 Reference-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.KIEAI,
    modelName: VideoModel.VEO3,
    displayName: "Veo 3.1 (Consistent Character)",
    perSecondCredits: 0.75,
    description:
      "Create videos with consistent character identity using 1-3 reference images",
    features: ["Wait 240s", "Character Consistency", "1-3 Reference Images"],
    supportedAspectRatios: ["16:9", "9:16"], // REFERENCE_2_VIDEO 支持 16:9 和 9:16
    supportedDurations: [8], // 固定 8 秒
    supportedResolutions: ["720p", "1080p", "4k"], // 支持720p/1080p/4K分辨率
    supportsAudio: false, // Reference-to-Video 不支持音频
    imageCapabilities: {
      maxImages: 3, // 支持 1-3 张参考图片
      minImages: 1, // 至少 1 张
      labels: ["Reference 1", "Reference 2", "Reference 3"],
    },
    estimatedGenerationTime: 240,
    generationType: "REFERENCE_2_VIDEO", // 标识这是 Reference-to-Video 模式
  },

  // Doubao-Seedance 1.0 Pro 文本转视频模型 (Volcano Engine)
  // "doubao-seedance-1-0-pro-text-to-video": {
  //   id: "doubao-seedance-1-0-pro-text-to-video",
  //   name: "Doubao-Seedance 1.0 Pro Text-to-Video",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.VOLCANO,
  //   volcanoModel: "doubao-seedance-1-0-pro-250528",
  //   displayName: "Seedance 1.0 Pro",
  //   perSecondCredits: 2,
  //   description: "ByteDance's video model, starting at $0.3/video",
  //   features: ["wait 45s"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportedResolutions: ["480p", "1080p"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 45, // Seedance 预估45秒
  //   supportedDurations: [5, 10],
  // },

  // Doubao-Seedance 1.0 Pro 图片转视频模型 (Volcano Engine)
  // "doubao-seedance-1-0-pro-image-to-video": {
  //   id: "doubao-seedance-1-0-pro-image-to-video",
  //   name: "Doubao-Seedance 1.0 Pro Image-to-Video",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.VOLCANO,
  //   volcanoModel: "doubao-seedance-1-0-pro-250528",
  //   displayName: "Seedance 1.0 Pro",
  //   perSecondCredits: 2, // 7.5 tokens for 5s = 1.5 tokens/second
  //   description: "ByteDance's video model, starting at $0.3/video",
  //   features: ["wait 45s"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["auto"], // 图片转视频跟随图片尺寸
  //   supportedResolutions: ["480p", "1080p"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 45, // Seedance 图片转视频预估45秒
  //   supportedDurations: [5, 10],
  // },
  // Sora 2 文本转视频模型 (Evolink)
  "sora-2-text-to-video": {
    id: "sora-2-text-to-video",
    name: "Sora 2 Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.EVOLINK,
    providerModelId: "sora-2-beta-max",
    modelName: VideoModel.SORA2,
    displayName: "Sora 2",
    perSecondCredits: 0.6, // 10秒6积分, 15秒9积分
    description: "OpenAI's Sora 2 model",
    features: ["Wait 300s", "Audio"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16"],
    supportsAudio: true,
    estimatedGenerationTime: 300, // 预估5分钟
    supportedDurations: [10, 15],
    supportedResolutions: ["1080p"], // 固定1080p HD
    requiresMembership: true,
  },

  // Sora 2 图片转视频模型 (Evolink)
  "sora-2-image-to-video": {
    id: "sora-2-image-to-video",
    name: "Sora 2 Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.EVOLINK,
    providerModelId: "sora-2-beta-max",
    modelName: VideoModel.SORA2,
    displayName: "Sora 2",
    perSecondCredits: 0.6, // 10秒6积分, 15秒9积分
    description: "OpenAI's Sora 2 model",
    features: ["Wait 300s", "Audio"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16"],
    supportsAudio: true,
    estimatedGenerationTime: 300, // 预估5分钟
    supportedDurations: [10, 15],
    supportedResolutions: ["1080p"], // 固定1080p HD
    requiresMembership: true,
    imageCapabilities: {
      maxImages: 1, // 目前只支持单张图片
    },
  },
  // BytePlus Seedance 1.0 Pro 文本转视频模型 (Southeast Asia) - legacy ordering
  "byteplus-seedance-pro-text-to-video": {
    id: "byteplus-seedance-pro-text-to-video",
    name: "BytePlus Seedance Pro Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.BYTEPLUS,
    modelName: VideoModel.SEEDANCE_1_0_PRO,
    // volcanoModel: "seedance-1-0-pro-250528",
    volcanoModel: "ep-20250915143914-m57vr", //hugeroger@gmail.com
    //volcanoModel: "ep-20251031184345-xbr8l", //acostaandreab0@gmail.com
    // volcanoModel: "ep-20251122104716-5krl8", //mackensonsouverain34@gmail.com
    // volcanoModel: "ep-20251230222856-s5ln9", //baziai012@gmail.com
    displayName: "Seedance 1.0 Pro",
    perSecondCredits: 2,
    description: "ByteDance's video model, starting at $0.3/video",
    features: ["Wait 30s", "Direct Access"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportedResolutions: ["480p", "1080p"],
    supportsAudio: false,
    estimatedGenerationTime: 30,
    supportedDurations: [5, 10],
    // requiresMembership: true,
  },

  // BytePlus Seedance Pro 图片转视频模型 (Southeast Asia)
  "byteplus-seedance-pro-image-to-video": {
    id: "byteplus-seedance-pro-image-to-video",
    name: "BytePlus Seedance Pro Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.BYTEPLUS,
    modelName: VideoModel.SEEDANCE_1_0_PRO,
    // volcanoModel: "seedance-1-0-pro-250528",
    volcanoModel: "ep-20250915143914-m57vr", //hugeroger@gmail.com
    // volcanoModel: "ep-20251031184345-xbr8l", //acostaandreab0@gmail.com
    // volcanoModel: "ep-20251122104716-5krl8", //mackensonsouverain34@gmail.com
    // volcanoModel: "ep-20251230222856-s5ln9", //baziai012@gmail.com
    displayName: "Seedance 1.0 Pro",
    perSecondCredits: 2,
    description: "ByteDance's video model, starting at $0.3/video",
    features: ["Wait 30s", "Direct Access"],
    maxDuration: 10,
    supportedAspectRatios: ["Auto"],
    supportedResolutions: ["480p", "1080p"],
    supportsAudio: false,
    estimatedGenerationTime: 30,
    supportedDurations: [5, 10],
    // requiresMembership: true,
  },

  // Kie.ai Sora 2 Pro 文本转视频模型
  // "sora-2-pro-text-to-video": {
  //   id: "sora-2-pro-text-to-video",
  //   name: "Sora 2 Pro Text-to-Video",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.KIEAI,
  //   displayName: "Sora 2 Pro",
  //   perSecondCredits: 6, // 6x 标准版 (1 * 6 = 6)
  //   description: "OpenAI's Sora 2 Pro model with enhanced quality",
  //   features: ["Wait 600s", "Audio"],
  //   maxDuration: 15,
  //   supportedAspectRatios: ["16:9", "9:16"],
  //   supportsAudio: true,
  //   estimatedGenerationTime: 600, // Pro 版本可能更慢
  //   supportedDurations: [10, 15],
  //   supportedResolutions: ["1080p"], // 固定1080p
  //   requiresMembership: true,
  // },

  // // Kie.ai Sora 2 Pro 图片转视频模型
  // "sora-2-pro-image-to-video": {
  //   id: "sora-2-pro-image-to-video",
  //   name: "Sora 2 Pro Image-to-Video",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.KIEAI,
  //   displayName: "Sora 2 Pro",
  //   perSecondCredits: 6, // 6x 标准版 (1 * 6 = 6)
  //   description: "OpenAI's Sora 2 Pro model with enhanced quality",
  //   features: ["Wait 600s", "Audio"],
  //   maxDuration: 15,
  //   supportedAspectRatios: ["16:9", "9:16"],
  //   supportsAudio: true,
  //   estimatedGenerationTime: 600,
  //   supportedDurations: [10, 15],
  //   supportedResolutions: ["1080p"], // 固定1080p
  //   requiresMembership: true,
  //   imageCapabilities: {
  //     maxImages: 1,
  //   },
  // },

  // // Kie.ai Sora 2 Pro Storyboard (仅 API 支持，前端不显示)
  // "sora-2-pro-storyboard": {
  //   id: "sora-2-pro-storyboard",
  //   name: "Sora 2 Pro Storyboard",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.KIEAI,
  //   displayName: "Sora 2 Pro Storyboard",
  //   perSecondCredits: 6, // 6x 标准版 (1 * 6 = 6)
  //   description: "Multi-image sequence video generation (2-8 images)",
  //   features: ["Wait 900s", "Multi-Image", "Extended Duration"],
  //   maxDuration: 25,
  //   supportedAspectRatios: ["16:9", "9:16"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 900, // Storyboard 可能需要更长时间
  //   supportedDurations: [10, 15, 25],
  //   supportedResolutions: ["1080p"],
  //   requiresMembership: true,
  //   internal: true, // 标记为内部使用，前端不显示
  //   imageCapabilities: {
  //     minImages: 2,
  //     maxImages: 8,
  //   },
  // },
  // MiniMax Hailuo02 文本转视频模型 (via fal.ai)
  // "minimax-hailuo02-text-to-video": {
  //   id: "minimax-hailuo02-text-to-video",
  //   name: "MiniMax Hailuo 02 Text-to-Video",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/minimax/hailuo-02/standard/text-to-video",
  //   displayName: "Hailuo 02",
  //   perSecondCredits: 4, // $0.045/秒 = 1.8积分/秒，取整为2
  //   description: "MiniMax's video model",
  //   features: ["wait 200s", "Instruction Following"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["auto"],
  //   supportedResolutions: ["768p"], // 固定768p分辨率
  //   supportsAudio: false,
  //   estimatedGenerationTime: 200, // 预估4分钟
  //   supportedDurations: [6, 10], // 支持6秒和10秒
  // },

  // MiniMax Hailuo02 图片转视频模型 (via fal.ai)
  // "minimax-hailuo02-image-to-video": {
  //   id: "minimax-hailuo02-image-to-video",
  //   name: "MiniMax Hailuo 02 Image-to-Video",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.FAL,
  //   falEndpoint: "fal-ai/minimax/hailuo-02/standard/image-to-video",
  //   displayName: "Hailuo 02",
  //   perSecondCredits: 2, // 默认768p价格，512p会在计算时特殊处理
  //   description: "MiniMax's video model",
  //   features: ["wait 200s", "Instruction Following"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["auto"], // 图片转视频跟随图片尺寸
  //   supportedResolutions: ["512p", "768p"], // 支持两种分辨率
  //   supportsAudio: false,
  //   estimatedGenerationTime: 200, // 预估4分钟
  //   supportedDurations: [6, 10], // 支持6秒和10秒
  // },

  // 阿里百炼 文本转视频模型
  // "ali-video-generation-text-to-video": {
  //   id: "ali-video-generation-text-to-video",
  //   name: "Ali Video Generation Text-to-Video",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.ALI,
  //   aliModel: "wan2.2-t2v-plus", // 阿里云实际使用的模型ID
  //   displayName: "Wan2.2",
  //   perSecondCredits: 3,
  //   description: "Ali Video Generation model, starting at $0.5/video",
  //   features: ["wait 120s"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportedResolutions: ["480p", "1080p"],
  //   supportsAudio: false,
  //   supportedDurations: [5],
  //   estimatedGenerationTime: 90,
  // },

  // 阿里百炼 图片转视频模型
  // "ali-video-generation-image-to-video": {
  //   id: "ali-video-generation-image-to-video",
  //   name: "Ali Video Generation Image-to-Video",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.ALI,
  //   aliModel: "wan2.2-i2v-plus", // 阿里云实际使用的模型ID
  //   displayName: "Wan2.2",
  //   perSecondCredits: 3,
  //   description: "Ali Video Generation model, starting at $0.5/video",
  //   features: ["wait 120s"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["auto"],
  //   supportedResolutions: ["480p", "1080p"],
  //   supportsAudio: false,
  //   supportedDurations: [5],
  //   estimatedGenerationTime: 60,
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
    (model) => !model.name.includes("Legacy") && !model.internal
  );
}

export function getImageToVideoModels(): VideoModelConfig[] {
  return getVideoModelsByType(VideoModelType.IMAGE_TO_VIDEO).filter(
    (model) => !model.name.includes("Legacy") && !model.internal
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

export function getBytePlusModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.provider === VideoModelProvider.BYTEPLUS
  );
}

export function getVeo3Models(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.provider === VideoModelProvider.APICORE
  );
}

export function getKieAiModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.provider === VideoModelProvider.KIEAI
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

  // 根据分辨率调整积分（对支持多分辨率的模型生效）
  if (isSeedanceModel(modelId) || isAliModel(modelId)) {
    if (resolution === "1080p") {
      // 1080p 价格是 480p 的 4 倍
      totalCredits *= 4;
    } else if (resolution === "720p") {
      // Seedance 1.5 Pro: 720p = 480p 的 2 倍
      totalCredits *= 2;
    }
    // 480p 保持原价格不变
  }

  // MiniMax Hailuo02 图片转视频模型的分辨率定价
  if (modelId === "minimax-hailuo02-image-to-video") {
    if (resolution === "768p") {
      totalCredits *= 2;
    }
  }

  // Kie.ai Veo3 模型的分辨率定价
  // 基础价格: 0.75积分/秒，8秒 = 6积分 (720p)
  // 720p: 6积分 (1x)
  // 1080p: 8积分 (1.33x)
  // 4K: 12积分 (2x)
  if (isKieAiVeo3Model(modelId)) {
    if (resolution === "4k") {
      totalCredits *= 2; // 4K = 2x 基础价格 (12积分/8秒)
    } else if (resolution === "1080p") {
      totalCredits = totalCredits * 4 / 3; // 1080p = 1.33x 基础价格 (8积分/8秒)
    }
    // 720p 保持基础价格 (6积分/8秒)
  }

  // Veo3 模型支持音频，需要额外费用
  if (model.id.includes("veo3") && hasAudio && model.audioPremiumCredits) {
    totalCredits += duration * model.audioPremiumCredits;
  }

  // Sora 2 固定为 1080p HD，无需额外调整（已在 perSecondCredits 中包含）

  return Math.round(totalCredits);
}

// 获取所有支持的模型ID（用于API验证）
export function getSupportedModelIds(): string[] {
  return Object.keys(VIDEO_MODELS);
}

// 获取阿里百炼模型
export function getAliModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    (model) => model.provider === VideoModelProvider.ALI
  );
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

// 检查模型是否为BytePlus模型
export function isBytePlusModel(modelId: string): boolean {
  return modelId.includes("byteplus-");
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

// 检查模型是否为Kie.ai模型
export function isKieAiModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  return model?.provider === VideoModelProvider.KIEAI;
}

// 检查模型是否为Kie.ai Veo3模型
export function isKieAiVeo3Model(modelId: string): boolean {
  return modelId.includes("kie-veo3-");
}

// 检查模型是否为Sora 2模型（包括 Standard 和 Pro）
export function isSora2Model(modelId: string): boolean {
  return modelId.includes("sora-2-");
}

// 检查模型是否为 Sora 2 Pro 模型
export function isSora2ProModel(modelId: string): boolean {
  return modelId.includes("sora-2-pro-");
}

// 检查模型是否为 Storyboard 模型
export function isStoryboardModel(modelId: string): boolean {
  return modelId === "sora-2-pro-storyboard";
}

// 检查模型是否为阿里百炼模型
export function isAliModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  return model?.provider === VideoModelProvider.ALI;
}

// 检查模型是否为MiniMax模型
export function isMinimaxModel(modelId: string): boolean {
  return modelId.includes("minimax-");
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

/**
 * 获取模型支持的最大图片数量
 * @param modelId - 模型ID
 * @returns 支持的最大图片数量，默认为1
 */
export function getMaxImagesForModel(modelId: string): number {
  const model = getVideoModel(modelId);
  return model?.imageCapabilities?.maxImages ?? 1;
}
