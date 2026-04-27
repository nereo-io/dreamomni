import { Pathnames } from "next-intl/routing";

export const locales = ["en", "ru", "ja", "ko", "de", "fr", "es", "pt"];

export const localeNames: any = {
  en: "English",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português",
};

export const defaultLocale = "en";

export const localePrefix = "as-needed";

export const localeDetection =
  process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true";

export const pathnames = {
  "/privacy-policy": "/privacy-policy",
  "/terms-of-service": "/terms-of-service",
  "/refund-policy": "/refund-policy",
} satisfies Pathnames<typeof locales>;
