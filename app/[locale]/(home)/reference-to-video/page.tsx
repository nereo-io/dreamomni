import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import { getReferenceToVideoPage } from "@/services/page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/reference-to-video`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/reference-to-video`;
  }

  return {
    title: "Reference-to-Video (Consistent Character) | Veo3",
    description:
      "Turn 1–3 reference images into consistent-character videos with Veo 3.1. Lock identity and style across scenes with Veo3's Reference-to-Video.",
    keywords:
      "reference-to-video, reference image to video, image to video, consistent character, character reference, identity lock, Veo3",
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ReferenceToVideoPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const pageData = await getReferenceToVideoPage(locale);

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool
        mode="image-to-video"
        generationType="REFERENCE_2_VIDEO"
      />

      {/* AI Models Hero */}
      <AIModelsHero data={pageData.aiModelsHero} />

      {/* Creator Showcase - Use Cases */}
      <CreatorShowcase data={pageData.creatorShowcase} />

      {/* FAQ Section */}
      <FAQSection
        title={pageData.faq.title}
        description={pageData.faq.description}
        faqItems={pageData.faq.items}
      />

      {/* CTA Section */}
      <CTA
        section={{
          title: pageData.cta.title,
          buttons: [
            {
              title: pageData.cta.buttonText,
              url: "/reference-to-video",
            },
          ],
        }}
      />
    </>
  );
}
