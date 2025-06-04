import { getSupabaseClient } from "./db";
import {
  UserStatistics,
  VideoGenerationStatistics,
  OrderStatistics,
  MembershipStatistics,
  TargetMetrics,
  ModelUsageStatistics,
  VideoGenerationStatus,
  TodayVideoStatistics,
  LatestVideoStatusStatistics,
} from "@/types/statistics";

// 获取用户统计数据
export async function getUserStatistics(): Promise<UserStatistics> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 计算本周第一天
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
  const thisWeekStr = thisWeek.toISOString().split("T")[0];

  // 计算本月第一天
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthStr = thisMonth.toISOString().split("T")[0];

  try {
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

    // 获取本周新增用户数
    const { count: thisWeekUsers, error: thisWeekError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisWeekStr);

    // 获取本月新增用户数
    const { count: thisMonthUsers, error: thisMonthError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStr);

    if (
      totalError ||
      todayError ||
      yesterdayError ||
      thisWeekError ||
      thisMonthError
    ) {
      console.error(
        "获取用户统计数据失败:",
        totalError ||
          todayError ||
          yesterdayError ||
          thisWeekError ||
          thisMonthError
      );
      return {
        totalUsers: 0,
        todayNewUsers: 0,
        yesterdayNewUsers: 0,
        thisWeekNewUsers: 0,
        thisMonthNewUsers: 0,
      };
    }

    return {
      totalUsers: totalUsers || 0,
      todayNewUsers: todayUsers || 0,
      yesterdayNewUsers: yesterdayUsers || 0,
      thisWeekNewUsers: thisWeekUsers || 0,
      thisMonthNewUsers: thisMonthUsers || 0,
    };
  } catch (error) {
    console.error("获取用户统计数据异常:", error);
    return {
      totalUsers: 0,
      todayNewUsers: 0,
      yesterdayNewUsers: 0,
      thisWeekNewUsers: 0,
      thisMonthNewUsers: 0,
    };
  }
}

