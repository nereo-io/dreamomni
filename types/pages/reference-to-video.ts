/**
 * Reference-to-Video Page Type Definitions
 * Combines all blocks for the reference-to-video landing page
 */

import { LandingPageHero } from "@/types/blocks/landing-page-hero";
import { FeatureHighlights } from "@/types/blocks/feature-highlights";
import { UsageGuideSection } from "@/types/pages/model-landing-page";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ReferenceToVideoPage {
  hero: LandingPageHero;
  features: FeatureHighlights;
  usageGuide: UsageGuideSection;
  faq: {
    title: string;
    description: string;
    items: FAQItem[];
  };
  cta: {
    title: string;
    buttonText: string;
  };
}
