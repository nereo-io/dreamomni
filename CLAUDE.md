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

**Seedance** is an advanced AI video generation platform that transforms text and image inputs into high-quality, cinematic videos. Built on Next.js 14, the platform leverages ByteDance's Seedance 1.0 model to deliver professional-grade video generation with smooth motion, rich details, and cinematic aesthetics. The platform includes multi-shot video storytelling, and a complete user management system with credits and subscriptions.

**Key Features**: 
- **1080p Video Generation**: Creates high-quality videos with cinematic aesthetics
- **Multi-shot Storytelling**: Native support for narrative video creation with visual consistency
- **Style Versatility**: Supports diverse styles from photorealism to cyberpunk and illustration
- **Complex Prompt Understanding**: Precisely interprets natural language instructions for creative control
- **Multi-agent Interactions**: Controls character interactions and camera movements

**Important Note**: The platform has been rebranded from "Veo3 AI" to "Seedance". The video generation system supports multiple providers including Volcano Engine (Seedance), APICore (Veo3), fal.ai, and KieAi integration.

**计费逻辑**: 0.25 美金等于 10 个积分

**Language Support**: The project supports 5 languages: English (en), German (de), Japanese (ja), Korean (ko), and Russian (ru). All i18n files use "Seedance" as the product name. Supabase database project name is Seedance.

## Key Development Commands

### Core Development
```bash
pnpm dev         # Start dev server (port 3000, Node warnings disabled)
pnpm dev:clean   # Clean cache and start development
pnpm build       # Production build
pnpm start       # Start production server
pnpm lint        # Run ESLint (run this before committing)
```

### Testing
```bash
pnpm test                  # Run all Jest tests (tests in **/__tests__/**/*.test.ts)
pnpm ts                    # Run test TypeScript file (ts/test.ts)
jest path/to/test.test.ts  # Run specific test file
```

### Analysis & Deployment
```bash
pnpm analyze     # Bundle analysis with ANALYZE=true
pnpm cf:build    # Build for Cloudflare Pages
pnpm cf:preview  # Preview Cloudflare build
pnpm cf:deploy   # Deploy to Cloudflare
```

### Cache & Cleanup
```bash
pnpm clean:cache  # Clear Next.js cache
pnpm clean        # Full clean (node_modules, .next, pnpm-lock.yaml)
rm -rf .next      # Quick cache clear
```

### SEO Content Generation
```bash
pnpm seo:generate        # Generate SEO content
pnpm seo:fix-i18n        # Fix i18n issues
pnpm seo:shorten-buttons # Shorten button text
pnpm seo:validate        # Validate SEO content
pnpm seo:all             # Run all SEO tasks
pnpm seo:help            # Show SEO help
```

## 项目开发记录

- 当前的 git 仓库是 veo3
- ✅ 已完成界面改版第一阶段：重构主页界面架构，实现新的用户体验 (commit: 7ec59ea)

## 界面改版需求

### 路由结构重构

- **新增 `(home)` 路由群组**：分离主页和默认页面逻辑
- **首页访问逻辑**：
  - 未登录用户访问 `/` → 显示 landing page
  - 已登录用户访问 `/` → 自动重定向到 `/home`
- **应用页面访问逻辑**：
  - `/home` 及其子路由对所有用户开放
  - 未登录用户功能受限，引导登录
  - 已登录用户功能完整

### 新页面架构

1. **`/home`**: 原 landing page，现为主应用界面
2. **`/image-to-video`**: 图片转视频页面
3. **`/text-to-video`**: 文本转视频页面
4. **`/video-affects`**: 视频特效页面
5. **`/my-creations`**: 我的创作页面（原 `/history`）
6. **Console 页面**: membership、credits、orders、invites 保持不变

### 组件库扩展

- **Hero Section**: 主页英雄区域
- **CTA Section**: 行动召唤区域
- **Effect Grid**: 特效网格展示
- **Video Example Grid**: 视频示例网格
- **Category Tabs**: 分类标签页
- **Home Layout**: 主页布局组件（Header + Sidebar）

### 特效系统

- **特效数据结构**: `data/effects.ts` 定义特效分类和数据
- **特效分类**: 支持多种视频特效类型
- **特效卡片**: 统一的特效展示组件

### 待优化项目

- 原 pricing 页面支持弹窗模式
- 登录注册页面优化

### 界面改版开发指导

#### 路由和布局规范

