// 图片验证规则配置
export interface ImageValidationRule {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minAspectRatio: number;
  maxAspectRatio: number;
  maxFileSize: number; // 字节
  supportedFormats: string[];
  errorMessages: {
    tooSmall: string;
    tooLarge: string;
    aspectRatio: string;
    fileSize: string;
    format: string;
  };
}

// 默认规则（通用）
const DEFAULT_RULE: ImageValidationRule = {
  minWidth: 300,
  maxWidth: 6000,
  minHeight: 300,
  maxHeight: 6000,
  minAspectRatio: 0.4,
  maxAspectRatio: 2.5,
  maxFileSize: 20 * 1024 * 1024, // 20MB
  supportedFormats: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
  ],
  errorMessages: {
    tooSmall: "Image too small. Minimum size is 300x300 pixels.",
    tooLarge: "Image too large. Maximum size is 6000x6000 pixels.",
    aspectRatio: "Invalid aspect ratio. Please use an image with aspect ratio between 0.4 and 2.5.",
    fileSize: "File too large. Maximum size is 20MB.",
    format: "Unsupported format. Please use JPEG, PNG, WEBP, or BMP.",
  },
};

// Seedance 规则（火山引擎）
const SEEDANCE_RULE: ImageValidationRule = {
  minWidth: 300,
  maxWidth: 6000,
  minHeight: 300,
  maxHeight: 6000,
  minAspectRatio: 0.4,
  maxAspectRatio: 2.5,
  maxFileSize: 30 * 1024 * 1024, // 30MB
  supportedFormats: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/gif",
  ],
  errorMessages: {
    tooSmall: "Image too small. Minimum size is 300x300 pixels.",
    tooLarge: "Image too large. Maximum size is 6000x6000 pixels.",
    aspectRatio: "Invalid aspect ratio. Please use an image with aspect ratio between 0.4 and 2.5.",
    fileSize: "File too large. Maximum size is 30MB.",
    format: "Unsupported format. Please use JPEG, PNG, WEBP, BMP, TIFF, or GIF.",
  },
};

// 阿里 WAN 模型规则
const ALI_WAN_RULE: ImageValidationRule = {
  minWidth: 360,
  maxWidth: 2000,
  minHeight: 360,
  maxHeight: 2000,
  minAspectRatio: 0.18, // 360/2000
  maxAspectRatio: 5.56, // 2000/360
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
  ],
  errorMessages: {
    tooSmall: "Image too small. Minimum size is 360x360 pixels.",
    tooLarge: "Image too large. Maximum size is 2000x2000 pixels.",
    aspectRatio: "Invalid aspect ratio. Image dimensions must be between 360-2000 pixels.",
    fileSize: "File too large. Maximum size is 10MB.",
    format: "Unsupported format. Please use JPEG, PNG (no transparency), WEBP, or BMP.",
  },
};

// Seedream 图片生成模型规则
const SEEDREAM_IMAGE_RULE: ImageValidationRule = {
  ...DEFAULT_RULE,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  errorMessages: {
    ...DEFAULT_RULE.errorMessages,
    fileSize: "File too large. Maximum size is 10MB.",
  },
};

// Kie.ai Hailuo 2.3 图片转视频规则
const KIE_HAILUO_23_RULE: ImageValidationRule = {
  ...DEFAULT_RULE,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  errorMessages: {
    ...DEFAULT_RULE.errorMessages,
    fileSize: "File too large. Maximum size is 10MB.",
    format: "Unsupported format. Please use JPEG, PNG, or WEBP.",
  },
};

// Kie.ai Wan 2.5 图片转视频规则
const KIE_WAN_25_RULE: ImageValidationRule = {
  ...DEFAULT_RULE,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  errorMessages: {
    ...DEFAULT_RULE.errorMessages,
    fileSize: "File too large. Maximum size is 10MB.",
    format: "Unsupported format. Please use JPEG, PNG, or WEBP.",
  },
};

// 模型ID到验证规则的映射
export const MODEL_IMAGE_VALIDATION_RULES: Record<string, ImageValidationRule> = {
  // Seedream 图片生成模型
  "seedream-4-5": SEEDREAM_IMAGE_RULE,

  // Seedance 模型（火山引擎）
  "doubao-seedance-1-0-pro-image-to-video": SEEDANCE_RULE,
  
  // 阿里 WAN 模型 - 使用实际的模型ID
  "ali-video-generation-image-to-video": ALI_WAN_RULE,
  
  // Kie.ai Veo3 模型（使用默认规则）
  "kie-veo3-image-to-video": DEFAULT_RULE,

  // Kie.ai Kling 3.0 模型（使用默认规则）
  "kie-kling-3-image-to-video": DEFAULT_RULE,
  
  // MiniMax Hailuo 模型（使用默认规则）
  "minimax-hailuo02-image-to-video": DEFAULT_RULE,

  // Kie.ai Hailuo 2.3 模型
  "kie-hailuo-2-3-image-to-video": KIE_HAILUO_23_RULE,

  // Kie.ai Wan 2.5 模型
  "kie-wan-2-5-image-to-video": KIE_WAN_25_RULE,
  
  // 其他未明确定义的模型使用默认规则
};

// 获取模型的图片验证规则
export function getImageValidationRule(modelId: string): ImageValidationRule {
  return MODEL_IMAGE_VALIDATION_RULES[modelId] || DEFAULT_RULE;
}

// 验证图片
export async function validateImage(
  file: File,
  modelId: string
): Promise<{ valid: boolean; error?: string }> {
  const rule = getImageValidationRule(modelId);
  
  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Please upload an image file." };
  }
  
  // 验证格式
  if (!rule.supportedFormats.includes(file.type.toLowerCase())) {
    return { valid: false, error: rule.errorMessages.format };
  }
  
  // 验证文件大小
  if (file.size > rule.maxFileSize) {
    return { valid: false, error: rule.errorMessages.fileSize };
  }
  
  // 验证图片尺寸
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;
      
      // 检查最小尺寸
      if (width < rule.minWidth || height < rule.minHeight) {
        resolve({ valid: false, error: rule.errorMessages.tooSmall });
        return;
      }
      
      // 检查最大尺寸
      if (width > rule.maxWidth || height > rule.maxHeight) {
        resolve({ valid: false, error: rule.errorMessages.tooLarge });
        return;
      }
      
      // 检查宽高比
      if (aspectRatio < rule.minAspectRatio || aspectRatio > rule.maxAspectRatio) {
        resolve({ valid: false, error: rule.errorMessages.aspectRatio });
        return;
      }
      
      resolve({ valid: true });
    };
    
    img.onerror = () => {
      resolve({ valid: false, error: "Invalid image file. Please select a valid image." });
    };
    
    const url = URL.createObjectURL(file);
    img.src = url;
    
    // 在加载完成或出错后清理 URL
    img.addEventListener('load', () => URL.revokeObjectURL(url));
    img.addEventListener('error', () => URL.revokeObjectURL(url));
  });
}
