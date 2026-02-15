-- ============================================================================
-- Nereo Database Migration: Attribution snapshots for users and orders
-- Description: Store first/last attribution JSON payloads on users and orders.
-- Generated: 2026-02-05
-- ============================================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS first_touch jsonb,
ADD COLUMN IF NOT EXISTS last_touch jsonb;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_touch jsonb,
ADD COLUMN IF NOT EXISTS last_touch jsonb;

COMMENT ON COLUMN public.orders.first_touch IS 'First attribution snapshot (JSON).';
COMMENT ON COLUMN public.orders.last_touch IS 'Last non-direct attribution snapshot (JSON).';
COMMENT ON COLUMN public.users.first_touch IS 'First attribution snapshot (JSON).';
COMMENT ON COLUMN public.users.last_touch IS 'Last non-direct attribution snapshot (JSON).';

CREATE INDEX IF NOT EXISTS orders_last_touch_source_idx
  ON public.orders ((last_touch->>'source'));

CREATE INDEX IF NOT EXISTS orders_last_touch_medium_idx
  ON public.orders ((last_touch->>'medium'));

CREATE INDEX IF NOT EXISTS orders_last_touch_campaign_idx
  ON public.orders ((last_touch->>'campaign'));
