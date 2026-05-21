import { PaymentProcessingService } from "@/services/payment/PaymentProcessingService";
import { increaseCredits } from "@/services/credit";
import { findOrderByOrderNo, updateOrderStatus } from "@/models/order";
import { getSupabaseClient } from "@/models/db";

const insertMock = jest.fn();

jest.mock("@/models/order", () => ({
  findOrderByOrderNo: jest.fn(),
  updateOrderCredits: jest.fn(),
  updateOrderStatus: jest.fn(),
}));

jest.mock("@/services/credit", () => ({
  increaseCredits: jest.fn(),
}));

jest.mock("@/models/credit", () => ({
  findCreditByOrderNoAndPaymentId: jest.fn(() => null),
}));

jest.mock("@/services/membership", () => ({
  createOrUpdateMembership: jest.fn(),
}));

jest.mock("@/services/subscriptionTier", () => ({
  getUserHighestSubscriptionTier: jest.fn(),
}));

jest.mock("@/config/products", () => ({
  getBundleBonusCreditsForTier: jest.fn(() => 0),
}));

jest.mock("@/services/analytics/first-promoter", () => ({
  trackFirstPromoterSale: jest.fn(),
}));

jest.mock("@/lib/hash", () => ({
  getSnowId: jest.fn(() => "trans_1"),
}));

jest.mock("@/models/db", () => ({
  getSupabaseClient: jest.fn(),
}));

describe("PaymentProcessingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(getSupabaseClient).mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === "credit_distribution_schedule") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
            insert: insertMock.mockReturnValue({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { id: "schedule_1" },
                  error: null,
                }),
              })),
            }),
          };
        }

        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }),
    } as any);
    jest.mocked(increaseCredits).mockResolvedValue(undefined as any);
    jest.mocked(updateOrderStatus).mockResolvedValue(undefined as any);
  });

  it("stores the explicit payment provider on yearly distribution schedules", async () => {
    jest.mocked(findOrderByOrderNo).mockResolvedValue({
      order_no: "ord_yearly",
      user_uuid: "user_1",
      user_email: "user@example.com",
      amount: 72000,
      currency: "USD",
      interval: "year",
      status: "created",
      credits: 36000,
      product_id: "plus-yearly",
      product_name: "Plus Yearly",
      is_monthly_distribution: true,
      payment_provider: "stripe",
    } as any);

    const result = await PaymentProcessingService.processPayment({
      paymentId: "txn_1",
      orderId: "ord_yearly",
      userUuid: "user_1",
      amount: "72000",
      subscriptionId: "sub_1",
      userEmail: "user@example.com",
      paymentProvider: "creem",
      metadata: {
        credits: 36000,
        interval: "year",
      },
    });

    expect(result.success).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        order_no: "ord_yearly",
        payment_provider: "creem",
      })
    );
  });
});
