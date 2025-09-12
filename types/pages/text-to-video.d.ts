import { AIModelsHero } from "@/types/blocks/ai-model-hero";
import { AIVideoShowcase, VideoExample } from "@/types/blocks/ai-video-showcase";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQ {
  title: string;
  description: string;
  items: FAQItem[];
}

export interface CTA {
  title: string;
  description: string;
  buttonText: string;
}

export interface CreatorType {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  badge: string;
}

export interface CreatorShowcase {
  title: string;
  creatorTypes: CreatorType[];
}

export interface TextToVideoPage {
  faq: FAQ;
  cta: CTA;
  aiModelsHero: AIModelsHero;
  aiVideoShowcase: AIVideoShowcase;
  creatorShowcase: CreatorShowcase;
}
