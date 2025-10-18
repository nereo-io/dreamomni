"use client";

import { useState, useCallback } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { validateImage } from "@/config/image-validation-rules";
import type { VideoEffect } from "@/types/video-effect";

interface ImageUploaderProps {
  // 模型配置
  selectedModel: string;
  maxImages: number; // 1 或 2

  // 上传结果回调
  onImagesChange: (imageUrls: string[]) => void;

  // 可选配置
  effect?: VideoEffect | null;
  onPixverseImgIdChange?: (imgId: number | null) => void;

  // 用户认证
  isAuthenticated: boolean;
  onShowSignModal: () => void;
}

export function ImageUploader({
  selectedModel,
  maxImages,
  onImagesChange,
  effect,
  onPixverseImgIdChange,
  isAuthenticated,
  onShowSignModal,
}: ImageUploaderProps) {
  const t = useTranslations("video-generator");

  // 状态管理
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean[]>([
    false,
    false,
  ]);
  const [isDragOver, setIsDragOver] = useState(false);

  const supportsDualImages = maxImages >= 2;

  // 图片上传处理
  const handleImageUpload = useCallback(
    async (file: File, index: number = 0) => {
      if (!isAuthenticated) {
        onShowSignModal();
        return;
      }

      if (index < 0 || index >= maxImages) {
        toast.error(
          `Invalid image index. Maximum ${maxImages} images allowed.`
        );
        return;
      }

      const validationResult = await validateImage(file, selectedModel);
      if (!validationResult.valid) {
        toast.error(validationResult.error || "Invalid image file.");
        return;
      }

      // 更新上传状态
      setIsUploadingImages((prev) => {
        const newState = [...prev];
        newState[index] = true;
        return newState;
      });

      const formData = new FormData();
      formData.append("file", file);

      try {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.code !== 0) {
          throw new Error(uploadResult.message || "Image upload failed");
        }

        // 更新URL数组
        const newUrls = [...uploadedImageUrls];
        newUrls[index] = uploadResult.data.url;
        setUploadedImageUrls(newUrls);
        onImagesChange(newUrls);

        // Pixverse 特效上传
        if (
          effect?.effect_type === "pixverse_template" &&
          onPixverseImgIdChange
        ) {
          try {
            const pixverseResponse = await fetch(
              "/api/video-effects/pixverse/upload",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: uploadResult.data.url }),
              }
            );

            const pixverseResult = await pixverseResponse.json();
            if (pixverseResult.code === 0 && pixverseResult.data?.imgId) {
              onPixverseImgIdChange(pixverseResult.data.imgId);
            } else {
              throw new Error("Failed to upload image to Pixverse");
            }
          } catch (pixverseError) {
            console.error("Pixverse upload error:", pixverseError);
            toast.error("Failed to upload image for effect. Please try again.");
            removeImage(index);
            return;
          }
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to upload image. Please try again.");
        removeImage(index);
      } finally {
        setIsUploadingImages((prev) => {
          const newState = [...prev];
          newState[index] = false;
          return newState;
        });
      }
    },
    [
      isAuthenticated,
      onShowSignModal,
      maxImages,
      selectedModel,
      uploadedImageUrls,
      onImagesChange,
      effect,
      onPixverseImgIdChange,
      supportsDualImages,
    ]
  );

  // 删除图片
  const removeImage = useCallback(
    (index: number) => {
      const newUrls = [...uploadedImageUrls];
      newUrls.splice(index, 1);
      setUploadedImageUrls(newUrls);
      onImagesChange(newUrls);

      if (index === 0 && onPixverseImgIdChange) {
        onPixverseImgIdChange(null);
      }
    },
    [uploadedImageUrls, onImagesChange, onPixverseImgIdChange]
  );

  // 交换首尾帧
  const swapImages = useCallback(() => {
    if (uploadedImageUrls.length === 2) {
      const swapped = [uploadedImageUrls[1], uploadedImageUrls[0]];
      setUploadedImageUrls(swapped);
      onImagesChange(swapped);
    }
  }, [uploadedImageUrls, onImagesChange]);

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleImageUpload(files[0], 0);
      }
    },
    [handleImageUpload]
  );

  // 单图预览（向后兼容）
  const imagePreview = uploadedImageUrls[0] || null;
  const isUploadingImage = isUploadingImages[0] || false;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white text-lg font-semibold">
          {t("uploadImage")}
          {supportsDualImages && (
            <span className="text-sm text-gray-400 ml-2">(1-2 images)</span>
          )}
        </div>
        {uploadedImageUrls.length === 2 && (
          <Button
            onClick={swapImages}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Swap Frames
          </Button>
        )}
      </div>

      {/* 双图上传布局 */}
      {supportsDualImages ? (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((index) => {
            const hasImage = uploadedImageUrls[index];
            const isUploading = isUploadingImages[index];

            return (
              <div key={index} className="relative">
                {/* 标签 */}
                <div className="absolute -top-2 left-2 z-10">
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                    {index === 0 ? "First Frame" : "Last Frame"}
                  </span>
                </div>

                {!hasImage ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                      isUploading ? "cursor-not-allowed" : "cursor-pointer"
                    } ${
                      isDragOver
                        ? "border-blue-400 bg-blue-900/50"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                    onClick={() =>
                      !isUploading &&
                      document.getElementById(`image-upload-${index}`)?.click()
                    }
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-400 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-xs text-blue-300">
                          Uploading {index === 0 ? "first" : "last"} frame...
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-300">Click to upload</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, index);
                      }}
                      className="hidden"
                      id={`image-upload-${index}`}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={uploadedImageUrls[index]}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-24 object-contain rounded-lg bg-gray-800"
                    />
                    {!isUploading && (
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {isUploading && (
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
      ) : /* 单图上传布局（向后兼容） */
      !imagePreview ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isUploadingImage ? "cursor-not-allowed" : "cursor-pointer"
          } ${
            isDragOver
              ? "border-blue-400 bg-blue-900/50"
              : "border-gray-600 hover:border-gray-500"
          }`}
          onDragOver={!isUploadingImage ? handleDragOver : undefined}
          onDragLeave={!isUploadingImage ? handleDragLeave : undefined}
          onDrop={!isUploadingImage ? handleDrop : undefined}
          onClick={() =>
            !isUploadingImage &&
            document.getElementById("image-upload")?.click()
          }
        >
          {isUploadingImage ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-sm text-blue-300">Uploading image...</p>
            </>
          ) : (
            <>
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-300 px-2 text-center">
                  {t("dragAndDropImage")}
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, 0);
            }}
            className="hidden"
            id="image-upload"
          />
        </div>
      ) : (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Uploaded"
            className="w-full h-32 object-contain rounded-lg bg-gray-800"
          />
          {!isUploadingImage && (
            <button
              onClick={() => removeImage(0)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isUploadingImage && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="text-white text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
