import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getModelLandingPage } from "@/services/page";
import ModelLandingPage from "@/components/blocks/model-landing-page";
import {
  MODEL_LANDING_PAGES,
  isValidModelSlug,
} from "@/config/model-landing-pages";
import { locales } from "@/i18n/locale";

type Params = {
  locale: string;
  model: string;
};

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

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${model}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/${model}`;
  }

  return {
    title: t(`${model}.title`),
    description: t(`${model}.description`),
    keywords: t(`${model}.keywords`),
    alternates: {
      canonical: canonicalUrl,
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
  // Validate model slug
  if (!isValidModelSlug(model)) {
    notFound();
  }

  // Load page data
  const page = await getModelLandingPage(model, locale);

  return <ModelLandingPage page={page} />;
}