// 获取视频生成统计数据
export async function getVideoGenerationStatistics(): Promise<VideoGenerationStatistics> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 计算本周第一天
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
  const thisWeekStr = thisWeek.toISOString().split("T")[0];

  // 计算本月第一天
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthStr = thisMonth.toISOString().split("T")[0];

  try {
    // 获取总视频生成数
    const { count: totalGenerations, error: totalError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true });

    // 获取今日生成数
    const { count: todayGenerations, error: todayError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // 获取昨日生成数
    const { count: yesterdayGenerations, error: yesterdayError } =
      await supabase
        .from("video_generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayStr)
        .lt("created_at", today);

    // 获取本周生成数
    const { count: thisWeekGenerations, error: thisWeekError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisWeekStr);

    // 获取本月生成数
    const { count: thisMonthGenerations, error: thisMonthError } =
      await supabase
        .from("video_generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonthStr);

    // 获取今日各状态数量
    const { count: todaySuccessful, error: successError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today)
      .in("status", ["COMPLETED", "SAVED_TO_R2"]);

    const { count: todayFailed, error: failedError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today)
      .eq("status", "FAILED");

    const { count: todayPending, error: pendingError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today)
      .in("status", ["PENDING", "IN_QUEUE", "IN_PROGRESS"]);

    // 获取昨日各状态数量
    const { count: yesterdaySuccessful, error: yesterdaySuccessError } =
      await supabase
        .from("video_generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayStr)
        .lt("created_at", today)
        .in("status", ["COMPLETED", "SAVED_TO_R2"]);

    const { count: yesterdayFailed, error: yesterdayFailedError } =
      await supabase
        .from("video_generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayStr)
        .lt("created_at", today)
        .eq("status", "FAILED");

    const { count: yesterdayPending, error: yesterdayPendingError } =
      await supabase
        .from("video_generations")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayStr)
        .lt("created_at", today)
        .in("status", ["PENDING", "IN_QUEUE", "IN_PROGRESS"]);

    // 计算总体成功率
    const { count: totalSuccessful, error: totalSuccessError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .in("status", ["COMPLETED", "SAVED_TO_R2"]);

    const { count: totalCompleted, error: totalCompletedError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .in("status", ["COMPLETED", "SAVED_TO_R2", "FAILED"]);

    // 计算本周成功率
    const { count: weekSuccessful, error: weekSuccessError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisWeekStr)
      .in("status", ["COMPLETED", "SAVED_TO_R2"]);

    const { count: weekCompleted, error: weekCompletedError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisWeekStr)
      .in("status", ["COMPLETED", "SAVED_TO_R2", "FAILED"]);

    if (
      totalError ||
      todayError ||
      yesterdayError ||
      thisWeekError ||
      thisMonthError ||
      successError ||
      failedError ||
      pendingError ||
      yesterdaySuccessError ||
      yesterdayFailedError ||
      yesterdayPendingError
    ) {
      console.error(
        "获取视频生成统计数据失败:",
        totalError || todayError || yesterdayError
      );
      return {
        totalGenerations: 0,
        todayGenerations: 0,
        yesterdayGenerations: 0,
        thisWeekGenerations: 0,
        thisMonthGenerations: 0,
        todaySuccessful: 0,
        todayFailed: 0,
        todayPending: 0,
        yesterdaySuccessful: 0,
        yesterdayFailed: 0,
        yesterdayPending: 0,
        overallSuccessRate: 0,
        todaySuccessRate: 0,
        yesterdaySuccessRate: 0,
        weeklySuccessRate: 0,
      };
    }

    // 计算成功率
    const overallSuccessRate =
      totalCompleted && totalCompleted > 0
        ? ((totalSuccessful || 0) / totalCompleted) * 100
        : 0;

    const todaySuccessRate =
      todayGenerations && todayGenerations > 0
        ? ((todaySuccessful || 0) / todayGenerations) * 100
        : 0;

    const yesterdaySuccessRate =
      yesterdayGenerations && yesterdayGenerations > 0
        ? ((yesterdaySuccessful || 0) / yesterdayGenerations) * 100
        : 0;

    const weeklySuccessRate =
      weekCompleted && weekCompleted > 0
        ? ((weekSuccessful || 0) / weekCompleted) * 100
        : 0;

    return {
      totalGenerations: totalGenerations || 0,
      todayGenerations: todayGenerations || 0,
      yesterdayGenerations: yesterdayGenerations || 0,
      thisWeekGenerations: thisWeekGenerations || 0,
      thisMonthGenerations: thisMonthGenerations || 0,
      todaySuccessful: todaySuccessful || 0,
      todayFailed: todayFailed || 0,
      todayPending: todayPending || 0,
      yesterdaySuccessful: yesterdaySuccessful || 0,
      yesterdayFailed: yesterdayFailed || 0,
      yesterdayPending: yesterdayPending || 0,
      overallSuccessRate: Math.round(overallSuccessRate * 10) / 10,
      todaySuccessRate: Math.round(todaySuccessRate * 10) / 10,
      yesterdaySuccessRate: Math.round(yesterdaySuccessRate * 10) / 10,
      weeklySuccessRate: Math.round(weeklySuccessRate * 10) / 10,
    };
  } catch (error) {
    console.error("获取视频生成统计数据异常:", error);
    return {
      totalGenerations: 0,
      todayGenerations: 0,
      yesterdayGenerations: 0,
      thisWeekGenerations: 0,
      thisMonthGenerations: 0,
      todaySuccessful: 0,
      todayFailed: 0,
      todayPending: 0,
      yesterdaySuccessful: 0,
      yesterdayFailed: 0,
      yesterdayPending: 0,
      overallSuccessRate: 0,
      todaySuccessRate: 0,
      yesterdaySuccessRate: 0,
      weeklySuccessRate: 0,
    };
  }
}

// 获取模型使用统计
export async function getVideoGenerationByModel(): Promise<
  ModelUsageStatistics[]
> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    // 获取所有模型的使用数据
    const { data: modelData, error } = await supabase
      .from("video_generations")
      .select("model_id, status")
      .order("model_id");

    if (error) {
      console.error("获取模型使用统计失败:", error);
      return [];
    }

    // 按模型分组统计
    const modelStats: { [key: string]: ModelUsageStatistics } = {};
    let totalUsage = 0;

    modelData?.forEach((record) => {
      const modelId = record.model_id;
      totalUsage++;

      if (!modelStats[modelId]) {
        modelStats[modelId] = {
          modelName: modelId,
          totalUsage: 0,
          todayUsage: 0,
          successCount: 0,
          failureCount: 0,
          successRate: 0,
          avgProcessingTime: 0, // 暂时设为0，需要额外字段支持
          usagePercentage: 0,
        };
      }

      modelStats[modelId].totalUsage++;

      if (["COMPLETED", "SAVED_TO_R2"].includes(record.status)) {
        modelStats[modelId].successCount++;
      } else if (record.status === "FAILED") {
        modelStats[modelId].failureCount++;
      }
    });

    // 获取今日各模型使用数据
    const { data: todayData, error: todayError } = await supabase
      .from("video_generations")
      .select("model_id")
      .gte("created_at", today);

    if (!todayError && todayData) {
      todayData.forEach((record) => {
        if (modelStats[record.model_id]) {
          modelStats[record.model_id].todayUsage++;
        }
      });
    }

    // 计算百分比和成功率
    const result = Object.values(modelStats).map((stats) => ({
      ...stats,
      successRate:
        stats.totalUsage > 0
          ? Math.round((stats.successCount / stats.totalUsage) * 1000) / 10
          : 0,
      usagePercentage:
        totalUsage > 0
          ? Math.round((stats.totalUsage / totalUsage) * 1000) / 10
          : 0,
    }));

    return result.sort((a, b) => b.totalUsage - a.totalUsage);
  } catch (error) {
    console.error("获取模型使用统计异常:", error);
    return [];
  }
}

// 获取订单统计数据
export async function getOrderStatistics(): Promise<OrderStatistics> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 计算本月第一天
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthStr = thisMonth.toISOString().split("T")[0];

  try {
    // 获取总订单数
    const { count: totalOrders, error: totalError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    // 获取今日订单数
    const { count: todayOrders, error: todayError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // 获取昨日订单数
    const { count: yesterdayOrders, error: yesterdayError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterdayStr)
      .lt("created_at", today);

    // 获取本月订单数
    const { count: thisMonthOrders, error: thisMonthError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStr);

    // 获取支付成功订单统计
    const { count: totalPaidOrders, error: totalPaidError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid");

    const { count: todayPaidOrders, error: todayPaidError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid")
      .gte("created_at", today);

    const { count: yesterdayPaidOrders, error: yesterdayPaidError } =
      await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "paid")
        .gte("created_at", yesterdayStr)
        .lt("created_at", today);

    const { count: thisMonthPaidOrders, error: thisMonthPaidError } =
      await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "paid")
        .gte("created_at", thisMonthStr);

    if (totalError || todayError || yesterdayError || thisMonthError) {
      console.error(
        "获取订单统计数据失败:",
        totalError || todayError || yesterdayError
      );
      return {
        totalOrders: 0,
        todayOrders: 0,
        yesterdayOrders: 0,
        thisMonthOrders: 0,
        totalPaidOrders: 0,
        todayPaidOrders: 0,
        yesterdayPaidOrders: 0,
        thisMonthPaidOrders: 0,
        overallConversionRate: 0,
        todayConversionRate: 0,
        monthlyConversionRate: 0,
      };
    }

    // 计算转化率
    const overallConversionRate =
      totalOrders && totalOrders > 0
        ? ((totalPaidOrders || 0) / totalOrders) * 100
        : 0;

    const todayConversionRate =
      todayOrders && todayOrders > 0
        ? ((todayPaidOrders || 0) / todayOrders) * 100
        : 0;

    const monthlyConversionRate =
      thisMonthOrders && thisMonthOrders > 0
        ? ((thisMonthPaidOrders || 0) / thisMonthOrders) * 100
        : 0;

    return {
      totalOrders: totalOrders || 0,
      todayOrders: todayOrders || 0,
      yesterdayOrders: yesterdayOrders || 0,
      thisMonthOrders: thisMonthOrders || 0,
      totalPaidOrders: totalPaidOrders || 0,
      todayPaidOrders: todayPaidOrders || 0,
      yesterdayPaidOrders: yesterdayPaidOrders || 0,
      thisMonthPaidOrders: thisMonthPaidOrders || 0,
      overallConversionRate: Math.round(overallConversionRate * 10) / 10,
      todayConversionRate: Math.round(todayConversionRate * 10) / 10,
      monthlyConversionRate: Math.round(monthlyConversionRate * 10) / 10,
    };
  } catch (error) {
    console.error("获取订单统计数据异常:", error);
    return {
      totalOrders: 0,
      todayOrders: 0,
      yesterdayOrders: 0,
      thisMonthOrders: 0,
      totalPaidOrders: 0,
      todayPaidOrders: 0,
      yesterdayPaidOrders: 0,
      thisMonthPaidOrders: 0,
      overallConversionRate: 0,
      todayConversionRate: 0,
      monthlyConversionRate: 0,
    };
  }
}

// 获取会员统计数据 (增强版)
export async function getMembershipDetailedStatistics(): Promise<MembershipStatistics> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // 计算昨天的日期
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 计算本月第一天
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthStr = thisMonth.toISOString().split("T")[0];

  try {
    // 获取总会员数
    const { count: totalMemberships, error: totalError } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true });

    // 获取活跃会员数
    const { count: activeMemberships, error: activeError } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 获取过期会员数
    const { count: expiredMemberships, error: expiredError } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "expired");

    // 获取今日新增会员数
    const { count: todayNewMemberships, error: todayError } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // 获取昨日新增会员数
    const { count: yesterdayNewMemberships, error: yesterdayError } =
      await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayStr)
        .lt("created_at", today);

    // 获取本月新增会员数
    const { count: thisMonthNewMemberships, error: thisMonthError } =
      await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonthStr);

    if (
      totalError ||
      activeError ||
      expiredError ||
      todayError ||
      yesterdayError ||
      thisMonthError
    ) {
      console.error(
        "获取会员统计数据失败:",
        totalError ||
          activeError ||
          expiredError ||
          todayError ||
          yesterdayError ||
          thisMonthError
      );
      return {
        totalMemberships: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        todayNewMemberships: 0,
        yesterdayNewMemberships: 0,
        thisMonthNewMemberships: 0,
      };
    }

    return {
      totalMemberships: totalMemberships || 0,
      activeMemberships: activeMemberships || 0,
      expiredMemberships: expiredMemberships || 0,
      todayNewMemberships: todayNewMemberships || 0,
      yesterdayNewMemberships: yesterdayNewMemberships || 0,
      thisMonthNewMemberships: thisMonthNewMemberships || 0,
    };
  } catch (error) {
    console.error("获取会员统计数据异常:", error);
    return {
      totalMemberships: 0,
      activeMemberships: 0,
      expiredMemberships: 0,
      todayNewMemberships: 0,
      yesterdayNewMemberships: 0,
      thisMonthNewMemberships: 0,
    };
  }
}

