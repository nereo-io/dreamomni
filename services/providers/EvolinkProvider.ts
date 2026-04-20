import {
  getVideoModel,
  VideoModel,
  type VideoModelConfig,
} from "@/config/video-models";
import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

interface EvolinkSubmitContext {
  modelId: string;
  modelConfig?: VideoModelConfig;
  input: VideoGenerationRequest;
}

interface EvolinkModelStrategy {
  name: string;
  buildSubmitPayload(context: EvolinkSubmitContext): Record<string, any>;
  getStatusPath(requestId: string): string;
  getRequestId(submitResponse: any): string | null;
  extractVideoUrl(taskResponse: any): string | null;
}

const getPrimaryImageUrl = (input: VideoGenerationRequest): string | null => {
  if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
    const first = input.image_urls[0]?.trim();
    if (first) {
      return first;
    }
  }

  if (input.image_url?.trim()) {
    return input.image_url.trim();
  }

  return null;
};

const getImageUrls = (input: VideoGenerationRequest): string[] => {
  if (Array.isArray(input.image_urls)) {
    return input.image_urls
      .map((url) => url?.trim())
      .filter((url): url is string => Boolean(url));
  }

  const single = getPrimaryImageUrl(input);
  return single ? [single] : [];
};

const parseDuration = (value?: string): number | undefined => {
  if (!value?.toString().trim()) {
    return undefined;
  }
  const parsed = parseInt(value.toString().replace(/s$/i, "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeHailuoDuration = (value?: string): number | undefined => {
  const duration = parseDuration(value);
  if (duration === undefined) {
    return undefined;
  }
  if (duration !== 6 && duration !== 10) {
    throw new Error("Evolink Hailuo 2.3 only supports duration 6 or 10");
  }
  return duration;
};

const normalizeHailuoQuality = (
  quality: unknown
): "768p" | "1080p" | undefined => {
  if (!quality?.toString().trim()) {
    return undefined;
  }
  const normalized = quality.toString().trim().toLowerCase();
  if (normalized === "768p") {
    return "768p";
  }
  if (normalized === "1080p") {
    return "1080p";
  }
  throw new Error("Evolink Hailuo 2.3 only supports quality 768p or 1080p");
};

const defaultExtractVideoUrl = (taskResponse: any): string | null => {
  if (taskResponse?.result_url) {
    return taskResponse.result_url;
  }

  if (taskResponse?.output?.video_url) {
    return taskResponse.output.video_url;
  }

  if (Array.isArray(taskResponse?.results) && taskResponse.results.length > 0) {
    return taskResponse.results[0] || null;
  }
  return null;
};

const sora2Strategy: EvolinkModelStrategy = {
  name: "sora2",
  buildSubmitPayload({ modelId, modelConfig, input }) {
    const payload: Record<string, any> = {
      model: input.model || modelConfig?.providerModelId || modelId,
      prompt: input.prompt,
      remove_watermark: true,
    };

    const duration = parseDuration(input.duration);
    if (duration) {
      payload.duration = duration;
    }

    if (input.aspect_ratio?.trim()) {
      payload.aspect_ratio = input.aspect_ratio.trim();
    }

    const imageUrl = getPrimaryImageUrl(input);
    if (imageUrl) {
      payload.image_urls = [imageUrl];
    }

    return payload;
  },
  getStatusPath(requestId: string) {
    return `/v1/tasks/${encodeURIComponent(requestId)}`;
  },
  getRequestId(submitResponse: any) {
    return submitResponse?.task_id || submitResponse?.id || null;
  },
  extractVideoUrl: defaultExtractVideoUrl,
};

const hailuo23Strategy: EvolinkModelStrategy = {
  name: "hailuo2.3",
  buildSubmitPayload({ modelId, modelConfig, input }) {
    const payload: Record<string, any> = {
      model: input.model || modelConfig?.providerModelId || modelId,
      remove_watermark: true,
    };

    const imageUrls = getImageUrls(input);
    if (imageUrls.length > 1) {
      throw new Error("Evolink Hailuo 2.3 supports at most 1 image");
    }
    if (imageUrls.length === 1) {
      payload.image_urls = imageUrls;
    }

    if (input.prompt?.trim()) {
      payload.prompt = input.prompt.trim();
    }

    const duration = normalizeHailuoDuration(input.duration);
    if (duration) {
      payload.duration = duration;
    }

    const quality = normalizeHailuoQuality(input.quality || input.resolution);
    payload.quality = quality || "768p";

    const modelParams: Record<string, boolean> = {
      // Hailuo 2.3 prompt enhancement is handled by upstream workflow, not model-side.
      prompt_optimizer: false,
    };
    if (typeof input.fast_pretreatment === "boolean") {
      modelParams.fast_pretreatment = input.fast_pretreatment;
    }
    payload.model_params = modelParams;

    return payload;
  },
  getStatusPath(requestId: string) {
    return `/v1/tasks/${encodeURIComponent(requestId)}`;
  },
  getRequestId(submitResponse: any) {
    return submitResponse?.task_id || submitResponse?.id || null;
  },
  extractVideoUrl: defaultExtractVideoUrl,
};

/**
 * Infer media type from URL extension (for reference-to-video mixed media).
 */
const inferMediaType = (url: string): "image" | "video" | "audio" => {
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(mp4|mov)$/.test(lower)) return "video";
  if (/\.(mp3|wav)$/.test(lower)) return "audio";
  return "image";
};

const seedance20Strategy: EvolinkModelStrategy = {
  name: "seedance-2.0",
  buildSubmitPayload({ modelId, modelConfig, input }) {
    const providerModel =
      input.model || modelConfig?.providerModelId || modelId;

    // Determine if this is a reference-to-video model
    const isReference = providerModel.includes("reference-to-video");
    // Determine if this is an image-to-video model
    const isI2V = providerModel.includes("image-to-video");

    const payload: Record<string, any> = {
      model: providerModel,
      prompt: input.prompt,
    };

    // Duration (integer 4-15)
    const duration = parseDuration(input.duration);
    if (duration) {
      payload.duration = duration;
    }

    // Quality (resolution): Evolink Seedance 2.0 uses "quality" field (480p/720p)
    const quality = (input.quality || input.resolution || "")
      .toString()
      .trim()
      .toLowerCase();
    if (quality === "480p" || quality === "720p") {
      payload.quality = quality;
    }

    // Aspect ratio
    if (input.aspect_ratio?.trim()) {
      const ratio = input.aspect_ratio.trim();
      payload.aspect_ratio =
        ratio === "Auto" ? "adaptive" : ratio;
    }

    // Audio control
    if (typeof input.generate_audio === "boolean") {
      payload.generate_audio = input.generate_audio;
    }

    // Handle media inputs based on model type
    if (isReference) {
      // Reference-to-video: split media_urls into typed arrays
      const mediaUrls = (
        Array.isArray(input.media_urls) ? input.media_urls : []
      ).filter((url): url is string => Boolean(url?.trim()));

      if (mediaUrls.length > 0) {
        const imageRefs: string[] = [];
        const videoRefs: string[] = [];
        const audioRefs: string[] = [];
        for (const url of mediaUrls) {
          const type = inferMediaType(url);
          if (type === "video") videoRefs.push(url);
          else if (type === "audio") audioRefs.push(url);
          else imageRefs.push(url);
        }
        if (imageRefs.length > 0) payload.image_urls = imageRefs;
        if (videoRefs.length > 0) payload.video_urls = videoRefs;
        if (audioRefs.length > 0) payload.audio_urls = audioRefs;
      }
    } else if (isI2V) {
      // Image-to-video: pass image_urls (1-2 images)
      const imageUrls = getImageUrls(input);
      if (imageUrls.length > 0) {
        payload.image_urls = imageUrls;
      }
    }
    // Text-to-video: no image/video/audio params

    return payload;
  },
  getStatusPath(requestId: string) {
    return `/v1/tasks/${encodeURIComponent(requestId)}`;
  },
  getRequestId(submitResponse: any) {
    return submitResponse?.id || submitResponse?.task_id || null;
  },
  extractVideoUrl(taskResponse: any) {
    // Evolink Seedance 2.0 returns results as array of URLs
    if (
      Array.isArray(taskResponse?.results) &&
      taskResponse.results.length > 0
    ) {
      return taskResponse.results[0] || null;
    }
    return defaultExtractVideoUrl(taskResponse);
  },
};

const normalizeAspectRatio = (ratio?: string): string | undefined => {
  if (!ratio?.trim()) return undefined;
  const normalized = ratio.trim().toLowerCase();
  // sora-2-preview only supports these exact values; reject anything else (e.g. "auto")
  const mapping: Record<string, string> = {
    "16:9": "16:9",
    "1280x720": "1280x720",
    "9:16": "9:16",
    "720x1280": "720x1280",
  };
  return mapping[normalized] || undefined;
};

const sora2PreviewStrategy: EvolinkModelStrategy = {
  name: "sora2-preview",
  buildSubmitPayload({ modelId, modelConfig, input }) {
    const payload: Record<string, any> = {
      model: input.model || modelConfig?.providerModelId || "sora-2-preview",
      prompt: input.prompt,
    };

    const duration = parseDuration(input.duration);
    if (duration) {
      payload.duration = duration;
    }

    const aspectRatio = normalizeAspectRatio(input.aspect_ratio);
    if (aspectRatio) {
      payload.aspect_ratio = aspectRatio;
    }

    const imageUrls = getImageUrls(input);
    if (imageUrls.length > 1) {
      throw new Error("Sora 2 Preview supports at most 1 image");
    }
    if (imageUrls.length === 1) {
      payload.image_urls = imageUrls;
    }

    return payload;
  },
  getStatusPath(requestId: string) {
    return `/v1/tasks/${encodeURIComponent(requestId)}`;
  },
  getRequestId(submitResponse: any) {
    return submitResponse?.id || submitResponse?.task_id || null;
  },
  extractVideoUrl(taskResponse: any) {
    // sora-2-preview returns results as an array of URLs
    if (Array.isArray(taskResponse?.results) && taskResponse.results.length > 0) {
      return taskResponse.results[0] || null;
    }
    return defaultExtractVideoUrl(taskResponse);
  },
};

export class EvolinkProvider implements VideoProvider {
  private baseUrl = "https://api.evolink.ai";
  private apiKey: string;

  private strategies: Partial<Record<VideoModel, EvolinkModelStrategy>> = {
    [VideoModel.SORA2]: sora2Strategy,
    [VideoModel.HAILUO_2_3]: hailuo23Strategy,
    [VideoModel.SEEDANCE_2_0]: seedance20Strategy,
    [VideoModel.SEEDANCE_2_0_FAST]: seedance20Strategy,
  };

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Evolink API key is required");
    }
    this.apiKey = apiKey;
  }

  getName(): string {
    return "evolink";
  }

  private getStrategy(modelId: string): {
    strategy: EvolinkModelStrategy;
    modelConfig?: VideoModelConfig;
  } {
    const modelConfig = getVideoModel(modelId);
    const modelName = modelConfig?.modelName;
    if (!modelName) {
      throw new Error(`Evolink model config missing modelName: ${modelId}`);
    }

    const strategy = this.strategies[modelName];
    if (!strategy) {
      throw new Error(`Evolink strategy not implemented for model: ${modelName}`);
    }

    return { strategy, modelConfig };
  }

  private async makeRequest(
    path: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(120000),
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      let detail = errorText;
      try {
        const errorData = JSON.parse(errorText);
        detail = errorData.error?.message || errorData.message || errorText;
      } catch {
        detail = errorText;
      }
      throw new Error(`Evolink API ${response.status}: ${detail}`);
    }

    return response.json();
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    try {
      const { strategy, modelConfig } = this.getStrategy(model);
      const requestBody = strategy.buildSubmitPayload({
        modelId: model,
        modelConfig,
        input,
      });

      if (webhookUrl) {
        requestBody.callback_url = webhookUrl;
      }

      console.log(
        `🔗 [Evolink:${strategy.name}] Submit request:`,
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest(
        "/v1/videos/generations",
        "POST",
        requestBody
      );

      console.log(
        `🔗 [Evolink:${strategy.name}] Submit response:`,
        JSON.stringify(response, null, 2)
      );

      const requestId = strategy.getRequestId(response);
      if (!requestId) {
        throw new Error("No task id received from Evolink API");
      }

      return {
        request_id: requestId,
        status: response.status || "pending",
        model,
      };
    } catch (error) {
      throw new Error(
        `Evolink submit failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async status(
    model: string,
    requestId: string
  ): Promise<VideoGenerationStatus> {
    try {
      const { strategy } = this.getStrategy(model);
      const response = await this.makeRequest(strategy.getStatusPath(requestId));

      const evolinkStatus = (response.status || "").toLowerCase();
      let status = "IN_PROGRESS";

      switch (evolinkStatus) {
        case "succeeded":
        case "completed":
          status = "COMPLETED";
          break;
        case "failed":
          status = "FAILED";
          break;
        case "processing":
          status = "IN_PROGRESS";
          break;
        case "queueing":
        case "pending":
          status = "IN_QUEUE";
          break;
        case "cancelled":
          status = "CANCELLED";
          break;
      }

      return {
        request_id: requestId,
        status,
        progress: response.progress || 0,
        error_message:
          evolinkStatus === "failed"
            ? response.error?.message || "Generation failed"
            : undefined,
        raw_data: response,
      };
    } catch (error) {
      throw new Error(
        `Evolink status check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async result(model: string, requestId: string): Promise<VideoGenerationResult> {
    try {
      const statusResult = await this.status(model, requestId);
      if (statusResult.status !== "COMPLETED") {
        return {
          request_id: requestId,
          status: statusResult.status,
          data: statusResult.raw_data,
          error_message: statusResult.error_message,
        };
      }

      const { strategy } = this.getStrategy(model);
      const rawData = statusResult.raw_data;
      const videoUrl = strategy.extractVideoUrl(rawData);

      return {
        request_id: requestId,
        status: "COMPLETED",
        video_url: videoUrl || undefined,
        data: rawData,
      };
    } catch (error) {
      throw new Error(
        `Evolink result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
