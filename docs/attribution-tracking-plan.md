# Order Attribution Plan (UTM + Referrer + Landing Path + YCLID + GCLID)

## Goals
- Attribute every order to a clear traffic source.
- Keep attribution data consistent and traceable at the user and order levels.
- Include gclid for Google Ads attribution.

## Scope
- Capture: utm_* params, referrer, landing_path, yclid, gclid.
- Persist: write first_touch + last_touch at user registration and copy into orders.
- Yandex: ym_client_id already stored on orders for offline conversion uploads.

## Definitions
- first_touch: the earliest identifiable attribution snapshot.
- last_touch: the most recent non-direct attribution snapshot.
- direct: no utm_* and referrer is empty/invalid or same-origin.

## Data Model (Proposed)
### Order level (orders table)
- first_touch (jsonb or text, JSON payload)
- last_touch (jsonb or text, JSON payload)
- ym_client_id (already in orders, keep using)

### User level (user/profile table)
- first_touch (jsonb or text, JSON payload)
- last_touch (jsonb or text, JSON payload)
- ym_client_id (optional, for Yandex offline conversion)

### JSON Payload (Suggested)
```json
{
  "source": "google",
  "medium": "cpc",
  "campaign": "spring_sale",
  "content": "ad_1",
  "term": "video ai",
  "referrer": "https://www.google.com/",
  "landing_path": "/pricing?utm_source=google&utm_medium=cpc",
  "yclid": null,
  "gclid": "Cj0KCQ...",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Capture Rules
1) Parse UTM fields from URL query:
   - utm_source, utm_medium, utm_campaign, utm_content, utm_term
2) Capture referrer (document.referrer).
3) Capture landing_path (window.location.pathname + search).
4) Capture yclid/gclid when present.

## Attribution Logic
- If utm_source exists, use UTM directly.
- Else if gclid exists, set source=google, medium=cpc, campaign=unknown (unless utm_campaign exists).
- Else if yclid exists, set source=yandex, medium=cpc, campaign=unknown (unless utm_campaign exists).
- Else if referrer is external, set source=referrer_domain, medium=referral.
- Else set source=direct, medium=none.

### first_touch
- Write once on the first identifiable attribution (utm/referrer/yclid/gclid).
- Never overwrite.

### last_touch (last non-direct)
- Update when any of the following is true:
  - utm_* present
  - gclid present
  - yclid present
  - external referrer present
- Do not update when attribution is direct.
- If last_touch is empty at order time, backfill direct/none for reporting.

## Flow Integration
1) Visitor lands on site
   - Client parses attribution and stores to cookie/localStorage.
2) User registers (required before order)
   - Server reads attribution cookie and writes first_touch + last_touch to user.
3) User creates order
   - Server copies user attribution snapshots into order.
   - If user snapshots are missing, fallback to cookie/request snapshot.
   - Also copy ym_client_id for Yandex offline conversion.

## Yandex Consistency
- Keep ym_client_id on orders (already implemented).
- Keep yclid in the attribution payload for reporting consistency.

## Google Ads Consistency
- Keep gclid in the attribution payload to distinguish paid vs organic.
- If only gclid exists (no UTM), report as google/cpc.

## Reporting Recommendations
- Primary report: group orders by last_touch->>'source/medium/campaign'.
- Secondary report: group orders by first_touch->>'source/medium/campaign'.
- Monitor direct share to validate attribution quality.

## Edge Cases
- Same-origin referrer -> treat as direct.
- Missing referrer (privacy/browser) -> treat as direct.
- Cookie cleared -> only a single snapshot will be available at order time.

## Implementation Notes
- Add a small client helper (e.g., lib/attribution.ts) to parse and store the cookie.
- Add a server helper to read the cookie and serialize JSON fields.
- Use a single cookie key (e.g., attr_snapshot) for the JSON payload.

## Database Change Plan
### Orders table
- first_touch jsonb
- last_touch jsonb
- ym_client_id (already exists, keep as-is)

### User/profile table
- first_touch jsonb
- last_touch jsonb

### Optional Indexes
- Expression indexes for reporting fields, e.g. last_touch->>'source' / 'medium' / 'campaign'.

## Future
- Add referrer domain classification (search/social/affiliate).
- Add multi-touch model if needed.
