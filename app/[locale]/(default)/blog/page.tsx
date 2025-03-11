import Blog from "@/components/blocks/blog";
import { Blog as BlogType } from "@/types/blocks/blog";
import { getPostsByLocale } from "@/models/post";
import { getTranslations } from "next-intl/server";
import Crumb from "@/components/blocks/crumb";
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/posts`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/posts`;
  }

  return {
    title: t("blog.title"),
    description: t("blog.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ({ params }: { params: { locale: string } }) {
  const t = await getTranslations();

  const posts = await getPostsByLocale(params.locale);

  const blog: BlogType = {
    title: t("blog.title"),
    description: t("blog.description"),
    items: posts,
    read_more_text: t("blog.read_more_text"),
  };

  return (
    <>
      <div className="container mx-auto px-4">
        <Crumb
          items={[
            { title: "home", url: "/" },
            { title: "blog", url: "/blog" },
          ]}
        />
      </div>
      <Blog blog={blog} />
    </>
  );
}
