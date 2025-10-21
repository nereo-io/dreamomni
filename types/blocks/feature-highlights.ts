/**
 * Feature Highlights Block Type Definitions
 * Showcase 1-n key features with media and descriptions
 */

export interface Feature {
  id: string;
  title: string;
  description: string;
  highlights?: string[]; // Optional bullet points
  media?: {
    type: "image" | "video";
    src: string;
    alt: string;
    poster?: string; // For video
  };
  mediaPosition?: "left" | "right"; // Default: auto (alternating)
}

export interface FeatureHighlights {
  title?: string; // Optional section title
  features: Feature[];
  cta?: {
    buttonText: string;
    scrollTarget?: string;
  };
}

export interface FeatureHighlightsProps {
  data: FeatureHighlights;
}
