export enum EffectProvider {
  HAILUO = "hailuo",
  PIXVERSE = "pixverse",
  KIE = "kie",
}

export interface EffectSettingOption {
  label: string;
  value: string;
}

export interface EffectSettingDef {
  key: string;
  label: string;
  options: EffectSettingOption[];
  defaultValue?: string;
}

export interface EffectModelConfig {
  id: string;
  name: string;
  provider: EffectProvider;
  status: "active" | "inactive";
  baseCredits: number;
  maxImages: number;
  estimatedGenerationTime?: number;
  settings: EffectSettingDef[];
  calculateCredits: (settings: Record<string, string>) => number;
}

export const EFFECT_MODELS: Record<string, EffectModelConfig> = {
  "ghibli-style": {
    id: "ghibli-style",
    name: "Ghibli Style",
    provider: EffectProvider.KIE,
    status: "active",
    baseCredits: 2,
    maxImages: 1,
    estimatedGenerationTime: 30,
    settings: [
      {
        key: "ratio",
        label: "Ratio",
        options: [
          { label: "1:1", value: "1:1" },
          { label: "16:9", value: "16:9" },
          { label: "9:16", value: "9:16" },
        ],
        defaultValue: "1:1",
      },
    ],
    calculateCredits: () => 2,
  },
};

export function getEffectModel(
  effectId: string
): EffectModelConfig | undefined {
  return EFFECT_MODELS[effectId];
}

export function calculateEffectCredits(
  effectId: string,
  settings: Record<string, string>
): number {
  const model = EFFECT_MODELS[effectId];
  if (!model) return 0;
  return model.calculateCredits(settings);
}

export function getEffectDefaultSettings(
  effectId: string
): Record<string, string> {
  const model = EFFECT_MODELS[effectId];
  if (!model) return {};
  const defaults: Record<string, string> = {};
  for (const setting of model.settings) {
    defaults[setting.key] =
      setting.defaultValue || setting.options[0]?.value || "";
  }
  return defaults;
}
