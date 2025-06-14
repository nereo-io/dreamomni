# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Development Principles

### Code Quality Principles
1. **Simplicity First** - Before writing new functions, understand existing logic to avoid duplication and redundant code
2. **No Redundant Wheels** - Leverage existing implementations rather than recreating functionality
3. **Clarity Over Complexity** - Write code that expresses intent clearly

### Product Design Principles
1. **Extreme Simplicity** - Every element must have clear value; reduce cognitive load to help users focus on core goals
2. **Visual Hierarchy** - Emphasize important information, de-emphasize secondary information  
3. **Intuitive Operations** - Users should understand functionality without thinking

### UI Design Principles
1. **Simplicity** - Clean, uncluttered interfaces
2. **Elegance** - Refined and polished visual presentation

## Project Overview

**Veo3 AI** (veo3ai.io) is an AI platform focused on providing users with an exceptional video generation experience. Built on Next.js 14, the platform combines chat capabilities with Claude 4 Sonnet and advanced video generation features via fal.ai integration, along with multi-language support and a complete user management system with credits and subscriptions.

**Important Note**: Despite the "veo3" name referencing Google's Veo model, the current video generation system only supports Kling series models due to API limitations. Google's Veo3 model is not currently available through the fal.ai integration.

**计费逻辑**: 0.25 美金等于 10 个积分

**Language Note**: 该项目所有的前端展示语言为英文。不需要支持中文语言。Supabase 的数据库项目名称为 Veo3

## Key Development Commands

**Essential Commands for Daily Development:**
```bash
# Development
pnpm dev                    # Start development server with NODE_NO_WARNINGS=1
pnpm dev:clean             # Clean cache and start development
pnpm build                 # Build production version  
pnpm lint                  # Run ESLint (run this before committing)
```

**Testing:**
```bash
pnpm test                  # Run all Jest tests (tests in **/__tests__/**/*.test.ts)
pnpm ts                    # Run test TypeScript file (ts/test.ts)
jest path/to/test.test.ts  # Run specific test file
```

**Analysis & Deployment:**
```bash
pnpm start                 # Start production server with NODE_NO_WARNINGS=1
pnpm analyze               # Bundle analysis with ANALYZE=true
pnpm cf:build             # Build for Cloudflare Pages
pnpm cf:preview           # Preview Cloudflare build
pnpm cf:deploy            # Deploy to Cloudflare
```

**Utilities:**
```bash
pnpm clean                # Remove node_modules, .next, pnpm-lock.yaml
pnpm clean:cache          # Remove .next and node_modules/.cache
```

## Architecture Overview

### Core Technology Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js 5.0 with Google, GitHub, Apple providers + Supabase Email Authentication
- **AI Integration**: AI SDK with Anthropic, OpenAI, DeepSeek, Replicate, Azure OpenAI, OpenRouter
- **Video Generation**: fal.ai client (@fal-ai/client)
- **Payments**: Stripe + Payssion (multiple payment methods)
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

- Multiple languages supported: English (`en`), Russian (`ru`), Chinese (`zh`), Traditional Chinese (`zh-tw`), French (`fr`), Japanese (`ja`), Korean (`ko`)
- Translations organized by feature in `i18n/blocks/` and `i18n/pages/`
- Route-level translations in `i18n/routing.ts`
- Content obtained via `services/page.ts` helper functions

### Authentication Flow

NextAuth.js handles multiple providers with custom callbacks:

- **OAuth Providers**: Google, GitHub, Apple with profile normalization
- **Google One Tap**: Integration with credential verification
- **Email Authentication**: Supabase-powered email/password authentication
  - Registration: `POST /api/auth/signup` - User signup with email verification
  - Password Reset: `POST /api/auth/forgot-password` - Send reset email
  - Reset Password: `/auth/reset-password` - Handle password reset flow
  - Sign In: Via NextAuth credentials provider with Supabase validation
- **User Management**: All authentication methods create/lookup users via `saveUser()` service
- **JWT Tokens**: Store user UUID, email, nickname, avatar for all auth types

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

