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

**Seedance** is an AI video generation platform built on Next.js 14. Supports text/image-to-video with multiple providers (Volcano Engine, Kie.ai, fal.ai). Includes image generation (Nano Banana), multi-language support (en/de/ja/ko/ru), and payment processing (Creem/Stripe/Payssion).

**Key Info**:
- Rebranded from "Veo3 AI" to "Seedance"
- Credits: 0.25 USD = 10 credits
- Image generation: 2 credits (fixed)
- Git repo name: veo3
- Database: Supabase (project name: Seedance)

## Commands

```bash
# Development
pnpm dev         # Start dev (port 3000)
pnpm dev:clean   # Clean cache + start
pnpm build       # Production build
pnpm lint        # ESLint

# Testing
pnpm test        # Jest tests
pnpm ts          # Run ts/test.ts
jest path/to/test.test.ts  # Specific test

# SEO
pnpm seo:generate   # Generate SEO content
pnpm seo:all        # Run all SEO tasks

# Deployment
pnpm cf:build    # Cloudflare build
pnpm cf:deploy   # Deploy to CF

# Cleanup
rm -rf .next     # Clear cache
pnpm clean       # Full clean
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 App Router, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui, Radix UI
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: NextAuth.js 5.0 (Google, GitHub, Apple, Email)
- **Payments**: Creem (primary), Stripe, Payssion V2 (Russia)
- **Video**: ProviderFactory (Volcano/Kie.ai/Ali/fal.ai)
- **Image**: AIServiceManager (Nano Banana/Kie.ai)
- **i18n**: next-intl with locale routing
- **Analytics**: Plausible, Yandex Metrica

### Patterns
- **Model-Service-Component**: `models/` (DB) → `services/` (logic) → `components/` (UI)
- **Provider Pattern**: Unified interfaces for payments, video, image generation

### Key Flows

**Video Generation**:
1. `/api/video-generation/submit` → ProviderFactory selects provider
2. Provider submits to external API
3. `videoStatusService` tracks progress
4. Webhook updates at `/api/video-generation/webhook/*`

**Image Generation**:
1. `/api/image-generation/submit` → AIServiceManager
2. Optional prompt optimization
3. Provider API call (sync/async)
4. Status via `/api/ai-callback/[provider]`
5. Auto-refund on failure

**Payment**:
1. PaymentRouter selects provider (location-based)
2. Russian regions → Payssion, Others → Creem/Stripe
3. Webhook verification (HMAC-SHA256)
4. Auto credit distribution

### Database Schema
- `users` - Auth + credits balance
- `subscriptions` - Multi-provider subscriptions
- `video_generations` - Video tracking
- `image_generations` - Image tracking
- `orders` - Payment tracking
- `credits` - Transaction history

## Key Files

### Config
- `config/video-models.ts` - Model definitions + pricing
- `config/products.ts` - Product config
- `i18n/request.ts` - Locale config

### Services
- `services/payment/PaymentRouter.ts` - Payment routing
- `services/providers/ProviderFactory.ts` - Video provider selection
- `services/AIServiceManager.ts` - Image provider management
- `services/videoStatusService.ts` - Status tracking
- `services/creditsService.ts` - Credit management

### API Routes
- `app/api/video-generation/` - Video endpoints
- `app/api/image-generation/` - Image endpoints
- `app/api/creem/webhook/` - Creem webhooks
- `app/api/payssion/v2-webhook/` - Payssion webhooks
- `app/api/stripe-notify/` - Stripe notifications

### Providers
- `services/providers/VolcanoProvider.ts` - Seedance
- `services/providers/KieAiVeo3Provider.ts` - Veo3
- `services/providers/NanoBananaProvider.ts` - Image (Kie.ai)
- `services/providers/AliProvider.ts` - Ali Cloud
- `services/providers/FalProvider.ts` - fal.ai

## Development Tips

- Check if dev server running before `pnpm dev` (use port 3000 for ngrok)
- Cache issues: `rm -rf .next` or `pnpm dev:clean`
- Debug logging: `pnpm dev 2>&1 | tee dev.log`
- Run specific test: `jest path/to/test.test.ts`
- UI redesign uses `(home)` route group, see `docs/DEVELOPMENT.md`

## Environment Variables

### Core
```bash
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
```

### Payments
```bash
STRIPE_PUBLIC_KEY, STRIPE_PRIVATE_KEY, STRIPE_WEBHOOK_SECRET
PAYSSION_API_KEY, PAYSSION_WEBHOOK_SECRET
CREEM_API_KEY, CREEM_WEBHOOK_SECRET
```

### AI Providers
```bash
ARK_API_KEY           # Volcano Engine
KIE_AI_API_KEY        # Kie.ai (video + image)
ALI_API_KEY           # Ali Cloud
FAL_KEY               # fal.ai
OPENAI_API_KEY        # DALL-E
REPLICATE_API_TOKEN   # Replicate
HF_TOKEN              # Hugging Face
```

### Security & Analytics
```bash
TURNSTILE_SECRET_KEY  # Cloudflare Turnstile
NEXT_PUBLIC_YANDEX_METRICA_ID
YANDEX_OFFLINE_CONVERSION_TOKEN
NEXT_PUBLIC_PLAUSIBLE_DOMAIN
```

## Important Notes

### Video Models
- Defined in `config/video-models.ts`
- Credit calculation: `calculateCredits(modelId, duration, hasAudio, resolution)`
- Seedance: 480p/1080p with 5x price difference

### Image Generation
- Fixed 2 credits per generation
- Supports text-to-image + image-to-image
- CAPTCHA required for new users (10 credits balance)
- Auto-refund on failure

### Payment Flow
1. Location detection → payment method selection
2. Russian regions → Payssion
3. Others → Creem (primary) or Stripe (fallback)
4. Webhook verification → credit distribution

### Security
- RLS on all Supabase tables
- Webhook signature verification (HMAC-SHA256)
- Zod schemas for API validation
- Cloudflare Turnstile for bot protection

---

**For detailed development history and UI redesign docs, see `docs/DEVELOPMENT.md`**
