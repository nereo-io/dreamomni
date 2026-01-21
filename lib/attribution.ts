import { AttributionPayload, AttributionSnapshot } from '@/types/attribution';

const ATTR_COOKIE_NAME = 'attr_snapshot';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const FIELD_LIMITS: Record<string, number> = {
  source: 120,
  medium: 120,
  campaign: 200,
  content: 200,
  term: 200,
  referrer: 512,
  landing_path: 512,
  yclid: 128,
  gclid: 128,
  timestamp: 64,
};

const SNAPSHOT_KEYS: Array<keyof AttributionSnapshot> = [
  'source',
  'medium',
  'campaign',
  'content',
  'term',
  'referrer',
  'landing_path',
  'yclid',
  'gclid',
  'timestamp',
];

function truncate(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

function sanitizeValue(
  key: keyof AttributionSnapshot,
  value: unknown
): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const max = FIELD_LIMITS[key] ?? 256;
  return truncate(trimmed, max);
}

function sanitizeSnapshot(input: unknown): AttributionSnapshot | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const snapshot: AttributionSnapshot = {};

  SNAPSHOT_KEYS.forEach((key) => {
    const value = sanitizeValue(key, raw[key]);
    if (value !== null) {
      snapshot[key] = value;
    }
  });

  return Object.keys(snapshot).length > 0 ? snapshot : null;
}

function sanitizePayload(input: unknown): AttributionPayload | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const firstTouch = sanitizeSnapshot(raw.first_touch);
  const lastTouch = sanitizeSnapshot(raw.last_touch);

  if (!firstTouch && !lastTouch) return null;
  return {
    first_touch: firstTouch,
    last_touch: lastTouch,
  };
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split('=');
    if (key === name) {
      return rest.join('=') || null;
    }
  }
  return null;
}

function getExternalReferrer(referrer: string, host: string): string | null {
  if (!referrer) return null;
  try {
    const refUrl = new URL(referrer);
    if (refUrl.host === host) return null;
    return refUrl.toString();
  } catch {
    return null;
  }
}

function getReferrerDomain(referrer: string): string | null {
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}

function buildSnapshotFromUrl({
  url,
  referrer,
  now = new Date(),
}: {
  url: URL;
  referrer?: string | null;
  now?: Date;
}): { snapshot: AttributionSnapshot; isDirect: boolean } {
  const params = url.searchParams;
  const utmSource = sanitizeValue('source', params.get('utm_source'));
  const utmMedium = sanitizeValue('medium', params.get('utm_medium'));
  const utmCampaign = sanitizeValue('campaign', params.get('utm_campaign'));
  const utmContent = sanitizeValue('content', params.get('utm_content'));
  const utmTerm = sanitizeValue('term', params.get('utm_term'));
  const gclid = sanitizeValue('gclid', params.get('gclid'));
  const yclid = sanitizeValue('yclid', params.get('yclid'));

  const externalReferrer = getExternalReferrer(referrer || '', url.host);
  const referrerDomain = externalReferrer
    ? getReferrerDomain(externalReferrer)
    : null;

  const hasUtm =
    !!utmSource || !!utmMedium || !!utmCampaign || !!utmContent || !!utmTerm;
  const hasClickId = !!gclid || !!yclid;
  const hasExternalReferrer = !!referrerDomain;
  const isDirect = !hasUtm && !hasClickId && !hasExternalReferrer;

  const source = sanitizeValue(
    'source',
    utmSource || (gclid ? 'google' : yclid ? 'yandex' : referrerDomain || 'direct')
  ) || 'direct';
  const medium = sanitizeValue(
    'medium',
    utmMedium || (gclid || yclid ? 'cpc' : referrerDomain ? 'referral' : 'none')
  ) || 'none';
  const campaign = sanitizeValue(
    'campaign',
    utmCampaign || (gclid || yclid ? 'unknown' : null)
  );
  const landingPath = `${url.pathname}${url.search}`;

  const snapshot: AttributionSnapshot = {
    source,
    medium,
    campaign,
    content: utmContent,
    term: utmTerm,
    referrer: sanitizeValue('referrer', externalReferrer),
    landing_path: sanitizeValue('landing_path', landingPath),
    yclid,
    gclid,
    timestamp: now.toISOString(),
  };

  return { snapshot, isDirect };
}

function readDocumentCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`)
  );
  return match ? match[1] : null;
}

function writeDocumentCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? ';secure' : '';
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};max-age=${COOKIE_MAX_AGE_SECONDS};path=/;samesite=lax${secure}`;
}

export function captureAttribution(): AttributionPayload | null {
  if (typeof window === 'undefined') return null;
  const { snapshot, isDirect } = buildSnapshotFromUrl({
    url: new URL(window.location.href),
    referrer: document.referrer,
  });

  const existingRaw = readDocumentCookie(ATTR_COOKIE_NAME);
  const existing = existingRaw
    ? sanitizePayload(safeParseJson(safeDecode(existingRaw)))
    : null;

  const next: AttributionPayload = {
    first_touch: existing?.first_touch ?? null,
    last_touch: existing?.last_touch ?? null,
  };

  if (isDirect && !next.first_touch && !next.last_touch) {
    return next;
  }

  if (!isDirect) {
    if (!next.first_touch) {
      next.first_touch = snapshot;
    }
    next.last_touch = snapshot;
  }

  writeDocumentCookie(ATTR_COOKIE_NAME, JSON.stringify(next));
  return next;
}

export function getAttributionFromCookie(
  cookieHeader: string | null
): AttributionPayload | null {
  if (!cookieHeader) return null;
  const rawValue = getCookieValue(cookieHeader, ATTR_COOKIE_NAME);
  if (!rawValue) return null;
  const parsed = safeParseJson(safeDecode(rawValue));
  return sanitizePayload(parsed);
}

export function resolveAttribution({
  userAttribution,
  cookieAttribution,
  requestUrl,
  requestReferrer,
  allowDirectFallback = true,
}: {
  userAttribution?: AttributionPayload | null;
  cookieAttribution?: AttributionPayload | null;
  requestUrl?: string | null;
  requestReferrer?: string | null;
  allowDirectFallback?: boolean;
}): AttributionPayload {
  const userFirst = sanitizeSnapshot(userAttribution?.first_touch);
  const userLast = sanitizeSnapshot(userAttribution?.last_touch);
  const cookieFirst = sanitizeSnapshot(cookieAttribution?.first_touch);
  const cookieLast = sanitizeSnapshot(cookieAttribution?.last_touch);

  let firstTouch = userFirst || cookieFirst || null;
  let lastTouch = userLast || cookieLast || null;

  if (requestUrl) {
    try {
      const { snapshot, isDirect } = buildSnapshotFromUrl({
        url: new URL(requestUrl),
        referrer: requestReferrer,
      });

      if (!firstTouch && (!isDirect || allowDirectFallback)) {
        firstTouch = snapshot;
      }
      if (!lastTouch && (!isDirect || allowDirectFallback)) {
        lastTouch = snapshot;
      }
    } catch {
      // Ignore malformed requestUrl
    }
  }

  return { first_touch: firstTouch, last_touch: lastTouch };
}

function safeParseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export { ATTR_COOKIE_NAME };
