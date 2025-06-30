import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { findRecentPaidOrder } from "@/models/order";

export async function GET(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    // 查询用户最近 5 分钟内的成功订单
    const recentOrder = await findRecentPaidOrder(user_uuid, 5);

    if (!recentOrder) {
      return respData({ hasRecentPayment: false });
    }

    return respData({
      hasRecentPayment: true,
      paymentInfo: {
        planName: recentOrder.product_name,
        credits: recentOrder.credits,
        amount: recentOrder.amount,
        currency: recentOrder.currency,
        interval: recentOrder.interval,
        paidAt: recentOrder.paid_at
      }
    });
  } catch (error) {
    console.error('检查支付状态失败:', error);
    return respErr('检查失败');
  }
}