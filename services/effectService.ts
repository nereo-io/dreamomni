/**
 * Effect Service — single entry point for all effect generation tasks.
 *
 * submitEffect() handles:
 *  - Config lookup & validation
 *  - Credit deduction (image vs video transaction types)
 *  - DB record creation (image_generations vs video_generations)
 *  - Provider API dispatch (KIE / PixVerse / …)
 *  - DB update with provider task ID
 *  - Credit refund on failure
 */

import {
  getEffectModel,
  calculateEffectCredits,
  EffectProvider,
  type EffectModelConfig,
} from "@/config/effect-models";
import { getImageModel } from "@/config/image-models";
import {
  createImageGeneration,
  updateImageGenerationById,
} from "@/models/imageGeneration";
import {
  createVideoGeneration,
  updateVideoGenerationById,
} from "@/models/videoGeneration";
import {
  decreaseCredits,
  increaseCredits,
  CreditsTransType,
  type DeductResult,
} from "@/services/credit";
import type { CreateImageGenerationParams } from "@/types/image.d";
import type { CreateVideoGenerationParams } from "@/types/video.d";

// ────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────

export interface EffectSubmitParams {
  effectId: string;
  imageUrls: string[];
  settings: Record<string, string>;
  userId: string;
}

export interface EffectSubmitResult {
  id: string;
  taskId: string;
  status: string;
  credits: number;
  outputType: "image" | "video";
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function mapEffectProviderToDbProvider(provider: EffectProvider): string {
  switch (provider) {
    case EffectProvider.KIE:
      return "nano_banana";
    case EffectProvider.PIXVERSE:
      return "pixverse";
    case EffectProvider.HAILUO:
      return "hailuo";
    default:
      return provider;
  }
}

function resolveEffectImageModelId(effectConfig: EffectModelConfig): string {
  const rawModel = effectConfig.model || "nano-banana-edit";
  if (getImageModel(rawModel)) {
    return rawModel;
  }
  const normalized = rawModel.includes("/") ? rawModel.split("/").pop()! : rawModel;
  if (getImageModel(normalized)) {
    return normalized;
  }
  return normalized;
}

function resolveEffectVideoModelId(effectConfig: EffectModelConfig): string {
  if (effectConfig.model) {
    const normalized = effectConfig.model.includes("/")
      ? effectConfig.model.split("/").pop()!
      : effectConfig.model;
    if (effectConfig.provider === EffectProvider.PIXVERSE) {
      if (normalized.startsWith("pixverse-") || normalized === "pixverse-template") {
        return normalized;
      }
      return `pixverse-${normalized}`;
    }
    return normalized;
  }
  return mapEffectProviderToDbProvider(effectConfig.provider);
}

function buildEffectMetadata(
  effectConfig: EffectModelConfig,
  settings: Record<string, string>
) {
  const effectType =
    effectConfig.outputType === "image" ? "image-effect" : "video-effect";

  return {
    id: effectConfig.id,
    name: effectConfig.name,
    provider: effectConfig.provider,
    effect_type: effectType,
    output_type: effectConfig.outputType,
    model: effectConfig.model,
    prompt: effectConfig.prompt,
    settings,
    pixverse_template_id: effectConfig.pixverseTemplateId,
    pixverse_mode: effectConfig.pixverseMode,
  };
}

async function refundCredits(
  userId: string,
  deductResult: DeductResult,
  refundTransType: CreditsTransType
): Promise<void> {
  for (const pool of deductResult.pools) {
    await increaseCredits({
      user_uuid: userId,
      trans_type: refundTransType,
      credits: pool.deducted,
      order_no: pool.order_no,
      expired_at: pool.expired_at,
    });
  }
  console.log(
    `💰 Effect credits refunded: ${deductResult.totalDeducted} across ${deductResult.pools.length} pool(s)`
  );
}

// ────────────────────────────────────────────────────────────
// Provider API callers
// ────────────────────────────────────────────────────────────

async function callKieApi(params: {
  prompt: string;
  imageUrls: string[];
  imageSize: string;
  model: string;
}): Promise<{ taskId: string }> {
  const apiKey = process.env.KIE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("KIE_AI_API_KEY is not configured");
  }

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
  const callBackUrl = `${baseUrl}/api/ai-callback/nano_banana`;

