"use client";

/**
 * Image Uploader Router Component
 * Eliminates 560-line monolith by routing to specialized components
 */

import { useMemo, useCallback } from "react";
import type { VideoEffect } from "@/types/video-effect";
import { SingleImageUploader } from "./SingleImageUploader";
import { MultiImageUploader } from "./MultiImageUploader";
import { ReferenceImageUploader } from "./ReferenceImageUploader";

interface ImageUploaderProps {
  selectedModel: string;
  maxImages: number;
  onImagesChange: (imageUrls: string[]) => void;
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
  effect,
  onPixverseImgIdChange,
  isAuthenticated,
  onShowSignModal,
  generationType,
}: ImageUploaderProps) {
  const isReferenceToVideo = generationType === "REFERENCE_2_VIDEO";

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
    if (isReferenceToVideo) {
      return (
        <ReferenceImageUploader
          selectedModel={selectedModel}
          isAuthenticated={isAuthenticated}
          onShowSignModal={onShowSignModal}
          onImagesChange={onImagesChange}
          onImageUploaded={handlePixverseUpload}
        />
      );
    }

    if (maxImages >= 2) {
      return (
        <MultiImageUploader
          selectedModel={selectedModel}
          maxImages={maxImages as 2 | 3}
          isAuthenticated={isAuthenticated}
          onShowSignModal={onShowSignModal}
          onImagesChange={onImagesChange}
          onImageUploaded={handlePixverseUpload}
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
      />
    );
  }, [
    isReferenceToVideo,
    maxImages,
    selectedModel,
    isAuthenticated,
    onShowSignModal,
    onImagesChange,
    handlePixverseUpload,
  ]);

  return UploaderComponent;
}
