export interface ClaudeSonnetFeaturesBlockTranslations {
  mainTitle: string;
  features: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    subPoints?: Array<{
      title: string;
      text: string;
    }>;
    buttonText?: string;
    buttonUrl?: string;
  }>;
}