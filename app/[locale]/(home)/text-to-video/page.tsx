"use client";

import { useState } from "react";
import { Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { FeatureIcons } from "@/components/blocks/feature-icons";
import { CTASection } from "@/components/blocks/cta-section";
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";

export default function TextToVideoPage() {
  const t = useTranslations('pages.textToVideo')
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState("5s");
  const [selectedResolution, setSelectedResolution] = useState("480p");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedVideo(
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop"
      );
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool
        mode="text-to-video"
        description={prompt}
        setDescription={setPrompt}
        isGenerating={isGenerating}
        generatedVideo={generatedVideo}
        selectedRatio={selectedRatio}
        setSelectedRatio={setSelectedRatio}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedResolution={selectedResolution}
        setSelectedResolution={setSelectedResolution}
        onGenerate={handleGenerate}
        placeholderIcon={
          <Type className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        }
        placeholderText={t('placeholderText')}
      />

      <FeatureIcons
        title={t('title')}
        description={t('description')}
      />

      <CTASection
        title={t('ctaTitle')}
        buttonText={t('ctaButtonText')}
      />
    </>
  );
}
