/**
 * Seedream 4.5 AI Image Generation Provider
 * BytePlus/火山引擎图片生成服务
 *
 * 支持功能:
 * - 文生图 (text-to-image)
 * - 图生图 (image-to-image)，支持最多 14 张参考图
 * - 批量生成 (最多 15 张)
 * - 流式响应 (SSE)
 *
 * API 文档: https://docs.byteplus.com/en/docs/ModelArk/1541523
 */

import {
  BaseAIProvider,
  GenerateImageRequest,
  EditImageRequest,
  ProviderResponse,
} from "./BaseAIProvider";
import { triggerInternalCallback } from "@/services/internalCallbackService";
import type { ProviderImageResult } from "@/types/provider";
import { IMAGE_MODELS } from "@/config/image-models";

// Seedream API 请求接口
export interface SeedreamGenerateRequest {
  model: string;
  prompt: string;
  image?: string | string[];
  // size 参数支持两种格式:
  // Method 1: "2K" | "4K" - 让模型决定宽高
  // Method 2: "2560x1440" - 精确指定宽高像素 (推荐)
  //   总像素范围: [3,686,400, 16,777,216], 宽高比范围: [1/16, 16]
  size?: string;
  sequential_image_generation?: "auto" | "disabled";
  sequential_image_generation_options?: {
    max_images?: number;
  };
  stream?: boolean;
  response_format?: "url" | "b64_json";
  watermark?: boolean;
  optimize_prompt_options?: {
    mode: "standard" | "fast";
  };
}

// Seedream API 响应接口
export interface SeedreamApiResponse {
  model: string;
  created: number;
  data: Array<SeedreamImageData | SeedreamImageError>;
  usage?: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SeedreamImageData {
  url?: string;
  b64_json?: string;
  size: string; // "2048x2048"
}

export interface SeedreamImageError {
  error: {
    code: string;
    message: string;
  };
}

// SSE 流式响应事件
export interface SeedreamSSEPartialSucceeded {
  type: "image_generation.partial_succeeded";
  model: string;
  created: number;
  image_index: number;
  url?: string;
  b64_json?: string;
  size: string;
}

export interface SeedreamSSEPartialFailed {
  type: "image_generation.partial_failed";
  model: string;
  created: number;
  image_index: number;
  error: {
    code: string;
    message: string;
  };
}

export interface SeedreamSSECompleted {
  type: "image_generation.completed";
  model: string;
  created: number;
  usage: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export type SeedreamSSEEvent =
  | SeedreamSSEPartialSucceeded
  | SeedreamSSEPartialFailed
  | SeedreamSSECompleted;

// 部分图片生成结果（用于流式回调）
export interface PartialImageResult {
  index: number;
  status: "completed" | "failed";
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}

export class SeedreamProvider extends BaseAIProvider {
  private baseUrl = "https://ark.ap-southeast.bytepluses.com/api/v3";
  private modelId: string;

