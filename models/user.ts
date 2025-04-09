import { User } from "@/types/user";
import { getIsoTimestr } from "@/lib/time";
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

export async function getStripeCustomerId(
  userUuid: string
): Promise<string | null> {
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
    const session = await stripe.checkout.sessions.retrieve(
      order.stripe_session_id
    );
    return session.customer as string;
  } catch (error) {
    console.error("Error getting Stripe customer ID:", error);
    return null;
  }
}
export async function updateUserInviteCode(
  user_uuid: string,
  invite_code: string
) {
  const supabase = getSupabaseClient();
  const updated_at = getIsoTimestr();
  const { data, error } = await supabase
    .from("users")
    .update({ invite_code, updated_at })
    .eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserInvitedBy(
  user_uuid: string,
  invited_by: string
) {
  const supabase = getSupabaseClient();
  const updated_at = getIsoTimestr();
  const { data, error } = await supabase
    .from("users")
    .update({ invited_by, updated_at })
    .eq("uuid", user_uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function getUsersByUuids(user_uuids: string[]): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("uuid", user_uuids);
  if (error) {
    return [];
  }

  return data as User[];
}

export async function findUserByInviteCode(invite_code: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("invite_code", invite_code)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getUserUuidsByEmail(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("uuid")
    .eq("email", email);
  if (error) {
    return [];
  }

  return data.map((user) => user.uuid);
}
