"use client";

import { useState } from "react";
import type React from "react";
import VideoGenerator from "../video-generator";
import VideoHistory from "../video-history";
import useVideoGeneration from "@/hooks/useVideoGeneration";
import type { VideoGenerationParams } from "../video-generator";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTrigger, setGenerationTrigger] = useState(0);
  const [currentSelectedModel, setCurrentSelectedModel] = useState<string>("");
  const [showcaseVideoParams, setShowcaseVideoParams] = useState<{
    prompt: string;
    aspectRatio: string;
    duration: number;
  } | null>(null);

  // Handle showcase video selection
  const handleShowcaseVideoSelect = (prompt: string, aspectRatio: string, duration: number) => {
    setShowcaseVideoParams({ prompt, aspectRatio, duration });
  };

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
    <div className="w-full mb-6 sm:mb-8 lg:mb-10" style={{ height: "calc(100vh - 120px)" }}>
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
        />

        <VideoHistory
          refreshTrigger={generationTrigger}
          selectedModel={currentSelectedModel}
          mode={mode}
          onSelectShowcaseVideo={handleShowcaseVideoSelect}
        />
      </div>
    </div>
  );
}
