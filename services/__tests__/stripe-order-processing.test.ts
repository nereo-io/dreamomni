import type Stripe from "stripe";
import { handleInvoicePayment, handleOrderSession } from "@/services/order";
import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";
import { SubscriptionManagementService } from "@/services/payment/SubscriptionManagementService";
import {
  findOrderByOrderNo,
  insertOrder,
  updateOrderStatus,
} from "@/models/order";
import {
  resolveStripePaymentIdFromInvoice,
  resolveStripePaymentIdFromSession,
} from "@/lib/stripe-payment";

jest.mock("@/models/order", () => ({
  findOrderByOrderNo: jest.fn(),
  insertOrder: jest.fn(),
  updateOrderCredits: jest.fn(),
  updateOrderPaymentId: jest.fn(),
  updateOrderStatus: jest.fn(),
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

    await handleInvoicePayment(
      {
        id: "in_renewal",
        customer_email: "paid@example.com",
        amount_paid: 9900,
        currency: "usd",
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
      {} as Stripe
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
  });
});
