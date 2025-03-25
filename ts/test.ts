import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { getQuestionList, updateQuestion } from "@/models/question";
import type { QuestionList, QuestionItem } from "@/types/blocks/question";

/**
 * 根据出生年份计算五行元素
 * @param birthYear 出生年份
 * @returns 对应的五行元素
 */
function calculateElement(birthYear: number): string {
  const lastDigit = birthYear % 10;

  if (lastDigit === 0 || lastDigit === 1) {
    return "Metal";
  } else if (lastDigit === 2 || lastDigit === 3) {
    return "Water";
  } else if (lastDigit === 4 || lastDigit === 5) {
    return "Wood";
  } else if (lastDigit === 6 || lastDigit === 7) {
    return "Fire";
  } else {
    return "Earth";
  }
}

/**
 * 从slug中提取出生年份和生肖
 * @param slug 文章的slug
 * @returns 包含出生年份和生肖的对象
 */
function extractInfoFromSlug(
  slug: string
): { birthYear: number; zodiac: string } | null {
  // 匹配新格式: "2023-rabbit-fortune-forecast-2025"
  const regex = /^(\d{4})-([\w-]+)-fortune-forecast-\d{4}$/;
  const match = slug.match(regex);

  if (!match) {
    console.error(`无法从slug [${slug}] 中提取信息`);
    return null;
  }

  return {
    birthYear: parseInt(match[1], 10),
    zodiac: match[2].charAt(0).toUpperCase() + match[2].slice(1), // 首字母大写
  };
}

/**
 * 主函数：更新中国生肖计算器相关文章的标题
 */
async function updateChineseZodiacTitles(): Promise<void> {
  try {
    // 获取所有category为chinese-zodiac-calculator的文章
    const questionList: QuestionList = await getQuestionList({
      category: "chinese-zodiac-calculator",
      limit: 100, // 设置较大的限制以获取更多文章
    });

    console.log(`找到 ${questionList.items.length} 篇中国生肖计算器相关文章`);

    for (const question of questionList.items) {
      // 从slug中提取信息
      const info = extractInfoFromSlug(question.slug);

      if (!info) {
        console.log(`跳过处理文章 [${question.slug}] - 无法解析生肖信息`);
        continue;
      }

      const { birthYear, zodiac } = info;
      const element = calculateElement(birthYear);

      // 新标题格式
      const newTitle = `Chinese horoscope 2025 for ${birthYear} ${element} ${zodiac}`;

      // 如果标题已经是新格式，跳过更新
      if (question.title === newTitle) {
        console.log(`文章 [${question.slug}] 的标题已经是最新格式`);
        continue;
      }

      // 更新标题 - 注意updateQuestion需要三个参数：slug, locale, 和 questionData
      const updated = await updateQuestion(
        question.slug,
        question.locale || "en", // 使用问题的locale，如果没有则默认为"en"
        { title: newTitle }
      );

      if (updated) {
        console.log(
          `已更新文章 [${question.slug}]: "${question.title}" -> "${updated.title}"`
        );
      } else {
        console.error(`更新文章 [${question.slug}] 失败`);
      }
    }

    console.log("所有中国生肖计算器相关文章标题更新完成");
  } catch (error) {
    console.error("更新标题时发生错误:", error);
    throw error;
  }
}

// 执行更新函数
updateChineseZodiacTitles()
  .then(() => console.log("程序执行完成"))
  .catch((err) => console.error("程序执行失败:", err));
