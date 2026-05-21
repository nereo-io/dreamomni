import { SubscriptionManagementService } from "@/services/payment/SubscriptionManagementService";
import { getPaymentRouter } from "@/services/payment";
import { findActiveSubscriptionsByUserUuid } from "@/models/subscription";
import { findActiveCreemSubscriptionsByUserUuid } from "@/models/creem-subscription";
import {
  findActiveStripeSubscriptionsByUserUuid,
  updateStripeSubscriptionStatus,
} from "@/models/stripe-subscription";

jest.mock("@/services/payment", () => ({
  getPaymentRouter: jest.fn(),
}));

jest.mock("@/models/subscription", () => ({
  findActiveSubscriptionsByUserUuid: jest.fn(),
  updateSubscriptionStatus: jest.fn(),
}));

jest.mock("@/models/creem-subscription", () => ({
  findActiveCreemSubscriptionsByUserUuid: jest.fn(),
  updateCreemSubscriptionStatus: jest.fn(),
}));

jest.mock("@/models/stripe-subscription", () => ({
  findActiveStripeSubscriptionsByUserUuid: jest.fn(),
  updateStripeSubscriptionStatus: jest.fn(),
}));

jest.mock("@/services/analytics/first-promoter", () => ({
  trackFirstPromoterCancellation: jest.fn(),
}));

describe("SubscriptionManagementService", () => {
  const cancelSubscription = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getPaymentRouter).mockReturnValue({
      cancelSubscription,
    } as any);
    cancelSubscription.mockResolvedValue(true);
    jest.mocked(findActiveSubscriptionsByUserUuid).mockResolvedValue([]);
    jest.mocked(findActiveCreemSubscriptionsByUserUuid).mockResolvedValue([]);
    jest.mocked(findActiveStripeSubscriptionsByUserUuid).mockResolvedValue([
      {
        user_uuid: "user_1",
        stripe_subscription_id: "sub_old_stripe",
        status: "active",
      } as any,
    ]);
    jest.mocked(updateStripeSubscriptionStatus).mockResolvedValue({} as any);
  });

  it("cancels active Stripe subscriptions when a new non-Stripe subscription becomes active", async () => {
    const result = await SubscriptionManagementService.cancelOtherSubscriptions(
      "user_1",
      "sub_new_creem",
      "creem"
    );

    expect(cancelSubscription).toHaveBeenCalledWith(
      "stripe",
      "sub_old_stripe"
    );
    expect(updateStripeSubscriptionStatus).toHaveBeenCalledWith(
      "sub_old_stripe",
      "canceled"
    );
    expect(result.canceledCount).toBe(1);
  });

  it("does not cancel the new Stripe subscription itself", async () => {
    await SubscriptionManagementService.cancelOtherSubscriptions(
      "user_1",
      "sub_old_stripe",
      "stripe"
    );

    expect(cancelSubscription).not.toHaveBeenCalledWith(
      "stripe",
      "sub_old_stripe"
    );
  });
});
