# GeminiOmni.tv Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and launch `geminiomni.tv` from the Seedance codebase as an independent Gemini Omni SEO and product site.

**Architecture:** Fork Seedance into a new local project and GitHub repository, then replace public brand, domain, SEO copy, and homepage content while preserving the working Next.js, NextAuth, Supabase, Stripe, and video-generation foundations. External resources are created as new project-specific assets, with Google/Cloudflare actions handled through browser assistance if CLI credentials are unavailable.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, NextAuth, Supabase, Stripe, KIE-compatible video providers, Vercel, Cloudflare DNS, Google Search Console.

---

## File Structure

- Create: `/Users/river/Projects/geminiomni`
  Independent working copy derived from `/Users/river/Projects/seedance`.
- Modify: `/Users/river/Projects/geminiomni/package.json`
  Rename project metadata and scripts if needed.
- Modify: `/Users/river/Projects/geminiomni/.env.example`
  Replace public project name, domain, and provider placeholders.
- Modify: `/Users/river/Projects/geminiomni/public/robots.txt`
  Replace Seedance sitemap URL with GeminiOmni sitemap URL.
- Modify: `/Users/river/Projects/geminiomni/components/seo/structured-data.tsx`
  Replace organization, website, and software schema brand URLs.
- Modify: `/Users/river/Projects/geminiomni/app/[locale]/(default)/page.tsx`
  Remove Seedance-specific badge and disclaimer, render GeminiOmni-specific landing content if the existing CMS/page data is not sufficient.
- Modify: `/Users/river/Projects/geminiomni/i18n/messages/en.json`
  Replace homepage metadata and visible brand strings needed for the first release.
- Modify: `/Users/river/Projects/geminiomni/i18n/messages/zh.json`
  Keep Chinese locale coherent enough for build and smoke checks.
- Modify: `/Users/river/Projects/geminiomni/app/sitemap.ts`
  Verify generated URLs use `NEXT_PUBLIC_WEB_URL`.
- Test: `/Users/river/Projects/geminiomni/app/__tests__/sitemap.test.ts`
  Update expectations if they hard-code Seedance.

## Task 1: Create Independent Repository Copy

**Files:**
- Create directory: `/Users/river/Projects/geminiomni`
- Modify git remotes in: `/Users/river/Projects/geminiomni/.git/config`

- [ ] **Step 1: Confirm Seedance source is clean**

Run:

```bash
cd /Users/river/Projects/seedance
git status --short --branch
git remote -v
```

Expected:

```text
## main...origin/main
origin git@github.com:liuweifly/seedance.git (fetch)
origin git@github.com:liuweifly/seedance.git (push)
```

- [ ] **Step 2: Copy the repository**

Run:

```bash
cd /Users/river/Projects
cp -R seedance geminiomni
cd /Users/river/Projects/geminiomni
git status --short --branch
```

Expected:

```text
## main...origin/main
```

- [ ] **Step 3: Create the new GitHub repository**

Run:

```bash
cd /Users/river/Projects/geminiomni
gh repo create liuweifly/geminiomni --private --source=. --remote=origin --push
```

Expected:

```text
https://github.com/liuweifly/geminiomni
```

- [ ] **Step 4: Preserve Seedance as upstream**

Run:

```bash
cd /Users/river/Projects/geminiomni
git remote add upstream git@github.com:liuweifly/seedance.git || git remote set-url upstream git@github.com:liuweifly/seedance.git
git remote -v
```

Expected includes:

```text
origin git@github.com:liuweifly/geminiomni.git (fetch)
origin git@github.com:liuweifly/geminiomni.git (push)
upstream git@github.com:liuweifly/seedance.git (fetch)
upstream git@github.com:liuweifly/seedance.git (push)
```

## Task 2: Brand and Domain Replacement

**Files:**
- Modify: `/Users/river/Projects/geminiomni/package.json`
- Modify: `/Users/river/Projects/geminiomni/.env.example`
- Modify: `/Users/river/Projects/geminiomni/public/robots.txt`
- Modify: `/Users/river/Projects/geminiomni/components/seo/structured-data.tsx`

- [ ] **Step 1: Inspect current brand references**

Run:

