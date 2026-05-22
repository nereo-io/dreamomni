# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Meta Rules

### Thinking
1. **Infer before asking** — Use available data to reason; only ask when inference is impossible
2. **Analysis must close the loop** — Cause → Conclusion → Solution → Verification, all required
3. **State assumptions, don't block** — Document assumptions and proceed; never stop to ask

### Execution
4. **Change only what's necessary** — No "drive-by" optimizations outside the request
5. **Clarify ambiguity first** — Restate understanding before acting on unclear requirements
6. **Verify before assuming** — External interfaces must be validated, never guess field names
7. **Follow project conventions** — Search existing code patterns before modifying
8. **Proactively diagnose root causes** — When user reports issues, provide debug steps and ranked causes

### Forbidden
- ❌ Assuming API field names
- ❌ Hardcoding configuration values
- ❌ Ignoring race conditions in multi-source state updates
- ❌ Outputting incomplete analysis

## Project Overview

**DreamOmni.ai** is an AI media generation platform built on Next.js 14 (App Router). It generates **video, image, music, and effects**, plus an agentic multi-modal composition UI ("Omni Studio") built around the flagship **Gemini Omni** video model (served via Kie.ai). Multiple providers back each media type, with location-based payment processing and 9-locale i18n.

**Rebrand lineage** (important — naming is inconsistent across layers): `Veo3 AI` → `Seedance` → `Gemini Omni`. As a result:
- Git repo / remote name is still `veo3`; the README still says "Veo3 AI" (stale).
- Supabase project is named `Seedance`; some env/config still references `seedance`.
- `config/dreamomni-messages.ts` actively sanitizes leftover `seedance`/old-URL strings → `dreamomni` at runtime.
- When adding user-facing copy, use "Gemini Omni" / "DreamOmni.ai". Don't "fix" internal `veo3`/`seedance` identifiers unless that's the task.

