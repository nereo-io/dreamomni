import { NextRequest } from "next/server";
import { respErr, respJson } from "@/lib/resp";
import { getUserEmail, getUserUuid } from "@/services/user";
import { getPaymentRouter } from "@/services/payment";
import { LogCategory, logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("Unauthorized");
    }
    const user_email = await getUserEmail();

    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return respErr("Missing subscription ID");
    }

    // 验证订阅归属权
    const { findSubscriptionByPayssionId } = await import("@/models/subscription");
    const subscription = await findSubscriptionByPayssionId(subscriptionId);
    
    if (!subscription) {
      return respErr("Subscription not found");
    }

    if (subscription.user_uuid !== user_uuid) {
      return respErr("Unauthorized to cancel this subscription");
    }

    // 直接使用 PaymentRouter 取消订阅
    const paymentRouter = getPaymentRouter();
    const provider = paymentRouter.getProvider("payssion");
    if (!provider || !provider.querySubscription) {
      logger.error(LogCategory.PAYMENT, "Payssion provider unavailable", {
        userId: user_uuid,
        email: user_email,
        action: "cancel_subscription",
        metadata: { subscriptionId },
      });
      return respErr("Provider not available");
    }

    const remoteDetails = await provider.querySubscription(subscriptionId);
    const remoteStatus = remoteDetails?.status?.toLowerCase?.();
    const canceledStatuses = ["canceled", "cancelled", "terminated", "complete"];

    if (remoteStatus && canceledStatuses.includes(remoteStatus)) {
      const { updateSubscriptionStatus } = await import("@/models/subscription");
      if (subscription.status !== "canceled") {
        await updateSubscriptionStatus(subscriptionId, "canceled");
      }
      return respJson(0, "Subscription already canceled", {
        success: true,
        subscriptionId,
        cancelledAt: new Date().toISOString(),
        alreadyCanceled: true,
      });
    }

    if (subscription.status !== "active") {
      logger.error(LogCategory.PAYMENT, "Subscription is not active", {
        userId: user_uuid,
        email: user_email,
        action: "cancel_subscription",
        metadata: {
          subscriptionId,
          status: subscription.status,
          remoteStatus: remoteStatus || null,
        },
      });
      return respErr("Subscription is not active");
    }

    const success = await paymentRouter.cancelSubscription(
      "payssion",
      subscriptionId
    );

    if (success) {
      return respJson(0, "Subscription cancelled successfully", {
        success: true,
        subscriptionId,
        cancelledAt: new Date().toISOString()
      });
    } else {
      logger.error(LogCategory.PAYMENT, "Payssion cancellation failed", {
        userId: user_uuid,
        email: user_email,
        action: "cancel_subscription",
        metadata: { subscriptionId, remoteStatus: remoteStatus || null },
      });
      return respErr("Failed to cancel subscription");
    }
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    try {
      const user_uuid = await getUserUuid();
      const user_email = await getUserEmail();
      logger.error(
        LogCategory.PAYMENT,
        "Subscription cancellation error",
        {
          userId: user_uuid || undefined,
          email: user_email || undefined,
          action: "cancel_subscription",
        },
        error
      );
    } catch (logError) {
      console.error("Failed to log subscription cancellation error:", logError);
    }
    return respErr("Internal server error");
  }
}