```bash
cd /Users/river/Projects/geminiomni
rg -n "Seedance|seedance|seedance.tv|www.seedance.tv|Bytedance" package.json .env.example public components app i18n config | sed -n '1,240p'
```

Expected: a list of references to update or intentionally preserve only when talking about alternative models.

- [ ] **Step 2: Update package metadata**

Edit `/Users/river/Projects/geminiomni/package.json` so the top metadata is:

```json
{
  "name": "geminiomni",
  "version": "1.0.0",
  "private": true,
  "author": "jasper",
  "description": "GeminiOmni.tv - Gemini Omni AI video generator and model tracker.",
  "homepage": "https://geminiomni.tv"
}
```

Keep the existing scripts and dependencies unchanged.

- [ ] **Step 3: Update env example public identity**

Edit `/Users/river/Projects/geminiomni/.env.example` so the public identity block is:

```dotenv
NEXT_PUBLIC_WEB_URL = "https://geminiomni.tv"
NEXT_PUBLIC_PROJECT_NAME = "GeminiOmni"
```

Keep all secret values empty in `.env.example`.

- [ ] **Step 4: Update robots sitemap**

Edit `/Users/river/Projects/geminiomni/public/robots.txt` so the sitemap line is:

```text
Sitemap: https://geminiomni.tv/sitemap.xml
```

- [ ] **Step 5: Update structured data brand**

Edit `/Users/river/Projects/geminiomni/components/seo/structured-data.tsx` to use:

```ts
const site = {
  name: 'GeminiOmni',
  url: 'https://geminiomni.tv',
  logo: 'https://geminiomni.tv/logo.png',
  supportEmail: 'support@geminiomni.tv',
};
```

Use this constant for Organization, WebSite, and SoftwareApplication schema values.

- [ ] **Step 6: Run focused brand scan**

Run:

```bash
cd /Users/river/Projects/geminiomni
rg -n "seedance.tv|www.seedance.tv|Bytedance|Seedance" package.json .env.example public components/seo app i18n/messages/en.json i18n/messages/zh.json
```

Expected: no domain references to Seedance remain in generic site identity files. Seedance model references may remain in model configs and alternative-model copy.

- [ ] **Step 7: Commit brand foundation**

Run:

```bash
cd /Users/river/Projects/geminiomni
git add package.json .env.example public/robots.txt components/seo/structured-data.tsx
git commit -m "chore: initialize geminiomni branding"
```

Expected: commit succeeds.

## Task 3: Build Gemini Omni Homepage

**Files:**
- Modify: `/Users/river/Projects/geminiomni/app/[locale]/(default)/page.tsx`
- Modify: `/Users/river/Projects/geminiomni/i18n/messages/en.json`
- Modify: `/Users/river/Projects/geminiomni/i18n/messages/zh.json`

- [ ] **Step 1: Inspect homepage data path**

Run:

```bash
cd /Users/river/Projects/geminiomni
sed -n '1,220p' 'app/[locale]/(default)/page.tsx'
rg -n "\"hero\"|\"aiModelsHero\"|\"faq\"|\"Seedance\"" i18n/messages/en.json i18n/messages/zh.json | sed -n '1,220p'
```

Expected: identify whether homepage copy is fully i18n-driven or needs an inline first-release component.

- [ ] **Step 2: Add first-release copy to English messages**

Add or update homepage metadata in `/Users/river/Projects/geminiomni/i18n/messages/en.json` with these exact public claims:

```json
{
  "metadata": {
    "title": "Gemini Omni AI Video Generator and Model Tracker",
    "description": "Track Google Gemini Omni availability and create AI videos today with available video models while native Gemini Omni API support is monitored."
  }
}
```

If the file uses a different metadata key, update the existing equivalent keys instead of creating duplicate unused keys.

- [ ] **Step 3: Add Gemini Omni landing sections**

Edit `/Users/river/Projects/geminiomni/app/[locale]/(default)/page.tsx` so the rendered homepage contains these visible strings in English:

```tsx
const omniStatus = 'Gemini Omni API status: monitoring';
const unsupportedNotice =
  'Gemini Omni is not currently listed in KIE public docs or market pages. GeminiOmni.tv will add native Gemini Omni support only after a real provider endpoint is available.';
const independentNotice =
  'GeminiOmni.tv is an independent product and is not affiliated with Google, Gemini, or Google DeepMind.';
```