// 获取目标追踪统计数据 (增强版)
export async function getTargetMetrics(): Promise<TargetMetrics> {
  const supabase = getSupabaseClient();
  // const today = new Date().toISOString().split("T")[0]; // Not used

  // 计算本月第一天
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthStr = thisMonth.toISOString().split("T")[0];

  try {
    // 获取本月新增用户数
    const { count: currentMonthUsers, error: userError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStr);

    // 获取本月新增付费用户数（通过memberships表统计）
    const { count: currentMonthPaidUsers, error: paidError } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("created_at", thisMonthStr);

    if (userError || paidError) {
      console.error("获取目标追踪统计数据失败:", userError || paidError);
      return {
        monthlyUserTarget: 3000,
        currentMonthUsers: 0,
        userTargetProgress: 0,
        monthlyPaidUserTarget: 100,
        currentMonthPaidUsers: 0,
        paidUserTargetProgress: 0,
      };
    }

    // 设置目标值（可以从配置文件或数据库读取）
    const monthlyUserTarget = 3000;
    const monthlyPaidUserTarget = 100;

    // 计算完成率
    const userTargetProgress =
      monthlyUserTarget > 0
        ? Math.min(((currentMonthUsers || 0) / monthlyUserTarget) * 100, 100)
        : 0;

    const paidUserTargetProgress =
      monthlyPaidUserTarget > 0
        ? Math.min(
            ((currentMonthPaidUsers || 0) / monthlyPaidUserTarget) * 100,
            100
          )
        : 0;

    return {
      monthlyUserTarget,
      currentMonthUsers: currentMonthUsers || 0,
      userTargetProgress: Math.round(userTargetProgress * 10) / 10,
      monthlyPaidUserTarget,
      currentMonthPaidUsers: currentMonthPaidUsers || 0,
      paidUserTargetProgress: Math.round(paidUserTargetProgress * 10) / 10,
    };
  } catch (error) {
    console.error("获取目标追踪统计数据异常:", error);
    return {
      monthlyUserTarget: 3000,
      currentMonthUsers: 0,
      userTargetProgress: 0,
      monthlyPaidUserTarget: 100,
      currentMonthPaidUsers: 0,
      paidUserTargetProgress: 0,
    };
  }
}

