"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type React from "react";
import ImageHistoryForGeneration from "../image-history-for-generation";
import useImageGeneration from "@/hooks/useImageGeneration";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import { useAppContext } from "@/contexts/app";
import { CaptchaModal } from "@/components/ui/captcha-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Image as ImageIcon, Coins, Wand2, X } from "lucide-react";
import useCredits from "@/hooks/useCredits";
import { validateImage } from "@/config/image-validation-rules";

import type { ImageGenerationParams } from "../image-generator";
import type { ImageGenerationResult } from "@/hooks/useImageGeneration";
import type { ImageGenerationResult as HistoryImageResult } from "../image-history";

interface ImageToImageTabProps {
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

export default function ImageToImageTab({
  descriptionLabel,
  descriptionPlaceholder,
}: ImageToImageTabProps) {
  const { submitGeneration, pollStatus, startSmartPolling } = useImageGeneration();
  const { trackImageGeneration } = useYandexTracking();
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const t = useTranslations("imageGenerator");
  const { leftCredits, updateLeftCredits, setCredits, isLoading: creditsLoading, hasInitialized } = useCredits();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTrigger, setGenerationTrigger] = useState(0);
  const [newImage, setNewImage] = useState<HistoryImageResult | undefined>();
  const [pollingGenerations, setPollingGenerations] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState("");
  const [enablePromptEnhancement, setEnablePromptEnhancement] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // CAPTCHA related states
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingCaptchaParams, setPendingCaptchaParams] = useState<ImageGenerationParams | null>(null);
  
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedModel = "nano-banana-edit";
  const requiredCredits = 2;

  // 检查是否需要CAPTCHA验证（基于积分）
  const needsCaptcha = useCallback(() => {
    // 新用户（积分=10）需要CAPTCHA验证，防止薅羊毛
    return user?.uuid && leftCredits === 10;
  }, [user?.uuid, leftCredits]);

  // 页面加载时主动查询积分
  useEffect(() => {
    if (user?.uuid && !hasInitialized) {
      updateLeftCredits().catch(error => {
        console.error("Failed to fetch credits on mount:", error);
      });
    }
  }, [user?.uuid, hasInitialized, updateLeftCredits]);

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup all active polling
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current.clear();
    };
  }, []);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  // Handle image upload
  const handleImageUpload = async (files: FileList) => {
    if (!user?.uuid) {
      setShowSignModal(true);
      return;
    }

    const file = files[0];
    if (!file) return;

    // 使用基于模型的图片验证规则
    const validationResult = await validateImage(file, selectedModel);
    
    if (!validationResult.valid) {
      toast.error(validationResult.error || "Invalid image file.");
      return;
    }

    setUploadedImage(file);

    // Convert to base64 for preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);

    // Start upload process
    console.log("🔄 Starting image upload...");
    setIsUploadingImage(true);

    // Ensure minimum upload display time for better UX
    const minDisplayTime = 500; // 500ms minimum
    const uploadStartTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      if (uploadResult.code === 0) {
        console.log("✅ Image upload successful");
        setUploadedImageUrl(uploadResult.data.url);
        toast.success(t("imageUploadedSuccessfully"));
      } else {
        console.error("❌ Upload failed:", uploadResult.message);
        throw new Error(uploadResult.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("uploadFailed"));
      // 上传失败时清除图片
      removeImage();
    } finally {
      // Ensure minimum display time for upload state
      const uploadDuration = Date.now() - uploadStartTime;
      const remainingTime = Math.max(0, minDisplayTime - uploadDuration);
      
      if (remainingTime > 0) {
        console.log(`⏱️ Waiting ${remainingTime}ms to meet minimum display time`);
        setTimeout(() => {
          console.log("🏁 Upload process completed, clearing upload state");
          setIsUploadingImage(false);
        }, remainingTime);
      } else {
        console.log("🏁 Upload process completed, clearing upload state");
        setIsUploadingImage(false);
      }
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setUploadedImageUrl(null);
    setImagePreview(null);
    setIsUploadingImage(false);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload([file] as any as FileList);
    }
  };

  // Drag and drop handlers
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
      handleImageUpload([files[0]] as any as FileList);
    }
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
      
      // 执行实际的生成请求
      await executeGeneration(finalParams);
    }
  };

  // 处理CAPTCHA模态框关闭
  const handleCaptchaModalClose = () => {
    setShowCaptchaModal(false);
    setPendingCaptchaParams(null);
  };

  // 执行实际的生成逻辑
  const executeGeneration = async (params: ImageGenerationParams) => {
    setIsGenerating(true);
    let generationId: string | null = null;

    try {
      console.log("Starting image-to-image generation with params:", params);
      
      // Submit generation request
      const response = await submitGeneration(params);
      
      if (!response?.success) {
        throw new Error(response?.message || "Failed to submit generation request");
      }

      console.log("Generation submitted successfully:", response);
      generationId = response.data?.id || null;
      
      // 生成请求提交成功后立即更新积分显示
      // 因为后端API已经扣除了积分，前端需要立即反映这个变化
      try {
        await updateLeftCredits();
        console.log("✅ Credits updated after successful generation submission");
      } catch (error) {
        console.error("❌ Failed to update credits display:", error);
        // 不阻塞生成流程，但记录错误
      }
      
      // Track generation event
      trackImageGeneration(params.model, params.prompt);
      
      // Handle different response types
      if (response.data?.status === "completed" && response.data.image_url) {
        // Synchronous completion - image already generated
        await handleCompletedGeneration(response.data, params);
      } else if (response.data?.status === "pending" || response.data?.status === "processing" || response.data?.status === "PROMPT_OPTIMIZING") {
        // Asynchronous generation - start polling
        if (generationId) {
          await handleAsyncGeneration(generationId, params);
        } else {
          throw new Error("No generation ID returned for async operation");
        }
      } else {
        // Unknown status
        toast.info(t("generationStarted"));
      }
      
      // Refresh history after generation submission
      setTimeout(() => {
        setGenerationTrigger(prev => prev + 1);
      }, 500);
      
    } catch (error) {
      console.error("Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : t("unknownError");
      toast.error(t("generationFailed", { error: errorMessage }));
      
      // If we have a generation ID, stop any polling for it
      if (generationId) {
        stopPolling(generationId);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generation submission
  const handleGenerate = async () => {
    if (!user?.uuid) {
      toast.error(t("pleaseSignInToGenerate"));
      return;
    }

    if (!prompt.trim()) {
      toast.error(t("pleaseEnterDescription"));
      return;
    }

    if (!uploadedImageUrl) {
      toast.error(t("pleaseUploadImage"));
      return;
    }

    if (leftCredits !== null && leftCredits < requiredCredits) {
      toast.error(t("insufficientCredits", { credits: requiredCredits }));
      return;
    }

    const params: ImageGenerationParams = {
      prompt,
      model: selectedModel,
      mode: "image-edit",
      image_urls: uploadedImageUrl ? [uploadedImageUrl] : undefined,
      enable_prompt_enhancement: enablePromptEnhancement,
    };

    // 基于积分的CAPTCHA判断
    if (needsCaptcha()) {
      // 新用户需要CAPTCHA验证
      setPendingCaptchaParams(params);
      setShowCaptchaModal(true);
      return;
    }

    // 直接执行生成
    await executeGeneration(params);
  };

  // Handle completed generation (synchronous)
  const handleCompletedGeneration = async (result: ImageGenerationResult, params: ImageGenerationParams) => {
    console.log("Handling completed generation:", result);
    
    // Create completed image object for immediate display
    const completedImageObj: HistoryImageResult = {
      id: result.id,
      prompt: params.prompt,
      image_url: result.image_url,
      status: result.status,
      model: params.model,
      created_at: result.created_at || new Date().toISOString(),
      updated_at: result.updated_at || new Date().toISOString(),
    };
    
    setNewImage(completedImageObj);
    
    toast.success(t("generationCompleted"), {
      duration: 3000,
    });
  };

  // Handle async generation with polling
  const handleAsyncGeneration = async (generationId: string, params: ImageGenerationParams) => {
    // Add to polling set
    setPollingGenerations(prev => new Set(prev).add(generationId));
    
    // Show initial toast
    toast.info(t("generationStatusChecking"), {
      duration: 3000,
    });

    // Create pending image object for immediate display
    const pendingImageObj: HistoryImageResult = {
      id: generationId,
      prompt: params.prompt,
      image_url: null,
      status: params.enable_prompt_enhancement ? "prompt_optimizing" : "pending",
      model: params.model,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setNewImage(pendingImageObj);

    // Start smart polling with callbacks
    const cleanup = startSmartPolling(
      generationId,
      // onUpdate callback
      async (result: ImageGenerationResult) => {
        console.log(`Status update for ${generationId}:`, result.status);
        
        // Update the image object with new status
        const updatedImageObj: HistoryImageResult = {
          id: generationId,
          prompt: params.prompt,
          image_url: result.image_url,
          status: result.status,
          model: params.model,
          created_at: result.created_at || new Date().toISOString(),
          updated_at: result.updated_at || new Date().toISOString(),
        };
        
        setNewImage(updatedImageObj);
        
        // Show status update toast for significant changes
        if (result.status === "processing") {
          toast.info(t("generationInProgress"), { duration: 2000 });
        }
      },
      // onComplete callback
      async (result: ImageGenerationResult) => {
        console.log(`Generation completed for ${generationId}`);
        
        // Remove from polling set
        setPollingGenerations(prev => {
          const newSet = new Set(prev);
          newSet.delete(generationId);
          return newSet;
        });
        
        // Create final completed image object
        const completedImageObj: HistoryImageResult = {
          id: generationId,
          prompt: params.prompt,
          image_url: result.image_url,
          status: result.status,
          model: params.model,
          created_at: result.created_at || new Date().toISOString(),
          updated_at: result.updated_at || new Date().toISOString(),
        };
        
        setNewImage(completedImageObj);
        
        // Show success toast
        if (result.image_url) {
          toast.success(t("generationCompleted"), {
            duration: 3000,
          });
        } else {
          toast.success(t("generationCompleted"));
        }
        
        // Refresh history after completion
        setTimeout(() => {
          setGenerationTrigger(prev => prev + 1);
        }, 1000);
        
        // Cleanup
        cleanupFunctionsRef.current.delete(generationId);
      },
      // onError callback
      async (error: string) => {
        console.error(`Generation failed for ${generationId}:`, error);
        
        // Remove from polling set
        setPollingGenerations(prev => {
          const newSet = new Set(prev);
          newSet.delete(generationId);
          return newSet;
        });
        
        // Create error image object
        const errorImageObj: HistoryImageResult = {
          id: generationId,
          prompt: params.prompt,
          image_url: null,
          status: "failed",
          model: params.model,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setNewImage(errorImageObj);
        
        toast.error(t("generationFailed", { error }));
        
        // Refresh history after error
        setTimeout(() => {
          setGenerationTrigger(prev => prev + 1);
        }, 1000);
        
        // Cleanup
        cleanupFunctionsRef.current.delete(generationId);
      }
    );

    // Store cleanup function
    cleanupFunctionsRef.current.set(generationId, cleanup);
  };

  // Stop polling for a specific generation
  const stopPolling = (generationId: string) => {
    const cleanup = cleanupFunctionsRef.current.get(generationId);
    if (cleanup) {
      cleanup();
      cleanupFunctionsRef.current.delete(generationId);
      setPollingGenerations(prev => {
        const newSet = new Set(prev);
        newSet.delete(generationId);
        return newSet;
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-full">
      {/* Image to Image Generator */}
      <div className="bg-gray-900 rounded-xl shadow-lg image-generator-container flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-full">
        {/* Scrollable content area */}
        <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
          <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
            {/* Image Upload Section */}
            <div>
              <div className="text-white text-lg font-semibold mb-4">
                {t("image")}
              </div>
              {!uploadedImage ? (
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
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300 px-2 text-center">
                      {t("clickToUpload")}
                    </p>
                    <p className="text-xs text-gray-400 px-2 text-center">
                      {t("supportedFormats")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || ""}
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
                        <span className="text-white text-sm">{t("uploading")}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
                <div className="text-white text-lg font-semibold">
                  {t("prompt")}
                </div>
                {/* Prompt Enhancement Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {t("promptEnhancement")}
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
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={descriptionPlaceholder || t("imageToImagePlaceholder")}
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

              {/* AI Model Display - Fixed to Nano Banana Edit */}
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
                          {t("nanoBananaDisplayName")} Edit
                        </span>
                        <div className="flex items-center gap-1 text-xs text-blue-300">
                          <Coins className="h-3 w-3" />
                          2 credits
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 mb-1">
                        Advanced AI model for image-to-image editing and transformation
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

        {/* Generate Button - Fixed at bottom */}
        <div className="border-t border-gray-600 bg-gray-900/95 backdrop-blur-sm p-4 md:p-6 mt-auto">
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !prompt.trim() ||
              !uploadedImageUrl ||
              (leftCredits !== null && leftCredits < requiredCredits)
            }
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px]"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                <span className="truncate">{t("generating")}</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                <span className="truncate">{t("transformImage")}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image to Image History */}
      <ImageHistoryForGeneration
        refreshTrigger={generationTrigger}
        userId={user?.uuid}
        newImage={newImage}
        mode="image-to-image"
      />

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
