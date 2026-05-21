jest.mock("@/services/user", () => ({
  getUserEmail: jest.fn(),
  getUserUuid: jest.fn(),
}));

jest.mock("@/models/order", () => ({
  insertOrder: jest.fn(),
  updateOrderSession: jest.fn(),
}));

jest.mock("@/models/user", () => ({
  findUserByUuid: jest.fn(),
  updateUserAttribution: jest.fn(),
}));

jest.mock("stripe", () => jest.fn());

import { POST } from "@/app/api/checkout/route";

describe("/api/checkout", () => {
  it("is disabled in favor of /api/subscription/create", async () => {
    const response = await POST(
      new Request("https://example.com/api/checkout", {
        method: "POST",
        body: JSON.stringify({ product_id: "plus-monthly" }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toEqual({
      code: -1,
      message: "checkout endpoint deprecated; use /api/subscription/create",
    });
  });
});
