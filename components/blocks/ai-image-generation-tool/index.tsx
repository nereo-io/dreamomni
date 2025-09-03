"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import ImageGenerator from "../image-generator";
import ImageHistory from "../image-history";
import useImageGeneration from "@/hooks/useImageGeneration";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import { useAppContext } from "@/contexts/app";

import type { ImageGenerationParams } from "../image-generator";
import type { ImageGenerationResult } from "@/hooks/useImageGeneration";
import type { ImageGenerationResult as HistoryImageResult } from "../image-history";

interface ImageGenerationToolProps {
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

export function LegacyImageGenerationTool({
  descriptionLabel,
  descriptionPlaceholder,
}: ImageGenerationToolProps) {
  const { submitGeneration, pollStatus, startSmartPolling, fetchHistory } = useImageGeneration();
  const { trackImageGeneration } = useYandexTracking();
  const { user } = useAppContext();
  const t = useTranslations("imageGenerator");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTrigger, setGenerationTrigger] = useState(0);
  const [currentSelectedModel, setCurrentSelectedModel] = useState<string>("");
  const [newImage, setNewImage] = useState<HistoryImageResult | undefined>();
  const [pollingGenerations, setPollingGenerations] = useState<Set<string>>(new Set());
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());

  // Cleanup polling when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup all active polling
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current.clear();
    };
  }, []);

  // Handle generation submission
  const handleGenerate = async (params: ImageGenerationParams) => {
    if (!user?.uuid) {
      toast.error(t("pleaseSignInToGenerate"));
      return;
    }

    setIsGenerating(true);
    let generationId: string | null = null;

    try {
      console.log("Starting image generation with params:", params);
      
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
      } else if (response.data?.status === "in_queue" || response.data?.status === "in_progress") {
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
      }, 500); // 延迟500ms刷新，确保数据库已更新
      
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
  const handleCompletedGeneration = async (data: any, params: ImageGenerationParams) => {
    const imageUrl = data.image_url || data.images?.[0]?.url;
    
    // Create new image object for immediate display
    const newImageObj: HistoryImageResult = {
      id: data.id || `temp-${Date.now()}`,
      prompt: params.prompt,
      image_url: imageUrl,
      status: "completed",
      model: params.model,
      aspect_ratio: "1:1",
      quality: "standard",
      style: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      credits_used: 1,
    };
    
    // Immediately show the new image in the history
    setNewImage(newImageObj);
    
    // Show completion notification
    toast.success(t("generationCompleted"), {
      duration: 3000,
    });
  };

  // Handle asynchronous generation with polling
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
      image_url: undefined,
      status: "pending",
      model: params.model,
      aspect_ratio: "1:1",
      quality: "standard", 
      style: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      credits_used: 1,
    };
    
    // Show pending image in history
    setNewImage(pendingImageObj);

    // Start smart polling
    const cleanup = startSmartPolling(
      generationId,
      // onUpdate callback
      (result: ImageGenerationResult) => {
        console.log(`Polling update for ${generationId}:`, result.status);
        
        // Update the image object with new status
        const updatedImageObj: HistoryImageResult = {
          ...pendingImageObj,
          status: result.status as any,
          image_url: result.image_url,
          updated_at: new Date().toISOString(),
          error_message: result.error_message,
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
        
        // Create completed image object
        const completedImageObj: HistoryImageResult = {
          ...pendingImageObj,
          status: "completed",
          image_url: result.image_url,
          updated_at: new Date().toISOString(),
        };
        
        setNewImage(completedImageObj);
        
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
        }, 1000); // 延迟1秒刷新历史记录
        
        // Cleanup
        cleanupFunctionsRef.current.delete(generationId);
      },
      // onError callback
      (error: string) => {
        console.error(`Generation failed for ${generationId}:`, error);
        
        // Remove from polling set
        setPollingGenerations(prev => {
          const newSet = new Set(prev);
          newSet.delete(generationId);
          return newSet;
        });
        
        // Update with error status
        const errorImageObj: HistoryImageResult = {
          ...pendingImageObj,
          status: "failed",
          error_message: error,
          updated_at: new Date().toISOString(),
        };
        
        setNewImage(errorImageObj);
        
        toast.error(t("generationFailed", { error }));
        
        // Refresh history after error
        setTimeout(() => {
          setGenerationTrigger(prev => prev + 1);
        }, 1000); // 延迟1秒刷新历史记录
        
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

  // Handle model change
  const handleModelChange = (model: string) => {
    setCurrentSelectedModel(model);
  };

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <ImageGenerator
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          descriptionLabel={descriptionLabel}
          descriptionPlaceholder={descriptionPlaceholder}
          onModelChange={handleModelChange}
        />

        <ImageHistory
          refreshTrigger={generationTrigger}
          userId={user?.uuid}
          newImage={newImage}
        />
      </div>
    </div>
  );
}

// Export the new tab-based component as the default
export { TabImageGenerationTool as ImageGenerationTool } from "./TabImageGenerationTool";
