import { getSupabaseClient } from "./db";
import type {
  QuestionItem,
  QuestionDetail,
  QuestionList,
  RelatedQuestion,
} from "@/types/blocks/question";
import type { NavItem } from "@/types/blocks/base";
import { v4 as uuidv4 } from "uuid";

export enum QuestionStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
}

/**
 * 获取问题总数
 * @param params 查询参数
 * @returns 问题总数
 */
export async function getQuestionCount(params?: {
  category?: string;
  tag?: string;
  locale?: string;
}): Promise<number> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("type", "question")
    .eq("status", QuestionStatus.Online);

  if (params?.category) query = query.eq("category", params.category);
  if (params?.locale) query = query.eq("locale", params.locale);
  if (params?.tag) query = query.textSearch("tags", params.tag);

  const { count } = await query;
  return count || 0;
}
/**
 * 获取问题列表
 * @param params 查询参数
 * @returns 问题列表
 */
export async function getQuestionList(params?: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  locale?: string;
}): Promise<QuestionList> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("type", "question")
    .eq("status", QuestionStatus.Online);

  // 应用筛选条件
  if (params?.category) query = query.eq("category", params.category);
  if (params?.locale) query = query.eq("locale", params.locale);
  if (params?.tag) query = query.textSearch("tags", params.tag);

  // 分页
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  query = query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error("获取问题列表失败:", error);
    return { items: [] };
  }

  // 将数据库记录转换为QuestionItem类型
  const items: QuestionItem[] = data.map((item) => ({
    slug: item.slug,
    title: item.title,
    content: item.content,
    description: item.description,
    category: item.category,
    tags: item.tags ? item.tags.split(",") : [],
    reading_type: item.reading_type,
    locale: item.locale,
    rating: item.rating,
    votes: item.votes,
    author_name: item.author_name,
    author_avatar_url: item.author_avatar_url,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  return { items };
}

/**
 * 获取问题详情
 * @param slug 问题的唯一标识
 * @param locale 语言
 * @returns 问题详情
 */
export async function getQuestionDetail(
  slug: string,
  locale: string
): Promise<QuestionDetail | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("type", "question")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", QuestionStatus.Online)
    .limit(1)
    .single();

  if (error) {
    console.error("获取问题详情失败:", error);
    return null;
  }

  // 获取相关问题
  const relatedQuestions = await getRelatedQuestions(
    data.category,
    slug,
    locale
  );

  // 生成面包屑导航
  const breadcrumbItems: NavItem[] = [
    { title: "home", url: "/" },
    { title: "reading", url: "/reading" },
    {
      title: data.category,
      url: `/reading/${data.category.toLowerCase().replace(/\s+/g, "-")}`,
    },
    { title: data.title, is_active: true },
  ];

  // 组合问题详情
  const questionDetail: QuestionDetail = {
    slug: data.slug,
    title: data.title,
    description: data.description,
    cover_url: data.cover_url,
    content: data.content,
    category: data.category,
    tags: data.tags ? data.tags.split(",") : [],
    reading_type: data.reading_type,
    locale: data.locale,
    rating: data.rating,
    votes: data.votes,
    author_name: data.author_name,
    author_avatar_url: data.author_avatar_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
    breadcrumbItems,
    relatedQuestions,
  };

  return questionDetail;
}

/**
 * 获取相关问题
 * @param category 类别
 * @param currentSlug 当前问题的slug（排除自身）
 * @param locale 语言
 * @param limit 限制数量，默认为6
 * @returns 相关问题列表
 */
export async function getRelatedQuestions(
  category: string,
  currentSlug: string,
  locale: string,
  limit: number = 10
): Promise<RelatedQuestion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("slug, title, rating, votes")
    .eq("type", "question")
    .eq("category", category)
    .eq("locale", locale)
    .eq("status", QuestionStatus.Online)
    .neq("slug", currentSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("获取相关问题失败:", error);
    return [];
  }

  return data as RelatedQuestion[];
}

