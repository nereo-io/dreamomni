import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { AIVideoShowcase } from "@/components/blocks/ai-video-showcase";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import { CTASectionClient } from "@/components/blocks/cta-section-client";
import { getTextToVideoPage } from "@/services/page";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/text-to-video`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/text-to-video`;
  }

  return {
    title: "AI Text to Video Generator - Create Videos from Text Prompts",
    description: "Generate stunning 4K videos from text prompts with AI. Create professional videos from text descriptions with realistic physics and natural audio. Start free today.",
    keywords: "text to video, AI video generator, text prompt video, video creation, AI video maker, text-based video, prompt to video",
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function TextToVideoPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const pageData = await getTextToVideoPage(locale);

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool mode="text-to-video" />

      {/* AI Models Hero */}
      <AIModelsHero data={pageData.aiModelsHero} />

      {/* AI Video Showcase */}
      <AIVideoShowcase 
        title={pageData.aiVideoShowcase.title}
        description={pageData.aiVideoShowcase.description}
        examples={pageData.videoExamples} 
      />

      {/* Creator Showcase */}
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