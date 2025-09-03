"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import ImageHistory from "../image-history";
import useImageGeneration from "@/hooks/useImageGeneration";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import { useAppContext } from "@/contexts/app";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Coins, Wand2, X } from "lucide-react";
import useCredits from "@/hooks/useCredits";

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
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedModel = "nano-banana-edit";
  const requiredCredits = 2;

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

    if (imageUrls.length === 0) {
      toast.error(t("pleaseUploadImage"));
      return;
    }

    if (leftCredits !== null && leftCredits < requiredCredits) {
      toast.error(t("insufficientCredits", { credits: requiredCredits }));
      return;
    }

    setIsGenerating(true);
    let generationId: string | null = null;

    try {
      console.log("Starting image-to-image generation with params:", { prompt, model: selectedModel, imageUrls });
      
      const params: ImageGenerationParams = {
        prompt,
        model: selectedModel,
        mode: "image-edit",
        image_urls: imageUrls,
      };
      
      // Submit generation request
      const response = await submitGeneration(params);
      
      if (!response?.success) {
        throw new Error(response?.message || "Failed to submit generation request");
      }

      console.log("Generation submitted successfully:", response);
      generationId = response.data?.id || null;
      
      // Track generation event
      trackImageGeneration(params.model, params.prompt);
      
      // Handle different response types
      if (response.data?.status === "completed" && response.data.image_url) {
        // Synchronous completion - image already generated
        await handleCompletedGeneration(response.data, params);
      } else if (response.data?.status === "pending" || response.data?.status === "processing") {
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
      status: "pending",
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
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files)}
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

            {/* Prompt Input */}
            <div>
              <div className="text-white text-lg font-semibold mb-4">
                {t("prompt")}
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
              imageUrls.length === 0 ||
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
      <ImageHistory
        refreshTrigger={generationTrigger}
        userId={user?.uuid}
        newImage={newImage}
        filterMode="image-to-image"
      />
    </div>
  );
}
