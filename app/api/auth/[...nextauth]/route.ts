import { handlers } from "@/auth";

function truncate(value: string, max = 200): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function maskIp(ipRaw: string | null): string | null {
  if (!ipRaw) return null;

  // Take the first entry if x-forwarded-for contains a list.
  const first = ipRaw.split(",")[0]?.trim() ?? "";
  // Remove brackets and ports.
  const cleaned = first
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/:\d+$/, "");

  // IPv4
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(cleaned)) {
    const parts = cleaned.split(".");
    // Keep /24
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  // IPv6 (very rough masking)
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    return `${parts.slice(0, 4).join(":")}:xxxx:xxxx:xxxx:xxxx`;
  }

  return null;
}

function getHeader(req: Request, key: string): string {
  return req.headers.get(key) ?? "";
}

function detectCookieFlags(cookieHeader: string) {
  const lower = cookieHeader.toLowerCase();

  // We only detect by cookie NAME presence (no values logged).
  const has = (name: string) => lower.includes(`${name.toLowerCase()}=`);

  return {
    hasCsrf:
      has("authjs.csrf-token") ||
      has("__secure-authjs.csrf-token") ||
      has("next-auth.csrf-token") ||
      has("__host-next-auth.csrf-token") ||
      has("__secure-next-auth.csrf-token"),
    hasPkce:
      has("authjs.pkce.code_verifier") ||
      has("__secure-authjs.pkce.code_verifier") ||
      has("next-auth.pkce.code_verifier") ||
      has("__secure-next-auth.pkce.code_verifier"),
    hasSession:
      has("authjs.session-token") ||
      has("__secure-authjs.session-token") ||
      has("next-auth.session-token") ||
      has("__secure-next-auth.session-token"),
    hasState:
      // OAuth state cookie naming differs across versions/providers.
      lower.includes("state=") || lower.includes("oauth_state"),
  };
}

function wrapHandler(
  method: "GET" | "POST",
  // NextAuth route handlers are typed with NextRequest in Next.js. Keep flexible typing
  // while only using Request-compatible fields (headers/url).
  handler: (req: any, ctx: any) => Promise<Response>
) {
  return async (req: any, ctx: any) => {
    try {
      return await handler(req, ctx);
    } catch (err: any) {
      const cookieHeader = getHeader(req, "cookie");
      const xff = getHeader(req, "x-forwarded-for");
      const payload = {
        ts: new Date().toISOString(),
        method,
        path: (() => {
          try {
            return new URL(req.url).pathname;
          } catch {
            return "";
          }
        })(),
        host: getHeader(req, "host"),
        userAgent: truncate(getHeader(req, "user-agent"), 180),
        referer: truncate(getHeader(req, "referer"), 180),
        xForwardedHost: getHeader(req, "x-forwarded-host"),
        xForwardedProto: getHeader(req, "x-forwarded-proto"),
        ipMasked: maskIp(xff),
        cookieHeaderLen: cookieHeader.length,
        cookieFlags: detectCookieFlags(cookieHeader),
        errName: truncate(err?.name || "Error", 60),
        errMessage: truncate(err?.message || String(err), 200),
      };

      // Single-line JSON for log aggregation.
      console.error(JSON.stringify(payload));
      throw err;
    }
  };
}

export const GET = wrapHandler("GET", handlers.GET);
export const POST = wrapHandler("POST", handlers.POST);