- Use `lib/resp.ts` for standardized API responses (`respJson`, `respErr`, `respData`)
- Implement authentication with `auth()` from NextAuth
- Follow the pattern in existing routes for error handling
- Use appropriate data models from `models/` directory
- **Email Authentication**: 
  - Use Zod schemas for request validation
  - Leverage `services/supabase-auth.ts` for Supabase auth operations
  - Handle errors gracefully with appropriate user-friendly messages
  - Follow security best practices (don't leak user existence info)

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
- `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY` - AI providers
- `FAL_KEY` - Video generation API
- `NEXTAUTH_URL` & `NEXTAUTH_SECRET` - Authentication
- `NEXT_PUBLIC_AUTH_EMAIL_ENABLED` - Enable email authentication (set to "true")
- `STRIPE_SECRET_KEY` & `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Payments
- `PAYSSION_APP_ID`, `PAYSSION_SECRET_KEY`, `PAYSSION_API_KEY` - Payssion payments
- Various provider OAuth credentials (Google, GitHub, Apple)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - S3 storage
- `CLOUDFLARE_R2_*` variables for R2 storage

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

## Development Guidelines

> **Important Note:** These guidelines are derived from the project's cursor rules and ensure consistency across the codebase.

### Project Structure & Naming Conventions

- **Pages**: Created in `app/[locale]/(group)/{pageName}/page.tsx`
- **Layouts**: Use `layout.tsx` in page or group directories
- **API routes**: Created in `app/api/{routeName}/route.ts`
- **Components**:
  - Reusable UI elements: `components/ui/{ComponentName}.tsx` (usually based on Shadcn/ui)
  - Page-specific blocks: `components/blocks/{BlockName}/{index.tsx, subcomponents.tsx}`
- **Services**: Business logic and data fetching helpers in `services/{serviceName}.ts`
- **Models**: Database interaction logic in `models/{modelName}.ts`
- **Types**: TypeScript definitions in `types/{category}/{typeName}.d.ts` or `types/{typeName}.ts`
- **i18n**:
  - Global messages: `i18n/messages/{locale}.json`
  - Page content: `i18n/pages/{pageDir}/{locale}.json`
  - Block content: `i18n/blocks/{blockDir}/{locale}.json`
- **Hooks**: Custom React Hooks in `hooks/useHookName.ts`
- **Contexts**: Global state providers in `contexts/ContextName.tsx`

### Naming Conventions

- Files/folders: kebab-case (e.g., `user-profile`, `page.tsx`)
- Components/types/interfaces: PascalCase (e.g., `UserProfile`, `HeroBlockProps`)
- Functions/variables: camelCase (e.g., `getUserData`, `isLoading`)

### Component Development

- Define clear TypeScript interfaces for component Props in `types/` directory or alongside components
- Use Tailwind CSS utility classes with `tailwind-merge` (`cn` utility from `@/lib/utils`)
- Use `shadcn/ui` components from `components/ui/` as foundation
- Use `getTranslations` (server-side) or `useTranslations` (client-side) for i18n
- Use `"use client";` directive for components requiring interactivity or hooks

### API Route Development

- Use `lib/resp.ts` helper functions (`respJson`, `respErr`) for consistent responses
- Protect routes with `auth()` from NextAuth, check `session.user`
- Call functions from `models/*` for database interactions
- Use try-catch blocks with appropriate error responses via `respErr`
- Validate input with Zod schemas

### Database Operations

- Always use data models in `models/` rather than direct Supabase calls
- Follow UUID-based primary key patterns
- Implement proper error handling and TypeScript types
- Respect Row Level Security (RLS) policies

### Video Generation Specific Patterns

- Video processing logic encapsulated in `services/video.ts`
- Use WebSocket or Server-Sent Events for real-time progress updates
- Manage generated video files with Supabase Storage or cloud storage
- Implement queue systems for handling multiple video generation requests
- Provide video thumbnails and preview functionality
- Support multiple video formats and resolution options
- Clear error messages and retry mechanisms for failed generations

### Analytics Integration (Plausible)

Event tracking configured in `components/analytics/plausible.tsx`:

**CSS Class Method (Simple):**
```tsx
<Button className="plausible-event-name=Video+Generation">
  Generate Video
</Button>
```

**JavaScript Method (Complex):**
```tsx
if (typeof window !== "undefined" && window.plausible) {
  window.plausible("Video Generation", {
    props: { model: "kling-1-6", user_id: user.uuid }
  });
}
```

**Event Naming:** Use descriptive names like `Video Generation`, `User Signup`. In CSS use `+` for spaces (`Video+Generation`), in JS use spaces (`Video Generation`). Configure Goals in Plausible backend to match event names exactly.

### Security & Performance Best Practices

- Validate all user input (client and server-side)
- Sanitize output to prevent XSS
- Follow NextAuth.js security best practices
- Use server components by default, client components only when necessary
- Lazy load components and images appropriately
- Optimize database queries