- **路由群组**: 使用 `(home)` 和 `(default)` 区分不同的界面结构
- **布局组件**: 主页使用 `components/blocks/home-layout/` 下的 Header 和 Sidebar
- **页面结构**: 所有主页相关页面放在 `app/[locale]/(home)/` 下

#### 组件开发规范

- **Block 组件**: 新增的页面级组件放在 `components/blocks/` 下
- **命名约定**: 使用 kebab-case 命名文件夹，如 `hero-section/`, `cta-section/`
- **组件结构**: 每个 block 至少包含 `index.tsx`，复杂组件可拆分子组件

#### 特效系统开发

- **数据源**: 特效数据定义在 `data/effects.ts`
- **特效页面**: `/video-affects` 主页面，`/video-affects/[id]` 详情页
- **特效组件**: 使用 `effect-card` 和 `effect-grid` 组件展示特效

#### 国际化支持

- **支持语言**: 英语(en)、德语(de)、日语(ja)、韩语(ko)、俄语(ru)
- **消息文件**: 新增页面文案添加到 `i18n/messages/en.json`，其他语言文件会同步更新
- **页面内容**: 复杂页面内容可创建 `i18n/pages/` 对应文件
- **组件文案**: 使用 `useTranslations` 或 `getTranslations` 获取文案
- **产品名称**: 所有翻译文件已统一使用 "Seedance" 作为产品名

#### 认证和重定向

- **Auth Redirect**: 使用 `components/auth/auth-redirect.tsx` 处理登录重定向
- **访问控制**: 主页路由对所有用户开放，但功能受限引导登录
- **登录流程**: 登录成功后自动跳转到 `/home`

#### 样式和交互

- **布局样式**: 继承现有的 Tailwind 设计系统
- **响应式**: 所有新页面需支持移动端适配
- **交互反馈**: 使用 Sonner toast 提供用户反馈

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 14 with App Router, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui, Radix UI
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: NextAuth.js 5.0 (Google, GitHub, Apple, Email)
- **Payments**: Creem (primary), Stripe, Payssion V2 (Russian market)
- **Video Generation**: Multi-provider system via ProviderFactory
- **Image Generation**: AIServiceManager with provider abstraction
- **Internationalization**: next-intl with locale-based routing
- **Analytics**: Plausible, Yandex Metrica
- **Deployment**: Vercel (primary), Cloudflare Pages (standalone build option)

### Key Architectural Patterns

