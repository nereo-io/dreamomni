/**
 * Yandex Metrica ClientID utilities
 * Simple functions for handling ClientID - no over-engineering
 */

/**
 * Initialize and save ClientID to cookie
 * Called once when YandexMetrica component mounts
 */
export function initClientId(): void {
  const metricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;
  if (!metricaId || typeof window === 'undefined') return;
  
  const tryGetClientId = (attempts = 0) => {
    if (window.ym) {
      window.ym(Number(metricaId), 'getClientID', (clientID: string) => {
        document.cookie = `ym_client_id=${clientID};max-age=2592000;path=/;samesite=lax`;
        console.log('[YandexMetrica] ClientID saved:', clientID);
      });
    } else if (attempts < 50) {
      setTimeout(() => tryGetClientId(attempts + 1), 100);
    }
  };
  
  tryGetClientId();
}

/**
 * Extract ClientID from cookie string
 * Used server-side when processing orders
 */
export function getClientIdFromCookie(cookieString: string): string | null {
  const match = cookieString.match(/ym_client_id=([^;]+)/);
  return match ? match[1] : null;
}