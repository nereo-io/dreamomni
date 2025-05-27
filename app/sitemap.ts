import { MetadataRoute } from "next";
import { getQuestionList } from "@/models/question";
import { getAllPosts, getPostsByLocale } from "@/models/post";
import { getAllCategoriesMetadata } from "@/types/category-enum";
import { locales } from "@/i18n/locale";

type ChangeFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "always"
  | "hourly"
  | "yearly"
  | "never";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://www.bazi-ai.com";
  const currentDate = new Date().toISOString();

  console.log("开始生成 sitemap...");

  try {
    // 基础静态页面
    const staticPages = [
      {
        url: `${baseUrl}`,
        lastModified: currentDate,
        changeFrequency: "daily" as ChangeFrequency,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      },
    ];

    console.log(`添加了 ${staticPages.length} 个基础页面`);

    // // 为每个语言添加本地化页面
    // const localizedStaticPages = locales.flatMap((locale) => {
    //   if (locale === "en") return []; // 英文已经包含在基础页面中

    //   return [
    //     {
    //       url: `${baseUrl}/${locale}`,
    //       lastModified: currentDate,
    //       changeFrequency: "daily" as ChangeFrequency,
    //       priority: 1.0,
    //     },
    //     {
    //       url: `${baseUrl}/${locale}/pricing`,
    //       lastModified: currentDate,
    //       changeFrequency: "weekly" as ChangeFrequency,
    //       priority: 0.8,
    //     },
    //     {
    //       url: `${baseUrl}/${locale}/blog`,
    //       lastModified: currentDate,
    //       changeFrequency: "weekly" as ChangeFrequency,
    //       priority: 0.7,
    //     },
    //   ];
    // });

    // console.log(`添加了 ${localizedStaticPages.length} 个本地化基础页面`);

    // 获取所有博客文章页面
    const blogPages = [];

    for (const locale of locales) {
      try {
        const posts = await getPostsByLocale(locale, 1, 1000); // 获取所有博客文章

        const blogUrls = posts.map((post) => ({
          url:
            locale === "en"
              ? `${baseUrl}/blog/${post.slug}`
              : `${baseUrl}/${locale}/blog/${post.slug}`,
          lastModified: post.updated_at || post.created_at || currentDate,
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.6,
        }));

        console.log(`为 ${locale} 语言添加了 ${blogUrls.length} 个博客页面`);
        blogPages.push(...blogUrls);
      } catch (error) {
        console.error(`获取 ${locale} 语言的博客文章时出错:`, error);
      }
    }

    console.log(`总共添加了 ${blogPages.length} 个博客页面`);

    // 合并所有页面
    const allPages = [...staticPages, ...blogPages];

    console.log(`sitemap 生成完成，总共包含 ${allPages.length} 个页面`);
    return allPages;
  } catch (error) {
    console.error("生成 sitemap 时出错:", error);
    // 返回一个基本的 sitemap，确保即使出错也能返回一些内容
    return [
      {
        url: baseUrl,
        lastModified: currentDate,
        changeFrequency: "daily" as ChangeFrequency,
        priority: 1.0,
      },
    ];
  }
}
