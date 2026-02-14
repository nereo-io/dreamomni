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
    // creem_product_id: "prod_3anPiH9opJYivargJPlZTV",
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
  const config = getAnyProductConfig(productId);
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

/**
 * Bundle 产品配置接口（一次性购买积分包）
 */
export interface BundleProductConfig {
  product_id: string;
  product_name: string;
  amount: number; // 金额（美分）
  currency: string;
  credits: number;
  interval: "one-time";
  valid_months: number; // 积分有效期（月）
  creem_product_id: string; // Creem 产品ID（需要在 Creem 后台创建）
}

/**
 * Bundle 产品配置表
 * 一次性购买积分包，无需订阅
 */
export const BUNDLE_CONFIGS: BundleProductConfig[] = [
  {
    product_id: "bundle-20",
    product_name: "Seedance 200 Credits Pack",
    amount: 2000, // $20
    currency: "USD",
    credits: 200,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_66wWAsMJk3PoorpGnQYJFT",
  },
  {
    product_id: "bundle-40",
    product_name: "Seedance 400 Credits Pack",
    amount: 4000, // $40
    currency: "USD",
    credits: 400,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_6ond4Axu2ZoYWIs0WRRPXo",
  },
  {
    product_id: "bundle-60",
    product_name: "Seedance 600 Credits Pack",
    amount: 6000, // $60
    currency: "USD",
    credits: 600,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_2tD1QG4zjXTinwSSE9I79D",
  },
  {
    product_id: "bundle-100",
    product_name: "Seedance 1000 Credits Pack",
    amount: 10000, // $100
    currency: "USD",
    credits: 1000,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_2mgeAaYvFpa6b8xWvAc3lH",
  },
  {
    product_id: "bundle-200",
    product_name: "Seedance 2000 Credits Pack",
    amount: 20000, // $200
    currency: "USD",
    credits: 2000,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_3IFhkoxBNtR4vHNS6zsUZY",
  },
];

/**
 * 根据产品ID获取 Bundle 配置
 */
export function getBundleConfig(
  productId: string
): BundleProductConfig | undefined {
  return BUNDLE_CONFIGS.find((config) => config.product_id === productId);
}

/**
 * 检查产品ID是否为 Bundle 类型
 */
export function isBundle(productId: string): boolean {
  return BUNDLE_CONFIGS.some((config) => config.product_id === productId);
}

/**
 * 获取任意产品配置（订阅或 Bundle）
 */
export function getAnyProductConfig(
  productId: string
): ProductConfig | BundleProductConfig | undefined {
  return getProductConfig(productId) || getBundleConfig(productId);
}

/**
 * 订阅等级排名（数字越大价值越高）
 * 用于判断升级/降级
 */
export const SUBSCRIPTION_TIER_RANK: Record<string, number> = {
  // Seedance current tiers (keep in sync with PRODUCT_CONFIGS).
  "mini-monthly": 1, // $30/month
  "standard-monthly": 2, // $100/month
  "mini-yearly": 3, // $216/year
  "standard-yearly": 4, // $720/year
};

/**
 * 获取订阅等级排名
 * @param productId 产品ID
 * @returns 等级排名，未找到返回 0
 */
export function getSubscriptionTierRank(productId: string): number {
  return SUBSCRIPTION_TIER_RANK[productId] ?? 0;
}

/**
 * 判断是否可以升级到目标套餐
 * @param currentProductId 当前产品ID
 * @param targetProductId 目标产品ID
 * @returns true 表示可以升级
 */
export function canUpgradeToTier(currentProductId: string | null, targetProductId: string): boolean {
  if (!currentProductId) {
    // 无订阅用户可以购买任何套餐
    return true;
  }
  const currentRank = getSubscriptionTierRank(currentProductId);
  const targetRank = getSubscriptionTierRank(targetProductId);
  // 只允许升级（目标等级 > 当前等级）
  return targetRank > currentRank;
}

/**
 * 判断是否为同一套餐
 */
export function isSameTier(currentProductId: string | null, targetProductId: string): boolean {
  return currentProductId === targetProductId;
}
