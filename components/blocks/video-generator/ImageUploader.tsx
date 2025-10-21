"use client";

import { useState, useCallback, useEffect } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { validateImage } from "@/config/image-validation-rules";
import { getVideoModel } from "@/config/video-models";
import type { VideoEffect } from "@/types/video-effect";

interface ImageUploaderProps {
  // 模型配置
  selectedModel: string;
  maxImages: number; // 1, 2 或 3

  // 上传结果回调
  onImagesChange: (imageUrls: string[]) => void;

  // 可选配置
  effect?: VideoEffect | null;
  onPixverseImgIdChange?: (imgId: number | null) => void;

  // 用户认证
  isAuthenticated: boolean;
  onShowSignModal: () => void;

  // Generation type
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
  const t = useTranslations("video-generator");

  // 获取模型配置
  const modelConfig = getVideoModel(selectedModel);
  const imageLabels = modelConfig?.imageCapabilities?.labels;

  // 状态管理
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean[]>(
    Array(maxImages).fill(false)
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const supportsDualImages = maxImages >= 2;
  const isReferenceToVideo = generationType === "REFERENCE_2_VIDEO";

  // 当 maxImages 变化时，重置上传状态数组
  useEffect(() => {
    setIsUploadingImages(Array(maxImages).fill(false));
  }, [maxImages]);

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

        // 更新URL数组 - 使用函数式更新避免闭包问题
        setUploadedImageUrls((prev) => {
          const newUrls = [...prev];
          newUrls[index] = uploadResult.data.url;
          onImagesChange(newUrls);
          return newUrls;
        });

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
      onImagesChange,
      effect,
      onPixverseImgIdChange,
    ]
  );

  // 批量上传处理
  const handleMultipleImageUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!isAuthenticated) {
        onShowSignModal();
        return;
      }

      const remainingSlots = maxImages - uploadedImageUrls.length;
      if (remainingSlots <= 0) {
        toast.error(t("maxImagesError").replace("{max}", String(maxImages)));
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      // 如果选择的文件数超过可用槽位
      if (Array.from(files).length > remainingSlots) {
        toast.warning(
          t("onlyUploadingFirst")
            .replace("{count}", String(remainingSlots))
            .replace("{max}", String(maxImages))
        );
      }

      // 批量上传 - 使用固定的起始索引避免状态更新延迟问题
      const startIndex = uploadedImageUrls.length;
      for (let i = 0; i < filesToUpload.length; i++) {
        await handleImageUpload(filesToUpload[i], startIndex + i);
      }
    },
    [isAuthenticated, onShowSignModal, maxImages, uploadedImageUrls, t, handleImageUpload]
  );

  // 粘贴事件监听器 - 只在 reference-to-video 模式下启用
  useEffect(() => {
    if (!isReferenceToVideo) return;

    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      // 提取所有图片文件
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            // 重命名文件以包含时间戳
            const timestamp = new Date().getTime();
            const newFile = new File([file], `pasted-image-${timestamp}.png`, {
              type: file.type
            });
            imageFiles.push(newFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        await handleMultipleImageUpload(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isReferenceToVideo, handleMultipleImageUpload]);

  // 删除图片
  const removeImage = useCallback(
    (index: number) => {
      setUploadedImageUrls((prev) => {
        const newUrls = [...prev];
        newUrls.splice(index, 1);
        onImagesChange(newUrls);
        return newUrls;
      });

      if (index === 0 && onPixverseImgIdChange) {
        onPixverseImgIdChange(null);
      }
    },
    [onImagesChange, onPixverseImgIdChange]
  );

  // 交换首尾帧
  const swapImages = useCallback(() => {
    setUploadedImageUrls((prev) => {
      if (prev.length === 2) {
        const swapped = [prev[1], prev[0]];
        onImagesChange(swapped);
        return swapped;
      }
      return prev;
    });
  }, [onImagesChange]);

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
        // Reference-to-video 模式支持多文件上传
        if (isReferenceToVideo) {
          handleMultipleImageUpload(files);
        } else {
          // 其他模式只上传第一个文件
          handleImageUpload(files[0], 0);
        }
      }
    },
    [handleImageUpload, handleMultipleImageUpload, isReferenceToVideo]
  );

  // 单图预览（向后兼容）
  const imagePreview = uploadedImageUrls[0] || null;
  const isUploadingImage = isUploadingImages[0] || false;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white text-lg font-semibold">
          {t("uploadImage")}
          {isReferenceToVideo && (
            <span className="text-sm text-gray-400 ml-2">(1-3 reference images)</span>
          )}
          {!isReferenceToVideo && supportsDualImages && (
            <span className="text-sm text-gray-400 ml-2">(1-2 images)</span>
          )}
        </div>
        {!isReferenceToVideo && uploadedImageUrls.length === 2 && (
          <Button
            onClick={swapImages}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {t("swapFrames")}
          </Button>
        )}
      </div>

      {/* Reference-to-Video 单框多图布局 */}
      {isReferenceToVideo ? (
        <div>
          {/* 单个上传区域 */}
          {uploadedImageUrls.length < maxImages && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
                isUploadingImages.some(Boolean) ? "cursor-not-allowed" : "cursor-pointer"
              } ${
                isDragOver
                  ? "border-blue-400 bg-blue-900/50"
                  : "border-gray-600 hover:border-gray-500"
              }`}
              onDragOver={!isUploadingImages.some(Boolean) ? handleDragOver : undefined}
              onDragLeave={!isUploadingImages.some(Boolean) ? handleDragLeave : undefined}
              onDrop={!isUploadingImages.some(Boolean) ? handleDrop : undefined}
              onClick={() =>
                !isUploadingImages.some(Boolean) &&
                document.getElementById("ref-image-upload")?.click()
              }
            >
              {isUploadingImages.some(Boolean) ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm text-blue-300">Uploading image...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300 px-2 text-center">
                      {uploadedImageUrls.length === 0
                        ? t("referenceUploadGuide")
                        : `${t("addMoreReferences")} (${uploadedImageUrls.length}/3)`}
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
                    handleMultipleImageUpload(files);
                  }
                }}
                className="hidden"
                id="ref-image-upload"
              />
            </div>
          )}

          {/* 已上传图片列表 */}
          {uploadedImageUrls.length > 0 && (
            <div className="space-y-2">
              {uploadedImageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                  <img
                    src={url}
                    alt={`Reference ${index + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white">{t("referenceImage")} {index + 1}</p>
                    <p className="text-xs text-gray-400">{t("clickToUploadMore")}</p>
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : /* 多图上传布局 */
      supportsDualImages ? (
        <div className={`grid gap-4 ${maxImages === 2 ? 'grid-cols-2' : maxImages === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: maxImages }, (_, i) => i).map((index) => {
            const hasImage = uploadedImageUrls[index];
            const isUploading = isUploadingImages[index];

            return (
              <div key={index} className="relative">
                {/* 标签 */}
                <div className="absolute -top-2 left-2 z-10">
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                    {imageLabels?.[index] ||
                      (index === 0 ? t("firstFrame") : index === maxImages - 1 ? t("lastFrame") : `Image ${index + 1}`)}
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
                          {index === 0 ? t("uploadingFirstFrame") : t("uploadingLastFrame")}
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-300">{t("clickToUpload")}</p>
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
