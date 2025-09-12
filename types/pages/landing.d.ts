import { Header } from "@/types/blocks/header";
import { Hero } from "@/types/blocks/hero";
import { Section } from "@/types/blocks/section";
import { Footer } from "@/types/blocks/footer";
import { SolveAllQuestionsSection } from "@/types/blocks/slove-all-questions";
import { QuestionSuggestions } from "@/types/blocks/question-suggestions";
import { QuestionExamples } from "@/types/blocks/question-examples";
import { ImageToVideoShowcase } from "@/types/blocks/image-to-video-showcase";
import { AIModelsHero } from "@/types/blocks/ai-models-hero";
import { AIVideoShowcase } from "@/types/blocks/ai-video-showcase";

export interface GettingStarted {
  title: string;
  description: string;
  steps: Array<{
    step: number;
    title: string;
    description: string;
    icon: string;
  }>;
  cta: {
    title: string;
    url: string;
  };
}

export interface LandingPage {
  header?: Header;
  hero?: Hero;
  aiModelsHero?: AIModelsHero;
  aiVideoShowcase?: AIVideoShowcase;
  imageToVideoShowcase?: ImageToVideoShowcase;
  branding?: Section;
  introduce?: Section;
  benefit?: Section;
  usage?: Section;
  feature?: Section;
  showcase?: Section;
  stats?: Section;
  pricing?: Pricing;
  gettingStarted?: GettingStarted;
  testimonial?: Section;
  faq?: Section;
  cta?: Section;
  footer?: Footer;
}
