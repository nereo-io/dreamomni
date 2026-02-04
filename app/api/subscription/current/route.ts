import { NextRequest } from "next/server";
import { respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findActiveSubscriptionsByUserUuid } from "@/models/subscription";
import { findActiveCreemSubscriptionsByUserUuid } from "@/models/creem-subscription";
import {
  getProductConfig,
  getSubscriptionTierRank,
  SUBSCRIPTION_TIER_RANK,
} from "@/config/products";

export interface CurrentSubscriptionResponse {
  hasActiveSubscription: boolean;
  currentSubscription: {
    product_id: string;
    product_name: string;
    tier_rank: number;
    amount: number;
    credits: number;
    interval: "month" | "year";
    provider: "payssion" | "creem";
    status: string;
    current_period_end?: string;
  } | null;
}

export async function GET(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("Unauthorized");
    }

    // 并行查询 Payssion 和 Creem 的活跃订阅
    const [payssionSubscriptions, creemSubscriptions] = await Promise.all([
      findActiveSubscriptionsByUserUuid(user_uuid),
      findActiveCreemSubscriptionsByUserUuid(user_uuid),
    ]);

    // 合并所有订阅并过滤有效的 product_id
    const allSubscriptions: Array<{
      product_id: string;
      product_name: string;
      tier_rank: number;
      amount: number;
      credits: number;
      interval: "month" | "year";
      provider: "payssion" | "creem";
      status: string;
      current_period_end?: string;
    }> = [];

    // 处理 Payssion 订阅
    for (const sub of payssionSubscriptions) {
      if (!sub.product_id || !(sub.product_id in SUBSCRIPTION_TIER_RANK)) {
        continue;
      }
      const productConfig = getProductConfig(sub.product_id);
      if (!productConfig) continue;

      allSubscriptions.push({
        product_id: sub.product_id,
        product_name: sub.product_name || productConfig.product_name,
        tier_rank: getSubscriptionTierRank(sub.product_id),
        amount: sub.amount || productConfig.amount,
        credits: productConfig.credits,
        interval: productConfig.interval,
        provider: "payssion",
        status: sub.status,
        current_period_end: sub.current_period_end,
      });
    }

    // 处理 Creem 订阅
    for (const sub of creemSubscriptions) {
      if (!sub.product_id || !(sub.product_id in SUBSCRIPTION_TIER_RANK)) {
        continue;
      }
      const productConfig = getProductConfig(sub.product_id);
      if (!productConfig) continue;

      allSubscriptions.push({
        product_id: sub.product_id,
        product_name: sub.product_name || productConfig.product_name,
        tier_rank: getSubscriptionTierRank(sub.product_id),
        amount: sub.amount || productConfig.amount,
        credits: productConfig.credits,
        interval: productConfig.interval,
        provider: "creem",
        status: sub.status,
        current_period_end: sub.current_period_end,
      });
    }

    // 按 tier_rank 排序，返回最高等级的订阅
    allSubscriptions.sort((a, b) => b.tier_rank - a.tier_rank);

    const currentSubscription = allSubscriptions.length > 0 ? allSubscriptions[0] : null;

    const response: CurrentSubscriptionResponse = {
      hasActiveSubscription: currentSubscription !== null,
      currentSubscription,
    };

    return respJson(0, "Success", response);
  } catch (error: any) {
    console.error("Get current subscription error:", error);
    return respErr("Internal server error");
  }
}
