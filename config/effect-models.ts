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

interface PixverseVideoEffectSeed {
  id: string;
  name: string;
  pixverseTemplateId: number;
  baseCredits?: number;
  maxImages?: number;
  durationOptions?: string[];
  qualityOptions?: string[];
}

const DEFAULT_PIXVERSE_VIDEO_DURATIONS = ["5"];
const DEFAULT_PIXVERSE_VIDEO_QUALITIES = ["360p", "540p", "720p", "1080p"];

function normalizeSettingValues(
  values: string[] | undefined,
  fallback: string[],
): string[] {
  if (!values || values.length === 0) {
    return [...fallback];
  }

  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (normalized.length === 0) {
    return [...fallback];
  }

  return Array.from(new Set(normalized));
}

function buildPixverseVideoSettings(
  durationOptions?: string[],
  qualityOptions?: string[],
): EffectSettingDef[] {
  const durations = normalizeSettingValues(
    durationOptions,
    DEFAULT_PIXVERSE_VIDEO_DURATIONS,
  );
  const qualities = normalizeSettingValues(
    qualityOptions,
    DEFAULT_PIXVERSE_VIDEO_QUALITIES,
  );
  const defaultQuality = qualities.includes("540p")
    ? "540p"
    : qualities[0] || "540p";

  return [
    {
      key: "duration",
      label: "Duration",
      options: durations.map((duration) => ({
        label: `${duration}s`,
        value: duration,
      })),
      defaultValue: durations[0] || "5",
    },
    {
      key: "quality",
      label: "Quality",
      options: qualities.map((quality) => ({
        label: quality,
        value: quality,
      })),
      defaultValue: defaultQuality,
    },
    {
      key: "ratio",
      label: "Aspect Ratio",
      options: [{ label: "Auto", value: "auto" }],
      defaultValue: "auto",
    },
  ];
}

function createPixverseVideoEffect(
  seed: PixverseVideoEffectSeed,
): EffectModelConfig {
  const baseCredits = seed.baseCredits ?? 10;

  return {
    id: seed.id,
    name: seed.name,
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits,
    maxImages: seed.maxImages ?? 1,
    settings: buildPixverseVideoSettings(
      seed.durationOptions,
      seed.qualityOptions,
    ),
    calculateCredits: () => baseCredits,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: seed.pixverseTemplateId,
    pixverseMode: "image_to_video",
  };
}

const PIXVERSE_VIDEO_EFFECT_SEEDS: PixverseVideoEffectSeed[] = [
  {
    id: "my-girlfriendssss",
    name: "My Girlfriendssss",
    pixverseTemplateId: 349232644550272,
  },
  {
    id: "paw-princess",
    name: "Paw Princess",
    pixverseTemplateId: 330448062595520,
  },
  {
    id: "muscle-max-bodybuilder-champion",
    name: "Muscle Max: Bodybuilder Champion",
    pixverseTemplateId: 350496364287680,
  },
  {
    id: "kitten-hide-and-seek",
    name: "Kitten Hide and Seek",
    pixverseTemplateId: 354568167143040,
    durationOptions: ["6"],
  },
  {
    id: "360-microwave",
    name: "360° Microwave",
    pixverseTemplateId: 324641385496960,
  },
  {
    id: "ride-my-porsche",
    name: "Ride My Porsche",
    pixverseTemplateId: 347130807494528,
  },
  {
    id: "petals-of-goodbye",
    name: "Petals of Goodbye",
    pixverseTemplateId: 352956065691584,
  },
  {
    id: "liquid-metal",
    name: "Liquid Metal",
    pixverseTemplateId: 342180291926592,
  },
  {
    id: "hi-five-emoji-twin",
    name: "Hi-Five Emoji Twin",
    pixverseTemplateId: 351907687030400,
  },
  { id: "boom-drop", name: "BOOM DROP", pixverseTemplateId: 339133943656192 },
  {
    id: "2025-oscar-winner",
    name: "2025 Oscar Winner",
    pixverseTemplateId: 321956810449792,
  },
  {
    id: "kiss-me-ai",
    name: "Kiss Me, AI!",
    pixverseTemplateId: 321958627120000,
  },
  {
    id: "muscle-surge",
    name: "Muscle Surge",
    pixverseTemplateId: 308621408717184,
  },
  {
    id: "thunder-god",
    name: "Thunder God",
    pixverseTemplateId: 340383170699072,
  },
  {
    id: "ninja-shadow-clone",
    name: "Ninja Shadow Clone",
    pixverseTemplateId: 354371350649280,
  },
  {
    id: "my-boyfriendsssss",
    name: "My Boyfriendsssss",
    pixverseTemplateId: 349232463042176,
  },
  {
    id: "eye-zoom-challenge",
    name: "Eye Zoom Challenge",
    pixverseTemplateId: 339848996187712,
  },
  {
    id: "officer-crush",
    name: "Officer Crush",
    pixverseTemplateId: 353279785150016,
  },
  {
    id: "fairy-wings",
    name: "Fairy Wings",
    pixverseTemplateId: 341983360051008,
  },
  {
    id: "money-tornado",
    name: "Money Tornado",
    pixverseTemplateId: 327829606196096,
  },
  {
    id: "middle-finger-up",
    name: "Middle Finger Up",
    pixverseTemplateId: 353326100438592,
  },
  {
    id: "earth-zoom-challenge",
    name: "Earth Zoom Challenge",
    pixverseTemplateId: 349110259052160,
  },
  { id: "kiss-kiss", name: "Kiss Kiss", pixverseTemplateId: 315446315336768 },
  {
    id: "birthday-surprise",
    name: "Birthday Surprise",
    pixverseTemplateId: 352981446212096,
    durationOptions: ["4"],
  },
  {
    id: "private-airplane",
    name: "Private Airplane",
    pixverseTemplateId: 347847915659136,
  },
  { id: "fire-roar", name: "Fire Roar", pixverseTemplateId: 326607027713088 },
  {
    id: "ghibli-magic",
    name: "Ghibli Magic",
    pixverseTemplateId: 330688573362560,
  },
  {
    id: "dust-me-away",
    name: "Dust Me Away",
    pixverseTemplateId: 344080941597120,
  },
  {
    id: "buddha-s-blessing",
    name: "Buddha's Blessing",
    pixverseTemplateId: 354340119359936,
  },
];

const PIXVERSE_VIDEO_EFFECT_MODELS = Object.fromEntries(
  PIXVERSE_VIDEO_EFFECT_SEEDS.map((seed) => [
    seed.id,
    createPixverseVideoEffect(seed),
  ]),
) as Record<string, EffectModelConfig>;

export const EFFECT_MODELS: Record<string, EffectModelConfig> = {
  ...PIXVERSE_VIDEO_EFFECT_MODELS,
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
