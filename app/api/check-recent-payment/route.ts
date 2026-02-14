import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import {
  findRecentPaidOrder,
  findRecentFailedPayment,
} from "@/models/order";

export async function GET(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    // 获取支付时间戳参数
    const { searchParams } = new URL(req.url);
    const paymentTimestamp = searchParams.get('timestamp');
    
    if (!paymentTimestamp) {
      return respData({ hasRecentPayment: false });
    }

    // 查询用户最近 5 分钟内的成功订单
    const requestTimestamp = parseInt(paymentTimestamp);

    if (Number.isNaN(requestTimestamp)) {
      return respData({ hasRecentPayment: false });
    }
    const recentOrder = await findRecentPaidOrder(user_uuid, 5);

    if (recentOrder) {
      const orderCreatedTime = new Date(recentOrder.created_at).getTime();

      if (orderCreatedTime >= requestTimestamp - 60000) {
        // Calculate monthly credits for yearly subscriptions with monthly distribution
        const isMonthlyDistribution = recentOrder.is_monthly_distribution || false;
        const monthlyCredits = isMonthlyDistribution
          ? Math.floor(recentOrder.credits / 12)
          : recentOrder.credits;

        return respData({
          hasRecentPayment: true,
          paymentInfo: {
            planName: recentOrder.product_name,
            credits: recentOrder.credits, // Keep for backward compatibility
            amount: recentOrder.amount,
            currency: recentOrder.currency,
            interval: recentOrder.interval,
            paidAt: recentOrder.paid_at,
            // New fields for monthly distribution
            isMonthlyDistribution,
            monthlyCredits,
            totalCredits: recentOrder.credits,
            remainingMonths: isMonthlyDistribution ? 11 : 0,
          },
        });
      }
    }

    const recentFailure = await findRecentFailedPayment(user_uuid, 5);

    console.log("🔍 findRecentFailedPayment result:", {
      user_uuid,
      found: !!recentFailure,
      orderNo: recentFailure?.order.order_no,
      failureCode: recentFailure?.failure.code,
    });

    if (recentFailure) {
      const failureTimeStr =
        recentFailure.failure.failureAt || recentFailure.failure.recordedAt;
      const failureTime = failureTimeStr
        ? new Date(failureTimeStr).getTime()
        : Date.now();

      console.log("⏰ Time comparison:", {
        failureTime,
        failureTimeStr,
        requestTimestamp,
        diff: failureTime - requestTimestamp,
        threshold: requestTimestamp - 300000,
        passes: failureTime >= requestTimestamp - 300000,
      });

      // 修改：时间窗口从 1 分钟扩大到 5 分钟（与查询窗口一致）
      if (failureTime >= requestTimestamp - 300000) {  // 300000 毫秒 = 5 分钟
        console.log("✅ Returning failure info to frontend");
        return respData({
          hasRecentPayment: false,
          hasFailedPayment: true,
          failureInfo: {
            planName: recentFailure.order.product_name,
            amount: recentFailure.order.amount,
            currency: recentFailure.order.currency,
            code: recentFailure.failure.code,
            message: recentFailure.failure.message,
            rawMessage: recentFailure.failure.rawMessage,
            failureAt: failureTimeStr,
          },
        });
      } else {
        console.log("❌ Failure time outside 5min window");
      }
    } else {
      console.log("ℹ️ No recent failure found");
    }

    return respData({ hasRecentPayment: false });
  } catch (error) {
    console.error('检查支付状态失败:', error);
    return respErr('检查失败');
  }
}
