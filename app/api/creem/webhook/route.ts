import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { findOrderByOrderNo } from "@/models/order";
import { findUserByUuid } from "@/models/user";
import { getProductConfig, getBundleConfig, getAnyProductConfig } from "@/config/products";
import { getCreemConfig } from "@/config/creem";
import * as crypto from "crypto";
import {
  createCreemSubscription,
  findCreemSubscriptionByCreemId,
  updateCreemSubscriptionStatus,
} from "@/models/creem-subscription";
import { offlineConversionService } from "@/services/analytics/yandex-offline-conversion";
import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";
import { SubscriptionManagementService } from "@/services/payment/SubscriptionManagementService";

// 日志函数
function logInfo(message: string, data?: any) {
  console.log(
    `[CREEM-WEBHOOK] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

function logError(message: string, data?: any) {
  console.error(
    `[CREEM-WEBHOOK] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

function resolveCheckoutPaymentId(checkoutObject: any): {
  paymentId?: string;
  source?: string;
} {
  const order = checkoutObject?.order;
  if (order?.transaction) {
    return { paymentId: order.transaction, source: "order.transaction" };
  }
  if (order?.id) {
    return { paymentId: order.id, source: "order.id" };
  }
  if (checkoutObject?.id) {
    return { paymentId: checkoutObject.id, source: "checkout.id" };
  }
  if (checkoutObject?.request_id) {
    return { paymentId: checkoutObject.request_id, source: "request_id" };
  }
  return {};
}

async function hasOrderPayCredit(orderNo: string): Promise<boolean> {
  const { findOrderPayCreditByOrderNo } = await import("@/models/credit");
  const credit = await findOrderPayCreditByOrderNo(orderNo);
  return !!credit;
}

/**
 * 验证 Creem webhook 签名
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload, "utf8");
    const expectedSignature = hmac.digest("hex");

    // 使用 timingSafeEqual 防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (error) {
    logError("❌ Signature verification error", error);
    return false;
  }
}

/**
 * Creem Webhook 处理器
 * 处理 Creem 支付相关的 webhook 事件
 */
export async function POST(req: NextRequest) {
  try {
    // 获取原始请求体用于签名验证
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    logInfo("🔔 Received Creem webhook", {
      eventType: body.eventType,
      eventId: body.id,
      hasObject: !!body.object,
    });

    // 验证 webhook 签名
    const signature =
      req.headers.get("creem-signature") ||
      req.headers.get("x-creem-signature");

    if (!signature) {
      logError("❌ No signature header found");
      return respErr("Missing webhook signature");
    }

    try {
      const config = getCreemConfig();
      if (!verifyWebhookSignature(rawBody, signature, config.webhookSecret)) {
        logError("❌ Invalid webhook signature");
        return respErr("Invalid webhook signature");
      }
      logInfo("✅ Webhook signature verified");
    } catch (error) {
      logError("❌ Signature verification failed", error);
      return respErr("Signature verification failed");
    }

    // 根据不同的事件类型处理业务逻辑
    switch (body.eventType) {
      case "checkout.completed":
        await handleCheckoutCompleted(body);
        break;
      case "subscription.paid":
        await handleSubscriptionPaid(body);
        break;
      default:
        logInfo("ℹ️ Unhandled event type", { eventType: body.eventType });
    }

    return respData({ received: true });
  } catch (error: any) {
    logError("🚨 Webhook processing error", error.message);
    return respErr("Webhook processing failed: " + error.message);
  }
}

/**
 * 处理首次购买完成事件
 * checkout.completed 事件只在用户首次购买订阅时触发
 * 续费由 subscription.paid 事件处理
 */
async function handleCheckoutCompleted(webhookData: any) {
  try {
    const checkoutObject = webhookData.object;
    const checkoutId = checkoutObject?.id;
    const metadata = checkoutObject?.metadata;
    const order = checkoutObject?.order;
    const subscription = checkoutObject?.subscription;
    const customer = checkoutObject?.customer;

    // 使用 transaction ID 作为唯一支付标识（与续费逻辑保持一致）
    // 如果缺失，则按顺序 fallback 到 order.id / checkout.id / request_id
    const { paymentId: transactionId, source: paymentIdSource } =
      resolveCheckoutPaymentId(checkoutObject);

    if (!transactionId) {
      logError("❌ Missing payment identifier in checkout payload", {
        checkoutId,
        hasOrder: !!order,
        webhookData,
      });
      return;
    }

    logInfo("🛒 Processing first-time checkout", {
      checkoutId,
      transactionId,
      paymentIdSource,
      eventId: webhookData.id,
    });

    // 从 metadata 中获取必要信息
    const userUuid = metadata?.user_uuid;
    const userEmail = metadata?.user_email;
    const productId = metadata?.product_id; // 我们的内部产品ID
    const orderNo = metadata?.order_no; // 使用我们传入的原始订单号，而不是 Creem 的

    if (!userUuid || !productId || !orderNo) {
      logError("❌ Missing required metadata", {
        userUuid,
        productId,
        orderNo,
        metadata,
      });
      return;
    }

    // 获取产品配置（支持订阅和 Bundle）
    const productConfig = getAnyProductConfig(productId);
    if (!productConfig) {
      logError("❌ Product configuration not found", { productId });
      return;
    }

    const isBundle = productConfig.interval === "one-time";

    // 检查用户是否存在
    const user = await findUserByUuid(userUuid);
    if (!user) {
      logError("❌ User not found", { userUuid });
      return;
    }

    let shouldProcessPayment = true;

    const alreadyCredited = await hasOrderPayCredit(orderNo);
    if (alreadyCredited) {
      shouldProcessPayment = false;
      logInfo("⚠️ Order already credited, skip payment processing", {
        transactionId,
        paymentIdSource,
        checkoutId,
        orderNo,
        eventId: webhookData.id,
      });
    } else {
      // 幂等性检查 - 使用 orderNo + transactionId 组合
      const isProcessed =
        await PaymentProcessingService.checkPaymentAlreadyProcessed(
          orderNo,
          transactionId
        );

      if (isProcessed) {
        shouldProcessPayment = false;
        logInfo("⚠️ Webhook already processed, skipping payment processing", {
          transactionId,
          paymentIdSource,
          checkoutId,
          orderNo,
          eventType: webhookData.eventType,
          eventId: webhookData.id,
        });
      }
    }

    if (shouldProcessPayment) {
      // 首次订阅：更新原订单的 payment_id
      const { updateOrderPaymentId } = await import("@/models/order");
      await updateOrderPaymentId(orderNo, transactionId);

      logInfo("✅ 首次购买订单 payment_id 已更新", {
        orderNo,
        paymentId: transactionId,
        paymentIdSource,
        checkoutId,
      });

    // 使用 PaymentProcessingService 处理支付
    const processingResult = await PaymentProcessingService.processPayment({
      paymentId: transactionId,
      orderId: orderNo,
      userUuid,
      amount: productConfig.amount.toString(),
      userEmail: userEmail || customer?.email || "",
      metadata: {
        credits: productConfig.credits,
        product_id: productId,
        product_name: productConfig.product_name,
        interval: productConfig.interval,
        valid_months: productConfig.valid_months,
        // Bundle 不需要 membershipType
        ...(!isBundle && "membershipType" in productConfig
          ? { membershipType: productConfig.membershipType }
          : {}),
      },
    });

      if (!processingResult.success) {
        logError("❌ Payment processing failed", {
          transactionId,
          checkoutId,
          orderNo,
          error: processingResult.error,
        });
        return;
      }

      logInfo("✅ Payment processed successfully", {
        transactionId,
        checkoutId,
        orderNo,
        creditsAwarded: processingResult.creditsAwarded,
        membershipUpdated: processingResult.membershipUpdated,
      });
    }

    // 创建或更新 Creem 订阅记录 - 仅订阅，Bundle 不创建订阅记录
    if (!isBundle) {
      try {
        if (subscription?.id) {
          // 检查订阅记录是否已存在
          const existingSubscription = await findCreemSubscriptionByCreemId(
            subscription.id
          );

          if (!existingSubscription) {
            // 创建新的订阅记录
            await createCreemSubscription({
              user_uuid: userUuid,
              creem_subscription_id: subscription.id,
              creem_customer_id: subscription.customer,
              plan_type:
                productConfig.interval === "month" ? "monthly" : "yearly",
              amount: productConfig.amount,
              currency: productConfig.currency,
              status: subscription.status || "active",
              current_period_start: subscription.current_period_start_date,
              current_period_end: subscription.current_period_end_date,
              product_name: productConfig.product_name,
              product_id: productConfig.product_id,
              creem_product_id: checkoutObject?.product?.id,
              checkout_id: checkoutObject?.id,
            });

            logInfo("✅ Creem subscription record created", {
              subscriptionId: subscription.id,
              userUuid,
              productName: productConfig.product_name,
            });

            // 取消用户其他订阅的自动续费（新订阅成功后）
            try {
              const cancelResult = await SubscriptionManagementService.cancelOtherSubscriptions(
                userUuid,
                subscription.id,
                "creem"
              );
              logInfo("✅ 其他订阅取消结果", {
                canceledCount: cancelResult.canceledCount,
                failedCount: cancelResult.failedCount,
              });
            } catch (cancelError: any) {
              logError("⚠️ 取消其他订阅失败（不影响新订阅）", cancelError.message);
            }
          } else {
            // 更新现有订阅记录
            await updateCreemSubscriptionStatus(
              subscription.id,
              subscription.status || "active",
              {
                current_period_start: subscription.current_period_start_date,
                current_period_end: subscription.current_period_end_date,
              }
            );

            logInfo("✅ Creem subscription record updated", {
              subscriptionId: subscription.id,
              status: subscription.status,
            });
          }
        }
      } catch (subscriptionError: any) {
        logError(
          "⚠️ Failed to create/update subscription record",
          subscriptionError.message
        );
        // 即使订阅记录创建失败，也不影响支付成功的处理
      }
    } else {
      logInfo("📦 Bundle purchase - skipping subscription record creation", {
        productId,
        orderNo,
      });
    }

    // Track offline conversion for Yandex Metrica
    try {
      const orderData = await findOrderByOrderNo(orderNo);
      if (orderData?.client_id) {
        const success = await offlineConversionService.trackPaymentSuccess(
          orderData.client_id,
          orderNo,
          orderData.amount / 100
        );

        if (success) {
          logInfo("✅ Offline conversion tracked for Yandex Metrica", {
            clientId: orderData.client_id,
            orderNo,
            amount: orderData.amount / 100,
          });
        }
      }
    } catch (conversionError: any) {
      logError(
        "⚠️ Failed to track offline conversion",
        conversionError.message
      );
      // Don't fail the payment processing if conversion tracking fails
    }
  } catch (error: any) {
    logError("❌ Error processing checkout completed", error.message);
  }
}

/**
 * 处理订阅续费成功事件
 * subscription.paid 事件在订阅自动续费成功后触发
 */
async function handleSubscriptionPaid(webhookData: any) {
  try {
    const subscriptionObject = webhookData.object;
    const subscriptionId = subscriptionObject?.id;
    const metadata = subscriptionObject?.metadata;
    const lastTransaction = subscriptionObject?.last_transaction;
    const customer = subscriptionObject?.customer;

    // 使用 transaction ID 作为唯一支付标识
    const transactionId = lastTransaction?.id;

    if (!transactionId) {
      logError("❌ Missing transaction ID", { webhookData });
      return;
    }

    logInfo("🔄 Processing subscription renewal", {
      subscriptionId,
      transactionId,
      eventId: webhookData.id,
    });

    // 从 metadata 中获取必要信息
    const userUuid = metadata?.user_uuid;
    const userEmail = metadata?.user_email;
    const productId = metadata?.product_id;
    const originalOrderNo = metadata?.order_no; // 首次购买时的订单号

    if (!userUuid || !productId) {
      logError("❌ Missing required metadata", {
        userUuid,
        productId,
        metadata,
      });
      return;
    }

    // 获取产品配置
    const productConfig = getProductConfig(productId);
    if (!productConfig) {
      logError("❌ Product configuration not found", { productId });
      return;
    }

    // 检查用户是否存在
    const user = await findUserByUuid(userUuid);
    if (!user) {
      logError("❌ User not found", { userUuid });
      return;
    }

    // 检查订阅记录是否已存在（用于区分首次订阅和续费）
    const existingSubscription = subscriptionId
      ? await findCreemSubscriptionByCreemId(subscriptionId)
      : null;

    if (!existingSubscription) {
      if (!originalOrderNo) {
        logError("❌ Missing original order_no in subscription.paid metadata", {
          subscriptionId,
          transactionId,
          metadata,
        });
        return;
      }

      const alreadyCredited = await hasOrderPayCredit(originalOrderNo);
      if (alreadyCredited) {
        logInfo(
          "ℹ️ Order already credited; creating subscription record only",
          {
            subscriptionId,
            transactionId,
            originalOrderNo,
          }
        );

        try {
          if (subscriptionId) {
            const existingById = await findCreemSubscriptionByCreemId(
              subscriptionId
            );
            if (!existingById) {
              await createCreemSubscription({
                user_uuid: userUuid,
                creem_subscription_id: subscriptionId,
                creem_customer_id: subscriptionObject?.customer,
                plan_type:
                  productConfig.interval === "month" ? "monthly" : "yearly",
                amount: productConfig.amount,
                currency: productConfig.currency,
                status: subscriptionObject?.status || "active",
                current_period_start:
                  subscriptionObject?.current_period_start_date,
                current_period_end:
                  subscriptionObject?.current_period_end_date,
                product_name: productConfig.product_name,
                product_id: productConfig.product_id,
                creem_product_id: subscriptionObject?.product,
                checkout_id: undefined,
              });
              logInfo("✅ Creem subscription record created (paid already)", {
                subscriptionId,
                userUuid,
                productName: productConfig.product_name,
              });
            }
          }
        } catch (subscriptionError: any) {
          logError(
            "⚠️ Failed to create subscription record (paid already)",
            subscriptionError.message
          );
        }
        return;
      }

      // 首次订阅：订阅记录不存在，可能是 checkout.completed 缺 transactionId
      logInfo(
        "🧩 Missing subscription record, processing first payment via subscription.paid",
        {
          subscriptionId,
          transactionId,
          originalOrderNo,
        }
      );

      // 更新原订单的 payment_id
      const { updateOrderPaymentId } = await import("@/models/order");
      await updateOrderPaymentId(originalOrderNo, transactionId);

      // 使用 PaymentProcessingService 处理首次支付
      const processingResult = await PaymentProcessingService.processPayment({
        paymentId: transactionId,
        orderId: originalOrderNo,
        userUuid,
        amount: productConfig.amount.toString(),
        userEmail: userEmail || customer?.email || "",
        metadata: {
          credits: productConfig.credits,
          product_id: productId,
          product_name: productConfig.product_name,
          interval: productConfig.interval,
          membershipType: productConfig.membershipType,
          valid_months: productConfig.valid_months,
        },
      });

      if (!processingResult.success) {
        logError("❌ First payment processing failed via subscription.paid", {
          transactionId,
          originalOrderNo,
          error: processingResult.error,
        });
        return;
      }

      logInfo("✅ First payment processed via subscription.paid", {
        transactionId,
        originalOrderNo,
        creditsAwarded: processingResult.creditsAwarded,
        membershipUpdated: processingResult.membershipUpdated,
      });

      // 创建或更新 Creem 订阅记录
      try {
        if (subscriptionId) {
          const existingById = await findCreemSubscriptionByCreemId(
            subscriptionId
          );
          if (!existingById) {
            await createCreemSubscription({
              user_uuid: userUuid,
              creem_subscription_id: subscriptionId,
              creem_customer_id: subscriptionObject?.customer,
              plan_type:
                productConfig.interval === "month" ? "monthly" : "yearly",
              amount: productConfig.amount,
              currency: productConfig.currency,
              status: subscriptionObject?.status || "active",
              current_period_start:
                subscriptionObject?.current_period_start_date,
              current_period_end: subscriptionObject?.current_period_end_date,
              product_name: productConfig.product_name,
              product_id: productConfig.product_id,
              creem_product_id: subscriptionObject?.product,
              checkout_id: undefined,
            });
            logInfo("✅ Creem subscription record created", {
              subscriptionId,
              userUuid,
              productName: productConfig.product_name,
            });
          }
        }
      } catch (subscriptionError: any) {
        logError(
          "⚠️ Failed to create subscription record",
          subscriptionError.message
        );
      }

      // Track offline conversion for Yandex Metrica
      try {
        const orderData = await findOrderByOrderNo(originalOrderNo);
        if (orderData?.client_id) {
          const success = await offlineConversionService.trackPaymentSuccess(
            orderData.client_id,
            originalOrderNo,
            orderData.amount / 100
          );

          if (success) {
            logInfo("✅ Offline conversion tracked for Yandex Metrica", {
              clientId: orderData.client_id,
              originalOrderNo,
              amount: orderData.amount / 100,
            });
          }
        }
      } catch (conversionError: any) {
        logError(
          "⚠️ Failed to track offline conversion",
          conversionError.message
        );
      }

      return;
    }

    // 真正的续费：订阅记录已存在
    logInfo("✅ 检测到真实续费（订阅记录已存在）", {
      subscriptionId,
      transactionId,
    });

    // 创建续费订单号
    const renewalOrderNo = `RNW_${transactionId}`;

    // 幂等性检查
    const isProcessed =
      await PaymentProcessingService.checkPaymentAlreadyProcessed(
        renewalOrderNo,
        transactionId
      );

    if (isProcessed) {
      logInfo("⚠️ Subscription renewal already processed, skipping", {
        transactionId,
        renewalOrderNo,
        eventType: webhookData.eventType,
        eventId: webhookData.id,
      });
      return;
    }

    // 检查续费订单是否已创建（幂等性）
    const existingRenewalOrder = await findOrderByOrderNo(renewalOrderNo);
    if (!existingRenewalOrder) {
      const { insertOrder } = await import("@/models/order");

      // 获取原订单的 client_id（用于 Yandex Metrica 追踪）
      let clientId: string | undefined;
      let originalFirstTouch = null;
      let originalLastTouch = null;
      if (originalOrderNo) {
        const originalOrder = await findOrderByOrderNo(originalOrderNo);
        clientId = originalOrder?.client_id || undefined; // 将 null 转换为 undefined
        originalFirstTouch = originalOrder?.first_touch || null;
        originalLastTouch = originalOrder?.last_touch || null;

        if (!clientId) {
          logError("⚠️ 原订单缺少 client_id，续费订单将无法追踪转化", {
            originalOrderNo,
            renewalOrderNo,
          });
        }
      }

      // 计算到期时间
      const currentDate = new Date();
      const expiredDate = new Date(currentDate);
      expiredDate.setMonth(
        currentDate.getMonth() + productConfig.valid_months
      );
      expiredDate.setTime(expiredDate.getTime() + 24 * 60 * 60 * 1000); // 延迟24小时

      await insertOrder({
        order_no: renewalOrderNo,
        user_uuid: userUuid,
        user_email: userEmail || customer?.email || "",
        amount: productConfig.amount,
        currency: productConfig.currency,
        product_id: productId,
        product_name: productConfig.product_name,
        interval: productConfig.interval,
        expired_at: expiredDate.toISOString(),
        status: "paid",
        is_renewal: true,
        payment_id: transactionId,
        payment_provider: "creem",
        credits: productConfig.credits,
        client_id: clientId, // 从原订单复制 client_id
        first_touch: originalFirstTouch,
        last_touch: originalLastTouch,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      logInfo("✅ Renewal order created", {
        renewalOrderNo,
        credits: productConfig.credits,
        transactionId,
      });
    } else {
      logInfo("ℹ️ Renewal order already exists, skipping creation", {
        renewalOrderNo,
      });
    }

    // 使用 PaymentProcessingService 处理支付：充值积分 + 更新会员
    const processingResult = await PaymentProcessingService.processPayment({
      paymentId: transactionId,
      orderId: renewalOrderNo,
      userUuid,
      amount: productConfig.amount.toString(),
      userEmail: userEmail || customer?.email || "",
      metadata: {
        credits: productConfig.credits,
        product_id: productId,
        product_name: productConfig.product_name,
        interval: productConfig.interval,
        membershipType: productConfig.membershipType,
        valid_months: productConfig.valid_months,
      },
    });

    if (!processingResult.success) {
      logError("❌ Subscription renewal payment processing failed", {
        transactionId,
        renewalOrderNo,
        error: processingResult.error,
      });
      return;
    }

    logInfo("✅ Subscription renewal processed successfully", {
      transactionId,
      renewalOrderNo,
      creditsAwarded: processingResult.creditsAwarded,
      membershipUpdated: processingResult.membershipUpdated,
    });

    // 更新订阅记录状态
    try {
      if (subscriptionId) {
        await updateCreemSubscriptionStatus(
          subscriptionId,
          subscriptionObject.status || "active",
          {
            current_period_start: subscriptionObject.current_period_start_date,
            current_period_end: subscriptionObject.current_period_end_date,
          }
        );

        logInfo("✅ Creem subscription status updated", {
          subscriptionId,
          status: subscriptionObject.status,
        });
      }
    } catch (subscriptionError: any) {
      logError(
        "⚠️ Failed to update subscription status",
        subscriptionError.message
      );
      // 不影响支付处理成功
    }

    // Track offline conversion for Yandex Metrica (optional for renewals)
    try {
      // 直接从续费订单获取 client_id（已从原订单复制）
      const renewalOrder = await findOrderByOrderNo(renewalOrderNo);
      if (renewalOrder?.client_id) {
        const success = await offlineConversionService.trackPaymentSuccess(
          renewalOrder.client_id,
          renewalOrderNo,
          productConfig.amount / 100
        );

        if (success) {
          logInfo("✅ Offline conversion tracked for renewal", {
            clientId: renewalOrder.client_id,
            renewalOrderNo,
            amount: productConfig.amount / 100,
          });
        }
      } else {
        logError("⚠️ 续费订单缺少 client_id，无法追踪转化", {
          renewalOrderNo,
        });
      }
    } catch (conversionError: any) {
      logError(
        "⚠️ Failed to track offline conversion for renewal",
        conversionError.message
      );
      // 不影响支付处理
    }
  } catch (error: any) {
    logError("❌ Error processing subscription paid", error.message);
  }
}
