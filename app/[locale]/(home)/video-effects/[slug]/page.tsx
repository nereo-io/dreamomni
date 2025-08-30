import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getEffectConfigBySlug } from "@/models/effectConfig";
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { FAQSection } from "@/components/blocks/faq-section";
import { CTASectionClient } from "@/components/blocks/cta-section-client";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const locale = await getLocale();
  const effect = await getEffectConfigBySlug(params.slug, locale);

  if (!effect) {
    return {
      title: "Effect Not Found",
      description: "The requested video effect could not be found.",
    };
  }

  const title = effect.title;
  const description = effect.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: effect.preview_image ? [effect.preview_image] : [],
    },
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

  return (
    <>
      {/* Video Generation Tool with simplified interface */}
      <VideoGenerationTool
        mode="image-to-video"
        effect={effect}
        descriptionLabel="Customize Effect (optional)"
        descriptionPlaceholder={`Add details to customize your ${effect.title.toLowerCase()} effect...`}
      />
      {/* Hero Section with Effect Preview */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black to-gray-950 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {effect.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              {effect.description}
            </p>

            {/* Preview Video */}
            {effect.preview_video && (
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-1">
                <video
                  className="w-full rounded-xl"
                  src={effect.preview_video}
                  poster={effect.preview_image || undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
