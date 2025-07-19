import { NextRequest } from "next/server";
import { respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getPaymentRouter } from "@/services/payment";

export async function POST(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("Unauthorized");
    }

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

    if (subscription.status !== 'active') {
      return respErr("Subscription is not active");
    }

    // 直接使用 PaymentRouter 取消订阅
    const paymentRouter = getPaymentRouter();
    const success = await paymentRouter.cancelSubscription('payssion', subscriptionId);

    if (success) {
      return respJson(0, "Subscription cancelled successfully", {
        success: true,
        subscriptionId,
        cancelledAt: new Date().toISOString()
      });
    } else {
      return respErr("Failed to cancel subscription");
    }
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return respErr("Internal server error");
  }
}