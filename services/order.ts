import {
  CreditsTransType,
  increaseCredits,
} from "./credit";
import {
  findOrderByOrderNo,
  updateOrderCredits,
  updateOrderStatus,
} from "@/models/order";
import { createOrUpdateMembership } from "./membership";
import { getIsoTimestr, getOneYearLaterTimestr } from "@/lib/time";
import Stripe from "stripe";
// import { updateAffiliateForOrder } from "./affiliate"; // 已移除邀请奖励功能
import {
  getAnyProductConfig,
  getBundleBonusCreditsForTier,
} from "@/config/products";
import { Order } from "@/types/order";
import { getUserHighestSubscriptionTier } from "@/services/subscriptionTier";
import { trackFirstPromoterSale } from "@/services/analytics/first-promoter";

function getStripeId(value: string | { id?: string } | null | undefined) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

function toIsoFromStripeTimestamp(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : undefined;
}

function normalizeStripeSubscriptionStatus(status?: string) {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
    case "unpaid":
      return status;
    default:
      return "active";
  }
}

async function syncStripeSubscriptionFromSession(
  session: Stripe.Checkout.Session,
  order: Order,
  stripe?: Stripe
) {
  const subscriptionId = getStripeId(session.subscription as any);
  if (!subscriptionId || order.interval === "one-time") {
    return;
  }

  try {
    const { upsertStripeSubscription } = await import(
      "@/models/stripe-subscription"
    );

    let subscription: any = null;
    if (stripe) {
      try {
        subscription = await stripe.subscriptions.retrieve(subscriptionId);
      } catch (error) {
        console.error("retrieve stripe subscription failed:", error);
      }
    }
    const currentPeriodStart =
      toIsoFromStripeTimestamp(subscription?.current_period_start) ||
      order.paid_at ||
      order.created_at;
    const currentPeriodEnd =
      toIsoFromStripeTimestamp(subscription?.current_period_end) ||
      order.expired_at;

    await upsertStripeSubscription({
      user_uuid: order.user_uuid,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: getStripeId(session.customer as any),
      stripe_session_id: session.id,
      plan_type: order.interval === "year" ? "yearly" : "monthly",
      amount: order.amount,
      currency: order.currency,
      status: normalizeStripeSubscriptionStatus(subscription?.status),
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      canceled_at: subscription?.canceled_at
        ? toIsoFromStripeTimestamp(subscription.canceled_at)
        : undefined,
      product_name: order.product_name,
      product_id: order.product_id,
    });
  } catch (error) {
    console.error("sync stripe subscription failed:", error);
  }
}

export async function handleOrderSession(
  session: Stripe.Checkout.Session,
  stripe?: Stripe
) {
  try {
    if (
      !session ||
      !session.metadata ||
      !session.metadata.order_no ||
      !session.metadata.user_uuid ||
      session.payment_status !== "paid"
    ) {
      throw new Error("invalid session");
    }

    const order_no = session.metadata.order_no;
    const user_uuid = session.metadata.user_uuid;

    // 打印订单和用户信息
    console.log("Processing order:", {
      order_no,
      user_uuid,
    });

    const paid_email =
      session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);

    const order = await findOrderByOrderNo(order_no);

    if (!order) {
      throw new Error("order not found");
    }

    // 已处理过，幂等返回
    if (order.status !== "created") {
      await syncStripeSubscriptionFromSession(session, order, stripe);
      console.log("Order already processed, skipping:", order_no);
      return;
    }

    const paid_at = getIsoTimestr();
    await updateOrderStatus(order_no, "paid", paid_at, paid_email, paid_detail);
    await syncStripeSubscriptionFromSession(
      session,
      { ...order, status: "paid", paid_at },
      stripe
    );

    // 处理订单类型
    const interval = order.interval;
    const product_id = order.product_id;
    const credits = session.metadata.credits; // 保留原始用法，用于会员类型判断

    console.log("Order details:", {
      interval,
      product_id,
      credits,
    });

    // 处理会员订阅或积分包购买
    console.log("Processing membership/credits purchase for user:", user_uuid);

    const config = product_id
      ? getAnyProductConfig(product_id)
      : undefined;
    let actualCreditsToIncrease = 0;

    if (config) {
      actualCreditsToIncrease = config.credits;
      // Only update membership for subscriptions (not bundles)
      // Bundle config doesn't have membershipType field
      if ('membershipType' in config && config.membershipType) {
        try {
          await createOrUpdateMembership(user_uuid, config.membershipType as "monthly" | "yearly");
        } catch (e) {
          console.log("update membership failed: ", e);
          throw e;
        }
      }
    }

    if (interval === "one-time" && product_id && actualCreditsToIncrease > 0) {
      const tier = await getUserHighestSubscriptionTier(user_uuid);
      const bonusCredits = getBundleBonusCreditsForTier(product_id, tier);
      actualCreditsToIncrease += bonusCredits;

      if (bonusCredits > 0) {
        await updateOrderCredits(order.order_no, actualCreditsToIncrease);
        order.credits = actualCreditsToIncrease;
      }

      console.log(
        `🎁 Stripe bundle bonus applied: +${bonusCredits} (tier=${tier}, product=${product_id})`
      );
    }

    // 1. 增加积分 (如果根据product_id确定了数量)
    if (actualCreditsToIncrease > 0) {
      await increaseCredits({
        user_uuid: user_uuid,
        trans_type: CreditsTransType.OrderPay,
        credits: actualCreditsToIncrease,
        order_no: order.order_no,
        expired_at: order.expired_at || getOneYearLaterTimestr(),
        payment_id: session.metadata.payment_id, // 从 metadata 获取 payment_id
      });
      console.log(
        `Increased ${actualCreditsToIncrease} credits for user ${user_uuid} for order ${order.order_no} (Product ID: ${product_id})`
      );
    } else {
      console.log(
        `No specific credit increase rule based on product_id ${product_id} for order ${order.order_no}. Only membership might be updated.`
      );
    }

    await trackFirstPromoterSale({
      orderNo: order.order_no,
      paymentProvider: "stripe",
      paymentId: getStripeId(session.payment_intent as any) || session.id,
      userUuid: order.user_uuid,
      email: paid_email || order.user_email,
      amount: order.amount,
      currency: order.currency,
    });

    console.log(
      "handle order session successed: ",
      order_no,
      paid_at,
      paid_email,
      paid_detail
    );
  } catch (e) {
    console.log("handle order session failed: ", e);
    throw e;
  }
}

