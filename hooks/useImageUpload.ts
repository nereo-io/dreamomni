/**
 * Shared image upload logic
 * Eliminates duplicate code across uploader variants
 * Uses R2 direct upload (presigned URL) to bypass Vercel 4.5MB limit
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { validateImage } from "@/config/image-validation-rules";
import { uploadImageToR2 } from "@/lib/upload-utils";

interface ImageSlot {
  url: string | null;
  isUploading: boolean;
  sourceImageId?: string; // ID from image_generations table (for "My Creations" selections)
}

interface UseImageUploadProps {
  maxImages: number;
  selectedModel: string;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
  onImagesChange: (urls: (string | null)[], sourceImageIds?: (string | null)[]) => void;
  onImageUploaded?: (url: string, index: number) => Promise<void>;
  initialImages?: (string | null)[];
  initialSourceImageIds?: (string | null)[];
}

export function useImageUpload({
  maxImages,
  selectedModel,
  isAuthenticated,
  onShowSignModal,
  onImagesChange,
  onImageUploaded,
  initialImages,
  initialSourceImageIds,
}: UseImageUploadProps) {
  const buildSlots = useCallback(
    (urls?: (string | null)[], sourceIds?: (string | null)[]) => {
      const normalizedUrls = (urls || []).slice(0, maxImages);
      const normalizedSourceIds = (sourceIds || []).slice(0, maxImages);
      const slots: ImageSlot[] = normalizedUrls.map((url, index) => ({
        url: url ?? null,
        isUploading: false,
        sourceImageId: url ? (normalizedSourceIds[index] ?? undefined) : undefined,
      }));

      while (slots.length < maxImages) {
        slots.push({ url: null, isUploading: false });
      }

      return slots;
    },
    [maxImages]
  );

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() =>
    buildSlots(initialImages, initialSourceImageIds)
  );

  useEffect(() => {
    setImageSlots((prev) => {
      if (prev.some((slot) => slot.isUploading)) {
        return prev;
      }

      const next = buildSlots(initialImages, initialSourceImageIds);
      const isSame =
        prev.length === next.length &&
        prev.every(
          (slot, index) =>
            slot.url === next[index].url &&
            slot.sourceImageId === next[index].sourceImageId
        );

      return isSame ? prev : next;
    });
  }, [buildSlots, initialImages, initialSourceImageIds]);

  // Sync maxImages changes
  const resetSlots = useCallback(() => {
    setImageSlots(
      Array(maxImages)
        .fill(null)
        .map(() => ({ url: null, isUploading: false }))
    );
  }, [maxImages]);

  // Upload single image
  const uploadImage = useCallback(
    async (file: File, index: number) => {
      if (!isAuthenticated) {
        onShowSignModal();
        return;
      }

      if (index < 0 || index >= maxImages) {
        toast.error(`Invalid image index. Maximum ${maxImages} images allowed.`);
        return;
      }

      const validationResult = await validateImage(file, selectedModel);
      if (!validationResult.valid) {
        toast.error(validationResult.error || "Invalid image file.");
        return;
      }

      // Mark as uploading
      setImageSlots((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], isUploading: true };
        return updated;
      });

      try {
        // Direct upload to R2 (bypasses Vercel 4.5MB limit)
        const uploadedUrl = await uploadImageToR2(file);

        // Update slot with URL
        setImageSlots((prev) => {
          const updated = [...prev];
          updated[index] = { url: uploadedUrl, isUploading: false };

          // Sync to parent (with source IDs)
          const urls = updated.map((slot) => slot.url);
          const sourceIds = updated.map((slot) => slot.sourceImageId ?? null);
          onImagesChange(urls, sourceIds);

          return updated;
        });

        // Optional post-upload callback (e.g., Pixverse)
        if (onImageUploaded) {
          await onImageUploaded(uploadedUrl, index);
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to upload image. Please try again.");

        // Reset slot on error
        setImageSlots((prev) => {
          const updated = [...prev];
          updated[index] = { url: null, isUploading: false };
          return updated;
        });
      }
    },
    [isAuthenticated, onShowSignModal, maxImages, selectedModel, onImagesChange, onImageUploaded]
  );

  // Upload multiple images in parallel
  const uploadMultipleImages = useCallback(
    async (files: File[]) => {
      if (!isAuthenticated) {
        onShowSignModal();
        return;
      }

      const emptyIndexes = imageSlots
        .map((slot, index) => (slot.url ? null : index))
        .filter((index): index is number => index !== null);
      const remainingSlots = emptyIndexes.length;

      if (remainingSlots <= 0) {
        toast.error(`Maximum ${maxImages} images allowed.`);
        return;
      }

      const filesToUpload = files.slice(0, remainingSlots);

      if (files.length > remainingSlots) {
        toast.warning(
          `Only uploading first ${remainingSlots} of ${files.length} files.`
        );
      }

      // Parallel upload
      await Promise.all(
        filesToUpload.map((file, i) => uploadImage(file, emptyIndexes[i]))
      );
    },
    [isAuthenticated, onShowSignModal, maxImages, imageSlots, uploadImage]
  );

  // Remove image
  const removeImage = useCallback(
    (index: number) => {
      setImageSlots((prev) => {
        const updated = [...prev];
        updated[index] = { url: null, isUploading: false };

        const urls = updated.map((slot) => slot.url);
        const sourceIds = updated.map((slot) => slot.sourceImageId ?? null);
        onImagesChange(urls, sourceIds);

        return updated;
      });
    },
    [onImagesChange]
  );

  // Swap first and last images
  const swapImages = useCallback(() => {
    setImageSlots((prev) => {
      if (prev.length !== 2) return prev;

      const swapped = [prev[1], prev[0]];
      const urls = swapped.map((slot) => slot.url);
      const sourceIds = swapped.map((slot) => slot.sourceImageId ?? null);
      onImagesChange(urls, sourceIds);

      return swapped;
    });
  }, [onImagesChange]);

  // Add URLs directly (for selecting from existing images)
  const addUrls = useCallback(
    (urls: string[], sourceImageIds?: string[]) => {
      setImageSlots((prev) => {
        const updated = [...prev];
        let nextIndex = updated.findIndex((slot) => !slot.url);

        urls.forEach((url, i) => {
          if (nextIndex >= 0 && nextIndex < maxImages) {
            updated[nextIndex] = {
              url,
              isUploading: false,
              sourceImageId: sourceImageIds?.[i], // Attach source image ID if provided
            };
            nextIndex = updated.findIndex((slot, idx) => idx > nextIndex && !slot.url);
          }
        });

        const allUrls = updated.map((slot) => slot.url);
        const allSourceIds = updated.map((slot) => slot.sourceImageId ?? null);
        onImagesChange(allUrls, allSourceIds);

        return updated;
      });
    },
    [maxImages, onImagesChange]
  );

  // Get all source image IDs (for API submission)
  const getSourceImageIds = useCallback(() => {
    return imageSlots
      .map((slot) => slot.sourceImageId)
      .filter(Boolean) as string[];
  }, [imageSlots]);

  return {
    imageSlots,
    uploadImage,
    uploadMultipleImages,
    removeImage,
    swapImages,
    resetSlots,
    addUrls,
    getSourceImageIds,
  };
}
