import Blog from '@/components/blocks/blog';
import Crumb from '@/components/blocks/crumb';
import { defaultLocale, locales } from '@/i18n/locale';
import { getPostCountByLocale, getPostsByLocale } from '@/models/post';
import { Blog as BlogType } from '@/types/blocks/blog';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

const BLOG_PAGE_SIZE = 24;

function getBlogPath(locale: string, page: number = 1) {
  const basePath = locale === defaultLocale ? '/blog' : `/${locale}/blog`;

  if (page <= 1) {
    return basePath;
  }

  return `${basePath}?page=${page}`;
}

function parsePageParam(page?: string | string[]) {
  const rawPage = Array.isArray(page) ? page[0] : page;

  if (!rawPage) {
    return undefined;
  }

  const parsedPage = Number.parseInt(rawPage, 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return null;
  }

  return parsedPage;
}

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { page?: string | string[] };
}) {
  const t = await getTranslations();
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://geminiomni.tv';
  const currentPage = parsePageParam(searchParams?.page) || 1;
  const canonicalUrl = `${baseUrl}${getBlogPath(locale, currentPage)}`;

  const languages = locales.reduce<Record<string, string>>((acc, loc) => {
    acc[loc] = `${baseUrl}${getBlogPath(loc, currentPage)}`;
    return acc;
  }, {});
  languages['x-default'] = `${baseUrl}${getBlogPath(defaultLocale, currentPage)}`;

  return {
    title: t('blog.title'),
    description: t('blog.description'),
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
  };
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { page?: string | string[] };
}) {
  const t = await getTranslations();
  const requestedPage = parsePageParam(searchParams?.page);
  const basePath = getBlogPath(params.locale);

  if (requestedPage === null || requestedPage === 1) {
    redirect(basePath);
  }

  const totalPosts = await getPostCountByLocale(params.locale);
  const totalPages = Math.max(1, Math.ceil(totalPosts / BLOG_PAGE_SIZE));
  const currentPage = requestedPage || 1;

  if (currentPage > totalPages) {
    redirect(getBlogPath(params.locale, totalPages));
  }

  const posts =
    totalPosts > 0
      ? await getPostsByLocale(params.locale, currentPage, BLOG_PAGE_SIZE)
      : [];

  const blog: BlogType = {
    title: t('blog.title'),
    description: t('blog.description'),
    base_path: basePath,
    current_page: currentPage,
    items: posts,
    page_size: BLOG_PAGE_SIZE,
    read_more_text: t('blog.read_more_text'),
    total_items: totalPosts,
    total_pages: totalPages,
  };

  return (
    <>
      <div className="container mx-auto px-4">
        <Crumb
          items={[
            { title: 'home', url: '/' },
            { title: 'blog', url: '/blog' },
          ]}
        />
      </div>
      <Blog
        blog={blog}
        featuredLabel={t('blog.featured')}
        searchPlaceholder={t('blog.search_placeholder')}
        emptyText={t('blog.no_results')}
      />
    </>
  );
}
