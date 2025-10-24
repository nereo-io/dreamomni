import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import TextToImageTab from "@/components/blocks/ai-image-generation-tool/TextToImageTab";
import textToImagePageData from "@/i18n/pages/text-to-image/en.json";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/text-to-image`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/text-to-image`;
  }

  return {
    title: t("pages.textToImage.title"),
    description: t("pages.textToImage.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function TextToImagePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();

  // Load localized page data
  const pageData = locale === 'en'
    ? textToImagePageData
    : textToImagePageData; // For now, fallback to English for other locales

  return (
    <>
      {/* Text to Image Generation Tool */}
      <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]">
        <TextToImageTab />
      </div>

      {!session && (
        <>
          {/* AI Models Hero */}
          <AIModelsHero data={pageData.aiModelsHero} />

          {/* Creator Showcase */}
          <CreatorShowcase data={pageData.creatorShowcase} />

          {/* FAQ Section */}
          <FAQSection
            title={pageData.faq.title}
            description={pageData.faq.description}
            faqItems={pageData.faq.items}
          />

          {/* CTA Section */}
          <CTA section={{
            name: "cta",
            title: pageData.cta.title,
            buttons: [
              {
                title: pageData.cta.buttonText,
                url: "/text-to-image",
                target: "_self"
              }
            ]
          }} />
        </>
      )}
    </>
  );
}
