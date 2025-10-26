import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { findOrderByOrderNo } from "@/models/order";
import { findUserByUuid } from "@/models/user";
import { getProductConfig } from "@/config/products";
import { getCreemConfig } from "@/config/creem";
import * as crypto from "crypto";
import {
  createCreemSubscription,
  findCreemSubscriptionByCreemId,
  updateCreemSubscriptionStatus,
} from "@/models/creem-subscription";
import { offlineConversionService } from "@/services/analytics/yandex-offline-conversion";
import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";

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
 * 处理 checkout 完成事件 - 这是主要的支付成功事件
 */
async function handleCheckoutCompleted(webhookData: any) {
  try {
    const checkoutObject = webhookData.object;
    const checkoutId = checkoutObject?.id; // 使用 checkout ID 作为唯一标识
    const metadata = checkoutObject?.metadata;
    const order = checkoutObject?.order;
    const subscription = checkoutObject?.subscription;
    const customer = checkoutObject?.customer;

    if (!checkoutId) {
      logError("❌ Missing checkout ID", { webhookData });
      return;
    }

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

    // 幂等性检查 - 使用 checkoutId 作为 payment_id
    const isProcessed =
      await PaymentProcessingService.checkPaymentAlreadyProcessed(
        orderNo,
        checkoutId
      );

    if (isProcessed) {
      logInfo("⚠️ Webhook already processed, skipping", {
        checkoutId,
        orderNo,
        eventType: webhookData.eventType,
        eventId: webhookData.id,
      });
      return;
    }

    // 检测是否为续费支付
    const existingSubscription = subscription?.id
      ? await findCreemSubscriptionByCreemId(subscription.id)
      : null;

    const isRenewal = !!existingSubscription;
    let finalOrderNo = orderNo;

    if (isRenewal) {
      // 创建续费订单
      const renewalOrderNo = `RNW_${checkoutId}`;

      logInfo("🔄 检测到续费支付，创建续费订单", {
        originalOrderNo: orderNo,
        renewalOrderNo,
        subscriptionId: subscription.id,
      });

      // 检查续费订单是否已创建（幂等性）
      const renewalOrder = await findOrderByOrderNo(renewalOrderNo);
      if (!renewalOrder) {
        const { insertOrder } = await import("@/models/order");

        await insertOrder({
          order_no: renewalOrderNo,
          user_uuid: userUuid,
          user_email: userEmail || customer?.email || "",
          amount: productConfig.amount,
          currency: productConfig.currency,
          product_id: productId,
          product_name: productConfig.product_name,
          interval: productConfig.interval,
          status: "paid",
          is_renewal: true,
          payment_id: checkoutId,
          payment_provider: "creem",
          credits: productConfig.credits,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        logInfo("✅ 续费订单创建成功", {
          renewalOrderNo,
          credits: productConfig.credits,
        });
      } else {
        logInfo("ℹ️ 续费订单已存在，跳过创建", { renewalOrderNo });
      }

      finalOrderNo = renewalOrderNo;
    }

    // 使用 PaymentProcessingService 处理支付
    const processingResult = await PaymentProcessingService.processPayment({
      paymentId: checkoutId, // 使用 checkoutId 作为 payment_id 确保唯一性
      orderId: finalOrderNo, // 使用 finalOrderNo（续费时为 RNW_ 开头）
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
      logError("❌ Payment processing failed", {
        checkoutId,
        orderNo,
        error: processingResult.error,
      });
      return;
    }

    logInfo("✅ Payment processed successfully", {
      checkoutId,
      orderNo,
      creditsAwarded: processingResult.creditsAwarded,
      membershipUpdated: processingResult.membershipUpdated,
    });

    // 创建或更新 Creem 订阅记录
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
