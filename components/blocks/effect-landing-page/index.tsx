"use client";

import { EffectHero } from "./effect-hero";
import { EffectFeatureDescriptions } from "./effect-feature-descriptions";
import { EffectHowToUse } from "./effect-how-to-use";
import { EffectRelatedGrid } from "./effect-related-grid";
import { FAQSection } from "@/components/blocks/faq-section";
import type { EffectLandingPageProps } from "@/types/blocks/effect-landing-page";

export default function EffectLandingPage({
  toolComponent,
  hero,
  features,
  howToUse,
  relatedEffects,
  faq,
}: EffectLandingPageProps) {
  const faqItems =
    faq?.items
      ?.map((item, index) => ({
        id: `faq-${index}`,
        question: item.question ?? "",
        answer: item.answer ?? "",
      }))
      .filter((item) => item.question || item.answer) ?? [];
  const hasHeroContent = Boolean(
    hero &&
      (hero.title ||
        hero.subtitle ||
        hero.ctaText ||
        (hero.showcaseMedia?.length ?? 0) > 0)
  );
  const hasFeatures = Boolean(
    features?.some(
      (feature) =>
        Boolean(feature?.title || feature?.description || feature?.media?.src) &&
        (!feature?.media || Boolean(feature.media.type && feature.media.src))
    )
  );
  const hasHowToUseSteps = Boolean(
    howToUse?.steps?.some((step) => Boolean(step?.title || step?.description))
  );
  const hasRelatedEffects = Boolean(
    relatedEffects?.effects?.some(
      (effect) => Boolean(effect?.title || effect?.image)
    )
  );
  const hasPageContent =
    hasHeroContent ||
    hasFeatures ||
    hasHowToUseSteps ||
    hasRelatedEffects ||
    faqItems.length > 0;

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Tool area — renders the effect tool or an empty placeholder for scroll targeting */}
      <div className="w-full lg:h-[calc(100vh-88px)]" data-effect-tool>
        {toolComponent}
      </div>

      {/* Content sections */}
      <div className={`max-w-6xl mx-auto px-4 ${hasPageContent ? "" : "hidden"}`}>
        {hasHeroContent && hero && (
          <EffectHero
            title={hero.title}
            subtitle={hero.subtitle}
            ctaText={hero.ctaText}
            ctaScrollTarget={hero.ctaScrollTarget}
            showcaseMedia={hero.showcaseMedia}
          />
        )}

        {hasFeatures && (
          <EffectFeatureDescriptions
            features={features}
            ctaScrollTarget={hero?.ctaScrollTarget}
          />
        )}

        {howToUse && hasHowToUseSteps && (
          <EffectHowToUse
            title={howToUse.title}
            steps={howToUse.steps}
            ctaText={howToUse.ctaText}
            ctaScrollTarget={howToUse.ctaScrollTarget}
          />
        )}

        {relatedEffects && hasRelatedEffects && (
          <EffectRelatedGrid
            title={relatedEffects.title}
            effects={relatedEffects.effects}
          />
        )}

        {faqItems.length > 0 && (
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
