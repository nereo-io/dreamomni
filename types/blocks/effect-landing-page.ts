export interface EffectMedia {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  poster?: string;
}

export interface EffectLandingHero {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaScrollTarget?: string;
  showcaseMedia?: EffectMedia[];
}

export interface EffectLandingFeature {
  id?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  media?: EffectMedia;
}

export interface EffectLandingHowToUse {
  title?: string;
  steps?: Array<{ title?: string; description?: string }>;
  ctaText?: string;
  ctaScrollTarget?: string;
}

export interface EffectLandingRelatedEffects {
  title?: string;
  effects?: Array<{
    id?: string;
    title?: string;
    slug?: string;
    image?: string;
    href?: string;
  }>;
}

export interface EffectLandingFaq {
  title?: string;
  description?: string;
  items?: Array<{ question?: string; answer?: string }>;
}

export interface EffectLandingPageProps {
  toolComponent?: React.ReactNode;
  hero?: EffectLandingHero;
  features?: EffectLandingFeature[];
  howToUse?: EffectLandingHowToUse;
  relatedEffects?: EffectLandingRelatedEffects;
  faq?: EffectLandingFaq;
}
