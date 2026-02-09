"use client";

import { useState, useCallback } from "react";
import EffectForm, { type EffectGenerationParams } from "./EffectForm";
import EffectFormPlaceholder from "./EffectFormPlaceholder";
import ImageHistoryForGeneration from "@/components/blocks/image-history-for-generation";
import VideoHistory from "@/components/blocks/video-history";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import type { ImageEffectToolProps } from "@/types/blocks/image-effect-tool";

export default function ImageEffectTool({ config }: ImageEffectToolProps) {
  const { user } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(
    async (params: EffectGenerationParams) => {
      setIsGenerating(true);
      try {
        // TODO: Wire to actual image effect generation API
        console.log("[ImageEffectTool] Generate:", params);
        toast.info("Image effect generation is coming soon.");
      } catch (error) {
        console.error("Effect generation error:", error);
        toast.error("Failed to generate effect. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return (
    <div className="flex flex-col lg:flex-row gap-2 h-full">
      {config.formConfig ? (
        <EffectForm
          config={config.formConfig}
          effectId={config.effectId}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
        />
      ) : (
        <EffectFormPlaceholder />
      )}
      {config.type === "image" ? (
        <ImageHistoryForGeneration userId={user?.uuid} />
      ) : (
        <VideoHistory />
      )}
    </div>
  );
}
