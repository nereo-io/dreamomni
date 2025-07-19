/**
 * Creem 支付提供商配置
 */

export interface CreemConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
}

/**
 * 获取 Creem 配置
 */
export function getCreemConfig(): CreemConfig {
  const apiKey = process.env.CREEM_API_KEY;
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
  const baseUrl = process.env.CREEM_BASE_URL || "https://api.creem.io";
  
  if (!apiKey || !webhookSecret) {
    throw new Error("Creem configuration is incomplete. Please check CREEM_API_KEY and CREEM_WEBHOOK_SECRET environment variables.");
  }
  
  return {
    apiKey,
    webhookSecret,
    baseUrl,
  };
}