"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
// Select components removed - using fixed model display
import { Image as ImageIcon, Coins, Wand2, Upload, X, Plus, Zap } from "lucide-react";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import useCredits from "@/hooks/useCredits";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { 
  IMAGE_GENERATION_TYPES, 
  getModelById, 
  getProviderByModelId,
  type AIModel 
} from "@/config/aiProviders";

// 图片生成参数接口 - 支持多AI服务提供商
export interface ImageGenerationParams {
  model: string;
  prompt: string;
  mode: "text-to-image" | "image-edit";
  provider?: string; // AI服务提供商
  image_urls?: string[]; // 仅在 image-edit 模式下使用
  negative_prompt?: string;
  aspect_ratio?: string;
  quality?: string;
  style?: string;
  seed?: number;
  // Nano Banana API支持的新参数
  output_format?: "png" | "jpeg"; // 输出格式
  image_size?: "auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9"; // 图片尺寸比例
  enable_prompt_enhancement?: boolean; // Prompt Enhancement 开关
  captchaToken?: string; // CAPTCHA验证令牌
}

interface ImageGeneratorProps {
  onGenerate: (params: ImageGenerationParams) => Promise<void>;
  isGenerating: boolean;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  onModelChange?: (model: string) => void;
}

// 图片生成功能分类配置已移动到 @/config/aiProviders

// Nano Banana API 只支持 prompt 和 image_urls 参数
// 移除了不支持的参数：aspect_ratio, quality, style, negative_prompt, seed