/**
 * 创建新问题
 * @param questionData 问题数据
 * @returns 创建的问题
 */
export async function createQuestion(
  questionData: Omit<QuestionItem, "created_at" | "updated_at">
): Promise<QuestionItem | null> {
  const supabase = getSupabaseClient();

  // 准备数据进行插入
  const postData = {
    uuid: uuidv4(),
    title: questionData.title,
    description: questionData.description || "",
    content: questionData.content,
    cover_url: questionData.cover_url,
    category: questionData.category,
    tags: questionData.tags?.join(","),
    reading_type: questionData.reading_type,
    locale: questionData.locale,
    author_name: questionData.author_name,
    author_avatar_url: questionData.author_avatar_url,
    type: "question", // 关键点：设置类型为question
    status: QuestionStatus.Online,
    rating: questionData.rating,
    votes: questionData.votes,
    slug: questionData.slug,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("posts")
    .insert(postData)
    .select()
    .single();

  if (error) {
    console.error("创建问题失败:", error);
    return null;
  }

  // 转换为QuestionItem类型返回
  return {
    slug: data.slug,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags ? data.tags.split(",") : [],
    reading_type: data.reading_type,
    locale: data.locale,
    rating: data.rating,
    votes: data.votes,
    author_name: data.author_name,
    author_avatar_url: data.author_avatar_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * 更新问题
 * @param slug 问题的唯一标识
 * @param locale 语言
 * @param questionData 问题更新数据
 * @returns 更新后的问题
 */
export async function updateQuestion(
  slug: string,
  locale: string,
  questionData: Partial<QuestionItem>
): Promise<QuestionItem | null> {
  const supabase = getSupabaseClient();

  // 准备更新数据
  const updateData: any = { ...questionData };

  // 处理tags字段，如果存在则转换为逗号分隔的字符串
  if (updateData.tags && Array.isArray(updateData.tags)) {
    updateData.tags = updateData.tags.join(",");
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updateData)
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("type", "question")
    .select()
    .single();

  if (error) {
    console.error("更新问题失败:", error);
    return null;
  }

  // 转换为QuestionItem类型返回
  return {
    slug: data.slug,
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags ? data.tags.split(",") : [],
    reading_type: data.reading_type,
    locale: data.locale,
    rating: data.rating,
    votes: data.votes,
    author_name: data.author_name,
    author_avatar_url: data.author_avatar_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * 删除问题（将状态设置为deleted）
 * @param slug 问题的唯一标识
 * @param locale 语言
 * @returns 是否删除成功
 */
export async function deleteQuestion(
  slug: string,
  locale: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: QuestionStatus.Deleted })
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("type", "question");

  if (error) {
    console.error("删除问题失败:", error);
    return false;
  }

  return true;
}

/**
 * 评分问题
 * @param slug 问题的唯一标识
 * @param locale 语言
 * @param rating 评分 (0-100)
 * @returns 更新后的评分信息
 */
export async function rateQuestion(
  slug: string,
  locale: string,
  rating: number
): Promise<{ rating: number; votes: number } | null> {
  // 首先获取当前问题的评分和票数
  const supabase = getSupabaseClient();
  const { data: currentData, error: fetchError } = await supabase
    .from("posts")
    .select("rating, votes")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("type", "question")
    .single();

  if (fetchError) {
    console.error("获取问题评分失败:", fetchError);
    return null;
  }

  // 计算新的评分和票数
  const currentVotes = currentData.votes || 0;
  const currentRating = currentData.rating || 0;

  // 简单加权平均计算
  const newVotes = currentVotes + 1;
  const newRating = Math.round(
    (currentRating * currentVotes + rating) / newVotes
  );

  // 更新评分
  const { data, error } = await supabase
    .from("posts")
    .update({ rating: newRating, votes: newVotes })
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("type", "question")
    .select("rating, votes")
    .single();

  if (error) {
    console.error("更新问题评分失败:", error);
    return null;
  }

  return { rating: data.rating, votes: data.votes };
}
