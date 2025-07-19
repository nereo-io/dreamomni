// Creem 订阅管理模型

import { getSupabaseClient } from "./db";

export interface CreemSubscription {
  id: string;
  user_uuid: string;
  creem_subscription_id: string;  // Creem 的订阅ID
  creem_customer_id?: string;     // Creem 的客户ID
  plan_type: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
  product_name?: string;
  product_id?: string;            // 我们的内部产品ID
  creem_product_id?: string;      // Creem 的产品ID
  checkout_id?: string;           // Creem 的 checkout ID
  created_at: string;
  updated_at: string;
}

/**
 * 创建 Creem 订阅记录
 */
export async function createCreemSubscription(
  subscription: Omit<CreemSubscription, 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("creem_subscriptions")
    .insert({
      ...subscription,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 根据 Creem 订阅ID查找订阅
 */
export async function findCreemSubscriptionByCreemId(
  creemSubscriptionId: string
): Promise<CreemSubscription | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("creem_subscriptions")
    .select("*")
    .eq("creem_subscription_id", creemSubscriptionId)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 根据用户UUID查找所有 Creem 订阅
 */
export async function findCreemSubscriptionsByUserUuid(
  userUuid: string,
  page: number = 1,
  limit: number = 10
): Promise<CreemSubscription[]> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 10;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("creem_subscriptions")
    .select("*")
    .eq("user_uuid", userUuid)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * 根据用户UUID查找活跃的 Creem 订阅
 */
export async function findActiveCreemSubscriptionsByUserUuid(
  userUuid: string
): Promise<CreemSubscription[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("creem_subscriptions")
    .select("*")
    .eq("user_uuid", userUuid)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * 更新 Creem 订阅状态
 */
export async function updateCreemSubscriptionStatus(
  creemSubscriptionId: string,
  status: CreemSubscription['status'],
  additionalData?: Partial<CreemSubscription>
) {
  const supabase = getSupabaseClient();
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'canceled') {
    updateData.canceled_at = new Date().toISOString();
  }

  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  const { data, error } = await supabase
    .from("creem_subscriptions")
    .update(updateData)
    .eq("creem_subscription_id", creemSubscriptionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 取消 Creem 订阅
 */
export async function cancelCreemSubscription(creemSubscriptionId: string): Promise<boolean> {
  try {
    await updateCreemSubscriptionStatus(creemSubscriptionId, 'canceled');
    return true;
  } catch (error) {
    console.error('Error canceling Creem subscription:', error);
    return false;
  }
}

/**
 * 根据 checkout ID 查找订阅
 */
export async function findCreemSubscriptionByCheckoutId(
  checkoutId: string
): Promise<CreemSubscription | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("creem_subscriptions")
    .select("*")
    .eq("checkout_id", checkoutId)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 更新订阅的周期信息
 */
export async function updateCreemSubscriptionPeriod(
  creemSubscriptionId: string,
  currentPeriodStart: string,
  currentPeriodEnd: string
): Promise<boolean> {
  try {
    await updateCreemSubscriptionStatus(creemSubscriptionId, 'active', {
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd
    });
    return true;
  } catch (error) {
    console.error('Error updating Creem subscription period:', error);
    return false;
  }
}