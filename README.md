# TalkwithAI - Free Chat with Claude 4

Claude 4 Sonnet is an advanced hybrid reasoning model that excels in coding and enhances content generation, data analysis, and planning.

![preview](preview.png)

## 项目概览

TalkwithAI 是一个基于 Claude 4 Sonnet 的智能对话平台，集成了先进的 AI 推理能力，为用户提供免费的智能对话服务。项目采用现代化的全栈架构，支持多语言国际化，提供丰富的 AI 分析功能。

## 核心特性

- 🤖 **Claude 4 Sonnet 集成**: 利用最新的 Claude 4 Sonnet 模型提供高质量对话
- 🌍 **多语言支持**: 支持中文、英文、日文、韩文、法文等多种语言
- 💬 **智能对话**: 支持连续对话、上下文理解和个性化回复
- 📊 **数据分析**: 提供智能数据分析和内容生成功能
- 🔐 **用户系统**: 完整的用户认证、会员管理和积分系统
- 📱 **响应式设计**: 适配各种设备的现代化 UI 界面
- ⚡ **高性能**: 基于 Next.js 14 的优化架构

## 技术架构

### 前端技术栈

- **框架**: Next.js 14 (App Router)
- **UI 库**: React + Tailwind CSS + Shadcn/ui
- **状态管理**: React Context + Hooks
- **国际化**: next-intl
- **主题**: next-themes (支持深色/浅色模式)
- **图标**: Lucide React, React Icons
- **动画**: Framer Motion

### 后端技术栈

- **API**: Next.js API Routes
- **认证**: NextAuth.js 5.0
- **数据库**: Supabase (PostgreSQL)
- **支付**: Stripe
- **AI 集成**: AI SDK (Anthropic, OpenAI, DeepSeek)
- **文件存储**: AWS S3

### 开发工具

- **语言**: TypeScript
- **构建**: Next.js, SWC
- **样式**: PostCSS, Tailwind CSS
- **代码规范**: ESLint
- **部署**: Vercel, Cloudflare

## 快速开始

### 环境要求

- Node.js 18.0+
- pnpm 8.0+

### 安装步骤

1. 克隆项目仓库

```bash
git clone <repository-url>
cd talkwithai
```

2. 安装依赖

```bash
pnpm install
```

3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置必要的环境变量：

```env
# 数据库
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# 认证
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# 支付
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# 网站信息
NEXT_PUBLIC_WEB_URL=http://localhost:3000
```

4. 启动开发服务器

```bash
pnpm dev
```

5. 访问应用
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
talkwithai/
├── app/                       # Next.js App Router
│   ├── [locale]/              # 多语言页面
│   │   ├── (default)/         # 默认页面组
│   │   ├── (admin)/           # 管理页面组
│   │   ├── auth/              # 认证页面
│   │   ├── chat/              # 聊天页面
│   │   └── layout.tsx         # 根布局
│   ├── api/                   # API路由
│   ├── globals.css            # 全局样式
│   └── theme.css              # 主题配置
├── components/                # React组件
│   ├── blocks/                # 页面区块组件
│   ├── ui/                    # 基础UI组件
│   ├── dashboard/             # 仪表盘组件
│   └── console/               # 控制台组件
├── contexts/                  # React Context
├── hooks/                     # 自定义Hooks
├── i18n/                      # 国际化配置
│   ├── pages/                 # 页面翻译
│   ├── blocks/                # 组件翻译
│   └── messages/              # 全局消息
├── lib/                       # 工具函数
├── models/                    # 数据模型
├── services/                  # 业务逻辑
├── types/                     # TypeScript类型
├── public/                    # 静态资源
└── providers/                 # 上下文提供者
```

## 核心功能模块

### 1. 智能对话系统

- 支持与 Claude 4 Sonnet 的实时对话
- 上下文记忆和连续对话
- 多种 AI 模型切换(Claude, DeepSeek, Qwen 等)
- 流式响应和打字机效果

### 2. 用户管理系统

- 邮箱/Google/GitHub 多种登录方式
- 用户信息管理和偏好设置
- 会话历史记录和管理

### 3. 会员和积分系统

- 积分机制：新用户免费积分，邀请奖励
- 会员订阅：月度/年度付费计划
- Stripe 支付集成

### 4. 国际化支持

- 6 种语言界面(中文、英文、日文、韩文、法文、繁体中文)
- 动态语言切换
- 本地化内容管理

### 5. 响应式界面

- 移动端优先设计
- 深色/浅色主题切换
- 现代化 UI 组件

## 开发指南

### 创建新页面

1. **创建页面文件**
   在 `app/[locale]/(default)/` 下创建新目录和 `page.tsx`

2. **添加国际化支持**
   在 `i18n/messages/` 各语言文件中添加页面相关翻译

3. **配置元数据**
   在页面组件中使用 `generateMetadata` 函数

4. **添加页面类型定义**
   在 `types/pages/` 下创建对应的类型文件

### 创建新组件

1. **创建组件文件**

   - 基础 UI 组件放在 `components/ui/`
   - 业务组件放在 `components/blocks/`

2. **添加类型定义**
   在 `types/blocks/` 下创建类型文件

3. **添加国际化**
   在 `i18n/blocks/` 下添加组件翻译

### API 开发

1. **创建 API 路由**
   在 `app/api/` 下创建 `route.ts` 文件

2. **使用数据模型**
   引用 `models/` 下的数据操作函数

3. **认证保护**
   使用 `auth()` 函数进行用户认证

4. **错误处理**
   使用 `lib/resp.ts` 中的响应函数

### 数据库操作

1. **使用现有模型**
   导入 `models/` 下对应的数据操作函数

2. **创建新模型**
   参考 `models/introduce.md` 了解数据模型规范

3. **类型安全**
   使用 TypeScript 类型确保数据安全

## 自定义配置

### 主题定制

编辑 `app/theme.css` 修改颜色主题，可使用 [shadcn-ui-theme-generator](https://zippystarter.com/tools/shadcn-ui-theme-generator) 生成主题

### 首页内容

编辑 `i18n/pages/landing/` 下的各语言文件修改首页内容

### 全局消息

编辑 `i18n/messages/` 下的各语言文件修改界面文本

## 部署

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-repo%2Ftalkwithai&project-name=talkwithai&repository-name=talkwithai)

### Cloudflare 部署

1. 配置环境变量

```bash
cp .env.example .env.production
cp wrangler.toml.example wrangler.toml
```

2. 编辑环境变量并部署

```bash
npm run cf:deploy
```

## 开发脚本

```bash
# 开发环境
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 清理缓存
pnpm clean:cache

# 打包分析
pnpm analyze
```

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目主页: [TalkwithAI](https://talkwithai.io)
- 文档: [使用文档](https://docs.talkwithai.io)
- 问题反馈: [GitHub Issues](https://github.com/your-repo/talkwithai/issues)

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新详情
