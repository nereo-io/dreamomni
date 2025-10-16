import { Order } from "@/types/order";
import { getSupabaseClient } from "@/models/db";

interface PaymentFailureInfo {
  code?: string;
  message?: string;
  rawMessage?: string;
  provider?: string;
  failureAt?: string;
  eventId?: string;
}

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
    if (payment_provider === "payssion") {
      updateData.payssion_transaction_id = transaction_id;
    } else if (payment_provider === "stripe") {
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

export async function recordOrderPaymentFailure(
  order_no: string,
  failure: PaymentFailureInfo
) {
  const supabase = getSupabaseClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("order_detail")
    .eq("order_no", order_no)
    .single();

  if (fetchError) {
    console.error("Failed to load order for failure recording", {
      order_no,
      error: fetchError.message,
    });
    throw fetchError;
  }

  let detail: any = {};

  if (order?.order_detail) {
    try {
      detail = typeof order.order_detail === "string"
        ? JSON.parse(order.order_detail)
        : order.order_detail;
    } catch (parseError) {
      console.warn("Failed to parse existing order_detail, resetting", {
        order_no,
        parseError,
      });
      detail = {};
    }
  }

  const failureRecord = {
    code: failure.code,
    message: failure.message,
    rawMessage: failure.rawMessage,
    provider: failure.provider,
    failureAt: failure.failureAt,
    eventId: failure.eventId,
    recordedAt: new Date().toISOString(),
  };

  detail.last_payment_failure = failureRecord;

  const updatePayload = {
    order_detail: JSON.stringify(detail),
  };

  try {
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        ...updatePayload,
        subscription_status: "past_due",
      })
      .eq("order_no", order_no);

    if (updateError) {
      throw updateError;
    }
  } catch (error: any) {
    if (error?.code === "42703" || error?.code === "PGRST204") {
      // 数据库缺少 subscription_status 字段，退回只更新 order_detail
      const { error: fallbackError } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("order_no", order_no);

      if (fallbackError) {
        console.error("Failed to persist payment failure details", {
          order_no,
          error: fallbackError.message,
        });
        throw fallbackError;
      }
    } else {
      console.error("Failed to update order with payment failure", {
        order_no,
        error: error?.message || error,
      });
      throw error;
    }
  }

  return failureRecord;
}

export async function findRecentFailedPayment(
  user_uuid: string,
  minutesAgo: number = 5
): Promise<{
  order: any;
  failure: {
    code?: string;
    message?: string;
    rawMessage?: string;
    provider?: string;
    failureAt?: string;
    recordedAt?: string;
  };
} | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_uuid", user_uuid)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to query recent payment failures", {
      user_uuid,
      error: error.message,
    });
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const threshold = Date.now() - minutesAgo * 60 * 1000;

  for (const order of data) {
    if (!order?.order_detail) {
      continue;
    }

    let detail: any;
    try {
      detail = typeof order.order_detail === "string"
        ? JSON.parse(order.order_detail)
        : order.order_detail;
    } catch (parseError) {
      continue;
    }

    const failure = detail?.last_payment_failure;
    if (!failure) {
      continue;
    }

    const failureTimeStr = failure.failureAt || failure.recordedAt;
    const fallbackTime = order.updated_at || order.paid_at || order.created_at;
    const failureTime = failureTimeStr
      ? new Date(failureTimeStr).getTime()
      : fallbackTime
      ? new Date(fallbackTime).getTime()
      : Number.NaN;

    if (!Number.isFinite(failureTime)) {
      continue;
    }

    if (failureTime >= threshold) {
      return {
        order,
        failure,
      };
    }
  }

  return null;
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

// 新增：更新订单的订阅ID
export async function updateOrderSubId(
  order_no: string,
  sub_id: string
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ sub_id })
    .eq("order_no", order_no);

  if (error) {
    throw error;
  }

  return data;
}

// 查询用户最近成功支付的订单
export async function findRecentPaidOrder(
  user_uuid: string,
  minutesAgo: number = 5
): Promise<Order | null> {
  const supabase = getSupabaseClient();
  const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_uuid', user_uuid)
    .eq('status', 'paid')
    .gte('paid_at', timeThreshold)
    .order('paid_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // 如果没有找到记录，返回 null 而不是抛出错误
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('查询最近支付订单失败:', error);
    throw error;
  }

  return data;
}
