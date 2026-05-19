// 支付路由器 - 智能选择支付提供商

import { PayssionProvider } from "./PayssionProvider";
import { StripeProvider } from "./StripeProvider";
import { CreemProvider } from "./CreemProvider";
import { shouldUsePayssion } from "./PaymentProvider";
import {
  PaymentProvider,
  PaymentMethodConfig,
  LocationInfo,
  PaymentError,
  SubscriptionRequest,
  SubscriptionResponse,
  MandateRequest,
  MandateResponse,
  RefundRequest,
  RefundResult,
} from "./types";

export class PaymentRouter {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    // 优先初始化 Creem 提供商
    try {
      this.providers.set("creem", new CreemProvider());
    } catch (error) {
      console.warn("Creem provider initialization failed:", error);
    }

    try {
      this.providers.set("stripe", new StripeProvider());
    } catch (error) {
      console.warn("Stripe provider initialization failed:", error);
    }

    try {
      this.providers.set("payssion", new PayssionProvider());
    } catch (error) {
      console.warn("Payssion provider initialization failed:", error);
    }
  }

  /**
   * 获取可用的支付方式列表
   */
  getAvailablePaymentMethods(location?: LocationInfo): PaymentMethodConfig[] {
    const countryCode = location?.countryCode || "US";
    const isRussianRegion = shouldUsePayssion(countryCode);

    // 优先级：俄罗斯地区用Payssion，其他地区优先用Creem，回退到Stripe
    if (isRussianRegion && this.providers.has("payssion")) {
      return this.getPayssionMethods();
    }
    
    // 非俄罗斯地区优先使用 Stripe
    if (this.providers.has("stripe")) {
      return this.getStripeMethods();
    }

    // 回退到 Creem
    if (this.providers.has("creem")) {
      return this.getCreemMethods();
    }
    
    return [];
  }

  /**
   * 获取Payssion支付方式（只支持3种主要俄罗斯支付方式）
   */
  private getPayssionMethods(): PaymentMethodConfig[] {
    return [
      {
        id: "sberpay",
        name: "SberPay",
        logo: "/payment-logos/sberpay_ru.png",
        provider: "payssion",
      },
      {
        id: "yoomoney",
        name: "YooMoney",
        logo: "/payment-logos/yoomoney_ru.png",
        provider: "payssion",
      },
      {
        id: "mir",
        name: "Mir Card",
        logo: "/payment-logos/card_ru.png",
        provider: "payssion",
      },
    ];
  }

  /**
   * 获取Stripe支付方式
   */
  private getStripeMethods(): PaymentMethodConfig[] {
    return [
      {
        id: "stripe",
        name: "Credit Card",
        logo: "/payment-logos/stripe.png",
        provider: "stripe",
      },
    ];
  }

  /**
   * 获取Creem支付方式
   */
  private getCreemMethods(): PaymentMethodConfig[] {
    return [
      {
        id: "creem",
        name: "Credit Card",
        logo: "/payment-logos/creem.svg",
        provider: "creem",
      },
    ];
  }

  /**
   * 根据支付方式选择提供商
   */
  getProviderForPaymentMethod(paymentMethod: string): PaymentProvider {
    // 查找支付方式配置
    const allMethods = [
      ...this.getPayssionMethods(),
      ...this.getStripeMethods(),
      ...this.getCreemMethods(),
    ];
    const methodConfig = allMethods.find((m) => m.id === paymentMethod);

    if (!methodConfig) {
      throw new PaymentError(
        "UNSUPPORTED_METHOD",
        `Payment method ${paymentMethod} is not supported`,
        "router"
      );
    }

    const provider = this.providers.get(methodConfig.provider);
    if (!provider) {
      throw new PaymentError(
        "PROVIDER_UNAVAILABLE",
        `Payment provider ${methodConfig.provider} is not available`,
        "router"
      );
    }

    return provider;
  }


  /**
   * 处理订阅 Webhook
   */
  async handleSubscriptionWebhook(providerName: string, data: any) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new PaymentError(
        "PROVIDER_NOT_FOUND",
        `Payment provider ${providerName} not found`,
        "router"
      );
    }

    if (!provider.handleSubscriptionWebhook) {
      throw new PaymentError(
        "WEBHOOK_NOT_SUPPORTED",
        `Provider ${providerName} does not support subscription webhooks`,
        providerName
      );
    }

    return await provider.handleSubscriptionWebhook(data);
  }

  /**
   * 获取所有可用的提供商
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys()).filter((name) => {
      const provider = this.providers.get(name);
      return provider?.validateConfig();
    });
  }

  /**
   * 根据名称获取特定的支付提供商
   */
  getProvider(providerName: string): PaymentProvider | undefined {
    return this.providers.get(providerName);
  }

  /**
   * 创建授权（用于订阅）
   */
  async createMandate(request: MandateRequest): Promise<MandateResponse> {
    try {
      const provider = this.getProviderForPaymentMethod(request.paymentMethod);

      if (!provider.createMandate) {
        throw new PaymentError(
          "MANDATE_NOT_SUPPORTED",
          `Provider ${provider.name} does not support mandate creation`,
          provider.name
        );
      }

      console.log(
        `Creating mandate with provider: ${provider.name}, method: ${request.paymentMethod}`
      );

      return await provider.createMandate(request);
    } catch (error: any) {
      console.error("PaymentRouter createMandate error:", error);
      throw error;
    }
  }

  /**
   * 创建订阅
   */
  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    try {
      const provider = this.getProviderForPaymentMethod(request.paymentMethod);

      if (!provider.createSubscription) {
        throw new PaymentError(
          "SUBSCRIPTION_NOT_SUPPORTED",
          `Provider ${provider.name} does not support subscription creation`,
          provider.name
        );
      }

      console.log(
        `Creating subscription with provider: ${provider.name}, method: ${request.paymentMethod}`
      );

      return await provider.createSubscription(request);
    } catch (error: any) {
      console.error("PaymentRouter createSubscription error:", error);
      throw error;
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(providerName: string, subscriptionId: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new PaymentError(
        "PROVIDER_NOT_FOUND",
        `Payment provider ${providerName} not found`,
        "router"
      );
    }

    if (!provider.cancelSubscription) {
      throw new PaymentError(
        "CANCEL_NOT_SUPPORTED",
        `Provider ${providerName} does not support subscription cancellation`,
        providerName
      );
    }

    return await provider.cancelSubscription(subscriptionId);
  }

  /**
   * 查询订阅状态
   */
  async querySubscription(providerName: string, subscriptionId: string) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new PaymentError(
        "PROVIDER_NOT_FOUND",
        `Payment provider ${providerName} not found`,
        "router"
      );
    }

    if (!provider.querySubscription) {
      throw new PaymentError(
        "QUERY_NOT_SUPPORTED",
        `Provider ${providerName} does not support subscription query`,
        providerName
      );
    }

    return await provider.querySubscription(subscriptionId);
  }

  /**
   * 发起退款
   */
  async refundPayment(
    providerName: string,
    request: RefundRequest
  ): Promise<RefundResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new PaymentError(
        "PROVIDER_NOT_FOUND",
        `Payment provider ${providerName} not found`,
        "router"
      );
    }

    if (!provider.refundPayment) {
      throw new PaymentError(
        "REFUND_NOT_SUPPORTED",
        `Provider ${providerName} does not support refunds`,
        providerName
      );
    }

    return await provider.refundPayment(request);
  }

}
