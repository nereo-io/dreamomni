import {
  findOrderByOrderNo,
  updateOrderPaymentId,
  insertOrder,
  recordOrderPaymentFailure,
} from "@/models/order";
import { getIsoTimestr } from "@/lib/time";
import Stripe from "stripe";
// import { updateAffiliateForOrder } from "./affiliate"; // 已移除邀请奖励功能
import { getAnyProductConfig } from "@/config/products";
import { Order } from "@/types/order";
import {
  trackFirstPromoterCancellation,
} from "@/services/analytics/first-promoter";
import {
  resolveStripePaymentIdFromInvoice,
  resolveStripePaymentIdFromSession,
} from "@/lib/stripe-payment";
import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";
import { SubscriptionManagementService } from "@/services/payment/SubscriptionManagementService";

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

function resolveStripeInvoiceMetadata(invoice: Stripe.Invoice) {
  let metadata = invoice.subscription_details?.metadata || {};

  if (!metadata || Object.keys(metadata).length === 0) {
    if (invoice.metadata && Object.keys(invoice.metadata).length > 0) {
      metadata = invoice.metadata;
    } else {
      const lineItem = invoice.lines.data[0];
      if (lineItem && lineItem.metadata) {
        metadata = lineItem.metadata;
      }
    }
  }

  return metadata || {};
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

async function syncStripeSubscriptionFromInvoice(
  invoice: Stripe.Invoice,
  order: Order | undefined,
  productConfig: NonNullable<ReturnType<typeof getAnyProductConfig>>,
  stripe: Stripe
) {
  const subscriptionId = getStripeId(invoice.subscription as any);
  if (!subscriptionId || productConfig.interval === "one-time") {
    return;
  }

  try {
    const { upsertStripeSubscription } = await import(
      "@/models/stripe-subscription"
    );

    let subscription: any = null;
    if (stripe.subscriptions?.retrieve) {
      try {
        subscription = await stripe.subscriptions.retrieve(subscriptionId);
      } catch (error) {
        console.error("retrieve stripe subscription from invoice failed:", error);
      }
    }

    await upsertStripeSubscription({
      user_uuid:
        order?.user_uuid || invoice.subscription_details?.metadata?.user_uuid || "",
      stripe_subscription_id: subscriptionId,
      stripe_customer_id:
        getStripeId((invoice as any).customer) ||
        getStripeId(subscription?.customer),
      plan_type: productConfig.interval === "year" ? "yearly" : "monthly",
      amount: productConfig.amount,
      currency: productConfig.currency,
      status: normalizeStripeSubscriptionStatus(subscription?.status),
      current_period_start:
        toIsoFromStripeTimestamp(subscription?.current_period_start) ||
        order?.paid_at ||
        order?.created_at,
      current_period_end:
        toIsoFromStripeTimestamp(subscription?.current_period_end) ||
        order?.expired_at,
      canceled_at: subscription?.canceled_at
        ? toIsoFromStripeTimestamp(subscription.canceled_at)
        : undefined,
      product_name: productConfig.product_name,
      product_id: productConfig.product_id,
    });
  } catch (error) {
    console.error("sync stripe subscription from invoice failed:", error);
  }
}

async function syncStripeOrderPaymentIdFromSession(
  session: Stripe.Checkout.Session,
  order: Order,
  stripe?: Stripe
) {
  if (order.payment_id) {
    return order.payment_id;
  }

  try {
    const paymentId = await resolveStripePaymentIdFromSession(session, stripe);
    if (paymentId) {
      await updateOrderPaymentId(order.order_no, paymentId);
      return paymentId;
    }
  } catch (error) {
    console.error("sync stripe order payment id failed:", error);
  }

  return undefined;
}

async function trackStripeOfflineConversion(
  orderNo: string,
  order:
    | Pick<Order, "client_id" | "first_touch" | "last_touch">
    | undefined,
  amountCents: number
) {
  try {
    const { offlineConversionService } = await import(
      "@/services/analytics/yandex-offline-conversion"
    );
    const yclid = order?.last_touch?.yclid || order?.first_touch?.yclid;

    if (order?.client_id || yclid) {
      await offlineConversionService.trackPaymentSuccess(
        {
          clientId: order?.client_id || undefined,
          yclid,
        },
        orderNo,
        amountCents / 100
      );
    } else {
      console.error("stripe order missing client_id/yclid for conversion", {
        orderNo,
      });
    }
  } catch (error: any) {
    console.error(
      "track stripe offline conversion failed:",
      error?.message || error
    );
  }
}

async function resolveStripePaymentIdFromWebhookInvoice(
  invoice: Stripe.Invoice,
  stripe: Stripe
) {
  try {
    return await resolveStripePaymentIdFromInvoice(invoice, stripe);
  } catch (error) {
    console.error("resolve stripe invoice payment id failed:", error);
    return undefined;
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
      await syncStripeOrderPaymentIdFromSession(session, order, stripe);
      await syncStripeSubscriptionFromSession(session, order, stripe);
      console.log("Order already processed, skipping:", order_no);
      return;
    }

    const paymentId = await syncStripeOrderPaymentIdFromSession(
      session,
      order,
      stripe
    );
    const stripePaymentId =
      paymentId || getStripeId(session.payment_intent as any) || session.id;
    const paid_at = getIsoTimestr();
    const subscriptionId = getStripeId(session.subscription as any);

    const processingResult = await PaymentProcessingService.processPayment({
      paymentId: stripePaymentId,
      orderId: order_no,
      userUuid: user_uuid,
      amount: String(order.amount),
      subscriptionId,
      userEmail: paid_email || order.user_email,
      paymentMethod: "stripe",
      paymentProvider: "stripe",
      metadata: {
        credits: order.credits,
        product_id: order.product_id,
        product_name: order.product_name,
        interval: order.interval,
        valid_months: order.valid_months,
        stripe_session_id: session.id,
      },
    });

    if (!processingResult.success) {
      throw new Error(
        `stripe payment processing failed: ${processingResult.error}`
      );
    }

    await syncStripeSubscriptionFromSession(
      session,
      { ...order, status: "paid", paid_at },
      stripe
    );

    if (subscriptionId && order.interval !== "one-time") {
      try {
        await SubscriptionManagementService.cancelOtherSubscriptions(
          user_uuid,
          subscriptionId,
          "stripe"
        );
      } catch (cancelError: any) {
        console.error(
          "cancel other subscriptions after stripe purchase failed:",
          cancelError.message
        );
      }
    }

    await trackStripeOfflineConversion(order_no, order, order.amount);

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
    let metadata = resolveStripeInvoiceMetadata(invoice);
    let user_uuid, order_no;
    let creditsIdentifierFromInvoice: string | undefined = undefined; // 用于会员类型判断
    let productIdFromInvoice: string | undefined = undefined;

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

    const renewalConfig = productIdFromInvoice
      ? getAnyProductConfig(productIdFromInvoice)
      : undefined;

    if (!renewalConfig) {
      console.log(
        `No specific credit increase rule for renewal (invoice ${invoice.id}) based on product_id ${productIdFromInvoice}. Only membership might be updated.`
      );
      return;
    }

    const resolvedPaymentId = await resolveStripePaymentIdFromWebhookInvoice(
      invoice,
      stripe
    );
    const paymentId = resolvedPaymentId || invoice.id;
    const renewalOrderNo = `RNW_${paymentId}`;
    const subscriptionId = getStripeId(invoice.subscription as any);

    const isProcessed =
      await PaymentProcessingService.checkPaymentAlreadyProcessed(
        renewalOrderNo,
        paymentId
      );

    if (isProcessed) {
      console.log("Stripe renewal already processed, skipping:", {
        invoiceId: invoice.id,
        paymentId,
        renewalOrderNo,
      });
      return;
    }

    const originalOrder = order_no
      ? await findOrderByOrderNo(order_no)
      : undefined;
    const existingRenewalOrder = await findOrderByOrderNo(renewalOrderNo);

    if (!existingRenewalOrder) {
      const currentDate = new Date();
      const expiredDate = new Date(currentDate);
      expiredDate.setMonth(
        currentDate.getMonth() + renewalConfig.valid_months
      );
      expiredDate.setTime(expiredDate.getTime() + 24 * 60 * 60 * 1000);

      await insertOrder({
        order_no: renewalOrderNo,
        user_uuid,
        user_email:
          invoice.customer_email || originalOrder?.user_email || "",
        amount: renewalConfig.amount,
        currency: renewalConfig.currency,
        product_id: renewalConfig.product_id,
        product_name: renewalConfig.product_name,
        interval: renewalConfig.interval,
        expired_at: expiredDate.toISOString(),
        status: "paid",
        is_renewal: true,
        payment_id: paymentId,
        payment_provider: "stripe",
        credits: renewalConfig.credits,
        client_id: originalOrder?.client_id || undefined,
        first_touch: originalOrder?.first_touch || null,
        last_touch: originalOrder?.last_touch || null,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_monthly_distribution:
          originalOrder?.is_monthly_distribution ??
          renewalConfig.interval === "year",
      });
    }

    const processingResult = await PaymentProcessingService.processPayment({
      paymentId,
      orderId: renewalOrderNo,
      userUuid: user_uuid,
      amount: String(renewalConfig.amount),
      subscriptionId,
      userEmail: invoice.customer_email || originalOrder?.user_email || "",
      paymentMethod: "stripe",
      paymentProvider: "stripe",
      metadata: {
        credits: renewalConfig.credits,
        product_id: renewalConfig.product_id,
        product_name: renewalConfig.product_name,
        interval: renewalConfig.interval,
        valid_months: renewalConfig.valid_months,
        stripe_invoice_id: invoice.id,
      },
    });

    if (!processingResult.success) {
      throw new Error(
        `stripe renewal processing failed: ${processingResult.error}`
      );
    }

    await syncStripeSubscriptionFromInvoice(
      invoice,
      originalOrder,
      renewalConfig,
      stripe
    );
    await trackStripeOfflineConversion(
      renewalOrderNo,
      originalOrder,
      renewalConfig.amount
    );

    console.log("Invoice payment processed successfully:", invoice.id);
  } catch (e) {
    console.log("handle invoice payment failed:", e);
    throw e;
  }
}

