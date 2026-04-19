/**
 * VideoSubmitService — wraps provider.submit with retry and config-driven model fallback.
 *
 * Uses ProviderFactory.getProvider(modelId) exactly like the original code.
 * Fallback models are normal entries in VIDEO_MODELS (internal: true),
 * referenced by fallbackModelIds[] in the primary model config.
 *
 * Adding a fallback = add an internal model entry + set fallbackModelIds in video-models.ts.
 */

import {
  VideoModelConfig,
  getVideoModel,
} from "@/config/video-models";
import { ProviderFactory } from "@/services/providers/ProviderFactory";
import {
  VideoGenerationRequest,
  VideoGenerationResponse,
} from "@/services/providers/types";

export interface SubmitResult {
  response: VideoGenerationResponse;
  /** The model ID that was actually used (primary or fallback) */
  usedModelId: string;
  /** The model config that was actually used */
  usedModelConfig: VideoModelConfig;
}

export class VideoSubmitService {
  /**
   * Submit a video generation request.
   * Tries the primary model first, then falls back to fallbackModelIds models in order.
   */
  static async submit(
    modelId: string,
    modelConfig: VideoModelConfig,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<SubmitResult> {
    // 1. Try primary model
    try {
      const response = await this.submitWithRetry(modelId, input, webhookUrl);
      return { response, usedModelId: modelId, usedModelConfig: modelConfig };
    } catch (primaryError) {
      const primaryMsg =
        primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn(
        `⚠️ [VideoSubmitService] Primary model ${modelId} failed: ${primaryMsg}`
      );

      // 2. No fallback configured — rethrow
      if (!modelConfig.fallbackModelIds?.length) {
        throw primaryError;
      }

      // 3. Try fallback models in order
      for (const fallbackModelId of modelConfig.fallbackModelIds) {
        const fallbackConfig = getVideoModel(fallbackModelId);
        if (!fallbackConfig) {
          console.warn(
            `⚠️ [VideoSubmitService] Fallback model ${fallbackModelId} not found in VIDEO_MODELS, skipping`
          );
          continue;
        }

        try {
          console.log(
            `🔄 [VideoSubmitService] Trying fallback model ${fallbackModelId} (provider: ${fallbackConfig.provider})`
          );

          // Build input for the fallback model — override input.model with
          // the fallback's provider-specific model ID, same as the route does
          // for Volcano/BytePlus/Ali models.
          const fallbackInput: VideoGenerationRequest = {
            ...input,
            model: fallbackConfig.providerModelId || fallbackConfig.volcanoModel || fallbackConfig.aliModel || fallbackModelId,
          };

          // Fallback: single attempt, no retry
          const fallbackProvider = ProviderFactory.getProvider(fallbackModelId);
          const response = await fallbackProvider.submit(
            fallbackModelId,
            fallbackInput,
            webhookUrl
          );

          console.log(
            `✅ [VideoSubmitService] Fallback model ${fallbackModelId} succeeded, request_id: ${response.request_id}`
          );

          return {
            response,
            usedModelId: fallbackModelId,
            usedModelConfig: fallbackConfig,
          };
        } catch (fallbackError) {
          const msg =
            fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          console.warn(
            `⚠️ [VideoSubmitService] Fallback model ${fallbackModelId} failed: ${msg}`
          );
        }
      }

      // All fallbacks exhausted — throw original error
      throw primaryError;
    }
  }

  /**
   * Submit with retry (3 attempts, exponential backoff for timeout errors).
   * Uses ProviderFactory.getProvider(modelId) exactly like the original route code.
   */
  private static async submitWithRetry(
    modelId: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    const provider = ProviderFactory.getProvider(modelId);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await provider.submit(modelId, input, webhookUrl);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[VideoSubmitService] Submit failed (${attempt}/3): ${errorMsg}`
        );

        const isTimeoutError =
          errorMsg.includes("fetch failed") ||
          errorMsg.includes("Connect Timeout Error") ||
          errorMsg.includes("timeout") ||
          errorMsg.includes("ETIMEDOUT");

        if (!isTimeoutError || attempt === 3) {
          throw error;
        }

        const delay = attempt * 1000;
        console.log(
          `⏳ [VideoSubmitService] Timeout, retrying in ${delay}ms (${attempt}/3)...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Submit failed after retries");
  }
}
