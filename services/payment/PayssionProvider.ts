// Payssion 支付提供商实现

import * as crypto from "crypto";
import { getSupabaseClient } from "@/models/db";
import { BasePaymentProvider } from "./PaymentProvider";
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  WebhookResult,
  RefundRequest,
  RefundResult,
  PaymentError,
  PaymentStatusType,
} from "./types";

export class PayssionProvider extends BasePaymentProvider {
  name = "payssion";

  private baseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor() {
    super();
    this.baseUrl = process.env.PAYSSION_BASE_URL || "https://www.payssion.com";
    this.apiKey = process.env.PAYSSION_API_KEY || "";
    this.secretKey = process.env.PAYSSION_SECRET_KEY || "";

    if (!this.validateConfig()) {
      throw new PaymentError(
        "CONFIG_ERROR",
        "Payssion configuration is missing or invalid",
        this.name
      );
    }
  }

  validateConfig(): boolean {
    return !!(this.apiKey && this.secretKey && this.baseUrl);
  }

  /**
   * 生成API请求签名
   */
  private generateSignature(params: {
    api_key: string;
    pm_id: string;
    amount: string;
    currency: string;
    order_id: string;
  }): string {
    const { api_key, pm_id, amount, currency, order_id } = params;
    const message = `${api_key}|${pm_id}|${amount}|${currency}|${order_id}|${this.secretKey}`;
    return crypto.createHash("md5").update(message).digest("hex");
  }

  /**
   * 生成退款请求签名
   */
  private generateRefundSignature(params: {
    api_key: string;
    transaction_id: string;
    amount: string;
    currency: string;
  }): string {
    const { api_key, transaction_id, amount, currency } = params;
    const message = `${api_key}|${transaction_id}|${amount}|${currency}|${this.secretKey}`;
    return crypto.createHash("md5").update(message).digest("hex");
  }

  /**
   * 验证通知签名
   */
  private validateNotifySignature(data: any): boolean {
    const { pm_id, amount, currency, order_id, state, notify_sig } = data;

    // 根据 Payssion webhook 文档，通知签名格式为：
    // MD5(api_key|pm_id|amount|currency|order_id|state|secret_key)
    // 注意：使用我们配置的 api_key，而不是 webhook 数据中的
    const message = `${this.apiKey}|${pm_id}|${amount}|${currency}|${order_id}|${state}|${this.secretKey}`;
    const expectedSig = crypto.createHash("md5").update(message).digest("hex");

    console.log("Signature validation:", {
      message,
      expected: expectedSig,
      received: notify_sig,
      match: expectedSig === notify_sig,
    });

    return expectedSig === notify_sig;
  }

  /**
   * 映射支付方式到Payssion pm_id
   */
  private mapPaymentMethod(method: string): string {
    // 从环境变量读取pm_id映射，如果没有则使用默认值
    const mapping: Record<string, string> = {
      mir: process.env.PAYSSION_PM_ID_MIR || "card_ru",
      yoomoney: process.env.PAYSSION_PM_ID_YOOMONEY || "yoomoney_ru",
      sberpay: process.env.PAYSSION_PM_ID_SBERPAY || "sberpay_ru",
    };

    return mapping[method] || method;
  }

