import { createHmac, timingSafeEqual } from "crypto";

const CALLBACK_SKEW_MINUTES = 5;
const TIMESTAMP_REGEX = /^\d{10}$/; // YYMMDDHHmm

function getSigningSecret(): string {
  const secret = process.env.VIDEO_CALLBACK_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error("VIDEO_CALLBACK_SIGNING_SECRET is required");
  }
  return secret;
}

function toBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function formatTwoDigits(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatCallbackTimestamp(date: Date = new Date()): string {
  const year = date.getUTCFullYear() % 100;
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();

  return [
    formatTwoDigits(year),
    formatTwoDigits(month),
    formatTwoDigits(day),
    formatTwoDigits(hour),
    formatTwoDigits(minute),
  ].join("");
}

export function parseCallbackTimestamp(timestamp: string): Date | null {
  if (!TIMESTAMP_REGEX.test(timestamp)) {
    return null;
  }

  const yy = Number.parseInt(timestamp.slice(0, 2), 10);
  const mm = Number.parseInt(timestamp.slice(2, 4), 10);
  const dd = Number.parseInt(timestamp.slice(4, 6), 10);
  const hh = Number.parseInt(timestamp.slice(6, 8), 10);
  const min = Number.parseInt(timestamp.slice(8, 10), 10);

  if (
    Number.isNaN(yy) ||
    Number.isNaN(mm) ||
    Number.isNaN(dd) ||
    Number.isNaN(hh) ||
    Number.isNaN(min) ||
    mm < 1 ||
    mm > 12 ||
    dd < 1 ||
    dd > 31 ||
    hh < 0 ||
    hh > 23 ||
    min < 0 ||
    min > 59
  ) {
    return null;
  }

  const fullYear = 2000 + yy;
  const parsed = new Date(Date.UTC(fullYear, mm - 1, dd, hh, min, 0, 0));

  // Reject impossible calendar dates (e.g. Feb 31)
  if (
    parsed.getUTCFullYear() !== fullYear ||
    parsed.getUTCMonth() !== mm - 1 ||
    parsed.getUTCDate() !== dd ||
    parsed.getUTCHours() !== hh ||
    parsed.getUTCMinutes() !== min
  ) {
    return null;
  }

  return parsed;
}

export function getCallbackTtlMinutes(): number {
  const rawValue = process.env.VIDEO_CALLBACK_TTL_MINUTES?.trim();
  if (!rawValue) {
    return 1440;
  }

  const ttl = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(ttl) || ttl <= 0) {
    return 1440;
  }

  return ttl;
}

export function signVideoCallbackParams(
  provider: string,
  videoId: string,
  timestamp: string
): string {
  const secret = getSigningSecret();
  const raw = `${provider}.${videoId}.${timestamp}`;
  return createHmac("sha256", secret)
    .update(raw)
    .digest("base64url")
    .slice(0, 16);
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyVideoCallbackSignature(params: {
  provider: string;
  videoId: string;
  timestamp: string;
  signature: string;
  now?: Date;
}): { valid: boolean; reason?: string } {
  const { provider, videoId, timestamp, signature, now = new Date() } = params;
  const parsedTime = parseCallbackTimestamp(timestamp);
  if (!parsedTime) {
    return { valid: false, reason: "invalid_timestamp" };
  }

  let expectedSignature: string;
  try {
    expectedSignature = signVideoCallbackParams(provider, videoId, timestamp);
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error ? error.message : "missing_signing_secret",
    };
  }

  if (!safeCompare(signature, expectedSignature)) {
    return { valid: false, reason: "signature_mismatch" };
  }

  const skewMs = CALLBACK_SKEW_MINUTES * 60 * 1000;
  const nowMs = now.getTime();
  const issuedAtMs = parsedTime.getTime();
  if (issuedAtMs - nowMs > skewMs) {
    return { valid: false, reason: "timestamp_in_future" };
  }

  const expiresAtMs = issuedAtMs + getCallbackTtlMinutes() * 60 * 1000;
  if (nowMs - expiresAtMs > skewMs) {
    return { valid: false, reason: "signature_expired" };
  }

  return { valid: true };
}

export function buildSignedVideoCallbackUrl(params: {
  baseUrl: string;
  provider: string;
  videoId: string;
  date?: Date;
}): string {
  const { baseUrl, provider, videoId, date = new Date() } = params;
  const timestamp = formatCallbackTimestamp(date);
  const signature = signVideoCallbackParams(provider, videoId, timestamp);
  const normalizedBaseUrl = toBaseUrl(baseUrl);

  return `${normalizedBaseUrl}/api/video-generation/callback/${provider}/${videoId}/${timestamp}/${signature}`;
}
