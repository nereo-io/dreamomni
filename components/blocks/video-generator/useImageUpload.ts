/**
 * Shared image upload logic
 * Eliminates duplicate code across uploader variants
 * Uses R2 direct upload (presigned URL) to bypass Vercel 4.5MB limit
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { validateImage } from "@/config/image-validation-rules";
import { uploadImageToR2 } from "@/lib/upload-utils";
import type { ImageSlot } from "./types";

interface UseImageUploadProps {
  maxImages: number;
  selectedModel: string;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
  onImagesChange: (urls: string[]) => void;
  onImageUploaded?: (url: string, index: number) => Promise<void>;
}

export function useImageUpload({
  maxImages,
  selectedModel,
  isAuthenticated,
  onShowSignModal,
  onImagesChange,
  onImageUploaded,
}: UseImageUploadProps) {
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(
    Array(maxImages)
      .fill(null)
      .map(() => ({ url: null, isUploading: false }))
  );

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

          // Sync to parent
          const urls = updated.map((slot) => slot.url).filter(Boolean) as string[];
          onImagesChange(urls);

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

      const currentCount = imageSlots.filter((slot) => slot.url).length;
      const remainingSlots = maxImages - currentCount;

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
      const startIndex = currentCount;
      await Promise.all(
        filesToUpload.map((file, i) => uploadImage(file, startIndex + i))
      );
    },
    [isAuthenticated, onShowSignModal, maxImages, imageSlots, uploadImage]
  );

  // Remove image
  const removeImage = useCallback(
    (index: number) => {
      setImageSlots((prev) => {
        const updated = [...prev];
        updated.splice(index, 1);
        updated.push({ url: null, isUploading: false });

        const urls = updated.map((slot) => slot.url).filter(Boolean) as string[];
        onImagesChange(urls);

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
      const urls = swapped.map((slot) => slot.url).filter(Boolean) as string[];
      onImagesChange(urls);

      return swapped;
    });
  }, [onImagesChange]);

  return {
    imageSlots,
    uploadImage,
    uploadMultipleImages,
    removeImage,
    swapImages,
    resetSlots,
  };
}
