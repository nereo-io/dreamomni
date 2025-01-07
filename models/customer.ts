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
      birth_date_time: data.birthDateTime,
      true_solar_time: data.trueSolarTime,
      birth_city: data.birthCity,
      city_adcode: data.cityAdcode,
      city_address: data.cityAddress,
      city_lng: data.cityLng,
      city_lat: data.cityLat,
      user_uuid: data.userUuid,
      timezone: data.timezone,
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
      birth_date_time,
      gender,
      true_solar_time,
      timezone
    `)
    .eq("id", customerId)
    .single();

  if (error || !customer) {
    throw new Error('Customer not found');
  }

  // 使用 Luxon 处理时区
  const birthDate = DateTime
    .fromISO(customer.true_solar_time || customer.birth_date_time)
    .setZone(customer.timezone);
    
  return {
    year: birthDate.year,
    month: birthDate.month,
    day: birthDate.day,
    hour: birthDate.hour,
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
    
    // 首先检查表是否存在
    const { data: tableInfo, error: tableError } = await supabase
      .from('customer_analysis')
      .select('*')
      .limit(1);
    
    console.log('Table check result:', { tableInfo, tableError });

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

  return data;
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