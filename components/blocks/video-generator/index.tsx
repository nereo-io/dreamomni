"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, ImageIcon, X, Coins } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import useCredits from "@/hooks/useCredits";
import {
  getTextToVideoModels,
  getImageToVideoModels,
  calculateCredits,
  getVideoModel,
} from "@/config/video-models";
import { validateImage } from "@/config/image-validation-rules";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";
import type { VideoEffect } from "@/types/video-effect";
import { EffectSelector } from "@/components/blocks/effect-selector";
import { CaptchaModal } from "@/components/ui/captcha-modal";

// 生成参数接口
export interface VideoGenerationParams {
  model: string;
  prompt: string;
  duration: string;
  aspect_ratio: string;
  resolution: string;
  generate_audio: boolean;
  enable_prompt_enhancement: boolean;
  image_url?: string;
  effect_id?: string;
  pixverse_img_id?: number;
  captchaToken?: string;
}

interface VideoGeneratorProps {
  // 核心配置
  mode: "text-to-video" | "image-to-video";
  onGenerate: (params: VideoGenerationParams) => Promise<void>;
  isGenerating: boolean;

  // 可选配置
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  onModelChange?: (model: string) => void;
  showcaseVideoParams?: {
    prompt: string;
    aspectRatio: string;
    duration: number;
    model?: string;
    imageUrl?: string;
  } | null;
  onShowcaseVideoParamsUsed?: () => void;
  editVideoData?: VideoGenerationResult | null;
  onEditVideoDataUsed?: () => void;

  // Effect mode configuration
  effect?: VideoEffect;
  forceModel?: string;
  creditsOverride?: number;
}

type VideoDuration = "5" | "6" | "8" | "10";
type VideoResolution = "480p" | "512p" | "720p" | "768p" | "1080p";

