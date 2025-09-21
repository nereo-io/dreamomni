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
import { Image as ImageIcon, Coins, Wand2, X } from "lucide-react";
import useCredits from "@/hooks/useCredits";
import { validateImage } from "@/config/image-validation-rules";

import type { ImageGenerationParams } from "../image-generator";
import type { ImageGenerationResult } from "@/hooks/useImageGeneration";
import type { ImageGenerationResult as HistoryImageResult } from "../image-history";

interface ImageGenerationTabProps {
  mode: "text-to-image" | "image-to-image";
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  promptValue?: string;
  onPromptChange?: (value: string) => void;
}

// Helper function to map statuses between different types
const mapStatusForHistory = (
  status: string
):
  | "pending"
  | "completed"
  | "failed"
  | "in_progress"
  | "in_queue"
  | "saved_to_r2" => {
  switch (status) {
    case "processing":
    case "PROMPT_OPTIMIZING":
    case "prompt_optimizing":
      return "in_progress";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "pending":
    default:
      return "pending";
  }
};

export default function ImageGenerationTab({
  mode,
  descriptionLabel,
  descriptionPlaceholder,
  promptValue,
  onPromptChange,
}: ImageGenerationTabProps) {
  const { submitGeneration, pollStatus, startSmartPolling } =
    useImageGeneration();
  const { trackImageGeneration } = useYandexTracking();
  const { user, setShowSignModal, setShowPricingModal } = useAppContext();
  const t = useTranslations("imageGenerator");
  const {
    leftCredits,
    updateLeftCredits,
    setCredits,
    isLoading: creditsLoading,
    hasInitialized,
  } = useCredits();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTrigger, setGenerationTrigger] = useState(0);
  const [newImage, setNewImage] = useState<HistoryImageResult | undefined>();
  const [pollingGenerations, setPollingGenerations] = useState<Set<string>>(
    new Set()
  );
  const isControlledPrompt = typeof onPromptChange === "function";
  const [internalPrompt, setInternalPrompt] = useState("");
  const prompt = isControlledPrompt ? promptValue ?? "" : internalPrompt;

  // Image upload states (only for image-to-image mode)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(
    new Set()
  );
  const [isDragOver, setIsDragOver] = useState(false);

  // CAPTCHA related states
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [pendingCaptchaParams, setPendingCaptchaParams] =
    useState<ImageGenerationParams | null>(null);

  // Image generation settings
  const [outputFormat] = useState<"png" | "jpeg">("png"); // 默认使用 PNG，暂时不显示选择器
  const [imageSize, setImageSize] = useState<
    "auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9"
  >("auto");

  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mode-specific configuration
  const isImageToImage = mode === "image-to-image";
  const selectedModel = isImageToImage
    ? "nano-banana-edit"
    : "google/nano-banana";
  const requiredCredits = 2;

  // 检查是否需要CAPTCHA验证（基于积分）
  const needsCaptcha = useCallback(() => {
    // 新用户（积分<=10）需要CAPTCHA验证，防止薅羊毛
    return user?.uuid && leftCredits !== null && leftCredits <= 10;
  }, [user?.uuid, leftCredits]);

  // 页面加载时主动查询积分
  useEffect(() => {
    if (user?.uuid && !hasInitialized) {
      updateLeftCredits().catch((error) => {
        console.error("Failed to fetch credits on mount:", error);
      });
    }
  }, [user?.uuid, hasInitialized, updateLeftCredits]);

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup all active polling
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
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

  const handlePromptChange = useCallback(
    (value: string) => {
      if (value.length > 1000) {
        return;
      }

      if (isControlledPrompt) {
        onPromptChange?.(value);
      } else {
        setInternalPrompt(value);
      }
    },
    [isControlledPrompt, onPromptChange]
  );

  // Handle image upload - support up to 5 images
  const handleImageUpload = async (files: FileList) => {
    const isUserLoggedIn = !!user?.uuid;

    if (!isUserLoggedIn) {
      setShowSignModal(true);
    }

    // Continue processing the image for preview even if user is not logged in

    const fileArray = Array.from(files);
    const maxImages = 5;
    const remainingSlots = maxImages - uploadedImages.length;

    // Check if adding these files would exceed the limit
    if (fileArray.length > remainingSlots) {
      toast.error(t("maxImagesExceeded", { max: remainingSlots }));
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const validationResult = await validateImage(file, selectedModel);
      if (!validationResult.valid) {
        toast.error(
          validationResult.error || `Invalid image file: ${file.name}`
        );
        return;
      }
    }

    // Add new images to state immediately for preview
    const newImageIndices: number[] = [];
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const newIndex = uploadedImages.length + i;
      newImageIndices.push(newIndex);
      newFiles.push(file);

      // Generate preview immediately
      const reader = new FileReader();
      const preview = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(preview);
    }

    // Add new images to state
    setUploadedImages((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Only perform actual upload if user is logged in
    if (isUserLoggedIn) {
      console.log("🔄 Starting image upload...");

      // Set uploading state for all new images
      setUploadingImages((prev) => new Set([...prev, ...newImageIndices]));

      try {
        const uploadPromises = fileArray.map(async (file, index) => {
          const actualIndex = uploadedImages.length + index;

          try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            const uploadResult = await uploadResponse.json();
            if (uploadResult.code === 0) {
              return { file, url: uploadResult.data.url, index: actualIndex };
            } else {
              throw new Error(uploadResult.message || "Upload failed");
            }
          } catch (error) {
            console.error("Error uploading individual file:", error);
            // Remove from uploading state on error
            setUploadingImages((prev) => {
              const newSet = new Set(prev);
              newSet.delete(actualIndex);
              return newSet;
            });
            throw error;
          }
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Update URLs
        const newUrls = new Array(
          uploadedImageUrls.length + fileArray.length
        ).fill(null);
        uploadResults.forEach((result) => {
          newUrls[result.index] = result.url;
        });

        // Fill existing URLs
        uploadedImageUrls.forEach((url, index) => {
          if (url) newUrls[index] = url;
        });

        setUploadedImageUrls(newUrls.filter((url) => url !== null));

        // Remove from uploading state
        setUploadingImages((prev) => {
          const newSet = new Set(prev);
          newImageIndices.forEach((index) => newSet.delete(index));
          return newSet;
        });

        toast.success(
          t("imagesUploadedSuccessfully", { count: uploadResults.length })
        );
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(t("uploadFailed"));

        // Remove from uploading state
        setUploadingImages((prev) => {
          const newSet = new Set(prev);
          newImageIndices.forEach((index) => newSet.delete(index));
          return newSet;
        });
      }
    } else {
      console.log("User not logged in, only showing image preview.");
      // For not logged in users, we just show the preview without actual upload
    }
  };

  // Load data from localStorage on component mount
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // For text-to-image mode
      if (mode === "text-to-image") {
        const savedPrompt = localStorage.getItem("nanoBananaPrompt");
        if (savedPrompt && !prompt.trim()) {
          // Only set the prompt if it's empty
          handlePromptChange(savedPrompt);
          // Clear the saved data after using it
          localStorage.removeItem("nanoBananaPrompt");
        }
      }
      // For image-to-image mode
      else if (mode === "image-to-image") {
        const savedImageData = localStorage.getItem("nanoBananaImage");
        console.log(
          "Loading image from localStorage:",
          !!savedImageData,
          "Uploaded images count:",
          uploadedImages.length
        );

        if (savedImageData && uploadedImages.length === 0) {
          try {
            // Create a Blob from the base64 data
            console.log("Processing image data...");
            const base64Part = savedImageData.split(",")[1];
            const byteCharacters = atob(base64Part);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "image/jpeg" });

            // Create a File object from the blob
            const file = new File([blob], "nano-banana-image.jpg", {
              type: "image/jpeg",
            });

            console.log("Image file created:", file.name, file.size);

            // Check if user is logged in before uploading
            if (!user?.uuid) {
              console.log("User not logged in, showing sign modal...");
              // Just show preview without uploading
              const previewUrl = URL.createObjectURL(blob);
              setUploadedImages([file]);
              setImagePreviews([previewUrl]);
              setShowSignModal(true);
            } else {
              console.log("User logged in, creating FileList...");
              // Create a FileList-like object
              const fileList = new DataTransfer();
              fileList.items.add(file);

              // Upload the image
              console.log("Uploading image...");
              handleImageUpload(fileList.files);
            }

            // Clear the saved data after using it
            localStorage.removeItem("nanoBananaImage");
          } catch (error) {
            console.error("Error processing image from localStorage:", error);
            // Clear the invalid data
            localStorage.removeItem("nanoBananaImage");
          }
        }
      }
    }
  }, [
    mode,
    user?.uuid,
    prompt,
    uploadedImages.length,
    handlePromptChange,
    handleImageUpload,
  ]);

  const applyPromptFromShowcase = useCallback(
    async (
      value: string,
      aspectRatio?: string,
      model?: string,
      imageUrl?: string
    ) => {
      handlePromptChange(value);

      // For image-to-image mode, also load the image if provided
      if (isImageToImage && imageUrl) {
        try {
          // Download the image through proxy to avoid CORS issues
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(
            imageUrl
          )}`;
          const response = await fetch(proxyUrl);
          const blob = await response.blob();

          // Create a File object from the blob
          const fileName = imageUrl.split("/").pop() || "showcase-image.jpg";
          const file = new File([blob], fileName, { type: blob.type });

          // Create preview URL
          const previewUrl = URL.createObjectURL(blob);

          // Clear existing images and set the new one
          setUploadedImages([file]);
          setImagePreviews([previewUrl]);
          setUploadedImageUrls([imageUrl]);

          toast.success(t("showcaseImageLoaded"));
        } catch (error) {
          console.error("Failed to load showcase image:", error);
          toast.error(t("failedToLoadShowcaseImage"));
        }
      }

      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          const caretPosition = value.length;
          textarea.setSelectionRange(caretPosition, caretPosition);
        }
      });
    },
    [handlePromptChange, isImageToImage, t]
  );

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Adjust indices for remaining items
      const adjustedSet = new Set<number>();
      newSet.forEach((idx) => {
        if (idx > index) {
          adjustedSet.add(idx - 1);
        } else if (idx < index) {
          adjustedSet.add(idx);
        }
      });
      return adjustedSet;
    });
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
    // Clear the input value to allow selecting the same file again
    e.target.value = "";
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
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
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
      console.log(`Starting ${mode} generation with params:`, params);

      // Submit generation request
      const response = await submitGeneration(params);

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to submit generation request"
        );
      }

      console.log("Generation submitted successfully:", response);
      generationId = response.data?.id || null;

      // 生成请求提交成功后立即更新积分显示
      // 因为后端API已经扣除了积分，前端需要立即反映这个变化
      try {
        await updateLeftCredits();
        console.log(
          "✅ Credits updated after successful generation submission"
        );
      } catch (error) {
        console.error("❌ Failed to update credits display:", error);
        // 不阻塞生成流程，但记录错误
      }

      // Track generation event
      trackImageGeneration(params.model, params.prompt);

      // Handle different response types
      if (response.data?.status === "completed" && response.data.image_url) {
        // Synchronous completion - image already generated
        // Map response data to ImageGenerationResult format
        const result: ImageGenerationResult = {
          id: response.data.id,
          prompt: params.prompt,
          image_url: response.data.image_url,
          status: "completed",
          model: params.model,
          mode: params.mode as "text-to-image" | "image-edit",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          credits_used: requiredCredits,
        };
        await handleCompletedGeneration(result, params);
      } else if (
        response.data?.status === "pending" ||
        response.data?.status === "processing" ||
        response.data?.status === "PROMPT_OPTIMIZING"
      ) {
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
        setGenerationTrigger((prev) => prev + 1);
      }, 500);
    } catch (error) {
      console.error("Generation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("unknownError");
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

    // Check for image upload in image-to-image mode
    if (isImageToImage && uploadedImageUrls.length === 0) {
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
      mode: isImageToImage ? "image-edit" : "text-to-image",
      image_urls:
        isImageToImage && uploadedImageUrls.length > 0
          ? uploadedImageUrls
          : undefined,
      enable_prompt_enhancement: false,
      output_format: outputFormat,
      image_size: imageSize,
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
  const handleCompletedGeneration = async (
    result: ImageGenerationResult,
    params: ImageGenerationParams
  ) => {
    console.log("Handling completed generation:", result);

    // Create completed image object for immediate display
    const completedImageObj: HistoryImageResult = {
      id: result.id,
      prompt: params.prompt,
      image_url: result.image_url,
      status: mapStatusForHistory(result.status),
      model: params.model,
      image_size: params.image_size || "1:1",
      quality: "standard",
      credits_used: requiredCredits,
      created_at: result.created_at || new Date().toISOString(),
      updated_at: result.updated_at || new Date().toISOString(),
    };

    setNewImage(completedImageObj);

    toast.success(t("generationCompleted"), {
      duration: 3000,
    });
  };

  // Handle async generation with polling
  const handleAsyncGeneration = async (
    generationId: string,
    params: ImageGenerationParams
  ) => {
    // Add to polling set
    setPollingGenerations((prev) => new Set(prev).add(generationId));

    // Show initial toast
    toast.info(t("generationStatusChecking"), {
      duration: 3000,
    });

    // Create pending image object for immediate display
    const pendingImageObj: HistoryImageResult = {
      id: generationId,
      prompt: params.prompt,
      image_url: undefined,
      status: "pending",
      model: params.model,
      image_size: "1:1",
      quality: "standard",
      credits_used: requiredCredits,
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
          status: mapStatusForHistory(result.status),
          model: params.model,
          image_size: "1:1",
          quality: "standard",
          credits_used: requiredCredits,
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
        setPollingGenerations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(generationId);
          return newSet;
        });

        // Create final completed image object
        const completedImageObj: HistoryImageResult = {
          id: generationId,
          prompt: params.prompt,
          image_url: result.image_url,
          status: mapStatusForHistory(result.status),
          model: params.model,
          image_size: "1:1",
          quality: "standard",
          credits_used: requiredCredits,
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
          setGenerationTrigger((prev) => prev + 1);
        }, 1000);

        // Cleanup
        cleanupFunctionsRef.current.delete(generationId);
      },
      // onError callback
      async (error: string) => {
        console.error(`Generation failed for ${generationId}:`, error);

        // Remove from polling set
        setPollingGenerations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(generationId);
          return newSet;
        });

        // Create error image object
        const errorImageObj: HistoryImageResult = {
          id: generationId,
          prompt: params.prompt,
          image_url: undefined,
          status: "failed",
          model: params.model,
          image_size: "1:1",
          quality: "standard",
          credits_used: 0, // No credits used on failure
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setNewImage(errorImageObj);

        toast.error(t("generationFailed", { error }));

        // Refresh history after error
        setTimeout(() => {
          setGenerationTrigger((prev) => prev + 1);
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
      setPollingGenerations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(generationId);
        return newSet;
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-full">
      {/* Image Generator */}
      <div className="bg-gray-900 rounded-xl shadow-lg image-generator-container flex flex-col flex-shrink-0 w-full lg:w-[420px] lg:overflow-hidden lg:h-[calc(100vh-90px)] lg:max-h-[calc(100vh-90px)]">
        {/* Scrollable content area */}
        <div className="lg:flex-1 lg:overflow-y-auto lg:dark-scrollbar">
          <div className="space-y-4 md:space-y-5 px-4 md:px-6 py-4 md:py-5">
            {/* Image Upload Section (only for image-to-image) */}
            {isImageToImage && (
              <div>
                <div className="text-white text-lg font-semibold mb-4">
                  {t("images")} ({uploadedImages.length}/5)
                </div>
                {uploadedImages.length === 0 ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      isDragOver
                        ? "border-blue-400 bg-blue-900/50"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      const input = document.getElementById(
                        "image-upload"
                      ) as HTMLInputElement;
                      if (input) {
                        const remainingSlots = 5 - uploadedImages.length;
                        input.setAttribute(
                          "data-max-files",
                          remainingSlots.toString()
                        );
                        input.click();
                      }
                    }}
                  >
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300 px-2 text-center">
                        {t("clickToUploadMultiple")}
                      </p>
                      <p className="text-xs text-gray-400 px-2 text-center">
                        {t("maxImages", { max: 5 })} -{" "}
                        {t("canUpload", { count: 5 })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {uploadedImages.map((image, index) => {
                        const isUploading = uploadingImages.has(index);
                        return (
                          <div key={index} className="relative">
                            <img
                              src={imagePreviews[index] || ""}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-32 object-contain rounded-lg bg-gray-800"
                            />
                            {!isUploading && (
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                  <span className="text-white text-sm">
                                    {t("uploading")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {uploadedImages.length < 5 && (
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                          isDragOver
                            ? "border-blue-400 bg-blue-900/50"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          const input = document.getElementById(
                            "image-upload-more"
                          ) as HTMLInputElement;
                          if (input) {
                            const remainingSlots = 5 - uploadedImages.length;
                            input.setAttribute(
                              "data-max-files",
                              remainingSlots.toString()
                            );
                            input.click();
                          }
                        }}
                      >
                        <input
                          id="image-upload-more"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center space-y-2">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                          <p className="text-gray-400 text-sm">
                            {t("addMoreImages")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("canUpload", {
                              count: 5 - uploadedImages.length,
                            })}
                            {uploadingImages.size > 0 && (
                              <span className="ml-2 text-blue-400">
                                ({uploadingImages.size} {t("uploading")})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Prompt Input */}
            <div>
              <div className="flex justify-between items-center text-white text-lg font-semibold mb-4">
                <span>{t("prompt")}</span>
                {prompt.length > 900 && (
                  <span className="text-sm font-normal text-gray-400">
                    {prompt.length}/1000
                  </span>
                )}
              </div>
              <Textarea
                id={`${mode}-prompt-input`}
                ref={textareaRef}
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder={
                  descriptionPlaceholder ||
                  (isImageToImage
                    ? t("imageToImagePlaceholder")
                    : t("textToImagePlaceholder"))
                }
                className="resize-none bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400 mt-0 overflow-y-auto"
                style={{ minHeight: "150px", maxHeight: "300px" }}
                disabled={isGenerating}
                maxLength={1000}
              />
            </div>

            {/* Settings */}
            <div>
              <div className="text-white text-lg font-semibold mb-4">
                {t("settings")}
              </div>

              {/* AI Model Display */}
              <div className="mb-4">
                <label className="text-gray-300 text-sm mb-2 block">
                  {t("model")}
                </label>
                <div className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">🍌</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">
                        {t("nanoBananaDisplayName")}
                        {isImageToImage ? " Edit" : ""}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-blue-300">
                        <Coins className="h-3 w-3" />2 credits
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Format - 暂时注释掉，默认使用 PNG */}
              {/* <div className="mb-4">
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
              </div> */}

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
                        onChange={(e) =>
                          setImageSize(e.target.value as typeof imageSize)
                        }
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
                      <span className="text-gray-300 text-sm">
                        {size.label}
                      </span>
                    </label>
                  ))}
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
              (isImageToImage && uploadedImageUrls.length === 0) ||
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
                  {isImageToImage ? t("transformImage") : t("generateImage")}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image History */}
      <ImageHistoryForGeneration
        refreshTrigger={generationTrigger}
        userId={user?.uuid}
        newImage={newImage}
        mode={isImageToImage ? "image-to-image" : "text-to-image"}
        onSelectShowcaseImage={(
          selectedPrompt,
          aspectRatio,
          model,
          imageUrl
        ) => {
          applyPromptFromShowcase(selectedPrompt, aspectRatio, model, imageUrl);
        }}
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
