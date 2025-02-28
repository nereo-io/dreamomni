import { getSupabaseClient } from "./db";

// 获取用户统计数据
export async function getUserStatistics() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 获取总用户数
  const { count: totalUsers, error: totalError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // 获取今日新增用户数
  const { count: todayUsers, error: todayError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  // 获取昨日新增用户数
  const { count: yesterdayUsers, error: yesterdayError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterdayStr)
    .lt("created_at", today);

  if (totalError || todayError || yesterdayError) {
    console.error(
      "获取用户统计数据失败:",
      totalError || todayError || yesterdayError
    );
    return { total: 0, today: 0, yesterday: 0 };
  }

  return {
    total: totalUsers || 0,
    today: todayUsers || 0,
    yesterday: yesterdayUsers || 0,
  };
}

// 获取客户信息统计数据
export async function getCustomerInfoStatistics() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 获取总客户信息数
  const { count: totalCustomers, error: totalError } = await supabase
    .from("customer_info")
    .select("*", { count: "exact", head: true });

  // 获取今日新增客户信息数
  const { count: todayCustomers, error: todayError } = await supabase
    .from("customer_info")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  // 获取昨日新增客户信息数
  const { count: yesterdayCustomers, error: yesterdayError } = await supabase
    .from("customer_info")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterdayStr)
    .lt("created_at", today);

  if (totalError || todayError || yesterdayError) {
    console.error(
      "获取客户信息统计数据失败:",
      totalError || todayError || yesterdayError
    );
    return { total: 0, today: 0, yesterday: 0 };
  }

  return {
    total: totalCustomers || 0,
    today: todayCustomers || 0,
    yesterday: yesterdayCustomers || 0,
  };
}

// 获取聊天会话统计数据
export async function getChatSessionStatistics() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 获取总聊天会话数
  const { count: totalSessions, error: totalError } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true });

  // 获取今日新增聊天会话数
  const { count: todaySessions, error: todayError } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  // 获取昨日新增聊天会话数
  const { count: yesterdaySessions, error: yesterdayError } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterdayStr)
    .lt("created_at", today);

  if (totalError || todayError || yesterdayError) {
    console.error(
      "获取聊天会话统计数据失败:",
      totalError || todayError || yesterdayError
    );
    return { total: 0, today: 0, yesterday: 0 };
  }

  return {
    total: totalSessions || 0,
    today: todaySessions || 0,
    yesterday: yesterdaySessions || 0,
  };
}

// 获取聊天消息统计数据
export async function getChatMessageStatistics() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 获取总聊天消息数
  const { count: totalMessages, error: totalError } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true });

  // 获取今日新增聊天消息数
  const { count: todayMessages, error: todayError } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  // 获取昨日新增聊天消息数
  const { count: yesterdayMessages, error: yesterdayError } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterdayStr)
    .lt("created_at", today);

  if (totalError || todayError || yesterdayError) {
    console.error(
      "获取聊天消息统计数据失败:",
      totalError || todayError || yesterdayError
    );
    return { total: 0, today: 0, yesterday: 0 };
  }

  return {
    total: totalMessages || 0,
    today: todayMessages || 0,
    yesterday: yesterdayMessages || 0,
  };
}

// 获取会员统计数据
export async function getMembershipStatistics() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 获取总会员数
  const { count: totalMembers, error: totalError } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true });

  // 获取今日新增会员数
  const { count: todayMembers, error: todayError } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  // 获取昨日新增会员数
  const { count: yesterdayMembers, error: yesterdayError } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterdayStr)
    .lt("created_at", today);

  // 获取活跃会员数
  const { count: activeMembers, error: activeError } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (totalError || todayError || yesterdayError || activeError) {
    console.error(
      "获取会员统计数据失败:",
      totalError || todayError || yesterdayError || activeError
    );
    return { total: 0, today: 0, yesterday: 0, active: 0 };
  }

  return {
    total: totalMembers || 0,
    today: todayMembers || 0,
    yesterday: yesterdayMembers || 0,
    active: activeMembers || 0,
  };
}

// 获取目标追踪统计数据
export async function getTargetStatistics() {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算本月第一天
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthStr = thisMonth.toISOString().split("T")[0];

  // 获取本月新增用户数
  const { count: thisMonthUsers, error: thisMonthError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", thisMonthStr)
    .lt("created_at", today);

  // 获取本月新增付费用户数（通过memberships表统计）
  const { count: thisMonthPaidUsers, error: paidError } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .gte("created_at", thisMonthStr)
    .lt("created_at", today);

  if (thisMonthError || paidError) {
    console.error("获取目标追踪统计数据失败:", thisMonthError || paidError);
    return {
      thisMonthUsers: 0,
      thisMonthPaidUsers: 0,
      userTarget: 3000,
      paidUserTarget: 100,
    };
  }

  return {
    thisMonthUsers: thisMonthUsers || 0,
    thisMonthPaidUsers: thisMonthPaidUsers || 0,
    userTarget: 3000,
    paidUserTarget: 100,
  };
}
