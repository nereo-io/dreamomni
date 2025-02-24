import { CustomerInput, CustomerInfo } from "@/types/customer";
import { getSupabaseClient } from "./db";

// 创建客户Info信息
export async function createCustomerInfo(data: Omit<CustomerInfo, "id">) {
  const supabase = getSupabaseClient();

  const { data: result, error } = await supabase
    .from("customer_info")
    .upsert(
      {
        gender: data.gender,
        birth_year: data.birthYear,
        birth_month: data.birthMonth,
        birth_day: data.birthDay,
        birth_hour: data.birthHour,
        user_uuid: data.userUuid,
      },
      {
        // 指定唯一约束，基于 user_uuid 进行更新
        onConflict: "user_uuid",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

// 根据ID获取客户Info信息
export async function getCustomerInfoById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("customer_info")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  const customerInfo: CustomerInfo = {
    id: data.id,
    gender: data.gender,
    birthYear: data.birth_year,
    birthMonth: data.birth_month,
    birthDay: data.birth_day,
    birthHour: data.birth_hour,
    userUuid: data.user_uuid,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return customerInfo;
}

// 根据用户UUID获取客户Info信息
export async function getCustomerInfoByUserUuid(userUuid: string): Promise<{
  data: CustomerInfo | null;
  error: string | null;
}> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("customer_info")
    .select("*")
    .eq("user_uuid", userUuid)
    .single();

  if (error) {
    // 如果是 "not found" 错误，返回 null 数据而不是错误
    if (error.code === "PGRST116") {
      return {
        data: null,
        error: null,
      };
    }
    // 其他错误情况
    return {
      data: null,
      error: error.message,
    };
  }

  // 转换数据格式
  const customerInfo: CustomerInfo = {
    id: data.id,
    gender: data.gender,
    birthYear: data.birth_year,
    birthMonth: data.birth_month,
    birthDay: data.birth_day,
    birthHour: data.birth_hour,
    userUuid: data.user_uuid,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return {
    data: customerInfo,
    error: null,
  };
}

// 创建新客户问题
export async function createCustomerInput(data: Omit<CustomerInput, "id">) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from("customer_inputs")
    .insert({
      gender: data.gender,
      birth_year: data.birthYear,
      birth_month: data.birthMonth,
      birth_day: data.birthDay,
      birth_hour: data.birthHour,
      career_question: data.careerQuestion,
      user_uuid: data.userUuid,
      customer_info_id: data.customerInfoId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}

// 根据ID获取客户问题信息
export async function getCustomerInputById(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("customer_inputs")
    .select(
      `
      *,
      user:users(*)
    `
    )
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
    .select(
      `
      birth_year,
      birth_month,
      birth_day,
      birth_hour,
      gender
    `
    )
    .eq("id", customerId)
    .single();

  if (error || !customer) {
    throw new Error("Customer not found");
  }

  return {
    year: customer.birth_year,
    month: customer.birth_month,
    day: customer.birth_day,
    hour: customer.birth_hour,
    gender: customer.gender as "male" | "female",
  };
}

// 保存八字分析结果
export async function saveBaziAnalysis(customerId: string, analysis: string) {
  try {
    if (!customerId || typeof customerId !== "string") {
      throw new Error("CustomerId must be a non-empty string");
    }

    if (!analysis || typeof analysis !== "string") {
      throw new Error("Analysis must be a non-empty string");
    }

    const supabase = getSupabaseClient();

    console.log(
      "DB saveBaziAnalysis",
      customerId,
      analysis.slice(0, 100) + (analysis.length > 100 ? "..." : "")
    );

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
      console.error("Full Supabase error:", JSON.stringify(error, null, 2));
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Full error object:", JSON.stringify(error, null, 2));
    throw error;
  }
}

// 获取已保存的八字分析结果
export async function getBaziAnalysis(customerId: string) {
  console.log("DB getBaziAnalysis", customerId);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("customer_analysis")
    .select("bazi_result")
    .eq("customer_id", customerId)
    .single();

  if (error) {
    return undefined;
  }

  return { baziResult: data.bazi_result };
}
