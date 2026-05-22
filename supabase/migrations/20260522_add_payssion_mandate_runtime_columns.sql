-- Align Payssion mandate storage with the runtime fields used when creating
-- Payssion V2 mandates. Additive only; safe to rerun.

create extension if not exists pgcrypto;

create table if not exists public.payssion_mandates (
  id uuid primary key default gen_random_uuid(),
  user_uuid text not null,
  user_email text not null,
  mandate_id text not null unique,
  status text not null default 'pending',
  payment_method text not null,
  authorization_url text,
  authorized_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.payssion_mandates
  add column if not exists user_uuid text,
  add column if not exists user_email text,
  add column if not exists mandate_id text,
  add column if not exists status text default 'pending',
  add column if not exists payment_method text,
  add column if not exists authorization_url text,
  add column if not exists authorized_at timestamp with time zone,
  add column if not exists expires_at timestamp with time zone,
  add column if not exists created_at timestamp with time zone default now(),
  add column if not exists updated_at timestamp with time zone default now();

create unique index if not exists idx_payssion_mandates_mandate_id
  on public.payssion_mandates(mandate_id);

create index if not exists idx_payssion_mandates_user_status_method
  on public.payssion_mandates(user_uuid, status, payment_method);

grant select, insert, update, delete on public.payssion_mandates to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payssion_mandates'
      and policyname = 'Service role can manage payssion mandates'
  ) then
    create policy "Service role can manage payssion mandates"
      on public.payssion_mandates
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

notify pgrst, 'reload schema';