**Credits** are pool-based (not a flat USD rate). New users get **6 credits** (`CreditsAmount.NewUserGet`, `services/credit.ts`). Cost is computed per-model — see [Credits & Pricing](#credits--pricing).

## Commands

```bash
# Development
pnpm dev         # next dev (defaults to port 3000; use 3000 for ngrok webhooks)
pnpm dev:clean   # clean .next cache + node_modules/.cache, then dev
pnpm build       # Production build
pnpm lint        # next lint (ESLint)
pnpm analyze     # Bundle analyzer (ANALYZE=true build)

# Testing
pnpm test                    # Jest (ts-jest, ESM). Tests live in **/__tests__/**/*.test.ts
jest path/to/file.test.ts    # Run a single test file
pnpm exec playwright test    # Playwright E2E (config: playwright.config.ts, specs in tests/)
pnpm ts                      # Run ad-hoc script ts/test.ts via tsx

# SEO / content
pnpm seo:all          # Run all SEO content tasks (generate/fix-i18n/shorten-buttons/validate)
pnpm seo:generate     # Generate SEO content only
pnpm translate:blog   # Translate blog posts (scripts/translate-blog-aiplatform.ts)

# Deploy (Cloudflare Pages via next-on-pages)
pnpm cf:build    # Build for CF Pages
pnpm cf:deploy   # Build + deploy
```

**Per user preference (`CLAUDE.local.md`): only run `pnpm lint` / `pnpm build` when necessary, to save dev time.** Prefer exercising the changed behavior directly (see Code Conventions → Workflow).

## Architecture

### Tech Stack
- **Framework**: Next.js 14 App Router, TypeScript, deployed to Cloudflare Pages (`@cloudflare/next-on-pages`)
- **UI**: Tailwind CSS, Shadcn/ui, Radix UI, Framer Motion
- **DB/Auth**: Supabase (PostgreSQL + RLS); NextAuth.js 5 (Google, GitHub, Apple, VK, Email)
- **Payments**: Creem (primary), Stripe (fallback), Payssion V2 (Russia)
- **AI SDK**: Vercel AI SDK (`ai`) with Anthropic/OpenAI/Azure/DeepSeek/Replicate/OpenRouter adapters; `@google/generative-ai`
- **Storage**: S3-compatible (AWS SDK) via `services/imageStorageService.ts` (`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY`)
- **i18n**: next-intl, locales `en, ru, ja, ko, de, fr, es, pt, zh` (message JSON in `i18n/messages/`)
- **Analytics**: Plausible, Yandex Metrica, Microsoft Clarity, OpenPanel, Vercel Analytics

### Pattern: Model–Service–Component
`models/` (Supabase table accessors) → `services/` (business logic, provider orchestration, side effects) → `components/` (UI). Contracts/types in `models/` and `types/`. Keep side effects out of components.

### Route groups (`app/[locale]/`)
Locale-prefixed App Router. **API routes are NOT localized — they live at top-level `app/api/`.**
- `(home)` — the creation tools: `text-to-video`, `image-to-video`, `text-to-image`, `image-to-image`, `text-to-music`, `add-vocals`/`add-instrumental`, `video-effect`, `image-effect`, `ai-shorts`, `motion-control`, `reference-to-video`, `omni-studio`, `history`.
- `(default)` — marketing + logged-in console: landing page, per-model SEO landing pages (`[model]`), `blog/[slug]`, referral links (`i/[code]`), and `(console)` (`membership`, `my-credits`, `my-invites`, `my-orders`).
- `(admin)` — admin-only (e.g. blog post editor).
- `(legal)` — terms/privacy. `auth` — NextAuth pages. `pay-success/[session_id]` — post-payment.

### Generation types
Each media type has its own submit route + service + status mechanism. Status is **hybrid**: webhooks for async providers, polling where webhooks aren't available.

| Type | Submit route (`app/api/...`) | Key service | Status |
|------|------------------------------|-------------|--------|
| Video | `video-generation/submit` | `videoSubmitService` → `ProviderFactory` → provider | Webhook `video-generation/webhook/*`; some use signed callbacks |
| Image | `image-generation/submit` | `AIServiceManager` → image provider | Polling (`imagePollingService`) + `ai-callback/[provider]`; auto-refund on failure |
| Agent image | `agent/*` (+ image-generation) | `agentImageService`, `agentImageCallbackService` | Expands 1 prompt → multiple multi-angle images, concurrent (p-limit) |
| Music | `music-generation/submit` | `musicGenerationService` (Suno via Kie.ai) | Webhook (`musicWebhookService`) |
| Effects | `video-effect/submit`, `image-effect/submit` | `effectService` | Webhook/polling depending on provider (PixVerse/Hailuo) |

### Providers
- **Video**: `services/providers/ProviderFactory.ts` is a cached singleton factory. It resolves `modelId` → `VIDEO_MODELS[modelId].provider` (enum `VideoModelProvider`: `fal`/`volcano`/`byteplus`/`apicore`/`kieai`/`ali`/`evolink`/`maxapi`), then instantiates the matching provider with that provider's API key. For `kieai`, it further dispatches by `modelName` (`geminiomni`/`sora2`/`kling3`/`hailuo23`/`wan25`/`veo3`) to the right `KieAi*Provider`.
- **Image**: `services/AIServiceManager.ts` selects image providers (`NanoBananaProvider`, `KieAiGptImage2Provider`, `SeedreamProvider`, `FalImageProvider`). Image providers extend `BaseAIProvider` (`generateImage`/`editImage`/`checkImageStatus`/`getCostEstimate`/`buildCallbackUrl`).
- **Fallbacks**: video models can declare `fallbackModelIds` (tried in order on failure); image gen can fall back to fal.ai (`seedanceFallbackService`, `FALLBACK_TO_FAL_ENABLED`). Fallback entries are usually `internal: true` models hidden from the UI.
- Adding a video model = add an entry to `config/video-models.ts` (set `provider` + `modelName` + pricing fields); the factory routes it automatically. Adding a *new* provider also requires a `switch` case in `ProviderFactory`.

### Payments
- `services/payment/PaymentRouter.ts` picks methods by geolocation. **`shouldUsePayssion(countryCode)` is `=== 'RU'`** → Russia gets Payssion; everyone else gets Creem (primary) with Stripe fallback.
- Providers: `CreemProvider`, `StripeProvider`, `PayssionProvider` (all implement `PaymentProvider`). Orchestration in `PaymentProcessingService` / `SubscriptionManagementService`.
- Webhooks verify HMAC-SHA256 signatures, then distribute credits (`creditDistributionService`).

### Database (Supabase, accessors in `models/`)
`user`, `credit` (pool-based balance + transaction history), `videoGeneration`, `imageGeneration`, `musicGeneration`, `effectConfig`, `order`, `orderTrackingAudit`, `subscription` + `creem-subscription` + `stripe-subscription` (multi-provider), `membership`, `affiliate`, `payssionMandate`, `ipLimit`, `post` (blog), `statistics`. RLS on all tables.

## Code Conventions
(from `AGENTS.md` — follow these)
- **TypeScript**, 2-space indent, **single quotes in code, double quotes in JSX**.
- Components `PascalCase`; hooks start with `use`; utilities `camelCase`.
- Guard browser-only code with `if (typeof window !== 'undefined')`.
- Tests in `__tests__/` named `feature.test.ts`; **mock AI providers, Stripe, and Supabase clients**.
- **Workflow — verify before claiming done**: after any change, exercise the changed behavior. Frontend → test the route in a browser (Chrome MCP for logged-in/dashboard flows, Playwright for repeatable/CI/multi-viewport). Backend → call the real endpoint with a realistic payload and check status + side effects. For AI providers, Stripe, Supabase, auth, credits, webhooks, generation flows → decide whether a full smoke/E2E path is warranted. If something can't be tested, say exactly what wasn't tested and why.
- **Git**: commit only after self-tests pass; stage only files you edited (not unrelated user work); don't push unless explicitly asked; never commit secrets, `.env.local`, or `.next/`.

## Key Files

### Config (`config/`)
- `video-models.ts` — `VIDEO_MODELS` registry + `calculateCredits()`; the source of truth for video pricing/capabilities.
- `image-models.ts`, `music-models.ts`, `effect-models.ts` — registries for the other media types.
- `model-landing-pages.ts`, `video-effect-pages.ts`, `image-effect-pages.ts` — slugs/content for SEO landing & effect-template pages.
- `dreamomni-landing.ts`, `dreamomni-footer.ts`, `dreamomni-messages.ts` — homepage copy + rebrand string sanitization.
- `products.ts` — subscription tiers (mini/standard/plus/max, monthly/yearly). `aiProviders.ts`, `creem.ts`, `payssion.ts`.

### Services (`services/`)
- `providers/ProviderFactory.ts`, `providers/BaseAIProvider.ts` — video factory + image provider base.
- `AIServiceManager.ts` — image provider selection. `videoSubmitService.ts`, `videoStatusService.ts`, `videoWebhookParser.ts`, `videoCallbackSignature.ts` — video lifecycle.
- `agentImageService.ts` / `agentImageCallbackService.ts` — Omni Studio agent images. `musicGenerationService.ts` (+ `musicParamsBuilder`/`musicParamsValidator`/`musicWebhookService`). `effectService.ts`.
- `credit.ts` (credit balance/deduction — **not** `creditsService.ts`), `creditDistributionService.ts`, `membership.ts`, `membershipCache.ts`, `subscriptionTier.ts`, `affiliate.ts`.
- `payment/PaymentRouter.ts` and sibling providers/services.

### Other
- `services/imageStorageService.ts` — S3-compatible uploads. `middleware.ts` — locale routing.
- `docs/DEVELOPMENT.md` — development history & UI-redesign notes.

## Important Notes

### Credits & Pricing
- **Video**: `calculateCredits(modelId, duration, hasAudio?, resolution?)` in `config/video-models.ts`. Base = `duration × perSecondCredits` (anchored at 480p), then a **resolution multiplier that varies per model family** (e.g. Seedance 1.5 Pro 480p/720p/1080p = 1×/2×/4×; Volcano Seedance 2.0 720p = 2.2×; Kie Veo3 / Kling / Gemini Omni have their own 720p/1080p/4K rules). Audio can add `audioPremiumCredits`. **Don't assume a flat per-resolution rate — read the function.**
- **Image / Music**: fixed credits per model (from `image-models.ts` / `music-models.ts`). **Effects**: dynamic via a per-effect `calculateCredits(settings)` callback in `effect-models.ts`.
- Deduction is atomic and pool-based via the `deduct_credits_v2` Supabase RPC (tracks per-pool expiry for refunds). Failed generations auto-refund.

### Omni Studio
Multi-modal composition UI (`components/blocks/omni-studio/`, route `(home)/omni-studio`) for the Gemini Omni video model. Accepts text + image refs + video clips + audio refs + character refs. Inputs are counted as "units" (image = 1, video = 2, capped); supports 720p/1080p/4K with resolution-based pricing and an audio toggle. Backed by `KieAiDreamOmniProvider` + `agentImageService`.

### Security
- RLS on all Supabase tables; webhook HMAC-SHA256 verification; Zod schemas for API validation.
- Cloudflare Turnstile (`TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) for bot protection; CAPTCHA gating for new low-balance users on image gen.
- Signed video callbacks for models with `useSignedCallback: true` (`VIDEO_CALLBACK_SIGNING_SECRET`).

## Environment Variables

Provider keys are read via `process.env` in `ProviderFactory` / services (some are **not** in `.env.example`):

```bash
# Core
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_WEB_URL
STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY        # S3-compatible storage
VIDEO_CALLBACK_SIGNING_SECRET                 # signed video callbacks
CRON_SECRET

# Payments
CREEM_API_KEY, CREEM_API_SECRET, CREEM_WEBHOOK_SECRET, CREEM_BASE_URL
STRIPE_PUBLIC_KEY, STRIPE_PRIVATE_KEY, STRIPE_WEBHOOK_SECRET
PAYSSION_API_KEY, PAYSSION_*                  # Payssion V2 (Russia)

# AI providers (video/image/music)
KIE_AI_API_KEY, KIE_AI_BASE_URL               # Kie.ai (Gemini Omni, Veo3, Sora2, Kling, Hailuo, Wan, music, GPT-Image-2)
ARK_API_KEY                                   # Volcano Engine (Seedance)
FAL_KEY                                        # fal.ai
BYTEPLUS_API_KEY, APICORE_API_KEY
ALI_API_KEY, ALI_API_KEY_INTL                 # Ali Cloud
EVOLINK_API_KEY, EVOLINK_BASE_URL
MAXAPI_API_KEY, MAXAPI_BASE_URL
FALLBACK_TO_FAL_ENABLED                       # image gen fal.ai fallback toggle

# Auth providers
AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_GITHUB_SECRET, AUTH_APPLE_SECRET, AUTH_VK_SECRET

# Analytics & security
TURNSTILE_SECRET_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY
NEXT_PUBLIC_YANDEX_METRICA_ID, NEXT_PUBLIC_PLAUSIBLE_DOMAIN, NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
```

---

**For detailed development history and UI-redesign docs, see `docs/DEVELOPMENT.md`. Repository contribution rules are in `AGENTS.md`.**
