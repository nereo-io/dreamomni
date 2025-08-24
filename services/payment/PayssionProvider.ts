// Payssion V2 支付提供商实现

import * as crypto from "crypto";
import { BasePaymentProvider } from "./PaymentProvider";
import {
  MandateRequest,
  MandateResponse,
  SubscriptionRequest,
  SubscriptionResponse,
  SubscriptionWebhookResult,
  PaymentError,
} from "./types";
import { getPayssionConfig, PayssionConfig } from "@/config/payssion";
import {
  insertPayssionMandate,
  updatePayssionMandateStatus,
} from "@/models/payssionMandate";
import { PaymentProcessingService } from "./PaymentProcessingService";

export class PayssionProvider extends BasePaymentProvider {
  name = "payssion";

  private config: PayssionConfig;

  constructor() {
    super();
    this.config = getPayssionConfig();

    if (!this.validateConfig()) {
      throw new PaymentError(
        "CONFIG_ERROR",
        "Payssion V2 configuration is missing or invalid",
        this.name
      );
    }
  }

  validateConfig(): boolean {
    return !!(
      this.config.v2.apiKey &&
      this.config.v2.secretKey &&
      this.config.v2.baseUrl
    );
  }

  /**
   * 创建客户 (V2 API)
   */
  private async createCustomer(
    userEmail: string,
    userUuid: string
  ): Promise<string> {
    const requestBody = {
      reference: userUuid.replace(/-/g, "").substring(0, 32), // 移除横线并截断到32字符
      email: userEmail,
    };

    const response = await fetch(`${this.config.v2.baseUrl}/v2/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.v2.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log("Customer creation result:", result);

    if (result.error) {
      throw new PaymentError(
        "CUSTOMER_CREATION_FAILED",
        result.error.message || "Failed to create customer",
        this.name
      );
    }

    return result.id;
  }

  /**
   * 创建授权 (V2 API)
   */
  async createMandate(request: MandateRequest): Promise<MandateResponse> {
    try {
      // 首先检查是否已有有效的授权记录
      const { findActivePayssionMandateByUserUuid } = await import(
        "@/models/payssionMandate"
      );
      const existingMandate = await findActivePayssionMandateByUserUuid(
        request.userUuid,
        request.paymentMethod
      );

      if (existingMandate) {
        console.log(
          "Found existing active mandate:",
          existingMandate.mandate_id
        );

        // 直接使用现有授权创建订阅
        const metadata = request.metadata;
        if (metadata) {
          const planType: "monthly" | "yearly" =
            metadata.interval === "year" ? "yearly" : "monthly";

          const subscriptionRequest: SubscriptionRequest = {
            userUuid: metadata.user_uuid,
            userEmail: metadata.user_email,
            mandateId: existingMandate.mandate_id,
            amount: parseFloat(metadata.amount) / 100, // 美分转美元
            currency: metadata.currency,
            interval: metadata.interval,
            planType: planType,
            paymentMethod: request.paymentMethod,
            description: `Subscription for ${
              metadata.product_name || metadata.product_id
            }`,
            returnUrl: this.config.subscription.defaultReturnUrl,
            notifyUrl: this.config.subscription.webhookUrl,
            metadata: metadata,
          };

          const subscriptionResult = await this.createSubscription(
            subscriptionRequest
          );

          if (subscriptionResult.success) {
            return {
              success: true,
              mandateId: existingMandate.mandate_id,
              subscriptionId: subscriptionResult.subscriptionId,
              redirectUrl: "", // 不需要跳转
              status: "subscription_created",
            };
          } else {
            console.error(
              "Failed to create subscription with existing mandate:",
              subscriptionResult.errorMessage
            );
            // 如果订阅创建失败，fallback 到创建新授权
          }
        }
      }

      // 首先创建 customer
      const customerId = await this.createCustomer(
        request.userEmail,
        request.userUuid
      );

      const requestBody = {
        payment_method:
          this.config.paymentMethods[request.paymentMethod] ||
          request.paymentMethod,
        terminal_type: "web",
        return_url: request.returnUrl,
        metadata: request.metadata || {},
      };

      const response = await fetch(
        `${this.config.v2.baseUrl}/v2/customers/${customerId}/mandates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.v2.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();
      console.log("Mandate creation result:", JSON.stringify(result, null, 2));

      // 获取重定向URL
      const redirectUrl = result.action?.redirect_to_url?.url;

      await insertPayssionMandate({
        user_uuid: request.userUuid,
        user_email: request.userEmail,
        mandate_id: result.id,
        status: result.status || "pending",
        payment_method: request.paymentMethod,
        authorization_url: redirectUrl,
      });

      return {
        success: true,
        mandateId: result.id,
        redirectUrl: redirectUrl,
        status: result.status || "pending",
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || "Mandate creation failed",
      };
    }
  }

