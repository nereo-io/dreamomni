# DreamOmni Launch Checklist

This project is forked from Seedance and adapted for `dreamomni.ai`.

## Current Verified State

Last checked: 2026-05-20 22:15 Asia/Shanghai.

- GitHub repository: `nereo-io/dreamomni`
- Current branch: `main`
- Latest pushed code/docs commit before this status update: `30340f12 docs: update dreamomni infra status`
- Vercel project: `dreamomni`
- Current production deployment: `dpl_B7Jw4TCKGPQubBYhf8GxRTSKhZuZ`
- Current production deployment URL: `https://dreamomni-6deu0mdgj-liuweiflys-projects.vercel.app`
- Custom domains are live on Vercel:
  - `https://dreamomni.ai`
  - `https://www.dreamomni.ai`
- Current Cloudflare nameservers:
  - `aiden.ns.cloudflare.com`
  - `leanna.ns.cloudflare.com`
- Current apex A record: `76.76.21.21`
- Current `www` record: `cname.vercel-dns.com`
- Google Search Console domain property is verified and `https://dreamomni.ai/sitemap.xml` is submitted successfully.
- Supabase project `dreamomni` now exists in `AstroInspire` / `ap-southeast-1`: `kqqiwlzkewkarouqsyds`.
- Supabase project creation cost for the Seedance org (`AstroInspire`, `dvfbclegobhmojgbpkpr`) is `$10/month`.

## Current Positioning

- Product name: `DreamOmni`
- Primary domain: `https://dreamomni.ai`
- Support email: `support@dreamomni.ai`
- Native Gemini Omni generation: disabled until an integrated provider exposes a real Gemini Omni endpoint
- KIE status at launch prep: Gemini Omni was not listed in public KIE docs or market pages

## Vercel

- Project name: `dreamomni`
- Project ID: `prj_lXSSo6L8xgHcsY7EUoPHVwNlcAdC`
- Team: `liuweifly's projects`
- Production domain targets:
  - `dreamomni.ai`
  - `www.dreamomni.ai`
- Currently configured production environment variables:
  - `NEXT_PUBLIC_WEB_URL=https://dreamomni.ai`
  - `NEXT_PUBLIC_PROJECT_NAME=DreamOmni`
  - `NEXTAUTH_URL=https://dreamomni.ai`
  - `AUTH_SECRET`
  - `NEXTAUTH_SECRET`
  - `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true`
  - `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `NEXT_PUBLIC_AUTH_GOOGLE_ID`
  - `NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED=false`
- Recommended production environment variables still pending:
  - `SUPABASE_SERVICE_ROLE_KEY` (recommended; currently not available through the exposed tools, so server DB access falls back to anon key)
- Required production environment variables before enabling generation:
  - `STORAGE_ENDPOINT`
  - `STORAGE_REGION`
  - `STORAGE_ACCESS_KEY`
  - `STORAGE_SECRET_KEY`
  - `STORAGE_BUCKET`
  - `STORAGE_DOMAIN`
  - `KIE_AI_API_KEY`
  - `FAL_KEY`
  - `VIDEO_CALLBACK_SIGNING_SECRET`
  - `VIDEO_CALLBACK_TTL_MINUTES`
  - provider-specific keys only for models intentionally enabled, for example `BYTEPLUS_API_KEY`, `APICORE_API_KEY`, `ALI_API_KEY`, `ARK_API_KEY`
- Payment env should wait for the user's Stripe account:
  - `STRIPE_PUBLIC_KEY`
  - `STRIPE_PRIVATE_KEY`
  - `STRIPE_WEBHOOK_SECRET`

## Cloudflare DNS

Cloudflare zone is created and active enough for authoritative DNS checks.

- Zone ID: `5809b67ce74104495284706a9814438f`
- Nameservers assigned by Cloudflare:
  - `aiden.ns.cloudflare.com`
  - `leanna.ns.cloudflare.com`
- Spaceship nameservers were updated from `launch1.spaceship.net` / `launch2.spaceship.net` to Cloudflare.
- WHOIS reflected the Cloudflare nameservers after the Spaceship update.
- Cloudflare DNS records:
  - `A` `dreamomni.ai` -> `76.76.21.21`, DNS-only
  - `CNAME` `www` -> `cname.vercel-dns.com`, DNS-only
  - `TXT` `dreamomni.ai` -> `google-site-verification=fFeCY_k7aAdeKjZG8qESms6sZYkajBbA8gjLdANVCOI`

Verification commands:

```bash
dig +short NS dreamomni.ai
dig +short A dreamomni.ai
curl -sSI https://dreamomni.ai/ | head
```

Google DNS-over-HTTPS confirmed:

- `A dreamomni.ai` -> `76.76.21.21`
- `CNAME www.dreamomni.ai` -> `cname.vercel-dns.com.`
- `TXT dreamomni.ai` includes the GSC verification token.

## Supabase

Recommended organization: `AstroInspire`, because the source Seedance project is there and uses `ap-southeast-1`.

Created project:

- Name: `dreamomni`
- Region: `ap-southeast-1`
- Project ID/ref: `kqqiwlzkewkarouqsyds`
- URL: `https://kqqiwlzkewkarouqsyds.supabase.co`
- Monthly cost from Supabase API: `$10/month`

