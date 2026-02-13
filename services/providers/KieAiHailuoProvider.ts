import { getVideoModel } from "@/config/video-models";
import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

export class KieAiHailuoProvider implements VideoProvider {
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
    return "kie-ai-hailuo2.3";
  }

  private normalizeDuration(duration?: string): string {
    if (!duration?.toString().trim()) {
      return "6";
    }
    return duration.toString().replace(/s$/i, "").trim();
  }

  private normalizeResolution(resolution?: string): string {
    if (!resolution?.toString().trim()) {
      return "768p";
    }
    const normalized = resolution.toString().trim().toLowerCase();
    if (normalized === "1080p" || normalized === "1080") {
      return "1080p";
    }
    if (normalized === "768p" || normalized === "768") {
      return "768p";
    }
    return normalized;
  }

  private toApiResolution(resolution: string): "768P" | "1080P" {
    if (resolution === "1080p") {
      return "1080P";
    }
    if (resolution === "768p") {
      return "768P";
    }
    throw new Error(`Unsupported resolution for Hailuo API mapping: ${resolution}`);
  }

  private resolveImageUrl(input: VideoGenerationRequest): string {
    if (input.image_urls && Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      const firstUrl = input.image_urls[0]?.trim();
      if (firstUrl) {
        return firstUrl;
      }
    }

    if (input.image_url?.trim()) {
      return input.image_url.trim();
    }

    throw new Error("Kie.ai Hailuo 2.3 requires image_url");
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
      console.error("Failed to parse Hailuo resultJson:", error);
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
      const modelConfig = getVideoModel(model);
      const providerModelId =
        modelConfig?.providerModelId ||
        input.model ||
        "hailuo/2-3-image-to-video-standard";
      const imageUrl = this.resolveImageUrl(input);
      const duration = this.normalizeDuration(input.duration);
      const resolution = this.normalizeResolution(input.resolution);
      const apiResolution = this.toApiResolution(resolution);

      const requestBody: any = {
        model: providerModelId,
        input: {
          prompt: input.prompt,
          image_url: imageUrl,
          duration,
          resolution: apiResolution,
        },
      };

      if (webhookUrl) {
        requestBody.callBackUrl = webhookUrl;
      }

      console.log(
        "🎬 Kie.ai Hailuo 2.3 视频生成请求参数:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest("/createTask", "POST", requestBody);

      console.log(
        "🎬 Kie.ai Hailuo 2.3 提交响应:",
        JSON.stringify(response, null, 2)
      );

      if (response.code !== 200) {
        throw new Error(response.msg || "Generation request failed");
      }

      if (!response.data?.taskId) {
        throw new Error("No taskId received from Kie.ai Hailuo API");
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
        `Kie.ai Hailuo Provider submit failed: ${
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
      const response = await this.makeRequest(
        `/recordInfo?taskId=${encodeURIComponent(requestId)}`,
        "GET"
      );

      if (response.code !== 200) {
        throw new Error(response.msg || "Status check failed");
      }

      const data = response.data;
      const state = (data?.state || "").toString().toLowerCase();
      const failCode = data?.failCode;
      const hasFailCode = failCode !== null && failCode !== undefined;
      const videoUrl = this.extractVideoUrl(data);

      let status: string;
      let progress = 0;
      let error_message: string | undefined;

      if (state === "fail" || hasFailCode) {
        status = "FAILED";
        progress = 100;
        error_message =
          data?.failMsg ||
          response.msg ||
          (hasFailCode ? `Error code: ${failCode}` : "Generation failed");
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
        `Kie.ai Hailuo status check failed: ${
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
        `Kie.ai Hailuo result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
