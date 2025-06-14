import { fal } from "@fal-ai/client";
import {
  VideoProvider,
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoGenerationStatus,
  VideoGenerationResult,
} from "./types";
import { getVideoModel } from "@/config/video-models";

export class FalProvider implements VideoProvider {
  constructor() {
    // Configure fal client
    fal.config({
      credentials: process.env.FAL_KEY,
    });
  }

  getName(): string {
    return "fal";
  }

  async submit(
    model: string,
    input: VideoGenerationRequest,
    webhookUrl?: string
  ): Promise<VideoGenerationResponse> {
    const modelConfig = getVideoModel(model);
    if (!modelConfig?.falEndpoint) {
      throw new Error(`FAL endpoint not found for model: ${model}`);
    }

    const submitOptions: any = {
      input,
    };

    if (webhookUrl) {
      submitOptions.webhookUrl = webhookUrl;
    }

    const { request_id } = await fal.queue.submit(
      modelConfig.falEndpoint,
      submitOptions
    );

    return {
      request_id,
      status: "submitted",
      model: model,
    };
  }

  async status(model: string, requestId: string): Promise<VideoGenerationStatus> {
    const modelConfig = getVideoModel(model);
    if (!modelConfig?.falEndpoint) {
      throw new Error(`FAL endpoint not found for model: ${model}`);
    }

    const falStatus = await fal.queue.status(modelConfig.falEndpoint, {
      requestId,
      logs: true,
    });

    return {
      request_id: requestId,
      status: falStatus.status,
      logs: (falStatus as any).logs || [],
      metrics: (falStatus as any).metrics || {},
      raw_response: falStatus,
    };
  }

  async result(model: string, requestId: string): Promise<VideoGenerationResult> {
    const modelConfig = getVideoModel(model);
    if (!modelConfig?.falEndpoint) {
      throw new Error(`FAL endpoint not found for model: ${model}`);
    }

    const result = await fal.queue.result(modelConfig.falEndpoint, {
      requestId,
    });

    const resultData = (result as any).data || result;
    const videoUrl = resultData.video_url || resultData.video?.url;

    return {
      request_id: requestId,
      status: "COMPLETED",
      video_url: videoUrl,
      data: resultData,
      raw_response: result,
    };
  }
}