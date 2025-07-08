"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, ImageIcon, X } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import useCredits from "@/hooks/useCredits";
import {
  VideoModelType,
  getTextToVideoModels,
  getImageToVideoModels,
  calculateCredits,
  getVideoModel,
} from "@/config/video-models";
import { VideoSettings } from "../ai-video-generation-tool/video-settings";

interface VideoGeneratorProps {
  // 通用属性
  description: string;
  setDescription: (value: string) => void;
  isGenerating: boolean;
  selectedRatio: string;
  setSelectedRatio: (ratio: string) => void;
  selectedDuration: string;
  setSelectedDuration: (duration: string) => void;
  selectedResolution: string;
  setSelectedResolution: (resolution: string) => void;
  onGenerate: () => void;

  // 条件属性
  mode: "text-to-video" | "image-to-video";

  // 图片相关属性（仅在 image-to-video 模式下使用）
  selectedImage?: string | null;
  setSelectedImage?: (image: string | null) => void;
  onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // 描述字段标签
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

type VideoAspectRatio = "16:9" | "9:16" | "1:1";
type VideoDuration = "5" | "8" | "10";
type VideoResolution = "480p" | "720p" | "1080p";

export default function VideoGenerator({
  description,
  setDescription,
  isGenerating,
  selectedRatio,
  setSelectedRatio,
  selectedDuration,
  setSelectedDuration,
  selectedResolution,
  setSelectedResolution,
  onGenerate,
  mode,
  selectedImage,
  setSelectedImage,
  onImageUpload,
  descriptionLabel = "Video Description",
  descriptionPlaceholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
}: VideoGeneratorProps) {
  const t = useTranslations("video-generator");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    selectedImage || null
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(true);

  const { user, setShowSignModal } = useAppContext();
  const { submitGeneration, pollStatus, updateCurrentGeneration } =
    useVideoGeneration();

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
      if (imageToVideoModels.length > 0 && !selectedModelConfig?.type?.includes('IMAGE_TO_VIDEO')) {
        setSelectedModel(imageToVideoModels[0].id);
      }
    } else {
      // 如果移除了图片，且当前是图片转视频模型，可以切换回文本转视频模型
      const textToVideoModels = getTextToVideoModels();
      if (textToVideoModels.length > 0 && selectedModelConfig?.type?.includes('IMAGE_TO_VIDEO')) {
        setSelectedModel(textToVideoModels[0].id);
      }
    }
  }, [uploadedImage, selectedImage, selectedModelConfig]);

  // 获取积分消耗信息
  const getCreditsRequired = (
    modelId: string,
    duration: VideoDuration,
    hasAudio: boolean = false,
    resolution: VideoResolution = "1080p"
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

      // 创建临时URL用于Image对象加载
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // 等待验证完成
      const isValid = await imageValidationPromise;

      // 清理临时URL
      URL.revokeObjectURL(objectUrl);

      if (!isValid) {
        return;
      }

      // 验证通过，设置上传的图片
      setUploadedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setImagePreview(preview);
        if (setSelectedImage) {
          setSelectedImage(preview);
        }
      };
      reader.readAsDataURL(file);
    },
    [t, setSelectedImage]
  );

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleImageUpload(files[0]);
      }
    },
    [handleImageUpload]
  );

  // Handle click upload
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    if (onImageUpload) {
      onImageUpload(e);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (setSelectedImage) {
      setSelectedImage(null);
    }
  };

  // Handle video generation
  const handleGenerate = async () => {
    if (!user?.uuid) {
      toast.message(t("toast.signInFirst"));
      setShowSignModal(true);
      return;
    }

    if (!description?.trim()) {
      toast.error(t("toast.enterDescription"));
      return;
    }

    // 检查prompt最少字符数限制
    if ((description?.trim().length || 0) < 10) {
      toast.error(t("toast.descriptionTooShort"));
      return;
    }

    // 检查是否选择了模型
    if (!selectedModel) {
      toast.error("Please select a video model");
      return;
    }

    // 检查积分是否足够
    if (leftCredits !== null && leftCredits < currentCreditsRequired) {
      toast.error(
        t("toast.insufficientCredits", {
          required: currentCreditsRequired,
          available: leftCredits,
        })
      );
      return;
    }

    // 立即设置提交状态，防止重复点击
    setIsSubmitting(true);

    // 立即设置一个初始生成状态，给用户即时反馈
    const initialGeneration = {
      id: `temp-${Date.now()}`,
      requestId: `temp-request-${Date.now()}`,
      model: selectedModel,
      status: "submitted",
      prompt: description?.trim() || "",
      optimized_prompt: undefined,
      video_url: undefined,
      error_message: undefined,
      created_at: new Date().toISOString(),
      aspect_ratio: selectedRatio,
      duration_seconds: parseInt(selectedDuration.replace('s', '')),
    };

    updateCurrentGeneration({
      ...initialGeneration,
    });

    try {
      let imageUrl = null;

      // Upload image first if exists
      if (uploadedImage) {
        try {
          const formData = new FormData();
          formData.append("file", uploadedImage);

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Image upload failed");
          }

          const uploadResult = await uploadResponse.json();
          if (uploadResult.code === 0) {
            imageUrl = uploadResult.data.url;
          } else {
            throw new Error(uploadResult.message || "Image upload failed");
          }
        } catch (error) {
          console.error("Image upload error:", error);
          toast.error(t("toast.imageUploadFailed"));
          return;
        }
      }

      // Prepare generation parameters
      const generationParams = {
        model: selectedModel,
        prompt: description?.trim() || "",
        duration: selectedDuration.replace('s', ''), // 保持字符串格式
        aspect_ratio: selectedRatio,
        resolution: selectedResolution,
        generate_audio: generateAudio,
        ...(imageUrl && { image_url: imageUrl }),
      };

      console.log("Generation parameters:", generationParams);

      // Submit generation
      const result = await submitGeneration(generationParams);

      if (result) {
        // Start polling for status
        pollStatus(result.id);
        // 刷新积分余额
        updateLeftCredits().catch(console.error);
      }
    } finally {
      setIsSubmitting(false);
    }

    // 调用父组件的 onGenerate
    onGenerate();
  };

  const canGenerate =
    mode === "text-to-video"
      ? description?.trim()
      : selectedImage || imagePreview;

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      {/* Video Description */}
      <div>
        <h2 className="text-white text-lg font-semibold mb-3">
          {descriptionLabel}
        </h2>
        <Textarea
          value={description || ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={descriptionPlaceholder}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[100px] resize-none"
        />
        <div className="text-orange-400 text-sm mt-2">
          {description?.length || 0}/10 characters minimum
        </div>
      </div>

      {/* Reference Image - 仅在 image-to-video 模式下显示 */}
      {mode === "image-to-video" && (
        <div>
          <h2 className="text-white text-lg font-semibold mb-3">
            Reference Image
          </h2>
          <div
            className={`border-2 border-dashed border-gray-600 rounded-lg p-6 text-center ${
              isDragOver ? "border-blue-400 bg-blue-950/20" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Uploaded reference"
                  className="w-full h-32 object-cover rounded-lg mx-auto"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  onClick={removeImage}
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <ImageIcon className="h-10 w-10 text-gray-500 mx-auto" />
                <div>
                  <p className="text-gray-300 mb-1">
                    Click to upload or drag image here
                  </p>
                  <p className="text-gray-500 text-sm">
                    Supports JPG, PNG, GIF formats, max 10MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors inline-block"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      <VideoSettings
        selectedRatio={selectedRatio}
        setSelectedRatio={setSelectedRatio}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedResolution={selectedResolution}
        setSelectedResolution={setSelectedResolution}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        hasImage={!!(uploadedImage || selectedImage)}
        generateAudio={generateAudio}
      />

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating || isSubmitting}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
      >
        {isGenerating || isSubmitting ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Generating...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>Generate Video</span>
          </div>
        )}
      </Button>
    </div>
  );
}
