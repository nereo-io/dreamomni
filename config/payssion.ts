// Payssion 配置管理
export interface PayssionProductConfig {
  product_id: string;
  credits: number;
  membershipType: "monthly" | "yearly" | null; // null for one-time bundles
}

export interface PayssionConfig {
  // V2 API 配置（订阅支付）
  v2: {
    baseUrl: string;
    apiKey: string;
    secretKey: string;
  };

  // 产品配置
  products: Record<string, PayssionProductConfig>;

  // 支付方式映射
  paymentMethods: Record<string, string>;

  // 订阅配置
  subscription: {
    defaultReturnUrl: string;
    webhookUrl: string;
  };
}

// 产品配置映射（基于金额，单位：美分）
export const PAYSSION_PRODUCT_CONFIG: Record<string, PayssionProductConfig> = {
  // 订阅产品
  "2000": {
    product_id: "mini-monthly",
    credits: 200,
    membershipType: "monthly",
  }, // $20
  "14400": {
    product_id: "mini-yearly",
    credits: 2400,
    membershipType: "yearly",
  }, // $144
  "5000": {
    product_id: "standard-monthly",
    credits: 1000,
    membershipType: "monthly",
  }, // $50
  "36000": {
    product_id: "standard-yearly",
    credits: 12000,
    membershipType: "yearly",
  }, // $360
  "9900": {
    product_id: "plus-monthly",
    credits: 3000,
    membershipType: "monthly",
  }, // $99
  "72000": {
    product_id: "plus-yearly",
    credits: 36000,
    membershipType: "yearly",
  }, // $720

  // Bundle 产品（一次性购买）
  // Note: $20 (2000) conflicts with mini-monthly, $100 (10000) conflicts with bundle, handled by interval check
  "4000": {
    product_id: "bundle-40",
    credits: 400,
    membershipType: null,
  }, // $40
  "6000": {
    product_id: "bundle-60",
    credits: 600,
    membershipType: null,
  }, // $60
  "20000": {
    product_id: "bundle-200",
    credits: 2000,
    membershipType: null,
  }, // $200
};

// 支付方式映射（前端 -> Payssion V2 API）
export const PAYMENT_METHOD_MAPPING: Record<string, string> = {
  mir: "card_ru",
  yoomoney: "yoomoney_ru",
  sberpay: "sberpay_ru",
  tbank: "tbank_ru",
};

// 获取 Payssion 配置
export function getPayssionConfig(): PayssionConfig {
  return {
    v2: {
      baseUrl: process.env.PAYSSION_V2_BASE_URL || "https://api.payssion.com",
      apiKey: process.env.PAYSSION_V2_API_KEY || "",
      secretKey: process.env.PAYSSION_V2_SECRET_KEY || "",
    },
    products: PAYSSION_PRODUCT_CONFIG,
    paymentMethods: PAYMENT_METHOD_MAPPING,
    subscription: {
      defaultReturnUrl:
        process.env.NEXTAUTH_URL + "/subscription/success" ||
        "https://veo3ai.io/subscription/success",
      webhookUrl: process.env.NEXTAUTH_URL + "/api/payssion/v2-webhook" || "",
    },
  };
}

// 根据金额获取产品配置
export function getProductConfigByAmount(
  amountInCents: string
): PayssionProductConfig | null {
  return PAYSSION_PRODUCT_CONFIG[amountInCents] || null;
}

// 根据产品ID获取产品配置
export function getProductConfigByProductId(
  productId: string
): PayssionProductConfig | null {
  return (
    Object.values(PAYSSION_PRODUCT_CONFIG).find(
      (config) => config.product_id === productId
    ) || null
  );
}

// 获取支付方式映射
export function mapToPayssionPaymentMethod(frontendMethod: string): string {
  return PAYMENT_METHOD_MAPPING[frontendMethod] || frontendMethod;
}

// 验证配置完整性
export function validatePayssionConfig(config: PayssionConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // V2 配置检查
  if (!config.v2.apiKey) errors.push("Missing PAYSSION_V2_API_KEY");
  if (!config.v2.secretKey) errors.push("Missing PAYSSION_V2_SECRET_KEY");
  if (!config.v2.baseUrl) errors.push("Missing PAYSSION_V2_BASE_URL");

  // Webhook URL 检查
  if (!config.subscription.webhookUrl)
    errors.push("Missing webhook URL configuration");

  return {
    valid: errors.length === 0,
    errors,
  };
}
