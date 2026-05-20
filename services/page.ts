import { LandingPage } from "@/types/pages/landing";
import { Pricing } from "@/types/blocks/pricing";
import { ClaudeSonnetFeaturesBlockTranslations } from "@/types/blocks/claude-sonnet-features";
import { SeedanceFeaturesBlockTranslations } from "@/types/blocks/seedance-features";
import { TextToVideoPage } from "@/types/pages/text-to-video";
import { ImageToVideoPage } from "@/types/pages/image-to-video";
import { ReferenceToVideoPage } from "@/types/pages/reference-to-video";
import { TextToImagePage } from "@/types/pages/text-to-image";
import { ImageToImagePage } from "@/types/pages/image-to-image";
import { ModelLandingPage } from "@/types/pages/model-landing-page";
import { ImageEffectPage } from "@/types/pages/image-effect-page";
import { VideoEffectPage } from "@/types/pages/video-effect-page";
import { sanitizeGeminiOmniContent } from "@/config/geminiomni-messages";

export async function getLandingPage(locale: string): Promise<LandingPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/landing/${locale.toLowerCase()}.json`
    ).then((module) => sanitizeGeminiOmniContent(module.default as LandingPage));
  } catch (error) {
    console.warn(`Failed to load ${locale}.json, falling back to en.json`);
    return await import("@/i18n/pages/landing/en.json").then(
      (module) => sanitizeGeminiOmniContent(module.default as LandingPage)
    );
  }
}
/**
 * Unified model landing page data loader
 * @param model - Model slug (e.g., 'nano-banana', 'wan-2-5')
 * @param locale - User locale
 */
export async function getModelLandingPage(
  model: string,
  locale: string
): Promise<ModelLandingPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/model-landing/${model}/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load ${model}/${locale}.json, falling back to en.json`
    );
    return await import(`@/i18n/pages/model-landing/${model}/en.json`).then(
      (module) => module.default as ModelLandingPage
    );
  }
}

/**
 * Image effect landing page data loader
 * @param slug - Effect slug (e.g., 'ghibli-style')
 * @param locale - User locale
 */
export async function getImageEffectPage(
  slug: string,
  locale: string
): Promise<ImageEffectPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/image-effect/${slug}/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load image-effect/${slug}/${locale}.json, falling back to en.json`
    );
    return await import(`@/i18n/pages/image-effect/${slug}/en.json`).then(
      (module) => module.default as ImageEffectPage
    );
  }
}

/**
 * Video effect landing page data loader
 * @param slug - Effect slug (e.g., 'ai-kissing')
 * @param locale - User locale
 */
export async function getVideoEffectPage(
  slug: string,
  locale: string
): Promise<VideoEffectPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/video-effect/${slug}/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load video-effect/${slug}/${locale}.json, falling back to en.json`
    );
    return await import(`@/i18n/pages/video-effect/${slug}/en.json`).then(
      (module) => module.default as VideoEffectPage
    );
  }
}

export async function getPricingBlock(locale: string): Promise<Pricing> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/blocks/pricing/${locale.toLowerCase()}.json`
    ).then((module) => sanitizeGeminiOmniContent(module.default as Pricing));
  } catch (error) {
    console.warn(
      `Failed to load pricing/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/blocks/pricing/en.json").then(
      (module) => sanitizeGeminiOmniContent(module.default as Pricing)
    );
  }
}

export async function getClaudeSonnetFeaturesBlock(
  locale: string
): Promise<ClaudeSonnetFeaturesBlockTranslations> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/blocks/claude-sonnet-features/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load claude-sonnet-features/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/blocks/claude-sonnet-features/en.json").then(
      (module) => module.default as ClaudeSonnetFeaturesBlockTranslations
    );
  }
}

export async function getSeedanceFeaturesBlock(
  locale: string
): Promise<SeedanceFeaturesBlockTranslations> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/blocks/seedance-features/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load seedance-features/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/blocks/seedance-features/en.json").then(
      (module) => module.default as SeedanceFeaturesBlockTranslations
    );
  }
}

export async function getTextToVideoPage(
  locale: string
): Promise<TextToVideoPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/text-to-video/${locale.toLowerCase()}.json`
    ).then((module) =>
      sanitizeGeminiOmniContent(module.default as TextToVideoPage)
    );
  } catch (error) {
    console.warn(
      `Failed to load text-to-video/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/text-to-video/en.json").then(
      (module) => sanitizeGeminiOmniContent(module.default as TextToVideoPage)
    );
  }
}

export async function getImageToVideoPage(
  locale: string
): Promise<ImageToVideoPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/image-to-video/${locale.toLowerCase()}.json`
    ).then((module) =>
      sanitizeGeminiOmniContent(module.default as ImageToVideoPage)
    );
  } catch (error) {
    console.warn(
      `Failed to load image-to-video/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/image-to-video/en.json").then(
      (module) => sanitizeGeminiOmniContent(module.default as ImageToVideoPage)
    );
  }
}

export async function getVideoFeatureShowcaseBlock(
  locale: string
): Promise<any> {
  // Return empty data for now since we don't have video-feature-showcase data files
  return {
    title: "",
    description: "",
    features: [],
  };
}

export async function getReferenceToVideoPage(
  locale: string
): Promise<ReferenceToVideoPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/reference-to-video/${locale.toLowerCase()}.json`
    ).then((module) =>
      sanitizeGeminiOmniContent(module.default as ReferenceToVideoPage)
    );
  } catch (error) {
    console.warn(
      `Failed to load reference-to-video/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/reference-to-video/en.json").then(
      (module) =>
        sanitizeGeminiOmniContent(module.default as ReferenceToVideoPage)
    );
  }
}

export async function getMotionControlPage(
  locale: string
): Promise<ReferenceToVideoPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/motion-control/${locale.toLowerCase()}.json`
    ).then((module) =>
      sanitizeGeminiOmniContent(module.default as ReferenceToVideoPage)
    );
  } catch (error) {
    console.warn(
      `Failed to load motion-control/${locale}.json, falling back to en.json`
    );
    // Fallback to reference-to-video en.json if motion-control en.json doesn't exist yet
    return await getReferenceToVideoPage("en");
  }
}

export async function getTextToImagePage(
  locale: string
): Promise<TextToImagePage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/text-to-image/${locale.toLowerCase()}.json`
    ).then((module) =>
      sanitizeGeminiOmniContent(module.default as TextToImagePage)
    );
  } catch (error) {
    console.warn(
      `Failed to load text-to-image/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/text-to-image/en.json").then(
      (module) => sanitizeGeminiOmniContent(module.default as TextToImagePage)
    );
  }
}

export async function getImageToImagePage(
  locale: string
): Promise<ImageToImagePage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/image-to-image/${locale.toLowerCase()}.json`
    ).then((module) =>
      sanitizeGeminiOmniContent(module.default as ImageToImagePage)
    );
  } catch (error) {
    console.warn(
      `Failed to load image-to-image/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/image-to-image/en.json").then(
      (module) => sanitizeGeminiOmniContent(module.default as ImageToImagePage)
    );
  }
}