  /**
   * 创建订阅 (V2 API)
   */
  async createSubscription(
    request: SubscriptionRequest
  ): Promise<SubscriptionResponse> {
    try {
      if (!request.mandateId) {
        throw new PaymentError(
          "MISSING_MANDATE",
          "Mandate ID is required for subscription creation",
          this.name
        );
      }

      const requestBody = {
        mandate_id: request.mandateId,
        email: request.userEmail,
        currency: request.currency,
        amount: request.amount, // 美分转美元
        description:
          request.description || `Subscription for ${request.userEmail}`,
        interval_unit: request.interval,
        times: 24, // 测试环境Payssion V2 要求必须为 1
        metadata: request.metadata || {},
      };

      const response = await fetch(
        `${this.config.v2.baseUrl}/v2/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.v2.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      console.log(
        `✅ Subscription created: ${result.id} for mandate ${request.mandateId}`
      );
      return {
        success: true,
        subscriptionId: result.id,
        mandateId: request.mandateId,
        paymentProvider: this.name,
      };
    } catch (error: any) {
      console.error("V2 subscription creation error:", error);

      return {
        success: false,
        errorMessage: error.message || "Subscription creation failed",
        paymentProvider: this.name,
      };
    }
  }

  /**
   * 处理订阅 Webhook (V2 API)
   * 处理事件：mandate.succeeded、subscription.created、payment.succeeded、subscription.canceled
   */
  async handleSubscriptionWebhook(
    data: any
  ): Promise<SubscriptionWebhookResult> {
    try {
      // 处理不同的事件类型
      const eventType = data.type;
      const webhookData = data.data;

      console.log("V2 subscription webhook received:", eventType);

      switch (eventType) {
        case "mandate.succeeded":
          console.log("V2 subscription webhook received:", data);
          await this.handleMandateSucceeded(webhookData);

          break;

        case "subscription.created":
          console.log("V2 subscription webhook received:", data);
          await this.handleSubscriptionCreated(webhookData);
          break;

        case "payment.succeeded":
          console.log("V2 subscription webhook received:", data);
          await this.handlePaymentSucceeded(webhookData);
          break;

        case "payment.failed":
          console.log("V2 subscription webhook received:", data);
          console.error(
            `❌ Payment failed: ${webhookData.object?.source_id} - ${
              webhookData.object?.failure_code || "Unknown reason"
            }`
          );
          break;

        case "subscription.canceled":
          console.log("V2 subscription webhook received:", data);
          console.log(
            `⚠️ Subscription canceled: ${webhookData.subscription_id}`
          );
          break;

        case "mandate.canceled":
          console.log("V2 subscription webhook received:", data);
          const canceledMandateId = webhookData.object?.id;
          console.log(`⚠️ Mandate canceled: ${canceledMandateId}`);
          // 可以选择更新数据库状态为 'canceled'
          await updatePayssionMandateStatus(canceledMandateId, "canceled");
          break;

        default:
          console.warn("Ignored webhook event:", eventType);
      }

      return {
        success: true,
        subscriptionId: data.subscription_id || data.object?.id,
        mandateId: data.object?.id,
        eventType,
      };
    } catch (error: any) {
      console.error("V2 subscription webhook error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 处理授权成功事件 - 更新状态并自动创建订阅
   */
  private async handleMandateSucceeded(data: any) {
    // V2 API webhook数据结构: data.object.id 才是mandate ID
    const mandateId = data.object?.id;
    const paymentMethod = data.object?.payment_method;
    const metadata = data.object?.metadata;
    console.log("Mandate succeeded:", mandateId, paymentMethod);

    try {
      // 1. 更新授权状态和过期时间
      const timeExpired = data.object?.time_expired;
      await updatePayssionMandateStatus(mandateId, "authorized", timeExpired);
      console.log(
        `✅ Mandate ${mandateId}: pending → authorized${
          timeExpired ? ` (expires: ${timeExpired})` : ""
        }`
      );

      // 2. 根据 metadata 中的 interval 确定计划类型
      const planType: "monthly" | "yearly" =
        metadata.interval === "year" ? "yearly" : "monthly";

      const subscriptionRequest: SubscriptionRequest = {
        userUuid: metadata.user_uuid,
        userEmail: metadata.user_email,
        mandateId: mandateId,
        amount: parseFloat(metadata.amount) / 100, // 美分转美元
        currency: metadata.currency,
        interval: metadata.interval,
        planType: planType,
        paymentMethod: paymentMethod,
        description: `Subscription for ${
          metadata.product_name || metadata.product_id
        }`,
        returnUrl: this.config.subscription.defaultReturnUrl,
        notifyUrl: this.config.subscription.webhookUrl,
        metadata: metadata, // 传递完整的 metadata
      };

      const subscriptionResult = await this.createSubscription(
        subscriptionRequest
      );

      console.log(
        "Subscription creation result:",
        JSON.stringify(subscriptionResult, null, 2)
      );
    } catch (error: any) {
      console.error("Error handling mandate succeeded:", error);
    }
  }

  /**
   * 处理订阅创建事件 - 创建或更新订阅状态
   */
  private async handleSubscriptionCreated(data: any) {
    const subscriptionId = data.object?.id;
    const mandateId = data.object?.mandate_id;
    const metadata = data.object?.metadata;

    console.log("Subscription created:", subscriptionId, "mandate:", mandateId);

    // 创建订阅记录 - 初始状态为 pending，等待首次支付成功后激活
    const { createSubscription } = await import("@/models/subscription");
    await createSubscription({
      user_uuid: metadata.user_uuid,
      mandate_id: mandateId,
      payssion_subscription_id: subscriptionId,
      plan_type: metadata.interval === "year" ? "yearly" : "monthly",
      amount: parseFloat(metadata.amount),
      currency: metadata.currency,
      status: "pending",
      product_name: metadata.product_name,
      product_id: metadata.product_id,
    });

    // 更新订单的订阅ID
    if (metadata.order_no) {
      const { updateOrderSubId } = await import("@/models/order");
      try {
        await updateOrderSubId(metadata.order_no, subscriptionId);
      } catch (error) {
        console.error("Failed to update order sub_id:", error);
      }
    }
  }

  /**
   * 处理支付成功事件 - 激活订阅并发放积分
   */
  private async handlePaymentSucceeded(data: any) {
    const paymentId = data.object?.id;  // 实际的支付ID (如 pm_HOm50K4GybH0eXP0uPzn9W9S)
    const subscriptionId = data.object?.source_id;
    const amount = parseFloat(data.object?.amount);
    const metadata = data.object?.metadata;

    console.log(`💰 Payment succeeded: order ${metadata?.order_no}, payment ${paymentId} ($${amount})`);

    // 使用 order_no + payment_id 进行幂等性检查
    const alreadyProcessed =
      await PaymentProcessingService.checkPaymentAlreadyProcessed(
        metadata.order_no,  // order_no
        paymentId          // payment_id (每次支付都不同)
      );

    if (alreadyProcessed) {
      console.log("⚠️ Payment already processed:", paymentId);
      return;
    }

    // 1. 激活订阅（如果是首次支付成功）
    const { updateSubscriptionStatus, findSubscriptionByPayssionId } =
      await import("@/models/subscription");
    const subscription = await findSubscriptionByPayssionId(subscriptionId);

    if (subscription && subscription.status === "pending") {
      await updateSubscriptionStatus(subscriptionId, "active");
      console.log(`✅ Subscription ${subscriptionId} activated`);
    }

    // 2. 处理支付并发放积分
    const processingResult = await PaymentProcessingService.processPayment({
      paymentId,  // 实际的支付ID，不是 order_no
      orderId: metadata.order_no,  // 订单号
      userUuid: metadata.user_uuid,
      amount: amount.toString(),
      subscriptionId,
      userEmail: metadata.user_email,
      paymentMethod: metadata.payment_method,
    });

    if (!processingResult.success) {
      console.error(`❌ Payment processing failed: ${processingResult.error}`);
      throw new PaymentError(
        "BUSINESS_LOGIC_ERROR",
        `Failed to process payment: ${processingResult.error}`,
        this.name
      );
    }

    console.log(`✅ Payment completed: ${processingResult.creditsAwarded} credits awarded`);
    
    // 3. Track offline conversion for Yandex Metrica
    try {
      const { offlineConversionService } = await import("@/services/analytics/yandex-offline-conversion");
      const { findOrderByOrderNo } = await import("@/models/order");
      
      const order = await findOrderByOrderNo(metadata.order_no);
      if (order?.client_id) {
        const success = await offlineConversionService.trackPaymentSuccess(
          order.client_id,
          metadata.order_no,
          amount
        );
        
        if (success) {
          console.log(`✅ Offline conversion tracked for Yandex Metrica`, {
            clientId: order.client_id,
            orderNo: metadata.order_no,
            amount
          });
        }
      }
    } catch (conversionError: any) {
      console.error("⚠️ Failed to track offline conversion:", conversionError.message);
      // Don't fail the payment processing if conversion tracking fails
    }
  }

  /**
   * 查询订阅详情 (V2 API)
   */
  async querySubscription(subscriptionId: string) {
    try {
      const response = await fetch(
        `${this.config.v2.baseUrl}/v2/subscriptions/${subscriptionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.v2.apiKey}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.id) {
        return result;
      } else {
        console.error("Failed to query subscription:", result);
        return null;
      }
    } catch (error: any) {
      console.error("Subscription query error:", error);
      return null;
    }
  }

