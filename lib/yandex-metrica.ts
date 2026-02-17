/**
 * Yandex Metrica ClientID utilities
 * Simple functions for handling ClientID - no over-engineering
 */

const CLIENT_ID_COOKIE_NAME = 'ym_client_id';
const YM_UID_COOKIE_NAME = '_ym_uid';
const CLIENT_ID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const CLIENT_ID_RETRY_INTERVAL_MS = 300;
const CLIENT_ID_MAX_RETRY_MS = 60 * 1000;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function writeClientIdCookie(clientId: string): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? ';secure' : '';
  document.cookie = `${CLIENT_ID_COOKIE_NAME}=${encodeURIComponent(clientId)};max-age=${CLIENT_ID_COOKIE_MAX_AGE_SECONDS};path=/;samesite=lax${secure}`;
}

function saveClientId(clientId: string | null | undefined): boolean {
  if (!clientId) return false;
  const normalized = clientId.trim();
  if (!normalized) return false;
  writeClientIdCookie(normalized);
  return true;
}

/**
 * Initialize and save ClientID to cookie
 * Called once when YandexMetrica component mounts
 */
export function initClientId(): void {
  const metricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;
  if (!metricaId || typeof window === 'undefined') return;

  if (readCookie(CLIENT_ID_COOKIE_NAME)) {
    return;
  }

  const startedAt = Date.now();

  const tryGetClientId = () => {
    if (readCookie(CLIENT_ID_COOKIE_NAME)) {
      return;
    }

    const ymUidCookie = readCookie(YM_UID_COOKIE_NAME);
    if (saveClientId(ymUidCookie)) {
      return;
    }

    if (typeof window.ym === 'function') {
      window.ym(Number(metricaId), 'getClientID', (clientID: string) => {
        saveClientId(clientID);
      });
    }

    if (Date.now() - startedAt < CLIENT_ID_MAX_RETRY_MS) {
      window.setTimeout(tryGetClientId, CLIENT_ID_RETRY_INTERVAL_MS);
    }
  };

  tryGetClientId();
}

/**
 * Extract ClientID from cookie string
 * Used server-side when processing orders
 */
export function getClientIdFromCookie(cookieString: string): string | null {
  const clientId = readCookieFromHeader(cookieString, CLIENT_ID_COOKIE_NAME);
  if (clientId) return clientId;

  // Fallback: use Yandex native uid cookie when custom client cookie is missing.
  return readCookieFromHeader(cookieString, YM_UID_COOKIE_NAME);
}

function readCookieFromHeader(
  cookieString: string,
  cookieName: string
): string | null {
  const escapedCookieName = cookieName.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
  const match = cookieString.match(
    new RegExp(`(?:^|;)\\s*${escapedCookieName}=([^;]+)`)
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
