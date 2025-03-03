import { LandingPage } from "@/types/pages/landing";
import { ReaderPage } from "@/types/pages/reader";
import { ChatPage } from "@/types/pages/chat";
import { CareerPage } from "@/types/pages/career";
import { ChineseZodiacPage } from "@/types/pages/chinese-zodiac";

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
export async function getCareerPage(locale: string): Promise<CareerPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/career/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load career/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/career/en.json").then(
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

export async function getChineseZodiacPage(
  locale: string
): Promise<ChineseZodiacPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/chinese-zodiac/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load chinese-zodiac/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/chinese-zodiac/en.json").then(
      (module) => module.default as ChineseZodiacPage
    );
  }
}
