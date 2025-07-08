import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";
import { volcengineClient } from "@/utils/volcengine-client";

export class VolcanoProvider implements VideoProvider {
  private baseUrl = "https://ark.cn-beijing.volces.com/api/v3";
  private apiKey: string;
  private useProxy: boolean;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Volcano Engine API key is required");
    }
    this.apiKey = apiKey;
    // Check if proxy is configured
    this.useProxy = !!(process.env.PROXY_URL && process.env.PROXY_SECRET);
  }

  getName(): string {
    return "volcano";
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any
  ): Promise<any> {
    // Use proxy if configured
    if (this.useProxy) {
      try {
        return await volcengineClient.call(endpoint, body, method);
      } catch (error) {
        console.error("Proxy request failed, error:", error);
        throw error;
      }
    }

    // Fallback to direct connection if proxy is not configured
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Volcano API request failed: ${response.status} ${response.statusText} - ${errorData}`
      );
    }

    return response.json();
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    const endpoint = "/api/v3/contents/generations/tasks";

    // Build request body according to Volcano Engine API format
    let promptText = input.prompt;

    // Add aspect ratio to prompt if specified
    if (input.aspect_ratio) {
      // For Seedance image-to-video models, always use 'adaptive' to follow image dimensions
      if (model.includes("seedance") && model.includes("image-to-video")) {
        promptText += ` --rt adaptive`;
      } else {
        // For text-to-video and other models, use the specified aspect ratio
        promptText += ` --rt ${input.aspect_ratio}`;
      }
    }

    // Add duration to prompt if specified
    if (input.duration) {
      promptText += ` --dur ${input.duration}`;
    }

    // Add resolution to prompt if specified
    if (input.resolution) {
      promptText += ` --rs ${input.resolution.toLowerCase()}`;
    }

    const requestBody: any = {
      model: input.model, // Use input.model if available (for Volcano models), fallback to original model
      content: [
        {
          type: "text",
          text: promptText,
        },
      ],
    };

    // Add image content if provided
    if (input.image_url) {
      requestBody.content.unshift({
        type: "image_url",
        image_url: {
          url: input.image_url,
        },
      });
    }

    // Add webhook callback URL if provided
    if (webhookUrl) {
      requestBody.callback_url = webhookUrl;
    }

    console.log(
      "🔥 火山引擎视频生成请求参数:",
      JSON.stringify(requestBody, null, 2)
    );

    const response = await this.makeRequest(endpoint, "POST", requestBody);

    return {
      request_id: response.id,
      status: "submitted",
      model: model,
      raw_response: response,
    };
  }

  async status(
    model: string,
    requestId: string
  ): Promise<VideoGenerationStatus> {
    const endpoint = `/api/v3/contents/generations/tasks/${requestId}`;

    const response = await this.makeRequest(endpoint, "GET");

    // Map Volcano Engine status to our standard status
    let standardStatus = "unknown";
    switch (response.status) {
      case "queued":
        standardStatus = "IN_QUEUE";
        break;
      case "running":
        standardStatus = "IN_PROGRESS";
        break;
      case "succeeded":
        standardStatus = "COMPLETED";
        break;
      case "failed":
        standardStatus = "FAILED";
        break;
      case "cancelled":
        standardStatus = "CANCELLED";
        break;
      default:
        standardStatus = response.status;
    }

    return {
      request_id: requestId,
      status: standardStatus,
      progress: response.progress || null,
      logs: response.logs || [],
      metrics: response.metrics || {},
      error: response.error?.message || null,
      raw_response: response,
    };
  }

  async result(
    model: string,
    requestId: string
  ): Promise<VideoGenerationResult> {
    // For Volcano Engine, result is typically included in the status response
    // when status is "succeeded"
    const statusResponse = await this.status(model, requestId);

    if (statusResponse.status !== "COMPLETED") {
      throw new Error(
        `Task not completed. Current status: ${statusResponse.status}`
      );
    }

    const rawResponse = (statusResponse as any).raw_response;
    const videoUrl = rawResponse?.content?.video_url;

    if (!videoUrl) {
      throw new Error("Video URL not found in completed task response");
    }

    return {
      request_id: requestId,
      status: "COMPLETED",
      video_url: videoUrl,
      data: {
        video_url: videoUrl,
        usage: rawResponse?.usage || {},
        model: rawResponse?.model,
        created_at: rawResponse?.created_at,
        updated_at: rawResponse?.updated_at,
      },
      raw_response: rawResponse,
    };
  }
}
