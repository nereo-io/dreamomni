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

// 订阅产品配置映射（基于金额，单位：美分）
// 必须与 config/products.ts 中的 PRODUCT_CONFIGS 保持一致
export const PAYSSION_PRODUCT_CONFIG: Record<string, PayssionProductConfig> = {
  "3000": {
    product_id: "mini-monthly",
    credits: 300,
    membershipType: "monthly",
  }, // $30
  "21600": {
    product_id: "mini-yearly",
    credits: 3600,
    membershipType: "yearly",
  }, // $216
  "10000": {
    product_id: "standard-monthly",
    credits: 2000,
    membershipType: "monthly",
  }, // $100
  "72000": {
    product_id: "standard-yearly",
    credits: 24000,
    membershipType: "yearly",
  }, // $720
  "19900": {
    product_id: "plus-monthly",
    credits: 6000,
    membershipType: "monthly",
  }, // $199
  "144000": {
    product_id: "plus-yearly",
    credits: 72000,
    membershipType: "yearly",
  }, // $1440
};

// Bundle 产品配置（一次性购买积分包）
export interface PayssionBundleConfig {
  product_id: string;
  credits: number;
}

export const PAYSSION_BUNDLE_CONFIG: Record<string, PayssionBundleConfig> = {
  "2000": { product_id: "bundle-20", credits: 200 }, // $20
  "4000": { product_id: "bundle-40", credits: 400 }, // $40
  "6000": { product_id: "bundle-60", credits: 600 }, // $60
  "10000": { product_id: "bundle-100", credits: 1000 }, // $100
  "20000": { product_id: "bundle-200", credits: 2000 }, // $200
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
        (process.env.NEXTAUTH_URL || "") + "/subscription/success",
      webhookUrl: process.env.NEXTAUTH_URL + "/api/payssion/v2-webhook" || "",
    },
  };
}

// 根据金额获取订阅产品配置
export function getProductConfigByAmount(
  amountInCents: string
): PayssionProductConfig | null {
  return PAYSSION_PRODUCT_CONFIG[amountInCents] || null;
}

// 根据金额获取 Bundle 产品配置
export function getBundleConfigByAmount(
  amountInCents: string
): PayssionBundleConfig | null {
  return PAYSSION_BUNDLE_CONFIG[amountInCents] || null;
}

// 根据产品ID获取订阅产品配置
export function getProductConfigByProductId(
  productId: string
): PayssionProductConfig | null {
  return (
    Object.values(PAYSSION_PRODUCT_CONFIG).find(
      (config) => config.product_id === productId
    ) || null
  );
}

// 根据产品ID获取 Bundle 产品配置
export function getBundleConfigByProductId(
  productId: string
): PayssionBundleConfig | null {
  return (
    Object.values(PAYSSION_BUNDLE_CONFIG).find(
      (config) => config.product_id === productId
    ) || null
  );
}

// 根据产品ID获取任意产品配置（订阅或 Bundle）
export function getAnyProductConfigByProductId(
  productId: string
): (PayssionProductConfig | PayssionBundleConfig) | null {
  return getProductConfigByProductId(productId) || getBundleConfigByProductId(productId);
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
