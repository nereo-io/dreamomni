import { getVideoModel } from "@/config/video-models";
import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

type KlingGenerationMode = "std" | "pro";

export class KieAiKlingProvider implements VideoProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Kie.ai API key is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = `${process.env.KIE_AI_BASE_URL || "https://api.kie.ai"}/api/v1/jobs`;
  }

  getName(): string {
    return "kie-ai-kling3";
  }

  private resolveMode(input: VideoGenerationRequest): KlingGenerationMode {
    // UX 只暴露分辨率，provider 内部负责把 resolution 映射为 mode。
    const resolution = input.resolution?.toString().trim().toLowerCase();
    if (resolution && ["1080p", "2k", "4k"].includes(resolution)) {
      return "pro";
    }

    return "std";
  }

  private resolveImageUrl(input: VideoGenerationRequest): string | null {
    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      const firstUrl = input.image_urls[0]?.trim();
      if (firstUrl) {
        return firstUrl;
      }
    }

    if (input.image_url?.trim()) {
      return input.image_url.trim();
    }

    return null;
  }

  private resolveImageUrls(input: VideoGenerationRequest): string[] {
    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      const normalizedUrls = input.image_urls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean);
      if (normalizedUrls.length > 0) {
        return normalizedUrls;
      }
    }

    const imageUrl = this.resolveImageUrl(input);
    return imageUrl ? [imageUrl] : [];
  }

  private resolveMultiShots(input: VideoGenerationRequest): boolean {
    if (typeof input.multi_shots === "boolean") {
      return input.multi_shots;
    }

    if (typeof input.multiShots === "boolean") {
      return input.multiShots;
    }

    return false;
  }

  private resolveSound(input: VideoGenerationRequest): boolean | undefined {
    if (typeof input.sound === "boolean") {
      return input.sound;
    }

    if (typeof input.generate_audio === "boolean") {
      return input.generate_audio;
    }

    return undefined;
  }

  private normalizeDuration(duration?: string): string | undefined {
    if (!duration?.toString().trim()) {
      return undefined;
    }

    return duration.toString().replace(/s$/i, "").trim();
  }

  private buildCreateTaskBody(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ) {
    const modelConfig = getVideoModel(model);
    const providerModelId = modelConfig?.providerModelId || "kling-3.0/video";
    const prompt = input.prompt?.trim();

    if (!prompt) {
      throw new Error("Kling prompt is required");
    }

    const requestBody: any = {
      model: providerModelId,
      input: {
        mode: this.resolveMode(input),
        prompt,
        multi_shots: this.resolveMultiShots(input),
      },
    };

    const imageUrls = this.resolveImageUrls(input);
    if (imageUrls.length > 0) {
      requestBody.input.image_urls = imageUrls;
      // Keep legacy single-image field for compatibility.
      requestBody.input.image_url = imageUrls[0];
    }

    if (input.aspect_ratio?.trim()) {
      requestBody.input.aspect_ratio = input.aspect_ratio.trim();
    }

    const normalizedDuration = this.normalizeDuration(input.duration);
    if (normalizedDuration) {
      requestBody.input.duration = normalizedDuration;
    }

    const sound = this.resolveSound(input);
    if (typeof sound === "boolean") {
      requestBody.input.sound = sound;
    }

    if (input.negative_prompt?.trim()) {
      requestBody.input.negative_prompt = input.negative_prompt.trim();
    }

    if (typeof input.cfg_scale === "number" && Number.isFinite(input.cfg_scale)) {
      requestBody.input.cfg_scale = input.cfg_scale;
    }

    if (typeof input.seed === "number" && Number.isFinite(input.seed)) {
      requestBody.input.seed = input.seed;
    }

    if (webhookUrl) {
      requestBody.callBackUrl = webhookUrl;
    }

    return requestBody;
  }

  private extractVideoUrl(data: any): string | null {
    if (Array.isArray(data?.info?.resultUrls) && data.info.resultUrls.length > 0) {
      return data.info.resultUrls[0];
    }

    if (!data?.resultJson) {
      return null;
    }

    try {
      const parsed = JSON.parse(data.resultJson);
      if (Array.isArray(parsed?.resultUrls) && parsed.resultUrls.length > 0) {
        return parsed.resultUrls[0];
      }
    } catch (error) {
      console.error("Failed to parse Kling resultJson:", error);
    }

    return null;
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
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
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      let errorMessage: string;
      switch (response.status) {
        case 401:
          errorMessage =
            "Unauthorized - Authentication credentials missing or invalid";
          break;
        case 402:
          errorMessage =
            "Insufficient Credits - Account does not have enough credits";
          break;
        case 404:
          errorMessage =
            "Not Found - The requested resource or endpoint does not exist";
          break;
        case 422:
          errorMessage =
            "Validation Error - The request parameters failed validation checks";
          break;
        case 429:
          errorMessage =
            "Rate Limited - Request limit has been exceeded for this resource";
          break;
        case 500:
          errorMessage =
            "Server Error - An unexpected error occurred while processing the request";
          break;
        default:
          errorMessage =
            errorData.msg ||
            errorData.error?.message ||
            errorText ||
            `API Error: ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    try {
      const endpoint = "/createTask";
      const requestBody = this.buildCreateTaskBody(model, input, webhookUrl);

      console.log(
        "🎬 Kie.ai Kling 3.0 视频生成请求参数:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest(endpoint, "POST", requestBody);

      console.log(
        "🎬 Kie.ai Kling 3.0 提交响应:",
        JSON.stringify(response, null, 2)
      );

      if (response.code !== 200) {
        throw new Error(response.msg || "Generation request failed");
      }

      if (!response.data?.taskId) {
        throw new Error("No taskId received from Kie.ai Kling API");
      }

      return {
        request_id: response.data.taskId,
        status: "submitted",
        model,
        task_id: response.data.taskId,
        raw_response: response,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai Kling Provider submit failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async status(
    _model: string,
    requestId: string
  ): Promise<VideoGenerationStatus> {
    try {
      const endpoint = `/recordInfo?taskId=${encodeURIComponent(requestId)}`;
      const response = await this.makeRequest(endpoint, "GET");

      if (response.code !== 200) {
        throw new Error(response.msg || "Status check failed");
      }

      const data = response.data;
      const state = (data?.state || "").toString().toLowerCase();
      const failCode = data?.failCode;
      const isFailedState =
        state === "fail" || (failCode !== null && failCode !== undefined);
      const videoUrl = this.extractVideoUrl(data);

      let status: string;
      let progress = 0;
      let error_message: string | undefined;

      if (isFailedState) {
        status = "FAILED";
        progress = 100;
        error_message =
          data?.failMsg ||
          response.msg ||
          (failCode ? `Error code: ${failCode}` : "Generation failed");
      } else if (state === "success" && videoUrl) {
        status = "COMPLETED";
        progress = 100;
      } else if (state === "success") {
        status = "IN_PROGRESS";
        progress = 90;
      } else if (state === "waiting" || state === "pending") {
        status = "IN_PROGRESS";
        progress = 25;
      } else if (state === "processing") {
        status = "IN_PROGRESS";
        progress = 60;
      } else {
        status = "IN_PROGRESS";
        progress = 50;
      }

      return {
        request_id: requestId,
        status,
        progress,
        error_message,
        raw_data: data,
        model: data?.model,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai Kling status check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async result(
    _model: string,
    requestId: string
  ): Promise<VideoGenerationResult> {
    try {
      const statusResult = await this.status(_model, requestId);

      if (statusResult.status !== "COMPLETED") {
        return {
          request_id: requestId,
          status: statusResult.status,
          data: statusResult.raw_data,
          model: statusResult.model || statusResult.raw_data?.model,
          error_message: statusResult.error_message,
        };
      }

      const rawData = statusResult.raw_data;
      const videoUrl = this.extractVideoUrl(rawData);

      return {
        request_id: requestId,
        status: "COMPLETED",
        video_url: videoUrl || undefined,
        data: rawData,
        model: rawData?.model,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai Kling result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
