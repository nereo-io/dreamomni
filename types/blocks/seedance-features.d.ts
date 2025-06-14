export interface SeedanceFeatureSubPoint {
  title?: string;
  text: string;
}

export interface SeedanceFeatureItem {
  id: string;
  title: string; // Can be empty if subPoints are used primarily for text content
  description: string; // Can be empty if subPoints are used
  imageUrl: string;
  imageAlt: string;
  subPoints?: SeedanceFeatureSubPoint[];
  buttonText?: string;
  buttonUrl?: string;
}

export interface SeedanceFeaturesBlockTranslations {
  mainTitle: string;
  features: SeedanceFeatureItem[];
}