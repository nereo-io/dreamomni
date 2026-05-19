export function getRefundRate(
  paymentProvider: string | null | undefined,
  paymentMethod: string | null | undefined
): number {
  const provider = paymentProvider?.toLowerCase();

  if (provider === "stripe" || provider === "creem") {
    return 0.92;
  }

  if (!paymentMethod) {
    return 0.92;
  }

  const method = paymentMethod.toLowerCase();

  if (method.startsWith("card") || method === "mir") {
    return 0.95;
  }

  if (method.startsWith("sberpay") || method.startsWith("yoomoney")) {
    return 0.92;
  }

  return 0.92;
}

export function calculateRefundAmount(
  orderAmountCents: number,
  paymentProvider: string | null | undefined,
  paymentMethod: string | null | undefined
): number {
  const rate = getRefundRate(paymentProvider, paymentMethod);
  const amount = orderAmountCents / 100;

  return Math.round(amount * rate * 100) / 100;
}
