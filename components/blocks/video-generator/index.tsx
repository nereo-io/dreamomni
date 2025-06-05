"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image as ImageIcon, X, Play, Coins } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import useCredits from "@/hooks/useCredits";
import VideoResult from "@/components/blocks/video-result";
import {
  VideoModelType,
  getTextToVideoModels,
  getImageToVideoModels,
  calculateCredits,
  getVideoModel,
} from "@/config/video-models";

interface VideoGeneratorProps {
  placeholder?: string;
}

type VideoAspectRatio = "16:9" | "9:16" | "1:1";
type VideoDuration = "5" | "10";

export default function VideoGenerator({
  placeholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
}: VideoGeneratorProps) {
  const router = useRouter();
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

  // 根据是否有图片自动切换模型
  useEffect(() => {
    const hasImage = !!uploadedImage;
    if (hasImage) {
      // 切换到图片转视频模型
      setSelectedModel("kling-1-6-image-to-video-std");
    } else {
      // 切换到文本转视频模型
      setSelectedModel("kling-1-6-text-to-video-std");
    }
  }, [uploadedImage]);

  // 获取当前可用的模型列表
  const getAvailableModels = () => {
    const hasImage = !!uploadedImage;
    return hasImage ? getImageToVideoModels() : getTextToVideoModels();
  };

  // 获取积分消耗信息
  const getCreditsRequired = (modelId: string, duration: VideoDuration) => {
    return calculateCredits(modelId, parseInt(duration));
  };

  // 获取当前选择的积分消耗
  const currentCreditsRequired = getCreditsRequired(selectedModel, duration);

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
        t("toast.insufficientCredits", { required: currentCreditsRequired, available: leftCredits })
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

  // 获取选中模型的详细信息
  const selectedModelConfig = getVideoModel(selectedModel);

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
              {/* Video Aspect Ratio */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-gray-700/30">
                <Label className="text-lg font-semibold text-gray-50 mb-4 block">
                  {t("videoAspectRatio")}
                </Label>
                <RadioGroup
                  value={aspectRatio}
                  onValueChange={(value) =>
                    setAspectRatio(value as VideoAspectRatio)
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="16:9" id="landscape" />
                    <Label
                      htmlFor="landscape"
                      className="text-gray-200 font-medium cursor-pointer flex items-center gap-2"
                    >
                      <span className="w-6 h-4 bg-gray-600 rounded-sm"></span>
                      {t("aspectRatios.landscape")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="9:16" id="portrait" />
                    <Label
                      htmlFor="portrait"
                      className="text-gray-200 font-medium cursor-pointer flex items-center gap-2"
                    >
                      <span className="w-4 h-6 bg-gray-600 rounded-sm"></span>
                      {t("aspectRatios.portrait")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="1:1" id="square" />
                    <Label
                      htmlFor="square"
                      className="text-gray-200 font-medium cursor-pointer flex items-center gap-2"
                    >
                      <span className="w-5 h-5 bg-gray-600 rounded-sm"></span>
                      {t("aspectRatios.square")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Video Duration */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-gray-700/30">
                <Label className="text-lg font-semibold text-gray-50 mb-4 block">
                  {t("videoDuration")}
                </Label>
                <RadioGroup
                  value={duration}
                  onValueChange={(value) => setDuration(value as VideoDuration)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="5" id="duration-5s" />
                    <Label
                      htmlFor="duration-5s"
                      className="text-gray-200 font-medium cursor-pointer"
                    >
                      {t("durations.5seconds")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="10" id="duration-10s" />
                    <Label
                      htmlFor="duration-10s"
                      className="text-gray-200 font-medium cursor-pointer"
                    >
                      {t("durations.10seconds")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Credits & Generate Button */}
              <div className="bg-gradient-to-br from-blue-950/30 to-purple-950/20 backdrop-blur-sm rounded-xl p-5 border border-blue-700/30">
                {/* Video Model Selection */}
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">
                    {t("videoModel")}
                  </Label>
                  <Select
                    value={selectedModel}
                    onValueChange={(value) => setSelectedModel(value)}
                  >
                    <SelectTrigger className="w-full text-left">
                      <SelectValue placeholder={t("selectModel")} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableModels().map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-3 w-full group">
                            <img
                              src="/imgs/intro/kling.svg"
                              alt="Kling"
                              className="w-5 h-5 flex-shrink-0"
                            />
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">
                                {model.displayName}
                              </span>

                              {/* Hover时显示的描述 */}
                              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-h-0 group-hover:max-h-6 overflow-hidden">
                                {model.description}
                              </span>

                              {/* Hover时显示的特性标签 */}
                              {model.features && (
                                <div className="flex flex-wrap gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-h-0 group-hover:max-h-12 overflow-hidden">
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

                {user && (
                  <div className="mb-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">{t("credits")}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-100">
                          {leftCredits !== null ? leftCredits : "-"}
                        </span>
                        <a
                          href="/pricing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                        >
                          {t("recharge")}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">{t("cost")}:</span>
                      <span className="text-xs font-medium text-blue-300">
                        {currentCreditsRequired} {t("credits")}
                      </span>
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

          {/* Model availability notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              {t("modelNotice")}
            </p>
          </div>
        </Card>

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
