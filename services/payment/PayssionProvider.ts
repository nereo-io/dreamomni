// Payssion V2 支付提供商实现

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
  findActivePayssionMandateByUserUuid,
} from "@/models/payssionMandate";
import { PaymentProcessingService } from "./PaymentProcessingService";
import { SubscriptionManagementService } from "./SubscriptionManagementService";

export class PayssionProvider extends BasePaymentProvider {
  name = "payssion";

  private config: PayssionConfig;

  private normalizeMandateStatus(
    status: unknown
  ): "pending" | "authorized" | "expired" | "canceled" | "created" {
    if (typeof status !== "string") return "pending";

    const normalized = status.toLowerCase();
    if (
      normalized === "pending" ||
      normalized === "authorized" ||
      normalized === "expired" ||
      normalized === "canceled" ||
      normalized === "created"
    ) {
      return normalized;
    }

    if (normalized === "cancelled") return "canceled";

    return "pending";
  }

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
   * 使用现有 mandate 直接创建 Bundle 支付（无需跳转）
   */
  private async createBundlePaymentWithMandate(
    request: MandateRequest,
    mandateId: string
  ): Promise<MandateResponse> {
    const metadata = request.metadata;

    if (!metadata?.amount) {
      return {
        success: false,
        errorMessage: "Missing required metadata for bundle payment",
      };
    }

    const requestBody = {
      payment_method: this.config.paymentMethods[request.paymentMethod] || request.paymentMethod,
      amount: parseFloat(metadata.amount) / 100, // 美分转美元
      currency: metadata.currency || "USD",
      terminal_type: "web",
      mandate_id: mandateId, // 关键：传入 mandate_id 实现直接扣款
      return_url: request.returnUrl,
      metadata: metadata,
    };

    console.log("📦 Creating bundle payment with mandate:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.config.v2.baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.v2.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log("Bundle payment with mandate result:", JSON.stringify(result, null, 2));

    if (result.error) {
      // 任何错误都 fallback 到创建新 mandate（与 subscription 逻辑一致）
      console.error(
        "❌ Failed to create bundle payment with existing mandate:",
        {
          mandateId: mandateId,
          error: result.error.message || result.error.code,
          willCreateNewMandate: true,
        }
      );
      return await this.createBundleMandateForPayment(request);
    }

    console.log(`✅ Bundle payment created with mandate: ${result.id}`);

    return {
      success: true,
      paymentId: result.id,
      mandateId: mandateId,
      redirectUrl: "", // 不需要跳转
      status: "payment_created",
    };
  }

  /**
   * 为 Bundle 创建新 mandate（授权成功后自动扣款）
   */
  private async createBundleMandateForPayment(request: MandateRequest): Promise<MandateResponse> {
    try {
      // 1. 创建 customer
      const customerId = await this.createCustomer(request.userEmail, request.userUuid);

      // 2. 创建 mandate（metadata 包含 interval="one-time" 标识为 Bundle）
      const requestBody = {
        payment_method: this.config.paymentMethods[request.paymentMethod] || request.paymentMethod,
        terminal_type: "web",
        return_url: request.returnUrl,
        metadata: request.metadata || {},
      };

      console.log("📦 Creating bundle mandate:", JSON.stringify(requestBody, null, 2));

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
      console.log("Bundle mandate creation result:", JSON.stringify(result, null, 2));

      if (result.error) {
        return {
          success: false,
          errorMessage: result.error.message || "Mandate creation failed",
        };
      }

      // 获取重定向URL
      const redirectUrl = result.action?.redirect_to_url?.url;
      const mandateStatus = this.normalizeMandateStatus(result.status);

      // 3. 保存 mandate 到数据库
      await insertPayssionMandate({
        user_uuid: request.userUuid,
        user_email: request.userEmail,
        mandate_id: result.id,
        status: mandateStatus,
        payment_method: request.paymentMethod,
        authorization_url: redirectUrl,
      });

      console.log(`📦 Bundle mandate created: ${result.id}, redirecting to authorization`);

      // 4. 返回授权 URL
      return {
        success: true,
        mandateId: result.id,
        redirectUrl: redirectUrl,
        status: mandateStatus,
      };
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message || "Bundle mandate creation failed",
      };
    }
  }

