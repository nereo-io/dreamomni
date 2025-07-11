"use client";

import { useState } from "react";
import type React from "react";
import VideoGenerator from "../video-generator";
import VideoHistory from "../video-history";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import type { VideoGenerationParams } from "../video-generator";
import useCredits from "@/hooks/useCredits";

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
  const { submitGeneration, pollStatus } = useVideoGeneration();
  const { updateLeftCredits, setCredits } = useCredits();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTrigger, setGenerationTrigger] = useState(0);

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
      // 立即更新积分显示（从API响应获取）
      if (result.userCredits) {
        // 直接使用API返回的积分值，无需额外API调用
        setCredits(result.userCredits.remainingCredits);
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
        />

        <VideoHistory refreshTrigger={generationTrigger} />
      </div>
    </div>
  );
}