export default function ImageGenerator({
  onGenerate,
  isGenerating,
  descriptionLabel,
  descriptionPlaceholder = "Describe the image you want to create, e.g., A majestic eagle soaring through mountain peaks at golden hour...",
  onModelChange,
}: ImageGeneratorProps) {
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const { leftCredits, updateLeftCredits, setCredits, isLoading: creditsLoading, hasInitialized } = useCredits();
  const t = useTranslations("imageGenerator");
  
  // 页面加载时主动查询积分
  useEffect(() => {
    if (user?.uuid && !hasInitialized) {
      updateLeftCredits().catch(error => {
        console.error("Failed to fetch credits on mount:", error);
      });
    }
  }, [user?.uuid, hasInitialized]); // 移除 updateLeftCredits 依赖，避免无限循环
  
  // State - 支持功能分类和模型选择
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<"text-to-image" | "image-to-image">("text-to-image");
    // 固定使用Nano Banana模型
  const selectedModel = "google/nano-banana";
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [enablePromptEnhancement, setEnablePromptEnhancement] = useState(true);
  
  // 新的输出设置状态
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg">("png");
  const [imageSize, setImageSize] = useState<"auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9">("auto");
  
  // CAPTCHA related states
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingCaptchaParams, setPendingCaptchaParams] = useState<ImageGenerationParams | null>(null);

  // 固定的Nano Banana模型信息
  const currentModel = {
    id: "google/nano-banana",
    displayName: "Nano Banana",
    providerDisplayName: "Kie.ai Nano Banana",
    credits: 2
  };
  
  // 计算所需积分
  // 图片生成固定消耗2个积分
  const requiredCredits = 2;
  
  // 检查是否需要CAPTCHA验证（基于积分）
  const needsCaptcha = useCallback(() => {
    // 新用户（积分=10）需要CAPTCHA验证，防止薅羊毛
    return user?.uuid && leftCredits === 10;
  }, [user?.uuid, leftCredits]);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt, adjustTextareaHeight]);

  // Handle type change
  const handleTypeChange = (type: "text-to-image" | "image-to-image") => {
    setSelectedType(type);
    // 重置图片上传状态
    if (type === "text-to-image") {
      setUploadedImages([]);
      setImageUrls([]);
    }
  };

  // 通知父组件当前使用的固定模型
  useEffect(() => {
    if (onModelChange) {
      onModelChange(selectedModel);
    }
  }, [onModelChange, selectedModel]);

  // Handle image upload
  const handleImageUpload = async (files: FileList) => {
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    const file = files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidImageFile", { filename: file.name }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("fileSizeExceeded", { filename: file.name }));
      return;
    }

    setIsUploadingImages(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      if (uploadResult.code === 0) {
        // Replace the existing image (single image mode)
        setUploadedImages([file]);
        setImageUrls([uploadResult.data.url]);
        toast.success(t("imageUploadedSuccessfully"));
      } else {
        throw new Error(uploadResult.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("uploadFailed"));
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Get selected model info (这行被移除，因为上面已经定义)

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
      
      // 执行实际的生成请求
      await onGenerate(finalParams);
    }
  };

  // 处理CAPTCHA模态框关闭
  const handleCaptchaModalClose = () => {
    setShowCaptchaModal(false);
    setPendingCaptchaParams(null);
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    if (!prompt.trim()) {
      toast.error(t("pleaseEnterDescription"));
      return;
    }

    if (selectedType === "image-to-image" && imageUrls.length === 0) {
      toast.error(t("pleaseUploadImage"));
      return;
    }

    if (leftCredits !== null && leftCredits < requiredCredits) {
      toast.error(t("insufficientCredits", { credits: requiredCredits }));
      return;
    }

    const provider = getProviderByModelId(selectedModel);
    
    const params: ImageGenerationParams = {
      model: selectedModel,
      prompt: prompt.trim(),
      mode: selectedType === "text-to-image" ? "text-to-image" : "image-edit",
      provider: provider || undefined,
      image_urls: selectedType === "image-to-image" ? imageUrls : undefined,
      output_format: outputFormat,
      image_size: imageSize,
      enable_prompt_enhancement: enablePromptEnhancement,
    };

    // 基于积分的CAPTCHA判断
    if (needsCaptcha()) {
      // 新用户需要CAPTCHA验证
      setPendingCaptchaParams(params);
      setShowCaptchaModal(true);
      return;
    }

    try {
      await onGenerate(params);
      console.log("✅ Image generation successful");
      
      // 生成成功后刷新积分
      setTimeout(() => {
        updateLeftCredits();
      }, 1000);
      
    } catch (error) {
      console.error("Generation error:", error);
      
      // 生成失败，刷新积分（后端已处理积分返还）
      setTimeout(() => {
        updateLeftCredits();
      }, 1000);
      
      // 检查是否是用户同步问题
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("User account synchronization") || 
          errorMessage.includes("sign out and sign in again")) {
        
        // 尝试自动同步用户数据
        try {
          console.log("🔄 Attempting automatic user sync...");
          const syncResponse = await fetch("/api/user/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            if (syncResult.code === 0) {
              console.log("✅ User sync successful:", syncResult.data.action);
              toast.success(t("accountSyncSuccessful"));
              return;
            }
          }
        } catch (syncError) {
          console.error("❌ Auto sync failed:", syncError);
        }
        
        toast.error(t("pleaseSignInAgain"));
      } else {
        // 显示失败信息
        toast.error(t("generationFailed", { error: errorMessage || t("unknownError") }));
      }
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg image-generator-container flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
      {/* Scrollable content area */}
      <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
        <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
          {/* Function Type Tabs - Simplified */}
          <div className="border-b border-gray-700 -mx-4 md:-mx-6 px-4 md:px-6 mb-4">
            <div className="flex">
              {IMAGE_GENERATION_TYPES.map((type, index) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id as "text-to-image" | "image-to-image")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 relative ${
                    selectedType === type.id
                      ? 'text-blue-400 border-blue-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  <span className="font-semibold">{type.name}</span>
                  {/* Active indicator */}
                  {selectedType === type.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  )}
                </button>
              ))}
            </div>
          </div>



          {/* Image Upload Section (for image-to-image mode) */}
          {selectedType === "image-to-image" && (
            <div>
                          <div className="text-white text-lg font-semibold mb-4">
              {t("image")}
            </div>
              {uploadedImages.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isUploadingImages
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  } ${
                    false // isDragOver placeholder for future drag support
                      ? "border-blue-400 bg-blue-900/50"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  onClick={() =>
                    !isUploadingImages &&
                    document.getElementById("image-upload")?.click()
                  }
                >
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300 px-2 text-center">
                      {t("clickToUpload")}
                    </p>
                    <p className="text-xs text-gray-400 px-2 text-center">
                      {t("supportedFormats")}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(uploadedImages[0])}
                    alt="Uploaded"
                    className="w-full h-32 object-contain rounded-lg bg-gray-800"
                  />
                  {!isUploadingImages && (
                    <button
                      onClick={() => removeImage(0)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {isUploadingImages && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <span className="text-white text-sm">{t("uploading")}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <div className="text-white text-lg font-semibold mb-4">
              {t("prompt")}
            </div>
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedType === "image-to-image" 
                ? t("imageToImagePlaceholder")
                : (descriptionPlaceholder || t("textToImagePlaceholder"))
              }
              className="resize-none bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400 mt-0 overflow-y-auto"
              style={{ minHeight: "150px", maxHeight: "300px" }}
              disabled={isGenerating}
            />
          </div>

          {/* Settings */}
          <div>
            <div className="text-white text-lg font-semibold mb-4">
              {t("settings")}
            </div>

            {/* AI Model Display - Fixed to Nano Banana */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm mb-2 block">
                {t("model")}
              </label>
              <div className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">🍌</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-100">
                        {t("nanoBananaDisplayName")}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-blue-300">
                        <Coins className="h-3 w-3" />
                        2 credits
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 mb-1">
                      Advanced AI model for natural language-driven image generation
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                        {t("highQuality")}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                        {t("fastGeneration")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Format */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm mb-2 block">
                {t("outputFormat")}
              </label>
              <div className="flex flex-wrap gap-3 sm:gap-6">
                {["png", "jpeg"].map((format) => (
                  <label
                    key={format}
                    className="flex items-center cursor-pointer min-w-0"
                  >
                    <input
                      type="radio"
                      name="outputFormat"
                      value={format}
                      checked={outputFormat === format}
                      onChange={(e) => setOutputFormat(e.target.value as "png" | "jpeg")}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0 ${
                        outputFormat === format
                          ? "border-primary bg-primary"
                          : "border-gray-500"
                      }`}
                    >
                      {outputFormat === format && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <span className="text-gray-300 text-sm uppercase">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Image Size Ratio */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm mb-2 block">
                {t("imageSize")}
              </label>
              <div className="flex flex-wrap gap-3 sm:gap-6">
                {[
                  { value: "auto", label: "Auto" },
                  { value: "1:1", label: "1:1" },
                  { value: "3:4", label: "3:4" },
                  { value: "9:16", label: "9:16" },
                  { value: "4:3", label: "4:3" },
                  { value: "16:9", label: "16:9" },
                ].map((size) => (
                  <label
                    key={size.value}
                    className="flex items-center cursor-pointer min-w-0"
                  >
                    <input
                      type="radio"
                      name="imageSize"
                      value={size.value}
                      checked={imageSize === size.value}
                      onChange={(e) => setImageSize(e.target.value as typeof imageSize)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-2 flex-shrink-0 ${
                        imageSize === size.value
                          ? "border-primary bg-primary"
                          : "border-gray-500"
                      }`}
                    >
                      {imageSize === size.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <span className="text-gray-300 text-sm">{size.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prompt Enhancement Toggle */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-300 font-medium mb-1">
                    Prompt Enhancement
                  </div>
                  <div className="text-xs text-gray-400">
                    {t("promptEnhancementDescription")}
                  </div>
                </div>
                <Switch
                  checked={enablePromptEnhancement}
                  onCheckedChange={setEnablePromptEnhancement}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            {/* Credits and Cost */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-300 mb-1">
                    {t("credits")}: {leftCredits !== null ? leftCredits : "-"}
                  </div>
                  <div className="text-gray-300">
                    {t("cost")}: {requiredCredits} ⚡
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
      </div>

      {/* Fixed bottom button area */}
      <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating || 
            !prompt.trim() ||
            (selectedType === "image-to-image" && imageUrls.length === 0) ||
            (leftCredits !== null && leftCredits < requiredCredits)
          }
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
        >
          {isGenerating ? (
            <>
              <Wand2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="truncate">{t("generating")}</span>
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              <span className="truncate">
                {selectedType === "image-to-image" ? t("transformImage") : t("generateImage")}
              </span>
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
        mode="image"
      />
    </div>
  );
}
