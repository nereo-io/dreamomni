export interface AttributionSnapshot {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
  yclid?: string | null;
  gclid?: string | null;
  timestamp?: string | null;
}

export interface AttributionPayload {
  first_touch?: AttributionSnapshot | null;
  last_touch?: AttributionSnapshot | null;
}
