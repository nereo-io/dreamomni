"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HeroSection } from "@/components/blocks/hero-section";
import { CategoryTabs } from "@/components/blocks/category-tabs";
import { EffectGrid } from "@/components/blocks/effect-grid";
import { CategoryEffectSection } from "@/components/blocks/category-effect-section";
import { categories, effects, categoryEffects } from "@/data/effects";

export default function VideoAffectsPage() {
  const t = useTranslations("pages.videoAffects");
  const tEffect = useTranslations("pages.effectDetail");
  const tEffects = useTranslations("effects");
  const [activeCategory, setActiveCategory] = useState("All");

  // Convert effects with titleKey to title for compatibility
  const effectsWithTitles = effects.map((effect) => ({
    ...effect,
    title: effect.titleKey
      ? tEffects(effect.titleKey as any)
      : effect.title || "Unknown Effect",
  }));

  return (
    <>
      <HeroSection
        title={t("heroSection.title")}
        description={t("heroSection.description")}
        buttonText={t("heroSection.buttonText")}
        image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
        imageAlt={tEffect("imageAlt")}
      />

      {/* Effects Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          {t("effectsTitle")}
        </h2>

        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <EffectGrid effects={effectsWithTitles} />

        {/* Category Effects Sections */}
        {Object.entries(categoryEffects).map(
          ([categoryName, categoryItems]) => {
            // Get translated category name
            const keyMap: Record<string, string> = {
              funandcreativeeffects: "funAndCreative",
              horrorandfantasyeffects: "horrorAndFantasy",
              appearancechangingeffects: "appearanceChanging",
              seasonalspecialeffects: "seasonalSpecial",
              emotionalexpressioneffects: "emotionalExpression",
            };
            const key = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const translationKey = keyMap[key] || key;
            const translatedCategoryName =
              t(`categoryEffects.${translationKey}`) || categoryName;

            return (
              <CategoryEffectSection
                key={categoryName}
                categoryName={translatedCategoryName}
                effects={categoryItems.map((effect) => ({
                  ...effect,
                  title: effect.titleKey
                    ? tEffects(effect.titleKey as any)
                    : effect.title || "Unknown Effect",
                  isHot: Math.random() > 0.7,
                }))}
              />
            );
          }
        )}
      </div>
    </>
  );
}
