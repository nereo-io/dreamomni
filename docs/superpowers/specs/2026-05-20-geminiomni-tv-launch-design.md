# GeminiOmni.tv Launch Design

## Goal

Launch `geminiomni.tv` quickly from the existing Seedance codebase as an independent SEO and product site for the Google Gemini Omni trend.

The first release should capture search demand around Gemini Omni while staying accurate about provider availability: Google has announced Gemini Omni Flash, but KIE public docs do not currently list Gemini Omni as a supported model. The site must not claim that it can run Gemini Omni until a real provider is available.

## Current Evidence

- Google announced Gemini Omni at Google I/O on 2026-05-19. Official positioning: Gemini Omni Flash can create video from combinations of text, image, audio, and video inputs, with conversational video editing and grounding in Gemini world knowledge.
- Google says the first Omni family model, Gemini Omni Flash, is rolling out to the Gemini app, Google Flow, and YouTube Shorts for Google AI Plus, Pro, and Ultra users.
- KIE public docs and model index currently list Google Nano Banana, Imagen, Gemini chat models, and Veo 3.1, but no Gemini Omni model entry.
- The Seedance app already contains the required foundation: Next.js, NextAuth, Supabase, email auth, Google OAuth, Stripe integration points, KIE provider config, sitemap, robots, structured data, i18n, and video generation flows.

## Product Positioning

Use the recommended first-release positioning:

1. Primary site identity: `GeminiOmni`.
2. Primary domain: `https://geminiomni.tv`.
3. Primary intent: Gemini Omni news, capability explanation, and SEO capture.
4. Product path: offer a working AI video generator using currently available models from the Seedance stack.
5. Availability disclaimer: Gemini Omni API and KIE support are not available yet; the site tracks availability and will support it when a reliable provider exists.
6. Compliance disclaimer: independent product, not affiliated with Google, Gemini, or Google DeepMind.

## First View

The homepage should be the actual product landing experience, not a generic marketing page.

Hero:

- H1: `Gemini Omni AI Video Generator`
- Supporting copy: explain that Gemini Omni is Google's new multimodal video model and that GeminiOmni.tv tracks access while offering practical AI video generation today.
- Primary CTA: `Try AI Video Generator`
- Secondary CTA: `Get Gemini Omni Updates`
- Status pill: `Gemini Omni API status: monitoring`

The first viewport should make the Gemini Omni topic obvious and leave a hint of the next section visible on desktop and mobile.

## Homepage Sections

The homepage should contain these sections, in this order:

1. Hero and generator entry.
2. Gemini Omni news summary.
3. What Gemini Omni can do.
4. Current model support status.
5. Try available AI video generation now.
6. Use cases for creators and marketers.
7. FAQ.
8. Independent product disclaimer.

The KIE status section must say:

`Gemini Omni is not currently listed in KIE public docs or market pages. GeminiOmni.tv will add native Gemini Omni support only after a real provider endpoint is available.`

## Data and Auth

Use the Seedance auth model:

- Email signup and login remain enabled.
- Google OAuth remains enabled after a new Google OAuth client is created for `geminiomni.tv`.
- Keep Supabase as the user and app database.
- Create a fresh Supabase project for `geminiomni`, not a shared Seedance database.
- Do not copy Seedance production secrets into committed files.
- Vercel envs should use new project-specific values.

## Payments

Stripe can remain wired as the payment provider, but the first release can keep real paid checkout disabled or minimal until the owner creates Stripe products and keys.

The app should preserve Stripe env variable slots and avoid breaking the pricing code path. Pricing copy should not promise Gemini Omni generation until provider support exists.

## Infrastructure

Target setup:

- GitHub repository: `liuweifly/geminiomni`.
- Local project path: `/Users/river/Projects/geminiomni`.
- Git source: Seedance repository copied or mirrored, with `upstream` pointing to `git@github.com:liuweifly/seedance.git`.
- New Vercel project: `geminiomni` in `team_pTUZk2EO9Idm85w8UMO6umJf`.
- New Supabase project: `geminiomni`, preferred region `ap-southeast-1` to match Seedance unless the owner chooses otherwise.
- Domain: `geminiomni.tv`, DNS managed in Cloudflare.
- Production URL: `https://geminiomni.tv`.

## External Access Boundaries

Known current access state:

- GitHub CLI is authenticated as `liuweifly` and has repo permissions.
- Vercel CLI local token is invalid, but Vercel connector access works for project discovery.
- Supabase connector can list organizations and projects. Creating a project requires selecting the organization and confirming cost.
- Wrangler is not available in this checkout, so Cloudflare DNS likely needs browser assistance or another authenticated path.
- `gcloud` is not available, so Google OAuth and GSC work likely need browser assistance or a logged-in Google console path.

## SEO Requirements

The first release must ship:

- Correct `NEXT_PUBLIC_WEB_URL=https://geminiomni.tv`.
- `public/robots.txt` pointing to `https://geminiomni.tv/sitemap.xml`.
- Sitemap generating GeminiOmni URLs.
- Homepage title and description focused on Gemini Omni.
- FAQ structured data for Gemini Omni questions.
- Clear independence disclaimer.
- GSC submission of `https://geminiomni.tv/sitemap.xml` as soon as production is live and verified.

## Verification Requirements

Before calling the launch complete, verify:

- `pnpm test` passes or any failures are documented as unrelated.
- `pnpm build` passes.
- Homepage renders in a browser at local or preview URL.
- `robots.txt` returns the new sitemap URL.
- `sitemap.xml` contains `https://geminiomni.tv`.
- Production Vercel deployment is ready.
- `https://geminiomni.tv` loads over HTTPS.
- Email auth and Google auth are configured for the new domain.
- Supabase envs point to the new project.
- GSC property exists and sitemap has been submitted, or the exact manual blocker is documented.

