export enum EffectProvider {
  HAILUO = "hailuo",
  PIXVERSE = "pixverse",
  KIE = "kie",
}

export interface EffectSettingOption {
  label: string;
  value: string;
}

export type EffectSettingKey = "duration" | "quality" | "ratio";

export interface EffectSettingConfig {
  options: EffectSettingOption[];
  defaultValue: string;
}

export type EffectSettingsConfig = Partial<
  Record<EffectSettingKey, EffectSettingConfig>
>;

export interface EffectSettingDef {
  key: EffectSettingKey;
  label: string;
  options: EffectSettingOption[];
  defaultValue: string;
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
  maxImages: number;
  minImages?: number;
  estimatedGenerationTime?: number;
  settings: EffectSettingsConfig;
  calculateCredits: (settings: Record<string, string>) => number;
  prompt?: string;
  model?: string;
  /** PixVerse-specific: template ID passed to the API */
  pixverseTemplateId?: number;
  /** PixVerse-specific: which generation mode to use */
  pixverseMode?: PixverseMode;
}

interface BaseEffectModelInput extends Omit<
  EffectModelConfig,
  "status" | "maxImages" | "settings" | "prompt"
> {
  status?: "active" | "inactive";
  maxImages?: number;
  settings?: EffectSettingsConfig;
  prompt?: string;
}

type PixverseVideoEffectModelInput = Omit<
  BaseEffectModelInput,
  "provider" | "outputType" | "pixverseMode" | "calculateCredits"
> & {
  provider?: EffectProvider.PIXVERSE;
  outputType?: "video";
  pixverseMode?: PixverseMode;
  calculateCredits?: EffectModelConfig["calculateCredits"];
};

type ImageEffectModelInput = BaseEffectModelInput & {
  outputType: "image";
};

const EFFECT_SETTING_KEYS: EffectSettingKey[] = [
  "duration",
  "quality",
  "ratio",
];

const EFFECT_SETTING_LABELS: Record<EffectSettingKey, string> = {
  duration: "Duration",
  quality: "Quality",
  ratio: "Aspect Ratio",
};

const DEFAULT_VIDEO_SETTINGS: EffectSettingsConfig = {
  duration: {
    options: [{ label: "5s", value: "5" }],
    defaultValue: "5",
  },
  quality: {
    options: [
      { label: "360p", value: "360p" },
      { label: "540p", value: "540p" },
      { label: "720p", value: "720p" },
      { label: "1080p", value: "1080p" },
    ],
    defaultValue: "540p",
  },
  ratio: {
    options: [{ label: "Auto", value: "auto" }],
    defaultValue: "auto",
  },
};

const DEFAULT_KIE_IMAGE_SETTINGS: EffectSettingsConfig = {
  ratio: {
    options: [
      { label: "Auto", value: "auto" },
      { label: "1:1", value: "1:1" },
      { label: "16:9", value: "16:9" },
      { label: "9:16", value: "9:16" },
    ],
    defaultValue: "1:1",
  },
};

function getDefaultImageSettings(
  provider: EffectProvider,
): EffectSettingsConfig {
  if (provider === EffectProvider.KIE) {
    return DEFAULT_KIE_IMAGE_SETTINGS;
  }
  return {};
}

function mergeEffectSettings(
  baseSettings: EffectSettingsConfig,
  customSettings: EffectSettingsConfig = {},
): EffectSettingsConfig {
  const mergedSettings: EffectSettingsConfig = {};

  for (const settingKey of EFFECT_SETTING_KEYS) {
    const setting = customSettings[settingKey] || baseSettings[settingKey];
    if (!setting) continue;

    mergedSettings[settingKey] = setting;
  }

  const normalized: EffectSettingsConfig = {};

  for (const settingKey of EFFECT_SETTING_KEYS) {
    const setting = mergedSettings[settingKey];
    if (!setting) continue;

    normalized[settingKey] = {
      options: setting.options,
      defaultValue: setting.defaultValue || setting.options[0]?.value || "",
    };
  }

  return normalized;
}

