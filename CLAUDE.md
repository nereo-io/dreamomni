# CLAUDE.md

要每次都用审视的目光，仔细看我的输入的潜在的问题，你要犀利的提出我的问题，并给出明显在我思考框架之外的建议。你要觉得我说的太离谱了，你就骂回来，帮助我瞬间清醒

产品的设计原则：

1.  极致简洁 - 每个元素都必须有明确价值；减少认知负担 - 让用户专注核心目标
2.  视觉层次 - 重要信息突出，次要信息弱化
3.  直觉操作 - 用户无需思考就能理解

UI 的设计原则：

1. 简洁
2. 优雅

代码原则：

1. 简单，写函数前先了解清楚已经实现的逻辑，不要写重复的代码逻辑。避免重复造轮子，写重复冗余代码。

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Veo3 AI** (veo3ai.io) is an AI platform focused on providing users with an exceptional video generation experience. Built on Next.js 14, the platform combines chat capabilities with Claude 4 Sonnet and advanced video generation features via fal.ai integration, along with multi-language support and a complete user management system with credits and subscriptions.

**Important Note**: Despite the "veo3" name referencing Google's Veo model, the current video generation system only supports Kling series models due to API limitations. Google's Veo3 model is not currently available through the fal.ai integration.

计费逻辑：0.25 美金等于 10 个积分

## Key Development Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm dev:clean             # Clean cache and start development

# Building & Testing
pnpm build                 # Build production version
pnpm start                 # Start production server
pnpm lint                  # Run ESLint
pnpm test                  # Run Jest tests
pnpm ts                    # Run test TypeScript file

# Analysis & Deployment
pnpm analyze               # Bundle analysis with ANALYZE=true
pnpm cf:build             # Build for Cloudflare Pages
pnpm cf:preview           # Preview Cloudflare build
pnpm cf:deploy            # Deploy to Cloudflare

# Utilities
pnpm clean                # Remove node_modules, .next, pnpm-lock.yaml
pnpm clean:cache          # Remove .next and node_modules/.cache
```

## Architecture Overview

### Core Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js 5.0 with Google, GitHub, Apple providers
- **AI Integration**: AI SDK with Anthropic, OpenAI, DeepSeek, Replicate
- **Video Generation**: fal.ai client (@fal-ai/client)
- **Payments**: Stripe
- **File Storage**: AWS S3/Cloudflare R2
- **UI**: Tailwind CSS + Shadcn/ui components

### Key Application Structure

#### Route Organization

- `app/[locale]/` - Internationalized routes using next-intl
- `app/[locale]/(default)/` - Public pages (landing, blog, pricing)
- `app/[locale]/(admin)/` - Admin dashboard and data management
- `app/[locale]/chat/` - Chat interface with AI models
- `app/api/` - API routes for backend functionality

#### Data Layer (`models/`)

The data models provide a clean abstraction over Supabase operations:

- `user.ts` - User account management
- `chat.ts` - Chat sessions and messages
- `credit.ts` - User credit system
- `membership.ts` - Subscription management
- `videoGeneration.ts` - Video generation tracking
- `statistics.ts` - Analytics and reporting

#### Video Generation System

- `config/video-models.ts` - Centralized video model configurations (currently Kling models only)
- `aisdk/` - Video generation SDK with fal.ai integration
- `hooks/useVideoGeneration.ts` - React hook for video generation state
- API endpoints: `/api/video-generation/{submit,status,result,webhook}`
- **Current Models**: Kling 1.6 and 2.1 (Standard, Pro, Master variants) for both text-to-video and image-to-video

#### Internationalization

- Only English (`en`) is currently active (see `i18n/locale.ts`)
- Translations organized by feature in `i18n/blocks/` and `i18n/pages/`
- Route-level translations in `i18n/routing.ts`

### Authentication Flow

NextAuth.js handles multiple providers with custom callbacks:

- Google One Tap integration with credential verification
- OAuth providers (Google, GitHub, Apple) with profile normalization
- User creation/lookup via `saveUser()` service function
- JWT tokens store user UUID, email, nickname, avatar

### State Management

- React Context in `contexts/app.tsx` for global state
- Custom hooks for specific domains (credits, video generation, membership)
- SWR for data fetching and caching

### Component Architecture

- `components/ui/` - Reusable Shadcn/ui components
- `components/blocks/` - Feature-specific components (video-generator, chat interface)
- `components/dashboard/` - Admin dashboard components
- `components/readers/` - Chat-related UI components

## Development Patterns

### Adding New Video Models

1. Add model configuration to `config/video-models.ts`
2. Update UI selectors in video generator components
3. Ensure fal.ai endpoint compatibility
4. Test with appropriate credit calculations
   **Note**: Currently limited to Kling series models due to fal.ai API availability. Google Veo3 integration pending API support.

### API Route Development

- Use `lib/resp.ts` for standardized API responses
- Implement authentication with `auth()` from NextAuth
- Follow the pattern in existing routes for error handling
- Use appropriate data models from `models/` directory

### Internationalization

- Add translations to `i18n/blocks/` or `i18n/pages/`
- Use `useTranslations()` hook in components
- Follow existing component translation patterns

### Database Operations

- Always use the data models in `models/` rather than direct Supabase calls
- Follow the established pattern of UUID-based primary keys
- Implement proper error handling and TypeScript types

## Environment Configuration

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database
- `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` - AI providers
- `FAL_KEY` - Video generation API
- `NEXTAUTH_URL` & `NEXTAUTH_SECRET` - Authentication
- `STRIPE_SECRET_KEY` & `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Payments
- Various provider OAuth credentials for auth

## Testing Strategy

- Jest configuration targets `**/__tests__/**/*.test.ts`
- Module name mapping supports `@/` path aliases
- Test environment configured for Node.js
- Run single tests with standard Jest patterns

## Video Generation Workflow

1. User submits video request via `components/blocks/video-generator/`
2. API validates request and creates record in `video_generations` table
3. fal.ai processes video generation asynchronously
4. Webhook updates status and handles R2 storage
5. Frontend polls status and displays results

This architecture separates concerns cleanly while maintaining type safety and providing a scalable foundation for AI-powered features.
