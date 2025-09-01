/**
 * Nano Banana AI Image Generation Provider
 * Integrates with Kie.ai Nano Banana API for image generation and editing
 */

import { BaseAIProvider, GenerateImageRequest, EditImageRequest, ProviderResponse } from "./BaseAIProvider";
import { AIServiceProvider, ProviderImageResult } from "@/types/provider";

export interface NanoBananaTextToImageRequest {
  prompt: string;
}

export interface NanoBananaImageEditRequest {
  prompt: string;
  image_urls: string[];
}

export interface NanoBananaApiResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;
    status: string;
  };
}

export interface NanoBananaResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  timings?: {
    inference: number;
  };
  seed?: number;
  has_nsfw_concepts?: boolean[];
}

// Callback interfaces for webhook responses - Updated for actual API format
export interface NanoBananaCallbackRequest {
  code: number;                    // API状态码 (200=成功, 501=失败等)
  msg: string;                     // 状态消息
  data: {
    taskId: string;                // 任务ID
    state: "success" | "fail" | "processing" | "pending";  // 任务状态
    model: string;                 // 使用的模型
    createTime: number;            // 创建时间戳
    updateTime: number;            // 更新时间戳
    completeTime?: number;         // 完成时间戳
    costTime?: number;             // 耗时(秒)
    
    // 成功时的数据
    result?: NanoBananaResponse;   // 成功时的结果
    
    // 失败时的数据
    failCode?: string;             // 失败代码
    failMsg?: string;              // 失败消息
    
    // 其他参数
    param?: string;                // 原始请求参数(JSON字符串)
  };
}

export interface NanoBananaCallbackResponse {
  success: boolean;
  message: string;
}

export class NanoBananaProvider extends BaseAIProvider {
  private baseUrl: string = "https://api.kie.ai";

  constructor() {
    // 这里需要传递provider和config，先使用简化版本
    super("nano_banana", {
      id: "nano_banana",
      name: "nano-banana",
      displayName: "Kie.ai Nano Banana",
      description: "High-quality AI image generation service",
      status: "active",
      features: {
        textToImage: true,
        imageToImage: true,
        imageEdit: true,
        inpainting: false,
        outpainting: false,
        upscaling: false,
        backgroundRemoval: false,
        styleTransfer: false,
        batchGeneration: false,
        asyncCallback: true,
        realTimeStatus: false
      },
      models: [
        {
          id: "google/nano-banana",
          name: "nano-banana",
          displayName: "Nano Banana",
          provider: "nano_banana",
          type: "text-to-image",
          status: "active",
          features: ["text-to-image", "high-quality"],
          maxImageCount: 1,
          maxResolution: { width: 1024, height: 1024 },
          supportedAspectRatios: ["1:1", "16:9", "9:16"],
          supportedFormats: ["jpg", "png"],
          credits: 1
        },
        {
          id: "nano-banana-edit",
          name: "nano-banana-edit",
          displayName: "Nano Banana Edit",
          provider: "nano_banana",
          type: "image-edit",
          status: "active",
          features: ["image-edit", "high-quality"],
          maxImageCount: 1,
          maxResolution: { width: 1024, height: 1024 },
          supportedAspectRatios: ["1:1"],
          supportedFormats: ["jpg", "png"],
          credits: 2
        }
      ],
      pricing: {
        baseCredits: 1,
        qualityMultiplier: {
          standard: 1,
          high: 1.5,
          ultra: 2
        }
      }
    }, process.env.NANO_BANANa_API_KEY);
    
    if (!this.apiKey) {
      throw new Error("KIE_AI_API_KEY environment variable is required for Nano Banana");
    }
  }

