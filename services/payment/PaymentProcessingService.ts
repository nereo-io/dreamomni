// 支付处理业务逻辑服务
import { PaymentError } from "./types";
import { getBundleBonusCreditsForTier } from "@/config/products";
import { getUserHighestSubscriptionTier } from "@/services/subscriptionTier";

export interface PaymentProcessingResult {
  success: boolean;
  creditsAwarded?: number;
  membershipUpdated?: boolean;
  error?: string;
}

export interface PaymentData {
  paymentId: string; // Unique payment ID from provider (e.g. pm_xxx for Payssion)
  orderId?: string; // Order number (may be reused for subscription renewals)
  userUuid: string;
  amount: string;
  subscriptionId?: string;
  userEmail?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  metadata?: {
    // Payment metadata from provider
    credits?: number;
    product_id?: string;
    product_name?: string;
    interval?: string;
    [key: string]: any;
  };
}

export class PaymentProcessingService {
  /**
   * 处理支付成功
   */
  static async processPayment(
    data: PaymentData
  ): Promise<PaymentProcessingResult> {
    console.log(
      `🔄 Processing payment: ${data.paymentId} for order: ${
        data.orderId || data.paymentId
      } (${data.userEmail})`
    );

    try {
      // 1. 幂等性检查 - 使用 orderId + paymentId 组合
      const orderId = data.orderId || data.paymentId;
      const isProcessed = await this.checkPaymentAlreadyProcessed(
        orderId,
        data.paymentId
      );
      if (isProcessed) {
        console.log(
          `⚠️ Payment ${data.paymentId} for order ${orderId} already processed, skipping`
        );
        return { success: true };
      }

      // 2. 查找订单
      const { findOrderByOrderNo } = await import("@/models/order");
      const order = await findOrderByOrderNo(orderId);

      if (!order) {
        throw new PaymentError(
          "ORDER_NOT_FOUND",
          `订单不存在: ${orderId}`,
          "PaymentProcessingService"
        );
      }

      // 3. 处理支付核心逻辑
      const creditsAwarded = await this.processPaymentCore(data, order);

      console.log(
        `✅ Payment processed: ${data.paymentId} → ${creditsAwarded} credits awarded`
      );

      await this.trackAffiliateSale(data, order);

      return {
        success: true,
        creditsAwarded,
        membershipUpdated: true,
      };
    } catch (error: any) {
      console.error(
        `❌ Payment processing failed for ${data.paymentId}:`,
        error.message
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理支付的核心业务逻辑
   * 包括：增加积分、更新会员（仅订阅）、更新订单状态
   */
  private static async processPaymentCore(
    data: PaymentData,
    order: any
  ): Promise<number> {
    const orderId = data.orderId || data.paymentId;
    let creditsAwarded = 0;

    // 从 metadata 或 order 中获取数据
    const credits = data.metadata?.credits || order.credits || 0;
    const interval = data.metadata?.interval || order.interval;
    const isBundle = interval === "one-time";
    const membershipType: "monthly" | "yearly" =
      interval === "year" ? "yearly" : "monthly";

    // 判断是否为年订阅且需要按月发放
    const isYearlySubscription = interval === "year" && !isBundle;
    const shouldDistributeMonthly = isYearlySubscription &&
      order.is_monthly_distribution === true;

    // 1. 增加积分
    if (credits > 0) {
      const { increaseCredits } = await import("@/services/credit");

      let creditsToAward: number;
      let expiredAt: string;

      if (shouldDistributeMonthly) {
        // 按月发放：首次只发放 1/12
        creditsToAward = Math.floor(credits / 12);

        // 首月积分有效期：1个月 + 1天缓冲
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 1);
        expireDate.setDate(expireDate.getDate() + 1);
        expiredAt = expireDate.toISOString();

        console.log(`📅 年订阅按月发放 - 首月: ${creditsToAward} credits (总计 ${credits})`);

        // 创建发放计划
        await this.createDistributionSchedule({
          orderNo: orderId,
          userUuid: data.userUuid,
          subscriptionId: data.subscriptionId,
          paymentProvider: data.paymentMethod, // 传入支付提供商
          totalCredits: credits,
          monthlyCredits: creditsToAward,
        });

      } else if (isBundle) {
        // Bundle: 使用 valid_months（默认1个月）
        creditsToAward = credits;
        const validMonths = data.metadata?.valid_months || 1;
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + validMonths);
        expiredAt = expireDate.toISOString();

        const bundleProductId = data.metadata?.product_id || order.product_id;
        const tier = await getUserHighestSubscriptionTier(data.userUuid);
        const bonusCredits = getBundleBonusCreditsForTier(bundleProductId, tier);
        creditsToAward += bonusCredits;

        if (bonusCredits > 0) {
          const { updateOrderCredits } = await import("@/models/order");
          await updateOrderCredits(orderId, creditsToAward);
          order.credits = creditsToAward;
        }

        console.log(
          `🎁 Bundle bonus applied: +${bonusCredits} (tier=${tier}, product=${bundleProductId})`
        );
        console.log(`📅 Bundle 积分有效期: ${expiredAt} (${validMonths} 个月)`);

      } else if (membershipType === "yearly") {
        // 旧年订阅：一次性发放全部积分
        creditsToAward = credits;
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 12);
        expireDate.setDate(expireDate.getDate() + 1);
        expiredAt = expireDate.toISOString();
        console.log(`📅 年度订阅积分有效期（旧逻辑）: ${expiredAt}`);

      } else {
        // 月度订阅：1个月 + 1天缓冲
        creditsToAward = credits;
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 1);
        expireDate.setDate(expireDate.getDate() + 1);
        expiredAt = expireDate.toISOString();
        console.log(`📅 月度订阅积分有效期: ${expiredAt}`);
      }

      await increaseCredits({
        user_uuid: data.userUuid,
        trans_type: "order_pay",
        credits: creditsToAward,
        order_no: orderId,
        payment_id: data.paymentId,
        expired_at: expiredAt,
      });

      console.log(`💰 Credits added: ${creditsToAward} for user ${data.userUuid}, expires at ${expiredAt}`);
      creditsAwarded = creditsToAward;
    }