Completed sequence:

1. Confirmed cost and organization.
2. Created Supabase project `dreamomni` in `AstroInspire` / `ap-southeast-1`.
3. Applied a Seedance-compatible bootstrap schema for the app's current public tables and core RPC functions.
4. Pulled project URL and anon keys.
5. Wrote Supabase URL/anon env vars and `NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true` to Vercel production.
6. Redeployed production to `dpl_9EdssrgZx5pa24RM1W7iLoTWGVb1`.
7. Configured Supabase Auth site URL and redirect URLs for the production domain.

Still pending:

- Retrieve/write `SUPABASE_SERVICE_ROLE_KEY` if dashboard/API access exposes it.

Seedance source project:

- Supabase project ID: `mwlygwsarwhklcnhzdny`
- Organization: `AstroInspire`
- Region: `ap-southeast-1`
- Database: Postgres 17

Source public tables detected:

- `affiliates`
- `agent_assets`
- `attribution_daily_stats`
- `big_customer_crm`
- `big_customer_crm_sync_meta`
- `credit_distribution_history`
- `credit_distribution_schedule`
- `credits`
- `creem_subscriptions`
- `daily_order_stats`
- `daily_regional_stats`
- `effect_configs`
- `image_generations`
- `ip_limits`
- `ip_registration_limits`
- `memberships`
- `music_generations`
- `order_tracking_audits`
- `orders`
- `payssion_mandates`
- `payssion_transactions`
- `posts`
- `prompt_translations`
- `stripe_subscriptions`
- `subscriptions`
- `users`
- `video_annotations`
- `video_generations`

Source RPC/functions detected:

- `append_image_to_agent_generation`
- `archive_old_completed_image_generations`
- `calculate_daily_attribution_stats`
- `calculate_daily_order_stats`
- `calculate_daily_regional_stats`
- `check_user_exists_by_email`
- `cleanup_old_failed_image_generations`
- `deduct_credits_v2`
- `get_credit_trend`
- `get_daily_credit_overview`
- `get_seedance_stats`
- `get_sidebar_stats`
- `get_user_credit_pools`
- `get_user_valid_credits_sum`
- `increment_agent_asset_download_count`
- `mark_agent_task_failed`
- `update_updated_at_column`
- `upsert_ip_registration`

Security note:

- The new DreamOmni project currently reports 25 public tables with RLS disabled, matching the Seedance-style launch posture but exposing public tables to anon/authenticated roles.
- Enabling RLS without policies can break the app, so this needs a deliberate migration rather than an automatic blanket fix.

Verification:

- `list_tables` shows 25 public tables plus `video_generations_with_membership`.
- SQL smoke check returned `public_table_count=26`, `get_user_valid_credits_sum('smoke')=0`, `check_user_exists_by_email('nobody@example.com')=0`, and the membership view exists.
- Protected Vercel deployment sampled `/`, `/robots.txt`, `/sitemap.xml`, `/ru/text-to-video`, `/pricing`, `/en/auth/signin`: all returned HTTP 200 through a Vercel share-cookie flow.
- `/api/auth/email-signin` with invalid credentials returned HTTP 401 and `invalid_credentials`, proving the Supabase-backed email auth path is wired rather than missing env.

## Google Auth

Google OAuth is configured in Google Cloud project `DreamOmni` (`dreamomni-496913`).

- OAuth app name: `DreamOmni`
- User type: `External`
- Publishing status: `In production`
- OAuth client name: `DreamOmni Web`
- OAuth client type: `Web application`

Authorized JavaScript origins:

- `https://dreamomni.ai`

Authorized redirect URIs:

- `https://dreamomni.ai/api/auth/callback/google`

If preview auth testing is needed, add the current Vercel preview URL separately and remove it after launch.

Vercel env after Google OAuth client creation:

- `AUTH_GOOGLE_ID=<client id>`
- `NEXT_PUBLIC_AUTH_GOOGLE_ID=<client id>`
- `AUTH_GOOGLE_SECRET=<client secret>`
- `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`
- `NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED=false`

Verification:

- `https://dreamomni.ai/auth/signin` shows `Sign in with Google`.
- Clicking Google redirects to `accounts.google.com` with the production client ID and redirect URI `https://dreamomni.ai/api/auth/callback/google`.
- A production OAuth smoke test completed successfully and returned to the signed-in `https://dreamomni.ai/image-to-video` page.

## Google Search Console

Domain property is verified and the sitemap is submitted.

- Property: `sc-domain:dreamomni.ai`
- Sitemap: `https://dreamomni.ai/sitemap.xml`
- Verification method: DNS TXT through Cloudflare
- Sitemap submission result: `Success`
- First successful read: 2026-05-20
- Discovered pages reported by GSC: `81`

Latest checks:

```bash
curl -sSI https://dreamomni.ai/ | head
curl -sS https://dreamomni.ai/robots.txt
curl -sS https://dreamomni.ai/sitemap.xml | head
```
