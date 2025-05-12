import Stripe from "stripe";
import { handleOrderSession } from "@/services/order";
import { redirect } from "next/navigation";

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY || "");

export default async function ({ params }: { params: { session_id: string } }) {
  let paySuccessRedirect = process.env.NEXT_PUBLIC_PAY_SUCCESS_URL || "/";
  let payFailRedirect = process.env.NEXT_PUBLIC_PAY_FAIL_URL || "/";

  try {
    const session = await stripe.checkout.sessions.retrieve(params.session_id);
    // 根据产品类型决定重定向目标
    const productType = session.metadata?.product_type;
    const productSlug = session.metadata?.product_slug;

    if (productType === "image" && productSlug) {
      paySuccessRedirect = `/products/${productSlug}`;
      payFailRedirect = `/products/${productSlug}`;
    }

    await handleOrderSession(session);
  } catch (e) {
    redirect(payFailRedirect);
  }

  redirect(paySuccessRedirect);
}
