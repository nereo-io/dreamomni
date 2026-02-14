"use client";

import { useState, useCallback } from "react";
import EffectForm, { type EffectGenerationParams } from "./EffectForm";
import EffectFormPlaceholder from "./EffectFormPlaceholder";
import ImageHistoryForGeneration from "@/components/blocks/image-history-for-generation";
import VideoHistory from "@/components/blocks/video-history";
import { useAppContext } from "@/contexts/app";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { VideoEffectToolProps } from "@/types/blocks/video-effect-tool";
import type { ImageGenerationResult } from "@/components/blocks/image-history";

export default function VideoEffectTool({ config }: VideoEffectToolProps) {
  const { user } = useAppContext();
  const t = useTranslations("videoEffectTool");
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newImage, setNewImage] = useState<ImageGenerationResult | null>(null);

  const handleGenerate = useCallback(
    async (params: EffectGenerationParams) => {
      setIsGenerating(true);
      try {
        const response = await fetch("/api/video-effect/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            effectId: params.effectId,
            imageUrls: params.imageUrls,
            settings: params.settings,
            captchaToken: params.captchaToken,
          }),
        });

        const data = await response.json();

        if (data.code !== 0) {
          toast.error(data.message || t("generateFailed"));
          return;
        }

        // Create placeholder for immediate display in history
        const placeholder: ImageGenerationResult = {
          id: data.data.id,
          prompt: config.effectId,
          status: "in_queue",
          model: config.effectId,
          quality: "standard",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          credits_used: data.data.credits || 0,
        };

        setNewImage(placeholder);
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Effect generation error:", error);
        toast.error(t("generateFailedRetry"));
      } finally {
        setIsGenerating(false);
      }
    },
    [config.effectId, t]
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
        <ImageHistoryForGeneration
          userId={user?.uuid}
          refreshTrigger={refreshTrigger}
          newImage={newImage}
        />
      ) : (
        <VideoHistory refreshTrigger={refreshTrigger} />
      )}
    </div>
  );
}
