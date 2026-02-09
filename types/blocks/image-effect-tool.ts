export interface EffectShowcaseItem {
  id: string;
  title?: string;
  imageUrl: string;
  inputImageUrl?: string;
  prompt?: string;
}

export interface EffectFormSettingOption {
  label: string;
  value: string;
}

export interface EffectFormSetting {
  key: string;
  label: string;
  options: EffectFormSettingOption[];
  defaultValue?: string;
}

export interface EffectFormConfig {
  title: string;
  backgroundImage: string;
  maxImages: number;
  settings: EffectFormSetting[];
  creditsPerGeneration: number;
}

export interface EffectToolConfig {
  effectId: string;
  effectSlug: string;
  type: "image" | "video";
  showcaseItems: EffectShowcaseItem[];
  formConfig?: EffectFormConfig;
}

export interface ImageEffectToolProps {
  config: EffectToolConfig;
}
