/**
 * Creem 支付的产品配置管理
 */

export interface ProductConfig {
  // 基础产品信息
  product_id: string; // 内部产品ID
  product_name: string; // 产品名称
  amount: number; // 金额（美分）
  currency: string; // 货币
  credits: number; // 积分数量
  interval: "month" | "year"; // 订阅周期
  valid_months: number; // 有效月数

  // Creem 产品ID映射
  creem_product_id: string; // Creem 产品ID（需要在 Creem 后台创建）

  // 会员类型
  membershipType: "monthly" | "yearly";
}

/**
 * 产品配置表
 * 基于现有的产品结构整合
 */
export const PRODUCT_CONFIGS: ProductConfig[] = [
  {
    product_id: "mini-monthly",
    product_name: "Seedance Mini",
    amount: 3000,
    currency: "USD",
    credits: 400,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_76FSEtH6AHsOQDHeh7M3Ro", // Creem 月付费产品ID
  },
  {
    product_id: "mini-yearly",
    product_name: "Seedance Mini Yearly",
    amount: 21600,
    currency: "USD",
    credits: 4800,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_3ik0q2qmX6W3BkwjWwCxqP", // Creem 年付费产品ID
  },
  {
    product_id: "standard-monthly",
    product_name: "Seedance Standard",
    amount: 10000,
    currency: "USD",
    credits: 2000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_7GjxcCpy3AfjhpdG3kzxic", // Creem 月付费产品ID
  },
  {
    product_id: "standard-yearly",
    product_name: "Seedance Standard Yearly",
    amount: 72000,
    currency: "USD",
    credits: 24000,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_6Jg7ySsDYHBBYDzIjml96Y", // Creem 年付费产品ID
  },
  {
    product_id: "plus-monthly",
    product_name: "Seedance Plus",
    amount: 9900,
    currency: "USD",
    credits: 3000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_1ZVFmSS2oXjvSRR2YX6azq", // Creem 月付费产品ID
  },
  {
    product_id: "plus-yearly",
    product_name: "Seedance Plus Yearly",
    amount: 72000,
    currency: "USD",
    credits: 36000,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_pZyGxqSgMeWwX51BkK9F9", // Creem 年付费产品ID
  },
];

/**
 * 根据内部产品ID获取产品配置
 */
export function getProductConfig(productId: string): ProductConfig | undefined {
  return PRODUCT_CONFIGS.find((config) => config.product_id === productId);
}

/**
 * 获取 Creem 的产品ID
 */
export function getProviderProductId(
  productId: string,
  provider: "creem"
): string | undefined {
  const config = getProductConfig(productId);
  if (!config) return undefined;

  if (provider === "creem") {
    return config.creem_product_id;
  }

  return undefined;
}

/**
 * 获取所有支持的产品ID列表
 */
export function getAllProductIds(): string[] {
  return PRODUCT_CONFIGS.map((config) => config.product_id);
}

/**
 * 验证产品ID是否有效
 */
export function isValidProductId(productId: string): boolean {
  return PRODUCT_CONFIGS.some((config) => config.product_id === productId);
}