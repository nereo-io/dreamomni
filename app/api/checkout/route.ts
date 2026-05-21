import { getUserEmail, getUserUuid } from "@/services/user";
import { insertOrder, updateOrderSession } from "@/models/order";
import { respData, respErr } from "@/lib/resp";

import { Order } from "@/types/order";
import Stripe from "stripe";
import { findUserByUuid, updateUserAttribution } from "@/models/user";
import { getSnowId } from "@/lib/hash";
import { getAnyProductConfig, getStripePriceId } from "@/config/products";
import {
  getAttributionFromCookie,
  isDirectSnapshot,
  isSnapshotNewer,
  resolveAttribution,
} from "@/lib/attribution";
import { getClientIdFromCookie } from "@/lib/yandex-metrica";
import { getPublicWebUrl, getTrimmedEnv } from "@/lib/env";

// 延迟初始化 Stripe 客户端，避免构建时错误
function getStripeClient() {
  const privateKey = getTrimmedEnv("STRIPE_PRIVATE_KEY");
  if (!privateKey) {
    throw new Error("STRIPE_PRIVATE_KEY environment variable is not set");
  }
  return new Stripe(privateKey);
}

export async function POST(req: Request) {
  try {
    let {
      credits,
      currency,
      amount,
      interval,
      product_id,
      product_name,
      product_type,
      product_slug,
      valid_months,
      cancel_url,
    } = await req.json();

    if (!cancel_url) {
      cancel_url = `${process.env.NEXT_PUBLIC_PAY_CANCEL_URL || getPublicWebUrl()}`;
    }

    if (!amount || !interval || !currency || !product_id) {
      return respErr("invalid params");
    }

    if (!["year", "month", "one-time"].includes(interval)) {
      return respErr("invalid interval");
    }

    const is_subscription = interval === "month" || interval === "year";
    const productConfig = getAnyProductConfig(product_id);
    const stripePriceId =
      productConfig &&
      productConfig.amount === amount &&
      productConfig.currency.toLowerCase() === currency.toLowerCase() &&
      productConfig.interval === interval
        ? getStripePriceId(product_id)
        : undefined;

    if (interval === "year" && valid_months !== 12) {
      return respErr("invalid valid_months");
    }

    if (interval === "month" && valid_months !== 1) {
      return respErr("invalid valid_months");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth, please sign-in");
    }

    let user_email = await getUserEmail();
    const userRecord = await findUserByUuid(user_uuid);
    if (!user_email && userRecord) {
      user_email = userRecord.email;
    }
    if (!user_email) {
      return respErr("invalid user");
    }

    const cookieHeader = req.headers.get("cookie") || "";
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

    const order_no = getSnowId();

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
      // 临时注释掉，等待数据库结构更新
      // product_type: product_type,
      valid_months: valid_months,
      client_id: clientId,
      first_touch: resolvedAttribution.first_touch,
      last_touch: resolvedAttribution.last_touch,
      is_renewal: false,
    };
    await insertOrder(order);

    let options: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        stripePriceId
          ? {
              price: stripePriceId,
              quantity: 1,
            }
          : {
              price_data: {
                currency: currency,
                product_data: {
                  name: product_name,
                },
                unit_amount: amount,
                recurring: is_subscription
                  ? {
                      interval: interval,
                    }
                  : undefined,
              },
              quantity: 1,
            },
      ],
      allow_promotion_codes: true,
      metadata: {
        project: process.env.NEXT_PUBLIC_PROJECT_NAME || "",
        product_name: product_name,
        product_type: product_type,
        product_id: product_id,
        product_slug: product_slug,
        order_no: order_no.toString(),
        user_email: user_email,
        credits: credits,
        user_uuid: user_uuid,
      },
      mode: is_subscription ? "subscription" : "payment",
      success_url: `${getPublicWebUrl()}/pay-success/{CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url,
    };

    if (user_email) {
      options.customer_email = user_email;
    }

    if (is_subscription) {
      options.subscription_data = {
        metadata: options.metadata,
      };
    }

    if (currency === "cny") {
      options.payment_method_types = ["wechat_pay", "card"];
      options.payment_method_options = {
        wechat_pay: {
          client: "web",
        },
      };
    }

    const order_detail = JSON.stringify(options);

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(options);

    const stripe_session_id = session.id;
    await updateOrderSession(order_no, stripe_session_id, order_detail);

    return respData({
      public_key: getTrimmedEnv("STRIPE_PUBLIC_KEY"),
      order_no: order_no,
      session_id: stripe_session_id,
    });
  } catch (e: any) {
    console.log("checkout failed: ", e);
    return respErr("checkout failed: " + e.message);
  }
}
