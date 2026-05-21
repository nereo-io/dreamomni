-- Align payment/runtime tables with the columns used by the app.
-- Additive only; safe to rerun with IF NOT EXISTS.

alter table public.order_tracking_audits
  add column if not exists user_uuid text,
  add column if not exists payment_provider text,
  add column if not exists payment_method text,
  add column if not exists has_client_id boolean default false,
  add column if not exists request_host text,
  add column if not exists request_referer text,
  add column if not exists request_user_agent text;

alter table public.ip_registration_limits
  add column if not exists first_registration timestamp with time zone,
  add column if not exists last_registration timestamp with time zone,
  add column if not exists is_blocked boolean default false;

update public.ip_registration_limits
set
  first_registration = coalesce(first_registration, first_registration_at, created_at, now()),
  last_registration = coalesce(last_registration, last_registration_at, updated_at, created_at, now()),
  is_blocked = coalesce(is_blocked, blocked_until is not null and blocked_until > now(), false)
where first_registration is null
   or last_registration is null
   or is_blocked is null;

alter table public.credit_distribution_schedule
  add column if not exists subscription_id text,
  add column if not exists payment_provider text,
  add column if not exists total_credits integer,
  add column if not exists monthly_credits integer,
  add column if not exists next_distribution_date timestamp with time zone,
  add column if not exists last_distribution_date timestamp with time zone;

update public.credit_distribution_schedule
set
  monthly_credits = coalesce(monthly_credits, credits_per_month),
  total_credits = coalesce(total_credits, credits_per_month * total_months),
  next_distribution_date = coalesce(next_distribution_date, next_distribution_at)
where monthly_credits is null
   or total_credits is null
   or next_distribution_date is null;

alter table public.stripe_subscriptions
  add column if not exists stripe_session_id text,
  add column if not exists plan_type text,
  add column if not exists amount integer,
  add column if not exists currency text default 'USD',
  add column if not exists canceled_at timestamp with time zone,
  add column if not exists product_name text;

update public.stripe_subscriptions
set
  stripe_session_id = coalesce(stripe_session_id, metadata->>'stripe_session_id'),
  plan_type = coalesce(plan_type, metadata->>'plan_type'),
  amount = coalesce(amount, nullif(metadata->>'amount', '')::integer),
  currency = coalesce(currency, metadata->>'currency', 'USD'),
  canceled_at = coalesce(canceled_at, nullif(metadata->>'canceled_at', '')::timestamp with time zone),
  product_name = coalesce(product_name, metadata->>'product_name')
where metadata is not null;

alter table public.creem_subscriptions
  add column if not exists plan_type text,
  add column if not exists amount integer,
  add column if not exists currency text default 'USD',
  add column if not exists canceled_at timestamp with time zone,
  add column if not exists product_name text,
  add column if not exists creem_product_id text,
  add column if not exists checkout_id text;

alter table public.subscriptions
  add column if not exists mandate_id text,
  add column if not exists payssion_subscription_id text,
  add column if not exists amount integer,
  add column if not exists currency text default 'USD',
  add column if not exists canceled_at timestamp with time zone,
  add column if not exists product_name text,
  add column if not exists product_id text;

update public.subscriptions
set
  payssion_subscription_id = coalesce(payssion_subscription_id, provider_subscription_id),
  currency = coalesce(currency, 'USD')
where payssion_subscription_id is null
   or currency is null;

create index if not exists idx_order_tracking_audits_order_no
  on public.order_tracking_audits(order_no);
create index if not exists idx_credit_distribution_schedule_next_distribution_date
  on public.credit_distribution_schedule(status, next_distribution_date);
create index if not exists idx_stripe_subscriptions_user_status
  on public.stripe_subscriptions(user_uuid, status);
create index if not exists idx_creem_subscriptions_user_status
  on public.creem_subscriptions(user_uuid, status);
create index if not exists idx_subscriptions_user_status
  on public.subscriptions(user_uuid, status);
