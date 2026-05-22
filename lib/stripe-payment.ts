import type Stripe from "stripe";

function getStripeId(value: string | { id?: string } | null | undefined) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

export async function resolveStripePaymentIdFromInvoice(
  invoice: string | Stripe.Invoice | null | undefined,
  stripe?: Stripe
): Promise<string | undefined> {
  const invoicePaymentIntent = getStripeId(
    typeof invoice === "string" ? undefined : (invoice as any)?.payment_intent
  );
  if (invoicePaymentIntent) return invoicePaymentIntent;

  const invoiceCharge = getStripeId(
    typeof invoice === "string" ? undefined : (invoice as any)?.charge
  );
  if (invoiceCharge) return invoiceCharge;

  const invoiceId = getStripeId(invoice as any);
  if (!invoiceId || !stripe) return undefined;

  const expandedInvoice = (await stripe.invoices.retrieve(invoiceId, {
    expand: ["payment_intent", "charge"],
  })) as any;

  return (
    getStripeId(expandedInvoice.payment_intent) ||
    getStripeId(expandedInvoice.charge)
  );
}

export async function resolveStripePaymentIdFromSession(
  session: Stripe.Checkout.Session,
  stripe?: Stripe
): Promise<string | undefined> {
  const sessionPaymentIntent = getStripeId(session.payment_intent as any);
  if (sessionPaymentIntent) return sessionPaymentIntent;

  return resolveStripePaymentIdFromInvoice(session.invoice as any, stripe);
}
