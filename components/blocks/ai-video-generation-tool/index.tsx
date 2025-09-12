"use client";

import { useState, useEffect, useMemo } from "react";
import type React from "react";
import VideoGenerator from "../video-generator";
import VideoHistory from "../video-history";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import { toast } from "sonner";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import { useAppContext } from "@/contexts/app";
import type { VideoEffect } from "@/types/video-effect";

import type { VideoGenerationParams } from "../video-generator";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";

interface VideoGenerationToolProps {
  mode: "text-to-video" | "image-to-video";
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  // Simplified: Just pass the complete effect object
  effect?: VideoEffect;
}

export function VideoGenerationTool({
  mode,
  descriptionLabel,
  descriptionPlaceholder,
  effect,
}: VideoGenerationToolProps) {
  const { submitGeneration, pollStatus, fetchHistory } = useVideoGeneration();
  const { trackVideoGeneration, trackFirstVideo } = useYandexTracking();
  const { user } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTrigger, setGenerationTrigger] = useState(0);
  const [currentSelectedModel, setCurrentSelectedModel] = useState<string>("");
  const [showcaseVideoParams, setShowcaseVideoParams] = useState<{
    prompt: string;
    aspectRatio: string;
    duration: number;
    model?: string;
    imageUrl?: string;
  } | null>(null);
  const [editVideoData, setEditVideoData] =
    useState<VideoGenerationResult | null>(null);
  const [userVideoCount, setUserVideoCount] = useState<number>(0);
  
  // Extract configuration from effect object
  const effectConfig = useMemo(() => {
    if (!effect) return null;
    
    // Debug: 打印 effect 对象
    console.log('Effect object:', effect);
    
    return {
      creditsRequired: effect.credits_required,
      // Use different model based on effect_type
      forceModel: effect.effect_type === 'pixverse_template' 
        ? 'pixverse-template' 
        : 'minimax-hailuo02-image-to-video',
      promptTemplate: effect.prompt_template,
      effectType: effect.effect_type,
      pixverseTemplateId: effect.pixverse_template_id,
      // Always pass showcase data, let video-history component decide when to show it
      showcaseData: effect.preview_video ? {
        videos: [{
          id: `showcase-${effect.id}`,
          video_url: effect.preview_video,
          thumbnail_url: effect.preview_image || undefined,
          title: effect.title,
          description: effect.page_description || undefined,
          duration: 5, // Most effect preview videos are 5 seconds
        }]
      } : undefined
    };
  }, [effect]);

  // Handle showcase video selection
  const handleShowcaseVideoSelect = (
    prompt: string,
    aspectRatio: string,
    duration: number,
    model?: string,
    imageUrl?: string
  ) => {
    setShowcaseVideoParams({ prompt, aspectRatio, duration, model, imageUrl });
  };

  // Handle edit video - populate form with existing video data
  const handleEditVideo = (generation: VideoGenerationResult) => {
    setEditVideoData(generation);
    toast.success("Video data loaded for editing");
  };

  // Handle regenerate video - submit with existing parameters
  const handleRegenerateVideo = async (generation: VideoGenerationResult) => {
    setIsGenerating(true);

    try {
      const params: VideoGenerationParams = {
        model: generation.model_id,
        prompt: generation.prompt,
        duration: generation.duration_seconds?.toString() || "5",
        aspect_ratio: generation.aspect_ratio || "16:9",
        resolution: "480p", // Default resolution, could be extracted if stored
        generate_audio: true, // Default value, could be extracted if stored
        enable_prompt_enhancement: !!generation.optimized_prompt,
        image_url: generation.image_url,
      };

      const result = await submitGeneration(params);

      if (result) {
        // Start polling for the new video
        pollStatus(result.id);

        // Trigger history refresh
        setTimeout(() => {
          setGenerationTrigger((prev) => prev + 1);
          setIsGenerating(false);
        }, 2000);

        toast.success("Video regeneration started");
      } else {
        setIsGenerating(false);
        toast.error("Failed to regenerate video");
      }
    } catch (error) {
      console.error("Regeneration error:", error);
      setIsGenerating(false);
      toast.error("Failed to regenerate video");
    }
  };

  // 获取用户视频历史记录数量
  useEffect(() => {
    const getUserVideoCount = async () => {
      if (user?.uuid) {
        try {
          const historyData = await fetchHistory(1, 1); // 只需要获取总数
          if (
            historyData &&
            historyData.pagination &&
            typeof historyData.pagination.total === "number"
          ) {
            setUserVideoCount(historyData.pagination.total);
          }
        } catch (error) {
          console.error("Error fetching video history:", error);
        }
      }
    };
    getUserVideoCount();
  }, [user?.uuid, fetchHistory]);

  // 处理视频生成
  const handleGenerate = async (params: VideoGenerationParams) => {
    setIsGenerating(true);

    // Apply effect modifications if present
    let finalParams = { ...params };
    let pixverseImgIds: number[] | undefined;
    
    if (effectConfig) {
      // Override model if specified
      if (effectConfig.forceModel) {
        finalParams.model = effectConfig.forceModel;
      }
      
      // Apply prompt template if provided  
      if (effectConfig.promptTemplate) {
        finalParams.prompt = effectConfig.promptTemplate.replace('{{USER_PROMPT}}', params.prompt);
      }
      
      // Handle PixVerse template effects
      if (effectConfig.effectType === 'pixverse_template' && params.pixverse_img_id) {
        // Use pixverse_img_id from video-generator component
        // video-generator handles the upload during image selection
        pixverseImgIds = [params.pixverse_img_id];
      }
    }

    const result = await submitGeneration({
      model: finalParams.model,
      prompt: finalParams.prompt,
      duration: finalParams.duration,
      aspect_ratio: finalParams.aspect_ratio,
      resolution: finalParams.resolution,
      generate_audio: finalParams.generate_audio,
      enable_prompt_enhancement: finalParams.enable_prompt_enhancement,
      image_url: finalParams.image_url,
      captchaToken: finalParams.captchaToken, // Pass CAPTCHA token
      // Pass effect-related params
      ...(effect && { 
        effect_id: effect.id,
        effect_type: effectConfig?.effectType,
        pixverse_img_ids: pixverseImgIds
      }),
    });

    if (result) {
<<<<<<< HEAD
=======
      // Track video generation success
      const duration = parseInt(params.duration) || 5;
      trackVideoGeneration(params.model, duration, params.model);

      // Note: First video tracking is handled by video-history component now

>>>>>>> upstream/main
      // 开始轮询状态
      pollStatus(result.id);

      // 触发历史列表刷新
      setTimeout(() => {
        setGenerationTrigger((prev) => prev + 1);
        setIsGenerating(false);
      }, 2000);
    } else {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row gap-2 h-full">
        <VideoGenerator
          mode={mode}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          descriptionLabel={descriptionLabel}
          descriptionPlaceholder={descriptionPlaceholder}
          onModelChange={setCurrentSelectedModel}
          showcaseVideoParams={showcaseVideoParams}
          onShowcaseVideoParamsUsed={() => setShowcaseVideoParams(null)}
          editVideoData={editVideoData}
          onEditVideoDataUsed={() => setEditVideoData(null)}
          // Pass effect configuration (extracted from effect object)
          effect={effect}
          forceModel={effectConfig?.forceModel}
          creditsOverride={effectConfig?.creditsRequired}
        />

        <VideoHistory
          refreshTrigger={generationTrigger}
          selectedModel={currentSelectedModel}
          mode={mode}
          onSelectShowcaseVideo={handleShowcaseVideoSelect}
          onEditVideo={handleEditVideo}
          onRegenerateVideo={handleRegenerateVideo}
          showcaseData={effectConfig?.showcaseData}
        />
      </div>
    </div>
  );
}