const DEFAULT_PIXVERSE_VIDEO_CALCULATE_CREDITS: EffectModelConfig["calculateCredits"] =
  (settings) => {
    let baseCredits = settings.duration === "5" ? 4 : 8;
    let credits = baseCredits;

    switch (settings.quality) {
      case "360p":
        break;
      case "540p":
        break;
      case "720p":
        credits = credits * 2;
        break;
      case "1080p":
        credits = credits * 3;
        break;
      default:
        break;
    }

    return credits;
  };

function normalizePixverseVideoEffectModel(
  effect: PixverseVideoEffectModelInput,
): EffectModelConfig {
  return {
    ...effect,
    provider: effect.provider ?? EffectProvider.PIXVERSE,
    outputType: "video",
    pixverseMode: effect.pixverseMode ?? "image_to_video",
    model: effect.model ?? "v5.5",
    status: effect.status ?? "active",
    maxImages: effect.maxImages ?? 1,
    settings: mergeEffectSettings(DEFAULT_VIDEO_SETTINGS, effect.settings),
    calculateCredits:
      effect.calculateCredits ?? DEFAULT_PIXVERSE_VIDEO_CALCULATE_CREDITS,
  };
}

function normalizeImageEffectModel(
  effect: ImageEffectModelInput,
): EffectModelConfig {
  return {
    ...effect,
    outputType: "image",
    status: effect.status ?? "active",
    maxImages: effect.maxImages ?? 1,
    settings: mergeEffectSettings(
      getDefaultImageSettings(effect.provider),
      effect.settings,
    ),
  };
}

const PIXVERSE_VIDEO_EFFECTS: PixverseVideoEffectModelInput[] = [
  {
    id: "my-girlfriendssss",
    name: "My Girlfriendssss",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 349232644550272,
  },

  {
    id: "paw-princess",
    name: "Paw Princess",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 330448062595520,
  },

  {
    id: "muscle-max-bodybuilder-champion",
    name: "Muscle Max: Bodybuilder Champion",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 350496364287680,
  },

  {
    id: "kitten-hide-and-seek",
    name: "Kitten Hide and Seek",
    provider: EffectProvider.PIXVERSE,
    settings: {
      duration: {
        options: [
          { label: "5s", value: "5" },
          { label: "8s", value: "8" },
        ],
        defaultValue: "5",
      },
    },
    pixverseTemplateId: 354568167143040,
  },

  {
    id: "360-microwave",
    name: "360° Microwave",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 324641385496960,
  },

  {
    id: "ride-my-porsche",
    name: "Ride My Porsche",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 347130807494528,
  },

  {
    id: "petals-of-goodbye",
    name: "Petals of Goodbye",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 352956065691584,
  },

  {
    id: "liquid-metal",
    name: "Liquid Metal",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 342180291926592,
  },

  {
    id: "hi-five-emoji-twin",
    name: "Hi-Five Emoji Twin",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 351907687030400,
  },

  {
    id: "boom-drop",
    name: "BOOM DROP",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 339133943656192,
  },

  {
    id: "2025-oscar-winner",
    name: "2025 Oscar Winner",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 321956810449792,
  },

  {
    id: "kiss-me-ai",
    name: "Kiss Me, AI!",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 321958627120000,
  },

  {
    id: "muscle-surge",
    name: "Muscle Surge",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 308621408717184,
  },

  {
    id: "thunder-god",
    name: "Thunder God",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 340383170699072,
  },

  {
    id: "ninja-shadow-clone",
    name: "Ninja Shadow Clone",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 354371350649280,
  },

  {
    id: "my-boyfriendsssss",
    name: "My Boyfriendsssss",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 349232463042176,
  },

  {
    id: "eye-zoom-challenge",
    name: "Eye Zoom Challenge",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 339848996187712,
  },

  {
    id: "officer-crush",
    name: "Officer Crush",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 353279785150016,
  },

  {
    id: "fairy-wings",
    name: "Fairy Wings",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 341983360051008,
  },

  {
    id: "money-tornado",
    name: "Money Tornado",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 327829606196096,
  },

  {
    id: "middle-finger-up",
    name: "Middle Finger Up",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 353326100438592,
  },

  {
    id: "earth-zoom-challenge",
    name: "Earth Zoom Challenge",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 349110259052160,
  },

  {
    id: "kiss-kiss",
    name: "Kiss Kiss",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 315446315336768,
  },

  {
    id: "birthday-surprise",
    name: "Birthday Surprise",
    provider: EffectProvider.PIXVERSE,
    settings: {
      duration: {
        options: [{ label: "4s", value: "4" }],
        defaultValue: "4",
      },
    },
    pixverseTemplateId: 352981446212096,
  },

  {
    id: "private-airplane",
    name: "Private Airplane",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 347847915659136,
  },

  {
    id: "fire-roar",
    name: "Fire Roar",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 326607027713088,
  },

  {
    id: "ghibli-magic",
    name: "Ghibli Magic",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 330688573362560,
  },

  {
    id: "dust-me-away",
    name: "Dust Me Away",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 344080941597120,
  },

  {
    id: "buddha-s-blessing",
    name: "Buddha's Blessing",
    provider: EffectProvider.PIXVERSE,
    pixverseTemplateId: 354340119359936,
  },
];

