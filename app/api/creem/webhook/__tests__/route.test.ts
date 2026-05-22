import { POST } from "@/app/api/creem/webhook/route";
import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";
import {
  findOrderByOrderNo,
  insertOrder,
  recordOrderPaymentFailure,
  updateOrderPaymentId,
} from "@/models/order";
import { findCreemSubscriptionByCreemId } from "@/models/creem-subscription";

jest.mock("@/lib/creem-webhook", () => ({
  findMatchingCreemWebhookSecretIndex: jest.fn(() => 0),
}));

jest.mock("@/config/creem", () => ({
  getCreemConfig: jest.fn(() => ({
    webhookSecrets: ["secret"],
  })),
}));

jest.mock("@/models/order", () => ({
  findOrderByOrderNo: jest.fn(),
  insertOrder: jest.fn(),
  recordOrderPaymentFailure: jest.fn(),
  updateOrderPaymentId: jest.fn(),
}));

jest.mock("@/models/credit", () => ({
  findOrderPayCreditByOrderNo: jest.fn(() => null),
}));

jest.mock("@/models/user", () => ({
  findUserByUuid: jest.fn(() => ({ uuid: "user_1", email: "user@example.com" })),
}));

jest.mock("@/config/products", () => ({
  getAnyProductConfig: jest.fn(() => ({
    product_id: "plus-monthly",
    product_name: "Plus Monthly",
    amount: 9900,
    currency: "USD",
    credits: 1000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
  })),
  getProductConfig: jest.fn(() => ({
    product_id: "plus-monthly",
    product_name: "Plus Monthly",
    amount: 9900,
    currency: "USD",
    credits: 1000,
    interval: "month",
    valid_months: 1,
    membershipType: "monthly",
  })),
  getBundleConfig: jest.fn(),
}));

jest.mock("@/models/creem-subscription", () => ({
  createCreemSubscription: jest.fn(),
  findCreemSubscriptionByCreemId: jest.fn(),
  updateCreemSubscriptionStatus: jest.fn(),
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

jest.mock("@/services/analytics/first-promoter", () => ({
  trackFirstPromoterCancellation: jest.fn(),
}));

jest.mock("@/services/analytics/yandex-offline-conversion", () => ({
  offlineConversionService: {
    trackPaymentSuccess: jest.fn(),
  },
}));

function creemRequest(body: any) {
  return new Request("https://example.com/api/creem/webhook", {
    method: "POST",
    headers: {
      "creem-signature": "valid-signature",
    },
    body: JSON.stringify(body),
  }) as any;
}

describe("/api/creem/webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(PaymentProcessingService.checkPaymentAlreadyProcessed)
      .mockResolvedValue(false);
    jest.mocked(findOrderByOrderNo).mockResolvedValue({
      order_no: "ord_1",
      user_uuid: "user_1",
      user_email: "user@example.com",
      amount: 9900,
      currency: "USD",
      interval: "month",
      status: "created",
      credits: 1000,
      product_id: "plus-monthly",
      product_name: "Plus Monthly",
      created_at: "2026-05-21T00:00:00.000Z",
    } as any);
  });

  it("returns a retryable error when checkout fulfillment fails", async () => {
    jest
      .mocked(PaymentProcessingService.processPayment)
      .mockResolvedValue({ success: false, error: "credit insert failed" });

    const response = await POST(
      creemRequest({
        id: "evt_checkout",
        eventType: "checkout.completed",
        object: {
          id: "chk_1",
          order: { transaction: "txn_1" },
          customer: { email: "user@example.com" },
          metadata: {
            user_uuid: "user_1",
            user_email: "user@example.com",
            product_id: "plus-monthly",
            order_no: "ord_1",
          },
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toContain("credit insert failed");
    expect(updateOrderPaymentId).toHaveBeenCalledWith("ord_1", "txn_1");
  });

  it("records Creem payment failures on the original order", async () => {
    const response = await POST(
      creemRequest({
        id: "evt_failed",
        eventType: "payment.failed",
        object: {
          id: "txn_failed",
          failure_code: "card_declined",
          failure_message: "Card declined",
          metadata: {
            order_no: "ord_1",
            user_uuid: "user_1",
          },
        },
      })
    );

    expect(response.status).toBe(200);
    expect(recordOrderPaymentFailure).toHaveBeenCalledWith(
      "ord_1",
      expect.objectContaining({
        code: "card_declined",
        message: "Card declined",
        provider: "creem",
        eventId: "evt_failed",
      })
    );
  });

  it("preserves monthly distribution on yearly renewal orders", async () => {
    const { getProductConfig } = await import("@/config/products");
    jest.mocked(getProductConfig).mockReturnValueOnce({
      product_id: "plus-yearly",
      product_name: "Plus Yearly",
      amount: 72000,
      currency: "USD",
      credits: 36000,
      interval: "year",
      valid_months: 12,
      membershipType: "yearly",
    } as any);
    jest.mocked(findCreemSubscriptionByCreemId).mockResolvedValue({
      user_uuid: "user_1",
      creem_subscription_id: "sub_yearly",
      plan_type: "yearly",
      status: "active",
    } as any);
    jest
      .mocked(PaymentProcessingService.processPayment)
      .mockResolvedValue({ success: true, creditsAwarded: 3000 });
    jest.mocked(findOrderByOrderNo).mockImplementation(async (orderNo) => {
      if (orderNo === "ord_yearly") {
        return {
          order_no: "ord_yearly",
          user_uuid: "user_1",
          user_email: "user@example.com",
          status: "paid",
          is_monthly_distribution: true,
          client_id: "client_1",
        } as any;
      }

      return undefined;
    });

    await POST(
      creemRequest({
        id: "evt_paid",
        eventType: "subscription.paid",
        object: {
          id: "sub_yearly",
          status: "active",
          customer: { email: "user@example.com" },
          last_transaction: { id: "txn_yearly_renewal" },
          metadata: {
            user_uuid: "user_1",
            user_email: "user@example.com",
            product_id: "plus-yearly",
            order_no: "ord_yearly",
          },
        },
      })
    );

    expect(insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order_no: "RNW_txn_yearly_renewal",
        interval: "year",
        is_monthly_distribution: true,
      })
    );
  });
});
