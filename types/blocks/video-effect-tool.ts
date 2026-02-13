export interface VideoEffectShowcaseItem {
  id: string;
  title?: string;
  imageUrl: string;
  inputImageUrl?: string;
  prompt?: string;
}

export interface VideoEffectFormSettingOption {
  label: string;
  value: string;
}

export interface VideoEffectFormSetting {
  key: string;
  label: string;
  options: VideoEffectFormSettingOption[];
  defaultValue?: string;
}

export interface VideoEffectFormConfig {
  title: string;
  backgroundImage: string;
  maxImages: number;
  minImages?: number;
  settings: VideoEffectFormSetting[];
}

export interface VideoEffectToolConfig {
  effectId: string;
  effectSlug: string;
  type: "image" | "video";
  showcaseItems: VideoEffectShowcaseItem[];
  formConfig?: VideoEffectFormConfig;
}

export interface VideoEffectToolProps {
  config: VideoEffectToolConfig;
}
