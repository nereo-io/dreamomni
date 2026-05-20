import { locales } from "@/i18n/locale";
import { Metadata } from "next";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_WEB_URL || "https://geminiomni.tv";
}

function buildLocalizedLegalUrl(locale: string, path: string) {
  const baseUrl = getBaseUrl();
  return locale === "en" ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`;
}

export function buildLegalPageMetadata(
  locale: string,
  path: string,
  title: string
): Metadata {
  const localizedLanguages = locales.reduce<Record<string, string>>(
    (languages, supportedLocale) => {
      languages[supportedLocale] = buildLocalizedLegalUrl(supportedLocale, path);
      return languages;
    },
    {}
  );

  return {
    title,
    alternates: {
      canonical: buildLocalizedLegalUrl(locale, path),
      languages: {
        "x-default": buildLocalizedLegalUrl("en", path),
        ...localizedLanguages,
      },
    },
    openGraph: {
      url: buildLocalizedLegalUrl(locale, path),
    },
  };
}
