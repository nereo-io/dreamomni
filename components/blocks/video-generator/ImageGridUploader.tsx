"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { validateImage } from "@/config/image-validation-rules";
import { uploadImageToR2 } from "@/lib/upload-utils";
import { ImageSelectionModal, type SelectedImage } from "./ImageSelectionModal";

interface ImageGridUploaderProps {
  maxImages?: number; // 默认 3，支持配置为 5 等
  selectedModel: string;
  onImagesChange: (
    imageUrls: (string | null)[],
    sourceImageIds?: (string | null)[]
  ) => void;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
  initialImages?: string[]; // 初始图片列表 (用于 Re-edit)
}

interface ImageItem {
  url: string;
  sourceId?: string; // 来源图片ID（如果是从 My Creations 选择的）
}

export function ImageGridUploader({
  maxImages = 3,
  selectedModel,
  onImagesChange,
  isAuthenticated,
  onShowSignModal,
  initialImages,
}: ImageGridUploaderProps) {
  const t = useTranslations("video-generator");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状态管理 - 改为存储完整的图片信息（URL + 来源ID）
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);

  // 向后兼容：提供简单的 images 数组用于现有逻辑
  const images = imageItems.map(item => item.url);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 初始化图片列表 (用于 Re-edit 功能)
  useEffect(() => {
    if (initialImages === undefined) {
      return;
    }

    setImageItems(prevItems => {
      const currentImages = prevItems.map(item => item.url);
      const isSameLength = initialImages.length === currentImages.length;
      const isSameContent =
        isSameLength &&
        initialImages.every((url, index) => url === currentImages[index]);

      if (isSameContent) {
        return prevItems;
      }

      return initialImages.map(url => ({ url }));
    });
  }, [initialImages]);

  // 上传单个文件（使用统一的上传工具）
  const uploadFile = async (file: File): Promise<string | null> => {
    const validationResult = await validateImage(file, selectedModel);
    if (!validationResult.valid) {
      toast.error(validationResult.error || "Invalid image file.");
      return null;
    }

    try {
      return await uploadImageToR2(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  // 批量上传处理
  const handleFilesUpload = useCallback(
    async (files: File[]) => {
      if (!isAuthenticated) {
        onShowSignModal();
        return;
      }

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const filesToUpload = files.slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        toast.warning(`Only uploading first ${remainingSlots} images`);
      }

      setIsUploading(true);
      setUploadProgress({ current: 0, total: filesToUpload.length });

      const uploadedUrls: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress({ current: i + 1, total: filesToUpload.length });
        const url = await uploadFile(filesToUpload[i]);
        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        // 上传的图片没有 sourceId
        const newItems: ImageItem[] = uploadedUrls.map(url => ({ url }));
        const allItems = [...imageItems, ...newItems];
        setImageItems(allItems);

        // 通知父组件
        const urls = allItems.map(item => item.url);
        const sourceIds = allItems.map(item => item.sourceId).filter(Boolean) as string[];
        onImagesChange(urls, sourceIds);
      }

      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    },
    [imageItems, isAuthenticated, onShowSignModal, onImagesChange, maxImages]
  );

  // 文件选择处理
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFilesUpload(Array.from(files));
      }
      // 重置 input 值，允许重复选择同一文件
      e.target.value = "";
    },
    [handleFilesUpload]
  );

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

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length > 0) {
        handleFilesUpload(files);
      }
    },
    [handleFilesUpload]
  );

  // 粘贴事件处理
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFilesUpload(imageFiles);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFilesUpload]);

  // 删除图片
  const removeImage = useCallback(
    (index: number) => {
      const newItems = imageItems.filter((_, i) => i !== index);
      setImageItems(newItems);

      const urls = newItems.map(item => item.url);
      const sourceIds = newItems.map(item => item.sourceId).filter(Boolean) as string[];
      onImagesChange(urls, sourceIds);
    },
    [imageItems, onImagesChange]
  );

  // 点击上传区域
  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止事件冒泡

    if (!isUploading && images.length < maxImages && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 从 My Creations 选择图片
  const handleSelectFromCreations = useCallback(
    (selections: SelectedImage[]) => {
      if (selections.length === 0) return;

      const remainingSlots = maxImages - images.length;
      const toAdd = selections.slice(0, remainingSlots);

      if (selections.length > remainingSlots) {
        toast.warning(`Only adding first ${remainingSlots} images`);
      }

      // 从 My Creations 选择的图片包含来源 ID
      const newItems: ImageItem[] = toAdd.map(s => ({ url: s.url, sourceId: s.id }));
      const allItems = [...imageItems, ...newItems];
      setImageItems(allItems);

      // 通知父组件
      const urls = allItems.map(item => item.url);
      const sourceIds = allItems.map(item => item.sourceId).filter(Boolean) as string[];

      console.log('[ImageGridUploader] Selected from My Creations:', {
        selections: toAdd.map(s => ({ id: s.id, url: s.url.substring(0, 50) + '...' })),
        urls: urls.map(u => u.substring(0, 50) + '...'),
        sourceIds,
      });

      onImagesChange(urls, sourceIds);
    },
    [imageItems, maxImages, onImagesChange]
  );

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-white">
          {t("uploadImage")}
        </span>
      </div>

      {/* 上传区域 - 只在还能上传时显示 */}
      {images.length < maxImages && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg py-5 px-4
            transition-all cursor-pointer
            ${
              isDragOver
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-600 hover:border-gray-500 bg-gray-900/50"
            }
            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
              <p className="text-sm text-blue-400">
                Uploading {uploadProgress.current}/{uploadProgress.total}...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Upload className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text text-gray-300">
                  {images.length === 0
                    ? t("uploadMultipleImages", { max: maxImages })
                    : t("uploadMoreImagesRemaining", {
                        remaining: maxImages - images.length,
                      })}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span>{t("multipleUploadHint")}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      onShowSignModal();
                    } else {
                      setIsModalOpen(true);
                    }
                  }}
                  className="text-gray-500 underline text-sm hover:text-blue-400"
                >
                  {t("selectFromCreations")}
                </button>
              </div>
            </div>
          )}

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            id="reference-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}

      {/* 已上传的图片网格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="relative">
              <img
                src={url}
                alt={`Reference ${index + 1}`}
                className="w-full h-24 object-contain rounded-lg bg-gray-800"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Selection Modal */}
      <ImageSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromCreations}
        maxSelection={maxImages}
        currentCount={images.length}
      />
    </div>
  );
}
