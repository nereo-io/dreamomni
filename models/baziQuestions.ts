import { BaziQuestionsData } from "@/types/blocks/bazi-questions";
import { BaziQuestion } from "@/types/question";
import { getSupabaseClient } from "./db";

/**
 * 从数据库获取八字问题列表数据
 * @param locale 语言
 * @returns 八字问题列表数据
 */
export async function getBaziQuestions(
  locale: string
): Promise<BaziQuestionsData> {
  try {
    const questions = await fetchBaziQuestionsFromDB();
    const categories = await fetchBaziQuestionCategories();

    // 将数据转换为前端需要的格式
    const questionsMap: Record<string, any> = {};

    questions.forEach((question) => {
      // 根据 locale 决定使用中文还是英文内容
      const isChineseLocale = locale === "zh" || locale === "zh-TW";

      questionsMap[question.id] = {
        id: question.id,
        text: isChineseLocale
          ? question.text
          : question.text_en || question.text,
        category: question.category,
        tags: isChineseLocale
          ? question.tags || []
          : question.tags_en || question.tags || [],
        copyCount: question.copy_count || 0,
      };
    });

    return {
      categories,
      questions: questionsMap,
    };
  } catch (error) {
    console.error("获取八字问题数据失败:", error);
    // 返回一个空的数据结构
    return {
      categories: [],
      questions: {},
    };
  }
}

/**
 * 从数据库获取八字问题列表
 * @returns 八字问题列表
 */
async function fetchBaziQuestionsFromDB(): Promise<BaziQuestion[]> {
  const supabase = getSupabaseClient();

  // 查询活跃状态的问题，并按照复制次数降序排序
  const { data, error } = await supabase
    .from("bazi_questions")
    .select("*")
    .eq("status", "active")
    .order("copy_count", { ascending: false });

  if (error) {
    console.error("数据库查询失败:", error);
    throw error;
  }

  return data || [];
}

/**
 * 获取八字问题分类列表
 * @returns 分类列表
 */
async function fetchBaziQuestionCategories() {
  return [
    { id: "all" },
    { id: "rednote" },
    { id: "career" },
    { id: "relationship" },
    { id: "health" },
    { id: "education" },
    { id: "family" },
    { id: "personality" },
    { id: "yearly" },
  ];
}

/**
 * 更新问题的复制次数
 * @param questionId 问题ID
 * @param userId 用户ID（可选）
 * @param ipAddress IP地址（可选）
 * @param deviceInfo 设备信息（可选）
 */
export async function recordQuestionCopy(
  questionId: string,
  userId?: string,
  ipAddress?: string,
  deviceInfo?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // 1. 创建复制记录
    const { error: copyError } = await supabase
      .from("bazi_question_copies")
      .insert([
        {
          question_id: questionId,
          user_id: userId,
          ip_address: ipAddress,
          device_info: deviceInfo,
        },
      ]);

    if (copyError) throw copyError;

    // 2. 更新问题的复制次数（增加1）
    const { error: updateError } = await supabase.rpc(
      "increment_question_copy_count",
      { question_id: questionId }
    );

    if (updateError) throw updateError;
  } catch (error) {
    console.error("记录问题复制失败:", error);
  }
}
