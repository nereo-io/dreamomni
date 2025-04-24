import { LandingPage } from "@/types/pages/landing";
import { ReaderPage } from "@/types/pages/reader";
import { ChatPage } from "@/types/pages/chat";
import { CareerPage } from "@/types/pages/career";
import { ChineseZodiacPage } from "@/types/pages/chinese-zodiac-calculator";
import { ChineseZodiacElements } from "@/types/pages/chinese-zodiac-elements";
import { Pricing } from "@/types/blocks/pricing";
import { QuestionSelector } from "@/types/blocks/question-selector";
import { PersonalityTestPage } from "@/types/pages/personality-test";
import { BaziQuestionsMessages } from "@/types/blocks/bazi-questions";
import { IChingLandingPage } from "@/types/pages/i-ching";
import { IChingContent } from "@/types/hexagram";

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

export async function getChineseZodiacPage(
  locale: string
): Promise<ChineseZodiacPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/chinese-zodiac-calculator/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load chinese-zodiac-calculator/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/chinese-zodiac-calculator/en.json").then(
      (module) => module.default as ChineseZodiacPage
    );
  }
}

export async function getChineseZodiacElementReadingPage(
  locale: string
): Promise<ChineseZodiacElements> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/chinese-zodiac-elements/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load chinese-zodiac-elements/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/chinese-zodiac-elements/en.json").then(
      (module) => module.default as ChineseZodiacElements
    );
  }
}

export async function getPersonalityTestPage(
  locale: string
): Promise<PersonalityTestPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/personality-test/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load personality-test/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/personality-test/en.json").then(
      (module) => module.default as PersonalityTestPage
    );
  }
}

export async function getFeedbackFormBlock(locale: string) {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(`@/i18n/blocks/feedback-form/${locale}.json`).then(
      (module) => module.default
    );
  } catch (error) {
    console.warn(
      `Failed to load feedback-form/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/blocks/feedback-form/en.json").then(
      (module) => module.default
    );
  }
}

export async function getIChingPage(
  locale: string
): Promise<IChingLandingPage> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/pages/i-ching/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load i-ching/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/pages/i-ching/en.json").then(
      (module) => module.default as IChingLandingPage
    );
  }
}

export async function getIChingContent(locale: string): Promise<IChingContent> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(`@/i18n/content/i-ching/${locale}.json`).then(
      (module) => module.default
    );
  } catch (error) {
    console.warn(
      `Failed to load i-ching/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/content/i-ching/en.json").then(
      (module) => module.default as IChingContent
    );
  }
}

export async function getBaziQuestionsMessages(
  locale: string
): Promise<BaziQuestionsMessages> {
  try {
    if (locale === "zh-CN") {
      locale = "zh";
    }
    return await import(
      `@/i18n/blocks/bazi-questions/${locale.toLowerCase()}.json`
    ).then((module) => module.default);
  } catch (error) {
    console.warn(
      `Failed to load bazi-questions/${locale}.json, falling back to en.json`
    );
    return await import("@/i18n/blocks/bazi-questions/en.json").then(
      (module) => module.default
    );
  }
}
