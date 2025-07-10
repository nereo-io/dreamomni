"use client";

import { useTranslations } from "next-intl";
import { FeatureIcons } from "@/components/blocks/feature-icons";
import { CTASection } from "@/components/blocks/cta-section";
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";

export default function ImageToVideoPage() {
  const t = useTranslations("pages.imageToVideo");

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool mode="image-to-video" />

      <FeatureIcons title={t("title")} description={t("description")} />

      <CTASection title={t("ctaTitle")} buttonText={t("ctaButtonText")} />
    </>
  );
}
