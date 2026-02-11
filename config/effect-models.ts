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

/**
 * PixVerse generation mode — determines which PixVerse API endpoint to call.
 *
 *  image_template  → POST /image/template/generate  (returns image_id)
 *  image_to_video  → POST /video/img/generate       (returns video_id)
 *  transition      → POST /video/transition/generate (returns video_id, needs 2 images)
 */
export type PixverseMode = "image_template" | "image_to_video" | "transition";

/** Output type — determines which DB table and credit type to use */
export type EffectOutputType = "image" | "video";

export interface EffectModelConfig {
  id: string;
  name: string;
  provider: EffectProvider;
  /** What the effect produces — drives DB table and credit transaction type */
  outputType: EffectOutputType;
  status: "active" | "inactive";
  baseCredits: number;
  maxImages: number;
  estimatedGenerationTime?: number;
  settings: EffectSettingDef[];
  calculateCredits: (settings: Record<string, string>) => number;
  prompt: string;
  model?: string;
  /** PixVerse-specific: template ID passed to the API */
  pixverseTemplateId?: number;
  /** PixVerse-specific: which generation mode to use */
  pixverseMode?: PixverseMode;
}

export const EFFECT_MODELS: Record<string, EffectModelConfig> = {
  "ghibli-style": {
    id: "ghibli-style",
    name: "Ghibli Style",
    provider: EffectProvider.KIE,
    outputType: "image",
    status: "active",
    baseCredits: 2,
    maxImages: 1,
    estimatedGenerationTime: 30,
    prompt:
      "Redraw [a photo of a landscape or person] in the style of a Studio Ghibli animated film. Nostalgic, with hand-painted backgrounds, soft colors, and lush nature.",
    model: "nano-banana-pro",
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
  "gallop-into-2026": {
    id: "gallop-into-2026",
    name: "Gallop into 2026",
    provider: EffectProvider.PIXVERSE,
    outputType: "image",
    status: "active",
    baseCredits: 30,
    maxImages: 1,
    model: "pixverse-template",
    settings: [],
    calculateCredits: () => 30,
    prompt: "",
    pixverseTemplateId: 378813799935040,
    pixverseMode: "image_template",
  },
};

export function getEffectModel(
  effectId: string,
): EffectModelConfig | undefined {
  return EFFECT_MODELS[effectId];
}

export function calculateEffectCredits(
  effectId: string,
  settings: Record<string, string>,
): number {
  const model = EFFECT_MODELS[effectId];
  if (!model) return 0;
  return model.calculateCredits(settings);
}

export function getEffectDefaultSettings(
  effectId: string,
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
