"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { Play, Coins, Crown, ChevronRight } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import useCredits from "@/hooks/useCredits";
import { ImageUploader } from "./ImageUploader";
import { ImageGridUploader } from "./ImageGridUploader";
import {
  getTextToVideoModels,
  getImageToVideoModels,
  calculateCredits,
  getVideoModel,
  isSeedanceModel,
  getMaxImagesForModel,
} from "@/config/video-models";
import { validateImage } from "@/config/image-validation-rules";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";
import type { VideoEffect } from "@/types/video-effect";
import { EffectSelector } from "@/components/blocks/effect-selector";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { CreditsCostSection } from "@/components/blocks/common/CreditsCostSection";

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
  image_urls?: string[]; // 新增：支持1-2张图片数组（首帧、尾帧）
  source_image_ids?: string[]; // 新增：来源图片ID数组（追踪"My Creations"选择）
  effect_id?: string;
  pixverse_img_id?: number;
  captchaToken?: string;
  watermarkEnabled?: boolean;
  generationType?: string; // For Reference-to-Video feature (e.g., "REFERENCE_2_VIDEO")
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

  // Optional: Specify generation type to filter available models
  generationType?: string;

  // Optional: Hide prompt enhancement toggle
  hidePromptEnhancement?: boolean;
}