// 保留原有的基础函数以兼容现有代码
export async function getMembershipStatistics() {
  const detailedStats = await getMembershipDetailedStatistics();
  return {
    total: detailedStats.totalMemberships,
    today: detailedStats.todayNewMemberships,
    yesterday: detailedStats.yesterdayNewMemberships,
    active: detailedStats.activeMemberships,
  };
}

export async function getTargetStatistics() {
  const targetMetrics = await getTargetMetrics();
  return {
    thisMonthUsers: targetMetrics.currentMonthUsers,
    thisMonthPaidUsers: targetMetrics.currentMonthPaidUsers,
    userTarget: targetMetrics.monthlyUserTarget,
    paidUserTarget: targetMetrics.monthlyPaidUserTarget,
  };
}

// 获取今日视频统计详情
export async function getTodayVideoStatistics(): Promise<TodayVideoStatistics> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    // 获取今日生成总数
    const { count: todayTotal, error: totalError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // 获取今日成功数
    const { count: todaySuccess, error: successError } = await supabase
      .from("video_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today)
      .in("status", ["COMPLETED", "SAVED_TO_R2"]);

    if (totalError || successError) {
      console.error("获取今日视频统计失败:", totalError || successError);
      return {
        todayTotal: 0,
        todaySuccessRate: 0,
      };
    }

    const successRate =
      todayTotal && todayTotal > 0
        ? Math.round(((todaySuccess || 0) / todayTotal) * 1000) / 10
        : 0;

    return {
      todayTotal: todayTotal || 0,
      todaySuccessRate: successRate,
    };
  } catch (error) {
    console.error("获取今日视频统计异常:", error);
    return {
      todayTotal: 0,
      todaySuccessRate: 0,
    };
  }
}

