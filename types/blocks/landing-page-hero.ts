/**
 * Landing Page Hero Block Type Definitions
 * Universal hero section for all model landing pages
 */

export interface LandingPageHero {
  title: string;
  description: string;
  cta?: {
    buttonText: string;
    onClick?: () => void;
    scrollTarget?: string; // Default: "[data-video-generation-tool]"
  };
  media?: {
    type: "video" | "image";
    src: string;
    poster?: string; // For video
    alt?: string; // For image
  };
  badge?: {
    text: string;
    variant?: "default" | "beta" | "new";
  };
}

export interface LandingPageHeroProps {
  data: LandingPageHero;
}
