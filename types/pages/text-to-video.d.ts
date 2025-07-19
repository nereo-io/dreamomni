export interface VideoExample {
  id: string;
  image: string;
  alt: string;
  prompt: string;
  isNew?: boolean;
}

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

export interface AIModel {
  id: string;
  name: string;
  logo: string;
}

export interface AIModelsHero {
  title: string;
  description: string;
  models: AIModel[];
  moreModels: string;
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
  videoExamples: VideoExample[];
  faq: FAQ;
  cta: CTA;
  aiModelsHero: AIModelsHero;
  aiVideoShowcase: AIVideoShowcase;
  creatorShowcase: CreatorShowcase;
}
