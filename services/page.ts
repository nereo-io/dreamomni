import { LandingPage } from "@/types/pages/landing";
import { ReaderPage } from "@/types/pages/reader";
import { ChatPage } from "@/types/pages/chat";
import { CareerPage } from "@/types/pages/career";
import { ChineseZodiacPage } from "@/types/pages/chinese-zodiac";
import { Pricing } from "@/types/blocks/pricing";
import { QuestionSelector } from "@/types/blocks/question-selector";

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
export async function getCategoryPage(
  locale: string,
  category: string
): Promise<CareerPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/category-page/${category}/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load category-page/${category}/${locale}.json, falling back to en.json`
    );
    return await import(`@/i18n/category-page/${category}/en.json`).then(
      (module) => module.default as CareerPage
    );
  }
}

export async function getReaderPage(locale: string): Promise<ReaderPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/reader/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load reader/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/reader/en.json").then(
      (module) => module.default as ReaderPage
    );
  }
}

export async function getChatPage(locale: string): Promise<ChatPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(`@/i18n/pages/chat/${locale.toLowerCase()}.json`).then(
      (module) => module.default
    );
  } catch (error) {
    console.warn(`Failed to load chat/${locale}.json, falling back to en.json`);
    return await import("@/i18n/pages/chat/en.json").then(
      (module) => module.default as ChatPage
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

export async function getQuestionSelectorBlock(
  locale: string
): Promise<QuestionSelector> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/blocks/question-selector/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load question-selector/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/blocks/question-selector/en.json").then(
      (module) => module.default as QuestionSelector
    );
  }
}
