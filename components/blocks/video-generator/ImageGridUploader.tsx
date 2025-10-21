"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { validateImage } from "@/config/image-validation-rules";

interface ImageGridUploaderProps {
  maxImages?: number; // 默认 3，支持配置为 5 等
  selectedModel: string;
  onImagesChange: (imageUrls: string[]) => void;
  isAuthenticated: boolean;
  onShowSignModal: () => void;
}

export function ImageGridUploader({
  maxImages = 3,
  selectedModel,
  onImagesChange,
  isAuthenticated,
  onShowSignModal,
}: ImageGridUploaderProps) {
  const t = useTranslations("video-generator");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // 上传单个文件
  const uploadFile = async (file: File): Promise<string | null> => {
    const validationResult = await validateImage(file, selectedModel);
    if (!validationResult.valid) {
      toast.error(validationResult.error || "Invalid image file.");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || "Upload failed");
      }

      return result.data.url;
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
        const newImages = [...images, ...uploadedUrls];
        setImages(newImages);
        onImagesChange(newImages);
      }

      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    },
    [images, isAuthenticated, onShowSignModal, onImagesChange, maxImages]
  );

  // 文件选择处理
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFilesUpload(Array.from(files));
      }
      // 重置 input 值，允许重复选择同一文件
      e.target.value = '';
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

      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
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
        if (item.type.startsWith('image')) {
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

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleFilesUpload]);

  // 删除图片
  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  // 点击上传区域
  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止事件冒泡

    if (!isUploading && images.length < maxImages && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {t("uploadImage")}
        </h3>
      </div>

      {/* 上传区域 - 只在还能上传时显示 */}
      {images.length < maxImages && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-all cursor-pointer
            ${isDragOver
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
              <p className="text-sm text-blue-400">
                Uploading {uploadProgress.current}/{uploadProgress.total}...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-300 mb-2">
                {images.length === 0
                  ? `Upload 1-${maxImages} images`
                  : `Upload more images (${maxImages - images.length} remaining)`
                }
              </p>
              <p className="text-xs text-gray-500">
                {t("multipleUploadHint")}
              </p>
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
        <div className="grid grid-cols-2 gap-4">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="relative">
              <img
                src={url}
                alt={`Reference ${index + 1}`}
                className="w-full h-32 object-contain rounded-lg bg-gray-800"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}