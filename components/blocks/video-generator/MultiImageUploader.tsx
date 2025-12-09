"use client";

import { useState, useCallback } from "react";
import { ImageIcon, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getVideoModel } from "@/config/video-models";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { ImageUploaderBaseProps } from "./types";
import { ImageSelectionModal, type SelectedImage } from "./ImageSelectionModal";

interface MultiImageUploaderProps extends ImageUploaderBaseProps {
  maxImages: 2 | 3;
  onImageUploaded?: (url: string, index: number) => Promise<void>;
}

export function MultiImageUploader({
  selectedModel,
  maxImages,
  isAuthenticated,
  onShowSignModal,
  onImagesChange,
  onImageUploaded,
}: MultiImageUploaderProps) {
  const t = useTranslations("video-generator");
  const modelConfig = getVideoModel(selectedModel);
  const imageLabels = modelConfig?.imageCapabilities?.labels;

  const { imageSlots, uploadImage, removeImage, swapImages, addUrls } =
    useImageUpload({
      maxImages,
      selectedModel,
      isAuthenticated,
      onShowSignModal,
      onImagesChange,
      onImageUploaded,
    });

  const uploadedCount = imageSlots.filter((slot) => slot.url).length;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectFromCreations = useCallback(
    (selections: SelectedImage[]) => {
      if (selections.length === 0) return;

      const currentCount = imageSlots.filter((slot) => slot.url).length;
      const remainingSlots = maxImages - currentCount;
      const toAdd = selections.slice(0, remainingSlots);

      if (selections.length > remainingSlots) {
        toast.warning(`Only adding first ${remainingSlots} images`);
      }

      // Pass both URLs and source IDs
      addUrls(
        toAdd.map((s) => s.url),
        toAdd.map((s) => s.id)
      );
    },
    [imageSlots, maxImages, addUrls]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-white text-lg font-semibold">
            {t("uploadImage")}
            <span className="text-sm text-gray-400 ml-2">
              (1-{maxImages} images)
            </span>
          </span>
        </div>
        {maxImages === 2 && uploadedCount === 2 && (
          <Button
            onClick={swapImages}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10"
            title={t("swapFrames")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        className={`grid gap-4 ${
          maxImages === 2 ? "grid-cols-2" : "grid-cols-3"
        }`}
      >
        {imageSlots.map((slot, index) => {
          const label =
            imageLabels?.[index] ||
            (index === 0
              ? t("firstFrame")
              : index === maxImages - 1
              ? t("lastFrame")
              : `Image ${index + 1}`);

          return (
            <div key={index} className="relative">
              {/* Label */}
              <div className="absolute -top-2 left-2 z-10">
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                  {label}
                </span>
              </div>

              {!slot.url ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    slot.isUploading ? "cursor-not-allowed" : "cursor-pointer"
                  } border-gray-600 hover:border-gray-500`}
                  onClick={() =>
                    !slot.isUploading &&
                    document
                      .getElementById(`multi-image-upload-${index}`)
                      ?.click()
                  }
                >
                  {slot.isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto mb-2"></div>
                      <p className="text-xs text-blue-300">
                        {index === 0
                          ? t("uploadingFirstFrame")
                          : t("uploadingLastFrame")}
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-300">
                        {t("clickToUpload")}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            onShowSignModal();
                          } else {
                            setIsModalOpen(true);
                          }
                        }}
                        className="text-gray-500 underline text-xs hover:text-blue-400 mt-1"
                      >
                        {t("myCreations")}
                      </button>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, index);
                    }}
                    className="hidden"
                    id={`multi-image-upload-${index}`}
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={slot.url}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-24 object-contain rounded-lg bg-gray-800"
                  />
                  {!slot.isUploading && (
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {slot.isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ImageSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromCreations}
        maxSelection={maxImages}
        currentCount={imageSlots.filter((slot) => slot.url).length}
      />
    </div>
  );
}