#### Model-Service-Component Pattern
- **models/**: Database operations with Supabase
- **services/**: Business logic and provider integrations
- **components/**: UI components (blocks/, ui/, dashboard/)

#### Provider Pattern
- **PaymentRouter**: Unified payment provider selection
- **ProviderFactory**: Video generation provider routing
- **AIServiceManager**: Image generation provider management
- **Provider interfaces**: Consistent API across different providers

### Video Generation Flow

1. Request arrives at `/api/video-generation/submit`
2. `ProviderFactory` selects provider based on model ID
3. Provider submits job to external API (Volcano, Kie.ai, etc.)
4. `videoStatusService` tracks generation progress
5. Provider webhooks update status at `/api/video-generation/webhook/*`
6. Generated videos stored in cloud storage

### Image Generation Flow

1. Request arrives at `/api/image-generation/submit`
2. `AIServiceManager` selects provider (Nano Banana/Kie.ai primary)
3. Optional prompt optimization via `optimizeImagePromptWithTimeout`
4. Provider API call (sync or async callback mode)
5. Status tracking via `/api/ai-callback/[provider]`
6. Credits: 2 credits per generation (fixed), auto-refund on failure

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
- **video_generations**: Video generation tracking with provider metadata
- **image_generations**: Image generation records with status tracking
- **orders**: Cross-provider payment tracking
- **credits**: Transaction history and balance management

## Key File Locations

### Configuration
- `next.config.mjs` - Next.js config with MDX, i18n, bundle analyzer
- `tailwind.config.ts` - Tailwind with custom animations
- `i18n/request.ts` - Locale configuration
- `config/video-models.ts` - Video model definitions and pricing
- `config/products.ts` - Product configuration

### Service Layer
- `services/payment/PaymentRouter.ts` - Payment provider routing
- `services/providers/ProviderFactory.ts` - Video provider selection
- `services/AIServiceManager.ts` - Image generation provider management
- `services/providers/BaseAIProvider.ts` - Abstract provider interface
- `services/providers/NanoBananaProvider.ts` - Kie.ai image provider
- `services/videoStatusService.ts` - Generation status tracking
- `services/creditsService.ts` - Credit management
- `services/promptOptimization.ts` - AI prompt enhancement

### API Routes
- `app/api/video-generation/` - Video generation endpoints
- `app/api/video-generation/webhook/` - Provider-specific webhooks (Ali, etc.)
- `app/api/image-generation/submit` - Image generation submission
- `app/api/image-generation/status` - Image generation status polling
- `app/api/image-generations/history` - User generation history
- `app/api/ai-callback/[provider]` - AI provider async callbacks
- `app/api/subscription/` - Subscription management
- `app/api/creem/webhook/` - Creem payment webhooks
- `app/api/payssion/v2-webhook/` - Payssion V2 webhooks
- `app/api/stripe-notify/` - Stripe payment notifications
- `app/api/outrank/webhook/` - Outrank service webhooks

### Provider Implementations
- `services/providers/VolcanoProvider.ts` - Volcano Engine (Seedance)
- `services/providers/KieAiVeo3Provider.ts` - Kie.ai (Veo3)
- `services/providers/AliProvider.ts` - Ali Cloud
- `services/providers/FalProvider.ts` - fal.ai integration

## 开发技巧

- 如果启动本地服务器的时候,遇到了缓存问题,可以使用 `rm -rf .next` 清理一下缓存
- 在使用 pnpm dev 之前,先检查一下本地服务是否有启动.如果已经启动了,直接使用本地服务器就好.如果希望打印 log 测试,可以先 kill 本地服务,再重新启动.尽量使用 3000 端口,以为一般他和 ngrok 是绑定的. 测试完成后杀死 3000 端口的使用
- 使用 `pnpm dev:clean` 可以清理缓存后启动开发服务器
- 运行单个测试文件：`jest path/to/test.test.ts`
- 调试TypeScript文件：`pnpm ts` (运行 ts/test.ts)
- Debug logging: `pnpm dev 2>&1 | tee dev.log`

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
KIE_AI_API_KEY        # Kie.ai (also for Nano Banana image)
APICORE_API_KEY       # APICore (commented out)
ALI_API_KEY           # Ali Cloud
FAL_KEY               # fal.ai
```

### Image Generation Providers
```bash
KIE_AI_API_KEY        # Nano Banana (Kie.ai)
OPENAI_API_KEY        # DALL-E (if configured)
REPLICATE_API_TOKEN   # Replicate models
HF_TOKEN              # Hugging Face models
```

### CAPTCHA
```bash
TURNSTILE_SECRET_KEY  # Cloudflare Turnstile for new users
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
- Product configuration in `config/products.ts`

### Image Generation Configuration
- Providers managed by `AIServiceManager`
- Fixed 2 credits per image generation
- Supports text-to-image and image-to-image modes
- Async callback pattern for Nano Banana provider
- Automatic credit refund on generation failure
- CAPTCHA required for new users (10 credits balance)

### Payment Flow
1. Location detection determines available payment methods
2. Russian regions → Payssion
3. Other regions → Creem (primary) or Stripe (fallback)
4. Webhook handlers process payment confirmations
5. Credits distributed automatically on successful payment

### Security Considerations
- Row-level security (RLS) on all Supabase tables
- Webhook signature verification for payment providers (HMAC-SHA256)
- Zod schemas for API request validation
- Sensitive data filtered from logs
- Cloudflare Turnstile integration for bot protection

## Current Development Status

- **Active Branch**: main
- **Recent Features**: 
  - Text-to-image generation with Nano Banana (Kie.ai)
  - Image-to-image transformation
  - Prompt optimization with AI enhancement
  - CAPTCHA verification for new users (Cloudflare Turnstile)
  - Async callback pattern for image generation
  - Auto-refund credits on generation failure
  - Creem payment integration
  - UI redesign with (home) route group
  - Yandex Metrica offline conversion tracking
  - SEO content generation tooling
  - Multi-provider webhook support
- **Active Video Providers**: Kie.ai (Veo3), Volcano Engine (Seedance), MiniMax (Hailuo), Ali Cloud, fal.ai
- **Active Image Providers**: Nano Banana (Kie.ai primary), OpenAI DALL-E (configured), Stable Diffusion (planned)
- **Commented Providers**: Some fal.ai models (Kling), APICore Veo3