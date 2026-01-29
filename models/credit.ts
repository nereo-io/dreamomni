import { Credit, CreditPool } from "@/types/credit";
import { getSupabaseClient } from "@/models/db";

export async function insertCredit(credit: Credit) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("credits").insert(credit);

  if (error) {
    throw error;
  }

  return data;
}

export async function findCreditByTransNo(
  trans_no: string
): Promise<Credit | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("trans_no", trans_no)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function findCreditByOrderNo(
  order_no: string
): Promise<Credit | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("order_no", order_no)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function findCreditByOrderNoAndPaymentId(
  order_no: string,
  payment_id: string
): Promise<Credit | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("order_no", order_no)
    .eq("payment_id", payment_id)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getUserValidCredits(
  user_uuid: string
): Promise<Credit[] | undefined> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  // 使用分页获取所有有效积分记录，避免 Supabase 1000 条限制
  let allCredits: Credit[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .eq("user_uuid", user_uuid)
      .gte("expired_at", now)
      .order("expired_at", { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Failed to get user valid credits:", error);
      return undefined;
    }

    if (!data || data.length === 0) {
      break;
    }

    allCredits = allCredits.concat(data);

    // 如果本页记录数少于 pageSize，说明是最后一页
    if (data.length < pageSize) {
      break;
    }

    page++;
  }

  return allCredits;
}

export async function getUserLeftCredits(
  user_uuid: string
): Promise<number | undefined> {
  const supabase = getSupabaseClient();

  // 使用数据库函数聚合计算，避免传输大量数据
  // 在数据库层面直接 SUM，只返回一个数字，无 1000 条限制
  const { data, error } = await supabase.rpc('get_user_valid_credits_sum', {
    p_user_uuid: user_uuid
  });

  if (error) {
    console.error("Failed to get user credits:", error);
    return undefined;
  }

  return data || 0;
}

export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<Credit[] | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("user_uuid", user_uuid)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

export async function getUserCreditPools(
  user_uuid: string
): Promise<CreditPool[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_user_credit_pools", {
    p_user_uuid: user_uuid,
  });

  if (error) {
    console.error("Failed to get user credit pools:", error);
    return [];
  }

  return data || [];
}
