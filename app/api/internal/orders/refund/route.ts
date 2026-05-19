import { NextRequest, NextResponse } from "next/server";
import { refundOrderByOrderNo } from "@/services/payment/PaymentRefundService";

export async function POST(req: NextRequest) {
  const internalKey = process.env.INTERNAL_API_KEY?.trim();

  if (!internalKey) {
    return NextResponse.json(
      { error: "INTERNAL_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${internalKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const orderNo =
      typeof body?.order_no === "string" ? body.order_no.trim() : "";
    const reason =
      typeof body?.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : undefined;

    if (!orderNo) {
      return NextResponse.json(
        { error: "Missing required field: order_no" },
        { status: 400 }
      );
    }

    const result = await refundOrderByOrderNo(orderNo, reason);

    if (!result.success) {
      const status =
        result.errorCode === "ORDER_NOT_FOUND"
          ? 404
          : result.errorCode === "ORDER_NOT_PAID" ||
            result.errorCode === "MISSING_PAYMENT_PROVIDER" ||
            result.errorCode === "MISSING_TRANSACTION_ID" ||
            result.errorCode === "INVALID_AMOUNT"
          ? 400
          : 502;

      return NextResponse.json(
        {
          error: result.error || "Failed to refund order",
          code: result.errorCode,
          order_no: orderNo,
          paymentProvider: result.paymentProvider,
        },
        { status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Internal order refund error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to refund order" },
      { status: 500 }
    );
  }
}
