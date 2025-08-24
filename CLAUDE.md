# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Veo3 AI** (veo3ai.io) is an AI-powered video generation platform built on Next.js 14. The platform provides text-to-video and image-to-video generation using multiple AI providers, with a complete user management system, credits, and subscription tiers.

**Important Context**:
- Despite the "veo3" name, the platform supports multiple video generation providers
- Primary providers: Kie.ai (Veo3), Volcano Engine (Seedance), MiniMax (Hailuo), Ali Cloud
- Frontend language: English only (no Chinese support needed)
- Database: Supabase project named "Veo3"
- Credit pricing: $0.25 USD = 10 credits

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 with App Router, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui, Radix UI
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: NextAuth.js 5.0 (Google, GitHub, Apple, Email)
- **Payments**: Creem (primary), Stripe, Payssion V2 (Russian market)
- **Video Generation**: Multi-provider system via ProviderFactory
- **Internationalization**: next-intl with locale-based routing
- **Analytics**: Plausible, Yandex Metrica
- **Deployment**: Cloudflare Pages (standalone build)

### Key Architectural Patterns

#### Model-Service-Component Pattern
- **models/**: Database operations with Supabase
- **services/**: Business logic and provider integrations
- **components/**: UI components (blocks/, ui/, dashboard/)

#### Provider Pattern
- **PaymentRouter**: Unified payment provider selection
- **ProviderFactory**: Video generation provider routing
- **Provider interfaces**: Consistent API across different providers

### Video Generation Flow

1. Request arrives at `/api/video-generation/submit`
2. `ProviderFactory` selects provider based on model ID
3. Provider submits job to external API (Volcano, Kie.ai, etc.)
4. `videoStatusService` tracks generation progress
5. Provider webhooks update status at `/api/video-generation/webhook/*`
6. Generated videos stored in cloud storage

### Payment Processing

- **PaymentRouter** (`services/payment/PaymentRouter.ts`): Intelligent provider selection
- **Creem**: Primary payment processor for most regions
- **Stripe**: International fallback processor
- **Payssion V2**: Russian market (SberPay, YooMoney, Mir Card)
- Webhook signature verification (HMAC-SHA256 for Payssion)
- Automatic credit distribution on successful payment

### Database Schema

- **users**: Multi-provider auth, credits balance
- **subscriptions**: Stripe/Payssion/Creem subscriptions
- **video_generations**: Generation tracking with provider metadata
- **orders**: Cross-provider payment tracking
- **credits**: Transaction history and balance management

## Development Commands

### Core Development
```bash
pnpm dev         # Start dev server (port 3000, Node warnings disabled)
pnpm build       # Production build
pnpm start       # Start production server
pnpm lint        # Run ESLint
```

### Code Quality
- Always run `pnpm lint` before committing
- TypeScript checking via `pnpm build`

### Cache & Cleanup
```bash
pnpm clean:cache  # Clear Next.js cache
pnpm clean        # Full clean (node_modules, .next, pnpm-lock.yaml)
rm -rf .next      # Quick cache clear
```

### Deployment
```bash
pnpm cf:build    # Build for Cloudflare Pages
pnpm cf:preview  # Preview locally
pnpm cf:deploy   # Deploy to Cloudflare
```

### Testing & Analysis
```bash
pnpm test        # Run Jest tests
pnpm analyze     # Bundle analyzer
pnpm ts          # Run ts/test.ts script
```

## Key File Locations

### Configuration
- `next.config.mjs` - Next.js config with MDX, i18n, bundle analyzer
- `tailwind.config.ts` - Tailwind with custom animations
- `i18n/request.ts` - Locale configuration
- `config/video-models.ts` - Video model definitions and pricing

### Service Layer
- `services/payment/PaymentRouter.ts` - Payment provider routing
- `services/providers/ProviderFactory.ts` - Video provider selection
- `services/videoStatusService.ts` - Generation status tracking
- `services/creditsService.ts` - Credit management

### API Routes
- `app/api/video-generation/` - Video generation endpoints
- `app/api/subscription/` - Subscription management
- `app/api/creem/webhook/` - Creem payment webhooks
- `app/api/payssion/v2-webhook/` - Payssion webhooks

### Provider Implementations
- `services/providers/VolcanoProvider.ts` - Volcano Engine (Seedance)
- `services/providers/KieAiVeo3Provider.ts` - Kie.ai (Veo3)
- `services/providers/AliProvider.ts` - Ali Cloud
- `services/providers/FalProvider.ts` - fal.ai integration

## Environment Variables

### Core Services
```bash
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AUTH_SECRET
```

### Payment Providers
```bash
STRIPE_PUBLIC_KEY
STRIPE_PRIVATE_KEY
STRIPE_WEBHOOK_SECRET
PAYSSION_API_KEY
PAYSSION_WEBHOOK_SECRET
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
```

### Video Generation Providers
```bash
ARK_API_KEY           # Volcano Engine
KIE_AI_API_KEY        # Kie.ai
APICORE_API_KEY       # APICore (commented out)
ALI_API_KEY           # Ali Cloud
FAL_KEY               # fal.ai
```

### Analytics
```bash
NEXT_PUBLIC_YANDEX_METRICA_ID
YANDEX_OFFLINE_CONVERSION_TOKEN
NEXT_PUBLIC_PLAUSIBLE_DOMAIN
```

## Important Development Notes

### Local Development
- Check if dev server is already running before starting new instance
- Use port 3000 (typically bound to ngrok for testing)
- Debug logging: `pnpm dev 2>&1 | tee dev.log`

### Video Model Configuration
- Models defined in `config/video-models.ts`
- Credit calculation: `calculateCredits(modelId, duration, hasAudio, resolution)`
- Each provider has specific model IDs and capabilities
- Seedance models support 480p/1080p with 5x price difference

### Payment Flow
1. Location detection determines available payment methods
2. Russian regions → Payssion
3. Other regions → Creem (primary) or Stripe (fallback)
4. Webhook handlers process payment confirmations
5. Credits distributed automatically on successful payment

### Security Considerations
- Row-level security (RLS) on all Supabase tables
- Webhook signature verification for payment providers
- Zod schemas for API request validation
- Sensitive data filtered from logs

## Current Development Status

- **Active Branch**: main (or feature branch as specified)
- **Recent Features**: 
  - Creem payment integration
  - UI redesign with (home) route group
  - Yandex Metrica offline conversion tracking
- **Active Video Providers**: Kie.ai (Veo3), Volcano Engine (Seedance), MiniMax (Hailuo), Ali Cloud
- **Commented Providers**: Some fal.ai models (Kling), APICore Veo3