import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { LandingPageHero } from "@/components/blocks/landing-page-hero";
import { FeatureHighlights } from "@/components/blocks/feature-highlights";
import ModelUsageGuide from "@/components/blocks/model-landing-page/model-usage-guide";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import { getReferenceToVideoPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";

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
    title: t("pages.referenceToVideo.title"),
    description: t("pages.referenceToVideo.description"),
    keywords: t("pages.referenceToVideo.keywords"),
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
  const session = await auth();
  const pageData = await getReferenceToVideoPage(locale);

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool
        mode="image-to-video"
        generationType="REFERENCE_2_VIDEO"
        hidePromptEnhancement
      />

      {!session && (
        <>
          {/* Hero Section */}
          <LandingPageHero data={pageData.hero} />

          {/* Feature Highlights */}
          <FeatureHighlights data={pageData.features} />

          {/* How to Use */}
          <ModelUsageGuide section={pageData.usageGuide} />

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
      )}
    </>
  );
}
