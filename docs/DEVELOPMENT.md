# Development History & UI Redesign

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

## Recent Features

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

## Active Providers

- **Video**: Kie.ai (Veo3), Volcano Engine (Seedance), MiniMax (Hailuo), Ali Cloud, fal.ai
- **Image**: Nano Banana (Kie.ai primary), OpenAI DALL-E (configured), Stable Diffusion (planned)
- **Commented**: Some fal.ai models (Kling), APICore Veo3
