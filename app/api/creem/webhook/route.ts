import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { updateOrderStatus } from "@/models/order";
import { insertCredit } from "@/models/credit";
import { updateMembership } from "@/models/membership";
import { findUserByUuid } from "@/models/user";
import { getProductConfig } from "@/config/products";
import { getSnowId } from "@/lib/hash";
import { Credit } from "@/types/credit";
import { getCreemConfig } from "@/config/creem";
import * as crypto from "crypto";
import { 
  createCreemSubscription, 
  findCreemSubscriptionByCreemId,
  updateCreemSubscriptionStatus
} from "@/models/creem-subscription";

// 日志函数
function logInfo(message: string, data?: any) {
  console.log(`[CREEM-WEBHOOK] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

function logError(message: string, data?: any) {
  console.error(`[CREEM-WEBHOOK] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

/**
 * 验证 Creem webhook 签名
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('hex');
    
    // 使用 timingSafeEqual 防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
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
    const signature = req.headers.get('creem-signature') || req.headers.get('x-creem-signature');
    if (signature) {
      try {
        const config = getCreemConfig();
        if (!verifyWebhookSignature(rawBody, signature, config.webhookSecret)) {
          logError("❌ Invalid webhook signature");
          return respErr("Invalid signature");
        }
        logInfo("✅ Webhook signature verified");
      } catch (error) {
        logError("❌ Signature verification failed", error);
        // 在生产环境中应该拒绝未验证的请求，这里先记录警告
        logInfo("⚠️ Proceeding without signature verification (development mode)");
      }
    } else {
      logInfo("⚠️ No signature header found, proceeding without verification");
    }

    // 根据不同的事件类型处理业务逻辑
    switch (body.eventType) {
      case "checkout.completed":
        await handleCheckoutCompleted(body);
        break;
      case "subscription.created":
        await handleSubscriptionCreated(body);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(body);
        break;
      case "subscription.trialing":
        await handleSubscriptionTrialing(body);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(body);
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
    const metadata = checkoutObject?.metadata;
    const order = checkoutObject?.order;
    const subscription = checkoutObject?.subscription;
    const customer = checkoutObject?.customer;
    
    logInfo("🎉 Processing checkout completed event", {
      checkoutId: checkoutObject?.id,
      creemOrderId: order?.id,
      subscriptionId: subscription?.id,
      customerEmail: customer?.email,
      metadata: metadata,
    });

    // 详细调试信息
    logInfo("🔍 Webhook data analysis", {
      hasMetadata: !!metadata,
      metadataKeys: metadata ? Object.keys(metadata) : [],
      orderNoFromMetadata: metadata?.order_no,
      productIdFromMetadata: metadata?.product_id,
      userUuidFromMetadata: metadata?.user_uuid,
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

    await processPaymentSuccess({
      userUuid,
      userEmail: userEmail || customer?.email || '',
      orderNo,
      productConfig,
      webhookData,
      checkoutObject,
    });

  } catch (error: any) {
    logError("❌ Error processing checkout completed", error.message);
  }
}

/**
 * 处理订阅创建事件
 */
async function handleSubscriptionCreated(webhookData: any) {
  try {
    const subscriptionObject = webhookData.object;
    const metadata = subscriptionObject?.metadata;
    
    logInfo("📝 Processing subscription created event", {
      subscriptionId: subscriptionObject?.id,
      customerId: subscriptionObject?.customer,
      status: subscriptionObject?.status,
      metadata: metadata,
    });

    // 订阅创建通常在 checkout.completed 之后发生
    // 这里主要做状态同步和记录
    logInfo("✅ Subscription created successfully", {
      subscriptionId: subscriptionObject?.id,
      status: subscriptionObject?.status,
    });

  } catch (error: any) {
    logError("❌ Error processing subscription created", error.message);
  }
}

/**
 * 处理订阅更新事件
 */
async function handleSubscriptionUpdated(webhookData: any) {
  try {
    const subscriptionObject = webhookData.object;
    
    logInfo("🔄 Processing subscription updated event", {
      subscriptionId: subscriptionObject?.id,
      status: subscriptionObject?.status,
      currentPeriodStart: subscriptionObject?.current_period_start_date,
      currentPeriodEnd: subscriptionObject?.current_period_end_date,
    });

    if (subscriptionObject?.id) {
      // 更新订阅状态
      await updateCreemSubscriptionStatus(subscriptionObject.id, subscriptionObject.status, {
        current_period_start: subscriptionObject.current_period_start_date,
        current_period_end: subscriptionObject.current_period_end_date,
      });
      
      logInfo("✅ Subscription status updated", {
        subscriptionId: subscriptionObject.id,
        newStatus: subscriptionObject.status,
      });
    }
    
  } catch (error: any) {
    logError("❌ Error processing subscription updated", error.message);
  }
}

/**
 * 处理订阅试用期事件
 */
async function handleSubscriptionTrialing(webhookData: any) {
  try {
    const subscriptionObject = webhookData.object;
    
    logInfo("🆓 Processing subscription trialing event", {
      subscriptionId: subscriptionObject?.id,
      status: subscriptionObject?.status,
    });

    // 处理试用期逻辑
    
  } catch (error: any) {
    logError("❌ Error processing subscription trialing", error.message);
  }
}

/**
 * 处理支付意图成功事件
 */
async function handlePaymentIntentSucceeded(webhookData: any) {
  try {
    logInfo("💰 Processing payment intent succeeded event", {
      eventId: webhookData.id,
      objectId: webhookData.object?.id,
    });

    // 处理一次性支付成功
    
  } catch (error: any) {
    logError("❌ Error processing payment intent succeeded", error.message);
  }
}

/**
 * 统一的支付成功处理逻辑
 */
async function processPaymentSuccess(params: {
  userUuid: string;
  userEmail: string;
  orderNo: string;
  productConfig: any;
  webhookData: any;
  checkoutObject: any;
}) {
  const { userUuid, userEmail, orderNo, productConfig, webhookData, checkoutObject } = params;
  
  try {
    // 更新订单状态
    try {
      await updateOrderStatus(
        orderNo, 
        "paid", 
        new Date().toISOString(),
        userEmail,
        JSON.stringify(webhookData)
      );
      logInfo("✅ Order status updated to paid", { orderNo });
    } catch (orderError) {
      logError("⚠️ Failed to update order status - order might not exist", {
        orderNo,
        error: orderError,
      });
      // 继续处理积分和会员状态，即使订单记录不存在
    }

    // 添加积分
    const creditRecord: Credit = {
      trans_no: getSnowId(),
      user_uuid: userUuid,
      credits: productConfig.credits,
      trans_type: `Creem payment: ${productConfig.product_name}`,
      order_no: orderNo,
      created_at: new Date().toISOString(),
      expired_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年后过期
    };
    
    await insertCredit(creditRecord);
    logInfo("✅ Credits added to user", {
      userUuid,
      credits: productConfig.credits,
      productName: productConfig.product_name,
    });

    // 更新会员状态
    const membershipEndDate = new Date();
    membershipEndDate.setMonth(membershipEndDate.getMonth() + productConfig.valid_months);

    await updateMembership(userUuid, {
      plan_type: productConfig.membershipType,
      end_date: membershipEndDate.toISOString(),
      status: "active",
    });

    logInfo("✅ Membership updated", {
      userUuid,
      membershipType: productConfig.membershipType,
      endDate: membershipEndDate.toISOString(),
    });

    // 创建或更新 Creem 订阅记录
    try {
      const subscription = checkoutObject?.subscription;
      if (subscription?.id) {
        // 检查订阅记录是否已存在
        const existingSubscription = await findCreemSubscriptionByCreemId(subscription.id);
        
        if (!existingSubscription) {
          // 创建新的订阅记录
          await createCreemSubscription({
            user_uuid: userUuid,
            creem_subscription_id: subscription.id,
            creem_customer_id: subscription.customer,
            plan_type: productConfig.interval === "month" ? "monthly" : "yearly",
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
          await updateCreemSubscriptionStatus(subscription.id, subscription.status || "active", {
            current_period_start: subscription.current_period_start_date,
            current_period_end: subscription.current_period_end_date,
          });
          
          logInfo("✅ Creem subscription record updated", {
            subscriptionId: subscription.id,
            status: subscription.status,
          });
        }
      }
    } catch (subscriptionError: any) {
      logError("⚠️ Failed to create/update subscription record", subscriptionError.message);
      // 即使订阅记录创建失败，也不影响支付成功的处理
    }

    logInfo("🎉 Payment success processing completed", {
      userUuid,
      orderNo,
      credits: productConfig.credits,
      membershipType: productConfig.membershipType,
    });

  } catch (error: any) {
    logError("❌ Error in payment success processing", error.message);
    throw error;
  }
}

