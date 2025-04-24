import { MetadataRoute } from "next";
import { getQuestionList } from "@/models/question";
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
    // 基础页面
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
      {
        url: `${baseUrl}/blog`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/chinese-zodiac-calculator`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/chinese-zodiac-element-reading`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/i-ching`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.9,
      },
    ];

    console.log(`添加了 ${staticPages.length} 个基础页面`);

    // 为每个语言添加基础页面
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
          url: `${baseUrl}/${locale}/pricing`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/${locale}/blog`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.7,
        },
        {
          url: `${baseUrl}/${locale}/chinese-zodiac-calculator`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/${locale}/chinese-zodiac-element-reading`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.8,
        },
        {
          url: `${baseUrl}/${locale}/i-ching`,
          lastModified: currentDate,
          changeFrequency: "weekly" as ChangeFrequency,
          priority: 0.9,
        },
      ];
    });

    console.log(`添加了 ${localizedStaticPages.length} 个本地化基础页面`);

    // 获取所有分类
    const categories = getAllCategoriesMetadata().map(
      (category) => category.key
    );
    console.log(`找到 ${categories.length} 个分类`);

    // 为每个分类和语言创建资源页面
    const categoryPages = categories.flatMap((category) => {
      return locales.map((locale) => ({
        url:
          locale === "en"
            ? `${baseUrl}/reading/${category}`
            : `${baseUrl}/${locale}/reading/${category}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.7,
      }));
    });

    console.log(`添加了 ${categoryPages.length} 个分类页面`);

    // 获取所有问题页面
    const questionPages = [];

    // 为每个语言获取问题
    for (const locale of locales) {
      // 为每个分类获取问题
      for (const category of categories) {
        try {
          const questions = await getQuestionList({
            category,
            locale,
            limit: 1000, // 设置一个较大的限制，确保获取所有问题
          });

          // 为每个问题创建URL
          const questionUrls = questions.items.map((question) => ({
            url:
              locale === "en"
                ? `${baseUrl}/reading/${category}/questions/${question.slug}`
                : `${baseUrl}/${locale}/reading/${category}/questions/${question.slug}`,
            lastModified:
              question.updated_at || question.created_at || currentDate,
            changeFrequency: "monthly" as ChangeFrequency,
            priority: 0.6,
          }));

          console.log(
            `为 ${locale} 语言的 ${category} 分类添加了 ${questionUrls.length} 个问题页面`
          );
          questionPages.push(...questionUrls);
        } catch (error) {
          console.error(
            `获取 ${locale} 语言的 ${category} 分类问题时出错:`,
            error
          );
        }
      }
    }

    const zodiacCalculatorPages = [];

    for (const locale of locales) {
      const calculatorQuestions = await getQuestionList({
        category: "chinese-zodiac-calculator",
        locale,
        limit: 1000, // 设置一个较大的限制，确保获取所有问题
      });
      const zodiacCalculatorUrls = calculatorQuestions.items.map(
        (question) => ({
          url:
            locale === "en"
              ? `${baseUrl}/chinese-zodiac-calculator/${question.slug}`
              : `${baseUrl}/${locale}/chinese-zodiac-calculator/${question.slug}`,
          lastModified:
            question.updated_at || question.created_at || currentDate,
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.6,
        })
      );

      console.log(
        `为 ${locale} 语言的 生肖计算器 添加了 ${zodiacCalculatorUrls.length} 个问题页面`
      );
      zodiacCalculatorPages.push(...zodiacCalculatorUrls);
    }

    console.log(
      `总共添加了 ${questionPages.length} 个问题页面，${zodiacCalculatorPages.length} 个生肖计算器页面`
    );

    // 合并所有页面
    const allPages = [
      ...staticPages,
      ...localizedStaticPages,
      ...categoryPages,
      ...questionPages,
      ...zodiacCalculatorPages,
    ];

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
