import { findOrderByOrderNo, updateOrderStatus } from "@/models/order";
import { createOrUpdateMembership } from "./membership";
import Stripe from "stripe";
import { getIsoTimestr } from "@/lib/time";

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

    const paid_email = session.customer_details?.email || session.customer_email || "";
    const paid_detail = JSON.stringify(session);

    const order = await findOrderByOrderNo(order_no);
    if (!order || order.status !== "created") {
      throw new Error("invalid order");
    }

    const paid_at = getIsoTimestr();
    await updateOrderStatus(order_no, "paid", paid_at, paid_email, paid_detail);

    // 更新会员状态 - 目前只支持月度会员
    console.log("Updating membership for user:", user_uuid);
    await createOrUpdateMembership(user_uuid, 'monthly');

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