const IMAGE_EFFECTS: ImageEffectModelInput[] = [
  {
    id: "ghibli-style",
    name: "Ghibli Style",
    provider: EffectProvider.KIE,
    outputType: "image",
    estimatedGenerationTime: 30,
    prompt:
      "Redraw [a photo of a landscape or person] in the style of a Studio Ghibli animated film. Nostalgic, with hand-painted backgrounds, soft colors, and lush nature.",
    model: "nano-banana-pro",
    calculateCredits: () => 2,
  },

  {
    id: "gallop-into-2026",
    name: "Gallop into 2026",
    provider: EffectProvider.PIXVERSE,
    outputType: "image",
    model: "pixverse-template",
    calculateCredits: () => 30,
    pixverseTemplateId: 378813799935040,
    pixverseMode: "image_template",
  },

  {
    id: "2026-player-calendar",
    name: "2026 Player Calendar",
    provider: EffectProvider.PIXVERSE,
    outputType: "image",
    model: "pixverse-template",
    calculateCredits: () => 30,
    pixverseTemplateId: 377378608924544,
    pixverseMode: "image_template",
  },
];

const ALL_EFFECTS: EffectModelConfig[] = [
  ...PIXVERSE_VIDEO_EFFECTS.map(normalizePixverseVideoEffectModel),
  ...IMAGE_EFFECTS.map(normalizeImageEffectModel),
];

export const EFFECT_MODELS: Record<string, EffectModelConfig> =
  ALL_EFFECTS.reduce(
    (acc, effect) => {
      if (acc[effect.id]) {
        throw new Error(
          `[effect-models] Duplicate effect id found: ${effect.id}`,
        );
      }
      acc[effect.id] = effect;
      return acc;
    },
    {} as Record<string, EffectModelConfig>,
  );

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

  const finalSettings = {
    ...getEffectDefaultSettings(effectId),
    ...settings,
  };

  return model.calculateCredits(finalSettings);
}

export function getEffectDefaultSettings(
  effectId: string,
): Record<string, string> {
  const model = EFFECT_MODELS[effectId];
  if (!model) return {};
  const defaults: Record<string, string> = {};

  for (const settingKey of EFFECT_SETTING_KEYS) {
    const setting = model.settings[settingKey];
    if (!setting) continue;
    defaults[settingKey] =
      setting.defaultValue || setting.options[0]?.value || "";
  }

  return defaults;
}

export function getEffectFormSettings(effectId: string): EffectSettingDef[] {
  const model = EFFECT_MODELS[effectId];
  if (!model) return [];

  return EFFECT_SETTING_KEYS.flatMap((settingKey) => {
    const setting = model.settings[settingKey];
    if (!setting) return [];

    return [
      {
        key: settingKey,
        label: EFFECT_SETTING_LABELS[settingKey],
        options: setting.options,
        defaultValue: setting.defaultValue || setting.options[0]?.value || "",
      },
    ];
  });
}
