"use client";

import { EffectHero } from "./effect-hero";
import { EffectFeatureDescriptions } from "./effect-feature-descriptions";
import { EffectHowToUse } from "./effect-how-to-use";
import { EffectRelatedGrid } from "./effect-related-grid";
import { FAQSection } from "@/components/blocks/faq-section";
import type { EffectLandingPageProps } from "@/types/blocks/effect-landing-page";

export default function EffectLandingPage({
  hero,
  features,
  howToUse,
  relatedEffects,
  faq,
}: EffectLandingPageProps) {
  const faqItems = faq?.items.map((item, index) => ({
    id: `faq-${index}`,
    question: item.question,
    answer: item.answer,
  }));

  return (
    <div className="flex flex-col">
      {/* Tool placeholder — pages embed their tool above this component or target this div */}
      <div className="w-full mb-6 sm:mb-8 lg:mb-10 lg:h-[calc(100vh-120px)]" data-effect-tool />

      {/* Content sections */}
      <div className="max-w-6xl mx-auto px-4">
        <EffectHero
          title={hero.title}
          subtitle={hero.subtitle}
          ctaText={hero.ctaText}
          ctaScrollTarget={hero.ctaScrollTarget}
          showcaseMedia={hero.showcaseMedia}
        />

        {features.length > 0 && (
          <EffectFeatureDescriptions
            features={features}
            ctaScrollTarget={hero.ctaScrollTarget}
          />
        )}

        <EffectHowToUse
          title={howToUse.title}
          steps={howToUse.steps}
          ctaText={howToUse.ctaText}
          ctaScrollTarget={howToUse.ctaScrollTarget}
        />

        {relatedEffects && relatedEffects.effects.length > 0 && (
          <EffectRelatedGrid
            title={relatedEffects.title}
            effects={relatedEffects.effects}
          />
        )}

        {faqItems && faqItems.length > 0 && (
          <FAQSection
            title={faq?.title}
            description={faq?.description}
            faqItems={faqItems}
          />
        )}
      </div>
    </div>
  );
}
