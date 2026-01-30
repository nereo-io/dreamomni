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
    product_name: "Veo3 AI Mini",
    amount: 2000,
    currency: "USD",
    credits: 200,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_48xHjWLvgMo6JQej1x9DMe", // Creem 月付费产品ID
    // creem_product_id: "prod_3anPiH9opJYivargJPlZTV", //测试用
  },
  {
    product_id: "mini-yearly",
    product_name: "Veo3 AI Mini Yearly",
    amount: 14400,
    currency: "USD",
    credits: 2400,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_3k4Qsaa4bvHL5vVmHgsgVu", // Creem 年付费产品ID
  },
  {
    product_id: "standard-monthly",
    product_name: "Veo3 AI Standard",
    amount: 5000,
    currency: "USD",
    credits: 1000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_1BFUfz4Zsmweomr1xbATPm", // Creem 月付费产品ID（复用）
  },
  {
    product_id: "standard-yearly",
    product_name: "Veo3 AI Standard Yearly",
    amount: 36000,
    currency: "USD",
    credits: 12000,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_2vcqiBEAa9Uxd9TuXTequq", // Creem 年付费产品ID（复用）
  },
  {
    product_id: "plus-monthly",
    product_name: "Veo3 AI Plus",
    amount: 9900,
    currency: "USD",
    credits: 3000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
    creem_product_id: "prod_1ZVFmSS2oXjvSRR2YX6azq", // Creem 月付费产品ID（待填写）
  },
  {
    product_id: "plus-yearly",
    product_name: "Veo3 AI Plus Yearly",
    amount: 72000,
    currency: "USD",
    credits: 36000,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
    creem_product_id: "prod_pZyGxqSgMeWwX51BkK9F9", // Creem 年付费产品ID（待填写）
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
    product_name: "20 Credits Pack",
    amount: 2000, // $20
    currency: "USD",
    credits: 200,
    interval: "one-time",
    valid_months: 12,
    creem_product_id: "prod_7ghfxUFOcOCn2mPBNBmX4p",
  },
  {
    product_id: "bundle-40",
    product_name: "40 Credits Pack",
    amount: 4000, // $40
    currency: "USD",
    credits: 400,
    interval: "one-time",
    valid_months: 12,
    creem_product_id: "prod_7ghfxUFOcOCn2mPBNBmX4p",
  },
  {
    product_id: "bundle-60",
    product_name: "60 Credits Pack",
    amount: 6000, // $60
    currency: "USD",
    credits: 600,
    interval: "one-time",
    valid_months: 12,
    creem_product_id: "prod_7ghfxUFOcOCn2mPBNBmX4p",
  },
  {
    product_id: "bundle-100",
    product_name: "100 Credits Pack",
    amount: 10000, // $100
    currency: "USD",
    credits: 1000,
    interval: "one-time",
    valid_months: 12,
    creem_product_id: "prod_7ghfxUFOcOCn2mPBNBmX4p",
  },
  {
    product_id: "bundle-200",
    product_name: "200 Credits Pack",
    amount: 20000, // $200
    currency: "USD",
    credits: 2000,
    interval: "one-time",
    valid_months: 12,
    creem_product_id: "prod_7ghfxUFOcOCn2mPBNBmX4p",
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