// 获取最新10条视频状态统计
export async function getLatestVideoStatusStatistics(): Promise<LatestVideoStatusStatistics> {
  const supabase = getSupabaseClient();

  try {
    // 获取最新10条视频记录
    const { data: latestVideos, error } = await supabase
      .from("video_generations")
      .select("status")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("获取最新视频状态失败:", error);
      return {
        successCount: 0,
        failedCount: 0,
        processingCount: 0,
        total: 0,
      };
    }

    if (!latestVideos || latestVideos.length === 0) {
      return {
        successCount: 0,
        failedCount: 0,
        processingCount: 0,
        total: 0,
      };
    }

    // 统计各状态数量
    const successCount = latestVideos.filter((v) =>
      ["COMPLETED", "SAVED_TO_R2"].includes(v.status)
    ).length;

    const failedCount = latestVideos.filter(
      (v) => v.status === "FAILED"
    ).length;

    const processingCount = latestVideos.filter((v) =>
      ["PENDING", "IN_QUEUE", "IN_PROGRESS"].includes(v.status)
    ).length;

    return {
      successCount,
      failedCount,
      processingCount,
      total: latestVideos.length,
    };
  } catch (error) {
    console.error("获取最新视频状态统计异常:", error);
    return {
      successCount: 0,
      failedCount: 0,
      processingCount: 0,
      total: 0,
    };
  }
}
