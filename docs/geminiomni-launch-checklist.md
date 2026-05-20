# GeminiOmni Launch Checklist

This project is forked from Seedance and adapted for `geminiomni.tv`.

## Current Verified State

Last checked: 2026-05-20 21:15 Asia/Shanghai.

- GitHub repository: `liuweifly/geminiomni`
- Current branch: `main`
- Latest commit: `a97b5b0b docs: capture geminiomni launch blockers`
- Vercel project: `geminiomni`
- Current production deployment: `dpl_9EdssrgZx5pa24RM1W7iLoTWGVb1`
- Current protected Vercel deployment URL: `https://geminiomni-4vw114nhl-liuweiflys-projects.vercel.app`
- Custom domain is not live yet: `geminiomni.tv` still resolves to Spaceship default DNS.
- Current nameservers:
  - `launch1.spaceship.net`
  - `launch2.spaceship.net`
- Current apex A record: `198.18.1.154`
- Cloudflare Wrangler login works for `liuweifly@yahoo.com`, but the OAuth token only has `zone:read`; API zone creation failed because it requires `com.cloudflare.api.account.zone.create`.
- Cloudflare Dashboard login was attempted in Chrome and is blocked at the Turnstile human verification step. Complete the CAPTCHA/login in Chrome, then continue adding `geminiomni.tv`.
- Cloudflare API currently returns no zone for `geminiomni.tv`.
- Supabase project `geminiomni` now exists in `AstroInspire` / `ap-southeast-1`: `kqqiwlzkewkarouqsyds`.
- Supabase project creation cost for the Seedance org (`AstroInspire`, `dvfbclegobhmojgbpkpr`) is `$10/month`.

## Current Positioning

- Product name: `GeminiOmni`
- Primary domain: `https://geminiomni.tv`
- Support email: `support@geminiomni.tv`
- Native Gemini Omni generation: disabled until an integrated provider exposes a real Gemini Omni endpoint
- KIE status at launch prep: Gemini Omni was not listed in public KIE docs or market pages

## Vercel

- Project name: `geminiomni`
- Project ID: `prj_lXSSo6L8xgHcsY7EUoPHVwNlcAdC`
- Team: `liuweifly's projects`
- Production domain targets:
  - `geminiomni.tv`
  - `www.geminiomni.tv`
- Currently configured production environment variables:
  - `NEXT_PUBLIC_WEB_URL=https://geminiomni.tv`
  - `NEXT_PUBLIC_PROJECT_NAME=GeminiOmni`
  - `NEXTAUTH_URL=https://geminiomni.tv`
  - `AUTH_SECRET`
  - `NEXTAUTH_SECRET`
  - `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true`
- Required production environment variables before Google auth:
  - `SUPABASE_SERVICE_ROLE_KEY` (recommended; currently not available through the exposed tools, so server DB access falls back to anon key)
  - `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `NEXT_PUBLIC_AUTH_GOOGLE_ID`
  - `NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED`
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

Set the domain nameservers at Spaceship to the nameservers assigned by Cloudflare after adding `geminiomni.tv` as a Cloudflare zone.

Current blocker:

- The logged-in Wrangler token cannot create zones.
- The Cloudflare Dashboard page is open in Chrome, but login is blocked by Turnstile human verification.
- Complete the human verification/login in Chrome, add `geminiomni.tv` in Cloudflare Dashboard, or provide a Cloudflare API token with account zone creation and DNS edit permissions.
- After Cloudflare assigns nameservers, update the Spaceship nameservers from `launch1.spaceship.net` / `launch2.spaceship.net` to Cloudflare's pair.

Minimum token capability needed if using an API token instead of the Dashboard:

- Account-level permission to create zones for account `037a0c886060490ecda55ce7bd76ce10`
- Zone DNS edit permission for `geminiomni.tv` after the zone exists
- Zone read permission for verification

Verification commands after adding the zone:

```bash
TOKEN=$(pnpm dlx wrangler auth token | tail -n 1)
curl -sS -H "Authorization: Bearer ${TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=geminiomni.tv" | jq
dig +short NS geminiomni.tv
dig +short A geminiomni.tv
curl -sSI https://geminiomni.tv/ | head
```

Use DNS records that satisfy Vercel domain verification:

- `A` record for `geminiomni.tv` pointing to `76.76.21.21`
- `A` record for `www.geminiomni.tv` pointing to `76.76.21.21`

Start with DNS-only records until Vercel TLS and domain verification are green.

## Supabase

Recommended organization: `AstroInspire`, because the source Seedance project is there and uses `ap-southeast-1`.

Created project:

- Name: `geminiomni`
- Region: `ap-southeast-1`
- Project ID/ref: `kqqiwlzkewkarouqsyds`
- URL: `https://kqqiwlzkewkarouqsyds.supabase.co`
- Monthly cost from Supabase API: `$10/month`

Completed sequence:

1. Confirmed cost and organization.
2. Created Supabase project `geminiomni` in `AstroInspire` / `ap-southeast-1`.
3. Applied a Seedance-compatible bootstrap schema for the app's current public tables and core RPC functions.
4. Pulled project URL and anon keys.
5. Wrote Supabase URL/anon env vars and `NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true` to Vercel production.
6. Redeployed production to `dpl_9EdssrgZx5pa24RM1W7iLoTWGVb1`.

Still pending:

- Configure Supabase Auth site URL and redirect URLs for `https://geminiomni.tv` once dashboard/auth config access is available.
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

- The new GeminiOmni project currently reports 25 public tables with RLS disabled, matching the Seedance-style launch posture but exposing public tables to anon/authenticated roles.
- Enabling RLS without policies can break the app, so this needs a deliberate migration rather than an automatic blanket fix.

Verification:

- `list_tables` shows 25 public tables plus `video_generations_with_membership`.
- SQL smoke check returned `public_table_count=26`, `get_user_valid_credits_sum('smoke')=0`, `check_user_exists_by_email('nobody@example.com')=0`, and the membership view exists.
- Protected Vercel deployment sampled `/`, `/robots.txt`, `/sitemap.xml`, `/ru/text-to-video`, `/pricing`, `/en/auth/signin`: all returned HTTP 200 through a Vercel share-cookie flow.
- `/api/auth/email-signin` with invalid credentials returned HTTP 401 and `invalid_credentials`, proving the Supabase-backed email auth path is wired rather than missing env.

## Google Auth

Create a Google OAuth web client after the custom domain resolves.

Authorized JavaScript origins:

- `https://geminiomni.tv`

Authorized redirect URIs:

- `https://geminiomni.tv/api/auth/callback/google`

If preview auth testing is needed, add the current Vercel preview URL separately and remove it after launch.

Vercel env after Google OAuth client creation:

- `AUTH_GOOGLE_ID=<client id>`
- `NEXT_PUBLIC_AUTH_GOOGLE_ID=<client id>`
- `AUTH_GOOGLE_SECRET=<client secret>`
- `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`
- `NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED=false` initially, unless One Tap is explicitly tested

## Google Search Console

Submit only after DNS and HTTPS are live.

- Property: `https://geminiomni.tv`
- Sitemap: `https://geminiomni.tv/sitemap.xml`

Verify that `robots.txt` points to the same sitemap and that the sitemap returns HTTP 200 on the custom domain before submitting.

Pre-submit checks:

```bash
curl -sSI https://geminiomni.tv/ | head
curl -sS https://geminiomni.tv/robots.txt
curl -sS https://geminiomni.tv/sitemap.xml | head
```