// 处理发票付款成功事件
export async function handleInvoicePayment(
  invoice: Stripe.Invoice,
  stripe: Stripe
) {
  try {
    console.log("Processing invoice payment:", invoice.id);

    // 获取元数据 - 优先从subscription_details获取
    let metadata = invoice.subscription_details?.metadata || {};
    let user_uuid, order_no;
    let creditsIdentifierFromInvoice: string | undefined = undefined; // 用于会员类型判断
    let productIdFromInvoice: string | undefined = undefined;

    // 如果subscription_details中没有元数据，尝试其他位置
    if (!metadata || Object.keys(metadata).length === 0) {
      // 尝试invoice.metadata
      if (invoice.metadata && Object.keys(invoice.metadata).length > 0) {
        metadata = invoice.metadata;
      } else {
        // 最后尝试从行项目中获取
        const lineItem = invoice.lines.data[0];
        if (lineItem && lineItem.metadata) {
          metadata = lineItem.metadata;
        }
      }
    }

    // 从元数据中提取必要信息
    if (metadata) {
      user_uuid = metadata.user_uuid;
      order_no = metadata.order_no;
      creditsIdentifierFromInvoice = metadata.credits; // 保留原始用法
      productIdFromInvoice = metadata.product_id;
    }

    if (!user_uuid) {
      throw new Error("找不到用户UUID");
    }

    console.log("Invoice payment details:", {
      invoice_id: invoice.id,
      user_uuid,
      order_no,
      creditsIdentifier: creditsIdentifierFromInvoice,
      productId: productIdFromInvoice,
      billing_reason: invoice.billing_reason,
    });

    // 更新订单状态（如果有订单号）
    if (order_no) {
      const paid_email = invoice.customer_email || "";
      const paid_detail = JSON.stringify(invoice);
      const paid_at = getIsoTimestr();

      // 尝试更新订单状态（如果存在）
      try {
        const order = await findOrderByOrderNo(order_no);
        if (order) {
          await updateOrderStatus(
            order_no,
            "paid",
            paid_at,
            paid_email,
            paid_detail
          );
        }
      } catch (err) {
        console.log("更新订单状态失败，可能是续费没有对应订单:", err);
        // 续费可能没有对应的订单，继续处理会员更新
      }
    }

    // 产品配置映射
    const renewalConfig = productIdFromInvoice
      ? getAnyProductConfig(productIdFromInvoice)
      : undefined;
    let actualCreditsToIncreaseForRenewal = 0;

    if (renewalConfig) {
      actualCreditsToIncreaseForRenewal = renewalConfig.credits;
      // Only update membership for subscriptions (not bundles)
      if ('membershipType' in renewalConfig && renewalConfig.membershipType) {
        try {
          await createOrUpdateMembership(user_uuid, renewalConfig.membershipType as "monthly" | "yearly");
        } catch (e) {
          console.log("update membership failed for renewal: ", e);
          throw e;
        }
      }
    }

    // 优先处理增加积分的逻辑
    if (actualCreditsToIncreaseForRenewal > 0) {
      await increaseCredits({
        user_uuid: user_uuid,
        trans_type: CreditsTransType.OrderPay,
        credits: actualCreditsToIncreaseForRenewal,
        order_no: order_no || invoice.id,
        expired_at: getOneYearLaterTimestr(),
        payment_id: invoice.id, // 用 invoice.id 做幂等
      });
      console.log(
        `Increased ${actualCreditsToIncreaseForRenewal} credits for user ${user_uuid} due to invoice ${invoice.id} (Product ID: ${productIdFromInvoice})`
      );
    } else {
      console.log(
        `No specific credit increase rule for renewal (invoice ${invoice.id}) based on product_id ${productIdFromInvoice}. Only membership might be updated.`
      );
    }
    await trackFirstPromoterSale({
      orderNo: order_no || invoice.id,
      paymentProvider: "stripe",
      paymentId: invoice.id,
      userUuid: user_uuid,
      email: invoice.customer_email || "",
      amount: invoice.amount_paid,
      currency: invoice.currency,
    });
    console.log("Invoice payment processed successfully:", invoice.id);
  } catch (e) {
    console.log("handle invoice payment failed:", e);
    throw e;
  }
}
