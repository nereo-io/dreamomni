jest.mock("@/config/payssion", () => ({
  getPayssionConfig: jest.fn(() => ({
    v2: {
      baseUrl: "https://api.payssion.test",
      apiKey: "api-key",
      secretKey: "secret-key",
    },
    paymentMethods: {
      sberpay: "sberpay_ru",
    },
    subscription: {
      defaultReturnUrl: "https://dreamomni.ai/subscription/success",
      webhookUrl: "https://dreamomni.ai/api/payssion/v2-webhook",
    },
  })),
}));

jest.mock("@/models/payssionMandate", () => ({
  insertPayssionMandate: jest.fn(),
  updatePayssionMandateStatus: jest.fn(),
  findActivePayssionMandateByUserUuid: jest.fn(),
}));

jest.mock("@/services/payment/PaymentProcessingService", () => ({
  PaymentProcessingService: {},
}));

jest.mock("@/services/payment/SubscriptionManagementService", () => ({
  SubscriptionManagementService: {},
}));

import { PayssionProvider } from "@/services/payment/PayssionProvider";

describe("PayssionProvider order creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () =>
      Response.json({
        id: "sub_123",
      }),
    ) as jest.Mock;
  });

  it("uses nereo subscription times for monthly Payssion subscriptions", async () => {
    const provider = new PayssionProvider();

    const result = await provider.createSubscription({
      userUuid: "user-uuid",
      userEmail: "user@example.com",
      mandateId: "mandate_123",
      amount: 160,
      currency: "USD",
      interval: "month",
      planType: "monthly",
      paymentMethod: "sberpay",
      returnUrl: "https://dreamomni.ai/pricing",
      notifyUrl: "https://dreamomni.ai/api/payssion/v2-webhook",
      metadata: {
        order_no: "order_123",
      },
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(init.body);

    expect(result.success).toBe(true);
    expect(requestBody).toMatchObject({
      mandate_id: "mandate_123",
      interval_unit: "month",
      times: 60,
    });
  });
});