type VideoDuration = "5" | "6" | "8" | "10" | "12" | "15" | "25";
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
  generationType,
  hidePromptEnhancement = false,
}: VideoGeneratorProps) {
  const t = useTranslations("video-generator");
  const locale = useLocale();
  const router = useRouter();

  // 使用翻译作为默认值
  const finalDescriptionLabel = descriptionLabel || t("videoDescription");

  // 组件内部状态管理
  const [description, setDescription] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedResolution, setSelectedResolution] = useState("");

  // 其他内部状态
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [generateAudio] = useState(true);

  // Enhanced Prompt 开关状态：默认关闭，避免 SSR/CSR 因 localStorage 产生 hydration mismatch
  const [enablePromptEnhancement, setEnablePromptEnhancement] = useState(false);
  const promptEnhancementPrefLoadedRef = useRef(false);

  // 图片上传状态（通过 ImageUploader 组件管理）
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [sourceImageIds, setSourceImageIds] = useState<string[]>([]); // 来源图片ID（追踪"My Creations"选择）

  // 向后兼容：保留旧状态供其他逻辑使用
  const uploadedImageUrl = uploadedImageUrls[0] || null;
  const [isSubmitting] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<VideoEffect | null>(
    effect || null
  );
  const [pixverseImgId, setPixverseImgId] = useState<number | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);

  // CAPTCHA related states
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingCaptchaParams, setPendingCaptchaParams] =
    useState<VideoGenerationParams | null>(null);

  // Textarea 引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { user, setShowSignModal, setShowPricingModal, membership } =
    useAppContext();
  const { leftCredits, updateLeftCredits } = useCredits();
  const isMember = membership?.status === "active";
  const isSeedanceSelected = isSeedanceModel(selectedModel);
  const isVeo3Selected = selectedModel.includes('kie-veo3-');

  // 当前模型支持的最大图片数（从配置中获取）
  const maxImages = useMemo(
    () => getMaxImagesForModel(selectedModel),
    [selectedModel]
  );
  const supportsDualImages = maxImages >= 2;

  // 用户登录时获取积分
  useEffect(() => {
    if (user?.uuid) {
      updateLeftCredits().catch(console.error);
    }
  }, [user?.uuid, updateLeftCredits]);

  // 读取 Enhanced Prompt 偏好（仅在客户端）
  useEffect(() => {
    try {
      const stored = localStorage.getItem('video-prompt-enhancement-enabled');
      if (stored !== null) {
        setEnablePromptEnhancement(stored === 'true');
      }
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
    } finally {
      promptEnhancementPrefLoadedRef.current = true;
    }
  }, []);

  // 自动保存 Enhanced Prompt 偏好到 localStorage
  useEffect(() => {
    if (!promptEnhancementPrefLoadedRef.current) return;

    try {
      localStorage.setItem('video-prompt-enhancement-enabled', String(enablePromptEnhancement));
    } catch (error) {
      console.error('Failed to save prompt enhancement preference:', error);
    }
  }, [enablePromptEnhancement]);

  // 模型切换时的兼容性处理
  useEffect(() => {
    // 当切换到不支持双图的模型时，保留第一张图片
    if (!supportsDualImages && uploadedImageUrls.length > 1) {
      setUploadedImageUrls([uploadedImageUrls[0]]);
      setSourceImageIds(sourceImageIds.length > 0 ? [sourceImageIds[0]] : []);
      toast.info("Current model only supports single image. Kept first frame.");
    }
  }, [selectedModel, supportsDualImages, uploadedImageUrls, sourceImageIds]);

  // 检查是否需要CAPTCHA验证（基于积分）
  const needsCaptcha = useCallback(() => {
    // 新用户（积分<=12）需要CAPTCHA验证，防止薅羊毛
    return user?.uuid && leftCredits !== null && leftCredits <= 12;
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
        setUploadedImageUrls([showcaseVideoParams.imageUrl]);

        // If using pixverse_template effect, upload to Pixverse
        if (effect?.effect_type === "pixverse_template") {
          fetch("/api/video-effects/pixverse/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: showcaseVideoParams.imageUrl }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.code === 0 && result.data?.imgId) {
                setPixverseImgId(result.data.imgId);
              }
            })
            .catch((err) =>
              console.error("Failed to upload showcase image to Pixverse:", err)
            );
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
        setUploadedImageUrls([editVideoData.image_url]);

        // If using pixverse_template effect, upload to Pixverse
        if (effect?.effect_type === "pixverse_template") {
          fetch("/api/video-effects/pixverse/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: editVideoData.image_url }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.code === 0 && result.data?.imgId) {
                setPixverseImgId(result.data.imgId);
              }
            })
            .catch((err) =>
              console.error("Failed to upload edit image to Pixverse:", err)
            );
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

  // 获取所有可用模型 - 基于mode参数和generationType筛选
  const availableModels = useMemo(() => {
    const allModels =
      mode === "image-to-video"
        ? getImageToVideoModels()
        : getTextToVideoModels();

    // 如果指定了 generationType，只显示匹配的模型
    if (generationType) {
      return allModels.filter((m) => m.generationType === generationType);
    }

    // 否则返回该模式下所有通用模型（排除有 generationType 标记的特殊模型）
    return allModels.filter((m) => !m.generationType);
  }, [mode, generationType]);

  const memberOnlyModelIds = useMemo(
    () =>
      new Set(
        availableModels
          .filter((model) => model.requiresMembership)
          .map((model) => model.id)
      ),
    [availableModels]
  );

  const isMemberOnlyModel = useCallback(
    (modelId?: string) => !!(modelId && memberOnlyModelIds.has(modelId)),
    [memberOnlyModelIds]
  );

  const defaultAccessibleModel = useMemo(() => {
    if (!availableModels.length) {
      return undefined;
    }

    if (isMember) {
      return availableModels[0];
    }

    return (
      availableModels.find((model) => !model.requiresMembership) ||
      availableModels[0]
    );
  }, [availableModels, isMember]);

  // 获取选中模型的详细信息
  const selectedModelConfig = getVideoModel(selectedModel);

  const syncModelDefaults = useCallback((modelId: string) => {
    const modelConfig = getVideoModel(modelId);
    if (!modelConfig) {
      return;
    }

    const supportedDurations = modelConfig.supportedDurations || [5, 10];
    setSelectedDuration((prev) => {
      if (!prev) {
        return `${supportedDurations[0]}s`;
      }

      const currentDuration = parseInt(prev.replace("s", ""));
      if (!supportedDurations.includes(currentDuration)) {
        return `${supportedDurations[0]}s`;
      }

      return prev;
    });

    const supportedResolutions = modelConfig.supportedResolutions || [
      "480p",
      "1080p",
    ];

    setSelectedResolution((prev) => {
      if (!prev || !supportedResolutions.includes(prev)) {
        return supportedResolutions[0];
      }

      return prev;
    });
  }, []);

  const handleModelSelect = useCallback(
    (value: string) => {
      if (!isMember && isMemberOnlyModel(value)) {
        toast.info(t("toast.membersOnlyModel"));
        return;
      }

      setSelectedModel(value);
      onModelChange?.(value);
      syncModelDefaults(value);
    },
    [isMember, isMemberOnlyModel, onModelChange, syncModelDefaults, t]
  );

  // 初始化默认模型选择和模型智能切换
  useEffect(() => {
    if (forceModel) {
      if (isMemberOnlyModel(forceModel) && !isMember) {
        if (defaultAccessibleModel) {
          setSelectedModel(defaultAccessibleModel.id);
          onModelChange?.(defaultAccessibleModel.id);
          syncModelDefaults(defaultAccessibleModel.id);
        }
        return;
      }

      setSelectedModel(forceModel);
      onModelChange?.(forceModel);
      syncModelDefaults(forceModel);
      return;
    }

    if (!selectedModel && defaultAccessibleModel) {
      setSelectedModel(defaultAccessibleModel.id);
      onModelChange?.(defaultAccessibleModel.id);
      syncModelDefaults(defaultAccessibleModel.id);
    }
  }, [
    forceModel,
    isMember,
    defaultAccessibleModel,
    selectedModel,
    onModelChange,
    syncModelDefaults,
    isMemberOnlyModel,
  ]);

  useEffect(() => {
    if (
      !isMember &&
      isMemberOnlyModel(selectedModel) &&
      defaultAccessibleModel
    ) {
      if (selectedModel === defaultAccessibleModel.id) {
        return;
      }

      setSelectedModel(defaultAccessibleModel.id);
      onModelChange?.(defaultAccessibleModel.id);
      syncModelDefaults(defaultAccessibleModel.id);
    }
  }, [
    isMember,
    selectedModel,
    defaultAccessibleModel,
    onModelChange,
    syncModelDefaults,
    isMemberOnlyModel,
  ]);

  // 同步 effect prop 到 currentEffect
  useEffect(() => {
    setCurrentEffect(effect || null);
  }, [effect]);

  // Seedance 和 Veo3 模型水印开关默认行为
  useEffect(() => {
    // 只有 Seedance 和 Veo3 需要水印控制
    if (!isSeedanceSelected && !isVeo3Selected) {
      setWatermarkEnabled(false);
      return;
    }

    // 会员用户无水印，非会员强制水印
    if (isMember) {
      setWatermarkEnabled(false);
    } else {
      setWatermarkEnabled(true);
    }
  }, [isSeedanceSelected, isVeo3Selected, isMember]);

  // 确保默认选项被选中
  useEffect(() => {
    if (selectedModelConfig) {
      // 设置默认比例（如果当前选择不在支持列表中或未设置）
      const supportedRatios = selectedModelConfig.supportedAspectRatios || [
        "16:9",
        "9:16",
        "1:1",
      ];
      if (!selectedRatio || !supportedRatios.includes(selectedRatio)) {
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

  const handleWatermarkToggle = useCallback(
    (nextValue: boolean) => {
      // 非 Seedance/Veo3 模型直接允许切换
      if (!isSeedanceSelected && !isVeo3Selected) {
        setWatermarkEnabled(nextValue);
        return;
      }

      // 会员用户可以自由切换
      if (isMember) {
        setWatermarkEnabled(nextValue);
        return;
      }

      // 非会员尝试关闭水印时提示
      if (!nextValue) {
        toast.info(t("watermark.membersOnly"));
      }
      setWatermarkEnabled(true);
    },
    [isSeedanceSelected, isVeo3Selected, isMember, t]
  );

  // 初始化 textarea 高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // 从 localStorage 获取数据并回填表单
  useEffect(() => {
    // 检查 URL 中是否包含目标路径
    const pathname = window.location.pathname;
    if (
      !pathname.includes("/text-to-video") &&
      !pathname.includes("/image-to-video")
    ) {
      return;
    }

    // 对于文本模式
    if (mode === "text-to-video") {
      const savedPrompt = localStorage.getItem("modelLandingPagePrompt");
      if (savedPrompt) {
        setDescription(savedPrompt);
        // 获取后清空 localStorage 中的数据，避免重复填充
        localStorage.removeItem("modelLandingPagePrompt");
      }
    }

    // 对于图像模式
    if (mode === "image-to-video") {
      const savedImage = localStorage.getItem("modelLandingPageImage");
      if (savedImage) {
        setUploadedImageUrls([savedImage]);
        // 获取后清空 localStorage 中的数据，避免重复填充
        localStorage.removeItem("modelLandingPageImage");
      }
    }
  }, []);

  // 图片URL变化回调
  const handleImagesChange = useCallback((imageUrls: string[], sourceIds?: string[]) => {
    setUploadedImageUrls(imageUrls);
    setSourceImageIds(sourceIds || []); // 保存来源图片ID
  }, []);

  // 构建生成参数的辅助函数
  const buildGenerationParams = (): VideoGenerationParams & {
    image_urls?: string[];
    generationType?: string;
  } => {
    // 过滤掉 undefined/null，避免稀疏数组问题
    const filteredImageUrls = uploadedImageUrls.filter(
      (url) => url != null && url !== ""
    );
    const finalImageUrls =
      filteredImageUrls.length > 0 ? filteredImageUrls : undefined;
    const imageUrl = uploadedImageUrl || undefined;
    const finalGenerationType = selectedModelConfig?.generationType;

    const params = {
      model: selectedModel,
      prompt: description.trim(),
      duration: selectedDuration.replace("s", ""),
      aspect_ratio: selectedRatio,
      resolution: selectedResolution,
      generate_audio: generateAudio,
      enable_prompt_enhancement: enablePromptEnhancement,
      effect_id: currentEffect?.id,
      // 双图支持：优先使用 image_urls，向后兼容 image_url
      image_urls: finalImageUrls,
      image_url: imageUrl,
      source_image_ids: sourceImageIds.length > 0 ? sourceImageIds : undefined, // 包含来源图片ID
      pixverse_img_id: pixverseImgId || undefined,
      watermarkEnabled: (isSeedanceSelected || isVeo3Selected) ? watermarkEnabled : false,
      generationType: finalGenerationType,
    };

    console.log('[VideoGenerator] buildGenerationParams:', {
      sourceImageIds,
      finalSourceImageIds: params.source_image_ids,
      imageUrls: finalImageUrls?.map(u => u.substring(0, 50) + '...'),
    });

    return params;
  };

  // 处理CAPTCHA验证完成
  const handleCaptchaComplete = async (captchaToken: string) => {
    if (pendingCaptchaParams) {
      const finalParams = {
        ...pendingCaptchaParams,
        captchaToken,
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
    const hasImages = uploadedImageUrls.length > 0 || uploadedImageUrl;
    if (mode === "image-to-video" && !hasImages) {
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
                : generationType === "REFERENCE_2_VIDEO"
                ? t("titleReferenceToVideo")
                : mode === "image-to-video"
                ? t("titleImageToVideo")
                : t("titleTextToVideo")}
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
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
                <div className="text-white text-lg font-semibold">
                  {finalDescriptionLabel}
                </div>
                {/* Prompt Enhancement Toggle */}
                {!hidePromptEnhancement && (
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
                )}
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
          {mode === "image-to-video" &&
            (generationType === "REFERENCE_2_VIDEO" ? (
              <ImageGridUploader
                maxImages={3}
                selectedModel={selectedModel}
                onImagesChange={handleImagesChange}
                isAuthenticated={!!user?.uuid}
                onShowSignModal={() => setShowSignModal(true)}
              />
            ) : (
              <ImageUploader
                selectedModel={selectedModel}
                maxImages={maxImages}
                onImagesChange={handleImagesChange}
                imageUrls={uploadedImageUrls}
                sourceImageIds={sourceImageIds}
                effect={currentEffect}
                onPixverseImgIdChange={setPixverseImgId}
                isAuthenticated={!!user?.uuid}
                onShowSignModal={() => setShowSignModal(true)}
                generationType={generationType}
              />
            ))}

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
                    onValueChange={handleModelSelect}
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
                                  : selectedModelConfig.id.includes("sora")
                                  ? "/imgs/intro/sora.png"
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
                            {selectedModelConfig.requiresMembership && (
                              <Crown className="h-3.5 w-3.5 text-amber-300" />
                            )}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => {
                        const isMemberOnly = model.requiresMembership;

                        return (
                          <SelectItem
                            key={model.id}
                            value={model.id}
                            aria-disabled={!isMember && isMemberOnly}
                            className={
                              !isMember && isMemberOnly
                                ? "opacity-60 cursor-not-allowed"
                                : undefined
                            }
                          >
                            <div
                              className={`flex items-start gap-3 w-full py-1 ${
                                !isMember && isMemberOnly
                                  ? "cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <img
                                src={
                                  model.id.includes("kling")
                                    ? "/imgs/intro/kling.svg"
                                    : model.id.includes("minimax") ||
                                      model.id.includes("hailuo")
                                    ? "/imgs/intro/hailuo.webp"
                                    : model.id.includes("veo")
                                    ? "/imgs/intro/veo.svg"
                                    : model.id.includes("sora")
                                    ? "/imgs/intro/sora.png"
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
                                  {isMemberOnly && (
                                    <Crown className="h-3.5 w-3.5 text-amber-300" />
                                  )}
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
                        );
                      })}
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

              {(isSeedanceSelected || isVeo3Selected) && !isMember && (
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-300">
                      {t("watermark.label")}
                    </span>
                    <div className="flex items-center gap-3">
                      <Crown className="h-3.5 w-3.5 text-amber-300" />
                      <Switch
                        checked={watermarkEnabled}
                        onCheckedChange={handleWatermarkToggle}
                        className="data-[state=checked]:bg-primary scale-75"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Credits and Cost - always visible */}
          <CreditsCostSection
            leftCredits={leftCredits}
            estimatedCost={currentCreditsRequired}
            onShowPricing={() => setShowPricingModal(true)}
            labels={{
              credits: t("credits"),
              cost: t("cost"),
              recharge: t("recharge"),
            }}
            className="mb-4"
          />
        </div>
      </div>

      {/* Unified bottom section */}
      <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            isSubmitting ||
            (!description.trim() && (!effect || !effect.prompt_template)) ||
            !selectedModel ||
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
