import {
  PostStatus,
  findPostBySlug,
  getPostLocalesBySlug,
  getPostsByLocale,
} from "@/models/post";

import BlogDetail from "@/components/blocks/blog-detail";
import Empty from "@/components/blocks/empty";
import { locales } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const [post, availableLocales] = await Promise.all([
    findPostBySlug(params.slug, params.locale),
    getPostLocalesBySlug(params.slug, locales),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://dreamomni.ai";
  let canonicalUrl = `${baseUrl}/blog/${params.slug}`;

  if (params.locale !== "en") {
    canonicalUrl = `${baseUrl}/${params.locale}/blog/${params.slug}`;
  }

  const localeSet = new Set(availableLocales);
  localeSet.add(params.locale);

  const languages = Array.from(localeSet).reduce<Record<string, string>>(
    (acc, locale) => {
      acc[locale] =
        locale === "en"
          ? `${baseUrl}/blog/${params.slug}`
          : `${baseUrl}/${locale}/blog/${params.slug}`;
      return acc;
    },
    {}
  );

  if (localeSet.has("en")) {
    languages["x-default"] = `${baseUrl}/blog/${params.slug}`;
  }

  return {
    title: post?.title,
    description: post?.description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      type: "article",
      title: post?.title,
      description: post?.description,
      url: canonicalUrl,
      images: post?.cover_url
        ? [{ url: post.cover_url, alt: post.title || "" }]
        : undefined,
      publishedTime: post?.created_at,
      modifiedTime: post?.updated_at || post?.created_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post?.title,
      description: post?.description,
      images: post?.cover_url ? [post.cover_url] : undefined,
    },
  };
}

export default async function ({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const [post, localePosts] = await Promise.all([
    findPostBySlug(params.slug, params.locale),
    getPostsByLocale(params.locale, 1, 12),
  ]);

  if (!post || post.status !== PostStatus.Online) {
    return <Empty message="Post not found" />;
  }

  const relatedPosts = localePosts
    .filter((localePost) => localePost.slug !== post.slug)
    .slice(0, 3);

  const faqSchemaData = (() => {
    if (!post.faq_schema) return null;
    if (Array.isArray(post.faq_schema)) return post.faq_schema;
    try {
      const parsed = JSON.parse(post.faq_schema as unknown as string);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  })();

  const faqJsonLd =
    faqSchemaData && faqSchemaData.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqSchemaData.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <BlogDetail post={post} relatedPosts={relatedPosts} />
    </>
  );
}
