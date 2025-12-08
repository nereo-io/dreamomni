"use client";

import { useState, useEffect } from "react";
import { ImageIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useImageUpload } from "./useImageUpload";
import type { ImageUploaderBaseProps } from "./types";

interface ReferenceImageUploaderProps extends ImageUploaderBaseProps {
  onImageUploaded?: (url: string, index: number) => Promise<void>;
}

export function ReferenceImageUploader({
  selectedModel,
  isAuthenticated,
  onShowSignModal,
  onImagesChange,
  onImageUploaded,
}: ReferenceImageUploaderProps) {
  const t = useTranslations("video-generator");
  const [isDragOver, setIsDragOver] = useState(false);

  const { imageSlots, uploadMultipleImages, removeImage } = useImageUpload({
    maxImages: 3,
    selectedModel,
    isAuthenticated,
    onShowSignModal,
    onImagesChange,
    onImageUploaded,
  });

  const uploadedCount = imageSlots.filter((slot) => slot.url).length;
  const isUploading = imageSlots.some((slot) => slot.isUploading);

  // Paste event listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            const timestamp = new Date().getTime();
            const newFile = new File([file], `pasted-image-${timestamp}.png`, {
              type: file.type,
            });
            imageFiles.push(newFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        await uploadMultipleImages(imageFiles);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [uploadMultipleImages]);

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
      uploadMultipleImages(files);
    }
  };

  return (
    <div>
      <div className="text-white text-lg font-semibold mb-4">
        {t("uploadImage")}
        <span className="text-sm text-gray-400 ml-2">(1-3 reference images)</span>
      </div>

      {/* Upload area */}
      {uploadedCount < 3 && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
            isUploading ? "cursor-not-allowed" : "cursor-pointer"
          } ${
            isDragOver
              ? "border-blue-400 bg-blue-900/50"
              : "border-gray-600 hover:border-gray-500"
          }`}
          onDragOver={!isUploading ? handleDragOver : undefined}
          onDragLeave={!isUploading ? handleDragLeave : undefined}
          onDrop={!isUploading ? handleDrop : undefined}
          onClick={() =>
            !isUploading &&
            document.getElementById("ref-image-upload")?.click()
          }
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-sm text-blue-300">Uploading image...</p>
            </>
          ) : (
            <>
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-300 px-2 text-center">
                  {uploadedCount === 0
                    ? t("referenceUploadGuide")
                    : `${t("addMoreReferences")} (${uploadedCount}/3)`}
                </p>
                <p className="text-xs text-gray-400 px-2 text-center">
                  {t("multipleUploadHint")}
                </p>
                <p className="text-xs text-gray-400 px-2 text-center">
                  {t("supportedFormats")}
                </p>
              </div>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                uploadMultipleImages(Array.from(files));
              }
            }}
            className="hidden"
            id="ref-image-upload"
          />
        </div>
      )}

      {/* Uploaded images list */}
      {uploadedCount > 0 && (
        <div className="space-y-2">
          {imageSlots.map((slot, index) => {
            if (!slot.url && !slot.isUploading) return null;

            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg"
              >
                {slot.url && (
                  <img
                    src={slot.url}
                    alt={`Reference ${index + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                {slot.isUploading && (
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-700 rounded">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent"></div>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {t("referenceImage")} {index + 1}
                  </p>
                  {uploadedCount < 3 && (
                    <p className="text-xs text-gray-400">
                      {t("clickToUploadMore")}
                    </p>
                  )}
                </div>
                {!slot.isUploading && (
                  <button
                    onClick={() => removeImage(index)}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