    // 2. 更新会员状态 - 仅订阅，Bundle 不更新会员
    if (!isBundle) {
      const { createOrUpdateMembership } = await import("@/services/membership");
      await createOrUpdateMembership(data.userUuid, membershipType);

      console.log(
        `👤 Membership updated: ${membershipType} for user ${data.userUuid}`
      );
    } else {
      console.log(`📦 Bundle purchase - skipping membership update for user ${data.userUuid}`);
    }

    // 3. 更新订单状态
    const { updateOrderStatus } = await import("@/models/order");
    await updateOrderStatus(
      orderId,
      "paid",
      new Date().toISOString(),
      data.userEmail || order.user_email || "",
      JSON.stringify(data)
    );

    console.log(`📝 Order status updated to paid: ${orderId}`);
    return creditsAwarded;
  }

  private static async trackAffiliateSale(data: PaymentData, order: any) {
    const paymentProvider =
      data.paymentProvider || order.payment_provider || data.paymentMethod;

    if (!paymentProvider) {
      return;
    }

    try {
      const { trackFirstPromoterSale } = await import(
        "@/services/analytics/first-promoter"
      );
      const orderId = data.orderId || data.paymentId;
      const amount = Number(order.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        console.error("⚠️ FirstPromoter sale tracking skipped: invalid amount", {
          orderId,
          amount: order.amount,
        });
        return;
      }

      await trackFirstPromoterSale({
        orderNo: orderId,
        paymentProvider,
        paymentId: data.paymentId,
        userUuid: order.user_uuid || data.userUuid,
        email: order.user_email || data.userEmail || "",
        amount,
        currency: order.currency || "usd",
      });
    } catch (error: any) {
      console.error(
        "⚠️ FirstPromoter sale tracking failed:",
        error.message || error
      );
    }
  }

  /**
   * 检查支付是否已处理过（幂等性检查）
   * 使用 orderId + paymentId 组合检查，支持订阅续费场景
   */
  static async checkPaymentAlreadyProcessed(
    orderId: string,
    paymentId: string
  ): Promise<boolean> {
    try {
      const { findCreditByOrderNoAndPaymentId } = await import(
        "@/models/credit"
      );
      const credit = await findCreditByOrderNoAndPaymentId(orderId, paymentId);

      const isProcessed = !!credit;

      if (isProcessed) {
        console.log("✅ 支付已处理过，跳过重复处理", {
          orderId,
          paymentId,
          creditRecord: credit,
        });
      } else {
        console.log("🆕 新支付事件", {
          orderId,
          paymentId,
        });
      }

      return isProcessed;
    } catch (error: any) {
      console.error("幂等性检查异常", {
        orderId,
        paymentId,
        error: error.message,
      });
      return false; // 异常时认为未处理，允许重试
    }
  }

  /**
   * 创建积分发放计划
   */
  private static async createDistributionSchedule(params: {
    orderNo: string;
    userUuid: string;
    subscriptionId?: string;
    paymentProvider?: string; // 新增：支付提供商
    totalCredits: number;
    monthlyCredits: number;
  }): Promise<void> {
    const { getSupabaseClient } = await import("@/models/db");
    const { getSnowId } = await import("@/lib/hash");
    const supabase = getSupabaseClient();

    // 幂等性检查：检查是否已存在该订单的发放计划
    const { data: existingSchedule } = await supabase
      .from("credit_distribution_schedule")
      .select("id")
      .eq("order_no", params.orderNo)
      .single();

    if (existingSchedule) {
      console.log(`ℹ️ Distribution schedule already exists for order ${params.orderNo}, skipping creation`);
      return;
    }

    // 计算下次发放日期（1个月后）
    const nextDistributionDate = new Date();
    nextDistributionDate.setMonth(nextDistributionDate.getMonth() + 1);

    // 创建发放计划
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("credit_distribution_schedule")
      .insert({
        order_no: params.orderNo,
        user_uuid: params.userUuid,
        subscription_id: params.subscriptionId,
        payment_provider: params.paymentProvider, // 新增字段
        total_credits: params.totalCredits,
        monthly_credits: params.monthlyCredits,
        total_months: 12,
        distributed_months: 1, // 首月已发放
        next_distribution_date: nextDistributionDate.toISOString(),
        last_distribution_date: new Date().toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (scheduleError) {
      console.error("❌ Failed to create distribution schedule:", scheduleError);
      throw new Error(`Failed to create distribution schedule: ${scheduleError.message}`);
    }

    console.log(`✅ Created distribution schedule for order ${params.orderNo}`);

    // 记录首月发放历史
    const transNo = getSnowId();
    const { error: historyError } = await supabase
      .from("credit_distribution_history")
      .insert({
        schedule_id: scheduleData.id,
        order_no: params.orderNo,
        user_uuid: params.userUuid,
        month_number: 1, // 第1个月
        credits_distributed: params.monthlyCredits,
        distribution_date: new Date().toISOString(),
        credit_trans_no: transNo,
      });

    if (historyError) {
      console.error("⚠️ Failed to create first month distribution history:", historyError);
      // 不抛出错误，因为积分已经发放，只是历史记录失败
    } else {
      console.log(`✅ Recorded first month distribution history for order ${params.orderNo}`);
    }
  }
}
