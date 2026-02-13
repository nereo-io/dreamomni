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
  "my-girlfriendssss": {
    id: "my-girlfriendssss",
    name: "My Girlfriendssss",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 349232644550272,
    pixverseMode: "image_to_video",
  },
  "paw-princess": {
    id: "paw-princess",
    name: "Paw Princess",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 330448062595520,
    pixverseMode: "image_to_video",
  },
  "muscle-max-bodybuilder-champion": {
    id: "muscle-max-bodybuilder-champion",
    name: "Muscle Max: Bodybuilder Champion",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 350496364287680,
    pixverseMode: "image_to_video",
  },
  "kitten-hide-and-seek": {
    id: "kitten-hide-and-seek",
    name: "Kitten Hide and Seek",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "6s", value: "6" },
        ],
        defaultValue: "6",
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 354568167143040,
    pixverseMode: "image_to_video",
  },
  "360-microwave": {
    id: "360-microwave",
    name: "360° Microwave",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 324641385496960,
    pixverseMode: "image_to_video",
  },
  "ride-my-porsche": {
    id: "ride-my-porsche",
    name: "Ride My Porsche",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 347130807494528,
    pixverseMode: "image_to_video",
  },
  "petals-of-goodbye": {
    id: "petals-of-goodbye",
    name: "Petals of Goodbye",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 352956065691584,
    pixverseMode: "image_to_video",
  },
  "liquid-metal": {
    id: "liquid-metal",
    name: "Liquid Metal",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 342180291926592,
    pixverseMode: "image_to_video",
  },
  "hi-five-emoji-twin": {
    id: "hi-five-emoji-twin",
    name: "Hi-Five Emoji Twin",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 351907687030400,
    pixverseMode: "image_to_video",
  },
  "boom-drop": {
    id: "boom-drop",
    name: "BOOM DROP",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 339133943656192,
    pixverseMode: "image_to_video",
  },
  "2025-oscar-winner": {
    id: "2025-oscar-winner",
    name: "2025 Oscar Winner",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 321956810449792,
    pixverseMode: "image_to_video",
  },
  "kiss-me-ai": {
    id: "kiss-me-ai",
    name: "Kiss Me, AI!",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 321958627120000,
    pixverseMode: "image_to_video",
  },
  "muscle-surge": {
    id: "muscle-surge",
    name: "Muscle Surge",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 308621408717184,
    pixverseMode: "image_to_video",
  },
  "thunder-god": {
    id: "thunder-god",
    name: "Thunder God",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 340383170699072,
    pixverseMode: "image_to_video",
  },
  "ninja-shadow-clone": {
    id: "ninja-shadow-clone",
    name: "Ninja Shadow Clone",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 354371350649280,
    pixverseMode: "image_to_video",
  },
  "my-boyfriendsssss": {
    id: "my-boyfriendsssss",
    name: "My Boyfriendsssss",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 349232463042176,
    pixverseMode: "image_to_video",
  },
  "eye-zoom-challenge": {
    id: "eye-zoom-challenge",
    name: "Eye Zoom Challenge",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 339848996187712,
    pixverseMode: "image_to_video",
  },
  "officer-crush": {
    id: "officer-crush",
    name: "Officer Crush",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 353279785150016,
    pixverseMode: "image_to_video",
  },
  "fairy-wings": {
    id: "fairy-wings",
    name: "Fairy Wings",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 341983360051008,
    pixverseMode: "image_to_video",
  },
  "money-tornado": {
    id: "money-tornado",
    name: "Money Tornado",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 327829606196096,
    pixverseMode: "image_to_video",
  },
  "middle-finger-up": {
    id: "middle-finger-up",
    name: "Middle Finger Up",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 353326100438592,
    pixverseMode: "image_to_video",
  },
  "earth-zoom-challenge": {
    id: "earth-zoom-challenge",
    name: "Earth Zoom Challenge",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 349110259052160,
    pixverseMode: "image_to_video",
  },
  "kiss-kiss": {
    id: "kiss-kiss",
    name: "Kiss Kiss",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 315446315336768,
    pixverseMode: "image_to_video",
  },
  "birthday-surprise": {
    id: "birthday-surprise",
    name: "Birthday Surprise",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "4s", value: "4" },
        ],
        defaultValue: "4",
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 352981446212096,
    pixverseMode: "image_to_video",
  },
  "private-airplane": {
    id: "private-airplane",
    name: "Private Airplane",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 347847915659136,
    pixverseMode: "image_to_video",
  },
  "fire-roar": {
    id: "fire-roar",
    name: "Fire Roar",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 326607027713088,
    pixverseMode: "image_to_video",
  },
  "ghibli-magic": {
    id: "ghibli-magic",
    name: "Ghibli Magic",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 330688573362560,
    pixverseMode: "image_to_video",
  },
  "dust-me-away": {
    id: "dust-me-away",
    name: "Dust Me Away",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 344080941597120,
    pixverseMode: "image_to_video",
  },
  "buddha-s-blessing": {
    id: "buddha-s-blessing",
    name: "Buddha's Blessing",
    provider: EffectProvider.PIXVERSE,
    outputType: "video",
    status: "active",
    baseCredits: 10,
    maxImages: 1,
    settings: [
      {
        key: "duration",
        label: "Duration",
        options: [
          { label: "5s", value: "5" },
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
          { label: "Auto", value: "auto" },
        ],
        defaultValue: "auto",
      },
    ],
    calculateCredits: () => 10,
    prompt: "",
    model: "v5.5",
    pixverseTemplateId: 354340119359936,
    pixverseMode: "image_to_video",
  },
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
