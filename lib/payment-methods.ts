// 客户端支付方式配置工具
// 直接在客户端获取支付方式，无需API调用

import { PaymentMethodConfig } from "@/components/ui/payment-method-selector";

/**
 * 获取 Payssion 支付方式配置
 */
export function getPayssionMethods(): PaymentMethodConfig[] {
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
 * 获取 Stripe 支付方式配置
 */
export function getStripeMethods(): PaymentMethodConfig[] {
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
 * 根据地理位置获取可用支付方式
 */
export function getAvailablePaymentMethods(isRussia: boolean): PaymentMethodConfig[] {
  const methods: PaymentMethodConfig[] = [];

  if (isRussia) {
    // 俄罗斯地区优先显示 Payssion 支付方式
    methods.push(...getPayssionMethods());
    // 添加 Stripe 作为备选
    methods.push(...getStripeMethods());
  } else {
    // 其他地区优先显示 Stripe
    methods.push(...getStripeMethods());
    // 如果需要也可以添加 Payssion
    methods.push(...getPayssionMethods());
  }

  return methods;
}

/**
 * 获取推荐的支付提供商
 */
export function getRecommendedProvider(isRussia: boolean): {
  provider: string;
  reason: string;
} {
  return {
    provider: isRussia ? "payssion" : "stripe",
    reason: isRussia ? "local_payment_methods" : "global_coverage",
  };
}