import { notFound } from 'next/navigation';
import { EffectRelatedGrid } from '@/components/blocks/effect-landing-page/effect-related-grid';
import { IMAGE_EFFECT_PAGES } from '@/config/image-effect-pages';
import { getImageEffectPage } from '@/services/page';

interface PageParams {
  locale: string;
}

interface ImageEffectCard {
  id: string;
  title: string;
  image: string;
  href: string;
}

const getEffectHref = (slug: string, locale: string) => {
  if (locale === 'en') {
    return `/image-effect/${slug}`;
  }

  return `/${locale}/image-effect/${slug}`;
};

const getStaticEffectPreview = async (slug: string, locale: string) => {
  const { page, tool } = await getImageEffectPage(slug, locale);
  const heroMedia = page?.hero?.showcaseMedia ?? [];
  const firstShowcaseItem = tool?.showcaseItems?.[0];

  const imageShowcase = heroMedia.find((media) => media.type === 'image')?.src;
  const posterShowcase = heroMedia.find((media) => media.type === 'video')?.poster;

  return {
    title: page?.hero?.title ?? tool?.form?.title ?? slug,
    image:
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
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/image-effect`;

  if (locale !== 'en') {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/image-effect`;
  }

  return {
    title: 'AI Image Effects - Transform Your Photos | Seedance',
    description:
      'Create stunning AI photo effects with one click. Browse templates and transform your images instantly.',
    keywords: 'AI image effects, photo effects, AI filters, image transformation',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ImageEffectPage({
  params: { locale },
}: {
  params: PageParams;
}) {
  if (process.env.NEXT_PUBLIC_EFFECTS_ENABLED !== 'true') {
    notFound();
  }

  const effects = await Promise.all(
    IMAGE_EFFECT_PAGES.map(async (slug): Promise<ImageEffectCard> => {
      const effect = await getStaticEffectPreview(slug, locale);

      return {
        id: slug,
        title: effect.title,
        image: effect.image,
        href: getEffectHref(slug, locale),
      };
    })
  );

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="mx-auto max-w-[1920px] px-4">
        <EffectRelatedGrid title="AI Image Effects" effects={effects} />
      </div>
    </div>
  );
}
