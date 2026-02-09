import { randomUUID } from "crypto";

// ============================================================
// Type Definitions
// ============================================================

/** Standard Pixverse API response envelope */
export interface PixverseApiResponse<T> {
  ErrCode: number;
  ErrMsg: string;
  Resp?: T;
}

/** Normalized task status */
export type PixverseTaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

// --- Upload ---

export interface PixverseUploadImageResponse {
  img_id: number;
  img_url: string;
}

export interface PixverseUploadMediaResponse {
  media_id: number;
  media_type: string;
  url: string;
}

// --- Image Template ---

export interface PixverseImageTemplateRequest {
  img_ids: string[];
  template_id: number;
}

export interface PixverseImageTemplateResponse {
  image_id: number;
  credits: number;
}

// --- Image-to-Video ---

export interface PixverseImageToVideoRequest {
  duration: number;
  img_id: number;
  model: string;
  prompt: string;
  quality: string;
  img_ids?: number[];
  motion_mode?: string;
  negative_prompt?: string;
  seed?: number;
  style?: string;
  template_id?: number;
  sound_effect_switch?: boolean;
  sound_effect_content?: string;
  lip_sync_switch?: boolean;
  lip_sync_tts_content?: string;
  lip_sync_tts_speaker_id?: string;
  generate_audio_switch?: boolean;
  generate_multi_clip_switch?: boolean;
  thinking_type?: string;
}

// --- Text-to-Video ---

export interface PixverseTextToVideoRequest {
  aspect_ratio: string;
  duration: number;
  model: string;
  prompt: string;
  quality: string;
  motion_mode?: string;
  negative_prompt?: string;
  seed?: number;
  style?: string;
  template_id?: number;
  sound_effect_switch?: boolean;
  sound_effect_content?: string;
  lip_sync_switch?: boolean;
  lip_sync_tts_content?: string;
  lip_sync_tts_speaker_id?: string;
  generate_audio_switch?: boolean;
  generate_multi_clip_switch?: boolean;
  thinking_type?: string;
}

// --- Transition ---

export interface PixverseTransitionRequest {
  prompt: string;
  model: string;
  duration: number;
  quality: string;
  first_frame_img: number;
  last_frame_img: number;
  motion_mode?: string;
  seed?: number;
  sound_effect_switch?: boolean;
  sound_effect_content?: string;
  lip_sync_switch?: boolean;
  lip_sync_tts_content?: string;
  lip_sync_tts_speaker_id?: string;
  generate_audio_switch?: boolean;
}

// --- Video Submit Response ---

export interface PixverseVideoSubmitResponse {
  video_id: number;
}

// --- Result Queries ---

export interface PixverseVideoResult {
  id: number;
  status: number;
  url?: string;
  prompt?: string;
  negative_prompt?: string;
  outputWidth?: number;
  outputHeight?: number;
  resolution_ratio?: number;
  seed?: number;
  size?: number;
  style?: string;
  create_time?: string;
  modify_time?: string;
}

export interface PixverseImageResult {
  image_id: number;
  status: number;
  url?: string;
  prompt?: string;
  prompt_translate?: string;
  seed?: number;
  template_id?: number;
  outputWidth?: number;
  outputHeight?: number;
  credits?: number;
  create_time?: string;
  modify_time?: string;
  customer_paths?: Record<string, unknown>;
}

// ============================================================
// Provider
// ============================================================

export class PixverseProvider {
  private readonly baseUrl = "https://app-api.pixverse.ai";
  private readonly apiKey: string;

  constructor() {
    const key = process.env.PIXVERSE_API_KEY;
    if (!key) {
      throw new Error("Pixverse: PIXVERSE_API_KEY environment variable is required");
    }
    this.apiKey = key;
  }

  // ----------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------

  private generateTraceId(): string {
    return randomUUID();
  }

  /** Map Pixverse numeric status to a normalized string */
  mapStatus(status: number): PixverseTaskStatus {
    switch (status) {
      case 1:
        return "completed";
      case 5:
        return "processing";
      case 6:
      case 7:
      case 8:
        return "failed";
      default:
        return "pending";
    }
  }

  private mapErrorMessage(httpStatus: number): string {
    switch (httpStatus) {
      case 400:
        return "Invalid request parameters";
      case 401:
        return "Invalid API key";
      case 403:
        return "No permission to access this resource";
      case 404:
        return "Resource not found";
      case 429:
        return "Rate limit exceeded";
      case 500:
        return "Pixverse internal server error";
      default:
        return `Pixverse API error (HTTP ${httpStatus})`;
    }
  }

  /** JSON request helper (GET / POST) */
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const traceId = this.generateTraceId();

    const headers: Record<string, string> = {
      "API-KEY": this.apiKey,
      "Ai-Trace-Id": traceId,
      Accept: "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(120_000),
    };

