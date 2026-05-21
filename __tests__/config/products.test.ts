import {
  getProviderProductId,
  getStripePriceEnvName,
  getStripePriceId,
} from "@/config/products";

describe("product provider IDs", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("maps product IDs to Stripe price env names", () => {
    expect(getStripePriceEnvName("mini-monthly")).toBe(
      "STRIPE_PRICE_MINI_MONTHLY"
    );
    expect(getStripePriceEnvName("bundle-100")).toBe(
      "STRIPE_PRICE_BUNDLE_100"
    );
  });

  it("resolves Stripe price IDs from env", () => {
    process.env.STRIPE_PRICE_MINI_MONTHLY = "price_test_mini_monthly";

    expect(getStripePriceId("mini-monthly")).toBe("price_test_mini_monthly");
    expect(getProviderProductId("mini-monthly", "stripe")).toBe(
      "price_test_mini_monthly"
    );
  });
});
