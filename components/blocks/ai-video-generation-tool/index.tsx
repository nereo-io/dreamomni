"use client";

import { useState, useEffect } from "react";
import type React from "react";
import VideoGenerator from "../video-generator";
import VideoHistory from "../video-history";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import type { VideoGenerationParams } from "../video-generator";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import { useAppContext } from "@/contexts/app";

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
    <div className="max-w-7xl mx-auto mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8">
        <VideoGenerator
          mode={mode}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          descriptionLabel={descriptionLabel}
          descriptionPlaceholder={descriptionPlaceholder}
          onModelChange={setCurrentSelectedModel}
        />

        <VideoHistory
          refreshTrigger={generationTrigger}
          selectedModel={currentSelectedModel}
          mode={mode}
        />
      </div>
    </div>
  );
}