  /**
   * 映射Payssion状态到系统状态
   */
  private mapPayssionStateToOrderStatus(state: string): string {
    const mapping: Record<string, string> = {
      completed: "paid",
      failed: "failed",
      cancelled: "cancelled",
      expired: "expired",
      pending: "created",
      awaiting_confirm: "created",
      rejected: "failed",
      refunded: "refunded",
      refund_pending: "created",
      chargeback: "failed",
      disputed: "failed",
      blocked: "failed",
    };
    return mapping[state] || "created";
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(resultCode: number): string {
    const errorMessages: Record<number, string> = {
      200: "Success",
      400: "Invalid parameters",
      401: "Invalid merchant ID",
      402: "Invalid API signature",
      403: "Invalid app name",
      405: "Invalid payment method",
      406: "Invalid currency",
      407: "Invalid amount",
      408: "Invalid language",
      409: "Invalid URL",
      411: "Invalid secret key",
      412: "Invalid transaction ID",
      413: "Repeated order",
      414: "Invalid country",
      415: "Invalid payment type",
      417: "Amount is less than minimum",
      418: "Amount is more than maximum",
      420: "Invalid request method",
      441: "App is inactive",
      491: "Payment method is not enabled",
      500: "Server error",
      501: "Server busy",
      502: "Third party error",
      503: "Service not found",
    };

    return errorMessages[resultCode] || `Unknown error (${resultCode})`;
  }

  /**
   * 创建支付订单
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 验证输入参数
      this.validateAmount(request.amount);
      this.validateCurrency(request.currency);
      this.validateEmail(request.userEmail);
      this.validateOrderId(request.orderId);

      const pmId = this.mapPaymentMethod(request.paymentMethod);

      const params = {
        api_key: this.apiKey,
        pm_id: pmId,
        amount: request.amount.toFixed(2),
        currency: request.currency,
        order_id: request.orderId,
        description: request.description,
        return_url: request.returnUrl,
        payer_email: request.userEmail,
        payer_name: request.userName || "",
      };

      // 生成签名
      const signature = this.generateSignature(params);

      // 发送请求到Payssion
      const response = await fetch(`${this.baseUrl}/api/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          ...params,
          api_sig: signature,
        }),
      });

      const result = await response.json();

      if (result.result_code === 200) {
        // 保存交易记录到数据库
        await this.saveTransaction(request.orderId, result.transaction, pmId);

        return {
          success: true,
          transactionId: result.transaction.transaction_id,
          redirectUrl: result.redirect_url,
          paymentProvider: this.name,
        };
      } else {
        return {
          success: false,
          errorMessage: this.getErrorMessage(result.result_code),
          errorCode: result.result_code.toString(),
          paymentProvider: this.name,
        };
      }
    } catch (error: any) {
      console.error("Payssion createPayment error:", error);
      return {
        success: false,
        errorMessage: error.message || "Payment creation failed",
        paymentProvider: this.name,
      };
    }
  }

  /**
   * 查询支付状态
   */
  async queryPayment(transactionId: string): Promise<PaymentStatus> {
    try {
      const params = {
        api_key: this.apiKey,
        transaction_id: transactionId,
      };

      // 生成查询签名
      const message = `${this.apiKey}|${transactionId}||${this.secretKey}`;
      const signature = crypto.createHash("md5").update(message).digest("hex");

      const response = await fetch(`${this.baseUrl}/api/v1/payment/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          ...params,
          api_sig: signature,
        }),
      });

      const result = await response.json();

      if (result.result_code === 200) {
        const transaction = result.transaction;
        return {
          transactionId: transaction.transaction_id,
          status: transaction.state,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency,
          paidAmount: parseFloat(transaction.paid || "0"),
          paymentProvider: this.name,
        };
      } else {
        throw new PaymentError(
          "QUERY_FAILED",
          this.getErrorMessage(result.result_code),
          this.name
        );
      }
    } catch (error: any) {
      console.error("Payssion queryPayment error:", error);
      throw new PaymentError(
        "QUERY_ERROR",
        error.message || "Query payment failed",
        this.name,
        error
      );
    }
  }

  /**
   * 处理Webhook通知
   */
  async handleWebhook(data: any): Promise<WebhookResult> {
    try {
      console.log("Payssion webhook received:", data);

      // 验证签名
      if (!this.validateNotifySignature(data)) {
        throw new PaymentError(
          "INVALID_SIGNATURE",
          "Invalid webhook signature",
          this.name
        );
      }

      // 如果支付成功，处理业务逻辑（积分发放 + 会员创建 + 订单状态更新）
      if (data.state === "completed") {
        await this.handlePaymentSuccess(data);
      }

      // 更新 payssion_transactions 表
      await this.updatePayssionTransaction(data);

      return {
        success: true,
        orderId: data.order_id,
        status: data.state,
      };
    } catch (error: any) {
      console.error("Payssion webhook error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 处理支付成功后的业务逻辑（积分发放 + 会员创建 + 订单状态更新）
   */
  private async handlePaymentSuccess(data: any) {
    try {
      const { findOrderByOrderNo } = await import("@/models/order");
      const order = await findOrderByOrderNo(data.order_id);

      if (!order) {
        console.error("Order not found for Payssion payment:", data.order_id);
        return;
      }

      // 检查是否已经处理过（避免重复处理）
      if (order.status === "paid") {
        console.log("Order already processed, skipping business logic:", order.order_no);
        return;
      }

      console.log("Processing Payssion payment success for order:", order.order_no);

      // 创建类似 Stripe session 的对象来复用现有的业务逻辑
      const mockSession = {
        metadata: {
          order_no: order.order_no,
          user_uuid: order.user_uuid,
          credits: order.credits?.toString() || "0",
          product_id: order.product_id,
        },
        payment_status: "paid",
        customer_details: {
          email: order.user_email,
        },
        customer_email: order.user_email,
      };

      // 调用与 Stripe 相同的业务逻辑（处理积分发放 + 会员创建 + 订单状态更新）
      const { handleOrderSession } = await import("@/services/order");
      await handleOrderSession(mockSession as any);

      // 更新 Payssion 特定的订单信息
      await this.updatePayssionOrderInfo(order.order_no, data);

      console.log("Payssion payment success processed successfully for order:", order.order_no);
    } catch (error: any) {
      console.error("Failed to handle Payssion payment success:", error);
      throw new PaymentError(
        "BUSINESS_LOGIC_ERROR",
        "Failed to process payment success",
        this.name,
        error
      );
    }
  }

  /**
   * 更新 Payssion 特定的订单信息
   */
  private async updatePayssionOrderInfo(orderNo: string, webhookData: any) {
    try {
      const supabase = getSupabaseClient();
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          payment_provider: "payssion",
          payment_method: webhookData.pm_id,
          payssion_transaction_id: webhookData.transaction_id,
          payment_provider_fee: parseFloat(webhookData.fee || "0"),
          paid_detail: JSON.stringify(webhookData),
        })
        .eq("order_no", orderNo);

      if (orderError) {
        console.error("Failed to update Payssion order info:", orderError);
        throw orderError;
      }

      console.log(`Payssion order info updated for order: ${orderNo}`);
    } catch (error: any) {
      console.error("Failed to update Payssion order info:", error);
      throw error;
    }
  }

  /**
   * 更新 payssion_transactions 表
   */
  private async updatePayssionTransaction(data: any) {
    try {
      const supabase = getSupabaseClient();
      const { error: transactionError } = await supabase
        .from("payssion_transactions")
        .update({
          state: data.state,
          paid_amount: parseFloat(data.paid || "0"),
          fee: parseFloat(data.fee || "0"),
          updated_at: new Date().toISOString(),
          notify_data: data,
        })
        .eq("transaction_id", data.transaction_id);

      if (transactionError) {
        console.error("Failed to update Payssion transaction:", transactionError);
        throw transactionError;
      }

      console.log(`Payssion transaction updated: ${data.transaction_id}`);
    } catch (error: any) {
      console.error("Failed to update Payssion transaction:", error);
      throw error;
    }
  }

  /**
   * 退款
   */
  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    try {
      const params = {
        api_key: this.apiKey,
        transaction_id: request.transactionId,
        amount: (request.amount || 0).toFixed(2),
        currency: request.currency,
      };

      const signature = this.generateRefundSignature(params);

      const response = await fetch(`${this.baseUrl}/api/v1/refunds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          ...params,
          api_sig: signature,
        }),
      });

      const result = await response.json();

      if (result.result_code === 200) {
        return {
          success: true,
          refundId: result.refund.transaction_id,
        };
      } else {
        return {
          success: false,
          errorMessage: this.getErrorMessage(result.result_code),
        };
      }
    } catch (error: any) {
      console.error("Payssion refund error:", error);
      return {
        success: false,
        errorMessage: error.message || "Refund failed",
      };
    }
  }

  /**
   * 保存交易记录到数据库
   */
  private async saveTransaction(
    orderId: string,
    transaction: any,
    pmId: string
  ) {
    const supabase = getSupabaseClient();

    const transactionData = {
      order_no: orderId,
      transaction_id: transaction.transaction_id,
      pm_id: pmId,
      state: transaction.state,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      paid_amount: parseFloat(transaction.paid || "0"),
      fee: 0, // Will be updated when we receive the notification
    };

    const { error } = await supabase
      .from("payssion_transactions")
      .insert(transactionData);

    if (error) {
      console.error("Failed to save Payssion transaction:", error);
      throw new PaymentError(
        "DATABASE_ERROR",
        "Failed to save transaction record",
        this.name,
        error
      );
    }
  }

}
