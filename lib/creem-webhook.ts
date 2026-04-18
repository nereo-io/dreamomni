import * as crypto from "crypto";

export function parseCreemWebhookSecrets(rawSecrets?: string): string[] {
  if (!rawSecrets) {
    return [];
  }

  return rawSecrets
    .split(",")
    .map((secret) => secret.trim())
    .filter(Boolean);
}

export function verifyCreemWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const normalizedSignature = signature.trim();
  const normalizedSecret = secret.trim();

  if (!normalizedSignature || !normalizedSecret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", normalizedSecret)
      .update(payload, "utf8")
      .digest("hex");

    if (normalizedSignature.length !== expectedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(normalizedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

export function findMatchingCreemWebhookSecretIndex(
  payload: string,
  signature: string,
  secrets: string[]
): number {
  return secrets.findIndex((secret) =>
    verifyCreemWebhookSignature(payload, signature, secret)
  );
}
