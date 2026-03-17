import { PostStatus, findPostBySlug, getPostsByLocale } from "@/models/post";

import BlogDetail from "@/components/blocks/blog-detail";
import Empty from "@/components/blocks/empty";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const post = await findPostBySlug(params.slug, params.locale);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/blog/${params.slug}`;

  if (params.locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${params.locale}/blog/${params.slug}`;
  }

  return {
    title: post?.title,
    description: post?.description,
    alternates: {
      canonical: canonicalUrl,
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

  return <BlogDetail post={post} relatedPosts={relatedPosts} />;
}
