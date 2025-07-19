import { NextRequest } from "next/server";
import { respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getPaymentRouter } from "@/services/payment";
import { findSubscriptionByPayssionId } from "@/models/subscription";

export async function GET(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("Unauthorized");
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return respErr("Missing subscription ID");
    }

    // 验证订阅归属权
    const subscription = await findSubscriptionByPayssionId(subscriptionId);
    
    if (!subscription) {
      return respErr("Subscription not found");
    }

    if (subscription.user_uuid !== user_uuid) {
      return respErr("Unauthorized to access this subscription");
    }

    // 从 Payssion API 获取详情
    const paymentRouter = getPaymentRouter();
    const provider = paymentRouter.getProvider('payssion');
    
    if (!provider || !provider.querySubscription) {
      return respErr("Provider not available");
    }

    const details = await provider.querySubscription(subscriptionId);
    
    if (details) {
      return respJson(0, "Success", {
        subscriptionId,
        details,
        // 提取关键信息
        nextBillingDate: (details as any).time_start ? new Date((details as any).time_start).toISOString() : null,
        status: (details as any).status,
        amount: (details as any).amount,
        currency: (details as any).currency
      });
    } else {
      return respErr("Failed to fetch subscription details");
    }
  } catch (error: any) {
    console.error('Subscription details error:', error);
    return respErr("Internal server error");
  }
}