import {
  PaymentProvider,
  MandateRequest,
  MandateResponse,
  SubscriptionRequest,
  SubscriptionResponse,
  SubscriptionStatus,
  SubscriptionWebhookResult,
  PaymentError,
} from "./types";
import { getProviderProductId } from "@/config/products";
import { parseCreemWebhookSecrets } from "@/lib/creem-webhook";

interface CreemConfig {
  apiKey: string;
  apiSecret?: string;
  webhookSecret: string;
  baseUrl: string;
}

interface CreemCheckoutRequest {
  product_id: string;
  request_id?: string;
  success_url?: string;
  customer?: {
    email?: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

interface CreemCheckoutResponse {
  id: string;
  url?: string;
  checkout_url?: string;
  product_id: string;
  status: string;
  created_at: string;
}

/**
 * Creem 支付提供商
 * 仅支持订阅支付，用于替代 Stripe 的订阅功能
 */
export class CreemProvider implements PaymentProvider {
  readonly name = "creem";
  private config: CreemConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): CreemConfig {
    const apiKey = process.env.CREEM_API_KEY;
    const apiSecret = process.env.CREEM_API_SECRET;
    const webhookSecrets = parseCreemWebhookSecrets(
      process.env.CREEM_WEBHOOK_SECRET
    );

    if (!apiKey || webhookSecrets.length === 0) {
      throw new PaymentError(
        "CONFIG_ERROR",
        "Creem configuration is incomplete. Please check CREEM_API_KEY and CREEM_WEBHOOK_SECRET environment variables.",
        "creem"
      );
    }

    return {
      apiKey,
      apiSecret,
      webhookSecret: webhookSecrets[0],
      baseUrl: process.env.CREEM_BASE_URL || "https://api.creem.io",
    };
  }

  /**
   * 验证配置是否正确
   */
  validateConfig(): boolean {
    try {
      const config = this.loadConfig();
      return !!(config.apiKey && config.webhookSecret);
    } catch (error) {
      console.warn("Creem configuration validation failed:", error);
      return false;
    }
  }

  /**
   * 创建授权（Mandate）
   * 在 Creem 中，这步实际上是创建 checkout session
   */
  async createMandate(request: MandateRequest): Promise<MandateResponse> {
    try {
      console.log("🚀 Creating Creem mandate (checkout session):", {
        userUuid: request.userUuid,
        paymentMethod: request.paymentMethod,
        reference: request.reference,
      });

      // 从 metadata 中获取产品信息
      const productId = request.metadata?.product_id;
      if (!productId) {
        throw new PaymentError(
          "MISSING_PRODUCT_ID",
          "Product ID is required for Creem checkout",
          "creem"
        );
      }

      // 获取 Creem 产品ID
      const creemProductId = getProviderProductId(productId, "creem");
      if (!creemProductId) {
        throw new PaymentError(
          "PRODUCT_NOT_FOUND",
          `No Creem product ID found for product: ${productId}`,
          "creem"
        );
      }

      // 构建 Creem checkout 请求
      const checkoutRequest: CreemCheckoutRequest = {
        product_id: creemProductId,
        request_id: request.reference,
        success_url: request.returnUrl,
        customer: {
          email: request.userEmail,
        },
        metadata: {
          user_uuid: request.userUuid,
          user_email: request.userEmail,
          product_id: productId, // 保持一致的命名，使用我们的内部产品ID
          ...request.metadata,
        },
      };

      // 调用 Creem API 创建 checkout session
      const checkoutResponse = await this.createCheckoutSession(
        checkoutRequest
      );

      const redirectUrl = checkoutResponse.url || checkoutResponse.checkout_url;

      console.log("✅ Creem checkout session created:", {
        sessionId: checkoutResponse.id,
        checkoutUrl: redirectUrl,
      });

      if (!redirectUrl) {
        throw new PaymentError(
          "INVALID_RESPONSE",
          "Creem API response missing redirect URL",
          "creem"
        );
      }

      return {
        success: true,
        mandateId: checkoutResponse.id,
        redirectUrl: redirectUrl,
        status: checkoutResponse.status,
      };
    } catch (error: any) {
      console.error("❌ Creem mandate creation failed:", error);

      if (error instanceof PaymentError) {
        throw error;
      }

      throw new PaymentError(
        "MANDATE_CREATION_FAILED",
        error.message || "Failed to create Creem mandate",
        "creem",
        error
      );
    }
  }

  /**
   * 创建订阅
   * 在 Creem 中，订阅是在 checkout session 完成后自动创建的
   * 直接调用 createMandate 方法，避免重复逻辑
   */
  async createSubscription(
    request: SubscriptionRequest
  ): Promise<SubscriptionResponse> {
    // 直接调用 createMandate，传递所有必要的 metadata
    const mandateResponse = await this.createMandate({
      userUuid: request.userUuid,
      userEmail: request.userEmail,
      paymentMethod: request.paymentMethod,
      returnUrl: request.returnUrl,
      reference: request.reference,
      metadata: {
        amount: request.amount,
        currency: request.currency,
        interval: request.interval,
        planType: request.planType,
        description: request.description,
        ...request.metadata,
      },
    });

    if (!mandateResponse.success) {
      throw new PaymentError(
        "SUBSCRIPTION_CREATION_FAILED",
        mandateResponse.errorMessage || "Failed to create subscription",
        "creem"
      );
    }

    return {
      success: true,
      subscriptionId: mandateResponse.subscriptionId,
      mandateId: mandateResponse.mandateId,
      redirectUrl: mandateResponse.redirectUrl,
      requiresAction: true, // 用户需要访问 redirectUrl 完成支付
      paymentProvider: "creem",
    };
  }

  /**
   * 查询订阅状态
   */
  async querySubscription(subscriptionId: string): Promise<SubscriptionStatus> {
    try {
      console.log("🔍 Querying Creem subscription:", { subscriptionId });

      // 调用 Creem API 查询订阅状态
      const response = await this.apiRequest(
        `/v1/subscriptions/${subscriptionId}`,
        {
          method: "GET",
        }
      );

      return {
        subscriptionId: response.id,
        status: response.status,
        amount: response.amount,
        currency: response.currency,
        planType: response.plan_type,
        timesCompleted: response.times_completed || 0,
        totalTimes: response.total_times || 0,
        nextBillingDate: response.next_billing_date,
        currentPeriodStart: response.current_period_start,
        currentPeriodEnd: response.current_period_end,
        paymentProvider: "creem",
      };
    } catch (error: any) {
      console.error("❌ Creem subscription query failed:", error);
      throw new PaymentError(
        "SUBSCRIPTION_QUERY_FAILED",
        error.message || "Failed to query Creem subscription",
        "creem",
        error
      );
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      console.log("🚫 Canceling Creem subscription:", { subscriptionId });

      await this.apiRequest(`/v1/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
      });

      console.log("✅ Creem subscription canceled successfully");
      return true;
    } catch (error: any) {
      console.error("❌ Creem subscription cancellation failed:", error);

      // 如果是 404 错误，可能订阅已经不存在或已取消
      if (error.message?.includes("404")) {
        console.log(
          "⚠️ Subscription not found on Creem (404) - might already be canceled"
        );
        return false; // 返回 false 表示取消操作没有成功，但不抛出错误
      }

      throw new PaymentError(
        "SUBSCRIPTION_CANCEL_FAILED",
        error.message || "Failed to cancel Creem subscription",
        "creem",
        error
      );
    }
  }

  /**
   * 处理订阅 Webhook
   */
  async handleSubscriptionWebhook(
    data: any
  ): Promise<SubscriptionWebhookResult> {
    try {
      console.log("🔔 Processing Creem subscription webhook:", {
        eventType: data.event_type,
        subscriptionId: data.subscription_id,
      });

      // 处理不同的 webhook 事件
      switch (data.event_type) {
        case "subscription.created":
          return {
            success: true,
            subscriptionId: data.subscription_id,
            mandateId: data.mandate_id,
            eventType: "subscription.created",
            status: "active",
          };

        case "subscription.updated":
          return {
            success: true,
            subscriptionId: data.subscription_id,
            eventType: "subscription.updated",
            status: data.status,
          };

        case "subscription.cancelled":
          return {
            success: true,
            subscriptionId: data.subscription_id,
            eventType: "subscription.cancelled",
            status: "cancelled",
          };

        case "payment.succeeded":
          return {
            success: true,
            subscriptionId: data.subscription_id,
            eventType: "payment.succeeded",
            status: "active",
          };

        case "payment.failed":
          return {
            success: true,
            subscriptionId: data.subscription_id,
            eventType: "payment.failed",
            status: "past_due",
          };

        default:
          console.warn(
            "⚠️  Unknown Creem webhook event type:",
            data.event_type
          );
          return {
            success: true,
            eventType: data.event_type,
          };
      }
    } catch (error: any) {
      console.error("❌ Creem webhook processing failed:", error);
      return {
        success: false,
        error: error.message || "Failed to process Creem webhook",
      };
    }
  }

  /**
   * 创建 Creem checkout session
   */
  private async createCheckoutSession(
    request: CreemCheckoutRequest
  ): Promise<CreemCheckoutResponse> {
    try {
      console.log("🔧 Creating Creem checkout session with request:", {
        url: `${this.config.baseUrl}/v1/checkouts`,
        productId: request.product_id,
        requestId: request.request_id,
        hasMetadata: !!request.metadata,
      });

      const response = await this.apiRequest("/v1/checkouts", {
        method: "POST",
        body: JSON.stringify(request),
      });

      console.log("✅ Creem checkout session created successfully:", {
        id: response.id,
        url: response.url || response.checkout_url,
      });

      return response as CreemCheckoutResponse;
    } catch (error: any) {
      console.error("❌ Creem checkout creation failed:", {
        error: error.message,
        url: `${this.config.baseUrl}/v1/checkouts`,
        requestBody: request,
      });

      throw new PaymentError(
        "CHECKOUT_CREATION_FAILED",
        error.message || "Failed to create Creem checkout session",
        "creem",
        error
      );
    }
  }

  /**
   * 调用 Creem API
   */
  private async apiRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  }
}
