// 客户端支付方式配置工具
// 直接在客户端获取支付方式，无需API调用

// 精简的支付方式配置
export interface PaymentMethodConfig {
  id: string;
  name: string;
  logo: string;
  provider: string;
}

/**
 * 获取 Payssion 支付方式配置（支持订阅）
 */
export function getPayssionMethods(isSubscription: boolean = false): PaymentMethodConfig[] {
  
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
 * 获取 Creem 支付方式配置
 */
export function getCreemMethods(): PaymentMethodConfig[] {
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
 * 获取 Stripe 支付方式配置（保留作为备用）
 */
export function getStripeMethods(): PaymentMethodConfig[] {
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
 * 根据地理位置获取可用支付方式
 */
export function getAvailablePaymentMethods(
  isRussia: boolean, 
  isSubscription: boolean = false
): PaymentMethodConfig[] {
  const methods: PaymentMethodConfig[] = [];

  if (isRussia) {
    // 俄罗斯地区优先显示 Payssion 支付方式
    methods.push(...getPayssionMethods(isSubscription));
    // 添加 Creem 作为备选
    methods.push(...getCreemMethods());
  } else {
    // 其他地区优先显示 Creem
    methods.push(...getCreemMethods());
    // 如果需要也可以添加 Payssion
    methods.push(...getPayssionMethods(isSubscription));
  }

  return methods;
}

/**
 * 获取订阅专用的支付方式（只返回支持订阅的方式）
 */
export function getSubscriptionPaymentMethods(isRussia: boolean): PaymentMethodConfig[] {
  const methods: PaymentMethodConfig[] = [];

  if (isRussia) {
    // 俄罗斯地区使用 Payssion V2 订阅
    methods.push(...getPayssionMethods(true));
  } else {
    // 其他地区可以使用 Creem 订阅
    methods.push(...getCreemMethods());
  }

  return methods;
}

/**
 * 动态确定支付提供商
 */
export function getPaymentProvider(paymentMethod: string): string {
  if (paymentMethod === "creem") return "creem";
  if (paymentMethod === "stripe") return "stripe";
  if (["sberpay", "yoomoney", "mir"].includes(paymentMethod)) return "payssion";
  return "stripe"; // 默认
}

/**
 * 获取推荐的支付提供商
 */
export function getRecommendedProvider(isRussia: boolean): {
  provider: string;
  reason: string;
} {
  return {
    provider: isRussia ? "payssion" : "creem",
    reason: isRussia ? "local_payment_methods" : "global_coverage",
  };
}