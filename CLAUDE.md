# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 交互原则

- 用审视的目光仔细看输入的潜在问题，犀利地提出问题并给出思考框架之外的建议
- 不需要夸赞，客观分析问题，快速解决问题是价值所在
- 如果需求离谱，直接指出帮助清醒思考
- 有疑问直接提出，避免写冗余代码覆盖不存在的情况

## 开发原则

### 代码原则
- **简洁至上**: 能用一行代码完成的不用两行，遵循 Occam's razor
- **避免重复**: 先了解现有代码逻辑，不要重复造轮子
- **架构分离**: 数据库操作放在 model 层，业务逻辑放在 service 层
- **行业最佳实践**: 基于现代开发标准构建代码

### 产品设计原则
- **极致简洁**: 每个元素都必须有明确价值
- **视觉层次**: 重要信息突出，次要信息弱化
- **直觉操作**: 用户无需思考就能理解

## Project Overview

**Veo3 AI** (veo3ai.io) is an AI platform focused on providing users with an exceptional video generation experience. Built on Next.js 14, the platform combines chat capabilities with Claude 4 Sonnet and advanced video generation features via fal.ai integration, along with multi-language support and a complete user management system with credits and subscriptions.

**Important Note**: Despite the "veo3" name referencing Google's Veo model, the current video generation system supports multiple providers including Volcano Engine (Seedance), APICore (Veo3), and fal.ai integration.

**计费逻辑**: 0.25 美金等于 10 个积分

**Language Note**: 该项目所有的前端展示语言为英文。不需要支持中文语言。Supabase 的数据库项目名称为 Veo3

## 项目开发记录

- 当前我们是在做payssion v2版本的接入和测试
- 当前的git仓库是veo3

## 交互思考

- 如果你有问题，随时问题，我们的目标是快速定义问题以及解决问题，快速自我迭代，提升认知提升能力

## Key Development Commands

```bash
# Development
pnpm dev                    # Start development server with NODE_NO_WARNINGS=1
pnpm dev:clean             # Clean cache and start development

# Building & Testing
pnpm build                 # Build production version
pnpm start                 # Start production server with NODE_NO_WARNINGS=1
pnpm lint                  # Run ESLint
pnpm test                  # Run Jest tests (tests in **/__tests__/**/*.test.ts)
pnpm ts                    # Run test TypeScript file (ts/test.ts)

# Analysis & Deployment
pnpm analyze               # Bundle analysis with ANALYZE=true
pnpm cf:build             # Build for Cloudflare Pages
pnpm cf:preview           # Preview Cloudflare build
pnpm cf:deploy            # Deploy to Cloudflare

# Utilities
pnpm clean                # Remove node_modules, .next, pnpm-lock.yaml
pnpm clean:cache          # Remove .next and node_modules/.cache

# Running individual tests
jest path/to/test.test.ts  # Run specific test file
```

## 日志系统优化

### 日志文件存储
- **Webhook 日志**: `/log/webhook-YYYY-MM-DD.log` - 新增，存储所有 webhook 事件
- **订阅服务日志**: `/log/subscription-service.log` - 订阅相关业务逻辑
- **API 日志**: `/log/subscription-api-YYYY-MM-DD.log` - API 层面的日志

### 敏感信息过滤
WebhookLogger 自动过滤敏感字段：`password`, `secret`, `key`, `token`, `api_key`, `signature`, `authorization`

### Webhook 安全配置
- **签名验证**: 强制启用 Payssion V2 webhook 签名验证 (HMAC-SHA256)
- **环境变量**: 必须配置 `PAYSSION_V2_API_KEY` 用于签名验证
- **安全策略**: 无签名或签名验证失败的请求将被拒绝 (401)

## 积分系统重构文档

### 重构背景
- 原有积分发放机制存在业务风险
- 需要建立更加合理和可持续的积分发放模式

### 重构原则
- 对现有用户友好
- 降低业务风险
- 提高用户留存率
- 优化成本控制

### 迁移策略 
- 推荐采用祖父条款
- 对现有年度用户保持原有积分发放方式
- 新年度用户从下个计费周期开始按月发放

### 预期收益
- 减少积分滥用 15-20%
- 提高用户粘性
- 降低退款风险
- 更好地控制服务成本

### 实施成本
- 预计 2-3 人周的开发工作
- 涉及定时任务和监控系统建设
- 需要进行用户沟通和客服支持

### 风险评估
1. **技术风险**
   - 定时任务失败
   - 数据一致性问题

2. **业务风险**
   - 用户体验变化
   - 现有年度用户处理

### 监控指标
- 月度积分发放成功率
- 用户积分使用模式变化
- 订阅取消率变化
- 客户满意度变化