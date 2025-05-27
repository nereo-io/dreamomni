import {
  CreditsTransType,
  increaseCredits,
  updateCreditForOrder,
} from "./credit";
import { findOrderByOrderNo, updateOrderStatus } from "@/models/order";
import { createOrUpdateMembership } from "./membership";
import { getIsoTimestr, getOneYearLaterTimestr } from "@/lib/time";
import { sendGAEvent } from "@next/third-parties/google";
import Stripe from "stripe";
import { updateAffiliateForOrder } from "./affiliate";
import { createProductPurchaseRecord } from "@/models/purchase";
import { PurchasedImageProduct } from "@/types/img-product";

// 处理图片商品购买，记录到user_purchased_images表
export async function handleImageProductPurchase(order: any) {
  if (!order || !order.user_uuid || !order.product_id) {
    console.log("无效的订单数据，无法处理图片商品购买");
    return;
  }

  try {
    console.log("处理图片商品购买:", order.product_id, order.user_uuid);

    // 计算访问过期时间（默认购买后有效期一年）
    const now = new Date();
    // 默认有效期是valid_months个月，如果没有则默认12个月
    const validMonths = order.valid_months || 12;
    const accessExpiresAt = new Date(now);
    accessExpiresAt.setMonth(now.getMonth() + validMonths);

    // 准备要插入的购买记录数据
    const purchaseRecord: Partial<PurchasedImageProduct> = {
      product_id: order.product_id,
      order_id: order.order_no.toString(),
      user_uuid: order.user_uuid,
      purchase_time: now.toISOString(),
      access_expires_at: accessExpiresAt.toISOString(),
      download_count: 0,
    };

    // 使用模型层方法创建购买记录
    const result = await createProductPurchaseRecord(purchaseRecord);

    if (result) {
      console.log("图片购买记录创建成功:", result.id);
    } else {
      console.warn("图片购买记录创建可能失败");
    }
  } catch (error) {
    console.error("处理图片商品购买时出错:", error);
    throw error;
  }
}

export async function handleOrderSession(session: Stripe.Checkout.Session) {
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
    if (!order || order.status !== "created") {
      throw new Error("invalid order");
    }

    const paid_at = getIsoTimestr();
    await updateOrderStatus(order_no, "paid", paid_at, paid_email, paid_detail);

    // 处理订单类型
    const interval = order.interval;
    const product_id = order.product_id;
    const product_type = order.product_type; // 获取产品类型
    const credits = session.metadata.credits; // 保留原始用法，用于会员类型判断

    console.log("Order details:", {
      interval,
      product_type,
      product_id,
      credits,
    });

    // 处理会员订阅或积分包购买
    console.log("Processing membership/credits purchase for user:", user_uuid);

    let actualCreditsToIncrease = 0;
    if (product_id === "starter-monthly") {
      actualCreditsToIncrease = 400; // Starter Plan 积分
      try {
        await createOrUpdateMembership(user_uuid, "monthly");
      } catch (e) {
        console.log("update membership failed: ", e);
        throw e;
      }
    } else if (product_id === "pro-monthly") {
      actualCreditsToIncrease = 1800; // Pro Plan 积分
      await createOrUpdateMembership(user_uuid, "monthly");
    }

    // 1. 增加积分 (如果根据product_id确定了数量)
    if (actualCreditsToIncrease > 0) {
      await increaseCredits({
        user_uuid: user_uuid,
        trans_type: CreditsTransType.OrderPay,
        credits: actualCreditsToIncrease,
        order_no: order.order_no,
        expired_at: order.expired_at || getOneYearLaterTimestr(),
      });
      console.log(
        `Increased ${actualCreditsToIncrease} credits for user ${user_uuid} for order ${order.order_no} (Product ID: ${product_id})`
      );
    } else {
      console.log(
        `No specific credit increase rule based on product_id ${product_id} for order ${order.order_no}. Only membership might be updated.`
      );
    }

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

    let actualCreditsToIncreaseForRenewal = 0;
    if (productIdFromInvoice === "starter-monthly") {
      actualCreditsToIncreaseForRenewal = 400;
      await createOrUpdateMembership(user_uuid, "monthly");
    } else if (productIdFromInvoice === "pro-monthly") {
      actualCreditsToIncreaseForRenewal = 1800;
      await createOrUpdateMembership(user_uuid, "monthly");
    }

    // 优先处理增加积分的逻辑
    if (actualCreditsToIncreaseForRenewal > 0) {
      await increaseCredits({
        user_uuid: user_uuid,
        trans_type: CreditsTransType.OrderPay, // 或者 "subscription_renewal"
        credits: actualCreditsToIncreaseForRenewal,
        order_no: order_no || invoice.id,
        expired_at: getOneYearLaterTimestr(),
      });
      console.log(
        `Increased ${actualCreditsToIncreaseForRenewal} credits for user ${user_uuid} due to invoice ${invoice.id} (Product ID: ${productIdFromInvoice})`
      );
    } else {
      console.log(
        `No specific credit increase rule for renewal (invoice ${invoice.id}) based on product_id ${productIdFromInvoice}. Only membership might be updated.`
      );
    }
    console.log("Invoice payment processed successfully:", invoice.id);
  } catch (e) {
    console.log("handle invoice payment failed:", e);
    throw e;
  }
}
