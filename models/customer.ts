import { CustomerInput, CustomerAnalysis } from "@/types/customer";
import { getSupabaseClient } from "./db";
import { DateTime } from 'luxon';

// 创建新客户
export async function createCustomer(data: Omit<CustomerInput, 'id'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from("customer_inputs")
    .insert({
      name: data.name,
      gender: data.gender,
      birth_year: data.birthYear,
      birth_month: data.birthMonth,
      birth_day: data.birthDay,
      birth_hour: data.birthHour,
      user_uuid: data.userUuid,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

// 根据ID获取客户信息
export async function getCustomerById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("customer_inputs")
    .select(`
      *,
      user:users(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

// 获取八字分析所需的基础信息
export async function getCustomerBaziInfo(customerId: string) {
  const supabase = getSupabaseClient();
  const { data: customer, error } = await supabase
    .from("customer_inputs")
    .select(`
      birth_year,
      birth_month,
      birth_day,
      birth_hour,
      gender
    `)
    .eq("id", customerId)
    .single();

  if (error || !customer) {
    throw new Error('Customer not found');
  }
    
  return {
    year: customer.birth_year,
    month: customer.birth_month,
    day: customer.birth_day,
    hour: customer.birth_hour,
    gender: customer.gender as 'male' | 'female',
  };
}

// 保存八字分析结果
export async function saveBaziAnalysis(customerId: string, analysis: string) {
  try {
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('CustomerId must be a non-empty string');
    }

    if (!analysis || typeof analysis !== 'string') {
      throw new Error('Analysis must be a non-empty string');
    }

    const supabase = getSupabaseClient();

    console.log('DB saveBaziAnalysis', customerId, analysis.slice(0, 100) + (analysis.length > 100 ? '...' : ''));
    
    // 尝试直接插入而不是 upsert
    const { data, error } = await supabase
      .from("customer_analysis")
      .insert({
        customer_id: customerId,
        bazi_result: analysis,
      })
      .select()
      .single();

    if (error) {
      // 打印完整的错误对象
      console.error('Full Supabase error:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
}


// 获取已保存的八字分析结果
export async function getBaziAnalysis(customerId: string) {
  console.log('DB getBaziAnalysis', customerId);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("customer_analysis")
    .select("bazi_result")
    .eq("customer_id", customerId)
    .single();

  if (error) {
    return undefined;
  }

  return {baziResult: data.bazi_result};
}

// 获取用户的所有客户信息
export async function getCustomersByUserUuid(userUuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("customer_inputs")
    .select(`
      *,
      analysis:customer_analysis(*)
    `)
    .eq("user_uuid", userUuid)
    .order("created_at", { ascending: false });

  if (error) {
    return undefined;
  }

  return data;
} 