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

    // 更新会员状态 - 判断月度会员还是年度会员
    const credits = session.metadata.credits;
    // console.log("session: ", session.metadata);
    console.log("Updating membership for user:", user_uuid);
    if (credits === "1") {
      await createOrUpdateMembership(user_uuid, "monthly");
      // sendGAEvent("event", "subscription_purchase", { value: "10" });
    } else if (credits === "12") {
      await createOrUpdateMembership(user_uuid, "yearly");
      // sendGAEvent("event", "subscription_purchase", { value: "100" });
    }
    // if (order.user_uuid) {
    // if (order.credits > 0) {
    // increase credits for paied order
    // await updateCreditForOrder(order);
    // }

    // update affiliate for paied order
    // await updateAffiliateForOrder(order);
    // }
    // await createOrUpdateMembership(user_uuid, product_id);
    // if (order.user_uuid && order.credits > 0) {
    //   // increase credits for paied order
    //   await increaseCredits({
    //     user_uuid: order.user_uuid,
    //     trans_type: CreditsTransType.OrderPay,
    //     credits: order.credits,
    //     expired_at: order.expired_at,
    //     order_no: order_no,
    //   });
    // }

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
    let user_uuid, order_no, credits;

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
      credits = metadata.credits;
    }

    if (!user_uuid) {
      throw new Error("找不到用户UUID");
    }

    console.log("Invoice payment details:", {
      invoice_id: invoice.id,
      user_uuid,
      order_no,
      credits,
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

    // 更新会员状态
    console.log("Updating membership for user:", user_uuid);
    if (credits === "1") {
      await createOrUpdateMembership(user_uuid, "monthly");
    } else if (credits === "12") {
      await createOrUpdateMembership(user_uuid, "yearly");
    } else {
      // 如果没有credits信息，尝试从订阅计划中判断
      const lineItem = invoice.lines.data[0];
      if (lineItem && lineItem.plan) {
        const interval = lineItem.plan.interval;
        if (interval === "month") {
          await createOrUpdateMembership(user_uuid, "monthly");
        } else if (interval === "year") {
          await createOrUpdateMembership(user_uuid, "yearly");
        }
      }
    }

    console.log("Invoice payment processed successfully:", invoice.id);
  } catch (e) {
    console.log("handle invoice payment failed:", e);
    throw e;
  }
}
