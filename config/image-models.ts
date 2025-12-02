// 图片模型类型
export enum ImageModelType {
  TEXT_TO_IMAGE = "text-to-image",
  IMAGE_TO_IMAGE = "image-to-image",
}

// 图片模型提供商
export enum ImageModelProvider {
  KIE = "kie", // Kie.ai (提供 Nano Banana 等模型)
}

// 图片模型配置接口
export interface ImageModelConfig {
  id: string;
  name: string;
  displayName: string;
  provider: ImageModelProvider;
  type: ImageModelType;
  status: "active" | "inactive";
  features: string[];
  credits: number; // 基础积分（对于支持多分辨率的模型，这是最低分辨率的价格）
  maxInputImages?: number; // 图生图最多支持几张输入图片
  supportedAspectRatios: string[];
  supportedResolutions?: string[]; // 1K, 2K, 4K
  resolutionCredits?: Record<string, number>; // 不同分辨率的积分价格
  supportedFormats: string[];
  estimatedGenerationTime?: number; // 预估生成时间(秒),用于前端倒计时
}

// 图片模型配置
export const IMAGE_MODELS: Record<string, ImageModelConfig> = {
  // Nano Banana 标准版 - 文生图
  "nano-banana": {
    id: "nano-banana",
    name: "nano-banana",
    displayName: "Nano Banana",
    provider: ImageModelProvider.KIE,
    type: ImageModelType.TEXT_TO_IMAGE,
    status: "active",
    features: ["text-to-image", "high-quality"],
    credits: 3,
    supportedAspectRatios: ["Auto", "1:1", "3:4", "9:16", "4:3", "16:9"],
    supportedFormats: ["jpg", "png"],
    estimatedGenerationTime: 30, // 实测平均 13 秒
  },

  // Nano Banana 标准版 - 图生图
  "nano-banana-edit": {
    id: "nano-banana-edit",
    name: "nano-banana-edit",
    displayName: "Nano Banana Edit",
    provider: ImageModelProvider.KIE,
    type: ImageModelType.IMAGE_TO_IMAGE,
    status: "active",
    features: ["image-to-image", "high-quality"],
    credits: 3,
    maxInputImages: 5, // 标准版最多支持 5 张输入图片
    supportedAspectRatios: ["Auto", "1:1", "3:4", "9:16", "4:3", "16:9"],
    supportedFormats: ["jpg", "png"],
    estimatedGenerationTime: 30, // 实测平均 20 秒,留 5 秒余量
  },
  // Nano Banana Pro - 统一模型(文生图 + 图生图) - 默认推荐
  "nano-banana-pro": {
    id: "nano-banana-pro",
    name: "nano-banana-pro",
    displayName: "Nano Banana Pro",
    provider: ImageModelProvider.KIE,
    type: ImageModelType.TEXT_TO_IMAGE,
    status: "active",
    features: [
      "text-to-image",
      "image-to-image",
      "high-quality",
      "4k-resolution",
    ],
    credits: 6, // 基础积分 (1K 分辨率)
    maxInputImages: 5, // 支持最多 8 张参考图
    supportedAspectRatios: ["1:1", "3:4", "9:16", "4:3", "16:9"],
    supportedResolutions: ["1K", "2K", "4K"],
    resolutionCredits: {
      "1K": 6,
      "2K": 9,
      "4K": 12,
    },
    supportedFormats: ["jpg", "png"],
    estimatedGenerationTime: 80, // 实测平均 130 秒,留 20 秒余量
  },
};

// 辅助函数
export function getImageModel(modelId: string): ImageModelConfig | undefined {
  return IMAGE_MODELS[modelId];
}

export function calculateImageCredits(
  modelId: string,
  resolution?: string
): number {
  const model = getImageModel(modelId);
  if (!model) return 0;

  // 如果有分辨率积分配置且传入了分辨率，使用对应分辨率的价格
  if (resolution && model.resolutionCredits) {
    const credits = model.resolutionCredits[resolution];
    if (credits !== undefined) {
      return credits;
    }
  }

  // 否则返回基础积分
  return model.credits;
}
