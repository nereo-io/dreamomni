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
  minImages?: number;
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
  "2026-player-calendar": {
    id: "2026-player-calendar",
    name: "2026 Player Calendar",
    provider: EffectProvider.PIXVERSE,
    outputType: "image",
    status: "active",
    baseCredits: 30,
    maxImages: 1,
    model: "pixverse-template",
    settings: [],
    calculateCredits: () => 30,
    prompt: "",
    pixverseTemplateId: 377378608924544,
    pixverseMode: "image_template",
  },
  "ai-kissing": {
    id: "ai-kissing",
    name: "AI Kissing",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    estimatedGenerationTime: 60,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
          { label: "8s", value: "8" },
        ],
        defaultValue: "5",
      },
      {
        key: "quality",
        label: "Quality",
        options: [
          { label: "360p", value: "360p" },
          { label: "540p", value: "540p" },
          { label: "720p", value: "720p" },
          { label: "1080p", value: "1080p" },
        ],
        defaultValue: "540p",
      },
      {
        key: "ratio",
        label: "Aspect Ratio",
        options: [
          { label: "16:9", value: "16:9" },
          { label: "9:16", value: "9:16" },
        ],
        defaultValue: "16:9",
      },
    ],
    calculateCredits: (settings) => {
      const duration = parseInt(settings.duration || "5", 10);
      const quality = settings.quality || "540p";
      const baseDuration = 5;
      const baseCredits = 10; // 5s @ 540p baseline
      const durationMultiplier = duration / baseDuration;
      const qualityMultiplier = quality === "720p" ? 2 : 1;
      return Math.round(baseCredits * durationMultiplier * qualityMultiplier);
    },
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 315446315336768,
    pixverseMode: "image_to_video",
  },
  "image-transition": {
    id: "image-transition",
    name: "Image Transition",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 12,
    maxImages: 2,
    minImages: 2,
    estimatedGenerationTime: 70,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
          { label: "8s", value: "8" },
        ],
        defaultValue: "5",
      },
      {
        key: "quality",
        label: "Quality",
        options: [
          { label: "540p", value: "540p" },
          { label: "720p", value: "720p" },
        ],
        defaultValue: "540p",
      },
      {
        key: "ratio",
        label: "Aspect Ratio",
        options: [
          { label: "16:9", value: "16:9" },
          { label: "9:16", value: "9:16" },
        ],
        defaultValue: "16:9",
      },
    ],
    calculateCredits: (settings) => {
      const duration = parseInt(settings.duration || "5", 10);
      const quality = settings.quality || "540p";
      const baseDuration = 5;
      const baseCredits = 12; // 5s @ 540p baseline for transitions
      const durationMultiplier = duration / baseDuration;
      const qualityMultiplier = quality === "720p" ? 2 : 1;
      return Math.round(baseCredits * durationMultiplier * qualityMultiplier);
    },
    prompt:
      "Smooth cinematic transition between the first and last image, natural motion, consistent lighting.",
    model: "v5.5",
    pixverseTemplateId: 348361261605632,
    pixverseMode: "transition",
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
