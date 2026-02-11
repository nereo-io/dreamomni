import { updateImageGenerationById } from "@/models/imageGeneration";
import { AIServiceManager } from "@/services/AIServiceManager";
import { ImageStorageService } from "@/services/imageStorageService";
import { PixverseProvider } from "@/services/providers/PixverseProvider";
import type { ProviderImageResult } from "@/types/provider";
import type { ImageGeneration } from "@/types/image.d";

const INCOMPLETE_IMAGE_STATUSES = [
  "PENDING",
  "PROMPT_OPTIMIZING",
  "IN_QUEUE",
  "IN_PROGRESS",
];

const mapProviderStatusToImageStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "IN_QUEUE";
    case "processing":
      return "IN_PROGRESS";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    default:
      return "IN_PROGRESS";
  }
};

const mapPixverseImageStatus = (status: number) => {
  switch (status) {
    case 1:
      return { status: "COMPLETED", error_message: null };
    case 5:
      return { status: "IN_PROGRESS", error_message: null };
    case 7:
      return { status: "FAILED", error_message: "Content moderation failure" };
    case 8:
      return { status: "FAILED", error_message: "Generation failed" };
    default:
      return { status: "IN_PROGRESS", error_message: null };
  }
};

export const shouldSyncImageGeneration = (imageGeneration: ImageGeneration) => {
  if (imageGeneration.provider === "pixverse") {
    return !!imageGeneration.provider_task_id;
  }

  return (
    INCOMPLETE_IMAGE_STATUSES.includes(imageGeneration.status.toUpperCase()) &&
    !!imageGeneration.task_id &&
    !!imageGeneration.provider
  );
};

export async function syncImageGenerationStatus(
  imageGeneration: ImageGeneration
): Promise<ImageGeneration> {
  if (imageGeneration.provider === "pixverse") {
    if (!imageGeneration.provider_task_id) {
      throw new Error("Pixverse provider_task_id is missing");
    }

    const provider = new PixverseProvider();
    const pixverseResult = await provider.getImageResult(
      Number(imageGeneration.provider_task_id)
    );

    const mapped = mapPixverseImageStatus(pixverseResult.status);
    const updateParams: any = {
      status: mapped.status,
      error_message: mapped.error_message || undefined,
      metadata: {
        ...(imageGeneration.metadata || {}),
        provider_response: pixverseResult,
        last_status_sync_at: new Date().toISOString(),
      },
    };

    if (mapped.status === "COMPLETED" && pixverseResult.url) {
      const images: ProviderImageResult[] = [
        {
          url: pixverseResult.url,
        },
      ];

      updateParams.image_urls = [pixverseResult.url];
      updateParams.image_count = 1;
      updateParams.completed_at = new Date().toISOString();

      const uploadResult = await ImageStorageService.uploadImagesToR2(
        images,
        imageGeneration.id
      );
      if (uploadResult.success && uploadResult.r2Urls) {
        updateParams.image_urls_r2 = uploadResult.r2Urls;
      }
    }

    const updatedGeneration = await updateImageGenerationById(
      imageGeneration.id,
      updateParams
    );
    if (!updatedGeneration) {
      throw new Error("Failed to update image generation");
    }

    return updatedGeneration;
  }

  if (!imageGeneration.provider || !imageGeneration.task_id) {
    throw new Error("Image generation provider or task_id is missing");
  }

  const aiServiceManager = AIServiceManager.getInstance();
  const statusResult = await aiServiceManager.getTaskStatus(
    imageGeneration.provider as any,
    imageGeneration.task_id
  );

  let mappedStatus = mapProviderStatusToImageStatus(statusResult.status);
  if (mappedStatus === "IN_QUEUE" && imageGeneration.status === "IN_PROGRESS") {
    mappedStatus = "IN_PROGRESS";
  }

  const updateParams: any = {
    status: mappedStatus,
    metadata: {
      ...(imageGeneration.metadata || {}),
      provider_response: statusResult.metadata,
      last_status_sync_at: new Date().toISOString(),
    },
  };

  if (statusResult.error) {
    updateParams.error_message = statusResult.error;
  }

  if (mappedStatus === "COMPLETED" && statusResult.images?.length) {
    const imageUrls = statusResult.images.map((img) => img.url).filter(Boolean);
    if (imageUrls.length > 0) {
      updateParams.image_urls = imageUrls;
      updateParams.image_count = imageUrls.length;
      updateParams.completed_at = new Date().toISOString();

      const uploadResult = await ImageStorageService.uploadImagesToR2(
        statusResult.images,
        imageGeneration.id
      );
      if (uploadResult.success && uploadResult.r2Urls) {
        updateParams.image_urls_r2 = uploadResult.r2Urls;
      }
    }
  }

  const updatedGeneration = await updateImageGenerationById(
    imageGeneration.id,
    updateParams
  );
  if (!updatedGeneration) {
    throw new Error("Failed to update image generation");
  }

  return updatedGeneration;
}
