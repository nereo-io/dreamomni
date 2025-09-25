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
        return respData({
          hasRecentPayment: true,
          paymentInfo: {
            planName: recentOrder.product_name,
            credits: recentOrder.credits,
            amount: recentOrder.amount,
            currency: recentOrder.currency,
            interval: recentOrder.interval,
            paidAt: recentOrder.paid_at,
          },
        });
      }
    }

    const recentFailure = await findRecentFailedPayment(user_uuid, 5);

    if (recentFailure) {
      const failureTimeStr =
        recentFailure.failure.failureAt || recentFailure.failure.recordedAt;
      const failureTime = failureTimeStr
        ? new Date(failureTimeStr).getTime()
        : Date.now();

      if (failureTime >= requestTimestamp - 60000) {
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
      }
    }

    return respData({ hasRecentPayment: false });
  } catch (error) {
    console.error('检查支付状态失败:', error);
    return respErr('检查失败');
  }
}
