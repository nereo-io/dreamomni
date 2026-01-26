"use client";

/**
 * Image Uploader Router Component
 * Eliminates 560-line monolith by routing to specialized components
 */

import { useMemo, useCallback } from "react";
import type { VideoEffect } from "@/types/video-effect";
import { SingleImageUploader } from "./SingleImageUploader";
import { MultiImageUploader } from "./MultiImageUploader";

interface ImageUploaderProps {
  selectedModel: string;
  maxImages: number;
  onImagesChange: (imageUrls: string[], sourceImageIds?: string[]) => void;
  imageUrls?: string[];
  sourceImageIds?: string[];
  effect?: VideoEffect | null;
  onPixverseImgIdChange?: (imgId: number | null) => void;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
  generationType?: string;
}

export function ImageUploader({
  selectedModel,
  maxImages,
  onImagesChange,
  imageUrls,
  sourceImageIds,
  effect,
  onPixverseImgIdChange,
  isAuthenticated,
  onShowSignModal,
  generationType,
}: ImageUploaderProps) {
  // Note: REFERENCE_2_VIDEO is handled by ImageGridUploader in parent component (index.tsx)
  // This component only handles other image-to-video modes

  // Pixverse effect upload callback
  const handlePixverseUpload = useCallback(
    async (url: string, index: number) => {
      if (
        index !== 0 ||
        effect?.effect_type !== "pixverse_template" ||
        !onPixverseImgIdChange
      ) {
        return;
      }

      try {
        const response = await fetch("/api/video-effects/pixverse/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url }),
        });

        const result = await response.json();
        if (result.code === 0 && result.data?.imgId) {
          onPixverseImgIdChange(result.data.imgId);
        } else {
          throw new Error("Failed to upload image to Pixverse");
        }
      } catch (error) {
        console.error("Pixverse upload error:", error);
        throw error;
      }
    },
    [effect, onPixverseImgIdChange]
  );

  // Route to appropriate component
  const UploaderComponent = useMemo(() => {
    if (maxImages >= 2) {
      return (
        <MultiImageUploader
          selectedModel={selectedModel}
          maxImages={maxImages as 2 | 3}
          isAuthenticated={isAuthenticated}
          onShowSignModal={onShowSignModal}
          onImagesChange={onImagesChange}
          onImageUploaded={handlePixverseUpload}
          imageUrls={imageUrls}
          sourceImageIds={sourceImageIds}
        />
      );
    }

    return (
      <SingleImageUploader
        selectedModel={selectedModel}
        isAuthenticated={isAuthenticated}
        onShowSignModal={onShowSignModal}
        onImagesChange={onImagesChange}
        onImageUploaded={handlePixverseUpload}
        imageUrls={imageUrls}
        sourceImageIds={sourceImageIds}
      />
    );
  }, [
    maxImages,
    selectedModel,
    isAuthenticated,
    onShowSignModal,
    onImagesChange,
    handlePixverseUpload,
    imageUrls,
    sourceImageIds,
  ]);

  return UploaderComponent;
}
