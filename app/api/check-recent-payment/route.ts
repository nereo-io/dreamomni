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

    // 获取支付时间戳参数
    const { searchParams } = new URL(req.url);
    const paymentTimestamp = searchParams.get('timestamp');
    
    if (!paymentTimestamp) {
      return respData({ hasRecentPayment: false });
    }

    // 查询用户最近 5 分钟内的成功订单
    const recentOrder = await findRecentPaidOrder(user_uuid, 5);

    if (!recentOrder) {
      return respData({ hasRecentPayment: false });
    }

    // 检查订单创建时间是否在支付时间戳之后（允许60秒误差）
    const orderCreatedTime = new Date(recentOrder.created_at).getTime();
    const requestTimestamp = parseInt(paymentTimestamp);
    
    // 只有在支付发起后创建的订单才显示弹窗（允许60秒前的订单）
    if (orderCreatedTime < requestTimestamp - 60000) {
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