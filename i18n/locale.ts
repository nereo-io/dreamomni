import { Pathnames } from "next-intl/routing";

export const locales = ["en", "zh", "ja", "ko", "zh-TW", "fr"];

export const localeNames: any = {
  en: "English",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
  "zh-TW": "繁體中文",
  fr: "Français",
};

export const defaultLocale = "en";

export const localePrefix = "as-needed";

export const localeDetection =
  process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true";

export const pathnames = {
  en: {
    "privacy-policy": "/privacy-policy",
    "terms-of-service": "/terms-of-service",
  },
} satisfies Pathnames<typeof locales>;