export default function VideoGenerator({
  mode,
  onGenerate,
  isGenerating,
  descriptionLabel,
  descriptionPlaceholder = "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
  onModelChange,
  showcaseVideoParams,
  onShowcaseVideoParamsUsed,
  editVideoData,
  onEditVideoDataUsed,
  effect,
  forceModel,
  creditsOverride,
}: VideoGeneratorProps) {
  const t = useTranslations("video-generator");
  const locale = useLocale();
  const router = useRouter();

  // 使用翻译作为默认值
  const finalDescriptionLabel = descriptionLabel || t("videoDescription");

  // 组件内部状态管理
  const [description, setDescription] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedResolution, setSelectedResolution] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 其他内部状态
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [generateAudio] = useState(true);
  const [enablePromptEnhancement, setEnablePromptEnhancement] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isSubmitting] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<VideoEffect | null>(
    effect || null
  );
  const [pixverseImgId, setPixverseImgId] = useState<number | null>(null);
  
  // CAPTCHA related states
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingCaptchaParams, setPendingCaptchaParams] = useState<VideoGenerationParams | null>(null);

  // Textarea 引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();

  // 用户登录时获取积分
  useEffect(() => {
    if (user?.uuid) {
      updateLeftCredits().catch(console.error);
    }
  }, [user?.uuid, updateLeftCredits]);

  // 检查是否需要CAPTCHA验证（基于积分）
  const needsCaptcha = useCallback(() => {
    // 新用户（积分=10）需要CAPTCHA验证，防止薅羊毛
    return user?.uuid && leftCredits === 10;
  }, [user?.uuid, leftCredits]);

  // Populate form fields when showcase video params are provided
  useEffect(() => {
    if (showcaseVideoParams) {
      setDescription(showcaseVideoParams.prompt);
      setSelectedRatio(showcaseVideoParams.aspectRatio);
      setSelectedDuration(`${showcaseVideoParams.duration}s`);

      // Set model if provided
      if (showcaseVideoParams.model) {
        setSelectedModel(showcaseVideoParams.model);
      }

      // Set image if provided (for image-to-video mode)
      if (showcaseVideoParams.imageUrl && mode === "image-to-video") {
        setSelectedImage(showcaseVideoParams.imageUrl);
        setImagePreview(showcaseVideoParams.imageUrl);
        setUploadedImageUrl(showcaseVideoParams.imageUrl);
        
        // If using pixverse_template effect, upload to Pixverse
        if (effect?.effect_type === 'pixverse_template') {
          fetch('/api/video-effects/pixverse/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: showcaseVideoParams.imageUrl }),
          })
          .then(res => res.json())
          .then(result => {
            if (result.code === 0 && result.data?.imgId) {
              setPixverseImgId(result.data.imgId);
            }
          })
          .catch(err => console.error('Failed to upload showcase image to Pixverse:', err));
        }
      }

      // Focus on the description textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      // Notify parent that params have been used
      if (onShowcaseVideoParamsUsed) {
        onShowcaseVideoParamsUsed();
      }
    }
  }, [showcaseVideoParams, onShowcaseVideoParamsUsed, mode, effect]);

  // Populate form fields when edit video data is provided
  useEffect(() => {
    if (editVideoData) {
      setDescription(editVideoData.prompt);
      setSelectedModel(editVideoData.model_id);
      setSelectedRatio(editVideoData.aspect_ratio || "16:9");
      setSelectedDuration(`${editVideoData.duration_seconds || 5}s`);

      // If it's image-to-video mode and has image_url, set the image
      if (mode === "image-to-video" && editVideoData.image_url) {
        setSelectedImage(editVideoData.image_url);
        setImagePreview(editVideoData.image_url);
        setUploadedImageUrl(editVideoData.image_url);
        
        // If using pixverse_template effect, upload to Pixverse
        if (effect?.effect_type === 'pixverse_template') {
          fetch('/api/video-effects/pixverse/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: editVideoData.image_url }),
          })
          .then(res => res.json())
          .then(result => {
            if (result.code === 0 && result.data?.imgId) {
              setPixverseImgId(result.data.imgId);
            }
          })
          .catch(err => console.error('Failed to upload edit image to Pixverse:', err));
        }
      }

      // Focus on the description textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      // Notify parent that edit data has been used
      if (onEditVideoDataUsed) {
        onEditVideoDataUsed();
      }
    }
  }, [editVideoData, onEditVideoDataUsed, mode, effect]);

  // 监听 isGenerating 变化，当生成完成时更新积分
  useEffect(() => {
    if (!isGenerating && user?.uuid) {
      // 延迟一点时间确保服务器已经处理完成
      const timer = setTimeout(() => {
        updateLeftCredits().catch(console.error);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, user?.uuid, updateLeftCredits]);

  // 获取所有可用模型 - 基于mode参数，而不是图片状态
  const availableModels =
    mode === "image-to-video"
      ? getImageToVideoModels()
      : getTextToVideoModels();

  // 获取选中模型的详细信息
  const selectedModelConfig = getVideoModel(selectedModel);

  // 初始化默认模型选择和模型智能切换
  useEffect(() => {
    // If forceModel is provided, use it
    if (forceModel) {
      setSelectedModel(forceModel);
      if (onModelChange) {
        onModelChange(forceModel);
      }
    } else if (!selectedModel && availableModels.length > 0) {
      const firstModel = availableModels[0];
      setSelectedModel(firstModel.id);
      // 设置该模型支持的默认时长
      const supportedDurations = firstModel.supportedDurations || [5, 10];
      if (!selectedDuration) {
        setSelectedDuration(`${supportedDurations[0]}s`);
      }
      // 设置该模型支持的默认分辨率
      const supportedResolutions = firstModel.supportedResolutions || [
        "480p",
        "1080p",
      ];
      if (!selectedResolution) {
        setSelectedResolution(supportedResolutions[0]);
      }
    }
  }, [selectedModel, availableModels, selectedDuration, selectedResolution]);

  // 同步 selectedImage 和 imagePreview
  useEffect(() => {
    setImagePreview(selectedImage);
  }, [selectedImage]);

  // 同步 effect prop 到 currentEffect
  useEffect(() => {
    setCurrentEffect(effect || null);
  }, [effect]);

  // 确保默认选项被选中
  useEffect(() => {
    if (selectedModelConfig) {
      // 设置默认比例（如果当前选择不在支持列表中）
      const supportedRatios = selectedModelConfig.supportedAspectRatios || [
        "16:9",
        "9:16",
        "1:1",
      ];
      if (!supportedRatios.includes(selectedRatio)) {
        setSelectedRatio(supportedRatios[0]);
      }

      // 设置默认时长（如果当前选择不在支持列表中或未设置）
      const supportedDurations = selectedModelConfig.supportedDurations || [
        5, 10,
      ];
      if (!selectedDuration) {
        // 如果没有设置时长，使用模型支持的第一个时长
        setSelectedDuration(`${supportedDurations[0]}s`);
      } else {
        // 检查当前选择是否在支持列表中
        const currentDuration = parseInt(selectedDuration.replace("s", ""));
        if (!supportedDurations.includes(currentDuration)) {
          setSelectedDuration(`${supportedDurations[0]}s`);
        }
      }

      // 设置默认分辨率（仅在当前选择不被支持时才设置）
      const supportedResolutions = selectedModelConfig.supportedResolutions || [
        "480p",
        "1080p",
      ];
      if (!selectedResolution) {
        // 如果没有设置分辨率，使用模型支持的第一个分辨率
        setSelectedResolution(supportedResolutions[0]);
      } else if (!supportedResolutions.includes(selectedResolution)) {
        // 如果当前分辨率不被支持，切换到支持的第一个分辨率
        setSelectedResolution(supportedResolutions[0]);
      }
    }
  }, [
    selectedModelConfig,
    selectedRatio,
    selectedDuration,
    selectedResolution,
  ]);

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
  const currentCreditsRequired =
    creditsOverride ||
    getCreditsRequired(
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
      // 验证用户登录
      if (!user?.uuid) {
        setShowSignModal(true);
        return;
      }

      // 使用基于模型的图片验证规则
      const validationResult = await validateImage(file, selectedModel);
      
      if (!validationResult.valid) {
        toast.error(validationResult.error || "Invalid image file.");
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

      // 立即上传到 R2
      const formData = new FormData();
      formData.append("file", file);

      try {
        setIsUploadingImage(true);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.code !== 0) {
          throw new Error(uploadResult.message || "Image upload failed");
        }

        setUploadedImageUrl(uploadResult.data.url);
        
        // If using pixverse_template effect, also upload to Pixverse
        if (effect?.effect_type === 'pixverse_template') {
          try {
            const pixverseUploadResponse = await fetch('/api/video-effects/pixverse/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imageUrl: uploadResult.data.url }),
            });
            
            const pixverseResult = await pixverseUploadResponse.json();
            
            if (pixverseResult.code === 0 && pixverseResult.data?.imgId) {
              setPixverseImgId(pixverseResult.data.imgId);
              toast.success("Image uploaded successfully!");
            } else {
              throw new Error('Failed to upload image to Pixverse');
            }
          } catch (pixverseError) {
            console.error('Pixverse upload error:', pixverseError);
            toast.error('Failed to upload image for effect. Please try again.');
            removeImage();
            return;
          }
        } else {
          toast.success("Image uploaded successfully!");
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Failed to upload image. Please try again.");
        // 上传失败时清除图片
        removeImage();
      } finally {
        setIsUploadingImage(false);
      }
    },
    [t, user?.uuid, setShowSignModal, selectedModel]
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
    setUploadedImageUrl(null);
    setIsUploadingImage(false);
    setPixverseImgId(null);
  };

  // 构建生成参数的辅助函数
  const buildGenerationParams = (): VideoGenerationParams => {
    const imageUrl = uploadedImageUrl || undefined;
    
    return {
      model: selectedModel,
      prompt: description.trim(),
      duration: selectedDuration.replace("s", ""),
      aspect_ratio: selectedRatio,
      resolution: selectedResolution,
      generate_audio: generateAudio,
      enable_prompt_enhancement: enablePromptEnhancement,
      effect_id: currentEffect?.id,
      image_url: imageUrl,
      pixverse_img_id: pixverseImgId || undefined,
    };
  };

  // 处理CAPTCHA验证完成
  const handleCaptchaComplete = async (captchaToken: string) => {
    if (pendingCaptchaParams) {
      const finalParams = {
        ...pendingCaptchaParams,
        captchaToken
      };
      
      // 关闭模态框并清理状态
      setShowCaptchaModal(false);
      setPendingCaptchaParams(null);
      
      // 提交生成请求
      await onGenerate(finalParams);
    }
  };

  // 处理CAPTCHA模态框关闭
  const handleCaptchaModalClose = () => {
    setShowCaptchaModal(false);
    setPendingCaptchaParams(null);
  };

  // 处理生成按钮点击
  const handleGenerate = async () => {
    // 验证用户登录
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    // 验证描述内容 - for effects, prompt is optional if effect has prompt_template
    if (!description.trim() && (!effect || !effect.prompt_template)) {
      toast.error(t("toast.emptyPrompt"));
      return;
    }

    // 验证图片转视频模式下必须上传图片
    if (mode === "image-to-video" && !uploadedImageUrl) {
      toast.error(t("toast.uploadImageRequired"));
      return;
    }

    // 验证积分余额
    if (leftCredits !== null && leftCredits < currentCreditsRequired) {
      toast.error(t("toast.insufficientCredits"));
      return;
    }

    // 准备生成参数
    const params = buildGenerationParams();
    
    // 基于积分的CAPTCHA判断
    if (needsCaptcha()) {
      // 新用户需要CAPTCHA验证
      setPendingCaptchaParams(params);
      setShowCaptchaModal(true);
      return;
    }

    // 老用户或充值用户直接生成
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
    <div className="bg-gray-900 rounded-xl shadow-lg video-generator-container flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
          {/* Header Title */}
          <div className="border-b border-gray-700 pb-3">
            <h1 className="text-white text-xl font-semibold">
              {effect
                ? effect.title
                : mode === "image-to-video"
                ? "Image to Video"
                : "Text to Video"}
            </h1>
          </div>

          {/* Effect Selector - only show in effect detail page */}
          {effect && (
            <EffectSelector
              current={currentEffect}
              onChange={(newEffect) => {
                if (newEffect && newEffect.slug !== currentEffect?.slug) {
                  // 导航到新特效页面
                  router.push(`/${locale}/video-effects/${newEffect.slug}`);
                }
              }}
              locale={locale}
            />
          )}

          {/* Description Input - hide in effect mode */}
          {!effect && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
                <div className="text-white text-lg font-semibold">
                  {finalDescriptionLabel}
                </div>
                {/* Prompt Enhancement Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Prompt Enhancement
                  </span>
                  <Switch
                    checked={enablePromptEnhancement}
                    onCheckedChange={setEnablePromptEnhancement}
                    className="data-[state=checked]:bg-primary scale-75"
                  />
                </div>
              </div>
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
          )}

          {/* Image Upload Section (for image-to-video mode) */}
          {mode === "image-to-video" && (
            <div>
              <div className="text-white text-lg font-semibold mb-4">
                {t("uploadImage")}
              </div>
              {!imagePreview ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isUploadingImage
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
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
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300 px-2 text-center">
                      {t("dragAndDropImage")}
                    </p>
                    <p className="text-xs text-gray-400 px-2 text-center">
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
                  {!isUploadingImage && (
                    <button
                      onClick={removeImage}
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
          )}

          {/* Video Settings - hide in effect mode */}
          {!effect && (
            <div>
              <div className="text-white text-lg font-semibold mb-4">
                {t("videoSettings")}
              </div>

              {/* Video Model Selection - always hidden in effect mode */}
              {!effect && (
                <div className="mb-4">
                  <label className="text-gray-300 text-sm mb-2 block">
                    {t("videoModel")}
                  </label>
                  <Select
                    value={selectedModel}
                    onValueChange={(value) => {
                      setSelectedModel(value);
                      onModelChange?.(value);
                      // 切换模型时，重置时长和分辨率为新模型支持的默认值
                      const newModel = getVideoModel(value);
                      if (newModel) {
                        // 检查并更新时长
                        const supportedDurations =
                          newModel.supportedDurations || [5, 10];
                        const currentDuration = parseInt(
                          selectedDuration.replace("s", "")
                        );
                        if (!supportedDurations.includes(currentDuration)) {
                          setSelectedDuration(`${supportedDurations[0]}s`);
                        }
                        // 检查并更新分辨率 - 始终重置为默认值
                        const supportedResolutions =
                          newModel.supportedResolutions || ["480p", "1080p"];
                        setSelectedResolution(supportedResolutions[0]);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder={t("selectModel")}>
                        {selectedModelConfig && (
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                selectedModelConfig.id.includes("kling")
                                  ? "/imgs/intro/kling.svg"
                                  : selectedModelConfig.id.includes(
                                      "minimax"
                                    ) ||
                                    selectedModelConfig.id.includes("hailuo")
                                  ? "/imgs/intro/hailuo.webp"
                                  : selectedModelConfig.id.includes("veo")
                                  ? "/imgs/intro/veo.svg"
                                  : selectedModelConfig.id.includes("wan") ||
                                    selectedModelConfig.id.includes("ali")
                                  ? "/imgs/intro/wan.png"
                                  : "/imgs/intro/seedance.png"
                              }
                              alt={selectedModelConfig.provider}
                              className="w-4 h-4 flex-shrink-0"
                            />
                            <span className="font-medium">
                              {selectedModelConfig.displayName}
                            </span>
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
                                  : model.id.includes("minimax") ||
                                    model.id.includes("hailuo")
                                  ? "/imgs/intro/hailuo.webp"
                                  : model.id.includes("veo")
                                  ? "/imgs/intro/veo.svg"
                                  : model.id.includes("wan") ||
                                    model.id.includes("ali")
                                  ? "/imgs/intro/wan.png"
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
                              <span className="text-xs text-gray-400 mb-1 line-clamp-2">
                                {model.description}
                              </span>
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
              )}

              {/* Ratio */}
              <div className="mb-4">
                <label className="text-gray-300 text-sm mb-2 block">
                  {t("ratio")}
                </label>
                <div className="flex flex-wrap gap-3 sm:gap-6">
                  {(
                    selectedModelConfig?.supportedAspectRatios || [
                      "16:9",
                      "9:16",
                      "1:1",
                    ]
                  ).map((ratio) => (
                    <label
                      key={ratio}
                      className="flex items-center cursor-pointer min-w-0"
                    >
                      <input
                        type="radio"
                        name="ratio"
                        value={ratio}
                        checked={selectedRatio === ratio}
                        onChange={(e) => setSelectedRatio(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0 ${
                          selectedRatio === ratio
                            ? "border-primary bg-primary"
                            : "border-gray-500"
                        }`}
                      >
                        {selectedRatio === ratio && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="text-gray-300 text-sm">{ratio}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label className="text-gray-300 text-sm mb-2 block">
                  {t("duration")}
                </label>
                <div className="flex flex-wrap gap-3 sm:gap-6">
                  {(selectedModelConfig?.supportedDurations || [5, 10]).map(
                    (duration) => (
                      <label
                        key={duration}
                        className="flex items-center cursor-pointer min-w-0"
                      >
                        <input
                          type="radio"
                          name="duration"
                          value={`${duration}s`}
                          checked={selectedDuration === `${duration}s`}
                          onChange={(e) => setSelectedDuration(e.target.value)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0 ${
                            selectedDuration === `${duration}s`
                              ? "border-primary bg-primary"
                              : "border-gray-500"
                          }`}
                        >
                          {selectedDuration === `${duration}s` && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <span className="text-gray-300 text-sm">
                          {duration}s
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Resolution */}
              <div className="mb-4">
                <label className="text-gray-300 text-sm mb-2 block">
                  {t("resolution")}
                </label>
                <div className="flex flex-wrap gap-3 sm:gap-6">
                  {(
                    selectedModelConfig?.supportedResolutions || [
                      "480p",
                      "1080p",
                    ]
                  ).map((resolution) => (
                    <label
                      key={resolution}
                      className="flex items-center cursor-pointer min-w-0"
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={resolution}
                        checked={selectedResolution === resolution}
                        onChange={(e) => setSelectedResolution(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0 ${
                          selectedResolution === resolution
                            ? "border-primary bg-primary"
                            : "border-gray-500"
                        }`}
                      >
                        {selectedResolution === resolution && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="text-gray-300 text-sm">
                        {resolution}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Credits and Cost - always visible */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-300 mb-1">
                  {t("credits")}: {leftCredits !== null ? leftCredits : "-"}
                </div>
                <div className="text-gray-300">
                  {t("cost")}: {currentCreditsRequired} ⚡
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowPricingModal(true)}
              >
                {t("recharge")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Unified bottom section */}
      <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            isSubmitting ||
            isUploadingImage ||
            (!description.trim() && (!effect || !effect.prompt_template)) ||
            !selectedModel ||
            (mode === "image-to-video" && !uploadedImageUrl) ||
            (leftCredits !== null && leftCredits < currentCreditsRequired)
          }
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
        >
          {isGenerating || isSubmitting ? (
            <>
              <Play className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">
                {isSubmitting ? t("uploading") : t("generating")}
              </span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              <span className="truncate">{t("generateVideo")}</span>
            </>
          )}
        </Button>
      </div>

      {/* CAPTCHA模态框 */}
      <CaptchaModal
        isOpen={showCaptchaModal}
        onClose={handleCaptchaModalClose}
        onCaptchaComplete={handleCaptchaComplete}
        isSubmitting={isGenerating}
      />
    </div>
  );
}
