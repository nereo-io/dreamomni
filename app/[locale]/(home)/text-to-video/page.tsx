"use client";

import { useTranslations } from "next-intl";
import { FeatureIcons } from "@/components/blocks/feature-icons";
import { CTASection } from "@/components/blocks/cta-section";
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";

export default function TextToVideoPage() {
  const t = useTranslations("pages.textToVideo");

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool mode="text-to-video" />

      <FeatureIcons title={t("title")} description={t("description")} />

      <CTASection title={t("ctaTitle")} buttonText={t("ctaButtonText")} />
    </>
  );
}
