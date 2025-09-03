import { getSupabaseClient } from "./db";

export interface IPLimit {
  id: number;
  ip_address: string;
  registration_count: number;
  first_registration: string;
  last_registration: string;
  is_blocked: boolean;
  created_at: string;
}

/**
 * 根据IP地址查询IP限制记录
 */
export async function findIPLimitByAddress(
  ip: string
): Promise<IPLimit | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("ip_registration_limits")
    .select("*")
    .eq("ip_address", ip)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // no rows found
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * 插入或更新IP注册计数（修复版：正确累加计数）
 */
export async function upsertIPRegistrationCount(ip: string): Promise<void> {
  const supabase = getSupabaseClient();

  // 先查询现有记录
  const existingRecord = await findIPLimitByAddress(ip);

  if (existingRecord) {
    // 更新现有记录：计数+1，更新最后注册时间
    const { error } = await supabase
      .from("ip_registration_limits")
      .update({
        registration_count: existingRecord.registration_count + 1,
        last_registration: new Date().toISOString(),
      })
      .eq("ip_address", ip);

    if (error) {
      throw error;
    }
  } else {
    // 插入新记录：计数为1，设置首次和最后注册时间
    const now = new Date().toISOString();
    const { error } = await supabase.from("ip_registration_limits").insert({
      ip_address: ip,
      registration_count: 1,
      first_registration: now,
      last_registration: now,
      is_blocked: false,
    });

    if (error) {
      throw error;
    }
  }
}

/**
 * 基于ip_registration_limits表查询指定IP的注册统计（精确版）
 * @param ip IP地址
 * @param since 开始时间
 * @returns 在指定时间范围内的注册数量（100%准确）
 */
export async function countIPRegistrationsSince(
  ip: string,
  since: Date
): Promise<number> {
  const ipRecord = await findIPLimitByAddress(ip);
  if (!ipRecord) {
    return 0; // IP没有注册记录
  }

  const firstRegistration = new Date(ipRecord.first_registration);
  const lastRegistration = new Date(ipRecord.last_registration);

  // 情况1：最后注册早于查询时间 → 确定返回0
  if (lastRegistration < since) {
    return 0; // 最后注册时间早于指定时间，确定无注册在范围内
  }

  // 情况2：首次注册晚于查询时间 → 确定全部在范围内
  if (firstRegistration >= since) {
    return ipRecord.registration_count; // 所有注册都在时间范围内
  }

  // 情况3：跨时间范围 → 使用users表精确统计
  // 首次注册早于since，但最后注册晚于since，需要精确统计
  return await countUserRegistrationsByIPAndTime(ip, since);
}

/**
 * 查询指定IP在指定时间范围内的注册数量（基于users表，保留作为过渡）
 */
export async function countUserRegistrationsByIPAndTime(
  ip: string,
  since: Date
): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("signin_ip", ip)
    .gte("created_at", since.toISOString());

  if (error) {
    throw error;
  }

  return count || 0;
}