  constructor() {
    // 从配置文件获取模型信息
    const modelConfig = IMAGE_MODELS["seedream-4-5"];

    super(
      "seedream",
      {
        id: "seedream",
        name: "seedream",
        displayName: "ByteDance Seedream",
        description: "High-quality AI image generation by ByteDance",
        status: "active",
        features: {
          textToImage: true,
          imageToImage: true,
          imageEdit: false,
          inpainting: false,
          outpainting: false,
          upscaling: false,
          backgroundRemoval: false,
          styleTransfer: false,
          batchGeneration: true,
          asyncCallback: false, // 使用同步/流式模式，不使用回调
          realTimeStatus: true,
        },
        models: [
          {
            id: "seedream-4-5",
            name: "seedream-4-5",
            displayName: modelConfig?.displayName || "Seedream 4.5",
            provider: "seedream",
            type: "text-to-image",
            status: "active",
            features: modelConfig?.features || [
              "text-to-image",
              "image-to-image",
              "batch-generation",
              "high-quality",
              "4k-resolution",
            ],
            maxImageCount: 15,
            // 4K 最大尺寸: 21:9 → 6048x2592, 9:16 → 2880x5120
            maxResolution: { width: 6048, height: 5120 },
            // 顺序: 正方形 → 竖屏 → 横屏
            supportedAspectRatios: modelConfig?.supportedAspectRatios || [
              "1:1",
              "3:4",
              "2:3",
              "9:16",
              "4:3",
              "3:2",
              "16:9",
              "21:9",
            ],
            supportedFormats: modelConfig?.supportedFormats || ["jpeg"],
            credits: modelConfig?.credits || 6,
          },
        ],
        // 实际计费逻辑在 config/image-models.ts 的 resolutionCredits 中
        pricing: {
          baseCredits: modelConfig?.credits || 6,
        },
      },
      process.env.BYTEPLUS_API_KEY
    );

    if (!this.apiKey) {
      console.warn(
        "⚠️ ARK_API_KEY environment variable is not set. Seedream provider may not work."
      );
    }

    // 从配置读取模型 endpoint ID
    this.modelId = modelConfig?.volcanoModel || "seedream-4-5";
  }

