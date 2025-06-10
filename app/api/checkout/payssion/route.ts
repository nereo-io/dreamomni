// Payssion 专用支付创建 API

import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder } from "@/models/order";
import { respData, respErr } from "@/lib/resp";
import { getSnowId } from "@/lib/hash";
import { getPaymentRouter } from "@/services/payment";
import { PaymentRequest } from "@/services/payment/types";
import { Order } from "@/types/order";

export async function POST(req: Request) {
  try {
    const {
      credits,
      currency = "USD",
      amount,
      interval,
      product_id,
      product_name,
      payment_method,
      valid_months,
      cancel_url,
      user_preference, // 允许用户手动选择支付提供商
    } = await req.json();

    // 验证基本参数
    if (!amount || !interval || !currency || !product_id || !payment_method) {
      return respErr(
        "参数不完整：需要 amount, interval, currency, product_id, payment_method"
      );
    }

    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("interval 参数无效");
    }

    const is_subscription = interval === "month" || interval === "year";

    if (interval === "year" && valid_months !== 12) {
      return respErr("年费套餐 valid_months 必须为 12");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("月费套餐 valid_months 必须为 1");
    }

    // 验证用户权限
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("请先登录");
    }

    // 获取用户邮箱
    let user_email = await getUserEmail();
    if (!user_email) {
      const { findUserByUuid } = await import("@/models/user");
      const user = await findUserByUuid(user_uuid);
      if (user) {
        user_email = user.email;
      }
    }
    if (!user_email) {
      return respErr("获取用户信息失败");
    }

    // 生成订单号
    const order_no = getSnowId();

    // 计算过期时间
    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    const timePeriod = new Date(currentDate);
    timePeriod.setMonth(currentDate.getMonth() + valid_months);

    const timePeriodMillis = timePeriod.getTime();
    let delayTimeMillis = 0;

    // 订阅服务延迟24小时过期
    if (is_subscription) {
      delayTimeMillis = 24 * 60 * 60 * 1000;
    }

    const newTimeMillis = timePeriodMillis + delayTimeMillis;
    const expired_at = new Date(newTimeMillis).toISOString();

    // 创建订单记录
    const order: Order = {
      order_no: order_no,
      created_at: created_at,
      user_uuid: user_uuid,
      user_email: user_email,
      amount: amount,
      interval: interval,
      expired_at: expired_at,
      status: "created",
      credits: credits,
      currency: currency,
      product_id: product_id,
      product_name: product_name,
      valid_months: valid_months,
      payment_provider: "payssion",
      payment_method: payment_method,
    };

    await insertOrder(order);

    // 准备支付请求
    const paymentRequest: PaymentRequest = {
      orderId: order_no,
      amount: amount / 100, // Payssion 使用实际金额，不是分
      currency: currency,
      paymentMethod: payment_method,
      userEmail: user_email,
      returnUrl:
        cancel_url ||
        process.env.PAYSSION_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`,
      notifyUrl:
        process.env.PAYSSION_NOTIFY_URL ||
        `${process.env.NEXT_PUBLIC_WEB_URL}/api/payssion/webhook`,
      description: `${product_name} - ${credits} credits`,
    };

    // 获取支付路由器并创建支付
    const paymentRouter = getPaymentRouter();

    // 从请求头获取地理位置信息（简单实现）
    const userLocation = {
      countryCode: req.headers.get("cf-ipcountry") || "US",
      country: req.headers.get("cf-ipcountry") || "US",
    };

    const result = await paymentRouter.createPayment(
      paymentRequest,
      userLocation,
      user_preference
    );

    if (result.success) {
      // 更新订单的支付提供商事务ID
      if (result.transactionId) {
        const { updateOrderSession } = await import("@/models/order");
        await updateOrderSession(
          order_no,
          result.transactionId,
          JSON.stringify(result)
        );
      }

      return respData({
        order_no: order_no,
        redirect_url: result.redirectUrl,
        transaction_id: result.transactionId,
        payment_provider: result.paymentProvider,
      });
    } else {
      return respErr(result.errorMessage || "支付创建失败");
    }
  } catch (error: any) {
    console.error("Payssion checkout error:", error);
    return respErr(`支付创建失败: ${error.message}`);
  }
}
