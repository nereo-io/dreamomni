import { getVideoModel } from "@/config/video-models";
import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

const DEFAULT_MAXAPI_BASE_URL = "https://api.maxapi.io/api/v1";

export class MaxApiProvider implements VideoProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("MaxAPI API key is required");
    }

    this.apiKey = apiKey;
    this.baseUrl = process.env.MAXAPI_BASE_URL || DEFAULT_MAXAPI_BASE_URL;
  }

  getName(): string {
    return "maxapi";
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body && method === "POST" ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `MaxAPI request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  private resolveProviderModelId(
    model: string,
    input: VideoGenerationRequest
  ): string {
    const modelConfig = getVideoModel(model);
    return modelConfig?.providerModelId || input.model || "seedance-2.0-fast";
  }

  private resolveMediaUrls(input: VideoGenerationRequest): string[] {
    if (Array.isArray(input.media_urls) && input.media_urls.length > 0) {
      return input.media_urls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean);
    }

    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      return input.image_urls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean);
    }

    if (typeof input.image_url === "string" && input.image_url.trim()) {
      return [input.image_url.trim()];
    }

    return [];
  }

  private normalizeDuration(duration?: string): number | undefined {
    if (!duration?.toString().trim()) {
      return undefined;
    }

    const parsed = Number.parseInt(duration.toString().replace(/s$/i, ""), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    const prompt = input.prompt?.trim();
    if (!prompt) {
      throw new Error("MaxAPI prompt is required");
    }

    const requestBody: any = {
      model: this.resolveProviderModelId(model, input),
      input: {
        prompt,
        fallback: true,
      },
    };

    if (input.aspect_ratio?.trim() && input.aspect_ratio !== "Auto") {
      requestBody.input.ratio = input.aspect_ratio.trim();
    }

    if (input.resolution?.trim()) {
      requestBody.input.resolution = input.resolution.trim().toLowerCase();
    }

    const duration = this.normalizeDuration(input.duration);
    if (duration) {
      requestBody.input.duration = duration;
    }

    const mediaUrls = this.resolveMediaUrls(input);
    if (mediaUrls.length > 0) {
      requestBody.input.mediaUrls = mediaUrls;
    }

    if (webhookUrl) {
      requestBody.callBackUrl = webhookUrl;
    }

    const response = await this.makeRequest("/task/submit", "POST", requestBody);
    if (response.code !== 0) {
      throw new Error(`MaxAPI submit failed: ${response.msg || "Unknown error"}`);
    }

    return {
      request_id: response.data.taskId,
      status: "submitted",
      model,
      raw_response: response,
    };
  }

  async status(
    model: string,
    requestId: string
  ): Promise<VideoGenerationStatus> {
    const response = await this.makeRequest(`/task/${requestId}`);
    if (response.code !== 0) {
      throw new Error(`MaxAPI query failed: ${response.msg || "Unknown error"}`);
    }

    const data = response.data;
    let standardStatus = "unknown";

    switch (data.status) {
      case "PENDING":
      case "SUBMITTED":
        standardStatus = "IN_QUEUE";
        break;
      case "PROCESSING":
        standardStatus = "IN_PROGRESS";
        break;
      case "SUCCESS":
        standardStatus = "COMPLETED";
        break;
      case "FAILURE":
      case "TIMEOUT":
        standardStatus = "FAILED";
        break;
      case "CANCELLED":
        standardStatus = "CANCELLED";
        break;
      default:
        standardStatus = data.status || "unknown";
        break;
    }

    return {
      request_id: requestId,
      status: standardStatus,
      logs: [],
      metrics: {},
      error: data.failure_reason || null,
      raw_response: response,
    };
  }

  async result(
    model: string,
    requestId: string
  ): Promise<VideoGenerationResult> {
    const statusResponse = await this.status(model, requestId);
    if (statusResponse.status !== "COMPLETED") {
      throw new Error(
        `Task not completed. Current status: ${statusResponse.status}`
      );
    }

    const rawResponse = (statusResponse as any).raw_response;
    const resultData = rawResponse?.data?.result;
    const videoUrl =
      resultData?.type === "video" && Array.isArray(resultData?.urls)
        ? resultData.urls[0]
        : null;

    if (!videoUrl) {
      throw new Error("Video URL not found in completed task response");
    }

    return {
      request_id: requestId,
      status: "COMPLETED",
      video_url: videoUrl,
      data: {
        video_url: videoUrl,
        model: rawResponse?.data?.input?.model,
        created_at: rawResponse?.data?.created_at,
        updated_at: rawResponse?.data?.updated_at,
      },
      raw_response: rawResponse,
    };
  }
}