    if (body && method === "POST") {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Pixverse: ${this.mapErrorMessage(response.status)} — ${errorText}`
      );
    }

    const json = (await response.json()) as PixverseApiResponse<T>;

    if (json.ErrCode !== 0) {
      throw new Error(
        `Pixverse: API error ${json.ErrCode} — ${json.ErrMsg || "Unknown error"}`
      );
    }

    return json.Resp as T;
  }

  /** Multipart/form-data request helper for upload endpoints */
  private async makeFormDataRequest<T>(
    endpoint: string,
    fields: Record<string, string | Buffer>,
    fileFieldName: string,
    filename?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const traceId = this.generateTraceId();
    const boundary = `----PixverseBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;

    const parts: Buffer[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (Buffer.isBuffer(value)) {
        // Binary file field
        const header =
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${key}"; filename="${filename || "file"}"\r\n` +
          `Content-Type: application/octet-stream\r\n\r\n`;
        parts.push(Buffer.from(header, "utf-8"));
        parts.push(value);
        parts.push(Buffer.from("\r\n", "utf-8"));
      } else {
        // String field (e.g. image_url / file_url)
        const part =
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
          `${value}\r\n`;
        parts.push(Buffer.from(part, "utf-8"));
      }
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`, "utf-8"));

    const body = Buffer.concat(parts);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "API-KEY": this.apiKey,
        "Ai-Trace-Id": traceId,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Pixverse: ${this.mapErrorMessage(response.status)} — ${errorText}`
      );
    }

    const json = (await response.json()) as PixverseApiResponse<T>;

    if (json.ErrCode !== 0) {
      throw new Error(
        `Pixverse: API error ${json.ErrCode} — ${json.ErrMsg || "Unknown error"}`
      );
    }

    return json.Resp as T;
  }

  // ----------------------------------------------------------
  // Upload
  // ----------------------------------------------------------

  /**
   * Upload an image to Pixverse.
   * Provide either a binary buffer or a URL string — not both.
   */
  async uploadImage(
    input: { image: Buffer; filename: string } | { imageUrl: string }
  ): Promise<PixverseUploadImageResponse> {
    const fields: Record<string, string | Buffer> = {};
    let filename: string | undefined;

    if ("image" in input) {
      fields.image = input.image;
      filename = input.filename;
    } else {
      fields.image_url = input.imageUrl;
    }

    return this.makeFormDataRequest<PixverseUploadImageResponse>(
      "/openapi/v2/image/upload",
      fields,
      "image",
      filename
    );
  }

  /**
   * Upload a video or audio file to Pixverse.
   * Provide either a binary buffer or a URL string — not both.
   */
  async uploadMedia(
    input: { file: Buffer; filename: string } | { fileUrl: string }
  ): Promise<PixverseUploadMediaResponse> {
    const fields: Record<string, string | Buffer> = {};
    let filename: string | undefined;

    if ("file" in input) {
      fields.file = input.file;
      filename = input.filename;
    } else {
      fields.file_url = input.fileUrl;
    }

    return this.makeFormDataRequest<PixverseUploadMediaResponse>(
      "/openapi/v2/media/upload",
      fields,
      "file",
      filename
    );
  }

  // ----------------------------------------------------------
  // Generation
  // ----------------------------------------------------------

  async useImageTemplate(
    request: PixverseImageTemplateRequest
  ): Promise<PixverseImageTemplateResponse> {
    return this.makeRequest<PixverseImageTemplateResponse>(
      "/openapi/v2/image/template/generate",
      "POST",
      request
    );
  }

  async useImageToVideo(
    request: PixverseImageToVideoRequest
  ): Promise<PixverseVideoSubmitResponse> {
    return this.makeRequest<PixverseVideoSubmitResponse>(
      "/openapi/v2/video/img/generate",
      "POST",
      request
    );
  }

  async useTextToVideo(
    request: PixverseTextToVideoRequest
  ): Promise<PixverseVideoSubmitResponse> {
    return this.makeRequest<PixverseVideoSubmitResponse>(
      "/openapi/v2/video/text/generate",
      "POST",
      request
    );
  }

  async useTransitionGenerator(
    request: PixverseTransitionRequest
  ): Promise<PixverseVideoSubmitResponse> {
    return this.makeRequest<PixverseVideoSubmitResponse>(
      "/openapi/v2/video/transition/generate",
      "POST",
      request
    );
  }

  // ----------------------------------------------------------
  // Result queries
  // ----------------------------------------------------------

  async getVideoResult(videoId: number): Promise<PixverseVideoResult> {
    return this.makeRequest<PixverseVideoResult>(
      `/openapi/v2/video/result/${videoId}`
    );
  }

  async getImageResult(imageId: number): Promise<PixverseImageResult> {
    return this.makeRequest<PixverseImageResult>(
      `/openapi/v2/image/result/${imageId}`
    );
  }
}
