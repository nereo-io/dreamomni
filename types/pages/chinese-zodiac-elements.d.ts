import { Hero, Section, Testimonial, FAQ, CTA } from "@/types/components";
export interface ChineseZodiacElements {
  hero: Hero;
  introduce: Section;
  feature: Section;
  testimonial: Testimonial;
  faq: FAQ;
  cta: CTA;
  elementTable: {
    title: string;
    subtitle: string;
    table: {
      years: string;
      elements: string;
      zodiacSigns: string;
    };
    element: {
      wood: string;
      fire: string;
      earth: string;
      metal: string;
      water: string;
    };
    zodiac: {
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
  };
}
