import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { QuestionSelectorSection } from "@/types/pages/career";
import { Feature } from "@/types/blocks/feature";
import { Feature2 } from "@/types/blocks/feature2";
import { FAQ } from "@/types/blocks/faq";
import { CTA } from "@/types/blocks/cta";
import { Testimonial } from "@/types/blocks/testimonial";
import { OverviewSection } from "@/types/blocks/overview";
import { ZodiacFinderSection } from "@/types/blocks/zodiac-finder";

export interface ChineseZodiacPage {
  hero: Hero;
  overviewSection: OverviewSection;
  zodiacFinderSection: ZodiacFinderSection;
  enterBirthdate: string;
  birthdateDescription: string;
  calculate: string;
  yearLabel: string;
  monthLabel: string;
  dayLabel: string;
  results: {
    yourZodiac: string;
    yourElement: string;
    prediction2025: string;
    readMore: string;
    elementRelationship: string;
    personalityTitle: string;
    compatibilityTitle: string;
    luckyElementsTitle: string;
    careerProspects: string;
    healthOutlook: string;
    relationshipForecast: string;
  };
  zodiacSigns: {
    rat: string;
    ox: string;
    tiger: string;
    rabbit: string;
    dragon: string;
    snake: string;
    horse: string;
    goat: string;
    monkey: string;
    rooster: string;
    dog: string;
    pig: string;
  };
  elements: {
    wood: string;
    fire: string;
    earth: string;
    metal: string;
    water: string;
  };

  questionListHeader: QuestionListHeader;
  introduce: Section;
  feature: Section;
  testimonial: Testimonial;
  faq: FAQ;
  cta: CTA;
}
