import { getSupabaseClient } from "@/models/db";
import { increaseCredits } from "@/services/credit";
import { getSnowId } from "@/lib/hash";

interface DistributionSchedule {
  id: string;
  order_no: string;
  user_uuid: string;
  subscription_id?: string;
  payment_provider?: string; // 支付提供商：creem/payssion/stripe
  total_credits: number;
  monthly_credits: number;
  total_months: number;
  distributed_months: number;
  next_distribution_date: string;
  last_distribution_date?: string;
  status: string;
}

export class CreditDistributionService {
  /**
   * 查询需要发放积分的订阅
   */
  static async getPendingDistributions(): Promise<DistributionSchedule[]> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("credit_distribution_schedule")
      .select("*")
      .eq("status", "active")
      .lte("next_distribution_date", now)
      .order("next_distribution_date", { ascending: true })
      .limit(100);

    if (error) {
      console.error("❌ Failed to query pending distributions:", error);
      throw error;
    }

    return data || [];
  }

  /**
   * 执行单个订阅的积分发放
   */
  static async distributeCreditsForSchedule(
    schedule: DistributionSchedule
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();

      // 1. 检查订单状态 - 如果已退款则取消发放
      const { findOrderByOrderNo } = await import("@/models/order");
      const order = await findOrderByOrderNo(schedule.order_no);

      if (!order) {
        console.error(`❌ Order not found: ${schedule.order_no}`);
        return { success: false, error: "Order not found" };
      }

      if (order.status === "refunded") {
        console.log(`🚫 Order ${schedule.order_no} is refunded, canceling distribution`);
        await this.cancelSchedule(schedule.order_no);
        return { success: true };
      }

      // 2. 检查是否已完成所有发放
      if (schedule.distributed_months >= schedule.total_months) {
        await this.markScheduleCompleted(schedule.id);
        return { success: true };
      }

      const nextMonthNumber = schedule.distributed_months + 1;

      // 3. 检查是否已发放过该月（幂等性）
      const { data: existingHistory } = await supabase
        .from("credit_distribution_history")
        .select("id")
        .eq("schedule_id", schedule.id)
        .eq("month_number", nextMonthNumber)
        .single();

      if (existingHistory) {
        console.log(`⚠️ Month ${nextMonthNumber} already distributed for schedule ${schedule.id}`);
        return { success: true };
      }

      // 发放积分
      const expireDate = new Date();
      expireDate.setMonth(expireDate.getMonth() + 1);
      expireDate.setDate(expireDate.getDate() + 1);

      const transNo = getSnowId();

      await increaseCredits({
        user_uuid: schedule.user_uuid,
        trans_type: "monthly_distribution",
        credits: schedule.monthly_credits,
        order_no: schedule.order_no,
        expired_at: expireDate.toISOString(),
      });

      // 记录发放历史
      await supabase.from("credit_distribution_history").insert({
        schedule_id: schedule.id,
        order_no: schedule.order_no,
        user_uuid: schedule.user_uuid,
        month_number: nextMonthNumber,
        credits_distributed: schedule.monthly_credits,
        distribution_date: new Date().toISOString(),
        credit_trans_no: transNo,
      });

      // 更新发放计划
      const nextDistributionDate = new Date();
      nextDistributionDate.setMonth(nextDistributionDate.getMonth() + 1);

      const isCompleted = nextMonthNumber >= schedule.total_months;

      await supabase
        .from("credit_distribution_schedule")
        .update({
          distributed_months: nextMonthNumber,
          last_distribution_date: new Date().toISOString(),
          next_distribution_date: isCompleted ? null : nextDistributionDate.toISOString(),
          status: isCompleted ? "completed" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", schedule.id);

      console.log(`✅ Distributed ${schedule.monthly_credits} credits for month ${nextMonthNumber}`);

      return { success: true };
    } catch (error: any) {
      console.error(`❌ Failed to distribute credits:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 批量处理所有待发放的订阅
   */
  static async processAllPendingDistributions(): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    const schedules = await this.getPendingDistributions();

    let success = 0;
    let failed = 0;

    for (const schedule of schedules) {
      const result = await this.distributeCreditsForSchedule(schedule);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    }

    return { total: schedules.length, success, failed };
  }

  /**
   * 标记发放计划为已完成
   */
  private static async markScheduleCompleted(scheduleId: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase
      .from("credit_distribution_schedule")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId);
  }

  /**
   * 取消发放计划（用于订单退款）
   */
  static async cancelSchedule(orderNo: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase
      .from("credit_distribution_schedule")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("order_no", orderNo)
      .eq("status", "active");
  }
}
