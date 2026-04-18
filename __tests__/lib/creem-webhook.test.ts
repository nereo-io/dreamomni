import crypto from "crypto";
import {
  findMatchingCreemWebhookSecretIndex,
  parseCreemWebhookSecrets,
  verifyCreemWebhookSignature,
} from "@/lib/creem-webhook";

describe("creem webhook helpers", () => {
  const payload = JSON.stringify({
    id: "evt_123",
    eventType: "checkout.completed",
  });

  it("parses comma-separated webhook secrets and ignores blanks", () => {
    expect(
      parseCreemWebhookSecrets(" secret-a,secret-b ,, secret-c  ,")
    ).toEqual(["secret-a", "secret-b", "secret-c"]);
  });

  it("verifies a valid signature", () => {
    const secret = "secret-b";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    expect(verifyCreemWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it("falls back to later secrets when the first one does not match", () => {
    const secrets = ["secret-a", "secret-b", "secret-c"];
    const signature = crypto
      .createHmac("sha256", "secret-b")
      .update(payload, "utf8")
      .digest("hex");

    expect(
      findMatchingCreemWebhookSecretIndex(payload, signature, secrets)
    ).toBe(1);
  });

  it("rejects malformed signatures without throwing", () => {
    expect(
      verifyCreemWebhookSignature(payload, "not-a-valid-signature", "secret-a")
    ).toBe(false);
  });
});
