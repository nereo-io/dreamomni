import { fal } from "@fal-ai/client";
import type {
  VideoGenerationRequest,
  VideoGenerationResponse,
} from "@/services/providers";
import type {
  GenerateImageRequest,
  EditImageRequest,
  ProviderResponse,
} from "@/services/providers/BaseAIProvider";
import {
  FALLBACK_TO_FAL_ENABLED,
  VIDEO_FALLBACK_MAP,
  IMAGE_FALLBACK_MAP,
  VIDEO_ENDPOINT_MAP,
  IMAGE_ENDPOINT_MAP,
  getFalCallbackUrl,
} from "./falFallbackConfig";

type FalVideoFallbackResult = {
  modelId: string;
  response: VideoGenerationResponse;
};

type FalImageFallbackResult = {
  modelId: string;
  response: ProviderResponse;
};

if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  });
}

const ensureFalEnabled = () => {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is required for fal.ai fallback");
  }
};

export async function submitFalVideoFallback(
  originalModelId: string,
  request: VideoGenerationRequest,
  {
    durationSeconds,
    imageUrls,
  }: {
    durationSeconds?: number;
    imageUrls?: string[];
  } = {}
): Promise<FalVideoFallbackResult | null> {
  if (!FALLBACK_TO_FAL_ENABLED) {
    return null;
  }

  const fallbackModelId = VIDEO_FALLBACK_MAP[originalModelId];
  if (!fallbackModelId) {
    return null;
  }

  const endpoint = VIDEO_ENDPOINT_MAP[fallbackModelId];
  if (!endpoint) {
    console.warn(
      `[fal-fallback] No fal endpoint configured for model ${fallbackModelId}`
    );
    return null;
  }

  ensureFalEnabled();

  const fallbackInput: VideoGenerationRequest = {
    ...request,
    model: fallbackModelId,
  };

  if (typeof durationSeconds === "number" && !Number.isNaN(durationSeconds)) {
    fallbackInput.duration = `${durationSeconds}s`;
  }

  if (imageUrls?.length) {
    fallbackInput.image_urls = imageUrls;
    fallbackInput.image_url = imageUrls[0];
  }

  // webhook URL 内聚到 fal 逻辑中
  const submitOptions: Record<string, any> = {
    input: fallbackInput,
    webhookUrl: getFalCallbackUrl(),
  };

  const { request_id } = await fal.queue.submit(endpoint, submitOptions);

  return {
    modelId: fallbackModelId,
    response: {
      request_id,
      status: "submitted",
      model: fallbackModelId,
    },
  };
}

const buildImageGenerateInput = (request: GenerateImageRequest) => {
  const input: Record<string, any> = {
    prompt: request.prompt,
  };

  if (request.aspect_ratio) {
    input.aspect_ratio = request.aspect_ratio;
  }
  if (request.resolution) {
    input.resolution = request.resolution;
  }
  if (request.output_format) {
    input.format = request.output_format;
  }
  if (request.image_input?.length) {
    input.image_urls = request.image_input;
    input.image_url = request.image_input[0];
  }

  return input;
};

const buildImageEditInput = (request: EditImageRequest) => {
  const input: Record<string, any> = {
    prompt: request.prompt,
    image_urls: request.imageUrls,
    image_url: request.imageUrls?.[0],
  };

  if (request.aspect_ratio) {
    input.aspect_ratio = request.aspect_ratio;
  }
  if (request.resolution) {
    input.resolution = request.resolution;
  }
  if (request.output_format) {
    input.format = request.output_format;
  }

  return input;
};

const toProviderResponse = (result: any): ProviderResponse => {
  const images = (result?.data?.images || result?.images || []).map(
    (img: any) => ({
      url: img.url || img,
      width: img.width,
      height: img.height,
    })
  );

  return {
    taskId: result?.requestId || result?.request_id || "",
    status: images.length > 0 ? "completed" : "processing",
    images,
    metadata: result?.data || result,
  };
};

export async function submitFalImageFallback(
  originalModelId: string,
  request: GenerateImageRequest | EditImageRequest,
  mode: "generate" | "edit"
): Promise<FalImageFallbackResult | null> {
  if (!FALLBACK_TO_FAL_ENABLED) {
    return null;
  }

  const fallbackModelId = IMAGE_FALLBACK_MAP[originalModelId];
  if (!fallbackModelId) {
    return null;
  }

  const endpoint = IMAGE_ENDPOINT_MAP[fallbackModelId];
  if (!endpoint) {
    console.warn(
      `[fal-fallback] No fal endpoint configured for image model ${fallbackModelId}`
    );
    return null;
  }

  ensureFalEnabled();

  const input =
    mode === "edit"
      ? buildImageEditInput(request as EditImageRequest)
      : buildImageGenerateInput(request as GenerateImageRequest);

  // 使用异步队列模式，webhook URL 内聚到 fal 逻辑中
  const submitOptions: Record<string, any> = {
    input,
    webhookUrl: getFalCallbackUrl(),
  };

  const { request_id } = await fal.queue.submit(endpoint, submitOptions);

  return {
    modelId: fallbackModelId,
    response: {
      taskId: request_id,
      status: "pending",
      metadata: {
        provider: "fal",
        model: fallbackModelId,
        request_id,
      },
    },
  };
}

