import { User } from "@/types/user";
import { getSupabaseClient } from "./db";
import Stripe from "stripe";

export async function insertUser(user: User) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("users").insert(user);

  if (error) {
    throw error;
  }

  return data;
}

export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("uuid", uuid)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getUsers(
  page: number = 1,
  limit: number = 50
): Promise<User[] | undefined> {
  if (page < 1) page = 1;
  if (limit <= 0) limit = 50;

  const offset = (page - 1) * limit;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

export async function getStripeCustomerId(userUuid: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  // 获取用户最近的已支付订单
  const { data: order, error } = await supabase
    .from("orders")
    .select("stripe_session_id")
    .eq("user_uuid", userUuid)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !order || !order.stripe_session_id) {
    return null;
  }

  try {
    // 使用 Stripe Session ID 获取 Customer ID
    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    return session.customer as string;
  } catch (error) {
    console.error("Error getting Stripe customer ID:", error);
    return null;
  }
}
