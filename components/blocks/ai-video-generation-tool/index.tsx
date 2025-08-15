"use client";

import { useState, useEffect } from "react";
import type React from "react";
import VideoGenerator from "../video-generator";
import VideoHistory from "../video-history";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import { toast } from "sonner";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import { useAppContext } from "@/contexts/app";


import type { VideoGenerationParams } from "../video-generator";
import type { VideoGenerationResult } from "@/hooks/useVideoGeneration";

interface VideoGenerationToolProps {
  mode: "text-to-video" | "image-to-video";
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
}

export function VideoGenerationTool({
  mode,
  descriptionLabel,
  descriptionPlaceholder,
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
  } | null>(null);
  const [editVideoData, setEditVideoData] = useState<VideoGenerationResult | null>(null);

  // Handle showcase video selection
  const handleShowcaseVideoSelect = (prompt: string, aspectRatio: string, duration: number) => {
    setShowcaseVideoParams({ prompt, aspectRatio, duration });
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
  const [userVideoCount, setUserVideoCount] = useState<number | null>(null);

  // 获取用户视频历史记录数量
  useEffect(() => {
    const getUserVideoCount = async () => {
      if (user?.uuid) {
        try {
          const historyData = await fetchHistory(1, 1); // 只需要获取总数
          if (historyData && historyData.pagination && typeof historyData.pagination.total === 'number') {
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

    const result = await submitGeneration({
      model: params.model,
      prompt: params.prompt,
      duration: params.duration,
      aspect_ratio: params.aspect_ratio,
      resolution: params.resolution,
      generate_audio: params.generate_audio,
      enable_prompt_enhancement: params.enable_prompt_enhancement,
      image_url: params.image_url,
    });

    if (result) {
      // Track video generation success
      const duration = parseInt(params.duration) || 5;
      trackVideoGeneration(params.model, duration, params.model);

      // 检查是否是用户的第一个视频
      if (user?.uuid && userVideoCount === 0) {
        trackFirstVideo(user.uuid);
      }

      // 更新视频计数
      if (userVideoCount !== null) {
        setUserVideoCount(userVideoCount + 1);
      }

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
      <div className="flex flex-col lg:flex-row gap-4 h-full">
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
        />

        <VideoHistory
          refreshTrigger={generationTrigger}
          selectedModel={currentSelectedModel}
          mode={mode}
          onSelectShowcaseVideo={handleShowcaseVideoSelect}
          onEditVideo={handleEditVideo}
          onRegenerateVideo={handleRegenerateVideo}
        />
      </div>
    </div>
  );
}