  /**
   * 取消订阅 (V2 API)
   * 注意：Payssion 测试环境不支持取消订阅功能
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.v2.baseUrl}/v2/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.v2.apiKey}`,
          },
        }
      );

      const result = await response.json();
      console.log("Subscription cancellation result:", result);

      // 根据文档，成功时应该返回订阅对象
      if (response.ok && result.id) {
        // 更新本地订阅状态
        const { updateSubscriptionStatus } = await import(
          "@/models/subscription"
        );
        await updateSubscriptionStatus(subscriptionId, "canceled");
        console.log(`✅ Subscription ${subscriptionId} canceled successfully`);
        return true;
      } else {
        // 检查是否是测试环境下的预期错误
        // if (result.error?.code === 'resource_status_invalid') {
        //   console.log("⚠️ Payssion test environment doesn't support subscription cancellation");
        //   console.log("Simulating cancellation for development purposes");

        //   // 在测试环境下，仅更新本地状态
        //   const { updateSubscriptionStatus } = await import("@/models/subscription");
        //   await updateSubscriptionStatus(subscriptionId, "canceled");

        //   return true; // 测试环境下返回成功
        // }

        console.error("Failed to cancel subscription:", result);
        return false;
      }
    } catch (error: any) {
      console.error("Subscription cancellation error:", error);
      return false;
    }
  }
}
