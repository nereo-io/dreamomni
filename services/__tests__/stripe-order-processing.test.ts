import type Stripe from "stripe";
import {
  handleInvoicePayment,
  handleOrderSession,
  handleStripeCheckoutSessionExpired,
  handleStripeInvoicePaymentFailed,
} from "@/services/order";
import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";
import { SubscriptionManagementService } from "@/services/payment/SubscriptionManagementService";
import {
  findOrderByOrderNo,
  insertOrder,
  updateOrderStatus,
  recordOrderPaymentFailure,
} from "@/models/order";
import {
  resolveStripePaymentIdFromInvoice,
  resolveStripePaymentIdFromSession,
} from "@/lib/stripe-payment";
import { upsertStripeSubscription } from "@/models/stripe-subscription";
import { offlineConversionService } from "@/services/analytics/yandex-offline-conversion";

jest.mock("@/models/order", () => ({
  findOrderByOrderNo: jest.fn(),
  insertOrder: jest.fn(),
  updateOrderCredits: jest.fn(),
  updateOrderPaymentId: jest.fn(),
  updateOrderStatus: jest.fn(),
  recordOrderPaymentFailure: jest.fn(),
}));

jest.mock("@/models/stripe-subscription", () => ({
  upsertStripeSubscription: jest.fn(),
  findStripeSubscriptionByStripeId: jest.fn(),
  updateStripeSubscriptionStatus: jest.fn(),
}));

jest.mock("@/services/payment/PaymentProcessingService", () => ({
  PaymentProcessingService: {
    checkPaymentAlreadyProcessed: jest.fn(),
    processPayment: jest.fn(),
  },
}));

jest.mock("@/services/payment/SubscriptionManagementService", () => ({
  SubscriptionManagementService: {
    cancelOtherSubscriptions: jest.fn(),
  },
}));

jest.mock("@/lib/stripe-payment", () => ({
  resolveStripePaymentIdFromInvoice: jest.fn(),
  resolveStripePaymentIdFromSession: jest.fn(),
}));

jest.mock("@/config/products", () => ({
  getAnyProductConfig: jest.fn((productId: string) => ({
    product_id: productId,
    product_name: "Plus Monthly",
    amount: 9900,
    currency: "USD",
    credits: 1000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
  })),
  getBundleBonusCreditsForTier: jest.fn(() => 0),
  getProductConfig: jest.fn((productId: string) => ({
    product_id: productId,
    product_name: "Plus Monthly",
    amount: 9900,
    currency: "USD",
    credits: 1000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
  })),
}));

jest.mock("@/services/credit", () => ({
  CreditsTransType: { OrderPay: "order_pay" },
  increaseCredits: jest.fn(),
}));

jest.mock("@/services/membership", () => ({
  createOrUpdateMembership: jest.fn(),
}));

jest.mock("@/services/subscriptionTier", () => ({
  getUserHighestSubscriptionTier: jest.fn(),
}));

jest.mock("@/services/analytics/first-promoter", () => ({
  trackFirstPromoterCancellation: jest.fn(),
  trackFirstPromoterSale: jest.fn(),
}));

jest.mock("@/services/analytics/yandex-offline-conversion", () => ({
  offlineConversionService: {
    trackPaymentSuccess: jest.fn(),
  },
}));

