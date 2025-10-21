import { LandingPage } from "@/types/pages/landing";
import { Pricing } from "@/types/blocks/pricing";
import { ClaudeSonnetFeaturesBlockTranslations } from "@/types/blocks/claude-sonnet-features";
import { TextToVideoPage } from "@/types/pages/text-to-video";
import { ImageToVideoPage } from "@/types/pages/image-to-video";
import { ModelLandingPage } from "@/types/pages/model-landing-page";

export async function getLandingPage(locale: string): Promise<LandingPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/landing/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(`Failed to load ${locale}.json, falling back to en.json`);
    return await import("@/i18n/pages/landing/en.json").then(
      (module) => module.default as LandingPage
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

export async function getPricingBlock(locale: string): Promise<Pricing> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/blocks/pricing/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load pricing/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/blocks/pricing/en.json").then(
      (module) => module.default as Pricing
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

export async function getTextToVideoPage(
  locale: string
): Promise<TextToVideoPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/text-to-video/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load text-to-video/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/text-to-video/en.json").then(
      (module) => module.default as TextToVideoPage
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
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load image-to-video/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/image-to-video/en.json").then(
      (module) => module.default as ImageToVideoPage
    );
  }
}

export async function getReferenceToVideoPage(
  locale: string
): Promise<ImageToVideoPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/reference-to-video/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load reference-to-video/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/reference-to-video/en.json").then(
      (module) => module.default as ImageToVideoPage
    );
  }
}
