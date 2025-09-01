import { Membership } from "@/types/membership";
import { getSupabaseClient } from "./db";

// 根据用户UUID查找有效会员
export async function findActiveMembershipByUserUuid(
  userUuid: string
): Promise<Membership | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_uuid", userUuid)
    .eq("status", "active")
    .maybeSingle(); // 使用 maybeSingle 避免无数据时的406错误

  if (error) {
    console.error("查询active membership失败:", error);
    return undefined;
  }

  return data || undefined;
}

// 根据用户UUID查找会员记录(不限制状态)
export async function findMembershipByUserUuid(
  userUuid: string
): Promise<Membership | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_uuid", userUuid)
    .maybeSingle(); // 使用 maybeSingle 避免无数据时的406错误

  if (error) {
    console.error("查询membership失败:", error);
    return undefined;
  }

  return data || undefined;
}

// 创建新会员记录
export async function insertMembership(membership: Membership) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("memberships").insert(membership);

  if (error) {
    throw error;
  }

  return data;
}

// 更新会员记录
export async function updateMembership(
  userUuid: string,
  membership: Partial<Membership>
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .update(membership)
    .eq("user_uuid", userUuid);

  if (error) {
    throw error;
  }

  return data;
}

// 获取用户的所有会员记录
export async function getMembershipHistory(
  userUuid: string,
  page: number = 1,
  limit: number = 10
): Promise<Membership[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 10;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_uuid", userUuid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

// 检查会员是否过期并更新状态
export async function checkAndUpdateMembershipStatus(
  userUuid: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  // 更新已过期的会员状态
  await supabase
    .from("memberships")
    .update({ status: "expired" })
    .eq("user_uuid", userUuid)
    .eq("status", "active")
    .lt("end_date", now);
}
