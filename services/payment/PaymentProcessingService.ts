// 支付处理业务逻辑服务
import { PaymentError } from "./types";

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
      await this.processPaymentCore(data, order);

      // 从 data 中获取积分数量用于返回
      const credits = data.metadata?.credits || order.credits || 0;

      console.log(
        `✅ Payment processed: ${data.paymentId} → ${credits} credits awarded`
      );
      return {
        success: true,
        creditsAwarded: credits,
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
   * 包括：增加积分、更新会员、更新订单状态
   */
  private static async processPaymentCore(
    data: PaymentData,
    order: any
  ): Promise<void> {
    const orderId = data.orderId || data.paymentId;

    // 从 metadata 或 order 中获取数据
    const credits = data.metadata?.credits || order.credits || 0;
    const interval = data.metadata?.interval || order.interval;
    const membershipType: "monthly" | "yearly" =
      interval === "year" ? "yearly" : "monthly";

    // 1. 增加积分
    if (credits > 0) {
      const { increaseCredits } = await import("@/services/credit");
      
      // 根据订阅类型计算新的有效期
      let expiredAt: string;
      if (membershipType === "yearly") {
        // 年度订阅：12个月 + 1天缓冲
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 12);
        expireDate.setDate(expireDate.getDate() + 1);
        expiredAt = expireDate.toISOString();
        console.log(`📅 年度订阅积分有效期: ${expiredAt}`);
      } else {
        // 月度订阅：1个月 + 1天缓冲
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 1);
        expireDate.setDate(expireDate.getDate() + 1);
        expiredAt = expireDate.toISOString();
        console.log(`📅 月度订阅积分有效期: ${expiredAt}`);
      }
      
      await increaseCredits({
        user_uuid: data.userUuid,
        trans_type: "order_pay",
        credits: credits,
        order_no: orderId,
        payment_id: data.paymentId,
        expired_at: expiredAt,
      });

      console.log(`💰 Credits added: ${credits} for user ${data.userUuid}, expires at ${expiredAt}`);
    }

    // 2. 更新会员状态
    const { createOrUpdateMembership } = await import("@/services/membership");
    await createOrUpdateMembership(data.userUuid, membershipType);

    console.log(
      `👤 Membership updated: ${membershipType} for user ${data.userUuid}`
    );

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
}
