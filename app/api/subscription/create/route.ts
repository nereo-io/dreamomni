import { NextRequest } from "next/server";
import { respErr, respJson, respData } from "@/lib/resp";
import { getUserUuid, getUserEmail } from "@/services/user";
import { findUserByUuid } from "@/models/user";
import { getPaymentRouter } from "@/services/payment";
import { MandateRequest } from "@/services/payment/types";
import { insertOrder } from "@/models/order";
import { Order } from "@/types/order";
import { getSnowId } from "@/lib/hash";
import { getPayssionConfig } from "@/config/payssion";

// 日志函数 - 只输出到控制台，不写入文件
function logError(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${
    data ? "\n" + JSON.stringify(data, null, 2) : ""
  }\n`;
  console.error(logEntry);
}

export async function POST(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();

    if (!user_uuid) {
      logError("❌ 用户未认证");
      return respErr("no auth, please sign-in");
    }

    const body = await req.json();
    logError("🚀 创建订阅", {
      product_id: body.product_id,
      payment_method: body.payment_method,
    });

    let {
      credits,
      currency = "USD",
      amount,
      interval,
      product_id,
      product_name,
      product_type,
      product_slug,
      valid_months,
      payment_method,
    } = body;

    const config = getPayssionConfig();
    const returnUrl = config.subscription.defaultReturnUrl;

    // 验证必要参数
    if (!amount || !interval || !currency || !product_id || !payment_method) {
      logError("❌ 缺少必要参数");
      return respErr("invalid params");
    }

    if (!["year", "month"].includes(interval)) {
      logError("❌ 无效的订阅类型", { interval });
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
    }

    let user_email = await getUserEmail();
    if (!user_email) {
      const user = await findUserByUuid(user_uuid);
      if (user) {
        user_email = user.email;
      }
    }
    if (!user_email) {
      logError("❌ 用户邮箱不存在");
      return respErr("invalid user");
    }

    // 创建订单号
    const order_no = getSnowId();

    if (!order_no) {
      logError("❌ 订单号生成失败");
      return respErr("Order number generation failed");
    }

    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    let expired_at = "";

    const timePeriod = new Date(currentDate);
    timePeriod.setMonth(currentDate.getMonth() + valid_months);

    const timePeriodMillis = timePeriod.getTime();
    let delayTimeMillis = 0;

    // subscription
    if (is_subscription) {
      delayTimeMillis = 24 * 60 * 60 * 1000; // delay 24 hours expired
    }

    const newTimeMillis = timePeriodMillis + delayTimeMillis;
    const newDate = new Date(newTimeMillis);

    expired_at = newDate.toISOString();

    // 创建订单
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

    // 直接使用 PaymentRouter 创建订阅
    const paymentRouter = getPaymentRouter();

    // 构建 mandate 请求 - 使用与 checkout 一致的 metadata 结构
    const mandateRequest: MandateRequest = {
      userUuid: user_uuid,
      userEmail: user_email,
      paymentMethod: payment_method,
      returnUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`,
      // returnUrl: `https://www.veo3.com/pricing`,
      reference: `mdt${order_no}`,
      metadata: {
        project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
        product_name: product_name,
        product_type: product_type,
        product_id: product_id,
        product_slug: product_slug,
        order_no: order_no ? order_no.toString() : "",
        user_email: user_email,
        credits: credits,
        user_uuid: user_uuid,
        interval: interval,
        amount: amount,
        currency: currency,
      },
    };

    const result = await paymentRouter.createMandate(mandateRequest);

    if (result.success) {
      // 更新订单详情 - 与 Stripe 保持一致
      const { updateOrderSession } = await import("@/models/order");
      const order_detail = JSON.stringify(mandateRequest);

      await updateOrderSession(order_no, result.mandateId || "", order_detail);
    }

    return respData({
      success: result.success,
      order_no: order_no,
      mandateId: result.mandateId,
      redirect_url: result.redirectUrl, // 用户需要访问的授权 URL
      subscriptionId: result.subscriptionId, // 如果直接创建了订阅
      status: result.status, // 用于判断是否需要跳转
      errorMessage: result.errorMessage,
    });
  } catch (error: any) {
    logError("🚨 订阅创建异常", error.message);
    return respErr("checkout failed: " + error.message);
  }
}
