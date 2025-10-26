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
          existingMandate.mandate_id,
          "Status:",
          existingMandate.status,
          "Created:",
          existingMandate.created_at
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

          console.log(
            "Attempting to create subscription with existing mandate:",
            {
              mandateId: existingMandate.mandate_id,
              amount: subscriptionRequest.amount,
              currency: subscriptionRequest.currency,
              interval: subscriptionRequest.interval,
            }
          );

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
              "❌ Failed to create subscription with existing mandate:",
              {
                mandateId: existingMandate.mandate_id,
                error: subscriptionResult.errorMessage,
                willCreateNewMandate: true,
              }
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
        times: 5, // 测试环境Payssion V2 要求必须为 1；正式环境为 5
        metadata: request.metadata || {},
      };

      console.log(
        "Payssion V2 subscription request body:",
        JSON.stringify(requestBody, null, 2)
      );

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

      // 添加详细的响应日志
      console.log("Payssion V2 subscription API response:", {
        status: response.status,
        ok: response.ok,
        result: JSON.stringify(result, null, 2),
      });

      // 检查响应状态和结果
      if (!response.ok || !result.id) {
        const errorMessage =
          result.error?.message ||
          result.message ||
          `Subscription creation failed with status ${response.status}`;
        console.error("❌ Subscription creation failed:", errorMessage);

        return {
          success: false,
          errorMessage: errorMessage,
          paymentProvider: this.name,
        };
      }

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
          await this.handlePaymentFailed(webhookData);
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

    // 幂等性检查：检查订阅是否已存在
    const { findSubscriptionByPayssionId, createSubscription } = await import(
      "@/models/subscription"
    );
    const existingSubscription = await findSubscriptionByPayssionId(
      subscriptionId
    );

    if (existingSubscription) {
      console.log(
        "✅ Subscription already exists, skipping creation:",
        subscriptionId
      );
      return; // 订阅已存在，直接返回成功（幂等处理）
    }

    // 创建订阅记录 - 初始状态为 pending，等待首次支付成功后激活
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
    const paymentId = data.object?.id; // 实际的支付ID (如 pm_HOm50K4GybH0eXP0uPzn9W9S)
    const subscriptionId = data.object?.source_id;
    const amount = parseFloat(data.object?.amount);
    const metadata = data.object?.metadata;

    console.log(
      `💰 Payment succeeded: order ${metadata?.order_no}, payment ${paymentId} ($${amount})`
    );

    // 使用 order_no + payment_id 进行幂等性检查
    const alreadyProcessed =
      await PaymentProcessingService.checkPaymentAlreadyProcessed(
        metadata.order_no, // order_no
        paymentId // payment_id (每次支付都不同)
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

    // 检测是否为续费支付
    const isRenewal = subscription && subscription.status === "active";
    let finalOrderNo = metadata.order_no;

    if (isRenewal) {
      // 创建续费订单
      const renewalOrderNo = `RNW_${paymentId}`;

      console.log("🔄 检测到续费支付，创建续费订单", {
        originalOrderNo: metadata.order_no,
        renewalOrderNo,
        subscriptionId,
      });

      // 检查续费订单是否已创建（幂等性）
      const { findOrderByOrderNo } = await import("@/models/order");
      const renewalOrder = await findOrderByOrderNo(renewalOrderNo);

      if (!renewalOrder) {
        const { insertOrder } = await import("@/models/order");
        const { getProductConfig } = await import("@/config/products");

        if (!subscription.product_id) {
          console.error("❌ 续费订单缺少 product_id", { subscription });
          throw new Error("Renewal order missing product_id");
        }

        const productConfig = getProductConfig(subscription.product_id);

        // 计算到期时间
        const currentDate = new Date();
        const expiredDate = new Date(currentDate);
        const validMonths = subscription.plan_type === "yearly" ? 12 : 1;
        expiredDate.setMonth(currentDate.getMonth() + validMonths);
        expiredDate.setTime(expiredDate.getTime() + 24 * 60 * 60 * 1000); // 延迟24小时

        await insertOrder({
          order_no: renewalOrderNo,
          user_uuid: subscription.user_uuid,
          user_email: metadata.user_email || "",
          amount: subscription.amount,
          currency: subscription.currency,
          product_id: subscription.product_id,
          product_name: subscription.product_name,
          interval: subscription.plan_type === "yearly" ? "year" : "month",
          expired_at: expiredDate.toISOString(),
          status: "paid",
          is_renewal: true,
          payment_id: paymentId,
          payment_provider: "payssion",
          credits: productConfig?.credits || 0,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        console.log(`✅ 续费订单创建成功`, {
          renewalOrderNo,
          credits: productConfig?.credits || 0,
        });
      } else {
        console.log(`ℹ️ 续费订单已存在，跳过创建`, { renewalOrderNo });
      }

      finalOrderNo = renewalOrderNo;
    } else {
      // 首次购买：更新原订单的 payment_id
      const { updateOrderPaymentId } = await import("@/models/order");
      await updateOrderPaymentId(metadata.order_no, paymentId);

      console.log("✅ 首次购买订单 payment_id 已更新", {
        orderNo: metadata.order_no,
        paymentId: paymentId,
      });
    }

    // 2. 处理支付并发放积分
    const processingResult = await PaymentProcessingService.processPayment({
      paymentId, // 实际的支付ID，不是 order_no
      orderId: finalOrderNo, // 使用 finalOrderNo（续费时为 RNW_ 开头）
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

    console.log(
      `✅ Payment completed: ${processingResult.creditsAwarded} credits awarded`
    );

    // 3. Track offline conversion for Yandex Metrica
    try {
      const { offlineConversionService } = await import(
        "@/services/analytics/yandex-offline-conversion"
      );
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
            amount,
          });
        }
      }
    } catch (conversionError: any) {
      console.error(
        "⚠️ Failed to track offline conversion:",
        conversionError.message
      );
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

      if (response.status === 204) {
        console.error("Failed to query subscription: empty 204 response", {
          subscriptionId,
        });
        return null;
      }

      const rawBody = await response.text();

      if (!rawBody) {
        console.error("Failed to query subscription: empty body", {
          subscriptionId,
          status: response.status,
        });
        return null;
      }

      let result: any;
      try {
        result = JSON.parse(rawBody);
      } catch (parseError) {
        console.error("Failed to parse subscription response", {
          subscriptionId,
          status: response.status,
          rawBody,
          parseError,
        });
        return null;
      }

      if (response.ok && result.id) {
        return result;
      }

      console.error("Failed to query subscription:", {
        subscriptionId,
        status: response.status,
        result,
      });
      return null;
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

  /**
   * 处理支付失败事件 - 记录失败原因并更新订阅状态
   */
  private async handlePaymentFailed(data: any) {
    const paymentObject = data.object;
    const subscriptionId = paymentObject?.source_id;
    const metadata = paymentObject?.metadata || {};
    const orderNo = metadata?.order_no;
    const failureCode = paymentObject?.failure_code || "unknown_error";

    // Payssion 的 failure_message 形如 "insufficient_funds|payment_network"
    const rawFailureMessage = paymentObject?.failure_message || "";
    const [primaryMessage = failureCode] = rawFailureMessage.split("|");

    const failureMessageMap: Record<string, string> = {
      insufficient_funds:
        "Недостаточно средств на счёте. Пополните баланс и попробуйте снова.",
      card_declined:
        "Карта отклонена банком. Обратитесь в банк или используйте другую карту.",
      payment_network:
        "Ошибка платёжной сети. Попробуйте через несколько минут.",
      expired_card: "Срок действия карты истёк. Используйте другую карту.",
      incorrect_cvc: "Неверный CVC-код карты. Проверьте и введите заново.",
      amount_too_small: "Сумма платежа слишком мала. Минимальная сумма: 100 ₽.",
      cancelled_by_user: "Платёж отменён. Вы можете повторить попытку.",
      authentication_failed: "Ошибка аутентификации. Проверьте данные карты.",
      processing_error:
        "Ошибка обработки платежа. Попробуйте другой способ оплаты.",
      unknown_error:
        "Платёж не прошёл. Попробуйте снова или обратитесь в поддержку.",
    };

    const displayMessage = failureMessageMap[failureCode] || primaryMessage;

    if (subscriptionId) {
      try {
        const { updateSubscriptionStatus } = await import(
          "@/models/subscription"
        );
        await updateSubscriptionStatus(subscriptionId, "past_due");
      } catch (error) {
        console.error(
          "Failed to update subscription status after payment failure",
          {
            subscriptionId,
            error,
          }
        );
      }
    }

    if (orderNo) {
      try {
        const { recordOrderPaymentFailure } = await import("@/models/order");
        await recordOrderPaymentFailure(orderNo, {
          code: failureCode,
          message: displayMessage,
          rawMessage: rawFailureMessage,
          provider: this.name,
          failureAt: paymentObject?.time_created,
          eventId: data.id,
        });
      } catch (error) {
        console.error("Failed to record payment failure on order", {
          orderNo,
          error,
        });
      }
    }
  }
}
