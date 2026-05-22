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
    product_name: "DreamOmni Mini",
    amount: 3900,
    currency: "USD",
    credits: 400,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_dWuFUGDfC4cS9dmHiFI4G",
  },
  {
    product_id: "mini-yearly",
    product_name: "DreamOmni Mini Yearly",
    amount: 27600,
    currency: "USD",
    credits: 4800,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_51a1VPx3WqsINhXYqTgYKx",
  },
  {
    product_id: "standard-monthly",
    product_name: "DreamOmni Standard",
    amount: 8000,
    currency: "USD",
    credits: 1600,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_6O0Vq5CjMEDZ9aDlRXhhyb",
  },
  {
    product_id: "standard-yearly",
    product_name: "DreamOmni Standard Yearly",
    amount: 57600,
    currency: "USD",
    credits: 19200,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_7lFHmsR6ifHlDJJFejy6TJ",
  },
  {
    product_id: "plus-monthly",
    product_name: "DreamOmni Plus",
    amount: 16000,
    currency: "USD",
    credits: 4800,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_6Ri4kSWOpqgjdN67QShjC4",
  },
  {
    product_id: "plus-yearly",
    product_name: "DreamOmni Plus Yearly",
    amount: 115200,
    currency: "USD",
    credits: 57600,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_62lBNSqFJyMxue5vUTkaGw",
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
  provider: "creem" | "stripe",
): string | undefined {
  const config = getAnyProductConfig(productId);
  if (!config) return undefined;

  if (provider === "creem") {
    return config.creem_product_id;
  }

  if (provider === "stripe") {
    return getStripePriceId(productId);
  }

  return undefined;
}

/**
 * Stripe Price IDs are environment-specific, so keep them out of source.
 * Example: mini-monthly -> STRIPE_PRICE_MINI_MONTHLY
 */
export function getStripePriceEnvName(productId: string): string {
  const suffix = productId.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return `STRIPE_PRICE_${suffix}`;
}

export function getStripePriceId(productId: string): string | undefined {
  const envName = getStripePriceEnvName(productId);
  const priceId = process.env[envName]?.trim();
  return priceId || undefined;
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
    product_name: "DreamOmni 400 Credits Pack",
    amount: 3900, // $39
    currency: "USD",
    credits: 400,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_2LJGHKAVDnNJDsTtnlc2pE",
  },
  {
    product_id: "bundle-40",
    product_name: "DreamOmni 800 Credits Pack",
    amount: 8000, // $80
    currency: "USD",
    credits: 800,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_jkimrXNLPAXY4yAgjMX3f",
  },
  {
    product_id: "bundle-100",
    product_name: "DreamOmni 1600 Credits Pack",
    amount: 16000, // $160
    currency: "USD",
    credits: 1600,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_17C61yd96HymxWqHveq9FD",
  },
  {
    product_id: "bundle-200",
    product_name: "DreamOmni 3200 Credits Pack",
    amount: 32000, // $320
    currency: "USD",
    credits: 3200,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_5263DzLJkuKemkIJ67bWzT",
  },
  {
    product_id: "bundle-500",
    product_name: "DreamOmni 6400 Credits Pack",
    amount: 64000, // $640
    currency: "USD",
    credits: 6400,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_5F2LEAeUvnaeIZyb29DUJ1",
  },
  {
    product_id: "bundle-1000",
    product_name: "DreamOmni 12800 Credits Pack",
    amount: 128000, // $1280
    currency: "USD",
    credits: 12800,
    interval: "one-time",
    valid_months: 1,
    creem_product_id: "prod_2an3f5ojKUslLhhMPvPig9",
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
  "mini-monthly": 1, // $39/month
  "mini-yearly": 2, // $276/year
  "standard-monthly": 3, // $80/month
  "standard-yearly": 4, // $576/year
  "plus-monthly": 5, // $160/month
  "plus-yearly": 6, // $1152/year
};

export type SubscriptionTier = "mini" | "standard" | "plus" | "none";

type BundleBonusByTier = Record<Exclude<SubscriptionTier, "none">, number>;

export const BUNDLE_BONUS_BY_PRODUCT_ID: Record<string, BundleBonusByTier> = {
  "bundle-20": {
    mini: 0,
    standard: 0,
    plus: 400,
  },
  "bundle-40": {
    mini: 0,
    standard: 200,
    plus: 600,
  },
  "bundle-100": {
    mini: 0,
    standard: 500,
    plus: 1600,
  },
  "bundle-200": {
    mini: 0,
    standard: 1000,
    plus: 3200,
  },
  "bundle-500": {
    mini: 0,
    standard: 2000,
    plus: 6400,
  },
  "bundle-1000": {
    mini: 0,
    standard: 4200,
    plus: 25600,
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