  const body = {
    callBackUrl,
    input: {
      prompt: params.prompt,
      image_urls: params.imageUrls,
      image_size: params.imageSize,
    },
    model: params.model,
  };

  console.log(`🎨 [EffectService] Calling Kie.ai API, model: ${params.model}`);

  const response = await fetch(
    "https://api.kie.ai/api/v1/playground/createTask",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kie.ai API error: ${response.status} - ${errorText}`);
  }

  const apiResponse = await response.json();

  if (apiResponse.code !== 200) {
    throw new Error(
      `Kie.ai API error: ${apiResponse.code} - ${apiResponse.message || "Unknown error"}`
    );
  }

  if (!apiResponse.data) {
    throw new Error("Kie.ai API error: No data in response");
  }

  return { taskId: apiResponse.data.taskId };
}

/**
 * Call PixVerse API — routes by effectConfig.pixverseMode:
 *
 *  image_template  → useImageTemplate()        → returns image_id
 *  image_to_video  → useImageToVideo()          → returns video_id
 *  transition      → useTransitionGenerator()   → returns video_id (needs 2 images)
 */
async function callPixverseApi(params: {
  effectConfig: EffectModelConfig;
  imageUrls: string[];
  settings: Record<string, string>;
}): Promise<{ taskId: string }> {
  const { PixverseProvider } = await import(
    "@/services/providers/PixverseProvider"
  );
  const provider = new PixverseProvider();

  const { effectConfig, imageUrls, settings } = params;
  const mode = effectConfig.pixverseMode || "image_to_video";

  // --- Upload images to PixVerse ---
  console.log(
    `🎨 [EffectService] Uploading ${imageUrls.length} image(s) to PixVerse (mode: ${mode})`
  );

  const imgIds: number[] = [];
  for (const url of imageUrls) {
    const uploadResult = await provider.uploadImage({ imageUrl: url });
    imgIds.push(uploadResult.img_id);
    console.log(
      `📤 [EffectService] Uploaded image → img_id: ${uploadResult.img_id}`
    );
  }

  const templateId = effectConfig.pixverseTemplateId;

  switch (mode) {
    case "image_template": {
      if (!templateId) {
        throw new Error(
          `PixVerse effect ${effectConfig.id} is missing pixverseTemplateId`
        );
      }
      const result = await provider.useImageTemplate({
        img_ids: imgIds,
        template_id: templateId,
      });
      const taskId = result.image_id.toString();
      console.log(
        `✅ [EffectService] PixVerse image_template created, image_id: ${taskId}`
      );
      return { taskId };
    }

    case "image_to_video": {
      if (!templateId) {
        throw new Error(
          `PixVerse effect ${effectConfig.id} is missing pixverseTemplateId`
        );
      }
      const duration = parseInt(settings.duration || "5", 10);
      const quality = settings.quality || "540p";
      const modelId = effectConfig.model || "v4.5";

      const result = await provider.useImageToVideo({
        duration,
        img_id: imgIds[0],
        ...(imgIds.length > 1 ? { img_ids: imgIds } : {}),
        model: modelId,
        prompt: effectConfig.prompt || "",
        quality,
        motion_mode: "normal",
        template_id: templateId,
      });
      const taskId = result.video_id.toString();
      console.log(
        `✅ [EffectService] PixVerse image_to_video created, video_id: ${taskId}`
      );
      return { taskId };
    }

    case "transition": {
      if (imgIds.length < 2) {
        throw new Error(
          `Transition effect requires exactly 2 images, got ${imgIds.length}`
        );
      }
      const duration = parseInt(settings.duration || "5", 10);
      const quality = settings.quality || "540p";
      const modelId = effectConfig.model || "v4.5";

      const result = await provider.useTransitionGenerator({
        prompt: effectConfig.prompt || "",
        model: modelId,
        duration,
        quality,
        first_frame_img: imgIds[0],
        last_frame_img: imgIds[1],
      });
      const taskId = result.video_id.toString();
      console.log(
        `✅ [EffectService] PixVerse transition created, video_id: ${taskId}`
      );
      return { taskId };
    }

    default:
      throw new Error(`Unknown pixverseMode: ${mode}`);
  }
}

// ────────────────────────────────────────────────────────────
// DB record helpers — image vs video
// ────────────────────────────────────────────────────────────

interface DbRecord {
  id: string;
}

async function createImageRecord(
  userId: string,
  effectConfig: EffectModelConfig,
  imageUrls: string[],
  settings: Record<string, string>,
  credits: number,
  deductResult: DeductResult,
  dbProvider: string
): Promise<DbRecord> {
  const effectMetadata = buildEffectMetadata(effectConfig, settings);
  const createParams: CreateImageGenerationParams = {
    user_id: userId,
    model_id: resolveEffectImageModelId(effectConfig),
    prompt: effectConfig.prompt || "",
    mode: "image-edit",
    source: "web",
    provider: dbProvider,
    input_image_urls: imageUrls,
    aspect_ratio: settings.ratio || "1:1",
    credits_used: credits,
    status: "IN_PROGRESS",
    metadata: {
      effect_type: "image-effect",
      effect_name: effectConfig.name,
      effect: effectMetadata,
      effect_id: effectConfig.id,
      settings,
      provider: dbProvider,
      credit_deduction: {
        pools: deductResult.pools,
        total_deducted: deductResult.totalDeducted,
        deducted_at: new Date().toISOString(),
      },
    },
  };
  return createImageGeneration(createParams);
}

async function createVideoRecord(
  userId: string,
  effectConfig: EffectModelConfig,
  imageUrls: string[],
  settings: Record<string, string>,
  credits: number,
  deductResult: DeductResult
): Promise<DbRecord> {
  const duration = parseInt(settings.duration || "5", 10);
  const effectMetadata = buildEffectMetadata(effectConfig, settings);
  const createParams: CreateVideoGenerationParams = {
    user_id: userId,
    model_id: resolveEffectVideoModelId(effectConfig),
    prompt: effectConfig.prompt || "",
    input_image_url: imageUrls[0],
    aspect_ratio: settings.ratio || "16:9",
    duration_seconds: duration,
    has_audio: false,
    status: "IN_QUEUE",
    image_urls: imageUrls,
    metadata: {
      effect_type: "video-effect",
      effect_name: effectConfig.name,
      effect: effectMetadata,
      effect_id: effectConfig.id,
      settings,
      provider: mapEffectProviderToDbProvider(effectConfig.provider),
      credit_deduction: {
        pools: deductResult.pools,
        total_deducted: deductResult.totalDeducted,
        deducted_at: new Date().toISOString(),
      },
    },
  };
  return createVideoGeneration(createParams);
}

async function updateRecord(
  outputType: "image" | "video",
  recordId: string,
  data: { provider_task_id?: string; pixverse_request_id?: string; status?: string; error_message?: string }
): Promise<void> {
  if (outputType === "image") {
    await updateImageGenerationById(recordId, {
      ...(data.provider_task_id && { provider_task_id: data.provider_task_id }),
      ...(data.status && { status: data.status as any }),
      ...(data.error_message && { error_message: data.error_message }),
    });
  } else {
    await updateVideoGenerationById(recordId, {
      ...(data.pixverse_request_id && { pixverse_request_id: data.pixverse_request_id }),
      ...(data.status && { status: data.status as any }),
      ...(data.error_message && { error_message: data.error_message }),
    });
  }
}

// ────────────────────────────────────────────────────────────
// Credit type resolution
// ────────────────────────────────────────────────────────────

function getDeductTransType(
  outputType: "image" | "video",
  settings: Record<string, string>
): CreditsTransType {
  if (outputType === "image") {
    return CreditsTransType.ImageGeneration;
  }
  const duration = parseInt(settings.duration || "5", 10);
  return duration <= 5
    ? CreditsTransType.VideoGeneration5s
    : CreditsTransType.VideoGeneration8s;
}

function getRefundTransType(outputType: "image" | "video"): CreditsTransType {
  return outputType === "image"
    ? CreditsTransType.RefundImageGenerationFailed
    : CreditsTransType.RefundVideoGenerationFailed;
}

// ────────────────────────────────────────────────────────────
// submitEffect — single entry point
// ────────────────────────────────────────────────────────────

export async function submitEffect(
  params: EffectSubmitParams
): Promise<EffectSubmitResult> {
  const { effectId, imageUrls, settings, userId } = params;

  // 1. Load & validate config
  const effectConfig = getEffectModel(effectId);
  if (!effectConfig) {
    throw new Error(`Unknown effect: ${effectId}`);
  }
  if (effectConfig.status !== "active") {
    throw new Error(`Effect ${effectId} is not active`);
  }

  const outputType = effectConfig.outputType;
  const dbProvider = mapEffectProviderToDbProvider(effectConfig.provider);

  // 2. Calculate credits
  const credits = calculateEffectCredits(effectId, settings);
  if (credits <= 0) {
    throw new Error(`Invalid credit calculation for effect ${effectId}`);
  }

  // 3. Deduct credits
  const deductTransType = getDeductTransType(outputType, settings);
  const refundTransType = getRefundTransType(outputType);

  let deductResult: DeductResult;
  try {
    deductResult = await decreaseCredits({
      user_uuid: userId,
      trans_type: deductTransType,
      credits,
    });
    console.log(
      `💰 [EffectService] Deducted ${deductResult.totalDeducted} credits (${deductTransType}) for ${effectId}`
    );
  } catch {
    throw new Error("Failed to deduct credits, please try again later");
  }

  // 4. Create DB record (image_generations or video_generations)
  let record: DbRecord;
  try {
    record =
      outputType === "image"
        ? await createImageRecord(userId, effectConfig, imageUrls, settings, credits, deductResult, dbProvider)
        : await createVideoRecord(userId, effectConfig, imageUrls, settings, credits, deductResult);
    console.log(`📝 [EffectService] Created ${outputType} record ${record.id}`);
  } catch (error) {
    try {
      await refundCredits(userId, deductResult, refundTransType);
    } catch (refundError) {
      console.error("❌ [EffectService] Failed to refund credits:", refundError);
    }
    throw error;
  }

  // 5. Call provider API
  try {
    let taskId: string;

    switch (effectConfig.provider) {
      case EffectProvider.KIE: {
        const result = await callKieApi({
          prompt: effectConfig.prompt || "",
          imageUrls,
          imageSize: settings.ratio || "1:1",
          model: effectConfig.model || "google/nano-banana-edit",
        });
        taskId = result.taskId;
        break;
      }
      case EffectProvider.PIXVERSE: {
        const result = await callPixverseApi({
          effectConfig,
          imageUrls,
          settings,
        });
        taskId = result.taskId;
        break;
      }
      case EffectProvider.HAILUO:
        throw new Error(
          `Provider ${effectConfig.provider} is not yet implemented for effects`
        );
      default:
        throw new Error(`Unknown provider: ${effectConfig.provider}`);
    }

    // 6. Update DB with provider task ID
    await updateRecord(outputType, record.id, {
      provider_task_id: outputType === "image" ? taskId : undefined,
      pixverse_request_id: outputType === "video" ? taskId : undefined,
      status: "IN_QUEUE",
    });

    console.log(
      `✅ [EffectService] Effect ${effectId} (${outputType}) submitted, taskId: ${taskId}`
    );

    return {
      id: record.id,
      taskId,
      status: "in_queue",
      credits,
      outputType,
    };
  } catch (error) {
    // Refund credits
    try {
      await refundCredits(userId, deductResult, refundTransType);
    } catch (refundError) {
      console.error("❌ [EffectService] Failed to refund credits:", refundError);
    }

    // Mark record as failed
    try {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await updateRecord(outputType, record.id, {
        status: "FAILED",
        error_message: errorMessage,
      });
    } catch (dbError) {
      console.error("❌ [EffectService] Failed to update DB record:", dbError);
    }

    throw error;
  }
}
