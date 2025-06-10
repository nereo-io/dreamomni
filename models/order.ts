import { Order } from "@/types/order";
import { getSupabaseClient } from "@/models/db";

export enum OrderStatus {
  Created = "created",
  Paid = "paid",
  Deleted = "deleted",
}

export async function insertOrder(order: Order) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("orders").insert(order);

  if (error) {
    throw error;
  }

  return data;
}

export async function findOrderByOrderNo(
  order_no: string
): Promise<Order | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_no", order_no)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getFirstPaidOrderByUserUuid(
  user_uuid: string
): Promise<Order | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_uuid", user_uuid)
    .eq("status", "paid")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getFirstPaidOrderByUserEmail(
  user_email: string
): Promise<Order | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_email", user_email)
    .eq("status", "paid")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function updateOrderStatus(
  order_no: string,
  status: string,
  paid_at: string,
  paid_email: string,
  paid_detail: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, paid_at, paid_detail, paid_email })
    .eq("order_no", order_no);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateOrderSession(
  order_no: string,
  stripe_session_id: string,
  order_detail: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ stripe_session_id, order_detail })
    .eq("order_no", order_no);

  if (error) {
    throw error;
  }

  return data;
}

// 新增：更新支付提供商相关信息
export async function updateOrderPaymentProvider(
  order_no: string,
  payment_provider: string,
  payment_method?: string,
  transaction_id?: string,
  fee?: number
) {
  const supabase = getSupabaseClient();
  
  const updateData: any = { payment_provider };
  
  if (payment_method) updateData.payment_method = payment_method;
  if (transaction_id) {
    if (payment_provider === 'payssion') {
      updateData.payssion_transaction_id = transaction_id;
    } else if (payment_provider === 'stripe') {
      updateData.stripe_session_id = transaction_id;
    }
  }
  if (fee !== undefined) updateData.payment_provider_fee = fee;

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("order_no", order_no);

  if (error) {
    throw error;
  }

  return data;
}

// 新增：根据支付提供商查询订单
export async function getOrdersByPaymentProvider(
  payment_provider: string,
  page: number = 1,
  limit: number = 50
): Promise<Order[] | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_provider", payment_provider)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

// 新增：根据Payssion交易ID查询订单
export async function findOrderByPayssionTransactionId(
  transaction_id: string
): Promise<Order | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payssion_transaction_id", transaction_id)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function updateOrderSubscription(
  order_no: string,
  sub_id: string,
  sub_interval_count: number,
  sub_cycle_anchor: number,
  sub_period_end: number,
  sub_period_start: number,
  status: string,
  paid_at: string,
  sub_times: number,
  paid_email: string,
  paid_detail: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      sub_id,
      sub_interval_count,
      sub_cycle_anchor,
      sub_period_end,
      sub_period_start,
      status,
      paid_at,
      sub_times,
      paid_email,
      paid_detail,
    })
    .eq("order_no", order_no);

  if (error) {
    throw error;
  }

  return data;
}

export async function getOrdersByUserUuid(
  user_uuid: string
): Promise<Order[] | undefined> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_uuid", user_uuid)
    .eq("status", "paid")
    .order("created_at", { ascending: false });
  // .gte("expired_at", now);

  if (error) {
    return undefined;
  }

  return data;
}

export async function getOrdersByUserEmail(
  user_email: string
): Promise<Order[] | undefined> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_email", user_email)
    .eq("status", "paid")
    .order("created_at", { ascending: false });
  // .gte("expired_at", now);

  if (error) {
    return undefined;
  }

  return data;
}

export async function getOrdersByPaidEmail(
  paid_email: string
): Promise<Order[] | undefined> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("paid_email", paid_email)
    .eq("status", "paid")
    .order("created_at", { ascending: false });
  // .gte("expired_at", now);

  if (error) {
    return undefined;
  }

  return data;
}

export async function getPaiedOrders(
  page: number,
  limit: number
): Promise<Order[] | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit);

  if (error) {
    return undefined;
  }

  return data;
}
