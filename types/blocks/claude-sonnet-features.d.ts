export interface ClaudeSonnetFeatureSubPoint {
  title?: string;
  text: string;
}

export interface ClaudeSonnetFeatureItem {
  id: string;
  title: string; // Can be empty if subPoints are used primarily for text content
  description: string; // Can be empty if subPoints are used
  imageUrl: string;
  imageAlt: string;
  subPoints?: ClaudeSonnetFeatureSubPoint[];
  buttonText?: string;
  buttonUrl?: string;
}

export interface ClaudeSonnetFeaturesBlockTranslations {
  mainTitle: string;
  features: ClaudeSonnetFeatureItem[];
}
