import { MetadataRoute } from "next";
import { getPostsByLocale } from "@/models/post";
import { locales } from "@/i18n/locale";

type ChangeFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "always"
  | "hourly"
  | "yearly"
  | "never";

type SitemapEntry = MetadataRoute.Sitemap[number];

type StaticPageDefinition = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

function buildLocalizedUrl(baseUrl: string, locale: string, path: string) {
  const normalizedPath = path === "/" ? "" : path;
  return locale === "en"
    ? `${baseUrl}${normalizedPath}`
    : `${baseUrl}/${locale}${normalizedPath}`;
}

function buildAlternates(baseUrl: string, path: string) {
  const languages = locales.reduce<Record<string, string>>((acc, locale) => {
    acc[locale] = buildLocalizedUrl(baseUrl, locale, path);
    return acc;
  }, {});

  languages["x-default"] = buildLocalizedUrl(baseUrl, "en", path);

  return {
    languages,
  };
}

function createSitemapEntry(
  baseUrl: string,
  locale: string,
  path: string,
  lastModified: string,
  changeFrequency: ChangeFrequency,
  priority: number
): SitemapEntry {
  return {
    url: buildLocalizedUrl(baseUrl, locale, path),
    lastModified,
    changeFrequency,
    priority,
    alternates: buildAlternates(baseUrl, path),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const currentDate = new Date().toISOString();

  console.log("开始生成 sitemap...");

  try {
    const publicStaticPages: StaticPageDefinition[] = [
      {
        path: "/",
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        path: "/home",
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        path: "/image-to-video",
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        path: "/text-to-video",
        changeFrequency: "daily",
        priority: 0.9,
      },

      {
        path: "/text-to-image",
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        path: "/image-to-image",
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        path: "/blog",
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        path: "/privacy-policy",
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        path: "/terms-of-service",
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        path: "/refund-policy",
        changeFrequency: "monthly",
        priority: 0.5,
      },
    ];

    const staticPages = publicStaticPages.map((page) =>
      createSitemapEntry(
        baseUrl,
        "en",
        page.path,
        currentDate,
        page.changeFrequency,
        page.priority
      )
    );

    console.log(`添加了 ${staticPages.length} 个基础页面`);

    // 为每个语言添加本地化页面
    const localizedStaticPages = locales.flatMap((locale) => {
      if (locale === "en") return []; // 英文已经包含在基础页面中

      return publicStaticPages.map((page) =>
        createSitemapEntry(
          baseUrl,
          locale,
          page.path,
          currentDate,
          page.changeFrequency,
          page.priority
        )
      );
    });

    console.log(`添加了 ${localizedStaticPages.length} 个本地化基础页面`);

    // 获取所有博客文章页面
    const blogPages = [];

    for (const locale of locales) {
      try {
        const posts = await getPostsByLocale(locale, 1, 1000); // 获取所有博客文章

        const blogUrls = posts.map((post) =>
          createSitemapEntry(
            baseUrl,
            locale,
            `/blog/${post.slug}`,
            post.updated_at || post.created_at || currentDate,
            "monthly",
            0.6
          )
        );

        console.log(`为 ${locale} 语言添加了 ${blogUrls.length} 个博客页面`);
        blogPages.push(...blogUrls);
      } catch (error) {
        console.error(`获取 ${locale} 语言的博客文章时出错:`, error);
      }
    }

    console.log(`总共添加了 ${blogPages.length} 个博客页面`);

    // 合并所有页面
    const allPages = [
      ...staticPages,
      ...localizedStaticPages,
      ...blogPages,
    ];

    console.log(`sitemap 生成完成，总共包含 ${allPages.length} 个页面`);
    return allPages;
  } catch (error) {
    console.error("生成 sitemap 时出错:", error);
    // 返回一个基本的 sitemap，确保即使出错也能返回一些内容
    return [
      createSitemapEntry(baseUrl, "en", "/", currentDate, "daily", 1.0),
    ];
  }
}
