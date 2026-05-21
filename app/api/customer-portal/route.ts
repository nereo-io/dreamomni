import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPublicWebUrl, getTrimmedEnv } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const stripePrivateKey = getTrimmedEnv("STRIPE_PRIVATE_KEY");
    if (!stripePrivateKey) {
      throw new Error("Missing Stripe private key");
    }

    const stripe = new Stripe(stripePrivateKey);
    const { customerId } = await req.json();

    if (!customerId) {
      throw new Error("Missing customer ID");
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: getPublicWebUrl(),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}
