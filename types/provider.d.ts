/**
 * AI Service Provider Types
 * AI服务提供商相关类型定义
 */

export type AIServiceProvider =
  | "nano_banana"     // Kie.ai Nano Banana
  | "gpt_image_2"     // Kie.ai GPT Image 2 (OpenAI-hosted via Kie.ai)
  | "openai"          // OpenAI DALL-E
  | "midjourney"      // Midjourney
  | "stable_diffusion" // Stability AI
  | "replicate"       // Replicate
  | "huggingface"     // Hugging Face
  | "custom"          // 自定义服务商
  | "fal"             // fal.ai
  | "seedream";       // ByteDance Seedream

export type ProviderStatus = 
  | "active"          // 活跃可用
  | "inactive"        // 暂停使用
  | "maintenance"     // 维护中
  | "deprecated";     // 已弃用

export interface AIProviderConfig {
  id: AIServiceProvider;
  name: string;
  displayName: string;
  description?: string;
  apiEndpoint?: string;
  status: ProviderStatus;
  features: AIProviderFeatures;
  models: AIProviderModel[];
  pricing?: AIProviderPricing;
  metadata?: Record<string, any>;
}

export interface AIProviderFeatures {
  textToImage: boolean;
  imageToImage: boolean;
  imageEdit: boolean;
  inpainting: boolean;
  outpainting: boolean;
  upscaling: boolean;
  backgroundRemoval: boolean;
  styleTransfer: boolean;
  batchGeneration: boolean;
  asyncCallback: boolean;
  realTimeStatus: boolean;
}

export interface AIProviderModel {
  id: string;
  name: string;
  displayName: string;
  provider: AIServiceProvider;
  type: "text-to-image" | "image-to-image" | "image-edit" | "upscaling";
  status: "active" | "beta" | "deprecated";
  features: string[];
  maxImageCount?: number;
  maxResolution?: {
    width: number;
    height: number;
  };
  supportedAspectRatios?: string[];
  supportedFormats?: string[];
  credits: number; // 生成一张图片需要的积分
}

export interface AIProviderPricing {
  baseCredits: number;
  qualityMultiplier?: {
    standard: number;
    high: number;
    ultra: number;
  };
  resolutionMultiplier?: {
    [key: string]: number; // "512x512": 1, "1024x1024": 2
  };
  modeMultiplier?: {
    [key in ImageGenerationMode]?: number;
  };
}

export interface ProviderTaskResponse {
  taskId: string;
  provider: AIServiceProvider;
  providerTaskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  images?: ProviderImageResult[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface ProviderImageResult {
  url: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number; // 文件大小(bytes)
  seed?: number;
}

export interface ProviderCallbackRequest {
  providerTaskId: string;
  provider: AIServiceProvider;
  status: "pending" | "processing" | "completed" | "failed";
  result?: ProviderTaskResponse;
  error?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ProviderCallbackResponse {
  success: boolean;
  message: string;
  processedAt?: string;
}

// 重新导出类型以保持向后兼容
import type { ImageGenerationMode } from "./image.d";