  /**
   * 生成图片 - 异步模式
   * 立即返回 taskId，异步执行 API 调用，模拟其他异步 provider 的行为
   * 回调中处理 R2 上传和数据库状态更新
   */
  async generateImage(request: GenerateImageRequest): Promise<ProviderResponse> {
    const taskId = this.generateTaskId();

    // 调试日志：打印完整的请求参数
    console.log("🔍 Seedream generateImage - incoming request:", {
      prompt: request.prompt?.substring(0, 50) + "...",
      model: request.model,
      aspect_ratio: request.aspect_ratio,
      resolution: request.resolution,
    });

    // 先验证请求参数
    try {
      this.validateRequest(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Validation failed";
      return {
        taskId,
        status: "failed",
        error: errorMessage,
        metadata: { provider: this.getProvider() },
      };
    }

    // 根据 aspect_ratio 和 resolution 获取 size 字符串 (Method 2: "2560x1440" 格式)
    const size = this.mapAspectRatioToSize(request.aspect_ratio, request.resolution);

    // 构建请求体 - 使用 Method 2 (精确像素尺寸字符串)
    const requestBody: SeedreamGenerateRequest = {
      model: this.modelId,
      prompt: request.prompt,
      size,
      response_format: "url",
      watermark: false,
      sequential_image_generation: "disabled",
      stream: false,
    };

    console.log("🎨 Seedream generateImage - async mode:", {
      taskId,
      model: requestBody.model,
      prompt: requestBody.prompt.substring(0, 100) + "...",
      aspect_ratio: request.aspect_ratio,
      resolution: request.resolution,
      size,
    });

    // 异步执行 API 调用（不阻塞返回）
    this.executeGenerateAsync(taskId, requestBody);

    // 立即返回 pending 状态
    return {
      taskId,
      status: "pending",
      metadata: {
        provider: this.getProvider(),
        model: "seedream-4-5",
      },
    };
  }

  /**
   * 异步执行图片生成 API 调用
   * 完成后触发内部回调更新状态
   */
  private executeGenerateAsync(taskId: string, requestBody: SeedreamGenerateRequest): void {
    setImmediate(async () => {
      try {
        console.log(`🔄 Seedream async API call started for task ${taskId}`);

        const response = await this.makeRequest(
          "/images/generations",
          "POST",
          requestBody
        );

        // 检查 API 错误
        if (response.error) {
          console.error(`❌ Seedream API error for task ${taskId}:`, response.error);
          triggerInternalCallback({
            taskId,
            status: "failed",
            error: response.error.message || "Seedream API error",
            metadata: {
              provider: this.getProvider(),
              error_code: response.error.code,
            },
          });
          return;
        }

        // 解析图片
        const images = this.parseImageData(response.data);

        if (images.length === 0) {
          console.error(`❌ No images generated for task ${taskId}`);
          triggerInternalCallback({
            taskId,
            status: "failed",
            error: "No images generated",
            metadata: { provider: this.getProvider() },
          });
          return;
        }

        console.log(`✅ Seedream task ${taskId} completed with ${images.length} image(s)`);

        // 触发成功回调
        triggerInternalCallback({
          taskId,
          status: "completed",
          images,
          metadata: {
            provider: this.getProvider(),
            model: "seedream-4-5",
            usage: response.usage,
          },
        });
      } catch (error) {
        console.error(`❌ Seedream async execution failed for task ${taskId}:`, error);
        triggerInternalCallback({
          taskId,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          metadata: { provider: this.getProvider() },
        });
      }
    });
  }

  /**
   * 图生图 - 异步模式，支持多图输入（最多 14 张）
   * 立即返回 taskId，异步执行 API 调用
   */
  async editImage(request: EditImageRequest): Promise<ProviderResponse> {
    const taskId = this.generateTaskId();

    // 先验证请求参数
    try {
      this.validateRequest(request);

      if (!request.imageUrls || request.imageUrls.length === 0) {
        throw new Error("At least one image URL is required for image-to-image");
      }

      if (request.imageUrls.length > 14) {
        throw new Error("Maximum 14 input images allowed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Validation failed";
      return {
        taskId,
        status: "failed",
        error: errorMessage,
        metadata: { provider: this.getProvider() },
      };
    }

    // 根据 aspect_ratio 和 resolution 获取 size 字符串 (Method 2: "2560x1440" 格式)
    const size = this.mapAspectRatioToSize(request.aspect_ratio, request.resolution);

    // 构建请求体 - 使用 Method 2 (精确像素尺寸字符串)
    const requestBody: SeedreamGenerateRequest = {
      model: this.modelId,
      prompt: request.prompt,
      image: request.imageUrls,
      size,
      response_format: "url",
      watermark: false,
      sequential_image_generation: "disabled",
      stream: false,
    };

    console.log("🖼️ Seedream editImage - async mode:", {
      taskId,
      model: requestBody.model,
      prompt: requestBody.prompt.substring(0, 100) + "...",
      aspect_ratio: request.aspect_ratio,
      resolution: request.resolution,
      size,
      image_count: request.imageUrls.length,
    });

    // 异步执行 API 调用（不阻塞返回）
    this.executeEditAsync(taskId, requestBody, request.imageUrls.length);

    // 立即返回 pending 状态
    return {
      taskId,
      status: "pending",
      metadata: {
        provider: this.getProvider(),
        model: "seedream-4-5",
        mode: "image-to-image",
      },
    };
  }

  /**
   * 异步执行图生图 API 调用
   */
  private executeEditAsync(taskId: string, requestBody: SeedreamGenerateRequest, inputImageCount: number): void {
    setImmediate(async () => {
      try {
        console.log(`🔄 Seedream async edit API call started for task ${taskId}`);

        const response = await this.makeRequest(
          "/images/generations",
          "POST",
          requestBody
        );

        // 检查 API 错误
        if (response.error) {
          console.error(`❌ Seedream API error for task ${taskId}:`, response.error);
          triggerInternalCallback({
            taskId,
            status: "failed",
            error: response.error.message || "Seedream API error",
            metadata: {
              provider: this.getProvider(),
              error_code: response.error.code,
              mode: "image-to-image",
            },
          });
          return;
        }

        // 解析图片
        const images = this.parseImageData(response.data);

        if (images.length === 0) {
          console.error(`❌ No images generated for task ${taskId}`);
          triggerInternalCallback({
            taskId,
            status: "failed",
            error: "No images generated",
            metadata: {
              provider: this.getProvider(),
              mode: "image-to-image",
            },
          });
          return;
        }

        console.log(`✅ Seedream edit task ${taskId} completed with ${images.length} image(s)`);

        // 触发成功回调
        triggerInternalCallback({
          taskId,
          status: "completed",
          images,
          metadata: {
            provider: this.getProvider(),
            model: "seedream-4-5",
            mode: "image-to-image",
            input_images: inputImageCount,
            usage: response.usage,
          },
        });
      } catch (error) {
        console.error(`❌ Seedream async edit execution failed for task ${taskId}:`, error);
        triggerInternalCallback({
          taskId,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          metadata: {
            provider: this.getProvider(),
            mode: "image-to-image",
          },
        });
      }
    });
  }

  /**
   * 批量生成图片 - 流式响应模式
   * 返回 taskId，实际图片通过 onPartialResult 回调更新
   */
  async generateImageBatch(
    request: GenerateImageRequest,
    maxImages: number,
    onPartialResult: (result: PartialImageResult) => Promise<void>
  ): Promise<ProviderResponse> {
    try {
      this.validateRequest(request);

      // 根据 aspect_ratio 和 resolution 获取 size 字符串 (Method 2: "2560x1440" 格式)
      const size = this.mapAspectRatioToSize(request.aspect_ratio, request.resolution);

      const requestBody: SeedreamGenerateRequest = {
        model: this.modelId,
        prompt: request.prompt,
        size,
        response_format: "url",
        watermark: false,
        sequential_image_generation: "auto", // 启用批量生成
        sequential_image_generation_options: {
          max_images: Math.min(maxImages, 15),
        },
        stream: true, // 启用流式响应
      };

      // 如果有参考图片
      if (request.image_input && request.image_input.length > 0) {
        requestBody.image = request.image_input;
      }

      console.log("📦 Seedream batch generation Request:", {
        model: requestBody.model,
        prompt: requestBody.prompt.substring(0, 100) + "...",
        aspect_ratio: request.aspect_ratio,
        resolution: request.resolution,
        size,
        max_images: maxImages,
      });

      const taskId = this.generateTaskId("batch");

      // 处理 SSE 流式响应
      await this.processSSEStream(requestBody, onPartialResult);

      return {
        taskId,
        status: "completed",
        metadata: {
          provider: this.getProvider(),
          model: "seedream-4-5",
          batch_mode: true,
          max_images: maxImages,
        },
      };
    } catch (error) {
      console.error("❌ Seedream batch generation error:", error);
      return {
        taskId: this.generateTaskId("batch"),
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          provider: this.getProvider(),
          batch_mode: true,
        },
      };
    }
  }

  /**
   * 处理 SSE 流式响应
   */
  private async processSSEStream(
    requestBody: SeedreamGenerateRequest,
    onPartialResult: (result: PartialImageResult) => Promise<void>
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Seedream SSE API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body for SSE stream");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: SeedreamSSEEvent = JSON.parse(line.slice(6));

              if (data.type === "image_generation.partial_succeeded") {
                const [width, height] = this.parseSizeString(data.size);
                await onPartialResult({
                  index: data.image_index,
                  status: "completed",
                  url: data.url,
                  width,
                  height,
                });
                console.log(`✅ Seedream batch: image ${data.image_index} completed`);
              } else if (data.type === "image_generation.partial_failed") {
                await onPartialResult({
                  index: data.image_index,
                  status: "failed",
                  error: data.error.message,
                });
                console.warn(
                  `⚠️ Seedream batch: image ${data.image_index} failed:`,
                  data.error.message
                );
              } else if (data.type === "image_generation.completed") {
                console.log(
                  `✅ Seedream batch completed: ${data.usage.generated_images} images`
                );
                break;
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE data:", line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 查询任务状态 - Seedream 使用同步/流式模式，不需要轮询
   */
  async getTaskStatus(taskId: string): Promise<ProviderResponse> {
    return {
      taskId,
      status: "completed",
      metadata: {
        provider: this.getProvider(),
        message: "Seedream uses sync/streaming mode, no status polling needed",
      },
    };
  }

  /**
   * 发送 HTTP 请求
   */
  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST",
    body?: any
  ): Promise<SeedreamApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    // 调试日志：打印请求体中的尺寸参数
    if (body && body.size) {
      console.log("📐 Seedream API request size:", body.size);
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Seedream API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * 解析图片数据
   */
  private parseImageData(
    data: Array<SeedreamImageData | SeedreamImageError>
  ): ProviderImageResult[] {
    const images: ProviderImageResult[] = [];

    for (const item of data) {
      // 检查是否是错误对象
      if ("error" in item) {
        console.warn("Image generation failed:", item.error.message);
        continue;
      }

      // 成功的图片数据
      if (item.url) {
        const [width, height] = this.parseSizeString(item.size);
        images.push({
          url: item.url,
          width,
          height,
          format: "jpeg",
        });
      }
    }

    return images;
  }

  /**
   * 解析尺寸字符串 "2048x2048" 为 [width, height]
   */
  private parseSizeString(size: string): [number, number] {
    if (!size) return [2048, 2048];

    // 处理 "2048x2048" 或 "2048×2048" (Unicode multiplication sign)
    const parts = size.split(/[x×]/);
    if (parts.length === 2) {
      const width = parseInt(parts[0], 10);
      const height = parseInt(parts[1], 10);
      if (!isNaN(width) && !isNaN(height)) {
        return [width, height];
      }
    }

    return [2048, 2048]; // 默认值
  }

  /**
   * 根据宽高比和分辨率映射到 size 字符串 (Method 2)
   * BytePlus Seedream 4.5 API 推荐尺寸:
   * - 总像素范围: [3,686,400, 16,777,216]
   * - 宽高比范围: [1/16, 16]
   *
   * 2K 推荐尺寸表 (来自官方文档):
   * 1:1  → 2048x2048
   * 4:3  → 2304x1728
   * 3:4  → 1728x2304
   * 16:9 → 2560x1440
   * 9:16 → 1440x2560
   * 3:2  → 2496x1664
   * 2:3  → 1664x2496
   * 21:9 → 3024x1296
   *
   * 4K = 2K × 2 (宽高各乘2)
   *
   * @returns size 字符串，格式为 "宽x高"，如 "2560x1440"
   */
  private mapAspectRatioToSize(aspectRatio?: string, resolution?: string): string {
    // 2K 基础尺寸 (官方文档推荐)
    const baseAspectRatioMap: Record<string, { width: number; height: number }> = {
      "1:1": { width: 2048, height: 2048 },
      "4:3": { width: 2304, height: 1728 },
      "3:4": { width: 1728, height: 2304 },
      "16:9": { width: 2560, height: 1440 },
      "9:16": { width: 1440, height: 2560 },
      "3:2": { width: 2496, height: 1664 },
      "2:3": { width: 1664, height: 2496 },
      "21:9": { width: 3024, height: 1296 },
    };

    // 获取基础尺寸，如果不支持的宽高比则记录警告并使用默认值
    const normalizedRatio = aspectRatio || "1:1";
    let base = baseAspectRatioMap[normalizedRatio];

    if (!base) {
      console.warn(`⚠️ Seedream: Unsupported aspect ratio "${aspectRatio}", falling back to 1:1`);
      base = { width: 2048, height: 2048 };
    }

    // 4K 分辨率：宽高各乘以 2
    if (resolution === "4K") {
      return `${base.width * 2}x${base.height * 2}`;
    }

    // 默认 2K
    return `${base.width}x${base.height}`;
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(prefix: string = ""): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return prefix
      ? `seedream_${prefix}_${timestamp}_${random}`
      : `seedream_${timestamp}_${random}`;
  }

  /**
   * 验证配置
   */
  validateConfig(): boolean {
    return !!this.apiKey;
  }

  /**
   * 调试方法 - 检查 API Key
   */
  debugApiKey(): { hasKey: boolean; keyLength?: number; keyPrefix?: string } {
    const hasKey = !!this.apiKey;
    if (hasKey && this.apiKey) {
      return {
        hasKey: true,
        keyLength: this.apiKey.length,
        keyPrefix: this.apiKey.substring(0, 8) + "...",
      };
    }
    return { hasKey: false };
  }
}
