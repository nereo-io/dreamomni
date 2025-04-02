import { getSupabaseClient } from "./db";
import type {
  Feedback,
  CreateFeedbackInput,
  UpdateFeedbackInput,
} from "@/types/feedback";

export enum FeedbackStatus {
  New = "new",
  Pending = "pending",
  Resolved = "resolved",
  Closed = "closed",
}

/**
 * 创建用户反馈
 */
export async function createFeedback(
  data: CreateFeedbackInput
): Promise<Feedback | undefined> {
  const supabase = getSupabaseClient();

  const feedback: Partial<Feedback> = {
    feedback_type: data.feedback_type,
    content: data.content,
    email: data.email,
    user_id: data.user_id,
    status: FeedbackStatus.New,
  };

  const { data: result, error } = await supabase
    .from("feedbacks")
    .insert([feedback])
    .select()
    .single();

  if (error) {
    console.error("创建反馈失败:", error);
    return undefined;
  }

  return result;
}

/**
 * 根据ID获取反馈
 */
export async function getFeedbackById(
  id: string
): Promise<Feedback | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 获取用户的所有反馈
 */
export async function getFeedbacksByUserId(
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<Feedback[] | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 获取所有反馈（管理员功能）
 */
export async function getAllFeedbacks(
  page: number = 1,
  limit: number = 50,
  status?: FeedbackStatus
): Promise<Feedback[] | undefined> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("feedbacks")
    .select("*")
    .order("createdAt", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1
  );

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 更新反馈
 */
export async function updateFeedback(
  id: string,
  data: UpdateFeedbackInput
): Promise<Feedback | undefined> {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from("feedbacks")
    .update({
      status: data.status,
      resolvedAt: data.resolved_at,
      adminResponse: data.admin_response,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("更新反馈失败:", error);
    return undefined;
  }

  return result;
}
