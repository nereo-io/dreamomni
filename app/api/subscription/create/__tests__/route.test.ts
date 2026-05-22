jest.mock("@/services/user", () => ({
  getUserEmail: jest.fn(),
  getUserUuid: jest.fn(),
}));

jest.mock("@/models/user", () => ({
  findUserByUuid: jest.fn(),
  updateUserAttribution: jest.fn(),
}));

jest.mock("@/models/order", () => ({
  insertOrder: jest.fn(),
  updateOrderSession: jest.fn(),
}));

jest.mock("@/models/orderTrackingAudit", () => ({
  insertOrderTrackingAudit: jest.fn(),
}));

jest.mock("@/lib/yandex-metrica", () => ({
  getClientIdFromCookie: jest.fn(() => "client-1"),
}));

jest.mock("@/lib/attribution", () => ({
  getAttributionFromCookie: jest.fn(() => null),
  isDirectSnapshot: jest.fn(() => false),
  isSnapshotNewer: jest.fn(() => false),
  resolveAttribution: jest.fn(() => ({
    first_touch: null,
    last_touch: null,
  })),
}));

jest.mock("@/lib/hash", () => ({
  getSnowId: jest.fn(() => "order_123"),
}));

jest.mock("@/config/payssion", () => ({
  getPayssionConfig: jest.fn(() => ({
    subscription: {
      defaultReturnUrl: "https://dreamomni.ai/subscription/success",
      webhookUrl: "https://dreamomni.ai/api/payssion/v2-webhook",
    },
  })),
}));

jest.mock("@/lib/payment-methods", () => ({
  getPaymentProvider: jest.fn(() => "payssion"),
}));

jest.mock("@/services/membership", () => ({
  hasActiveMembership: jest.fn(() => Promise.resolve(true)),
}));

const createMandate = jest.fn();

jest.mock("@/services/payment", () => ({
  getPaymentRouter: jest.fn(() => ({
    createMandate,
  })),
}));

import { POST } from "@/app/api/subscription/create/route";
import { getUserEmail, getUserUuid } from "@/services/user";
import { findUserByUuid } from "@/models/user";
import { insertOrder, updateOrderSession } from "@/models/order";

describe("/api/subscription/create Payssion order creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_PROJECT_NAME = "dreamomni";
    process.env.NEXT_PUBLIC_WEB_URL = "https://dreamomni.ai";
    (getUserUuid as jest.Mock).mockResolvedValue("user-uuid");
    (getUserEmail as jest.Mock).mockResolvedValue("user@example.com");
    (findUserByUuid as jest.Mock).mockResolvedValue({
      uuid: "user-uuid",
      email: "user@example.com",
      first_touch: null,
      last_touch: null,
    });
  });

  it("builds the Payssion mandate like nereo and returns provider failure in data", async () => {
    createMandate.mockResolvedValue({
      success: false,
      errorMessage: "Payssion rejected request",
    });

    const response = await POST(
      new Request("https://dreamomni.ai/api/subscription/create", {
        method: "POST",
        body: JSON.stringify({
          product_id: "plus-monthly",
          product_name: "DreamOmni Plus",
          product_type: "subscription",
          product_slug: "plus",
          credits: 4800,
          interval: "month",
          amount: 16000,
          currency: "USD",
          valid_months: 1,
          payment_method: "sberpay",
        }),
      }) as any,
    );

    const body = await response.json();

    expect(body.code).toBe(0);
    expect(body.data).toMatchObject({
      success: false,
      order_no: "order_123",
      errorMessage: "Payssion rejected request",
    });
    expect(createMandate).toHaveBeenCalledWith(
      expect.objectContaining({
        userUuid: "user-uuid",
        userEmail: "user@example.com",
        paymentMethod: "sberpay",
        reference: "mdtorder_123",
        metadata: expect.objectContaining({
          project: "dreamomni",
          product_name: "DreamOmni Plus",
          product_type: "subscription",
          product_id: "plus-monthly",
          product_slug: "plus",
          order_no: "order_123",
          user_email: "user@example.com",
          credits: 4800,
          user_uuid: "user-uuid",
          interval: "month",
          amount: 16000,
          currency: "USD",
        }),
      }),
    );
    expect(insertOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 16000,
        credits: 4800,
        product_name: "DreamOmni Plus",
        payment_provider: "payssion",
      }),
    );
    expect(updateOrderSession).not.toHaveBeenCalled();
  });
});
