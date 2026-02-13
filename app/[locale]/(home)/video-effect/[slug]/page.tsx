import { notFound } from "next/navigation";
import EffectLandingPage from "@/components/blocks/effect-landing-page";
import VideoEffectTool from "@/components/blocks/video-effect-tool";
import { getEffectFormSettings, getEffectModel } from "@/config/effect-models";
import {
  VIDEO_EFFECT_PAGES,
  isValidVideoEffectSlug,
} from "@/config/video-effect-pages";
import { locales } from "@/i18n/locale";
import { getVideoEffectPage } from "@/services/page";
import type { EffectLandingPageContent } from "@/types/pages/video-effect-page";

type Params = {
  locale: string;
  slug: string;
};

const localizeHref = (href: string, locale: string) => {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  if (locale === "en") {
    return href;
  }

  if (href.startsWith(`/${locale}/`)) {
    return href;
  }

  if (href.startsWith("/")) {
    return `/${locale}${href}`;
  }

  return `/${locale}/${href}`;
};

const withLocalizedRelatedEffects = (
  page: EffectLandingPageContent | undefined,
  locale: string
): EffectLandingPageContent => {
  if (!page?.relatedEffects?.effects) {
    return page ?? {};
  }

  return {
    ...page,
    relatedEffects: {
      ...page.relatedEffects,
      effects: page.relatedEffects.effects.map((effect) => ({
        ...effect,
        href: effect.href ? localizeHref(effect.href, locale) : effect.href,
      })),
    },
  };
};

/**
 * Generate static params for all effect × locale combinations
 */
export async function generateStaticParams(): Promise<Params[]> {
  const params: Params[] = [];

  for (const slug of VIDEO_EFFECT_PAGES) {
    for (const locale of locales) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}) {
  const { slug, locale } = params;

  if (!isValidVideoEffectSlug(slug)) {
    return {
      title: "Effect Not Found | Veo3 AI",
      description: "The requested video effect could not be found.",
      robots: "noindex,nofollow",
    };
  }

  const { page, seo } = await getVideoEffectPage(slug, locale);
  const heroTitle = page?.hero?.title;
  const heroSubtitle = page?.hero?.subtitle;
  const fallbackTitle = heroTitle
    ? `${heroTitle} | Veo3 AI`
    : "Video Effect | Veo3 AI";
  const fallbackDescription =
    heroSubtitle ?? "Create AI-powered video effects with Veo3 AI.";

  const canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${
    locale !== "en" ? `/${locale}` : ""
  }/video-effect/${slug}`;

  return {
    title: seo?.title ?? fallbackTitle,
    description: seo?.description ?? fallbackDescription,
    openGraph: {
      title: seo?.title ?? heroTitle ?? "Video Effect | Veo3 AI",
      description: seo?.description ?? fallbackDescription,
      url: canonicalUrl,
      type: "article",
      siteName: "Veo3 AI",
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: "index,follow",
  };
}

export default async function VideoEffectDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug, locale } = params;

  if (!isValidVideoEffectSlug(slug)) {
    notFound();
  }

  const { page, tool } = await getVideoEffectPage(slug, locale);
  const effectModel = getEffectModel(slug);

  const formConfig =
    tool?.form && effectModel
      ? {
          title: tool.form.title,
          backgroundImage: tool.form.backgroundImage,
          maxImages: effectModel.maxImages,
          minImages: effectModel.minImages ?? 1,
          settings: getEffectFormSettings(slug),
        }
      : undefined;

  const toolConfig =
    tool && effectModel
      ? {
          effectId: slug,
          effectSlug: slug,
          type: effectModel.outputType,
          showcaseItems: tool.showcaseItems,
          formConfig,
        }
      : undefined;

  const toolComponent = toolConfig ? (
    <VideoEffectTool config={toolConfig} />
  ) : undefined;

  const effectData = withLocalizedRelatedEffects(page, locale);

  return <EffectLandingPage {...effectData} toolComponent={toolComponent} />;
}
