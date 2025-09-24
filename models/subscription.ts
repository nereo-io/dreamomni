// Payssion 订阅管理模型

import { getSupabaseClient } from "./db";

export interface Subscription {
  id: string;
  user_uuid: string;
  mandate_id: string;
  payssion_subscription_id: string;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'pending' | 'active' | 'canceled' | 'expired';
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
  product_name?: string;
  product_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 创建订阅记录
 */
export async function createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .insert(subscription)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 根据 Payssion 订阅ID查找订阅
 */
export async function findSubscriptionByPayssionId(payssionSubscriptionId: string): Promise<Subscription | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("payssion_subscription_id", payssionSubscriptionId)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 根据用户UUID查找活跃订阅
 */
export async function findActiveSubscriptionsByUserUuid(userUuid: string): Promise<Subscription[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_uuid", userUuid)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * 根据用户UUID查找所有订阅
 */
export async function findSubscriptionsByUserUuid(
  userUuid: string,
  page: number = 1,
  limit: number = 10
): Promise<Subscription[]> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 10;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_uuid", userUuid)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * 更新订阅状态
 */
export async function updateSubscriptionStatus(
  payssionSubscriptionId: string,
  status: Subscription['status'],
  additionalData?: Partial<Subscription>
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
    .from("subscriptions")
    .update(updateData)
    .eq("payssion_subscription_id", payssionSubscriptionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 取消订阅
 */
export async function cancelSubscription(payssionSubscriptionId: string): Promise<boolean> {
  try {
    await updateSubscriptionStatus(payssionSubscriptionId, 'canceled');
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

/**
 * 激活订阅
 */
export async function activateSubscription(
  payssionSubscriptionId: string,
  currentPeriodStart: string,
  currentPeriodEnd: string
): Promise<boolean> {
  try {
    await updateSubscriptionStatus(payssionSubscriptionId, 'active', {
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd
    });
    return true;
  } catch (error) {
    console.error('Error activating subscription:', error);
    return false;
  }
}

/**
 * 根据授权ID查找订阅
 */
export async function findSubscriptionsByMandateId(mandateId: string): Promise<Subscription[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("mandate_id", mandateId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}