/**
 * Creem 支付提供商配置
 */
import { parseCreemWebhookSecrets } from "@/lib/creem-webhook";

export interface CreemConfig {
  apiKey: string;
  webhookSecret: string;
  webhookSecrets: string[];
  baseUrl: string;
}

/**
 * 获取 Creem 配置
 */
export function getCreemConfig(): CreemConfig {
  const apiKey = process.env.CREEM_API_KEY;
  const webhookSecrets = parseCreemWebhookSecrets(
    process.env.CREEM_WEBHOOK_SECRET
  );
  const baseUrl = process.env.CREEM_BASE_URL || "https://api.creem.io";

  if (!apiKey || webhookSecrets.length === 0) {
    throw new Error("Creem configuration is incomplete. Please check CREEM_API_KEY and CREEM_WEBHOOK_SECRET environment variables.");
  }

  return {
    apiKey,
    webhookSecret: webhookSecrets[0],
    webhookSecrets,
    baseUrl,
  };
}
