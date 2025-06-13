# 邮件营销脚本说明

## 未付费订单提醒邮件工具

### 快速使用

```bash
# 发送指定日期范围的未付费订单提醒邮件
node scripts/send-unpaid-reminder-batch.js <开始日期> <结束日期>
```

### 示例

```bash
# 发送6月11日到6月13日期间的提醒邮件
node scripts/send-unpaid-reminder-batch.js 2025-06-11 2025-06-13

# 发送单日的提醒邮件
node scripts/send-unpaid-reminder-batch.js 2025-06-12 2025-06-12

# 发送昨天的提醒邮件
node scripts/send-unpaid-reminder-batch.js 2025-06-12 2025-06-12
```

### 功能特性

✅ **智能过滤**
- 自动排除已有支付记录的用户
- 排除已发送过邮件的用户
- 同一用户多个订单只保留最新订单

✅ **安全可靠**
- 完整的错误处理
- 发送状态记录到数据库
- API限制保护（1秒间隔）

✅ **多语言支持**
- 俄语邮件内容
- 关怀式询问支付问题

✅ **数据追踪**
- 发送成功/失败统计
- 邮件记录存储在 `email_campaigns` 表

### 邮件内容

**主题:** Нужна помощь с заказом на Veo3 AI?

**内容:** 询问用户是否在支付或产品体验上遇到问题，邀请用户直接回复寻求帮助。

### 环境要求

确保 `.env.local` 包含以下变量:
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 输出示例

```
🔍 查询 2025-06-11 到 2025-06-13 期间的未付费订单...
📋 找到 25 个未付费订单
💳 排除 5 个已有支付记录的用户
📧 排除 3 个已发送过邮件的用户

📬 准备发送邮件给 12 个用户:
  - lianjones10578@gmail.com (订单: 704208109801541)
  - serov191022@gmail.com (订单: 704046516416581)
  ...

🚀 开始发送邮件...
  ✅ lianjones10578@gmail.com (re_abc123)
  ✅ serov191022@gmail.com (re_def456)
  ...

🎉 发送完成!
✅ 成功: 12, ❌ 失败: 0
```