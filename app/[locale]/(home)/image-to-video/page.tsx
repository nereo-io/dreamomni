import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { ImageToVideoShowcase } from "@/components/blocks/image-to-video-showcase";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import { CTASectionClient } from "@/components/blocks/cta-section-client";
import { getImageToVideoPage } from "@/services/page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/image-to-video`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/image-to-video`;
  }

  return {
    title: t("imageToVideo.pages.title"),
    description: t("imageToVideo.pages.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageToVideoPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const pageData = await getImageToVideoPage(locale);

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool mode="image-to-video" />

      {/* AI Models Hero */}
      <AIModelsHero data={pageData.aiModelsHero} />

      {/* Hero Section with H1 title */}
      <ImageToVideoShowcase data={pageData.imageToVideoShowcase} />

      {/* Creator Showcase - Use Cases */}
      <CreatorShowcase data={pageData.creatorShowcase} />

      {/* FAQ Section */}
      <FAQSection
        title={pageData.faq.title}
        description={pageData.faq.description}
        faqItems={pageData.faq.items}
      />

      {/* CTA Section */}
      <CTASectionClient
        title={pageData.cta.title}
        description={pageData.cta.description}
        buttonText={pageData.cta.buttonText}
      />
    </>
  );
}
