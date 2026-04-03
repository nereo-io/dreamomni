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
  MAXAPI = "maxapi", // MaxAPI 提供的模型 (Seedance 2.0)
}

// 实际 AI 模型枚举（与 model_id/provider 无关）
export enum VideoModel {
  SEEDANCE_2_0 = "seedance-2.0",
  SEEDANCE_2_0_FAST = "seedance-2.0-fast",
  SEEDANCE_1_5_PRO = "seedance-1.5-pro",
  VEO3 = "veo3",
  SORA2 = "sora2",
  KLING3 = "kling3",
  HAILUO_2_3 = "hailuo-2.3",
  WAN_2_5 = "wan-2.5",
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
  supportedResolutionsByDuration?: Record<number, string[]>; // 各时长下支持的分辨率
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
  // Whether this model should use the signed callback route.
  useSignedCallback?: boolean;
  /**
   * Fallback model IDs (keys in VIDEO_MODELS) tried in order when primary fails.
   * Fallback entries should be internal models (internal: true).
   */
  fallbackProvider?: string[];
}

// 视频模型配置
export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  // Volcano Engine 官方 Seedance 2.0 Fast 文生视频
  "volcano-seedance-2-0-fast-text-to-video": {
    id: "volcano-seedance-2-0-fast-text-to-video",
    name: "Volcano Seedance 2.0 Fast Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    modelName: VideoModel.SEEDANCE_2_0_FAST,
    volcanoModel: "doubao-seedance-2-0-fast-260128",
    displayName: "Seedance 2.0 Fast",
    perSecondCredits: 4,
    description: "ByteDance's latest Seedance 2.0 Fast model",
    features: ["Wait 2min", "Audio"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supportedResolutions: ["480p", "720p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 120,
    supportedDurations: [5, 8, 10, 15],
    useSignedCallback: true,
  },

  // Volcano Engine 官方 Seedance 2.0 Fast 图生视频
  "volcano-seedance-2-0-fast-image-to-video": {
    id: "volcano-seedance-2-0-fast-image-to-video",
    name: "Volcano Seedance 2.0 Fast Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    modelName: VideoModel.SEEDANCE_2_0_FAST,
    volcanoModel: "doubao-seedance-2-0-fast-260128",
    displayName: "Seedance 2.0 Fast",
    perSecondCredits: 4,
    description: "ByteDance's latest Seedance 2.0 Fast model",
    features: ["Wait 2min", "Audio", "Support 2 images"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supportedResolutions: ["480p", "720p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 120,
    supportedDurations: [5, 8, 10, 15],
    imageCapabilities: {
      maxImages: 2,
      labels: ["First Frame", "Last Frame"],
    },
    useSignedCallback: true,
  },

  // Volcano Engine 官方 Seedance 2.0 Fast 多模态参考生视频 (Reference-to-Video 页面使用)
  "volcano-seedance-2-0-fast-reference-to-video": {
    id: "volcano-seedance-2-0-fast-reference-to-video",
    name: "Volcano Seedance 2.0 Fast Media-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    modelName: VideoModel.SEEDANCE_2_0_FAST,
    volcanoModel: "doubao-seedance-2-0-fast-260128",
    displayName: "Seedance 2.0 Fast (Media)",
    perSecondCredits: 12,
    description: "Generate videos from mixed media: images, videos, and audio",
    features: ["Wait 3min", "Audio", "Multi-Media"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supportedResolutions: ["480p", "720p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 180,
    supportedDurations: [5, 8, 10, 15],
    imageCapabilities: {
      maxImages: 12,
      minImages: 1,
    },
    generationType: "REFERENCE_2_VIDEO",
    useSignedCallback: true,
  },

  // Volcano Engine 官方 Seedance 2.0 文生视频（非 Fast，更高质量）
  "volcano-seedance-2-0-text-to-video": {
    id: "volcano-seedance-2-0-text-to-video",
    name: "Volcano Seedance 2.0 Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    modelName: VideoModel.SEEDANCE_2_0,
    volcanoModel: "doubao-seedance-2-0-260128",
    displayName: "Seedance 2.0",
    perSecondCredits: 5,
    description: "ByteDance's Seedance 2.0 model - highest quality",
    features: ["Wait 3min", "Audio"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supportedResolutions: ["480p", "720p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 120,
    supportedDurations: [5, 8, 10, 15],
    useSignedCallback: true,
  },

  // Volcano Engine 官方 Seedance 2.0 图生视频（非 Fast，更高质量）
  "volcano-seedance-2-0-image-to-video": {
    id: "volcano-seedance-2-0-image-to-video",
    name: "Volcano Seedance 2.0 Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    modelName: VideoModel.SEEDANCE_2_0,
    volcanoModel: "doubao-seedance-2-0-260128",
    displayName: "Seedance 2.0",
    perSecondCredits: 5,
    description: "ByteDance's Seedance 2.0 model - highest quality",
    features: ["Wait 3min", "Audio", "Support 2 images"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supportedResolutions: ["480p", "720p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 120,
    supportedDurations: [5, 8, 10, 15],
    imageCapabilities: {
      maxImages: 2,
      labels: ["First Frame", "Last Frame"],
    },
    useSignedCallback: true,
  },

  // Volcano Engine 官方 Seedance 2.0 多模态参考生视频（非 Fast，更高质量）
  "volcano-seedance-2-0-reference-to-video": {
    id: "volcano-seedance-2-0-reference-to-video",
    name: "Volcano Seedance 2.0 Media-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.VOLCANO,
    modelName: VideoModel.SEEDANCE_2_0,
    volcanoModel: "doubao-seedance-2-0-260128",
    displayName: "Seedance 2.0 (Media)",
    perSecondCredits: 15,
    description: "Generate videos from mixed media: images, videos, and audio",
    features: ["Wait 3min", "Audio", "Multi-Media"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    supportedResolutions: ["480p", "720p"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 180,
    supportedDurations: [5, 8, 10, 15],
    imageCapabilities: {
      maxImages: 12,
      minImages: 1,
    },
    generationType: "REFERENCE_2_VIDEO",
    useSignedCallback: true,
  },

  // MaxAPI Seedance 2.0 文本转视频模型
  "maxapi-seedance-2-0-text-to-video": {
    id: "maxapi-seedance-2-0-text-to-video",
    name: "MaxAPI Seedance 2.0 Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.MAXAPI,
    modelName: VideoModel.SEEDANCE_2_0,
    providerModelId: "seedance-2.0",
    displayName: "Seedance 2.0",
    perSecondCredits: 6,
    description: "ByteDance's latest Seedance 2.0 model",
    features: ["Wait 20min", "Audio"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    supportedResolutions: ["480p", "720p", "1080p"],
    supportsAudio: true,
    estimatedGenerationTime: 1200,
    supportedDurations: [5, 10, 15],
    requiresMembership: true,
    useSignedCallback: true,
  },

  // MaxAPI Seedance 2.0 图片转视频模型
  "maxapi-seedance-2-0-image-to-video": {
    id: "maxapi-seedance-2-0-image-to-video",
    name: "MaxAPI Seedance 2.0 Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.MAXAPI,
    modelName: VideoModel.SEEDANCE_2_0,
    providerModelId: "seedance-2.0",
    displayName: "Seedance 2.0",
    perSecondCredits: 6,
    description: "ByteDance's latest Seedance 2.0 model",
    features: ["Wait 20min", "Audio", "Support 2 images"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    supportedResolutions: ["480p", "720p", "1080p"],
    supportsAudio: true,
    estimatedGenerationTime: 1200,
    supportedDurations: [5, 10, 15],
    imageCapabilities: {
      maxImages: 2,
      labels: ["First Frame", "Last Frame"],
    },
    requiresMembership: true,
    useSignedCallback: true,
  },

  // MaxAPI Seedance 2.0 Fast 文本转视频模型
  "maxapi-seedance-2-0-fast-text-to-video": {
    id: "maxapi-seedance-2-0-fast-text-to-video",
    name: "MaxAPI Seedance 2.0 Fast Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.MAXAPI,
    modelName: VideoModel.SEEDANCE_2_0_FAST,
    providerModelId: "seedance-2.0-fast",
    displayName: "Seedance 2.0 Fast",
    perSecondCredits: 3,
    description: "ByteDance's latest video model, WORLD No.1",
    features: ["Wait 19min", "Audio", "Fast"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    supportedResolutions: ["480p", "720p", "1080p"],
    supportsAudio: true,
    estimatedGenerationTime: 1148,
    supportedDurations: [5, 10, 15],
    requiresMembership: true,
    useSignedCallback: true,
  },

  // MaxAPI Seedance 2.0 Fast 图片转视频模型
  "maxapi-seedance-2-0-fast-image-to-video": {
    id: "maxapi-seedance-2-0-fast-image-to-video",
    name: "MaxAPI Seedance 2.0 Fast Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.MAXAPI,
    modelName: VideoModel.SEEDANCE_2_0_FAST,
    providerModelId: "seedance-2.0-fast",
    displayName: "Seedance 2.0 Fast",
    perSecondCredits: 3,
    description: "ByteDance's latest video model, WORLD No.1",
    features: ["Wait 22min", "Audio", "Fast", "Support 2 images"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    supportedResolutions: ["480p", "720p", "1080p"],
    supportsAudio: true,
    estimatedGenerationTime: 1299,
    supportedDurations: [5, 10, 15],
    imageCapabilities: {
      maxImages: 2,
      labels: ["First Frame", "Last Frame"],
    },
    requiresMembership: true,
    useSignedCallback: true,
  },

  // MaxAPI Seedance 2.0 Fast Media-to-Video（Reference-to-Video 页面）
  "maxapi-seedance-2-0-fast-reference-to-video": {
    id: "maxapi-seedance-2-0-fast-reference-to-video",
    name: "MaxAPI Seedance 2.0 Fast Media-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.MAXAPI,
    modelName: VideoModel.SEEDANCE_2_0_FAST,
    providerModelId: "seedance-2.0-fast",
    displayName: "Seedance 2.0 Fast (Media)",
    perSecondCredits: 6,
    description:
      "Fast video generation from mixed media: images, videos, and audio",
    features: ["Wait 9min", "Audio", "Fast", "Multi-Media"],
    maxDuration: 15,
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    supportedResolutions: ["480p", "720p", "1080p"],
    supportsAudio: true,
    estimatedGenerationTime: 520,
    supportedDurations: [5, 10, 15],
    imageCapabilities: {
      maxImages: 12,
      minImages: 1,
    },
    generationType: "REFERENCE_2_VIDEO",
    requiresMembership: true,
    useSignedCallback: true,
  },

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
    providerModelId: "veo3_fast",
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
    providerModelId: "veo3_fast",
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
    providerModelId: "veo3_fast",
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

  // Kie.ai Veo3.1 Lite 文本转视频模型
  "kie-veo3-lite-text-to-video": {
    id: "kie-veo3-lite-text-to-video",
    name: "Kie.ai Veo3.1 Lite Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.KIEAI,
    modelName: VideoModel.VEO3,
    providerModelId: "veo3_lite",
    displayName: "Veo 3.1 Lite",
    sortOrder: 151, // 紧跟在 Veo 3.1 后面
    perSecondCredits: 0.5,
    description: "Google's Veo3.1 Lite model, most cost-effective for high-volume generation",
    features: ["Wait 120s", "Audio"],
    maxDuration: 8,
    supportedAspectRatios: ["Auto", "16:9", "9:16"],
    supportsAudio: true,
    estimatedGenerationTime: 120,
    supportedDurations: [8],
    supportedResolutions: ["720p", "1080p", "4k"],
  },

  // Kie.ai Veo3.1 Lite 图片转视频模型
  "kie-veo3-lite-image-to-video": {
    id: "kie-veo3-lite-image-to-video",
    name: "Kie.ai Veo3.1 Lite Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.KIEAI,
    modelName: VideoModel.VEO3,
    providerModelId: "veo3_lite",
    displayName: "Veo 3.1 Lite",
    sortOrder: 151,
    perSecondCredits: 0.5,
    description: "Google's Veo3.1 Lite model, most cost-effective for high-volume generation",
    features: ["Wait 160s", "Audio", "Support 2 images"],
    maxDuration: 8,
    supportedAspectRatios: ["Auto", "16:9", "9:16"],
    supportsAudio: true,
    estimatedGenerationTime: 160,
    supportedDurations: [8],
    supportedResolutions: ["720p", "1080p", "4k"],
    imageCapabilities: {
      maxImages: 2,
      labels: ["First Frame", "Last Frame"],
    },
  },

  // Kie.ai Kling 3.0 文本转视频模型
  "kie-kling-3-text-to-video": {
    id: "kie-kling-3-text-to-video",
    name: "Kie.ai Kling 3.0 Text-to-Video",
    type: VideoModelType.TEXT_TO_VIDEO,
    provider: VideoModelProvider.KIEAI,
    providerModelId: "kling-3.0/video",
    modelName: VideoModel.KLING3,
    displayName: "Kling 3.0",
    perSecondCredits: 6, // 720p std no-audio baseline
    description: "Kling 3.0 model with realistic motion and stable prompt control.",
    features: ["Wait 120s", "720p/1080p", "5s/10s"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 120,
    useSignedCallback: true,
    supportedDurations: [5, 10],
    supportedResolutions: ["720p", "1080p"],
  },

  // Kie.ai Kling 3.0 图片转视频模型
  "kie-kling-3-image-to-video": {
    id: "kie-kling-3-image-to-video",
    name: "Kie.ai Kling 3.0 Image-to-Video",
    type: VideoModelType.IMAGE_TO_VIDEO,
    provider: VideoModelProvider.KIEAI,
    providerModelId: "kling-3.0/video",
    modelName: VideoModel.KLING3,
    displayName: "Kling 3.0",
    perSecondCredits: 6, // 720p std no-audio baseline
    description:
      "Kling 3.0 image-to-video with stable style retention and natural motion.",
    features: ["Wait 120s", "Image Animation", "5s/10s"],
    maxDuration: 10,
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportsAudio: true,
    audioOptional: true,
    estimatedGenerationTime: 120,
    useSignedCallback: true,
    supportedDurations: [5, 10],
    supportedResolutions: ["720p", "1080p"],
    imageCapabilities: {
      maxImages: 1,
      labels: ["Reference Image"],
    },
  },

  // // Kie.ai Hailuo 2.3 图片转视频模型
  // "kie-hailuo-2-3-image-to-video": {
  //   id: "kie-hailuo-2-3-image-to-video",
  //   name: "Kie.ai Hailuo 2.3 Image-to-Video",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.KIEAI,
  //   providerModelId: "hailuo/2-3-image-to-video-standard",
  //   modelName: VideoModel.HAILUO_2_3,
  //   displayName: "Hailuo 2.3",
  //   perSecondCredits: 2, // 768p std baseline
  //   description: "MiniMax Hailuo 2.3 for expressive image-to-video generation.",
  //   features: ["Wait 180s", "Instruction Following", "768p/1080p"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["Auto"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 180,
  //   useSignedCallback: true,
  //   supportedDurations: [6, 10],
  //   supportedResolutions: ["768p", "1080p"],
  //   supportedResolutionsByDuration: {
  //     6: ["768p", "1080p"],
  //     10: ["768p"],
  //   },
  //   imageCapabilities: {
  //     maxImages: 1,
  //     labels: ["Reference Image"],
  //   },
  // },

  // Kie.ai Wan 2.5 文本转视频模型
  // "kie-wan-2-5-text-to-video": {
  //   id: "kie-wan-2-5-text-to-video",
  //   name: "Kie.ai Wan 2.5 Text-to-Video",
  //   type: VideoModelType.TEXT_TO_VIDEO,
  //   provider: VideoModelProvider.KIEAI,
  //   providerModelId: "wan/2-5-text-to-video",
  //   modelName: VideoModel.WAN_2_5,
  //   displayName: "Wan 2.5",
  //   perSecondCredits: 5, // 720p baseline
  //   description: "Alibaba Wan 2.5 text-to-video with stronger prompt understanding.",
  //   features: ["Wait 180s", "Prompt Expansion", "720p/1080p"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["16:9", "9:16", "1:1"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 180,
  //   useSignedCallback: true,
  //   supportedDurations: [5, 10],
  //   supportedResolutions: ["720p", "1080p"],
  // },

  // // Kie.ai Wan 2.5 图片转视频模型
  // "kie-wan-2-5-image-to-video": {
  //   id: "kie-wan-2-5-image-to-video",
  //   name: "Kie.ai Wan 2.5 Image-to-Video",
  //   type: VideoModelType.IMAGE_TO_VIDEO,
  //   provider: VideoModelProvider.KIEAI,
  //   providerModelId: "wan/2-5-image-to-video",
  //   modelName: VideoModel.WAN_2_5,
  //   displayName: "Wan 2.5",
  //   perSecondCredits: 5, // 720p baseline
  //   description: "Alibaba Wan 2.5 image-to-video with controllable cinematic motion.",
  //   features: ["Wait 180s", "Prompt Expansion", "Image Animation"],
  //   maxDuration: 10,
  //   supportedAspectRatios: ["Auto"],
  //   supportsAudio: false,
  //   estimatedGenerationTime: 180,
  //   useSignedCallback: true,
  //   supportedDurations: [5, 10],
  //   supportedResolutions: ["720p", "1080p"],
  //   imageCapabilities: {
  //     maxImages: 1,
  //     labels: ["Reference Image"],
  //   },
  // },

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
    perSecondCredits: 1, // 10秒10积分, 15秒15积分
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
    perSecondCredits: 1, // 10秒10积分, 15秒15积分
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
  const preferredOrder: VideoModel[] = [
    VideoModel.SEEDANCE_1_5_PRO,
    VideoModel.VEO3,
    VideoModel.SEEDANCE_2_0_FAST,
    VideoModel.SEEDANCE_2_0,
    VideoModel.SORA2,
    VideoModel.HAILUO_2_3,
    VideoModel.KLING3,
    VideoModel.WAN_2_5,
  ];

  return getVideoModelsByType(VideoModelType.TEXT_TO_VIDEO)
    .filter((model) => !model.name.includes("Legacy") && !model.internal)
    .sort((a, b) => {
      const indexA = a.modelName ? preferredOrder.indexOf(a.modelName) : -1;
      const indexB = b.modelName ? preferredOrder.indexOf(b.modelName) : -1;
      const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
      return rankA - rankB;
    });
}

export function getImageToVideoModels(): VideoModelConfig[] {
  const preferredOrder: VideoModel[] = [
    VideoModel.SEEDANCE_1_5_PRO,
    VideoModel.VEO3,
    VideoModel.SEEDANCE_2_0,
    VideoModel.SEEDANCE_2_0_FAST,
    VideoModel.SORA2,
    VideoModel.HAILUO_2_3,
    VideoModel.KLING3,
    VideoModel.WAN_2_5,
  ];

  return getVideoModelsByType(VideoModelType.IMAGE_TO_VIDEO)
    .filter((model) => !model.name.includes("Legacy") && !model.internal)
    .sort((a, b) => {
      const indexA = a.modelName ? preferredOrder.indexOf(a.modelName) : -1;
      const indexB = b.modelName ? preferredOrder.indexOf(b.modelName) : -1;
      const rankA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const rankB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
      return rankA - rankB;
    });
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
  const normalizedResolution = String(resolution || "").trim().toLowerCase();

  // 统一按秒计费，基础积分以 480p 为基准
  let totalCredits = duration * model.perSecondCredits;

  // 根据分辨率调整积分（对支持多分辨率的模型生效）
  // Seedance 2.0 Fast 改为与 Seedance 1.5 Pro 对齐：480p/720p/1080p = 1x/2x/4x
  // Volcano Seedance 2.0 & 2.0 Fast（官方）：480p/720p = 1x/2.2x（不支持1080p）
  // 其他 Seedance 2.0 系列仍维持统一定价
  const isSeedance20 = modelId.includes("seedance-2-0");
  const isSeedance20Fast = modelId.includes("seedance-2-0-fast");
  const isVolcanoSeedance20 = modelId.startsWith("volcano-seedance-2-0");
  if (isVolcanoSeedance20) {
    if (normalizedResolution === "720p") {
      // Volcano Seedance 2.0 & 2.0 Fast: 720p = 480p 的 2.2 倍
      totalCredits = Math.round(totalCredits * 2.2);
    }
  } else if (
    (isSeedanceModel(modelId) && (!isSeedance20 || isSeedance20Fast)) ||
    isAliModel(modelId)
  ) {
    if (normalizedResolution === "1080p") {
      // 1080p 价格是 480p 的 4 倍
      totalCredits *= 4;
    } else if (normalizedResolution === "720p") {
      // Seedance 1.5 Pro: 720p = 480p 的 2 倍
      totalCredits *= 2;
    }
    // 480p 保持原价格不变
  }

  // MiniMax Hailuo02 图片转视频模型的分辨率定价
  if (modelId === "minimax-hailuo02-image-to-video") {
    if (normalizedResolution === "768p") {
      totalCredits *= 2;
    }
  }

  // Kie.ai Veo3 模型的分辨率定价
  // Veo 3.1 (Quality/Fast): 基础 0.75积分/秒，720p=6, 1080p=8, 4K=12
  // Veo 3.1 Lite: 基础 0.5积分/秒，720p=4, 1080p=6 (720p+2), 4K=10 (720p+6)
  if (isKieAiVeo3Model(modelId)) {
    const isLite = modelId.includes("veo3-lite");
    if (normalizedResolution === "4k") {
      if (isLite) {
        totalCredits += 6; // Lite 4K = 基础价格 + 6 credits
      } else {
        totalCredits *= 2; // 4K = 2x 基础价格 (12积分/8秒)
      }
    } else if (normalizedResolution === "1080p") {
      if (isLite) {
        totalCredits += 2; // Lite 1080p = 基础价格 + 2 credits (6积分/8秒)
      } else {
        totalCredits = (totalCredits * 4) / 3; // 1080p = 1.33x 基础价格 (8积分/8秒)
      }
    }
    // 720p 保持基础价格
  }

  // Kie.ai Kling 3.0 模型定价
  // 720p std no-audio: 6 credits/s（基准）
  // 1080p pro no-audio: 8 credits/s
  // 720p std with-audio: 10 credits/s
  // 1080p pro with-audio: 13 credits/s
  if (isKieAiKlingModel(modelId)) {
    const isPro = normalizedResolution === "1080p";
    if (isPro) {
      totalCredits = totalCredits * 4 / 3; // 8/6
    }
    if (hasAudio) {
      totalCredits += duration * (isPro ? 5 : 4);
    }
  }

  // Kie.ai Hailuo 2.3 模型定价（固定分辨率档位）
  // 768p: 2 credits/s（基准）
  // 1080p: 4 credits/s
  if (isKieAiHailuoModel(modelId) && normalizedResolution === "1080p") {
    totalCredits *= 2;
  }

  // Kie.ai Wan 2.5 模型定价
  // 720p: 5 credits/s（基准）
  // 1080p: 8 credits/s
  if (isKieAiWanModel(modelId) && normalizedResolution === "1080p") {
    totalCredits = totalCredits * 8 / 5;
  }

  // Veo3 模型支持音频，需要额外费用
  if (model.id.includes("veo3") && hasAudio && model.audioPremiumCredits) {
    totalCredits += duration * model.audioPremiumCredits;
  }

  // Sora 2 的单价已直接体现在 perSecondCredits 中

  return Math.round(totalCredits);
}

export function getSupportedResolutionsForDuration(
  modelId: string,
  duration: number
): string[] | null {
  const model = getVideoModel(modelId);
  if (!model) return null;

  const durationSpecificResolutions = model.supportedResolutionsByDuration?.[duration];
  if (durationSpecificResolutions && durationSpecificResolutions.length > 0) {
    return durationSpecificResolutions;
  }

  return model.supportedResolutions || null;
}

export function isResolutionSupportedForDuration(
  modelId: string,
  duration: number,
  resolution: string
): boolean {
  const supportedResolutions = getSupportedResolutionsForDuration(modelId, duration);
  if (!supportedResolutions || supportedResolutions.length === 0) {
    return true;
  }

  const normalizedResolution = resolution.trim().toLowerCase();
  return supportedResolutions.some(
    (supportedResolution) => supportedResolution.toLowerCase() === normalizedResolution
  );
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
  return modelId.includes("doubao-") || modelId.startsWith("volcano-");
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

// 检查模型是否为 MaxAPI 模型
export function isMaxApiModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  return model?.provider === VideoModelProvider.MAXAPI;
}

// 检查模型是否为Kie.ai Veo3模型
export function isKieAiVeo3Model(modelId: string): boolean {
  return modelId.includes("kie-veo3-");
}

// 检查模型是否为Kie.ai Kling 3.0模型
export function isKieAiKlingModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  if (model?.modelName) {
    return model.modelName === VideoModel.KLING3;
  }
  return modelId.includes("kie-kling-3-");
}

// 检查模型是否为Kie.ai Hailuo 2.3模型
export function isKieAiHailuoModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  if (model?.modelName) {
    return model.modelName === VideoModel.HAILUO_2_3;
  }
  return modelId.includes("kie-hailuo-2-3-");
}

// 检查模型是否为Kie.ai Wan 2.5模型
export function isKieAiWanModel(modelId: string): boolean {
  const model = getVideoModel(modelId);
  if (model?.modelName) {
    return model.modelName === VideoModel.WAN_2_5;
  }
  return modelId.includes("kie-wan-2-5-");
}

// Check whether a model should use the signed callback webhook flow.
// Note: this is server-side logic, not a React hook.
export function shouldUseSignedVideoCallback(modelId: string): boolean {
  const model = getVideoModel(modelId);
  if (model) {
    if (typeof model.useSignedCallback === "boolean") {
      return model.useSignedCallback;
    }
    // Compatibility fallback for existing Kie.ai model families.
    return (
      model.modelName === VideoModel.KLING3 ||
      model.modelName === VideoModel.HAILUO_2_3 ||
      model.modelName === VideoModel.WAN_2_5
    );
  }

  return false;
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
