// 图片模型类型
export enum ImageModelType {
  TEXT_TO_IMAGE = "text-to-image",
  IMAGE_TO_IMAGE = "image-to-image",
}

// 图片模型提供商
export enum ImageModelProvider {
  KIE = "kie", // Kie.ai (提供 Nano Banana 等模型)
  FAL = "fal", // fal.ai 托管的模型
  VOLCANO = "volcano", // 火山引擎/BytePlus (提供 Seedream 等模型)
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
  maxPromptLength: number; // 提示词最大字符数
  supportedAspectRatios: string[];
  supportedResolutions?: string[]; // 1K, 2K, 4K
  resolutionCredits?: Record<string, number>; // 不同分辨率的积分价格
  supportedFormats: string[];
  volcanoModel?: string; // BytePlus/火山引擎 模型 endpoint ID
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
    credits: 1,
    maxPromptLength: 5000,
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
    credits: 1,
    maxInputImages: 5, // 标准版最多支持 5 张输入图片
    maxPromptLength: 5000,
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
    credits: 2, // 基础积分 (1K 分辨率)
    maxInputImages: 5, // 支持最多 8 张参考图
    maxPromptLength: 10000, // Pro 版本支持更长的提示词
    supportedAspectRatios: ["1:1", "3:4", "9:16", "4:3", "16:9"],
    supportedResolutions: ["1K", "2K", "4K"],
    resolutionCredits: {
      "1K": 2,
      "2K": 2,
      "4K": 4,
    },
    supportedFormats: ["jpg", "png"],
    estimatedGenerationTime: 80, // 实测平均 130 秒,留 20 秒余量
  },

  // Seedream 4.5 - ByteDance/火山引擎图片生成模型
  // 使用 Method 2 精确像素尺寸，根据 aspect_ratio + resolution 计算
  // 2K = 官方推荐尺寸，4K = 2K × 2
  "seedream-4-5": {
    id: "seedream-4-5",
    name: "seedream-4-5",
    displayName: "Seedream 4.5",
    provider: ImageModelProvider.VOLCANO,
    volcanoModel: "ep-20260115153505-w288q", // BytePlus endpoint ID
    type: ImageModelType.TEXT_TO_IMAGE,
    status: "active",
    features: [
      "text-to-image",
      "image-to-image",
      "batch-generation",
      "high-quality",
      "4k-resolution",
    ],
    credits: 1, // 基础积分 (2K 分辨率)
    maxInputImages: 5, // 支持最多 14 张参考图 (实际 API 支持 14 张，但 UI 统一为 5)
    maxPromptLength: 1000, // 支持较长的提示词
    // 官方推荐的所有宽高比 (顺序: 正方形 → 竖屏 → 横屏)
    supportedAspectRatios: ["1:1", "2:3", "3:4", "9:16", "21:9", "16:9", "4:3", "3:2"],
    supportedResolutions: ["2K", "4K"],
    // 像素映射 (2K): 1:1→2048x2048, 4:3→2304x1728, 16:9→2560x1440, 21:9→3024x1296 等
    // 像素映射 (4K): 1:1→4096x4096, 4:3→4608x3456, 16:9→5120x2880, 21:9→6048x2592 等
    resolutionCredits: {
      "2K": 1,
      "4K": 2,
    },
    supportedFormats: ["jpeg"], // Seedream 输出格式
    estimatedGenerationTime: 30, // 单图预估时间
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

/**
 * 获取指定模型的最大提示词长度
 * @param modelId 模型 ID
 * @returns 最大提示词字符数，如果模型不存在则返回默认值 5000
 */
export function getMaxPromptLength(modelId: string): number {
  const model = getImageModel(modelId);
  return model?.maxPromptLength ?? 5000; // 默认 5000 字符
}
