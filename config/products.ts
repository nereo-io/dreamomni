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
    amount: 2000,
    currency: "USD",
    credits: 200,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_1de8ncVJXQK8BpcTFbL6d8",
  },
  {
    product_id: "mini-yearly",
    product_name: "Seedance Mini Yearly",
    amount: 14400,
    currency: "USD",
    credits: 2400,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_1Q0klNKuDopmTMhnf3ieA1",
  },
  {
    product_id: "standard-monthly",
    product_name: "Seedance Standard",
    amount: 5000,
    currency: "USD",
    credits: 1000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_37XoZpr2IrZWrl9ftTq54p",
  },
  {
    product_id: "standard-yearly",
    product_name: "Seedance Standard Yearly",
    amount: 36000,
    currency: "USD",
    credits: 12000,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_7IsFFUhgP3iAsTshXBgZWr",
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
    creem_product_id: "prod_P2djJgeDOPjnpXZLEz8pt",
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
    creem_product_id: "prod_5siauowmaPRU4A0lKPseNC",
  },
  {
    product_id: "max-monthly",
    product_name: "Seedance Max",
    amount: 36000,
    currency: "USD",
    credits: 12000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_10kRKBhnXiLIKCXKcS5IZ8",
  },
  {
    product_id: "max-yearly",
    product_name: "Seedance Max Yearly",
    amount: 259200,
    currency: "USD",
    credits: 144000,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_66X7TZMnXlj5tznQbJrGBa",
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
  provider: "creem",
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
    creem_product_id: "prod_51ucODXluyiolcCSmwT8K9",
  },
  {
    product_id: "bundle-40",
    product_name: "Seedance 400 Credits Pack",
    amount: 4000, // $40
    currency: "USD",
    credits: 400,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_4EVxqIeK6j9OCuwrPg3jI0",
  },
  {
    product_id: "bundle-100",
    product_name: "Seedance 1000 Credits Pack",
    amount: 10000, // $100
    currency: "USD",
    credits: 1000,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_6daDvaiC7cDnnd0meBwECE",
  },
  {
    product_id: "bundle-200",
    product_name: "Seedance 2000 Credits Pack",
    amount: 20000, // $200
    currency: "USD",
    credits: 2000,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_23MINso2fWo2TbWwZtP9Ln",
  },
  {
    product_id: "bundle-500",
    product_name: "Seedance 5000 Credits Pack",
    amount: 50000, // $500
    currency: "USD",
    credits: 5000,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_19tk9NXTFGQMNPGHeEAovS",
  },
  {
    product_id: "bundle-1000",
    product_name: "Seedance 10000 Credits Pack",
    amount: 100000, // $1000
    currency: "USD",
    credits: 10000,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_6L0UaSlyGSjFxdHamfL7fF",
  },
];

/**
 * 根据产品ID获取 Bundle 配置
 */
export function getBundleConfig(
  productId: string,
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
  productId: string,
): ProductConfig | BundleProductConfig | undefined {
  return getProductConfig(productId) || getBundleConfig(productId);
}

/**
 * 订阅等级排名（数字越大价值越高）
 * 用于判断升级/降级
 */
export const SUBSCRIPTION_TIER_RANK: Record<string, number> = {
  "mini-monthly": 1, // $20/month
  "mini-yearly": 2, // $144/year
  "standard-monthly": 3, // $50/month
  "standard-yearly": 4, // $360/year
  "plus-monthly": 5, // $99/month
  "plus-yearly": 6, // $720/year
  "max-monthly": 7, // $360/month
  "max-yearly": 8, // $2592/year
};

export type SubscriptionTier = "mini" | "standard" | "plus" | "max" | "none";

type BundleBonusByTier = Record<Exclude<SubscriptionTier, "none">, number>;

export const BUNDLE_BONUS_BY_PRODUCT_ID: Record<string, BundleBonusByTier> = {
  "bundle-20": {
    mini: 0,
    standard: 0,
    plus: 200,
    max: 200,
  },
  "bundle-40": {
    mini: 0,
    standard: 100,
    plus: 300,
    max: 300,
  },
  "bundle-100": {
    mini: 0,
    standard: 300,
    plus: 1000,
    max: 1000,
  },
  "bundle-200": {
    mini: 0,
    standard: 600,
    plus: 2000,
    max: 2000,
  },
  "bundle-500": {
    mini: 0,
    standard: 1600,
    plus: 5000,
    max: 5000,
  },
  "bundle-1000": {
    mini: 0,
    standard: 3300,
    plus: 20000,
    max: 20000,
  },
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
 * 根据订阅产品 ID 解析用户订阅档位
 */
export function getSubscriptionTierByProductId(
  productId?: string | null,
): SubscriptionTier {
  if (!productId) {
    return "none";
  }

  if (productId.startsWith("max-")) {
    return "max";
  }

  if (productId.startsWith("plus-")) {
    return "plus";
  }

  if (productId.startsWith("standard-")) {
    return "standard";
  }

  if (productId.startsWith("mini-")) {
    return "mini";
  }

  return "none";
}

/**
 * 计算积分包赠送积分
 */
export function getBundleBonusCreditsForTier(
  bundleProductId: string | undefined | null,
  tier: SubscriptionTier,
): number {
  if (!bundleProductId || tier === "none") {
    return 0;
  }

  const bonusByTier = BUNDLE_BONUS_BY_PRODUCT_ID[bundleProductId];
  if (!bonusByTier) {
    return 0;
  }

  return bonusByTier[tier] ?? 0;
}

/**
 * 计算积分包最终到账积分（基础 + 加赠）
 */
export function getTotalBundleCredits(
  baseCredits: number,
  bundleProductId: string | undefined | null,
  tier: SubscriptionTier,
): number {
  return baseCredits + getBundleBonusCreditsForTier(bundleProductId, tier);
}

/**
 * 判断是否可以升级到目标套餐
 * @param currentProductId 当前产品ID
 * @param targetProductId 目标产品ID
 * @returns true 表示可以升级
 */
export function canUpgradeToTier(
  currentProductId: string | null,
  targetProductId: string,
): boolean {
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
export function isSameTier(
  currentProductId: string | null,
  targetProductId: string,
): boolean {
  return currentProductId === targetProductId;
}
