import { MetadataRoute } from "next";
import { getPostsByLocale } from "@/models/post";
import { getAllEffectConfigs } from "@/models/effectConfig";
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
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
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
        url: `${baseUrl}/home`,
        lastModified: currentDate,
        changeFrequency: "daily" as ChangeFrequency,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/image-to-video`,
        lastModified: currentDate,
        changeFrequency: "daily" as ChangeFrequency,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/text-to-video`,
        lastModified: currentDate,
        changeFrequency: "daily" as ChangeFrequency,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/video-effects`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.7,
      },
      // 新增图片生成页面
      {
        url: `${baseUrl}/text-to-image`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/image-to-image`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/image-generation`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/history`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.7,
      },
<<<<<<< HEAD
=======
      // Console 页面
      {
        url: `${baseUrl}/membership`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/my-credits`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/my-orders`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/my-invites`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.6,
      },
      // 认证页面
      {
        url: `${baseUrl}/auth/signin`,
        lastModified: currentDate,
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/auth/reset-password`,
        lastModified: currentDate,
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.4,
      },
      // 法律条款页面
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: currentDate,
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/terms-of-service`,
        lastModified: currentDate,
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.5,
      },
      {
        url: `${baseUrl}/refund-policy`,
        lastModified: currentDate,
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.5,
      },
    ];

    console.log(`添加了 ${staticPages.length} 个基础页面`);

    // 为每个语言添加本地化页面
    const localizedStaticPages = locales.flatMap((locale) => {
      if (locale === "en") return []; // 英文已经包含在基础页面中

      return [
        {
          url: `${baseUrl}/${locale}`,
          lastModified: currentDate,
          changeFrequency: "daily" as ChangeFrequency,
          priority: 1.0,
        },
        {
          url: `${baseUrl}/${locale}/home`,
          lastModified: currentDate,
          changeFrequency: "daily" as ChangeFrequency,
          priority: 0.9,
        },
        {
          url: `${baseUrl}/${locale}/image-to-video`,
          lastModified: currentDate,
          changeFrequency: "daily" as ChangeFrequency,
          priority: 0.9,
        },
        {
          url: `${baseUrl}/${locale}/text-to-video`,
          lastModified: currentDate,
          changeFrequency: "daily" as ChangeFrequency,
          priority: 0.9,
        },
        // 新增图片生成页面
        {
          url: `${baseUrl}/${locale}/text-to-image`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/${locale}/image-to-image`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/${locale}/image-generation`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/${locale}/video-effects`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.7,
        },
        {
          url: `${baseUrl}/${locale}/history`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.7,
        },
        {
          url: `${baseUrl}/${locale}/blog`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.7,
        },
        // Console 页面
        {
          url: `${baseUrl}/${locale}/membership`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.6,
        },
        {
          url: `${baseUrl}/${locale}/my-credits`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.6,
        },
        {
          url: `${baseUrl}/${locale}/my-orders`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.6,
        },
        {
          url: `${baseUrl}/${locale}/my-invites`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.6,
        },
        // 认证页面
        {
          url: `${baseUrl}/${locale}/auth/signin`,
          lastModified: currentDate,
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.5,
        },
        {
          url: `${baseUrl}/${locale}/auth/reset-password`,
          lastModified: currentDate,
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.4,
        },
        // 法律条款页面
        {
          url: `${baseUrl}/${locale}/privacy-policy`,
          lastModified: currentDate,
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.5,
        },
        {
          url: `${baseUrl}/${locale}/terms-of-service`,
          lastModified: currentDate,
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.5,
        },
        {
          url: `${baseUrl}/${locale}/refund-policy`,
          lastModified: currentDate,
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.5,
        },
      ];
    });

    console.log(`添加了 ${localizedStaticPages.length} 个本地化基础页面`);

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

    // 获取所有 video effect 页面
    const videoEffectPages = [];

    for (const locale of locales) {
      try {
        const effects = await getAllEffectConfigs(locale);
        
        const effectUrls = effects.map((effect) => ({
          url:
            locale === "en"
              ? `${baseUrl}/video-effects/${effect.slug}`
              : `${baseUrl}/${locale}/video-effects/${effect.slug}`,
          lastModified: effect.updated_at || effect.created_at || currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.7,
        }));

        console.log(`为 ${locale} 语言添加了 ${effectUrls.length} 个 video effect 页面`);
        videoEffectPages.push(...effectUrls);
      } catch (error) {
        console.error(`获取 ${locale} 语言的 video effects 时出错:`, error);
      }
    }

    console.log(`总共添加了 ${videoEffectPages.length} 个 video effect 页面`);

    // 合并所有页面
    const allPages = [...staticPages, ...localizedStaticPages, ...blogPages, ...videoEffectPages];

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
