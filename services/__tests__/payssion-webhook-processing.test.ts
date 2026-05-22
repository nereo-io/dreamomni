import { PayssionProvider } from "@/services/payment/PayssionProvider";
import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";
import {
  findSubscriptionByPayssionId,
  updateSubscriptionStatus,
} from "@/models/subscription";
import {
  findOrderByOrderNo,
  insertOrder,
  updateOrderPaymentId,
} from "@/models/order";

jest.mock("@/models/payssionMandate", () => ({
  insertPayssionMandate: jest.fn(),
  updatePayssionMandateStatus: jest.fn(),
  findActivePayssionMandateByUserUuid: jest.fn(),
}));

jest.mock("@/models/subscription", () => ({
  findSubscriptionByPayssionId: jest.fn(),
  updateSubscriptionStatus: jest.fn(),
  createSubscription: jest.fn(),
}));

jest.mock("@/models/order", () => ({
  findOrderByOrderNo: jest.fn(),
  insertOrder: jest.fn(),
  updateOrderPaymentId: jest.fn(),
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

jest.mock("@/config/products", () => ({
  getProductConfig: jest.fn(() => ({
    product_id: "plus-yearly",
    product_name: "Plus Yearly",
    amount: 72000,
    currency: "USD",
    credits: 36000,
    interval: "year",
    valid_months: 12,
    membershipType: "yearly",
  })),
}));

jest.mock("@/services/analytics/yandex-offline-conversion", () => ({
  offlineConversionService: {
    trackPaymentSuccess: jest.fn(),
  },
}));

describe("Payssion webhook processing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYSSION_V2_API_KEY = "test_api_key";
    process.env.PAYSSION_V2_SECRET_KEY = "test_secret";
    process.env.NEXTAUTH_URL = "https://example.com";

    jest
      .mocked(PaymentProcessingService.checkPaymentAlreadyProcessed)
      .mockResolvedValue(false);
    jest
      .mocked(PaymentProcessingService.processPayment)
      .mockResolvedValue({ success: true, creditsAwarded: 3000 });
    jest.mocked(findSubscriptionByPayssionId).mockResolvedValue({
      user_uuid: "user_1",
      user_email: "user@example.com",
      payssion_subscription_id: "sub_yearly",
      mandate_id: "mdt_1",
      plan_type: "yearly",
      amount: 720,
      currency: "USD",
      status: "active",
      product_id: "plus-yearly",
      product_name: "Plus Yearly",
    } as any);
    jest.mocked(findOrderByOrderNo).mockImplementation(async (orderNo) => {
      if (orderNo === "ord_yearly") {
        return {
          order_no: "ord_yearly",
          user_uuid: "user_1",
          user_email: "user@example.com",
          status: "paid",
          client_id: "client_1",
          first_touch: { source: "first" },
          last_touch: { source: "last" },
          is_monthly_distribution: true,
        } as any;
      }

      return undefined;
    });
    jest.mocked(insertOrder).mockResolvedValue(null);
  });

  it("preserves monthly distribution on yearly renewal orders", async () => {
    const provider = new PayssionProvider();

    await provider.handleSubscriptionWebhook({
      type: "payment.succeeded",
      data: {
        object: {
          id: "pm_yearly_renewal",
          source_id: "sub_yearly",
          amount: "720",
          metadata: {
            order_no: "ord_yearly",
            user_uuid: "user_1",
            user_email: "user@example.com",
            payment_method: "sberpay",
          },
        },
      },
    });

    expect(updateOrderPaymentId).not.toHaveBeenCalled();
    expect(insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order_no: "RNW_pm_yearly_renewal",
        interval: "year",
        is_monthly_distribution: true,
      })
    );
  });

  it("syncs local Payssion subscription period after renewal payment", async () => {
    const provider = new PayssionProvider();

    await provider.handleSubscriptionWebhook({
      type: "payment.succeeded",
      data: {
        object: {
          id: "pm_yearly_renewal",
          source_id: "sub_yearly",
          amount: "720",
          current_period_start: "2026-05-21T00:00:00.000Z",
          current_period_end: "2027-05-22T00:00:00.000Z",
          metadata: {
            order_no: "ord_yearly",
            user_uuid: "user_1",
            user_email: "user@example.com",
            payment_method: "sberpay",
          },
        },
      },
    });

    expect(updateSubscriptionStatus).toHaveBeenCalledWith(
      "sub_yearly",
      "active",
      expect.objectContaining({
        current_period_start: "2026-05-21T00:00:00.000Z",
        current_period_end: "2027-05-22T00:00:00.000Z",
      })
    );
  });
});
