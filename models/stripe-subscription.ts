import { getSupabaseClient } from "./db";

export interface StripeSubscription {
  id: string;
  user_uuid: string;
  stripe_subscription_id: string;
  stripe_customer_id?: string;
  stripe_session_id?: string;
  plan_type: "monthly" | "yearly";
  amount: number;
  currency: string;
  status:
    | "active"
    | "canceled"
    | "past_due"
    | "trialing"
    | "incomplete"
    | "unpaid";
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
  product_name?: string;
  product_id?: string;
  created_at: string;
  updated_at: string;
}

export async function upsertStripeSubscription(
  subscription: Omit<StripeSubscription, "id" | "created_at" | "updated_at">
) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .upsert(
      {
        ...subscription,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function findStripeSubscriptionsByUserUuid(
  userUuid: string,
  page: number = 1,
  limit: number = 10
): Promise<StripeSubscription[]> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 10;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .select("*")
    .eq("user_uuid", userUuid)
    .neq("status", "incomplete")
    .neq("status", "past_due")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return [];
  }

  return data || [];
}

export async function findActiveStripeSubscriptionsByUserUuid(
  userUuid: string
): Promise<StripeSubscription[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stripe_subscriptions")
    .select("*")
    .eq("user_uuid", userUuid)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}
