import { getTranslations } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";
import { getModelLandingPage } from "@/services/page";
import ModelLandingPage from "@/components/blocks/model-landing-page";
import {
  MODEL_LANDING_PAGES,
  isValidModelSlug,
} from "@/config/model-landing-pages";
import { defaultLocale, locales } from "@/i18n/locale";

type Params = {
  locale: string;
  model: string;
};

function getModelPath(locale: string, model: string): string {
  return locale === defaultLocale ? `/${model}` : `/${locale}/${model}`;
}

/**
 * Generate static params for all model × locale combinations
 */
export async function generateStaticParams(): Promise<Params[]> {
  const params: Params[] = [];

  for (const model of MODEL_LANDING_PAGES) {
    for (const locale of locales) {
      params.push({ locale, model });
    }
  }

  return params;
}

/**
 * Generate metadata for model landing pages
 */
export async function generateMetadata({
  params: { locale, model },
}: {
  params: Params;
}) {
  if (!isValidModelSlug(model)) {
    return {};
  }

  const t = await getTranslations();

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const title = t(`${model}.title`);
  const description = t(`${model}.description`);
  const languages = Object.fromEntries(
    locales.map((item) => [item, `${baseUrl}${getModelPath(item, model)}`])
  );

  languages["x-default"] = `${baseUrl}${getModelPath(defaultLocale, model)}`;

  let canonicalUrl = `${baseUrl}/${model}`;

  if (locale !== "en") {
    canonicalUrl = `${baseUrl}/${locale}/${model}`;
  }

  return {
    title,
    description,
    keywords: t(`${model}.keywords`),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "GeminiOmni",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Unified model landing page component
 */
export default async function ModelPage({
  params: { locale, model },
}: {
  params: Params;
}) {
  if (model === "wan-2-5") {
    permanentRedirect(locale === "en" ? "/image-to-video" : `/${locale}/image-to-video`);
  }

  // Validate model slug
  if (!isValidModelSlug(model)) {
    notFound();
  }

  // Load page data
  const page = await getModelLandingPage(model, locale);

  return <ModelLandingPage page={page} />;
}
