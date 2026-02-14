import { NextRequest } from "next/server";
import { respErr, respJson, respData } from "@/lib/resp";
import { getUserUuid, getUserEmail } from "@/services/user";
import { findUserByUuid, updateUserAttribution } from "@/models/user";
import { getPaymentRouter } from "@/services/payment";
import { MandateRequest } from "@/services/payment/types";
import { insertOrder } from "@/models/order";
import { getClientIdFromCookie } from "@/lib/yandex-metrica";
import {
  getAttributionFromCookie,
  isDirectSnapshot,
  isSnapshotNewer,
  resolveAttribution,
} from "@/lib/attribution";
import { Order } from "@/types/order";
import { getSnowId } from "@/lib/hash";
import { getPayssionConfig } from "@/config/payssion";
import { getPaymentProvider } from "@/lib/payment-methods";
import { findActiveSubscriptionsByUserUuid } from "@/models/subscription";
import { findActiveCreemSubscriptionsByUserUuid } from "@/models/creem-subscription";
import { getAnyProductConfig } from "@/config/products";

// 日志函数 - 只输出到控制台，不写入文件
function logInfo(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

function logError(message: string, data?: any) {
  console.error(
    `[ERROR] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const user_uuid = await getUserUuid();

    if (!user_uuid) {
      logError("❌ 用户未认证");
      return respErr("no auth, please sign-in");
    }

    const body = await req.json();
    logInfo("🚀 创建订阅", {
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

    const productConfig = product_id ? getAnyProductConfig(product_id) : undefined;
    if (!productConfig) {
      logError("❌ Invalid product_id", { product_id });
      return respErr("invalid product_id");
    }

    // Server-trust the product config (prevents client-side tampering).
    credits = productConfig.credits;
    currency = productConfig.currency;
    amount = productConfig.amount;
    interval = productConfig.interval;
    valid_months = productConfig.valid_months;
    product_name = productConfig.product_name;
    product_type = interval === "one-time" ? "bundle" : "subscription";

    const config = getPayssionConfig();
    const returnUrl = config.subscription.defaultReturnUrl;

    // 验证必要参数
    if (!amount || !interval || !currency || !product_id || !payment_method) {
      logError("❌ 缺少必要参数");
      return respErr("invalid params");
    }

    if (!["year", "month", "one-time"].includes(interval)) {
      logError("❌ 无效的订阅类型", { interval });
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";
    const is_bundle = interval === "one-time";

    // 新增：年订阅标记为按月发放
    const isMonthlyDistribution = interval === "year";

    // Bundle purchase requires active subscription
    if (is_bundle) {
      const [payssionSubscriptions, creemSubscriptions] = await Promise.all([
        findActiveSubscriptionsByUserUuid(user_uuid),
        findActiveCreemSubscriptionsByUserUuid(user_uuid),
      ]);

      const hasActiveSubscription =
        payssionSubscriptions.length > 0 || creemSubscriptions.length > 0;

      if (!hasActiveSubscription) {
        logError("❌ Bundle purchase requires active subscription", { user_uuid });
        return respErr("Active subscription required to purchase credit bundles");
      }
    }

    // 仅对订阅验证 valid_months
    if (is_subscription) {
      if (interval === "year" && valid_months !== 12) {
        return respErr("invalid valid_months");
      }

      if (interval === "month" && valid_months !== 1) {
        return respErr("invalid valid_months");
      }
    }

    let user_email = await getUserEmail();
    const userRecord = await findUserByUuid(user_uuid);
    if (!user_email && userRecord) {
      user_email = userRecord.email;
    }
    if (!user_email) {
      logError("❌ 用户邮箱不存在");
      return respErr("invalid user");
    }

    // Extract clientID from cookies for Yandex Metrica offline conversion tracking
    const cookieHeader = req.headers.get('cookie') || '';
    const clientId = getClientIdFromCookie(cookieHeader);
    const cookieAttribution = getAttributionFromCookie(cookieHeader);
    const cookieLastTouch = cookieAttribution?.last_touch ?? null;
    const resolvedAttribution = resolveAttribution({
      userAttribution: {
        first_touch: userRecord?.first_touch ?? null,
        last_touch: userRecord?.last_touch ?? null,
      },
      cookieAttribution,
      requestUrl: req.url,
      requestReferrer: req.headers.get("referer"),
      allowDirectFallback: false,
    });

    const shouldUpdateFirstTouch =
      !userRecord?.first_touch &&
      !!resolvedAttribution.first_touch &&
      !isDirectSnapshot(resolvedAttribution.first_touch);
    const shouldUpdateLastTouch =
      !!cookieLastTouch &&
      !isDirectSnapshot(cookieLastTouch) &&
      isSnapshotNewer(cookieLastTouch, userRecord?.last_touch);

    if (userRecord?.uuid && (shouldUpdateFirstTouch || shouldUpdateLastTouch)) {
      await updateUserAttribution(userRecord.uuid, {
        first_touch: shouldUpdateFirstTouch
          ? resolvedAttribution.first_touch
          : null,
        last_touch: shouldUpdateLastTouch ? cookieLastTouch : null,
      });
    }
    const requestHost =
      req.headers.get("x-forwarded-host") || req.headers.get("host");
    const requestReferer = req.headers.get("referer");
    const requestUserAgent = req.headers.get("user-agent");

    // 创建订单号
    const order_no = getSnowId();

    if (!order_no) {
      logError("❌ 订单号生成失败");
      return respErr("Order number generation failed");
    }

    const currentDate = new Date();
    const created_at = currentDate.toISOString();

    let expired_at = "";

    // Bundle: 使用 valid_months（默认1个月），无延迟
    // Subscription: 使用 valid_months + 24小时延迟
    const bundleValidMonths = is_bundle ? (valid_months || 1) : valid_months;
    const timePeriod = new Date(currentDate);
    timePeriod.setMonth(currentDate.getMonth() + bundleValidMonths);

    const timePeriodMillis = timePeriod.getTime();
    let delayTimeMillis = 0;

    // subscription only: add 24 hours buffer
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
      product_type: product_type,
      valid_months: valid_months,
      payment_provider: getPaymentProvider(payment_method),
      payment_method: payment_method,
      client_id: clientId, // Add clientID for offline conversion tracking
      first_touch: resolvedAttribution.first_touch,
      last_touch: resolvedAttribution.last_touch,
      is_renewal: false,
      is_monthly_distribution: isMonthlyDistribution, // 新增字段
    };
    await insertOrder(order);

    // TEMP: audit tracking for client_id gaps; remove after data collection.
    try {
      const { insertOrderTrackingAudit } = await import(
        "@/models/orderTrackingAudit"
      );

      await insertOrderTrackingAudit({
        order_no: order_no,
        user_uuid: user_uuid,
        payment_provider: order.payment_provider,
        payment_method: payment_method,
        has_client_id: !!clientId,
        request_host: requestHost || undefined,
        request_referer: requestReferer || undefined,
        request_user_agent: requestUserAgent || undefined,
      });
    } catch (auditError: any) {
      logError("⚠️ 订单追踪审计写入失败", {
        order_no,
        error: auditError?.message || String(auditError),
      });
    }

    // 直接使用 PaymentRouter 创建订阅
    const paymentRouter = getPaymentRouter();

    // 构建 mandate 请求 - 使用与 checkout 一致的 metadata 结构
    const mandateRequest: MandateRequest = {
      userUuid: user_uuid,
      userEmail: user_email,
      paymentMethod: payment_method,
      returnUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`,
      // returnUrl: `https://www.veo3ai.io/pricing`,
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
