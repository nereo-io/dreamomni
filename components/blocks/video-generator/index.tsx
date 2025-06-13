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

export default function VideoGenerator({
  placeholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
}: VideoGeneratorProps) {
  const t = useTranslations("video-generator");
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [duration, setDuration] = useState<VideoDuration>("5");
  const [selectedModel, setSelectedModel] = useState<string>(
    "kling-1-6-text-to-video-std"
  );
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);

  const { user, setShowSignModal } = useAppContext();
  const {
    isLoading,
    currentGeneration,
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

      // 3. 检查音频兼容性
      if (generateAudio && !selectedModelConfig.supportsAudio) {
        setGenerateAudio(false);
      }

      // 4. 图片兼容性检查已移到独立的 useEffect 中处理
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
    hasAudio: boolean = false
  ) => {
    return calculateCredits(modelId, parseInt(duration), hasAudio);
  };

  // 获取当前选择的积分消耗
  const currentCreditsRequired = getCreditsRequired(
    selectedModel,
    duration,
    generateAudio
  );

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("toast.uploadImageFile"));
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(t("toast.imageTooLarge"));
      return;
    }

    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

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
    if (description.trim().length < 30) {
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

    // 清空之前的生成状态，避免显示旧的结果
    clearCurrentGeneration();

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
  };

  // Handle retry
  const handleRetry = () => {
    // 如果当前有生成记录，直接重新开始轮询
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
                {description.trim().length < 30 && (
                  <div className="flex justify-end items-center text-sm">
                    <span
                      className={cn(
                        "transition-colors text-sm",
                        description.trim().length < 30
                          ? "text-orange-400"
                          : "text-gray-400"
                      )}
                    >
                      {description.trim().length}/30 {t("characterCount")}
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
                                selectedModelConfig.provider === "kling"
                                  ? "/imgs/intro/kling.svg"
                                  : "/imgs/intro/veo.svg"
                              }
                              alt={selectedModelConfig.provider}
                              className="w-4 h-4 flex-shrink-0"
                            />
                            <span className="font-medium">
                              {selectedModelConfig.displayName}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-blue-300">
                              <Coins className="h-3 w-3" />
                              {selectedModelConfig.perSecondCredits}/s
                            </div>
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
                                model.provider === "kling"
                                  ? "/imgs/intro/kling.svg"
                                  : "/imgs/intro/veo.svg"
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
                    description.trim().length < 30 ||
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
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24-.01.37z"/>
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
