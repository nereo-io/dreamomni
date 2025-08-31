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
export async function findIPLimitByAddress(ip: string): Promise<IPLimit | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('ip_registration_limits')
    .select('*')
    .eq('ip_address', ip)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // no rows found
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * 插入或更新IP注册计数
 */
export async function upsertIPRegistrationCount(ip: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('ip_registration_limits')
    .upsert({
      ip_address: ip,
      registration_count: 1,
      first_registration: new Date().toISOString(),
      last_registration: new Date().toISOString(),
      is_blocked: false
    }, {
      onConflict: 'ip_address'
    });

  if (error) {
    throw error;
  }
}

/**
 * 查询指定IP在指定时间范围内的注册数量
 */
export async function countUserRegistrationsByIPAndTime(
  ip: string, 
  since: Date
): Promise<number> {
  const supabase = getSupabaseClient();
  
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('signin_ip', ip)
    .gte('created_at', since.toISOString());

  if (error) {
    throw error;
  }

  return count || 0;
}