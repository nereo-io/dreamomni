// veo3 AI 数据统计类型定义

// 目标追踪指标
export interface TargetMetrics {
  // 用户目标
  monthlyUserTarget: number; // 月度新增用户目标
  currentMonthUsers: number; // 本月实际新增用户
  userTargetProgress: number; // 用户目标完成率 (%)

  // 付费用户目标
  monthlyPaidUserTarget: number; // 月度新增付费用户目标
  currentMonthPaidUsers: number; // 本月实际新增付费用户
  paidUserTargetProgress: number; // 付费用户目标完成率 (%)
}

// 用户统计数据
export interface UserStatistics {
  // 累计数据
  totalUsers: number; // 总注册用户数

  // 时间维度统计
  todayNewUsers: number; // 今日新增用户
  yesterdayNewUsers: number; // 昨日新增用户
  thisWeekNewUsers: number; // 本周新增用户
  thisMonthNewUsers: number; // 本月新增用户
}

// 视频生成统计数据
export interface VideoGenerationStatistics {
  // 累计数据
  totalGenerations: number; // 累计视频生成总数

  // 时间维度统计
  todayGenerations: number; // 今日生成数
  yesterdayGenerations: number; // 昨日生成数
  thisWeekGenerations: number; // 本周生成数
  thisMonthGenerations: number; // 本月生成数

  // 今日状态分布
  todaySuccessful: number; // 今日成功生成数
  todayFailed: number; // 今日失败数
  todayPending: number; // 今日等待/处理中数

  // 昨日状态分布
  yesterdaySuccessful: number; // 昨日成功生成数
  yesterdayFailed: number; // 昨日失败数
  yesterdayPending: number; // 昨日等待/处理中数

  // 成功率指标
  overallSuccessRate: number; // 总体成功率
  todaySuccessRate: number; // 今日成功率
  yesterdaySuccessRate: number; // 昨日成功率
  weeklySuccessRate: number; // 本周成功率
}

// 模型使用统计
export interface ModelUsageStatistics {
  modelName: string; // 模型名称
  totalUsage: number; // 总使用次数
  todayUsage: number; // 今日使用次数
  successCount: number; // 成功次数
  failureCount: number; // 失败次数
  successRate: number; // 成功率
  avgProcessingTime: number; // 平均处理时间(秒)
  usagePercentage: number; // 使用占比
}

// 订单统计数据
export interface OrderStatistics {
  // 订单数量统计
  totalOrders: number; // 累计订单数
  todayOrders: number; // 今日新增订单
  yesterdayOrders: number; // 昨日新增订单
  thisMonthOrders: number; // 本月新增订单

  // 支付成功统计
  totalPaidOrders: number; // 累计支付成功订单
  todayPaidOrders: number; // 今日支付成功订单
  yesterdayPaidOrders: number; // 昨日支付成功订单
  thisMonthPaidOrders: number; // 本月支付成功订单

  // 转化率指标
  overallConversionRate: number; // 总体转化率
  todayConversionRate: number; // 今日转化率
  monthlyConversionRate: number; // 本月转化率
}

// 会员统计数据
export interface MembershipStatistics {
  // 基础统计
  totalMemberships: number; // 累计会员数
  activeMemberships: number; // 当前活跃会员数
  expiredMemberships: number; // 已过期会员数

  // 时间维度统计
  todayNewMemberships: number; // 今日新增会员
  yesterdayNewMemberships: number; // 昨日新增会员
  thisMonthNewMemberships: number; // 本月新增会员
}

// 视频生成状态枚举
export enum VideoGenerationStatus {
  PENDING = "PENDING",
  IN_QUEUE = "IN_QUEUE",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  SAVED_TO_R2 = "SAVED_TO_R2",
}

// 今日视频统计数据
export interface TodayVideoStatistics {
  todayTotal: number; // 今日生成总数
  todaySuccessRate: number; // 今日成功率
}

// 最新视频状态统计
export interface LatestVideoStatusStatistics {
  successCount: number; // 成功数量
  failedCount: number; // 失败数量
  processingCount: number; // 处理中数量
  total: number; // 总数量
}