export async function handleStripeInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const metadata = resolveStripeInvoiceMetadata(invoice);
    const orderNo = metadata.order_no;

    if (!orderNo) {
      throw new Error(`stripe invoice ${invoice.id} missing order_no metadata`);
    }

    const paymentIntent =
      typeof invoice.payment_intent === "string" ? null : invoice.payment_intent;
    const paymentError = (paymentIntent as any)?.last_payment_error || {};
    const failureCode =
      paymentError.code ||
      paymentError.decline_code ||
      invoice.status ||
      "payment_failed";
    const failureMessage =
      paymentError.message || "Stripe invoice payment failed";

    await recordOrderPaymentFailure(orderNo, {
      code: failureCode,
      message: failureMessage,
      rawMessage: paymentError.message,
      provider: "stripe",
      failureAt: new Date().toISOString(),
      eventId: invoice.id,
    });
  } catch (e) {
    console.log("handle stripe invoice payment failed event failed:", e);
    throw e;
  }
}

export async function handleStripeCheckoutSessionFailure(
  session: Stripe.Checkout.Session,
  failure: { code: string; message: string; rawMessage?: string }
) {
  const orderNo = session.metadata?.order_no;

  if (!orderNo) {
    throw new Error(
      `stripe checkout session ${session.id} missing order_no metadata`
    );
  }

  await recordOrderPaymentFailure(orderNo, {
    code: failure.code,
    message: failure.message,
    rawMessage: failure.rawMessage,
    provider: "stripe",
    failureAt: new Date().toISOString(),
    eventId: session.id,
  });
}

export async function handleStripeCheckoutSessionExpired(
  session: Stripe.Checkout.Session
) {
  await handleStripeCheckoutSessionFailure(session, {
    code: "checkout_expired",
    message: "Stripe checkout session expired before payment completed",
  });
}

export async function handleStripeSubscriptionCanceled(
  subscription: Stripe.Subscription
) {
  const subscriptionId = subscription.id;

  try {
    const {
      findStripeSubscriptionByStripeId,
      updateStripeSubscriptionStatus,
    } = await import("@/models/stripe-subscription");
    const localSubscription =
      await findStripeSubscriptionByStripeId(subscriptionId);

    if (!localSubscription) {
      console.log("stripe subscription not found for cancellation:", {
        subscriptionId,
      });
      return;
    }

    if (localSubscription.status === "canceled") {
      return;
    }

    await updateStripeSubscriptionStatus(subscriptionId, "canceled");
    await trackFirstPromoterCancellation({
      paymentProvider: "stripe",
      subscriptionId,
      userUuid: localSubscription.user_uuid,
    });
  } catch (error) {
    console.error("handle stripe subscription cancellation failed:", error);
  }
}
