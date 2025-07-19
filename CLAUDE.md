# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Seedance** is an advanced AI video generation platform that transforms text and image inputs into high-quality, cinematic videos. Built on Next.js 14, the platform leverages ByteDance's Seedance 1.0 model to deliver professional-grade video generation with smooth motion, rich details, and cinematic aesthetics. The platform includes multi-shot video storytelling, and a complete user management system with credits and subscriptions.

**Key Features**: 
- **1080p Video Generation**: Creates high-quality videos with cinematic aesthetics
- **Multi-shot Storytelling**: Native support for narrative video creation with visual consistency
- **Style Versatility**: Supports diverse styles from photorealism to cyberpunk and illustration
- **Complex Prompt Understanding**: Precisely interprets natural language instructions for creative control
- **Multi-agent Interactions**: Controls character interactions and camera movements

**Important Note**: Despite the "veo3" name referencing Google's Veo model, the current video generation system supports multiple providers including Volcano Engine (Seedance), APICore (Veo3), and fal.ai integration.

**计费逻辑**: 0.25 美金等于 10 个积分

**Language Note**: 该项目所有的前端展示语言为英文。不需要支持中文语言。Supabase 的数据库项目名称为 Seedance

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

- **消息文件**: 新增页面文案添加到 `i18n/messages/en.json`
- **页面内容**: 复杂页面内容可创建 `i18n/pages/` 对应文件
- **组件文案**: 使用 `useTranslations` 或 `getTranslations` 获取文案

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

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI primitives
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: NextAuth.js 5.0 with multiple providers (Google, GitHub, Apple, Email)
- **Payments**: Stripe & Payssion V2 with unified payment router
- **Video Generation**: Multi-provider system (Volcano Engine, APICore Veo3, fal.ai, KieAi)
- **Internationalization**: next-intl with locale-based routing
- **Analytics**: Plausible with custom event tracking
- **Deployment**: Cloudflare Pages with standalone build

### Key Architectural Patterns

- **Model-Service-Component**: Database operations in `models/`, business logic in `services/`, UI in `components/`
- **Provider Pattern**: Unified interfaces for payments (`PaymentRouter`) and video generation (`ProviderFactory`)
- **Layered Architecture**: Clear separation between API routes, services, and data models
- **Service-Oriented**: Modular services for credits, memberships, video generation, etc.

### Database Schema Highlights

- **Users**: Authentication with multiple providers, credits system
- **Subscriptions**: Stripe/Payssion integration with automatic credit distribution
- **Video Generations**: Multi-provider generation tracking with status management
- **Orders**: Payment tracking across multiple providers
- **Credits**: Comprehensive credit system with transaction history

### Video Generation Flow

1. **Provider Selection**: `ProviderFactory` routes to appropriate provider (Volcano, APICore, fal.ai, KieAi)
2. **Request Processing**: Unified interface through `services/providers/`
3. **Status Tracking**: `videoStatusService` monitors generation progress
4. **Webhook Handling**: Provider-specific webhooks update generation status
5. **Result Storage**: Generated videos stored via Supabase Storage/cloud providers

### Payment Processing

- **Unified Router**: `PaymentRouter` handles provider selection based on user location/preference
- **Stripe Integration**: Primary payment processor with subscription management
- **Payssion V2**: Alternative payment processor with webhook signature verification
- **Credit System**: Automatic credit distribution based on subscription tier

### Security Features

- **Webhook Validation**: HMAC-SHA256 signature verification for Payssion V2
- **RLS Policies**: Row-level security on all database operations
- **Input Validation**: Zod schemas for API request validation
- **Sensitive Data Filtering**: Automatic filtering of sensitive fields in logs

## 开发技巧

- 如果启动本地服务器的时候,遇到了缓存问题,可以使用 rm -rf .next 清理一下缓存
- 在使用 pnpm dev 之前,先检查一下本地服务是否有启动.如果已经启动了,直接使用本地服务器就好.如果希望打印 log 测试,可以先 kill 本地服务,再重新启动.尽量使用 3000 端口,以为一般他和 ngrok 是绑定的. 测试完成后杀死 3000 端口的使用。

## Login Information

- 备用登录账号：hugeroger@gmail.com 密码：123123
