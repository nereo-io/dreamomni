import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";

export interface IChingNoticeSection {
  title: string;
  items: Array<{
    title: string;
    description: string;
  }>;
  examples: {
    title: string;
    items: Array<{
      title: string;
      content: string;
    }>;
  };
  contact: {
    prefix: string;
    email: string;
  };
}
export interface IChingHero {
  title: string;
  description: string;
  steps: {
    ask: string;
    cast: string;
    interpret: string;
  };
  buttons: {
    continue: string;
    back: string;
    skip: string;
  };
  questionPlaceholder: string;
  characters: string;
  startCasting: string;
  castingComplete: string;
  castingLines: string;
  of: string;
  viewInterpretation: string;
  yourQuestion: string;
  over: string;
  viewFullInterpretation: string;
  castingDescription: string;
  examples: {
    title: string;
    relationship: string;
    career: string;
    decision: string;
    relationshipQuestion: string;
    careerQuestion: string;
    decisionQuestion: string;
  };
  hexagram: string;
  below: string;
  trigrams: {
    Heaven: string;
    Earth: string;
    Thunder: string;
    Water: string;
    Mountain: string;
    Wind: string;
    Fire: string;
    Lake: string;
  };
}

export interface IChingLandingPage {
  IChingHero?: IChingHero;
  testimonial?: Section;
  faq?: Section;
  cta?: Section;
  notice?: IChingNoticeSection;
}
