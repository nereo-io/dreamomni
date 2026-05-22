import {
  getSubscriptionTierByProductId,
  SubscriptionTier,
} from "@/config/products";
import { findActiveCreemSubscriptionsByUserUuid } from "@/models/creem-subscription";
import { findActiveStripeSubscriptionsByUserUuid } from "@/models/stripe-subscription";
import { findActiveSubscriptionsByUserUuid } from "@/models/subscription";

const TIER_PRIORITY: Record<SubscriptionTier, number> = {
  none: 0,
  mini: 1,
  standard: 2,
  plus: 3,
};

/**
 * 获取用户当前最高订阅档位，用于积分包会员加赠。
 */
export async function getUserHighestSubscriptionTier(
  userUuid: string,
): Promise<SubscriptionTier> {
  const [payssionSubscriptions, creemSubscriptions, stripeSubscriptions] =
    await Promise.all([
      findActiveSubscriptionsByUserUuid(userUuid),
      findActiveCreemSubscriptionsByUserUuid(userUuid),
      findActiveStripeSubscriptionsByUserUuid(userUuid),
    ]);

  const ranked = [
    ...payssionSubscriptions,
    ...creemSubscriptions,
    ...stripeSubscriptions,
  ]
    .map((subscription) => ({
      productId: subscription.product_id,
      amount: Number(subscription.amount || 0),
      tier: getSubscriptionTierByProductId(subscription.product_id),
    }))
    .filter((item) => item.productId && item.tier !== "none")
    .sort((a, b) => {
      const tierDiff = TIER_PRIORITY[b.tier] - TIER_PRIORITY[a.tier];
      if (tierDiff !== 0) {
        return tierDiff;
      }

      return b.amount - a.amount;
    });

  return ranked[0]?.tier || "none";
}
