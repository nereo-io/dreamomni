export interface EffectShowcaseItem {
  id: string;
  title?: string;
  imageUrl: string;
  inputImageUrl?: string;
  prompt?: string;
}

export interface EffectToolConfig {
  effectId: string;
  effectSlug: string;
  type: "image" | "video";
  showcaseItems: EffectShowcaseItem[];
  formConfig?: Record<string, unknown>;
}

export interface ImageEffectToolProps {
  config: EffectToolConfig;
}