  /**
   * Generate image from text prompt using Nano Banana model
   * Returns task ID for tracking the async generation
   */
  async generateFromText(request: NanoBananaTextToImageRequest): Promise<{ task_id: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/playground/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        callBackUrl: this.getNanoBananaCallbackUrl(),
        input: {
          prompt: request.prompt,
        },
        model: "google/nano-banana",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nano Banana API error: ${response.status} - ${errorText}`);
    }

    const apiResponse: NanoBananaApiResponse = await response.json();
    
    // Log the response for debugging
    console.log('Nano Banana API Response:', JSON.stringify(apiResponse, null, 2));
    
    // Check if the API returned success code
    if (apiResponse.code !== 200) {
      throw new Error(`Nano Banana API error: ${apiResponse.code} - ${apiResponse.message || 'Unknown error'}`);
    }

    // Ensure data exists
    if (!apiResponse.data) {
      throw new Error('Nano Banana API error: No data in response');
    }

    return apiResponse.data;
  }

  /**
   * Edit images using Nano Banana Edit model
   * Returns task ID for tracking the async generation
   */
  async editImages(request: NanoBananaImageEditRequest): Promise<{ task_id: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/api/v1/playground/createTask`, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        callBackUrl: this.getNanoBananaCallbackUrl(),
        input: {
          prompt: request.prompt,
          image_urls: request.image_urls,
        },
        model: "google/nano-banana-edit",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nano Banana Edit API error: ${response.status} - ${errorText}`);
    }

    const apiResponse: NanoBananaApiResponse = await response.json();
    
    // Log the response for debugging
    console.log('Nano Banana Edit API Response:', JSON.stringify(apiResponse, null, 2));
    
    // Check if the API returned success code
    if (apiResponse.code !== 200) {
      throw new Error(`Nano Banana Edit API error: ${apiResponse.code} - ${apiResponse.message || 'Unknown error'}`);
    }

    // Ensure data exists
    if (!apiResponse.data) {
      throw new Error('Nano Banana Edit API error: No data in response');
    }

    return apiResponse.data;
  }

  /**
   * Get task status and result by task ID
   */
  async getTaskResult(taskId: string): Promise<NanoBananaCallbackRequest | null> {
    try {
      // TODO: This would typically query your database for the task result
      // For now, we'll return null since the result comes via webhook
      
      // In a real implementation, you would:
      // 1. Query the database for the task result
      // 2. Return the stored callback data
      
      console.log(`Querying result for task: ${taskId}`);
      return null;
      
    } catch (error) {
      console.error('Error getting task result:', error);
      return null;
    }
  }

  /**
   * Generate callback URL for the current environment
   */
  private getNanoBananaCallbackUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://6782080cf00c.ngrok-free.app";
    return `${baseUrl}/api/ai-callback/nano_banana`;
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    return !!this.apiKey;
  }

  /**
   * Debug method to check API key
   */
  debugApiKey(): { hasKey: boolean; keyLength?: number; keyPrefix?: string } {
    const hasKey = !!this.apiKey;
    if (hasKey && this.apiKey) {
      return {
        hasKey: true,
        keyLength: this.apiKey.length,
        keyPrefix: this.apiKey.substring(0, 8) + "..."
      };
    }
    return { hasKey: false };
  }

  // BaseAIProvider 抽象方法实现

  /**
   * Generate image from text prompt
   */
  async generateImage(request: GenerateImageRequest): Promise<ProviderResponse> {
    try {
      this.validateRequest(request);
      
      const result = await this.generateFromText({
        prompt: request.prompt,
      });

      return {
        taskId: result.task_id,
        status: "pending", // Nano Banana 是异步的
        metadata: {
          provider: this.getProvider(),
          model: request.model || "google/nano-banana",
          apiStatus: result.status,
        },
      };
    } catch (error) {
      return {
        taskId: "",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          provider: this.getProvider(),
        },
      };
    }
  }

  /**
   * Edit image with prompt
   */
  async editImage(request: EditImageRequest): Promise<ProviderResponse> {
    try {
      this.validateRequest(request);
      
      const result = await this.editImages({
        prompt: request.prompt,
        image_urls: request.imageUrls,
      });

      return {
        taskId: result.task_id,
        status: "pending", // Nano Banana 是异步的
        metadata: {
          provider: this.getProvider(),
          model: request.model || "nano-banana-edit",
          apiStatus: result.status,
        },
      };
    } catch (error) {
      return {
        taskId: "",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          provider: this.getProvider(),
        },
      };
    }
  }

  /**
   * Get task status (暂不实现，通过回调获取结果)
   */
  async getTaskStatus(taskId: string): Promise<ProviderResponse> {
    // Nano Banana 通过回调获取结果，不提供轮询接口
    return {
      taskId: taskId,
      status: "pending",
      metadata: {
        provider: this.getProvider(),
        message: "Status updates via callback only",
      },
    };
  }

  /**
   * Handle callback from Nano Banana API
   */
  async handleCallback(callbackData: NanoBananaCallbackRequest): Promise<ProviderResponse> {
    console.log('🍌 Processing Nano Banana callback:', callbackData);

    // 解析回调数据
    const { code, msg, data } = callbackData;
    const { taskId, state, model, createTime, updateTime, completeTime, costTime, failCode, failMsg, result } = data;

    // 映射状态到 ProviderResponse 支持的状态
    const mapStatus = (state: string, code: number): "pending" | "processing" | "completed" | "failed" => {
      // 首先检查API状态码
      if (code === 200 && state === "success") {
        return "completed";
      } else if (code !== 200 || state === "fail") {
        return "failed";
      }
      
      // 然后检查任务状态
      switch (state) {
        case "success":
          return "completed";
        case "fail":
          return "failed";
        case "processing":
          return "processing";
        case "pending":
          return "pending";
        default:
          return "pending";
      }
    };

    const mappedStatus = mapStatus(state, code);
    
    const baseResult: ProviderResponse = {
      taskId: taskId,
      status: mappedStatus,
      metadata: {
        provider: this.getProvider(),
        original_callback: callbackData,
        model: model,
        api_code: code,
        api_message: msg,
        create_time: new Date(createTime).toISOString(),
        update_time: new Date(updateTime).toISOString(),
        complete_time: completeTime ? new Date(completeTime).toISOString() : undefined,
        cost_time_seconds: costTime,
      },
    };

    if (mappedStatus === "completed" && result) {
      // 处理成功的回调
      const images: ProviderImageResult[] = result.images.map(img => ({
        url: img.url,
        width: img.width,
        height: img.height,
        format: img.url.split('.').pop() || 'jpg',
      }));

      return {
        ...baseResult,
        status: "completed" as const,
        images: images,
        metadata: {
          ...baseResult.metadata,
          timings: result.timings,
          seed: result.seed,
          has_nsfw_concepts: result.has_nsfw_concepts,
        },
      };
    } else if (mappedStatus === "failed") {
      // 处理失败的回调
      let errorMessage = "Generation failed";
      
      // 构建详细的错误信息
      if (failCode && failMsg) {
        errorMessage = `${failMsg} (Code: ${failCode})`;
      } else if (failMsg) {
        errorMessage = failMsg;
      } else if (msg && msg !== "success") {
        errorMessage = msg;
      }

      return {
        ...baseResult,
        status: "failed" as const,
        error: errorMessage,
        metadata: {
          ...baseResult.metadata,
          fail_code: failCode,
          fail_message: failMsg,
        },
      };
    } else {
      // 处理进行中的状态
      return {
        ...baseResult,
        status: mappedStatus,
      };
    }
  }
}
