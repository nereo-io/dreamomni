import Stripe from "stripe";
import { BasePaymentProvider } from "./PaymentProvider";
import {
  MandateRequest,
  MandateResponse,
  SubscriptionRequest,
  SubscriptionResponse,
  SubscriptionWebhookResult,
  PaymentError,
  RefundRequest,
  RefundResult,
} from "./types";
import {
  getAnyProductConfig,
  getStripePriceId,
  isBundle,
} from "@/config/products";
import { getTrimmedEnv } from "@/lib/env";

export class StripeProvider extends BasePaymentProvider {
  name = "stripe";

  validateConfig(): boolean {
    return !!getTrimmedEnv("STRIPE_PRIVATE_KEY");
  }

  private getStripe(): Stripe {
    return new Stripe(getTrimmedEnv("STRIPE_PRIVATE_KEY")!);
  }

  private buildSuccessUrl(returnUrl: string): string {
    const separator = returnUrl.includes("?") ? "&" : "?";
    return `${returnUrl}${separator}payment=success&session_id={CHECKOUT_SESSION_ID}`;
  }

  async createMandate(request: MandateRequest): Promise<MandateResponse> {
    try {
      const productId = request.metadata?.product_id;
      if (!productId) {
        throw new PaymentError(
          "MISSING_PRODUCT_ID",
          "Product ID is required for Stripe checkout",
          "stripe"
        );
      }

      const productConfig = getAnyProductConfig(productId);
      if (!productConfig) {
        throw new PaymentError(
          "PRODUCT_NOT_FOUND",
          `No product config found for: ${productId}`,
          "stripe"
        );
      }

      const isOneTime = isBundle(productId);
      const stripe = this.getStripe();
      const stripePriceId = getStripePriceId(productId);

      const sessionMetadata: Record<string, string> = {
        user_uuid: request.userUuid,
        order_no: request.metadata?.order_no || "",
        product_id: productId,
        credits: String(productConfig.credits),
        payment_id: request.reference || "",
      };

      const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData =
        {
          currency: productConfig.currency.toLowerCase(),
          unit_amount: productConfig.amount,
          product_data: { name: productConfig.product_name },
          ...(isOneTime
            ? {}
            : {
                recurring: {
                  interval: productConfig.interval as "month" | "year",
                },
              }),
        };

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: isOneTime ? "payment" : "subscription",
        line_items: [
          stripePriceId
            ? { price: stripePriceId, quantity: 1 }
            : { price_data: priceData, quantity: 1 },
        ],
        success_url: this.buildSuccessUrl(request.returnUrl),
        cancel_url: request.returnUrl,
        client_reference_id: request.reference,
        customer_email: request.userEmail,
        allow_promotion_codes: true,
        metadata: sessionMetadata,
      };

      if (!isOneTime) {
        sessionParams.subscription_data = {
          metadata: sessionMetadata,
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new PaymentError(
          "INVALID_RESPONSE",
          "Stripe session missing URL",
          "stripe"
        );
      }

      return {
        success: true,
        mandateId: session.id,
        redirectUrl: session.url,
        status: session.status || "created",
      };
    } catch (error: any) {
      if (error instanceof PaymentError) throw error;
      throw new PaymentError(
        "MANDATE_CREATION_FAILED",
        error.message || "Failed to create Stripe checkout session",
        "stripe",
        error
      );
    }
  }

  async createSubscription(
    request: SubscriptionRequest
  ): Promise<SubscriptionResponse> {
    const mandateResponse = await this.createMandate({
      userUuid: request.userUuid,
      userEmail: request.userEmail,
      paymentMethod: request.paymentMethod,
      returnUrl: request.returnUrl,
      reference: request.reference,
      metadata: request.metadata,
    });

    return {
      success: mandateResponse.success,
      mandateId: mandateResponse.mandateId,
      redirectUrl: mandateResponse.redirectUrl,
      errorMessage: mandateResponse.errorMessage,
      paymentProvider: this.name,
    };
  }

  async handleSubscriptionWebhook(
    data: any
  ): Promise<SubscriptionWebhookResult> {
    throw new PaymentError(
      "NOT_SUPPORTED",
      "Stripe webhooks are handled by /api/stripe/webhook directly",
      this.name
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const stripe = this.getStripe();

      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return true;
    } catch (error: any) {
      console.error("Stripe subscription cancellation failed:", error);
      throw new PaymentError(
        "SUBSCRIPTION_CANCEL_FAILED",
        error.message || "Failed to cancel Stripe subscription",
        this.name,
        error
      );
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResult> {
    if (!process.env.STRIPE_PRIVATE_KEY) {
      return {
        success: false,
        paymentProvider: this.name,
        errorCode: "CONFIG_ERROR",
        errorMessage: "STRIPE_PRIVATE_KEY is not configured",
      };
    }

    try {
      const stripe = this.getStripe();
      const refundParams: Stripe.RefundCreateParams = {
        amount: Math.round(request.amount * 100),
        metadata: {
          ...(request.orderNo ? { order_no: request.orderNo } : {}),
          ...(request.reason ? { reason: request.reason } : {}),
          ...request.metadata,
        },
      };
      const transactionId = request.transactionId;

      if (transactionId.startsWith("pi_")) {
        refundParams.payment_intent = transactionId;
      } else if (transactionId.startsWith("ch_")) {
        refundParams.charge = transactionId;
      } else if (transactionId.startsWith("cs_")) {
        const session = await stripe.checkout.sessions.retrieve(transactionId);
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!paymentIntentId) {
          throw new PaymentError(
            "MISSING_PAYMENT_INTENT",
            `Stripe checkout session ${transactionId} has no payment_intent`,
            this.name
          );
        }

        refundParams.payment_intent = paymentIntentId;
      } else if (transactionId.startsWith("in_")) {
        const invoice = (await stripe.invoices.retrieve(transactionId, {
          expand: ["payment_intent", "charge"],
        })) as any;
        const paymentIntentId =
          typeof invoice.payment_intent === "string"
            ? invoice.payment_intent
            : invoice.payment_intent?.id;
        const chargeId =
          typeof invoice.charge === "string" ? invoice.charge : invoice.charge?.id;

        if (paymentIntentId) {
          refundParams.payment_intent = paymentIntentId;
        } else if (chargeId) {
          refundParams.charge = chargeId;
        } else {
          throw new PaymentError(
            "MISSING_PAYMENT_TARGET",
            `Stripe invoice ${transactionId} has no refundable payment target`,
            this.name
          );
        }
      } else {
        throw new PaymentError(
          "UNSUPPORTED_TRANSACTION_ID",
          `Unsupported Stripe transaction id: ${transactionId}`,
          this.name
        );
      }

      const refund = await stripe.refunds.create(
        refundParams,
        request.orderNo
          ? { idempotencyKey: `refund_${request.orderNo}` }
          : undefined
      );

      return {
        success: true,
        refundId: refund.id,
        paymentProvider: this.name,
        raw: refund,
      };
    } catch (error: any) {
      console.error("Stripe refund failed:", error);
      return {
        success: false,
        paymentProvider: this.name,
        errorCode: error?.code || error?.name || "STRIPE_REFUND_FAILED",
        errorMessage: error?.message || "Failed to refund Stripe payment",
      };
    }
  }
}
