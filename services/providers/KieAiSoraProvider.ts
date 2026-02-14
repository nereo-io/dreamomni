import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

export class KieAiSoraProvider implements VideoProvider {
  private baseUrl = "https://api.kie.ai/api/v1/jobs";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Kie.ai API key is required");
    }
    this.apiKey = apiKey;
  }

  getName(): string {
    return "kie-ai-sora2";
  }

  private normalizeAspectRatio(value?: string): string {
    if (!value) {
      return "landscape";
    }

    const normalized = value.toString().toLowerCase();

    if (normalized === "landscape" || normalized === "portrait") {
      return normalized;
    }

    if (normalized === "16:9" || normalized === "horizontal") {
      return "landscape";
    }

    if (normalized === "9:16" || normalized === "vertical") {
      return "portrait";
    }

    if (normalized === "1:1" || normalized === "square") {
      return "landscape";
    }

    return "landscape";
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
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    };

    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      // Map error codes
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
        case 455:
          errorMessage =
            "Service Unavailable - System is currently undergoing maintenance";
          break;
        case 500:
          errorMessage =
            "Server Error - An unexpected error occurred while processing the request";
          break;
        case 501:
          errorMessage = "Generation Failed - Video generation task failed";
          break;
        case 505:
          errorMessage =
            "Feature Disabled - The requested feature is currently disabled";
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

      // Build request body according to Kie.ai Sora 2 API format
      const aspectRatio = this.normalizeAspectRatio(
        input.aspect_ratio || input.aspectRatio
      );

      const requestBody: any = {
        model: model, // "sora-2-text-to-video", "sora-2-image-to-video", "sora-2-pro-text-to-video", "sora-2-pro-image-to-video", "sora-2-pro-storyboard"
        input: {
          prompt: input.prompt,
          aspect_ratio: aspectRatio,
          aspectRatio,
          quality: "standard", // Kie.ai API rejects hd for this tenant, keep default standard tier
        },
      };

      // 添加时长参数（n_frames）
      if (input.duration) {
        requestBody.input.n_frames = String(input.duration);
      }

      // Pro 模型需要 size 参数
      if (model.includes("sora-2-pro-")) {
        // Pro 模型支持 standard/high,默认使用 high (最高质量)
        requestBody.input.size = "high";
      }

      // 添加图片 URL（image-to-video 和 storyboard）
      if (input.image_url) {
        const trimmedImageUrl = input.image_url.trim();
        requestBody.input.image_url = trimmedImageUrl;
        requestBody.input.image_urls = [trimmedImageUrl];
        requestBody.input.imageUrl = trimmedImageUrl;
        requestBody.input.imageUrls = [trimmedImageUrl];
      }

      // Storyboard 支持多图
      if (input.image_urls && Array.isArray(input.image_urls)) {
        requestBody.input.image_urls = input.image_urls;
        requestBody.input.imageUrls = input.image_urls;
      }

      // Add callback URL if provided, otherwise use default platform webhook
      if (webhookUrl) {
        requestBody.callBackUrl = webhookUrl;
      }

      console.log(
        "🎬 Kie.ai Sora 2 视频生成请求参数:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest(endpoint, "POST", requestBody);

      console.log(
        "🎬 Kie.ai Sora 2 提交响应:",
        JSON.stringify(response, null, 2)
      );

      if (response.code !== 200) {
        throw new Error(response.msg || "Generation request failed");
      }

      if (!response.data?.taskId) {
        throw new Error("No taskId received from Kie.ai Sora API");
      }

      return {
        request_id: response.data.taskId,
        status: "submitted",
        model: model,
        task_id: response.data.taskId,
        raw_response: response,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai Sora Provider submit failed: ${
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

      // Handle API response errors
      if (response.code !== 200) {
        throw new Error(response.msg || "Status check failed");
      }

      const data = response.data;
      const state = (data.state || "").toString().toLowerCase();
      const successFlag =
        typeof data.successFlag === "number"
          ? data.successFlag
          : data.successFlag === "1"
          ? 1
          : undefined;

      let status: string;
      let progress = 0;
      let error_message: string | undefined;

      const hasFailureCode = data.failCode !== null && data.failCode !== undefined;
      const hasErrorCode = !!data.errorCode;

      if (hasErrorCode || state === "fail" || hasFailureCode) {
        status = "FAILED";
        progress = 100;
        error_message =
          data.failMsg ||
          data.errorMessage ||
          response.msg ||
          (hasErrorCode ? `Error code: ${data.errorCode}` : undefined);
      } else if (state === "success" || successFlag === 1) {
        let parsedResult: any = null;
        if (data.resultJson) {
          try {
            parsedResult = JSON.parse(data.resultJson);
          } catch (parseError) {
            console.error("Failed to parse Sora resultJson:", parseError);
          }
        }

        const hasResultUrl = Array.isArray(parsedResult?.resultUrls)
          ? parsedResult.resultUrls.length > 0
          : false;

        if (hasResultUrl) {
          status = "COMPLETED";
          progress = 100;
        } else {
          status = "IN_PROGRESS";
          progress = 90;
        }
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
        model: data.model,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai Sora status check failed: ${
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

      // Parse resultJson to get video URL
      let videoUrl = null;
      if (rawData?.resultJson) {
        try {
          const resultJson = JSON.parse(rawData.resultJson);
          videoUrl = resultJson.resultUrls?.[0] || null;
        } catch (e) {
          console.error("Failed to parse resultJson:", e);
        }
      }

      return {
        request_id: requestId,
        status: "COMPLETED",
        video_url: videoUrl,
        data: rawData,
        model: rawData?.model,
      };
    } catch (error) {
      throw new Error(
        `Kie.ai Sora result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