  /**
   * 创建授权 (V2 API)
   */
  async createMandate(request: MandateRequest): Promise<MandateResponse> {
    try {
      // 检查是否为 Bundle（一次性购买）
      const isBundle = request.metadata?.interval === "one-time";

      if (isBundle) {
        // Bundle: 检查是否有现有 mandate
        const existingMandate = await findActivePayssionMandateByUserUuid(
          request.userUuid,
          request.paymentMethod
        );

        if (existingMandate) {
          // 有有效 mandate，直接扣款
          console.log(`📦 Bundle purchase with existing mandate: ${existingMandate.mandate_id}`);
          return await this.createBundlePaymentWithMandate(request, existingMandate.mandate_id);
        }

        // 无有效 mandate，创建新 mandate（授权成功后自动扣款）
        console.log(`📦 Bundle purchase: creating new mandate for authorization`);
        return await this.createBundleMandateForPayment(request);
      }

      // 以下是订阅 mandate 逻辑

      // 首先检查是否已有有效的授权记录
      const existingMandateForSubscription = await findActivePayssionMandateByUserUuid(
        request.userUuid,
        request.paymentMethod
      );

      if (existingMandateForSubscription) {
        console.log(
          "Found existing active mandate:",
          existingMandateForSubscription.mandate_id,
          "Status:",
          existingMandateForSubscription.status,
          "Created:",
          existingMandateForSubscription.created_at
        );

        // 直接使用现有授权创建订阅
        const metadata = request.metadata;
        if (metadata) {
          const planType: "monthly" | "yearly" =
            metadata.interval === "year" ? "yearly" : "monthly";

          const subscriptionRequest: SubscriptionRequest = {
            userUuid: metadata.user_uuid,
            userEmail: metadata.user_email,
            mandateId: existingMandateForSubscription.mandate_id,
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
              mandateId: existingMandateForSubscription.mandate_id,
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
              mandateId: existingMandateForSubscription.mandate_id,
              subscriptionId: subscriptionResult.subscriptionId,
              redirectUrl: "", // 不需要跳转
              status: "subscription_created",
            };
          } else {
            console.error(
              "❌ Failed to create subscription with existing mandate:",
              {
                mandateId: existingMandateForSubscription.mandate_id,
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

      if (result.error) {
        return {
          success: false,
          errorMessage: result.error.message || "Mandate creation failed",
        };
      }

      // 获取重定向URL
      const redirectUrl = result.action?.redirect_to_url?.url;

      const mandateStatus = this.normalizeMandateStatus(result.status);

      await insertPayssionMandate({
        user_uuid: request.userUuid,
        user_email: request.userEmail,
        mandate_id: result.id,
        status: mandateStatus,
        payment_method: request.paymentMethod,
        authorization_url: redirectUrl,
      });

      return {
        success: true,
        mandateId: result.id,
        redirectUrl: redirectUrl,
        status: mandateStatus,
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
          await this.handleMandateSucceeded(webhookData);

          break;

        case "subscription.created":
          await this.handleSubscriptionCreated(webhookData);
          break;

        case "payment.succeeded":
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
   * 处理授权成功事件 - 更新状态并自动创建订阅或 Bundle 支付
   */
  private async handleMandateSucceeded(data: any) {
    // V2 API webhook数据结构: data.object.id 才是mandate ID
    const mandateId = data.object?.id;
    const paymentMethod = data.object?.payment_method;
    const metadata = data.object?.metadata;
    const interval = metadata?.interval;

    console.log("Mandate succeeded:", mandateId, paymentMethod, "interval:", interval);

    try {
      // 1. 更新授权状态和过期时间
      const timeExpired = data.object?.time_expired;
      await updatePayssionMandateStatus(mandateId, "authorized", timeExpired);
      console.log(
        `✅ Mandate ${mandateId}: pending → authorized${
          timeExpired ? ` (expires: ${timeExpired})` : ""
        }`
      );

      // 2. 根据 interval 判断是 Bundle 还是订阅
      if (interval === "one-time") {
        // Bundle：使用 mandate 直接扣款
        console.log(`📦 Bundle mandate authorized, creating payment...`);
        await this.createBundlePaymentAfterMandateAuthorized(mandateId, metadata, paymentMethod);
      } else {
        // 订阅：创建订阅
        const planType: "monthly" | "yearly" =
          interval === "year" ? "yearly" : "monthly";

        const subscriptionRequest: SubscriptionRequest = {
          userUuid: metadata.user_uuid,
          userEmail: metadata.user_email,
          mandateId: mandateId,
          amount: parseFloat(metadata.amount) / 100, // 美分转美元
          currency: metadata.currency,
          interval: interval,
          planType: planType,
          paymentMethod: paymentMethod,
          description: `Subscription for ${metadata.product_id}`,
          returnUrl: this.config.subscription.defaultReturnUrl,
          notifyUrl: this.config.subscription.webhookUrl,
          metadata: metadata, // 传递完整的 metadata
        };

        const subscriptionResult = await this.createSubscription(
          subscriptionRequest
        );

        if (!subscriptionResult.success) {
          console.error("❌ Subscription creation failed:", subscriptionResult.errorMessage);
        }
      }
    } catch (error: any) {
      console.error("Error handling mandate succeeded:", error);
    }
  }

  /**
   * Mandate 授权成功后自动为 Bundle 创建支付
   */
  private async createBundlePaymentAfterMandateAuthorized(
    mandateId: string,
    metadata: any,
    paymentMethod: string
  ): Promise<void> {
    const requestBody = {
      payment_method: this.config.paymentMethods[paymentMethod] || paymentMethod,
      amount: parseFloat(metadata.amount) / 100, // 美分转美元
      currency: metadata.currency || "USD",
      terminal_type: "web",
      mandate_id: mandateId,
      return_url: this.config.subscription.defaultReturnUrl,
      metadata: metadata,
    };

    const response = await fetch(`${this.config.v2.baseUrl}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.v2.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (result.error) {
      console.error(`❌ Bundle payment creation failed: ${result.error.message}`);
      throw new PaymentError(
        "BUNDLE_PAYMENT_FAILED",
        result.error.message || "Bundle payment creation failed",
        this.name
      );
    }

    console.log(`✅ Bundle payment created: ${result.id}`);
    // 支付创建后，Payssion 会发送 payment.succeeded webhook
  }

  /**
   * 处理订阅创建事件 - 创建或更新订阅状态
   */
  private async handleSubscriptionCreated(data: any) {
    const subscriptionId = data.object?.id;
    const mandateId = data.object?.mandate_id;
    const metadata = data.object?.metadata;

    console.log("Subscription created:", subscriptionId, "mandate:", mandateId);

    // 幂等性检查：检查订阅是否已存在（mandate.succeeded 阶段已创建）
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
      // 仍然尝试更新 order 的 sub_id
      if (metadata?.order_no) {
        const { updateOrderSubId } = await import("@/models/order");
        try {
          await updateOrderSubId(metadata.order_no, subscriptionId);
        } catch (error) {
          console.error("Failed to update order sub_id:", error);
        }
      }
      return;
    }

    // metadata 可能为空（Payssion subscription.created 事件不一定携带完整 metadata）
    if (!metadata || !metadata.user_uuid) {
      console.log(
        "⚠️ No metadata in subscription.created event, skipping DB creation (handled by mandate.succeeded):",
        subscriptionId
      );
      return;
    }

    // 创建订阅记录 - 初始状态为 pending，等待首次支付成功后激活
    try {
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
    } catch (error) {
      // 可能是唯一约束冲突（mandate.succeeded 已创建），忽略
      console.log("⚠️ createSubscription failed (likely already exists):", subscriptionId, error);
      return;
    }

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

      // 取消用户其他订阅的自动续费（新订阅首次激活时）
      try {
        const cancelResult = await SubscriptionManagementService.cancelOtherSubscriptions(
          subscription.user_uuid,
          subscriptionId,
          "payssion"
        );
        console.log(`✅ 其他订阅取消结果: canceled=${cancelResult.canceledCount}, failed=${cancelResult.failedCount}`);
      } catch (cancelError: any) {
        console.error("⚠️ 取消其他订阅失败（不影响新订阅）:", cancelError.message);
      }
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

        // 获取原订单的 client_id（用于 Yandex Metrica 追踪）
        let clientId: string | undefined;
        let originalFirstTouch = null;
        let originalLastTouch = null;
        if (metadata.order_no) {
          const originalOrder = await findOrderByOrderNo(metadata.order_no);
          clientId = originalOrder?.client_id || undefined; // 将 null 转换为 undefined
          originalFirstTouch = originalOrder?.first_touch || null;
          originalLastTouch = originalOrder?.last_touch || null;

          if (!clientId) {
            console.error("⚠️ 原订单缺少 client_id，续费订单将无法追踪转化", {
              originalOrderNo: metadata.order_no,
              renewalOrderNo,
            });
          }
        }

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
          client_id: clientId, // 从原订单复制 client_id
          first_touch: originalFirstTouch,
          last_touch: originalLastTouch,
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
      paymentProvider: "payssion",
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

      // 使用 finalOrderNo（续费时为 RNW_xxx，首次购买为原订单号）
      const orderToTrack = await findOrderByOrderNo(finalOrderNo);
      const yclid =
        orderToTrack?.last_touch?.yclid || orderToTrack?.first_touch?.yclid;

      if (orderToTrack?.client_id || yclid) {
        const success = await offlineConversionService.trackPaymentSuccess(
          {
            clientId: orderToTrack?.client_id,
            yclid,
          },
          finalOrderNo, // 使用实际的订单号
          amount
        );

        if (success) {
          console.log(`✅ Offline conversion tracked for Yandex Metrica`, {
            clientId: orderToTrack.client_id,
            orderNo: finalOrderNo,
            amount,
            isRenewal,
          });
        }
      } else {
        console.error("⚠️ 订单缺少 client_id/yclid，无法追踪转化", {
          orderNo: finalOrderNo,
          isRenewal,
        });
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

    // 调试日志：检查 metadata 内容
    console.log("🔍 handlePaymentFailed debug:", {
      paymentId: paymentObject?.id,
      subscriptionId,
      orderNo,
      metadataKeys: Object.keys(metadata),
      hasOrderNo: !!orderNo,
      failureCode,
    });

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
        console.log(`📝 Recording payment failure for order: ${orderNo}`);

        const { recordOrderPaymentFailure } = await import("@/models/order");
        await recordOrderPaymentFailure(orderNo, {
          code: failureCode,
          message: displayMessage,
          rawMessage: rawFailureMessage,
          provider: this.name,
          failureAt: paymentObject?.time_created,
          eventId: data.id,
        });

        console.log(`✅ Payment failure recorded successfully for order: ${orderNo}`);
      } catch (error) {
        console.error("Failed to record payment failure on order", {
          orderNo,
          error,
        });
      }
    } else {
      console.error("❌ No orderNo found in metadata", {
        subscriptionId,
        metadataKeys: Object.keys(metadata),
      });
    }
  }
}
