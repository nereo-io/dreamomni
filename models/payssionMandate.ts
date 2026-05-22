// Payssion V2 授权管理模型

import { getSupabaseAdminClient } from "./db";

export interface PayssionMandate {
  id: string;
  user_uuid: string;
  user_email: string;
  mandate_id: string; // Payssion 授权 ID
  status: "pending" | "authorized" | "expired" | "canceled" | "created";
  payment_method: string; // 前端格式：mir, yoomoney, sberpay, tbank
  authorization_url?: string;
  authorized_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 创建授权记录
 */
export async function insertPayssionMandate(
  mandate: Omit<PayssionMandate, "id" | "created_at" | "updated_at">
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payssion_mandates")
    .insert(mandate)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 根据 mandate_id 查找授权
 */
export async function findPayssionMandateByMandateId(
  mandateId: string
): Promise<PayssionMandate | undefined> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payssion_mandates")
    .select("*")
    .eq("mandate_id", mandateId)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 根据用户UUID查找有效授权
 */
export async function findActivePayssionMandateByUserUuid(
  userUuid: string,
  paymentMethod?: string
): Promise<PayssionMandate | undefined> {
  const supabase = getSupabaseAdminClient();

  let query = supabase
    .from("payssion_mandates")
    .select("*")
    .eq("user_uuid", userUuid)
    .eq("status", "authorized")
    .order("created_at", { ascending: false });

  if (paymentMethod) {
    query = query.eq("payment_method", paymentMethod);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return undefined;
  }

  // 检查过期时间：如果 expires_at 为空则永久有效，否则检查是否过期
  const now = new Date();
  for (const mandate of data) {
    if (!mandate.expires_at || new Date(mandate.expires_at) > now) {
      return mandate;
    }
  }

  return undefined;
}

/**
 * 更新授权状态
 */
export async function updatePayssionMandateStatus(
  mandateId: string,
  status: PayssionMandate["status"],
  expiresAt?: string
) {
  const supabase = getSupabaseAdminClient();
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (expiresAt !== undefined) {
    updateData.expires_at = expiresAt;
  }

  const { data, error } = await supabase
    .from("payssion_mandates")
    .update(updateData)
    .eq("mandate_id", mandateId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 获取用户的所有授权记录
 */
export async function getPayssionMandatesByUserUuid(
  userUuid: string,
  page: number = 1,
  limit: number = 10
): Promise<PayssionMandate[]> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 10;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("payssion_mandates")
    .select("*")
    .eq("user_uuid", userUuid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 取消授权
 */
export async function cancelPayssionMandate(mandateId: string) {
  return await updatePayssionMandateStatus(mandateId, "canceled");
}

/**
 * 支付方式前端格式到 Payssion 格式的映射
 */
export function mapPaymentMethodToPayssion(frontendMethod: string): string {
  const mapping: Record<string, string> = {
    mir: "card_ru",
    yoomoney: "yoomoney_ru",
    sberpay: "sberpay_ru",
    tbank: "tbank_ru",
  };

  return mapping[frontendMethod] || frontendMethod;
}

/**
 * Payssion 格式到前端格式的映射
 */
export function mapPayssionMethodToFrontend(payssionMethod: string): string {
  const mapping: Record<string, string> = {
    card_ru: "mir",
    yoomoney_ru: "yoomoney",
    sberpay_ru: "sberpay",
    tbank_ru: "tbank",
  };

  return mapping[payssionMethod] || payssionMethod;
}

/**
 * 查找用户的活跃 Payssion 订阅（通过 orders 表）
 */
export async function findActivePayssionSubscriptionByUserUuid(
  userUuid: string
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_uuid", userUuid)
    .eq("payment_provider", "payssion")
    .eq("status", "paid")
    .not("sub_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 取消 Payssion 订阅（通过更新 orders 表状态）
 */
export async function cancelPayssionSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("orders")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("sub_id", subscriptionId)
      .eq("payment_provider", "payssion");

    return !error;
  } catch (error) {
    console.error("Error canceling Payssion subscription:", error);
    return false;
  }
}

/**
 * 根据订阅ID查找Payssion订阅
 */
export async function findPayssionSubscriptionBySubscriptionId(
  subscriptionId: string
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("sub_id", subscriptionId)
    .eq("payment_provider", "payssion")
    .single();

  if (error) {
    return undefined;
  }

  return data;
}
