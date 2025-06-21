"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon, X, Play, Coins } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import useCredits from "@/hooks/useCredits";
import VideoResult from "@/components/blocks/video-result";
import {
  VideoModelType,
  VideoModelConfig,
  getTextToVideoModels,
  getImageToVideoModels,
  calculateCredits,
  getVideoModel,
} from "@/config/video-models";

interface VideoGeneratorProps {
  placeholder?: string;
}

type VideoAspectRatio = "16:9" | "9:16" | "1:1";
type VideoDuration = "5" | "8" | "10";
type VideoResolution = "480p" | "720p" | "1080p";

export default function VideoGenerator({
  placeholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
}: VideoGeneratorProps) {
  const t = useTranslations("video-generator");
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [duration, setDuration] = useState<VideoDuration>("5");
  const [resolution, setResolution] = useState<VideoResolution>("480p");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(true);

  const { user, setShowSignModal } = useAppContext();
  const {
    isLoading,
    currentGeneration,
    recentGenerations,
    submitGeneration,
    pollStatus,
    clearCurrentGeneration,
    updateCurrentGeneration,
  } = useVideoGeneration();

  const { leftCredits, updateLeftCredits } = useCredits();

  // 用户登录时获取积分
  useEffect(() => {
    if (user?.uuid) {
      updateLeftCredits().catch(console.error);
    }
  }, [user?.uuid, updateLeftCredits]);

  // 获取所有可用模型（不再进行复杂过滤）
  const availableModels = uploadedImage
    ? getImageToVideoModels()
    : getTextToVideoModels();

  // 获取选中模型的详细信息
  const selectedModelConfig = getVideoModel(selectedModel);

  // 初始化默认模型选择 - 选择第一个可用模型
  useEffect(() => {
    if (!selectedModel && availableModels.length > 0) {
      setSelectedModel(availableModels[0].id);
    }
  }, [selectedModel, availableModels]);

  // 增强的智能设置联动 - 模型切换时自动调整设置
  useEffect(() => {
    if (selectedModelConfig) {
      // 1. 检查比例兼容性
      if (!selectedModelConfig.supportedAspectRatios?.includes(aspectRatio)) {
        const firstSupportedRatio = selectedModelConfig
          .supportedAspectRatios?.[0] as VideoAspectRatio;
        if (firstSupportedRatio) {
          setAspectRatio(firstSupportedRatio);
        }
      }

      // 2. 检查时长兼容性
      if (
        !selectedModelConfig.supportedDurations?.includes(parseInt(duration))
      ) {
        const firstSupportedDuration =
          selectedModelConfig.supportedDurations?.[0];
        if (firstSupportedDuration) {
          setDuration(firstSupportedDuration.toString() as VideoDuration);
        }
      }

      // 3. 检查分辨率兼容性 - 总是设置为模型的第一个支持分辨率
      if (
        selectedModelConfig.supportedResolutions &&
        selectedModelConfig.supportedResolutions.length > 0
      ) {
        const firstSupportedResolution = selectedModelConfig
          .supportedResolutions[0] as VideoResolution;
        setResolution(firstSupportedResolution);
      }

      // 4. 检查音频兼容性
      if (selectedModelConfig.supportsAudio) {
        // 如果模型支持音频，默认开启
        setGenerateAudio(true);
      } else if (generateAudio && !selectedModelConfig.supportsAudio) {
        // 如果模型不支持音频且当前开启了音频，则关闭
        setGenerateAudio(false);
      }

      // 5. 图片兼容性检查已移到独立的 useEffect 中处理
    }
  }, [selectedModel, selectedModelConfig]);

  // 智能模型切换 - 图片上传时自动切换到图片转视频模型
  useEffect(() => {
    if (uploadedImage) {
      // 如果当前模型不支持图片输入，自动切换到图片转视频模型
      if (selectedModelConfig?.type === VideoModelType.TEXT_TO_VIDEO) {
        const imageToVideoModels = getImageToVideoModels();
        if (imageToVideoModels.length > 0) {
          // 尝试找到相同provider的图片转视频模型
          const sameProviderModel = imageToVideoModels.find(
            (model) => model.provider === selectedModelConfig.provider
          );
          const targetModel = sameProviderModel || imageToVideoModels[0];

          setSelectedModel(targetModel.id);
        }
      }
    } else {
      // 如果移除了图片，且当前是图片转视频模型，可以切换回文本转视频模型
      if (selectedModelConfig?.type === VideoModelType.IMAGE_TO_VIDEO) {
        const textToVideoModels = getTextToVideoModels();
        if (textToVideoModels.length > 0) {
          // 尝试找到相同provider的文本转视频模型
          const sameProviderModel = textToVideoModels.find(
            (model) => model.provider === selectedModelConfig.provider
          );
          const targetModel = sameProviderModel || textToVideoModels[0];

          setSelectedModel(targetModel.id);
        }
      }
    }
  }, [uploadedImage, selectedModelConfig]);

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
    duration,
    generateAudio,
    resolution
  );

  // Handle image upload with enhanced validation
  const handleImageUpload = useCallback(
    async (file: File) => {
      // 1. 基础文件类型验证
      if (!file.type.startsWith("image/")) {
        toast.error(t("toast.uploadImageFile"));
        return;
      }

      // 2. 支持的格式验证：JPEG, PNG, WEBP, BMP, TIFF, GIF
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

      // 3. 文件大小验证
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(t("toast.imageTooLarge"));
        return;
      }

      // 4. 图片尺寸和宽高比验证
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

      // 5. 验证通过，设置上传的图片
      setUploadedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [t]
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
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  // Handle video generation
  const handleGenerate = async () => {
    if (!user?.uuid) {
      toast.message(t("toast.signInFirst"));
      setShowSignModal(true);
      return;
    }

    if (!description.trim()) {
      toast.error(t("toast.enterDescription"));
      return;
    }

    // 检查prompt最少字符数限制
    if (description.trim().length < 10) {
      toast.error(t("toast.descriptionTooShort"));
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
      id: `temp-${Date.now()}`, // 临时ID
      requestId: `temp-request-${Date.now()}`, // 临时requestId
      model: selectedModel,
      status: "submitted",
      prompt: description.trim(),
      optimized_prompt: undefined, // 初始没有优化prompt
      video_url: undefined,
      error_message: undefined,
      created_at: new Date().toISOString(),
      aspect_ratio: aspectRatio,
      duration_seconds: parseInt(duration),
    };

    // 历史记录管理将在 submitGeneration 内部处理

    // 直接设置完整的初始状态，而不是部分更新
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
        prompt: description.trim(),
        duration,
        aspect_ratio: aspectRatio,
        resolution,
        generate_audio: generateAudio,
        ...(imageUrl && { image_url: imageUrl }),
      };

      console.log("Generation parameters:", generationParams);

      // Submit generation
      const result = await submitGeneration(generationParams);

      if (result) {
        // submitGeneration内部已经设置了currentGeneration，所以直接开始轮询
        // Start polling for status
        pollStatus(result.id);
        // 刷新积分余额
        updateLeftCredits().catch(console.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    if (currentGeneration?.id) {
      pollStatus(currentGeneration.id);
    } else {
      // 否则重新生成
      handleGenerate();
    }
  };

  return (
    <section id="video-generator" className="py-8 md:py-12">
      <div className="container px-4 md:px-6 max-w-5xl">
        {/* Main content card with modern gradient theme */}
        <Card className="bg-gradient-to-br from-gray-900 via-blue-950/30 to-gray-900 backdrop-blur-xl border border-gray-700/50 shadow-2xl shadow-blue-950/20 rounded-xl p-6 md:p-8">
          {/* Two-column layout for desktop, single column for mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Description */}
              <div className="space-y-3">
                <Label className="text-xl font-semibold text-gray-50">
                  {t("videoDescription")}
                </Label>
                <div className="relative">
                  <TextareaAutosize
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    minRows={4}
                    maxRows={8}
                    placeholder={placeholder}
                    className="w-full p-4 border border-gray-600/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-gray-100 bg-gray-800/50 backdrop-blur-sm placeholder-gray-400"
                  />
                </div>
                {/* Character counter */}
                {description.trim().length < 10 && (
                  <div className="flex justify-end items-center text-sm">
                    <span
                      className={cn(
                        "transition-colors text-sm",
                        description.trim().length < 10
                          ? "text-orange-400"
                          : "text-gray-400"
                      )}
                    >
                      {description.trim().length}/10 {t("characterCount")}
                    </span>
                  </div>
                )}
              </div>

              {/* Reference Image (Optional) */}
              <div className="space-y-3">
                <Label className="text-xl font-semibold text-gray-50">
                  {t("referenceImage")}
                </Label>

                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer group",
                    isDragOver
                      ? "border-blue-400/60 bg-blue-950/20"
                      : "border-gray-600/50 hover:border-gray-500/70 hover:bg-gray-800/20",
                    uploadedImage
                      ? "border-solid border-gray-600/50 bg-gray-800/20"
                      : ""
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (!uploadedImage) {
                      document.getElementById("image-upload")?.click();
                    }
                  }}
                >
                  {imagePreview ? (
                    <div className="relative flex justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-32 max-w-full object-contain rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-gray-800/90 rounded-full hover:bg-gray-700 transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-200" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 group-hover:text-gray-300 transition-colors" />
                      <p className="text-gray-200 font-medium mb-1">
                        {t("uploadInstructions.clickToUpload")}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t("uploadInstructions.supportedFormats")}
                      </p>
                    </div>
                  )}

                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Parameters Panel (1/3 width) */}
            <div className="space-y-6">
              {/* 统一的视频配置面板 - 互联网产品风格 */}
              <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
                <Label className="text-lg font-semibold text-gray-50 mb-4 block">
                  Video Settings
                </Label>

                {/* Video Model Selection - 移动到这里作为第一个设置项 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-300 mb-3">Video Model</div>
                  <Select
                    value={selectedModel}
                    onValueChange={(value) => setSelectedModel(value)}
                  >
                    <SelectTrigger className="w-full text-left">
                      <SelectValue placeholder={t("selectModel")}>
                        {selectedModelConfig && (
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                selectedModelConfig.id.includes("kling")
                                  ? "/imgs/intro/kling.svg"
                                  : selectedModelConfig.id.includes("veo")
                                  ? "/imgs/intro/veo.svg"
                                  : "/imgs/intro/seedance.png"
                              }
                              alt={selectedModelConfig.provider}
                              className="w-4 h-4 flex-shrink-0"
                            />
                            <span className="font-medium">
                              {selectedModelConfig.displayName}
                            </span>
                            {/* <div className="flex items-center gap-1 text-xs text-blue-300">
                              <Coins className="h-3 w-3" />
                              {selectedModelConfig.perSecondCredits}/s
                            </div> */}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-start gap-3 w-full py-1">
                            <img
                              src={
                                model.id.includes("kling")
                                  ? "/imgs/intro/kling.svg"
                                  : model.id.includes("veo")
                                  ? "/imgs/intro/veo.svg"
                                  : "/imgs/intro/seedance.png"
                              }
                              alt={model.provider}
                              className="w-5 h-5 flex-shrink-0 mt-0.5"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-100">
                                  {model.displayName}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-blue-300">
                                  <Coins className="h-3 w-3" />
                                  {model.perSecondCredits}/s
                                </div>
                              </div>

                              {/* 默认显示的描述 */}
                              <span className="text-xs text-gray-400 mb-1 line-clamp-2">
                                {model.description}
                              </span>

                              {/* 默认显示的特性标签 */}
                              {model.features && (
                                <div className="flex flex-wrap gap-1">
                                  {model.features.map((feature, index) => (
                                    <span
                                      key={index}
                                      className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 比例选择 - 扩大点击区域 */}
                {/* 当只支持 adaptive 时隐藏比例选择 */}
                {!(
                  selectedModelConfig?.supportedAspectRatios?.length === 1 &&
                  selectedModelConfig?.supportedAspectRatios?.includes(
                    "adaptive"
                  )
                ) && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-300 mb-3">Ratio</div>
                    <RadioGroup
                      value={aspectRatio}
                      onValueChange={(value) =>
                        setAspectRatio(value as VideoAspectRatio)
                      }
                      className="flex flex-wrap gap-6"
                    >
                      {selectedModelConfig?.supportedAspectRatios?.includes(
                        "16:9"
                      ) && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="16:9"
                            id="landscape"
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor="landscape"
                            className="text-sm text-gray-200 cursor-pointer flex items-center gap-1 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-2 bg-gray-600 rounded-sm"></span>
                            16:9
                          </Label>
                        </div>
                      )}
                      {selectedModelConfig?.supportedAspectRatios?.includes(
                        "9:16"
                      ) && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="9:16"
                            id="portrait"
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor="portrait"
                            className="text-sm text-gray-200 cursor-pointer flex items-center gap-1 hover:text-white transition-colors"
                          >
                            <span className="w-2 h-4 bg-gray-600 rounded-sm"></span>
                            9:16
                          </Label>
                        </div>
                      )}
                      {selectedModelConfig?.supportedAspectRatios?.includes(
                        "1:1"
                      ) && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="1:1"
                            id="square"
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor="square"
                            className="text-sm text-gray-200 cursor-pointer flex items-center gap-1 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 bg-gray-600 rounded-sm"></span>
                            1:1
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                )}

                {/* 时长选择 - 扩大点击区域 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-300 mb-3">Duration</div>
                  <RadioGroup
                    value={duration}
                    onValueChange={(value) =>
                      setDuration(value as VideoDuration)
                    }
                    className="flex gap-8"
                  >
                    {selectedModelConfig?.supportedDurations?.includes(5) && (
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value="5"
                          id="duration-5s"
                          className="w-4 h-4"
                        />
                        <Label
                          htmlFor="duration-5s"
                          className="text-sm text-gray-200 cursor-pointer hover:text-white transition-colors"
                        >
                          5s
                        </Label>
                      </div>
                    )}
                    {selectedModelConfig?.supportedDurations?.includes(8) && (
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value="8"
                          id="duration-8s"
                          className="w-4 h-4"
                        />
                        <Label
                          htmlFor="duration-8s"
                          className="text-sm text-gray-200 cursor-pointer hover:text-white transition-colors"
                        >
                          8s
                        </Label>
                      </div>
                    )}
                    {selectedModelConfig?.supportedDurations?.includes(10) && (
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value="10"
                          id="duration-10s"
                          className="w-4 h-4"
                        />
                        <Label
                          htmlFor="duration-10s"
                          className="text-sm text-gray-200 cursor-pointer hover:text-white transition-colors"
                        >
                          10s
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>

                {/* 分辨率选择 - 只在支持时显示 */}
                {selectedModelConfig?.supportedResolutions &&
                  selectedModelConfig.supportedResolutions.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-300 mb-3">
                        Resolution
                      </div>
                      <RadioGroup
                        value={resolution}
                        onValueChange={(value) =>
                          setResolution(value as VideoResolution)
                        }
                        className="flex gap-8"
                      >
                        {selectedModelConfig.supportedResolutions.includes(
                          "480p"
                        ) && (
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem
                              value="480p"
                              id="resolution-480p"
                              className="w-4 h-4"
                            />
                            <Label
                              htmlFor="resolution-480p"
                              className="text-sm text-gray-200 cursor-pointer hover:text-white transition-colors"
                            >
                              480p
                            </Label>
                          </div>
                        )}
                        {selectedModelConfig.supportedResolutions.includes(
                          "720p"
                        ) && (
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem
                              value="720p"
                              id="resolution-720p"
                              className="w-4 h-4"
                            />
                            <Label
                              htmlFor="resolution-720p"
                              className="text-sm text-gray-200 cursor-pointer hover:text-white transition-colors"
                            >
                              720p
                            </Label>
                          </div>
                        )}
                        {selectedModelConfig.supportedResolutions.includes(
                          "1080p"
                        ) && (
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem
                              value="1080p"
                              id="resolution-1080p"
                              className="w-4 h-4"
                            />
                            <Label
                              htmlFor="resolution-1080p"
                              className="text-sm text-gray-200 cursor-pointer hover:text-white transition-colors"
                            >
                              1080p
                            </Label>
                          </div>
                        )}
                      </RadioGroup>
                    </div>
                  )}

                {/* 音频选择 - 只在支持时显示 */}
                {selectedModelConfig?.supportsAudio && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">Audio</div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={generateAudio}
                          className="data-[state=unchecked]:bg-gray-600/50 data-[state=unchecked]:border-gray-500/30 border"
                          onCheckedChange={(checked) => {
                            setGenerateAudio(checked);
                            // 如果开启音频，需要确保满足 VEO3 的所有要求
                            if (checked) {
                              // VEO3 只支持文本到视频，移除图片
                              if (uploadedImage) {
                                setUploadedImage(null);
                                setImagePreview(null);
                              }

                              // VEO3 只支持 16:9 宽高比
                              if (aspectRatio !== "16:9") {
                                setAspectRatio("16:9");
                              }

                              // VEO3 只支持 8 秒时长
                              if (duration !== "8") {
                                setDuration("8");
                              }

                              // 切换到 VEO3 模型
                              const veo3Models = getTextToVideoModels().filter(
                                (model) => model.supportsAudio
                              );
                              if (veo3Models.length > 0) {
                                setSelectedModel(veo3Models[0].id);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Credits & Generate Button */}
              <div className="bg-gradient-to-br from-blue-950/30 to-purple-950/20 backdrop-blur-sm rounded-xl p-5 border border-blue-700/30">
                {user && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-300">
                          {t("credits")}:
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            leftCredits !== null &&
                              leftCredits < currentCreditsRequired
                              ? "text-red-400"
                              : "text-gray-100"
                          )}
                        >
                          {leftCredits !== null ? leftCredits : "-"}
                        </span>
                        <Coins className="h-4 w-4 text-gray-400" />
                      </div>
                      <a
                        href="/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        {t("recharge")}
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-300">
                        {t("cost")}:
                      </span>
                      <span className="text-sm font-medium text-blue-300 tabular-nums">
                        {currentCreditsRequired}
                      </span>
                      <Coins className="h-4 w-4 text-blue-300" />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={
                    !description.trim() ||
                    description.trim().length < 10 ||
                    isLoading ||
                    isSubmitting ||
                    (user &&
                      leftCredits !== null &&
                      leftCredits < currentCreditsRequired)
                  }
                  size="lg"
                  className="plausible-event-name=Video+Generation w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {isSubmitting || isLoading
                    ? t("submitting")
                    : t("generateVideo")}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Telegram Banner */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {t("telegramBanner.text")}
            </span>
            <a
              href="https://t.me/veo3ai_io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600/80 hover:bg-gray-500/90 text-white text-sm font-medium rounded-md transition-all duration-200 hover:scale-105 plausible-event-name=Telegram+Channel+Click"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
              </svg>
              {t("telegramBanner.linkText")}
            </a>
          </div>
        </div>

        {/* Video Result Display */}
        {currentGeneration && (
          <div className="mt-8">
            <VideoResult
              generation={currentGeneration}
              onRetry={handleRetry}
              onVideoUrlUpdate={(videoUrl: string) => {
                updateCurrentGeneration({ video_url: videoUrl });
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
