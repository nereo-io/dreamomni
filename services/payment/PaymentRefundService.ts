import { calculateRefundAmount } from "@/lib/refund-utils";
import {
  findOrderByOrderNo,
  updateOrderRefundStatus,
} from "@/models/order";
import { trackFirstPromoterRefund } from "@/services/analytics/first-promoter";
import { getPaymentRouter } from "@/services/payment";
import { PaymentError } from "@/services/payment/types";
import type { Order } from "@/types/order";

export interface OrderRefundResult {
  success: boolean;
  skipped?: boolean;
  orderNo: string;
  paymentProvider?: string;
  transactionId?: string;
  refundId?: string;
  refundAmount?: number;
  firstPromoterTracked?: boolean;
  error?: string;
  errorCode?: string;
}

function parseJson(value: unknown): any {
  if (!value) return null;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getNestedId(value: any): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

function normalizePaymentProvider(order: Order): string | null {
  const provider = order.payment_provider?.toLowerCase();

  if (provider === "stripe" || provider === "payssion" || provider === "creem") {
    return provider;
  }

  if (order.payssion_transaction_id) return "payssion";
  if (order.stripe_session_id) return "stripe";

  return null;
}

function resolveTransactionId(order: Order, paymentProvider: string) {
  const paidDetail = parseJson(order.paid_detail);

  if (paymentProvider === "stripe") {
    return (
      getNestedId(paidDetail?.payment_intent) ||
      getNestedId(paidDetail?.charge) ||
      order.stripe_session_id ||
      order.payment_id ||
      getNestedId(paidDetail?.id) ||
      null
    );
  }

  if (paymentProvider === "payssion") {
    return (
      order.payment_id ||
      order.payssion_transaction_id ||
      paidDetail?.paymentId ||
      paidDetail?.payment_id ||
      paidDetail?.id ||
      null
    );
  }

  if (paymentProvider === "creem") {
    return (
      order.payment_id ||
      paidDetail?.paymentId ||
      paidDetail?.payment_id ||
      paidDetail?.transactionId ||
      paidDetail?.transaction_id ||
      paidDetail?.id ||
      null
    );
  }

  return null;
}

export async function refundOrderByOrderNo(
  orderNo: string,
  reason?: string
): Promise<OrderRefundResult> {
  const order = await findOrderByOrderNo(orderNo);

  if (!order) {
    return {
      success: false,
      orderNo,
      errorCode: "ORDER_NOT_FOUND",
      error: `Order not found: ${orderNo}`,
    };
  }

  const paymentProvider = normalizePaymentProvider(order);

  if (order.status === "refunded") {
    return {
      success: true,
      skipped: true,
      orderNo,
      paymentProvider: paymentProvider || undefined,
      refundAmount: order.refund_amount || undefined,
    };
  }

  if (order.status !== "paid") {
    return {
      success: false,
      orderNo,
      paymentProvider: paymentProvider || undefined,
      errorCode: "ORDER_NOT_PAID",
      error: `Order ${orderNo} is not paid`,
    };
  }

  if (!paymentProvider) {
    return {
      success: false,
      orderNo,
      errorCode: "MISSING_PAYMENT_PROVIDER",
      error: `Order ${orderNo} has no supported payment provider`,
    };
  }

  const transactionId = resolveTransactionId(order, paymentProvider);
  if (!transactionId) {
    return {
      success: false,
      orderNo,
      paymentProvider,
      errorCode: "MISSING_TRANSACTION_ID",
      error: `Order ${orderNo} has no refundable transaction id`,
    };
  }

  const orderAmount = Number(order.amount);
  if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
    return {
      success: false,
      orderNo,
      paymentProvider,
      transactionId,
      errorCode: "INVALID_AMOUNT",
      error: `Order ${orderNo} has invalid amount`,
    };
  }

  const refundAmount = calculateRefundAmount(
    orderAmount,
    paymentProvider,
    order.payment_method
  );

  let refund;
  try {
    const paymentRouter = getPaymentRouter();
    refund = await paymentRouter.refundPayment(paymentProvider, {
      orderNo,
      transactionId,
      amount: refundAmount,
      currency: order.currency || "USD",
      reason,
    });
  } catch (error: any) {
    return {
      success: false,
      orderNo,
      paymentProvider,
      transactionId,
      refundAmount,
      errorCode:
        error instanceof PaymentError
          ? error.code
          : error?.code || "REFUND_FAILED",
      error: error?.message || "Payment provider refund failed",
    };
  }

  if (!refund.success) {
    return {
      success: false,
      orderNo,
      paymentProvider,
      transactionId,
      refundAmount,
      errorCode: refund.errorCode,
      error: refund.errorMessage || "Payment provider refund failed",
    };
  }

  const now = new Date().toISOString();
  await updateOrderRefundStatus(orderNo, {
    refund_status: "succeeded",
    refund_amount: refundAmount,
    refunded_at: now,
    refund_detail: refund.raw || refund,
  });

  let firstPromoterTracked = false;
  try {
    const trackResult = await trackFirstPromoterRefund({
      paymentProvider,
      orderNo: order.order_no,
      paymentId: transactionId,
      userUuid: order.user_uuid,
      email: order.paid_email || order.user_email || "",
      amount: order.amount,
      currency: order.currency || "USD",
      reason,
    });
    firstPromoterTracked = trackResult.success;
  } catch (error) {
    console.error("FirstPromoter refund tracking failed:", error);
  }

  return {
    success: true,
    orderNo,
    paymentProvider,
    transactionId,
    refundId: refund.refundId,
    refundAmount,
    firstPromoterTracked,
  };
}
