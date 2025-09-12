import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getEffectConfigBySlug } from "@/models/effectConfig";
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { FAQSection } from "@/components/blocks/faq-section";
import { VideoEffectHero } from "@/components/blocks/video-effect-hero";
import { HowToUse } from "@/components/blocks/how-to-use";
import { TechnicalSpecs } from "@/components/blocks/technical-specs";
import { EffectTips } from "@/components/blocks/effect-tips";
import CTA from "@/components/blocks/cta";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const locale = await getLocale();
  const effect = await getEffectConfigBySlug(params.slug, locale);

  if (!effect) {
    return {
      title: "Effect Not Found | Veo3 AI",
      description: "The requested video effect could not be found.",
      robots: "noindex,nofollow",
    };
  }

  const canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${
    params.locale !== "en" ? `/${params.locale}` : ""
  }/video-effects/${params.slug}`;
  const title = `${effect.page_title}`;
  const description = effect.page_description;

  return {
    title,
    description,
    openGraph: {
      title: `${effect.page_title} - AI Video Effect`,
      description,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url:
            effect.preview_image ||
            `${process.env.NEXT_PUBLIC_WEB_URL}/placeholder-effect.svg`,
          width: 1200,
          height: 630,
          alt: `${effect.title} - AI Video Effect Preview`,
        },
      ],
      siteName: "Veo3 AI",
    },
    twitter: {
      card: "summary_large_image",
      site: "@veo3ai",
      title: effect.page_title,
      description,
      images: [
        effect.preview_image ||
          `${process.env.NEXT_PUBLIC_WEB_URL}/placeholder-effect.svg`,
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: "index,follow",
  };
}

export default async function EffectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const locale = await getLocale();
  const effect = await getEffectConfigBySlug(params.slug, locale);

  if (!effect) {
    notFound();
  }

  // Parse content from JSONB field
  const content = effect.content || {};

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: effect.title,
    description: effect.page_description,
    applicationCategory: "VideoEditingSoftware",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: effect.credits_required
        ? (effect.credits_required * 0.025).toString()
        : "0",
      priceCurrency: "USD",
    },
    image:
      effect.preview_image ||
      `${process.env.NEXT_PUBLIC_WEB_URL}/placeholder-effect.svg`,
    video: effect.preview_video || null,
    creator: {
      "@type": "Organization",
      name: "Veo3 AI",
      url: process.env.NEXT_PUBLIC_WEB_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Video Generation Tool with simplified interface */}
      <div data-video-generation-tool>
        <VideoGenerationTool
          mode="image-to-video"
          effect={effect}
          descriptionLabel="Customize Effect (optional)"
          descriptionPlaceholder={`Add details to customize your ${effect.title.toLowerCase()} effect...`}
        />
      </div>

      <VideoEffectHero effect={effect} />

      {/* How To Use Section */}
      <HowToUse effect={effect} />

      {/* Technical Specifications */}
      {/* <TechnicalSpecs effect={effect} /> */}

      {/* Effect Tips */}
      {/* <EffectTips /> */}

      {/* FAQ Section */}
      {effect.content?.faq && effect.content.faq.length > 0 && (
        <FAQSection
          faqItems={effect.content.faq.map((item, index) => ({
            id: `faq-${index}`,
            question: item.question,
            answer: item.answer,
          }))}
        />
      )}

      {/* CTA Section */}
      {effect.content?.cta && (
        <CTA
          section={{
            name: "cta",
            title: effect.content.cta.title || `Ready to Try ${effect.title}?`,
            disabled: false,
            buttons: [
              {
                title:
                  effect.content.cta.buttonText || `Try ${effect.title} Free`,
                url: "#",
                type: "button" as const,
              },
            ],
          }}
        />
      )}
    </>
  );
}
