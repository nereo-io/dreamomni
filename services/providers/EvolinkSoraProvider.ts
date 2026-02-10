import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";

/**
 * Evolink Sora 2 (Lite) Provider
 *
 * API: https://api.evolink.ai
 * Docs: https://evolink.ai/api-reference/sora-2/sora-2-API-Reference.md
 *
 * Used as fallback for Kie.ai Sora 2 models.
 */
export class EvolinkSoraProvider implements VideoProvider {
  private baseUrl = "https://api.evolink.ai";
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Evolink API key is required");
    }
    this.apiKey = apiKey;
  }

  getName(): string {
    return "evolink-sora2";
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
      let detail: string;
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
      const requestBody: any = {
        model: input.model || model,
        prompt: input.prompt,
      };

      // Aspect ratio: Evolink accepts "16:9" / "9:16" directly
      if (input.aspect_ratio) {
        requestBody.aspect_ratio = input.aspect_ratio;
      }

      // Duration: Evolink accepts number (10 or 15)
      if (input.duration) {
        requestBody.duration = parseInt(String(input.duration), 10);
      }

      // Image-to-video
      if (input.image_url) {
        requestBody.image_urls = [input.image_url.trim()];
      } else if (
        input.image_urls &&
        Array.isArray(input.image_urls) &&
        input.image_urls.length > 0
      ) {
        requestBody.image_urls = [input.image_urls[0].trim()];
      }

      // Watermark removal
      requestBody.remove_watermark = true;

      // Webhook callback
      if (webhookUrl) {
        requestBody.callback_url = webhookUrl;
      }

      console.log(
        "🔗 [EvolinkSora] Submit request:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await this.makeRequest(
        "/v1/videos/generations",
        "POST",
        requestBody
      );

      console.log(
        "🔗 [EvolinkSora] Submit response:",
        JSON.stringify(response, null, 2)
      );

      if (!response.id) {
        throw new Error("No task id received from Evolink API");
      }

      return {
        request_id: response.id,
        status: response.status || "pending",
        model: model,
      };
    } catch (error) {
      throw new Error(
        `Evolink Sora submit failed: ${
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
        `/v1/tasks/${encodeURIComponent(requestId)}`
      );

      let status: string;
      const evolinkStatus = (response.status || "").toLowerCase();

      switch (evolinkStatus) {
        case "completed":
          status = "COMPLETED";
          break;
        case "failed":
          status = "FAILED";
          break;
        case "processing":
          status = "IN_PROGRESS";
          break;
        case "pending":
          status = "IN_QUEUE";
          break;
        default:
          status = "IN_PROGRESS";
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
        `Evolink Sora status check failed: ${
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
          error_message: statusResult.error_message,
        };
      }

      const rawData = statusResult.raw_data;
      // Evolink returns results as an array of video URLs
      const videoUrl =
        Array.isArray(rawData?.results) && rawData.results.length > 0
          ? rawData.results[0]
          : null;

      return {
        request_id: requestId,
        status: "COMPLETED",
        video_url: videoUrl,
        data: rawData,
      };
    } catch (error) {
      throw new Error(
        `Evolink Sora result retrieval failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
