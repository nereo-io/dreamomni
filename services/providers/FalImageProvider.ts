import { fal } from "@fal-ai/client";
import {
  BaseAIProvider,
  GenerateImageRequest,
  EditImageRequest,
  ProviderResponse,
} from "./BaseAIProvider";
import type { AIServiceProvider } from "@/types/provider.d";
import { IMAGE_MODELS } from "@/config/image-models";

type FalImageEndpoint =
  | "fal-ai/nano-banana"
  | "fal-ai/nano-banana/edit"
  | "fal-ai/nano-banana-pro"
  | "fal-ai/nano-banana-pro/edit";

const MODEL_ENDPOINT_MAP: Record<string, FalImageEndpoint> = {
  "fal-nano-banana": "fal-ai/nano-banana",
  "fal-nano-banana-edit": "fal-ai/nano-banana/edit",
  "fal-nano-banana-pro": "fal-ai/nano-banana-pro",
  "fal-nano-banana-pro-edit": "fal-ai/nano-banana-pro/edit",
};

export class FalImageProvider extends BaseAIProvider {
  constructor() {
    super(
      "fal" as AIServiceProvider,
      {
        id: "fal" as AIServiceProvider,
        name: "fal.ai",
        displayName: "fal.ai",
        description: "fal.ai hosted image models",
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
          realTimeStatus: false,
        },
        models: Object.values(IMAGE_MODELS)
          .filter((m) => m.provider === "fal")
          .map((m) => ({
            id: m.id,
            name: m.name,
            displayName: m.displayName,
            provider: "fal" as AIServiceProvider,
            type: m.type === "text-to-image" ? "text-to-image" : "image-to-image",
            status: m.status === "active" ? "active" : "deprecated",
            features: m.features,
            maxImageCount: m.maxInputImages || 1,
            maxResolution: m.supportedResolutions
              ? { width: 4096, height: 4096 }
              : { width: 1024, height: 1024 },
            supportedAspectRatios: m.supportedAspectRatios,
            supportedFormats: m.supportedFormats,
            credits: m.credits,
          })),
      },
      process.env.FAL_KEY
    );

    fal.config({
      credentials: process.env.FAL_KEY,
    });
  }

  private getEndpoint(modelId?: string): FalImageEndpoint {
    const endpoint = modelId ? MODEL_ENDPOINT_MAP[modelId] : undefined;
    if (!endpoint) {
      throw new Error(`Unknown fal image model: ${modelId}`);
    }
    return endpoint;
  }

  private buildInputFromGenerate(request: GenerateImageRequest) {
    const { prompt, aspect_ratio, resolution, output_format, image_input } = request;
    const input: Record<string, any> = {
      prompt,
    };

    if (aspect_ratio) {
      input.aspect_ratio = aspect_ratio;
    }

    if (resolution) {
      input.resolution = resolution;
    }

    if (output_format) {
      input.format = output_format;
    }

    if (image_input && image_input.length) {
      input.image_urls = image_input;
      input.image_url = image_input[0];
    }

    return input;
  }

  private buildInputFromEdit(request: EditImageRequest) {
    const { prompt, imageUrls, aspect_ratio, resolution, output_format } = request;
    const input: Record<string, any> = {
      prompt,
      image_urls: imageUrls,
      image_url: imageUrls?.[0],
    };

    if (aspect_ratio) {
      input.aspect_ratio = aspect_ratio;
    }

    if (resolution) {
      input.resolution = resolution;
    }

    if (output_format) {
      input.format = output_format;
    }

    return input;
  }

  private toProviderResponse(result: any): ProviderResponse {
    const images = (result?.data?.images || result?.images || []).map(
      (img: any) => ({
        url: img.url || img,
        width: img.width,
        height: img.height,
      })
    );

    return {
      taskId: result?.requestId || result?.request_id || "",
      status: "completed",
      images,
      metadata: result?.data || result,
    };
  }

  async generateImage(request: GenerateImageRequest): Promise<ProviderResponse> {
    this.validateRequest(request);
    const modelId = request.model || "fal-nano-banana";
    const endpoint = this.getEndpoint(modelId);
    const input = this.buildInputFromGenerate(request);

    const result = await fal.subscribe(endpoint, {
      input,
      logs: false,
    });

    return this.toProviderResponse(result);
  }

  async editImage(request: EditImageRequest): Promise<ProviderResponse> {
    this.validateRequest(request);
    const modelId = request.model || "fal-nano-banana-edit";
    const endpoint = this.getEndpoint(modelId);
    const input = this.buildInputFromEdit(request);

    const result = await fal.subscribe(endpoint, {
      input,
      logs: false,
    });

    return this.toProviderResponse(result);
  }

  async getTaskStatus(taskId: string): Promise<ProviderResponse> {
    // fal.ai 通过回调获取结果，不提供轮询接口
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
   * 处理 fal.ai 的 webhook 回调
   * Webhook format from fal.ai:
   * {
   *   request_id: string,
   *   status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
   *   output?: { images: Array<{ url: string, width: number, height: number }> },
   *   error?: string,
   *   logs?: any[],
   *   metrics?: any
   * }
   */
  async handleCallback(callbackData: any): Promise<ProviderResponse> {
    console.log("🎨 Processing fal.ai image callback:", JSON.stringify(callbackData, null, 2));

    const requestId = callbackData.request_id;
    const status = callbackData.status;

    // 映射 fal.ai webhook 状态到标准状态
    // Webhook 格式: status = "OK" | "ERROR"
    // 队列格式: status = "COMPLETED" | "FAILED" | "IN_PROGRESS" | "IN_QUEUE"
    let mappedStatus: "pending" | "processing" | "completed" | "failed";
    
    if (status === "OK" || status === "COMPLETED") {
      mappedStatus = "completed";
    } else if (status === "ERROR" || status === "FAILED") {
      mappedStatus = "failed";
    } else if (status === "IN_PROGRESS") {
      mappedStatus = "processing";
    } else if (status === "IN_QUEUE") {
      mappedStatus = "pending";
    } else {
      mappedStatus = "pending";
    }

    const baseResult: ProviderResponse = {
      taskId: requestId,
      status: mappedStatus,
      metadata: {
        provider: "fal",
        original_callback: callbackData,
        logs: callbackData.logs,
        metrics: callbackData.metrics,
      },
    };

    // 处理完成状态
    if (mappedStatus === "completed") {
      // Webhook 格式: payload.images
      // 队列格式: output.images
      const imageSource = callbackData.payload?.images || callbackData.output?.images || [];
      const images = imageSource.map((img: any) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        format: img.content_type?.split("/")?.[1] || "png",
      }));

      if (images.length > 0) {
        console.log(`✅ fal.ai callback: ${images.length} image(s) generated`);
        return {
          ...baseResult,
          images,
          metadata: {
            ...baseResult.metadata,
            image_count: images.length,
          },
        };
      } else {
        console.error("❌ fal.ai callback: Completed but no images found");
        return {
          ...baseResult,
          status: "failed",
          error: "No images in callback output",
        };
      }
    }

    // 处理失败状态
    if (mappedStatus === "failed") {
      const errorMessage = callbackData.error || "Generation failed";
      console.error(`❌ fal.ai callback failed: ${errorMessage}`);
      return {
        ...baseResult,
        error: errorMessage,
      };
    }

    // 处理中状态
    return baseResult;
  }
}

