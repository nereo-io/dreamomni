"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, ImageIcon, X } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import useCredits from "@/hooks/useCredits";
import { VideoSettings } from "../ai-video-generation-tool/video-settings";
import {
  VideoModelType,
  getTextToVideoModels,
  getImageToVideoModels,
  calculateCredits,
  getVideoModel,
} from "@/config/video-models";

// 生成参数接口
export interface VideoGenerationParams {
  model: string;
  prompt: string;
  duration: string;
  aspect_ratio: string;
  resolution: string;
  generate_audio: boolean;
  image_url?: string;
}

interface VideoGeneratorProps {
  // 核心配置
  mode: "text-to-video" | "image-to-video";
  onGenerate: (params: VideoGenerationParams) => Promise<void>;
  isGenerating: boolean;

  // 可选配置
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

type VideoAspectRatio = "16:9" | "9:16" | "1:1";
type VideoDuration = "5" | "8" | "10";
type VideoResolution = "480p" | "720p" | "1080p";

export default function VideoGenerator({
  mode,
  onGenerate,
  isGenerating,
  descriptionLabel,
  descriptionPlaceholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
}: VideoGeneratorProps) {
  const t = useTranslations("video-generator");

  // 使用翻译作为默认值
  const finalDescriptionLabel = descriptionLabel || t("videoDescription");

  // 组件内部状态管理
  const [description, setDescription] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState("5s");
  const [selectedResolution, setSelectedResolution] = useState("480p");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 其他内部状态
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(true);

  // Textarea 引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user, setShowSignModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();

  // 用户登录时获取积分
  useEffect(() => {
    if (user?.uuid) {
      updateLeftCredits().catch(console.error);
    }
  }, [user?.uuid, updateLeftCredits]);

  // 获取所有可用模型
  const availableModels =
    uploadedImage || selectedImage
      ? getImageToVideoModels()
      : getTextToVideoModels();

  // 获取选中模型的详细信息
  const selectedModelConfig = getVideoModel(selectedModel);

  // 初始化默认模型选择和模型智能切换
  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      setSelectedModel(availableModels[0].id);
    }
  }, [selectedModel, availableModels]);

  // 智能模型切换 - 图片上传时自动切换到图片转视频模型
  useEffect(() => {
    if (uploadedImage || selectedImage) {
      // 如果当前模型不支持图片输入，自动切换到图片转视频模型
      const imageToVideoModels = getImageToVideoModels();
      if (
        imageToVideoModels.length > 0 &&
        selectedModelConfig?.type !== VideoModelType.IMAGE_TO_VIDEO
      ) {
        setSelectedModel(imageToVideoModels[0].id);
      }
    } else {
      // 如果移除了图片，且当前是图片转视频模型，可以切换回文本转视频模型
      const textToVideoModels = getTextToVideoModels();
      if (
        textToVideoModels.length > 0 &&
        selectedModelConfig?.type === VideoModelType.IMAGE_TO_VIDEO
      ) {
        setSelectedModel(textToVideoModels[0].id);
      }
    }
  }, [uploadedImage, selectedImage, selectedModelConfig]);

  // 同步 selectedImage 和 imagePreview
  useEffect(() => {
    setImagePreview(selectedImage);
  }, [selectedImage]);

  // 获取积分消耗信息
  const getCreditsRequired = (
    modelId: string,
    duration: VideoDuration,
    hasAudio: boolean = false,
    resolution: VideoResolution
  ) => {
    return calculateCredits(modelId, parseInt(duration), hasAudio, resolution);
  };

  // 获取当前选择的积分消耗
  const currentCreditsRequired = getCreditsRequired(
    selectedModel,
    selectedDuration as VideoDuration,
    generateAudio,
    selectedResolution as VideoResolution
  );

  // 自动调整 textarea 高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 150;
      const maxHeight = 300;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // 处理文本变化
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
      // 延迟调整高度，确保内容已更新
      setTimeout(adjustTextareaHeight, 0);
    },
    [adjustTextareaHeight]
  );

  // 初始化 textarea 高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Handle image upload with enhanced validation
  const handleImageUpload = useCallback(
    async (file: File) => {
      // 基础文件类型验证
      if (!file.type.startsWith("image/")) {
        toast.error(t("toast.uploadImageFile"));
        return;
      }

      // 支持的格式验证
      const supportedFormats = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/gif",
      ];
      if (!supportedFormats.includes(file.type.toLowerCase())) {
        toast.error(
          "Unsupported image format. Please use JPEG, PNG, WEBP, BMP, TIFF, or GIF."
        );
        return;
      }

      // 文件大小验证
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(t("toast.imageTooLarge"));
        return;
      }

      // 图片尺寸和宽高比验证
      const img = new Image();
      const imageValidationPromise = new Promise<boolean>((resolve) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const aspectRatio = width / height;

          // 最小尺寸：300x300px
          if (width < 300 || height < 300) {
            toast.error("Image too small. Minimum size is 300x300 pixels.");
            resolve(false);
            return;
          }

          // 最大尺寸：6000x6000px
          if (width > 6000 || height > 6000) {
            toast.error("Image too large. Maximum size is 6000x6000 pixels.");
            resolve(false);
            return;
          }

          // 宽高比验证：0.4-2.5
          if (aspectRatio < 0.4 || aspectRatio > 2.5) {
            toast.error(
              "Invalid aspect ratio. Please use an image with aspect ratio between 0.4 and 2.5."
            );
            resolve(false);
            return;
          }

          resolve(true);
        };

        img.onerror = () => {
          toast.error("Invalid image file. Please select a valid image.");
          resolve(false);
        };
      });

      const url = URL.createObjectURL(file);
      img.src = url;

      const isValid = await imageValidationPromise;
      URL.revokeObjectURL(url);

      if (!isValid) {
        return;
      }

      setUploadedImage(file);

      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);

      toast.success(t("toast.imageUploaded"));
    },
    [t]
  );

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 处理生成按钮点击
  const handleGenerate = async () => {
    // 验证用户登录
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    // 验证描述内容
    if (!description.trim()) {
      toast.error(t("toast.emptyPrompt"));
      return;
    }

    // 验证图片转视频模式下必须上传图片
    if (mode === "image-to-video" && !uploadedImage) {
      toast.error(t("toast.uploadImageRequired"));
      return;
    }

    // 验证积分余额
    if (leftCredits !== null && leftCredits < currentCreditsRequired) {
      toast.error(t("toast.insufficientCredits"));
      return;
    }

    // 准备图片URL
    let imageUrl: string | undefined;

    if (uploadedImage && (mode === "image-to-video" || selectedImage)) {
      // 上传图片到服务器
      const formData = new FormData();
      formData.append("file", uploadedImage);

      try {
        setIsSubmitting(true);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.code !== 0) {
          throw new Error(uploadResult.message || "Image upload failed");
        }

        imageUrl = uploadResult.data.url;
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again."
        );
        setIsSubmitting(false);
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    // 准备生成参数
    const params: VideoGenerationParams = {
      model: selectedModel,
      prompt: description.trim(),
      duration: selectedDuration.replace("s", ""),
      aspect_ratio: selectedRatio,
      resolution: selectedResolution,
      generate_audio: generateAudio,
      image_url: imageUrl,
    };

    // 调用生成回调
    await onGenerate(params);
  };

  // 拖拽处理
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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl shadow-lg p-6 video-generator-container">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-white text-xl font-semibold">
            AI Video Generator
          </h2>
        </div>

        {/* Description Input */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">
            {finalDescriptionLabel}
          </h2>
          <Textarea
            ref={textareaRef}
            value={description}
            onChange={handleDescriptionChange}
            placeholder={descriptionPlaceholder}
            className="resize-none bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400 mt-0 overflow-y-auto"
            style={{ minHeight: "150px", maxHeight: "300px" }}
            disabled={isGenerating}
          />
        </div>

        {/* Image Upload Section (for image-to-video mode) */}
        {mode === "image-to-video" && (
          <div>
            <h2 className="text-white text-lg font-semibold mb-4">
              {t("uploadImage")}
            </h2>
            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-blue-400 bg-blue-900/50"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    {t("dragAndDropImage")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("supportedFormats")}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
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
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Model Selection */}
        <VideoSettings
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          selectedRatio={selectedRatio}
          setSelectedRatio={setSelectedRatio}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          selectedResolution={selectedResolution}
          setSelectedResolution={setSelectedResolution}
          generateAudio={generateAudio}
          hasImage={!!(uploadedImage || selectedImage)}
        />

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            isSubmitting ||
            !description.trim() ||
            !selectedModel ||
            (mode === "image-to-video" && !uploadedImage) ||
            (leftCredits !== null && leftCredits < currentCreditsRequired)
          }
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isGenerating || isSubmitting ? (
            <>
              <Play className="mr-2 h-4 w-4 animate-spin" />
              {isSubmitting ? t("uploading") : t("generating")}
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t("generateVideo")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