Render them near the hero, model-support section, and footer disclaimer respectively.

- [ ] **Step 4: Connect CTAs to existing routes**

Use existing routes for the first release:

```tsx
const primaryCtaHref = locale === 'en' ? '/text-to-video' : `/${locale}/text-to-video`;
const secondaryCtaHref = '#gemini-omni-updates';
```

Expected: primary CTA sends users into the existing video-generation flow; secondary CTA lands on a waitlist or updates section.

- [ ] **Step 5: Keep FAQ structured data**

Ensure homepage FAQ data includes these questions:

```ts
const geminiOmniFaq = [
  {
    question: 'Is Gemini Omni available through KIE right now?',
    answer: 'No. Gemini Omni is not currently listed in KIE public docs or market pages. GeminiOmni.tv is monitoring provider availability.'
  },
  {
    question: 'Can I generate AI videos on GeminiOmni.tv today?',
    answer: 'Yes. The first release offers available AI video generation paths while native Gemini Omni support is monitored.'
  },
  {
    question: 'Is GeminiOmni.tv affiliated with Google?',
    answer: 'No. GeminiOmni.tv is an independent product and is not affiliated with Google, Gemini, or Google DeepMind.'
  }
];
```

- [ ] **Step 6: Run build checks for homepage**

Run:

```bash
cd /Users/river/Projects/geminiomni
pnpm test --runInBand
pnpm build
```

Expected: both commands pass. If a pre-existing lint or unrelated test failure appears, capture the exact failing file and decide whether it blocks launch.

- [ ] **Step 7: Commit homepage**

Run:

```bash
cd /Users/river/Projects/geminiomni
git add 'app/[locale]/(default)/page.tsx' i18n/messages/en.json i18n/messages/zh.json
git commit -m "feat: add gemini omni launch homepage"
```

Expected: commit succeeds.

## Task 4: Verify Sitemap and SEO Surfaces

**Files:**
- Modify if needed: `/Users/river/Projects/geminiomni/app/sitemap.ts`
- Modify if needed: `/Users/river/Projects/geminiomni/app/__tests__/sitemap.test.ts`
- Modify if needed: `/Users/river/Projects/geminiomni/public/robots.txt`

- [ ] **Step 1: Inspect sitemap domain source**

Run:

```bash
cd /Users/river/Projects/geminiomni
sed -n '1,320p' app/sitemap.ts
sed -n '1,120p' app/__tests__/sitemap.test.ts
```

Expected: sitemap uses `process.env.NEXT_PUBLIC_WEB_URL` or a central base URL.

- [ ] **Step 2: Set local env for SEO verification**

Create or edit untracked `/Users/river/Projects/geminiomni/.env.local` with:

```dotenv
NEXT_PUBLIC_WEB_URL=https://geminiomni.tv
NEXT_PUBLIC_PROJECT_NAME=GeminiOmni
```

Do not commit `.env.local`.

- [ ] **Step 3: Run sitemap test**

Run:

```bash
cd /Users/river/Projects/geminiomni
NEXT_PUBLIC_WEB_URL=https://geminiomni.tv pnpm test --runInBand app/__tests__/sitemap.test.ts
```

Expected: test passes and sitemap entries are built without runtime git dependency.

- [ ] **Step 4: Commit sitemap fixes if needed**

Run only if files changed:

```bash
cd /Users/river/Projects/geminiomni
git add app/sitemap.ts app/__tests__/sitemap.test.ts public/robots.txt
git commit -m "fix: update geminiomni seo surfaces"
```

Expected: commit succeeds or no commit is needed.

## Task 5: Create Supabase Project

**Files:**
- Read: `/Users/river/Projects/geminiomni/supabase/migrations/*.sql`
- Update Vercel envs later, not local committed files.

- [ ] **Step 1: Confirm Supabase organization**

Use Supabase connector:

```text
list_organizations
```

Expected organizations include:

```text
dvfbclegobhmojgbpkpr / AstroInspire
vercel_icfg_0OALIiRamjTBgu07lpnFwimV / liuweifly's projects
```

