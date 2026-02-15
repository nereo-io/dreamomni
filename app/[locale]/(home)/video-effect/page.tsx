import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EffectRelatedGrid } from '@/components/blocks/effect-landing-page/effect-related-grid';
import { VIDEO_EFFECT_PAGES } from '@/config/video-effect-pages';
import { getAllEffectConfigs } from '@/models/effectConfig';
import { getVideoEffectPage } from '@/services/page';

interface PageParams {
  locale: string;
}

interface VideoEffectCard {
  id: string;
  title: string;
  image: string;
  href: string;
}

const getEffectHref = (slug: string, locale: string) => {
  if (locale === 'en') {
    return `/video-effect/${slug}`;
  }

  return `/${locale}/video-effect/${slug}`;
};

const getStaticEffectPreview = async (slug: string, locale: string) => {
  const { page, tool } = await getVideoEffectPage(slug, locale);
  const heroMedia = page?.hero?.showcaseMedia ?? [];
  const firstShowcaseItem = tool?.showcaseItems?.[0];

  const imageShowcase = heroMedia.find((media) => media.type === 'image')?.src;
  const posterShowcase = heroMedia.find((media) => media.type === 'video')?.poster;

  return {
    title: page?.hero?.title ?? tool?.form?.title ?? slug,
    image:
      firstShowcaseItem?.preview_gif ||
      firstShowcaseItem?.imageUrl ||
      tool?.form?.backgroundImage ||
      imageShowcase ||
      posterShowcase ||
      '/placeholder-effect.svg',
  };
};

export async function generateMetadata({
  params: { locale },
}: {
  params: PageParams;
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/video-effect`;

  if (locale !== 'en') {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/video-effect`;
  }

  return {
    title: t('pages.videoEffects.title'),
    description: t('pages.videoEffects.description'),
    keywords: t('pages.videoEffects.keywords'),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function VideoEffectPage({
  params: { locale },
}: {
  params: PageParams;
}) {
  if (process.env.NEXT_PUBLIC_EFFECTS_ENABLED !== 'true') {
    notFound();
  }

  const effectConfigs = await getAllEffectConfigs(locale);
  const effectConfigMap = new Map(
    effectConfigs.map((effect) => [effect.slug, effect])
  );

  const effects = await Promise.all(
    VIDEO_EFFECT_PAGES.map(async (slug): Promise<VideoEffectCard> => {
      const effect = await getStaticEffectPreview(slug, locale);
      const dynamicEffect = effectConfigMap.get(slug);
      const dynamicPreviewImage =
        dynamicEffect?.preview_gif ||
        dynamicEffect?.preview_thumbnail ||
        dynamicEffect?.preview_image;

      return {
        id: slug,
        title: effect.title,
        image: dynamicPreviewImage || effect.image,
        href: getEffectHref(slug, locale),
      };
    })
  );

  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="mx-auto max-w-[1920px] px-4">
        <EffectRelatedGrid title={t('pages.videoEffects.gridTitle')} effects={effects} />
      </div>
    </div>
  );
}
