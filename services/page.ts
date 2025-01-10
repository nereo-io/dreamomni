import { LandingPage } from "@/types/pages/landing";
import { ReaderPage } from "@/types/pages/reader";

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

export async function getReaderPage(locale: string): Promise<ReaderPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/reader/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(`Failed to load reader/${locale}.json, falling back to en.json`);
    return await import("@/i18n/pages/reader/en.json").then(
      (module) => module.default as ReaderPage
    );
  }
}
