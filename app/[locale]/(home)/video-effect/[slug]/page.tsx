import { notFound } from "next/navigation";
import EffectLandingPage from "@/components/blocks/effect-landing-page";
import VideoEffectTool from "@/components/blocks/video-effect-tool";
import { getEffectModel } from "@/config/effect-models";
import {
  VIDEO_EFFECT_PAGES,
  isValidVideoEffectSlug,
} from "@/config/video-effect-pages";
import { locales } from "@/i18n/locale";
import { getVideoEffectPage } from "@/services/page";

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

const withLocalizedRelatedEffects = <
  T extends {
    relatedEffects?: { title: string; effects: Array<{ href: string }> };
  },
>(
  page: T,
  locale: string
): T => {
  return page.relatedEffects
    ? ({
        ...page,
        relatedEffects: {
          ...page.relatedEffects,
          effects: page.relatedEffects.effects.map((effect) => ({
            ...effect,
            href: localizeHref(effect.href, locale),
          })),
        },
      } as T)
    : page;
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

  const canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${
    locale !== "en" ? `/${locale}` : ""
  }/video-effect/${slug}`;

  return {
    title: seo?.title ?? `${page.hero.title} | Veo3 AI`,
    description: seo?.description ?? page.hero.subtitle,
    openGraph: {
      title: seo?.title ?? page.hero.title,
      description: seo?.description ?? page.hero.subtitle,
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
          baseCredits: effectModel.baseCredits,
          settings: effectModel.settings,
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

  return (
    <div className="min-h-screen">
      <EffectLandingPage {...effectData} toolComponent={toolComponent} />
    </div>
  );
}
