"use client";

import type React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageIcon } from "lucide-react";
import { FeatureIcons } from "@/components/blocks/feature-icons";
import { CTASection } from "@/components/blocks/cta-section";
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";

export default function ImageToVideoPage() {
  const t = useTranslations('pages.imageToVideo')
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedDuration, setSelectedDuration] = useState("5s");
  const [selectedResolution, setSelectedResolution] = useState("1080p");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool
        mode="image-to-video"
        description={description}
        setDescription={setDescription}
        isGenerating={isGenerating}
        generatedVideo={generatedVideo}
        selectedRatio={selectedRatio}
        setSelectedRatio={setSelectedRatio}
        selectedDuration={selectedDuration}
        setSelectedDuration={setSelectedDuration}
        selectedResolution={selectedResolution}
        setSelectedResolution={setSelectedResolution}
        onGenerate={() => {}} // 移除覆盖的生成函数，让VideoGenerationTool使用自己的生成逻辑
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        onImageUpload={handleImageUpload}
        placeholderIcon={
          <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
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
