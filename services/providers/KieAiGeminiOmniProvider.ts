import { getVideoModel, isImageToVideoModel } from "@/config/video-models";
import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

export class KieAiGeminiOmniProvider implements VideoProvider {
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
    return "kie-ai-gemini-omni";
  }

  private normalizeDuration(duration?: string): string {
    const normalized = duration?.toString().replace(/s$/i, "").trim();
    if (!normalized) {
      return "8";
    }
    if (["4", "6", "8", "10"].includes(normalized)) {
      return normalized;
    }
    throw new Error(`Unsupported Gemini Omni duration: ${normalized}`);
  }

  private normalizeAspectRatio(aspectRatio?: string): "16:9" | "9:16" {
    return aspectRatio?.toString().trim() === "9:16" ? "9:16" : "16:9";
  }

  private normalizeResolution(
    resolution?: string
  ): "720p" | "1080p" | "4k" | undefined {
    const normalized = resolution?.toString().trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }
    if (normalized === "720p" || normalized === "1080p" || normalized === "4k") {
      return normalized;
    }
    throw new Error(`Unsupported Gemini Omni resolution: ${resolution}`);
  }

  private async uploadUrlToKieFileService(url: string): Promise<string> {
    const response = await fetch("https://kieai.redpandaai.co/api/file-url-upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fileUrl: url,
        uploadPath: "gemini-omni-video",
        fileName: `gemini-omni-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${this.getFileExtension(url)}`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kie file upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.code && data.code !== 200) {
      throw new Error(data.msg || "Kie file upload failed");
    }

    const uploadedUrl = data.data?.downloadUrl || data.data?.fileUrl;
    if (!uploadedUrl) {
      throw new Error("Kie file upload failed: missing downloadUrl");
    }

    return uploadedUrl;
  }

  private getFileExtension(url: string): string {
    const cleanUrl = url.split("?")[0].toLowerCase();
    if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) {
      return "jpg";
    }
    if (cleanUrl.endsWith(".webp")) {
      return "webp";
    }
    return "png";
  }

  private async resolveImageUrls(input: VideoGenerationRequest): Promise<string[]> {
    let urls: string[] = [];
    if (Array.isArray(input.image_urls) && input.image_urls.length > 0) {
      urls = input.image_urls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean);
    } else {
      const imageUrl = input.image_url?.trim();
      urls = imageUrl ? [imageUrl] : [];
    }

    const uploadedUrls: string[] = [];
    for (const url of urls) {
      uploadedUrls.push(
        process.env.KIE_GEMINI_OMNI_PREUPLOAD_INPUTS === "true"
          ? await this.uploadUrlToKieFileService(url)
          : url
      );
    }
    return uploadedUrls;
  }

  private async buildInput(
    model: string,
    input: VideoGenerationRequest
  ): Promise<Record<string, any>> {
    const prompt = input.prompt?.trim();
    if (!prompt) {
      throw new Error("Gemini Omni prompt is required");
    }

    const apiInput: Record<string, any> = {
      prompt,
      duration: this.normalizeDuration(input.duration),
      aspect_ratio: this.normalizeAspectRatio(input.aspect_ratio),
    };

    const resolution = this.normalizeResolution(input.resolution);
    if (resolution) {
      apiInput.resolution = resolution;
    }

    const imageUrls = await this.resolveImageUrls(input);
    if (imageUrls.length > 0) {
      apiInput.image_urls = imageUrls;
    } else if (
      isImageToVideoModel(model) &&
      !(Array.isArray(input.video_list) && input.video_list.length > 0) &&
      !(Array.isArray(input.character_ids) && input.character_ids.length > 0)
    ) {
      throw new Error("Gemini Omni image-to-video requires image_urls");
    }

    if (typeof input.seed === "number" && Number.isFinite(input.seed)) {
      apiInput.seed = input.seed;
    }

    if (Array.isArray(input.audio_ids) && input.audio_ids.length > 0) {
      apiInput.audio_ids = input.audio_ids;
    }

    if (Array.isArray(input.video_list) && input.video_list.length > 0) {
      apiInput.video_list = input.video_list;
    }

    if (Array.isArray(input.character_ids) && input.character_ids.length > 0) {
      apiInput.character_ids = input.character_ids;
    }

    return apiInput;
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
      console.error("Failed to parse Gemini Omni resultJson:", error);
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

      const codeMap: Record<number, string> = {
        400: "Invalid request parameters",
        401: "Authentication failed, please check API Key",
        402: "Insufficient account balance",
        404: "Resource not found",
        422: "Parameter validation failed",
        429: "Request rate limit exceeded",
        500: "Internal server error",
      };

      throw new Error(
        errorData.msg ||
          errorData.error?.message ||
          codeMap[response.status] ||
          errorText ||
          `API Error: ${response.status}`
      );
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
        modelConfig?.providerModelId || input.model || "gemini-omni-video";
      const requestBody: any = {
        model: providerModelId,
        input: await this.buildInput(model, input),
      };

      if (webhookUrl) {
        requestBody.callBackUrl = webhookUrl;
      }

      console.log(
        "🎬 Kie.ai Gemini Omni 视频生成请求参数:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest("/createTask", "POST", requestBody);

      console.log(
        "🎬 Kie.ai Gemini Omni 提交响应:",
        JSON.stringify(response, null, 2)
      );

      if (response.code !== 200) {
        throw new Error(response.msg || "Generation request failed");
      }

      if (!response.data?.taskId) {
        throw new Error("No taskId received from Kie.ai Gemini Omni API");
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
        `Kie.ai Gemini Omni Provider submit failed: ${
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
      } else if (state === "waiting" || state === "pending" || state === "queuing") {
        status = "IN_PROGRESS";
        progress = 25;
      } else if (state === "processing" || state === "generating") {
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
        `Kie.ai Gemini Omni status check failed: ${
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
        `Kie.ai Gemini Omni result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