Ask the owner which organization to use before creating the project. Recommended: `dvfbclegobhmojgbpkpr / AstroInspire` because existing Seedance is there.

- [ ] **Step 2: Confirm project cost**

Use Supabase connector:

```text
get_cost type=project organization_id=<selected organization id>
confirm_cost amount=<returned amount> recurrence=<returned recurrence> type=project
```

Expected: cost confirmation ID is returned.

- [ ] **Step 3: Create project**

Use Supabase connector:

```text
create_project name=geminiomni organization_id=<selected organization id> region=ap-southeast-1 confirm_cost_id=<confirmation id>
```

Expected: a new Supabase project ref for `geminiomni`.

- [ ] **Step 4: Wait until healthy**

Use Supabase connector:

```text
list_projects
```

Expected: `geminiomni` appears with `ACTIVE_HEALTHY`.

- [ ] **Step 5: Apply migrations**

Run from local shell after project credentials are available:

```bash
cd /Users/river/Projects/geminiomni
ls supabase/migrations/*.sql
```

For each migration, apply it through Supabase MCP migration tooling if available, or through the Supabase dashboard SQL editor. Expected: schema exists for auth-linked application tables used by the app.

## Task 6: Create Vercel Project and Deploy

**Files:**
- Create: `/Users/river/Projects/geminiomni/.vercel/repo.json`
- Configure envs in Vercel project, not in committed files.

- [ ] **Step 1: Check Vercel connector access**

Use Vercel connector:

```text
list_teams
list_projects teamId=team_pTUZk2EO9Idm85w8UMO6umJf
```

Expected: team `liuweifly's projects` is available.

- [ ] **Step 2: Create or import Vercel project**

Use Vercel dashboard or API path available in session to create project:

```text
Project name: geminiomni
Git repository: liuweifly/geminiomni
Framework: Next.js
Root directory: .
Production branch: main
```

Expected: Vercel project ID is created.

- [ ] **Step 3: Configure required Vercel envs**

Set these production env names from new project resources:

```dotenv
NEXT_PUBLIC_WEB_URL=https://geminiomni.tv
NEXT_PUBLIC_PROJECT_NAME=GeminiOmni
SUPABASE_URL=<new supabase url>
SUPABASE_ANON_KEY=<new supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<new supabase service role key>
NEXT_PUBLIC_SUPABASE_URL=<new supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new supabase anon key>
AUTH_SECRET=<new openssl rand -base64 32 value>
AUTH_GOOGLE_ID=<new google oauth client id>
AUTH_GOOGLE_SECRET=<new google oauth client secret>
NEXT_PUBLIC_AUTH_GOOGLE_ID=<new google oauth client id>
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED=false
NEXT_PUBLIC_AUTH_EMAIL_ENABLED=true
STRIPE_PUBLIC_KEY=
STRIPE_PRIVATE_KEY=
STRIPE_WEBHOOK_SECRET=
KIE_AI_API_KEY=<project kie key if enabling generation>
KIE_AI_BASE_URL=
CRON_SECRET=<new openssl rand -base64 32 value>
VIDEO_CALLBACK_SIGNING_SECRET=<new openssl rand -base64 32 value>
```

Expected: no Seedance secrets are reused unless the owner explicitly approves a shared provider key.

- [ ] **Step 4: Deploy**

Run one of:

```bash
cd /Users/river/Projects/geminiomni
git push origin main
```

or use Vercel connector deploy support if the project is linked.

Expected: production deployment reaches `READY`.

- [ ] **Step 5: Inspect build logs**

Use Vercel connector:

```text
list_deployments projectId=<geminiomni project id> teamId=team_pTUZk2EO9Idm85w8UMO6umJf
get_deployment_build_logs idOrUrl=<latest deployment id or url> teamId=team_pTUZk2EO9Idm85w8UMO6umJf
```

Expected: build has no blocking errors.

## Task 7: Configure Google Auth

**Files:**
- No committed file changes unless callback docs are added.

- [ ] **Step 1: Create OAuth client**

Use Google Cloud Console with browser assistance if no CLI credential exists:

```text
Application type: Web application
Name: GeminiOmni.tv
Authorized JavaScript origins:
https://geminiomni.tv
https://www.geminiomni.tv
Authorized redirect URIs:
https://geminiomni.tv/api/auth/callback/google
https://www.geminiomni.tv/api/auth/callback/google
```

