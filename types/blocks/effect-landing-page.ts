export interface EffectMedia {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  poster?: string;
}

export interface EffectLandingPageProps {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaScrollTarget?: string;
    showcaseMedia: EffectMedia[];
  };
  features: Array<{
    id: string;
    title: string;
    description: string;
    ctaText: string;
    media: EffectMedia;
  }>;
  howToUse: {
    title: string;
    steps: Array<{ title: string; description: string }>;
    ctaText: string;
    ctaScrollTarget?: string;
  };
  relatedEffects?: {
    title: string;
    effects: Array<{
      id: string;
      title: string;
      slug: string;
      image: string;
      href: string;
    }>;
  };
  faq?: {
    title?: string;
    description?: string;
    items: Array<{ question: string; answer: string }>;
  };
}
