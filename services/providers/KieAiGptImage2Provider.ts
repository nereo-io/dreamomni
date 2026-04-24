/**
 * Kie.ai GPT Image 2 Provider
 * Integrates the GPT Image 2 family hosted on Kie.ai for text-to-image and
 * image-to-image generation.
 *
 * Endpoints:
 *   - Submit:  POST  https://api.kie.ai/api/v1/jobs/createTask
 *   - Status:  GET   https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...
 *   - Auth:    Bearer ${KIE_AI_API_KEY}    (shared with NanoBananaProvider)
 *   - Async:   Accepts callBackUrl; payload mirrors Nano Banana's callback shape
 *
 * Model identifiers (sent in the API "model" field):
 *   - gpt-image-2-text-to-image
 *   - gpt-image-2-image-to-image
 *
 * Docs:
 *   https://docs.kie.ai/market/gpt/gpt-image-2-text-to-image
 *   https://docs.kie.ai/market/gpt/gpt-image-2-image-to-image
 *   https://docs.kie.ai/market/common/get-task-detail
 */

import {
  BaseAIProvider,
  GenerateImageRequest,
  EditImageRequest,
  ProviderResponse,
} from "./BaseAIProvider";
import { ProviderImageResult } from "@/types/provider";
import { getImageModel, ImageModelProvider, IMAGE_MODELS } from "@/config/image-models";

const TEXT_TO_IMAGE_MODEL = "gpt-image-2-text-to-image";
const IMAGE_TO_IMAGE_MODEL = "gpt-image-2-image-to-image";

interface KieJobsCreateResponse {
  code: number;
  msg?: string;
  message?: string;
  data?: {
    taskId: string;
    recordId?: string;
  };
}

interface KieRecordInfoResponse {
  code: number;
  msg?: string;
  data?: {
    taskId: string;
    model?: string;
    state: "waiting" | "queuing" | "generating" | "success" | "fail";
    param?: string;
    resultJson?: string;
    failCode?: string | null;
    failMsg?: string | null;
    costTime?: number | null;
    completeTime?: number | null;
    createTime?: number;
    updateTime?: number;
  };
}

// Webhook payload shape (Kie.ai jobs API uses a unified callback format)
export interface GptImage2CallbackRequest {
  code: number;
  msg: string;
  data: {
    taskId: string;
    state: "success" | "fail" | "processing" | "pending" | "waiting" | "queuing" | "generating";
    model?: string;
    createTime?: number;
    updateTime?: number;
    completeTime?: number;
    costTime?: number;
    resultJson?: string;
    failCode?: string;
    failMsg?: string;
    param?: string;
  };
}

interface GptImage2ResultData {
  resultUrls?: string[];
}

export class KieAiGptImage2Provider extends BaseAIProvider {
  private baseUrl: string;

  constructor() {
    const gptModels = Object.values(IMAGE_MODELS).filter(
      (m) => m.provider === ImageModelProvider.KIE_GPT
    );

    super(
      "gpt_image_2",
      {
        id: "gpt_image_2",
        name: "gpt-image-2",
        displayName: "Kie.ai GPT Image 2",
        description: "OpenAI GPT Image 2 hosted on Kie.ai (high-precision image generation)",
        status: "active",
        features: {
          textToImage: true,
          imageToImage: true,
          imageEdit: true,
          inpainting: false,
          outpainting: false,
          upscaling: false,
          backgroundRemoval: false,
          styleTransfer: false,
          batchGeneration: false,
          asyncCallback: true,
          realTimeStatus: false,
        },
        models: gptModels.map((m) => ({
          id: m.id,
          name: m.name,
          displayName: m.displayName,
          provider: "gpt_image_2" as const,
          type: m.type as "text-to-image" | "image-edit",
          status: (m.status === "active" ? "active" : "deprecated") as
            | "active"
            | "beta"
            | "deprecated",
          features: m.features,
          maxImageCount: m.maxInputImages || 1,
          maxResolution: { width: 4096, height: 4096 },
          supportedAspectRatios: m.supportedAspectRatios,
          supportedFormats: m.supportedFormats,
          credits: m.credits,
        })),
        pricing: {
          baseCredits: 4,
        },
      },
      process.env.KIE_AI_API_KEY
    );

    this.baseUrl = process.env.KIE_AI_BASE_URL || "https://api.kie.ai";

    if (!this.apiKey) {
      throw new Error(
        "KIE_AI_API_KEY environment variable is required for GPT Image 2"
      );
    }
  }

