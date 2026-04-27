import Stripe from "stripe";
import { respOk } from "@/lib/resp";
import { handleInvoicePayment, handleOrderSession } from "@/services/order";

export async function handleStripeWebhook(req: Request) {
  try {
    const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripePrivateKey || !stripeWebhookSecret) {
      throw new Error("invalid stripe config");
    }

    const stripe = new Stripe(stripePrivateKey);

    const sign = req.headers.get("stripe-signature") as string;
    const body = await req.text();
    if (!sign || !body) {
      throw new Error("invalid notify data");
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      sign,
      stripeWebhookSecret
    );

    console.log("stripe webhook event: ", event);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleOrderSession(session, stripe);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_cycle") {
          console.log("处理续订付款:", invoice.id);
          await handleInvoicePayment(invoice, stripe);
        } else {
          console.log(
            "跳过处理新订阅的invoice事件:",
            invoice.id,
            invoice.billing_reason
          );
        }
        break;
      }

      default:
        console.log("not handle event: ", event.type);
    }

    return respOk();
  } catch (e: any) {
    console.log("stripe webhook failed: ", e);
    return Response.json(
      { error: `handle stripe webhook failed: ${e.message}` },
      { status: 500 }
    );
  }
}