Expected: client ID and client secret are available.

- [ ] **Step 2: Configure Vercel envs**

Set:

```dotenv
AUTH_GOOGLE_ID=<client id>
AUTH_GOOGLE_SECRET=<client secret>
NEXT_PUBLIC_AUTH_GOOGLE_ID=<client id>
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
```

Expected: Vercel redeploys or envs are available for next deployment.

- [ ] **Step 3: Browser test Google login**

Open:

```text
https://geminiomni.tv/auth/signin
```

Expected: Google login starts, returns to GeminiOmni domain, and creates or loads a session.

## Task 8: Configure Cloudflare DNS and Domain

**Files:**
- No committed file changes.

- [ ] **Step 1: Add domain to Cloudflare**

Use Cloudflare dashboard with browser assistance:

```text
Domain: geminiomni.tv
Plan: Free unless owner chooses otherwise
```

Expected: Cloudflare returns authoritative nameservers.

- [ ] **Step 2: Update nameservers at Spaceship**

Use Spaceship dashboard:

```text
Replace current nameservers with the Cloudflare nameservers for geminiomni.tv.
```

Expected: Cloudflare zone status becomes active after propagation.

- [ ] **Step 3: Add Vercel DNS records**

In Cloudflare DNS, configure Vercel recommended records:

```text
A     @      76.76.21.21
CNAME www    cname.vercel-dns.com
```

If Vercel recommends different records for the project, follow Vercel's domain screen.

- [ ] **Step 4: Add domains in Vercel**

In Vercel project `geminiomni`, add:

```text
geminiomni.tv
www.geminiomni.tv
```

Expected: Vercel shows valid configuration and SSL provisioning succeeds.

## Task 9: Submit GSC

**Files:**
- No committed file changes unless Google verification meta tag is required.

- [ ] **Step 1: Add Search Console property**

Use Google Search Console browser flow:

```text
Property type: Domain
Domain: geminiomni.tv
```

Expected: Google provides DNS TXT verification.

- [ ] **Step 2: Add DNS TXT verification**

In Cloudflare DNS, add:

```text
TXT @ google-site-verification=<value from GSC>
```

Expected: GSC verifies ownership.

- [ ] **Step 3: Submit sitemap**

In GSC:

```text
https://geminiomni.tv/sitemap.xml
```

Expected: sitemap submission accepted.

## Task 10: Launch Verification

**Files:**
- No committed file changes unless verification finds defects.

- [ ] **Step 1: Verify production homepage**

Run:

```bash
curl -I https://geminiomni.tv
curl -L https://geminiomni.tv | rg -n "Gemini Omni AI Video Generator|Gemini Omni API status|not affiliated with Google"
```

Expected: HTTP 200 and all key strings found.

- [ ] **Step 2: Verify robots and sitemap**

Run:

```bash
curl -L https://geminiomni.tv/robots.txt
curl -L https://geminiomni.tv/sitemap.xml | rg -n "https://geminiomni.tv"
```

Expected: robots points to GeminiOmni sitemap and sitemap contains GeminiOmni URLs.

- [ ] **Step 3: Browser smoke test**

Use browser automation or manual browser:

```text
Open https://geminiomni.tv
Click Try AI Video Generator
Open sign-in
Test email auth path or Google auth path
Return to homepage
```

Expected: navigation works, no obvious console errors, auth route is GeminiOmni branded.

- [ ] **Step 4: Final commit and push**

Run:

```bash
cd /Users/river/Projects/geminiomni
git status --short
git push origin main
```

Expected: working tree clean and main pushed.

## Self-Review

- Spec coverage: The plan covers source repository creation, upstream preservation, Gemini Omni landing copy, KIE availability honesty, Supabase, Vercel, Google OAuth, Cloudflare DNS, GSC, and production verification.
- Placeholder scan: The plan uses concrete commands and explicit external values. Dynamic IDs and secrets are marked as values returned by provider tools or dashboards because they cannot be known before creation.
- Type consistency: Paths and names consistently use `geminiomni`, `GeminiOmni`, and `geminiomni.tv`.

