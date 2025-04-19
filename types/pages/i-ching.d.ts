import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";


export interface IChingLandingPage {
  hero?: Hero;
  hexagrams?: {
    title: string;
    subtitle: string;
    description: string;
    examples: Array<{
      number: number;
      name: string;
      description: string;
      image?: string;
    }>;
  };
  testimonial?: Section;
  faq?: Section;
  cta?: Section;
}
