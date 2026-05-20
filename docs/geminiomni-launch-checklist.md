# GeminiOmni Launch Checklist

This project is forked from Seedance and adapted for `geminiomni.tv`.

## Current Positioning

- Product name: `GeminiOmni`
- Primary domain: `https://geminiomni.tv`
- Support email: `support@geminiomni.tv`
- Native Gemini Omni generation: disabled until an integrated provider exposes a real Gemini Omni endpoint
- KIE status at launch prep: Gemini Omni was not listed in public KIE docs or market pages

## Vercel

- Project name: `geminiomni`
- Production domain targets:
  - `geminiomni.tv`
  - `www.geminiomni.tv`
- Required production environment variables before enabling auth and generation:
  - `NEXT_PUBLIC_WEB_URL=https://geminiomni.tv`
  - `NEXT_PUBLIC_PROJECT_NAME=GeminiOmni`
  - `NEXTAUTH_URL=https://geminiomni.tv`
  - `AUTH_SECRET`
  - `NEXTAUTH_SECRET`
  - `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true`
  - `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`
  - `NEXT_PUBLIC_AUTH_GOOGLE_ID`

## Cloudflare DNS

Set the domain nameservers at Spaceship to the nameservers assigned by Cloudflare after adding `geminiomni.tv` as a Cloudflare zone.

Use DNS records that satisfy Vercel domain verification:

- `A` record for `geminiomni.tv` pointing to `76.76.21.21`
- `A` record for `www.geminiomni.tv` pointing to `76.76.21.21`

Start with DNS-only records until Vercel TLS and domain verification are green.

## Supabase

Recommended organization: `AstroInspire`, because the source Seedance project is there and uses `ap-southeast-1`.

Recommended project:

- Name: `geminiomni`
- Region: `ap-southeast-1`

Before copying the Seedance schema, review table security. The source Seedance project currently has public tables with RLS disabled, so do not blindly reproduce that state without policies.

## Google Auth

Create a Google OAuth web client after the custom domain resolves.

Authorized JavaScript origins:

- `https://geminiomni.tv`

Authorized redirect URIs:

- `https://geminiomni.tv/api/auth/callback/google`

If preview auth testing is needed, add the current Vercel preview URL separately and remove it after launch.

## Google Search Console

Submit only after DNS and HTTPS are live.

- Property: `https://geminiomni.tv`
- Sitemap: `https://geminiomni.tv/sitemap.xml`

Verify that `robots.txt` points to the same sitemap and that the sitemap returns HTTP 200 on the custom domain before submitting.