  private getKieErrorMessage(code: number, fallback?: string): string {
    // Only codes documented for GPT Image 2 in the official API spec.
    // Unknown codes fall through to the generic fallback to avoid misleading messages.
    // Doc: https://docs.kie.ai/market/gpt/gpt-image-2-text-to-image
    const codeMap: Record<number, string> = {
      400: "Invalid request parameters",
      401: "Authentication failed, please check API Key",
      402: "Insufficient account balance",
      404: "Resource not found",
      422: "Parameter validation failed",
      429: "Request rate limit exceeded",
      500: "Internal server error",
    };
    return codeMap[code] || fallback || `Kie API error (${code})`;
  }

  /**
   * Map a project aspect_ratio value to Kie GPT Image 2's expected enum.
   * Kie.ai accepts: auto, 1:1, 5:4, 9:16, 21:9, 16:9, 4:3, 3:2, 4:5, 3:4, 2:3
   * Project UI may pass "Auto" (capitalised) — normalise to lower case.
   */
  private normaliseAspectRatio(value: string | undefined): string {
    if (!value) return "auto";
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === "auto") return "auto";
    return trimmed;
  }

  private getProviderCallbackUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
    return `${baseUrl}/api/ai-callback/gpt_image_2`;
  }

  /**
   * Submit a job to Kie.ai jobs/createTask.
   * Returns the provider task id for downstream tracking.
   */
  private async submitJob(
    apiModel: string,
    input: Record<string, unknown>
  ): Promise<{ taskId: string; recordId?: string }> {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const body = {
      model: apiModel,
      callBackUrl: this.getProviderCallbackUrl(),
      input,
    };

    const response = await fetch(`${this.baseUrl}/api/v1/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GPT Image 2 API error: ${response.status} - ${
          this.getKieErrorMessage(response.status, errorText)
        }`
      );
    }

    const apiResponse: KieJobsCreateResponse = await response.json();

    if (apiResponse.code !== 200) {
      const message = this.getKieErrorMessage(
        apiResponse.code,
        apiResponse.msg || apiResponse.message
      );
      throw new Error(`GPT Image 2 API error: ${apiResponse.code} - ${message}`);
    }

    if (!apiResponse.data?.taskId) {
      throw new Error("GPT Image 2 API error: No taskId in response");
    }

    return apiResponse.data;
  }

  async generateImage(
    request: GenerateImageRequest
  ): Promise<ProviderResponse> {
    try {
      this.validateRequest(request);

      // If caller passed image_input on a generate request, route to image-to-image.
      const hasInputImages =
        Array.isArray(request.image_input) && request.image_input.length > 0;

      if (hasInputImages) {
        return this.editImage({
          prompt: request.prompt,
          imageUrls: request.image_input!,
          model: IMAGE_TO_IMAGE_MODEL,
          aspect_ratio: request.aspect_ratio,
          resolution: request.resolution,
          output_format: request.output_format as "png" | "jpeg" | undefined,
          generationId: request.generationId,
          isAgentMode: request.isAgentMode,
        });
      }

      const apiModel = TEXT_TO_IMAGE_MODEL;
      // nsfw_checker default is `true` per Kie.ai spec (matches Playground default).
      // Keep it on for safety; this is a public, multi-user platform.
      const input: Record<string, unknown> = {
        prompt: request.prompt,
        aspect_ratio: this.normaliseAspectRatio(request.aspect_ratio),
        nsfw_checker: true,
      };
      if (request.resolution) {
        input.resolution = request.resolution;
      }

      const result = await this.submitJob(apiModel, input);

      return {
        taskId: result.taskId,
        status: "pending",
        metadata: {
          provider: this.getProvider(),
          model: request.model || apiModel,
          api_model: apiModel,
          api_version: "jobs",
          recordId: result.recordId,
          aspect_ratio: input.aspect_ratio,
          resolution: input.resolution,
          raw_response: result,
        },
      };
    } catch (error) {
      return {
        taskId: "",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { provider: this.getProvider() },
      };
    }
  }

  async editImage(request: EditImageRequest): Promise<ProviderResponse> {
    try {
      this.validateRequest(request);

      if (!request.imageUrls || request.imageUrls.length === 0) {
        throw new Error("imageUrls is required for image-to-image generation");
      }

      // The official API doc does not document a max count for `input_urls`
      // (only "Max File Size: 30MB" per file). The 16-image cap below comes
      // from the kie.ai/gpt-image-2 marketing page and is kept as a defensive
      // UX guard. Adjust if Kie.ai publishes an authoritative limit.
      const modelConfig = getImageModel(IMAGE_TO_IMAGE_MODEL);
      const maxInputs = modelConfig?.maxInputImages || 16;
      if (request.imageUrls.length > maxInputs) {
        throw new Error(
          `GPT Image 2 image-to-image accepts at most ${maxInputs} input images`
        );
      }

      const apiModel = IMAGE_TO_IMAGE_MODEL;
      // nsfw_checker default is `true` per Kie.ai spec (matches Playground default).
      const input: Record<string, unknown> = {
        prompt: request.prompt,
        input_urls: request.imageUrls,
        aspect_ratio: this.normaliseAspectRatio(request.aspect_ratio),
        nsfw_checker: true,
      };
      if (request.resolution) {
        input.resolution = request.resolution;
      }

      const result = await this.submitJob(apiModel, input);

      return {
        taskId: result.taskId,
        status: "pending",
        metadata: {
          provider: this.getProvider(),
          model: request.model || apiModel,
          api_model: apiModel,
          api_version: "jobs",
          recordId: result.recordId,
          aspect_ratio: input.aspect_ratio,
          resolution: input.resolution,
          input_image_count: request.imageUrls.length,
          raw_response: result,
        },
      };
    } catch (error) {
      return {
        taskId: "",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { provider: this.getProvider() },
      };
    }
  }

  /**
   * Status polling fallback in case the webhook is unreachable.
   * Uses Kie.ai's unified jobs/recordInfo endpoint.
   */
  async getTaskStatus(taskId: string): Promise<ProviderResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const fallback = await response.text();
        const message = this.getKieErrorMessage(response.status, fallback);
        // Treat 429/5xx as transient so the poller keeps trying.
        const isTransient = response.status >= 429;
        return {
          taskId,
          status: isTransient ? "pending" : "failed",
          error: `GPT Image 2 recordInfo error: ${response.status} - ${message}`,
          metadata: {
            provider: this.getProvider(),
            http_status: response.status,
            transient: isTransient,
          },
        };
      }

      const data: KieRecordInfoResponse = await response.json();

      if (data.code !== 200 || !data.data) {
        const message = this.getKieErrorMessage(data.code, data.msg);
        return {
          taskId,
          status: "failed",
          error: `GPT Image 2 recordInfo error: ${data.code} - ${message}`,
          metadata: {
            provider: this.getProvider(),
            api_code: data.code,
            api_message: data.msg,
          },
        };
      }

      const task = data.data;

      if (task.state === "success") {
        if (!task.resultJson) {
          // Task succeeded but result not yet materialised — keep polling.
          return {
            taskId,
            status: "pending",
            metadata: {
              provider: this.getProvider(),
              state: task.state,
              message: "Task succeeded but result payload not yet available",
            },
          };
        }
        const callbackLike: GptImage2CallbackRequest = {
          code: data.code,
          msg: data.msg || "success",
          data: {
            taskId: task.taskId,
            state: "success",
            model: task.model,
            createTime: task.createTime,
            updateTime: task.updateTime || task.completeTime || Date.now(),
            completeTime: task.completeTime || undefined,
            costTime: task.costTime || undefined,
            resultJson: task.resultJson,
            param: task.param,
          },
        };
        return this.handleCallback(callbackLike);
      }

      if (task.state === "fail") {
        return {
          taskId,
          status: "failed",
          error: task.failMsg || "Task failed",
          metadata: {
            provider: this.getProvider(),
            fail_code: task.failCode,
            fail_message: task.failMsg,
            api_code: data.code,
            api_message: data.msg,
          },
        };
      }

      // waiting | queuing | generating
      return {
        taskId,
        status: "pending",
        metadata: {
          provider: this.getProvider(),
          state: task.state,
          model: task.model,
        },
      };
    } catch (error) {
      // Network/fetch errors are transient.
      return {
        taskId,
        status: "pending",
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          provider: this.getProvider(),
          transient: true,
        },
      };
    }
  }

  /**
   * Handle async webhook payload from Kie.ai for GPT Image 2 jobs.
   */
  async handleCallback(
    callbackData: GptImage2CallbackRequest
  ): Promise<ProviderResponse> {
    const { code, msg, data } = callbackData || ({} as GptImage2CallbackRequest);
    if (!data) {
      return {
        taskId: "",
        status: "failed",
        error: "Invalid callback payload: missing data",
        metadata: { provider: this.getProvider(), original_callback: callbackData },
      };
    }

    const {
      taskId,
      state,
      model,
      createTime,
      updateTime,
      completeTime,
      costTime,
      failCode,
      failMsg,
      resultJson,
      param,
    } = data;

    const mapStatus = (
      s: string,
      c: number
    ): "pending" | "processing" | "completed" | "failed" => {
      if (c === 200 && s === "success") return "completed";
      if (c !== 200 || s === "fail") return "failed";
      switch (s) {
        case "success":
          return "completed";
        case "fail":
          return "failed";
        case "processing":
        case "generating":
          return "processing";
        case "pending":
        case "waiting":
        case "queuing":
          return "pending";
        default:
          return "pending";
      }
    };

    const mappedStatus = mapStatus(state, code);

    const baseResult: ProviderResponse = {
      taskId,
      status: mappedStatus,
      metadata: {
        provider: this.getProvider(),
        original_callback: callbackData,
        model,
        api_code: code,
        api_message: msg,
        create_time: createTime ? new Date(createTime).toISOString() : undefined,
        update_time: updateTime ? new Date(updateTime).toISOString() : undefined,
        complete_time: completeTime ? new Date(completeTime).toISOString() : undefined,
        cost_time_seconds: costTime,
        original_param: param,
      },
    };

    if (mappedStatus === "completed" && resultJson) {
      try {
        const resultData: GptImage2ResultData = JSON.parse(resultJson);
        if (!resultData.resultUrls || !Array.isArray(resultData.resultUrls)) {
          throw new Error(
            "Invalid resultJson format: resultUrls not found or not an array"
          );
        }

        const images: ProviderImageResult[] = resultData.resultUrls.map((url) => {
          const urlParts = url.split(".");
          const format = urlParts[urlParts.length - 1]?.toLowerCase() || "png";
          return {
            url,
            // Kie.ai does not return dimensions; downstream display computes from URL.
            width: 1024,
            height: 1024,
            format,
          };
        });

        return {
          ...baseResult,
          status: "completed" as const,
          images,
          metadata: {
            ...baseResult.metadata,
            result_urls: resultData.resultUrls,
            image_count: images.length,
          },
        };
      } catch (parseError) {
        return {
          ...baseResult,
          status: "failed" as const,
          error: `Failed to parse result data: ${
            parseError instanceof Error ? parseError.message : "Unknown parse error"
          }`,
          metadata: {
            ...baseResult.metadata,
            parse_error:
              parseError instanceof Error ? parseError.message : "Unknown parse error",
            raw_result_json: resultJson,
          },
        };
      }
    }

    if (mappedStatus === "failed") {
      let errorMessage = "Generation failed";
      if (failCode && failMsg) {
        errorMessage = `${failMsg} (Code: ${failCode})`;
      } else if (failMsg) {
        errorMessage = failMsg;
      } else if (msg && msg !== "success") {
        errorMessage = msg;
      }

      console.error("[GPT Image 2] Task failed:", {
        taskId,
        state,
        api_code: code,
        api_message: msg,
        failCode,
        failMsg,
        model,
      });

      return {
        ...baseResult,
        status: "failed" as const,
        error: errorMessage,
        metadata: {
          ...baseResult.metadata,
          fail_code: failCode,
          fail_message: failMsg,
        },
      };
    }

    return {
      ...baseResult,
      status: mappedStatus,
    };
  }

  validateConfig(): boolean {
    return !!this.apiKey;
  }
}
