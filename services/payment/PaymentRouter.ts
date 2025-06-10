// 支付路由器 - 智能选择支付提供商

import { PayssionProvider } from "./PayssionProvider";
import { StripeProvider } from "./StripeProvider";
import { shouldUsePayssion } from "./PaymentProvider";
import {
  PaymentProvider,
  PaymentRequest,
  PaymentResponse,
  PaymentMethodConfig,
  LocationInfo,
  PaymentError,
} from "./types";

export class PaymentRouter {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
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
  getAvailablePaymentMethods(
    location?: LocationInfo,
    userPreference?: string
  ): PaymentMethodConfig[] {
    const methods: PaymentMethodConfig[] = [];

    const countryCode = location?.countryCode || "US";
    const isRussianRegion = shouldUsePayssion(countryCode);

    // 如果用户手动选择了支付提供商，优先返回该提供商的支付方式
    if (userPreference) {
      if (userPreference === "payssion" && this.providers.has("payssion")) {
        return this.getPayssionMethods();
      }
      if (userPreference === "stripe" && this.providers.has("stripe")) {
        return this.getStripeMethods();
      }
    }

    // 根据地理位置智能推荐
    if (isRussianRegion && this.providers.has("payssion")) {
      // 俄罗斯地区优先显示Payssion支付方式
      methods.push(...this.getPayssionMethods());

      // 添加Stripe作为备选
      if (this.providers.has("stripe")) {
        methods.push(...this.getStripeMethods());
      }
    } else {
      // 其他地区优先显示Stripe
      if (this.providers.has("stripe")) {
        methods.push(...this.getStripeMethods());
      }

      // 如果Payssion可用，也添加进去
      if (this.providers.has("payssion")) {
        methods.push(...this.getPayssionMethods());
      }
    }

    return methods;
  }

  /**
   * 获取Payssion支付方式（只支持3种主要俄罗斯支付方式）
   */
  private getPayssionMethods(): PaymentMethodConfig[] {
    return [
      {
        id: "sberpay",
        name: "SberPay",
        description: "俄罗斯储蓄银行支付",
        logo: "/payment-logos/sberpay_ru.png",
        provider: "payssion",
        supportedCountries: ["RU"],
        feeInfo: "无额外手续费",
        processingTime: "即时到账",
      },
      {
        id: "yoomoney",
        name: "YooMoney",
        description: "俄罗斯领先的电子钱包",
        logo: "/payment-logos/yoomoney_ru.png",
        provider: "payssion",
        supportedCountries: ["RU", "BY", "KZ"],
        feeInfo: "可能产生少量手续费",
        processingTime: "即时到账",
      },
      {
        id: "mir",
        name: "Mir Card",
        description: "俄罗斯银联卡",
        logo: "/payment-logos/card_ru.png",
        provider: "payssion",
        supportedCountries: ["RU"],
        feeInfo: "无额外手续费",
        processingTime: "即时到账",
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
        description: "国际信用卡和借记卡",
        logo: "/payment-logos/stripe.png",
        provider: "stripe",
        supportedCountries: ["*"], // 全球支持
        feeInfo: "2.9% + $0.30",
        processingTime: "即时到账",
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
   * 智能选择支付提供商
   */
  getProvider(
    location?: LocationInfo,
    paymentMethod?: string,
    userPreference?: string
  ): PaymentProvider {
    // 如果指定了支付方式，根据支付方式选择提供商
    if (paymentMethod) {
      return this.getProviderForPaymentMethod(paymentMethod);
    }

    // 如果用户手动选择了提供商
    if (userPreference && this.providers.has(userPreference)) {
      return this.providers.get(userPreference)!;
    }

    // 根据地理位置自动选择
    const countryCode = location?.countryCode || "US";
    const isRussianRegion = shouldUsePayssion(countryCode);

    if (isRussianRegion && this.providers.has("payssion")) {
      return this.providers.get("payssion")!;
    }

    // 默认使用Stripe
    if (this.providers.has("stripe")) {
      return this.providers.get("stripe")!;
    }

    throw new PaymentError(
      "NO_PROVIDER",
      "No payment provider is available",
      "router"
    );
  }

  /**
   * 创建支付订单
   */
  async createPayment(
    request: PaymentRequest,
    location?: LocationInfo,
    userPreference?: string
  ): Promise<PaymentResponse> {
    try {
      const provider = this.getProvider(
        location,
        request.paymentMethod,
        userPreference
      );

      console.log(
        `Creating payment with provider: ${provider.name}, method: ${request.paymentMethod}`
      );

      return await provider.createPayment(request);
    } catch (error: any) {
      console.error("PaymentRouter createPayment error:", error);
      throw error;
    }
  }

  /**
   * 处理Webhook
   */
  async handleWebhook(providerName: string, data: any) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new PaymentError(
        "PROVIDER_NOT_FOUND",
        `Payment provider ${providerName} not found`,
        "router"
      );
    }

    return await provider.handleWebhook(data);
  }

  /**
   * 查询支付状态
   */
  async queryPayment(providerName: string, transactionId: string) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new PaymentError(
        "PROVIDER_NOT_FOUND",
        `Payment provider ${providerName} not found`,
        "router"
      );
    }

    return await provider.queryPayment(transactionId);
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
}
