import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { 
  findCreemSubscriptionByCreemId, 
  updateCreemSubscriptionStatus 
} from "@/models/creem-subscription";
import { getPaymentRouter } from "@/services/payment";
import { trackFirstPromoterCancellation } from "@/services/analytics/first-promoter";

// 日志函数
function logInfo(message: string, data?: any) {
  console.log(`[CREEM-CANCEL] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

function logError(message: string, data?: any) {
  console.error(`[CREEM-CANCEL] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

/**
 * 取消 Creem 订阅
 */
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const userUuid = await getUserUuid();
    if (!userUuid) {
      logError("❌ 用户未认证");
      return respErr("User not authenticated");
    }

    const body = await req.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      logError("❌ 缺少订阅ID");
      return respErr("Missing subscription ID");
    }

    logInfo("🚫 开始取消 Creem 订阅", {
      userUuid,
      subscriptionId: subscription_id,
    });

    // 查找订阅记录
    const subscription = await findCreemSubscriptionByCreemId(subscription_id);
    if (!subscription) {
      logError("❌ 订阅记录不存在", { subscriptionId: subscription_id });
      return respErr("Subscription not found");
    }

    // 验证订阅所有者
    if (subscription.user_uuid !== userUuid) {
      logError("❌ 用户无权限取消此订阅", {
        subscriptionUserUuid: subscription.user_uuid,
        currentUserUuid: userUuid,
      });
      return respErr("Permission denied");
    }

    // 检查订阅状态
    if (subscription.status === 'canceled') {
      logInfo("⚠️ 订阅已经被取消", { subscriptionId: subscription_id });
      return respData({ 
        message: "Subscription is already canceled",
        subscription 
      });
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      logError("❌ 只能取消活跃或试用状态的订阅", {
        currentStatus: subscription.status,
      });
      return respErr("Can only cancel active or trialing subscriptions");
    }

    try {
      // 通过 PaymentRouter 调用 Creem API 取消订阅
      const paymentRouter = getPaymentRouter();
      await paymentRouter.cancelSubscription("creem", subscription_id);
    } catch (apiError: any) {
      // 如果是 404 错误，订阅可能已经在 Creem 端取消，继续更新本地状态
      if (!apiError.message?.includes("404")) {
        logError("❌ Creem API 错误", apiError.message);
        return respErr("Failed to cancel subscription in Creem");
      }
    }

    // 更新本地数据库中的订阅状态
    const updatedSubscription = await updateCreemSubscriptionStatus(
      subscription_id,
      'canceled'
    );

    logInfo("✅ 订阅取消成功", { subscriptionId: subscription_id });

    await trackFirstPromoterCancellation({
      paymentProvider: "creem",
      subscriptionId: subscription_id,
      userUuid: subscription.user_uuid,
    });

    return respData({
      message: "Subscription canceled successfully",
      subscription: updatedSubscription,
    });

  } catch (error: any) {
    logError("🚨 取消订阅异常", error.message);
    return respErr("Failed to cancel subscription: " + error.message);
  }
}
