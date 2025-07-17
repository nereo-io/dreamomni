// 支付处理业务逻辑服务
import { PaymentError } from "./types";

export interface PaymentProcessingResult {
  success: boolean;
  creditsAwarded?: number;
  membershipUpdated?: boolean;
  error?: string;
}

export interface PaymentData {
  paymentId: string;
  userUuid: string;
  amount: string;
  subscriptionId?: string;
  userEmail?: string;
  paymentMethod?: string;
}

export class PaymentProcessingService {
  /**
   * 处理支付成功 - 复用 order.ts 逻辑
   */
  static async processPayment(data: PaymentData): Promise<PaymentProcessingResult> {
    console.log(`🔄 Processing payment: ${data.paymentId} (${data.userEmail})`);
    
    try {
      // 1. 幂等性检查
      const isProcessed = await this.checkPaymentAlreadyProcessed(data.paymentId, data.userUuid);
      if (isProcessed) {
        console.log(`⚠️ Payment ${data.paymentId} already processed, skipping`);
        return { success: true };
      }

      // 2. 查找订单并转换数据格式
      const { order, orderSessionData, config } = await this.convertPaymentToOrderFormat(data);
      
      // 3. 调用现有的 order.ts 处理逻辑
      const { handleOrderSession } = await import("@/services/order");
      await handleOrderSession(orderSessionData);
      
      console.log(`✅ Payment processed: ${data.paymentId} → ${config?.credits || 0} credits awarded`);
      return { 
        success: true, 
        creditsAwarded: config?.credits,
        membershipUpdated: !!config?.membershipType 
      };
    } catch (error: any) {
      console.error(`❌ Payment processing failed for ${data.paymentId}:`, error.message);
      return { success: false, error: error.message };
    }
  }



  /**
   * 检查支付是否已处理过（幂等性检查）
   */
  static async checkPaymentAlreadyProcessed(
    paymentId: string,
    userUuid: string
  ): Promise<boolean> {
    try {
      const { findCreditByOrderNo } = await import("@/models/credit");
      const credit = await findCreditByOrderNo(paymentId);
      
      const isProcessed = !!credit;
      
      if (isProcessed) {
        console.log("✅ 支付已处理过，跳过重复处理", {
          paymentId,
          userUuid,
          creditRecord: credit,
        });
      }

      return isProcessed;
    } catch (error: any) {
      console.error("幂等性检查异常", {
        paymentId,
        userUuid,
        error: error.message,
      });
      return false; // 异常时认为未处理，允许重试
    }
  }


  /**
   * 将支付数据转换为 order.ts 需要的格式
   */
  private static async convertPaymentToOrderFormat(data: PaymentData) {
    // 查找订单获取产品信息
    const { findOrderByOrderNo } = await import("@/models/order");
    const order = await findOrderByOrderNo(data.paymentId);
    
    if (!order) {
      throw new PaymentError(
        "ORDER_NOT_FOUND",
        `订单不存在: ${data.paymentId}`,
        "PaymentProcessingService"
      );
    }

    // 获取产品配置
    const { getProductConfigByProductId } = await import("@/config/payssion");
    const config = order.product_id ? getProductConfigByProductId(order.product_id) : undefined;

    // 构造符合 handleOrderSession 期望的数据格式
    const orderSessionData = {
      payment_status: 'paid' as const,
      metadata: {
        order_no: data.paymentId,
        user_uuid: data.userUuid,
        credits: order.credits?.toString() || "0", // 从订单中获取积分数量
        product_id: order.product_id, // 从订单中获取产品ID
      },
      customer_details: {
        email: data.userEmail || order.user_email || "",
      },
      customer_email: data.userEmail || order.user_email || "",
    } as any; // 临时使用 any，因为我们只是模拟 Stripe.Checkout.Session 格式

    return { order, orderSessionData, config };
  }
}
