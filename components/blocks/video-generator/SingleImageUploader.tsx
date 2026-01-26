"use client";

import { useState, useCallback } from "react";
import { ImageIcon, X, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { ImageUploaderBaseProps } from "./types";
import { ImageSelectionModal, type SelectedImage } from "./ImageSelectionModal";

interface SingleImageUploaderProps extends ImageUploaderBaseProps {
  onImageUploaded?: (url: string, index: number) => Promise<void>;
}

export function SingleImageUploader({
  selectedModel,
  isAuthenticated,
  onShowSignModal,
  onImagesChange,
  onImageUploaded,
  imageUrls,
  sourceImageIds,
}: SingleImageUploaderProps) {
  const t = useTranslations("video-generator");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { imageSlots, uploadImage, removeImage, addUrls } = useImageUpload({
    maxImages: 1,
    selectedModel,
    isAuthenticated,
    onShowSignModal,
    onImagesChange,
    onImageUploaded,
    initialImages: imageUrls,
    initialSourceImageIds: sourceImageIds,
  });

  const slot = imageSlots[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadImage(files[0], 0);
    }
  };

  const handleSelectFromCreations = useCallback(
    (selections: SelectedImage[]) => {
      if (selections.length === 0) return;
      // SingleImageUploader 只需要第一张
      const first = selections[0];
      addUrls([first.url], [first.id]);
    },
    [addUrls]
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white text-lg font-semibold">
          {t("uploadImage")}
        </span>
      </div>

      {!slot.url ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            slot.isUploading ? "cursor-not-allowed" : "cursor-pointer"
          } ${
            isDragOver
              ? "border-blue-400 bg-blue-900/50"
              : "border-gray-600 hover:border-gray-500"
          }`}
          onDragOver={!slot.isUploading ? handleDragOver : undefined}
          onDragLeave={!slot.isUploading ? handleDragLeave : undefined}
          onDrop={!slot.isUploading ? handleDrop : undefined}
          onClick={() =>
            !slot.isUploading &&
            document.getElementById("single-image-upload")?.click()
          }
        >
          {slot.isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mb-4"></div>
              <p className="text-sm text-blue-300">Uploading image...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <ImageIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text text-gray-300">
                  {t("dragAndDropImage")}
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
                  className="text-gray-500 underline text-sm hover:text-blue-400 mt-1"
                >
                  {t("selectFromCreations")}
                </button>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file, 0);
            }}
            className="hidden"
            id="single-image-upload"
          />
        </div>
      ) : null}

      {/* 格式说明文字 - 放在上传框下方 */}
      {!slot.url && (
        <p className="text-xs text-gray-400 mt-2">
          {t("supportedFormats")}
        </p>
      )}

      {slot.url && (
        <div className="relative">
          <img
            src={slot.url}
            alt="Uploaded"
            className="w-full h-32 object-contain rounded-lg bg-gray-800"
          />
          {!slot.isUploading && (
            <button
              onClick={() => removeImage(0)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {slot.isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="text-white text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      )}

      <ImageSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromCreations}
        maxSelection={1}
        currentCount={slot.url ? 1 : 0}
      />
    </div>
  );
}