describe("Stripe order processing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(PaymentProcessingService.processPayment)
      .mockResolvedValue({ success: true, creditsAwarded: 1000 });
    jest
      .mocked(PaymentProcessingService.checkPaymentAlreadyProcessed)
      .mockResolvedValue(false);
    jest
      .mocked(SubscriptionManagementService.cancelOtherSubscriptions)
      .mockResolvedValue({
        success: true,
        canceledCount: 0,
        failedCount: 0,
        details: [],
      });
    jest.mocked(insertOrder).mockResolvedValue(null);
  });

  it("routes initial checkout fulfillment through PaymentProcessingService", async () => {
    jest.mocked(findOrderByOrderNo).mockResolvedValue({
      order_no: "ord_initial",
      user_uuid: "user_1",
      user_email: "user@example.com",
      amount: 9900,
      currency: "USD",
      interval: "month",
      expired_at: "2026-06-22T00:00:00.000Z",
      status: "created",
      credits: 1000,
      product_id: "plus-monthly",
      product_name: "Plus Monthly",
      created_at: "2026-05-21T00:00:00.000Z",
      client_id: "client_1",
      first_touch: { source: "first" },
      last_touch: { yclid: "yclid_1" },
      is_monthly_distribution: false,
    } as any);
    jest
      .mocked(resolveStripePaymentIdFromSession)
      .mockResolvedValue("pi_initial");

    await handleOrderSession({
      id: "cs_initial",
      payment_status: "paid",
      metadata: {
        order_no: "ord_initial",
        user_uuid: "user_1",
      },
      customer_details: { email: "paid@example.com" },
      customer_email: "user@example.com",
      subscription: "sub_initial",
      customer: "cus_1",
    } as unknown as Stripe.Checkout.Session);

    expect(PaymentProcessingService.processPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "pi_initial",
        orderId: "ord_initial",
        userUuid: "user_1",
        userEmail: "paid@example.com",
        subscriptionId: "sub_initial",
        paymentMethod: "stripe",
        paymentProvider: "stripe",
      })
    );
    expect(updateOrderStatus).not.toHaveBeenCalled();
    expect(
      SubscriptionManagementService.cancelOtherSubscriptions
    ).toHaveBeenCalledWith("user_1", "sub_initial", "stripe");
    expect(offlineConversionService.trackPaymentSuccess).toHaveBeenCalledWith(
      {
        clientId: "client_1",
        yclid: "yclid_1",
      },
      "ord_initial",
      99
    );
  });

  it("creates a renewal order and routes subscription cycle invoices through PaymentProcessingService", async () => {
    jest.mocked(findOrderByOrderNo).mockImplementation(async (orderNo) => {
      if (orderNo === "ord_initial") {
        return {
          order_no: "ord_initial",
          user_uuid: "user_1",
          user_email: "user@example.com",
          amount: 9900,
          currency: "USD",
          interval: "month",
          expired_at: "2026-06-22T00:00:00.000Z",
          status: "paid",
          credits: 1000,
          product_id: "plus-monthly",
          product_name: "Plus Monthly",
          created_at: "2026-05-21T00:00:00.000Z",
          client_id: "client_1",
          first_touch: { source: "first" },
          last_touch: { source: "last" },
          is_monthly_distribution: false,
        } as any;
      }

      return undefined;
    });
    jest
      .mocked(resolveStripePaymentIdFromInvoice)
      .mockResolvedValue("pi_renewal");

    const stripe = {
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue({
          id: "sub_initial",
          customer: "cus_1",
          status: "active",
          current_period_start: 1770000000,
          current_period_end: 1772678400,
        }),
      },
    } as unknown as Stripe;

    await handleInvoicePayment(
      {
        id: "in_renewal",
        customer_email: "paid@example.com",
        amount_paid: 9900,
        currency: "usd",
        customer: "cus_1",
        subscription: "sub_initial",
        subscription_details: {
          metadata: {
            user_uuid: "user_1",
            order_no: "ord_initial",
            product_id: "plus-monthly",
          },
        },
        metadata: {},
        lines: { data: [] },
      } as unknown as Stripe.Invoice,
      stripe
    );

    expect(insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order_no: "RNW_pi_renewal",
        is_renewal: true,
        payment_id: "pi_renewal",
        payment_provider: "stripe",
        client_id: "client_1",
      })
    );
    expect(PaymentProcessingService.processPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "pi_renewal",
        orderId: "RNW_pi_renewal",
        userUuid: "user_1",
        subscriptionId: "sub_initial",
        paymentProvider: "stripe",
      })
    );
    expect(upsertStripeSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        user_uuid: "user_1",
        stripe_subscription_id: "sub_initial",
        stripe_customer_id: "cus_1",
        amount: 9900,
        status: "active",
        current_period_start: "2026-02-02T02:40:00.000Z",
        current_period_end: "2026-03-05T02:40:00.000Z",
        product_id: "plus-monthly",
      })
    );
  });

  it("preserves monthly distribution on yearly renewal orders", async () => {
    const { getAnyProductConfig } = await import("@/config/products");
    jest.mocked(getAnyProductConfig).mockReturnValueOnce({
      product_id: "plus-yearly",
      product_name: "Plus Yearly",
      amount: 72000,
      currency: "USD",
      credits: 36000,
      interval: "year",
      valid_months: 12,
      membershipType: "yearly",
    } as any);

    jest.mocked(findOrderByOrderNo).mockImplementation(async (orderNo) => {
      if (orderNo === "ord_yearly") {
        return {
          order_no: "ord_yearly",
          user_uuid: "user_1",
          user_email: "user@example.com",
          amount: 72000,
          currency: "USD",
          interval: "year",
          expired_at: "2027-05-22T00:00:00.000Z",
          status: "paid",
          credits: 36000,
          product_id: "plus-yearly",
          product_name: "Plus Yearly",
          created_at: "2026-05-21T00:00:00.000Z",
          is_monthly_distribution: true,
        } as any;
      }

      return undefined;
    });
    jest
      .mocked(resolveStripePaymentIdFromInvoice)
      .mockResolvedValue("pi_yearly_renewal");

    await handleInvoicePayment(
      {
        id: "in_yearly_renewal",
        customer_email: "paid@example.com",
        subscription: "sub_yearly",
        subscription_details: {
          metadata: {
            user_uuid: "user_1",
            order_no: "ord_yearly",
            product_id: "plus-yearly",
          },
        },
        metadata: {},
        lines: { data: [] },
      } as unknown as Stripe.Invoice,
      {} as Stripe
    );

    expect(insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order_no: "RNW_pi_yearly_renewal",
        interval: "year",
        is_monthly_distribution: true,
      })
    );
  });

  it("records Stripe invoice payment failures on the original order", async () => {
    await handleStripeInvoicePaymentFailed({
      id: "in_failed",
      status: "open",
      subscription: "sub_failed",
      subscription_details: {
        metadata: {
          order_no: "ord_initial",
          user_uuid: "user_1",
        },
      },
      metadata: {},
      lines: { data: [] },
      last_finalization_error: null,
      payment_intent: {
        id: "pi_failed",
        last_payment_error: {
          code: "card_declined",
          message: "Your card was declined.",
        },
      },
    } as any);

    expect(recordOrderPaymentFailure).toHaveBeenCalledWith(
      "ord_initial",
      expect.objectContaining({
        code: "card_declined",
        message: "Your card was declined.",
        provider: "stripe",
        eventId: "in_failed",
      })
    );
  });

  it("records Stripe checkout expiration failures on the original order", async () => {
    await handleStripeCheckoutSessionExpired({
      id: "cs_expired",
      metadata: {
        order_no: "ord_initial",
        user_uuid: "user_1",
      },
      status: "expired",
    } as unknown as Stripe.Checkout.Session);

    expect(recordOrderPaymentFailure).toHaveBeenCalledWith(
      "ord_initial",
      expect.objectContaining({
        code: "checkout_expired",
        message: "Stripe checkout session expired before payment completed",
        provider: "stripe",
        eventId: "cs_expired",
      })
    );
  });
});
