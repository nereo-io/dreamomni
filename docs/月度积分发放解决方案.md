# 月度积分发放系统设计方案

## 🚨 问题现状分析

### 当前问题
- **年度订阅用户一次性获得全年积分**：标准年度用户支付后立即获得 12,000 积分
- **违反订阅制基本原则**：订阅制应该是"按期享受服务"，而非"预付费买断"
- **业务风险巨大**：用户可能在获得全年积分后立即取消订阅，导致严重收入损失
- **资源滥用风险**：用户可能在短期内大量消耗积分，超出服务成本预期

### 财务影响评估
**当前积分发放的价值不匹配问题：**

| 用户类型 | 支付金额 | 当前获得积分 | 积分等价价值 | 价值差异 |
|---------|---------|-------------|-------------|---------|
| 月度用户 | $10/月 | 1,000积分 | $10 | 匹配 ✅ |
| 年度用户 | $100/年 | 12,000积分 | $120 | 多给了$20 ❌ |

**问题核心**：
- 年度用户本应享受 **价格优惠**（$100 vs $120），而非 **服务超量**
- 当前机制让年度用户获得了超过其支付价值的积分
- 用户可以在短期内消耗完超额价值后取消订阅

## 🔍 行业最佳实践调研

### 主流 SaaS 产品积分/配额发放模式

| 产品 | 年度计划配额发放方式 | 说明 |
|------|---------------------|------|
| **OpenAI API** | 按月重置 | 即使年度付费，API 配额每月重置 |
| **Anthropic Claude** | 按月重置 | 使用次数每月重置，不累积 |
| **Adobe Creative Cloud** | 按月发放 | 云存储、导出次数按月提供 |
| **Canva Pro** | 按月发放 | 高级功能使用次数按月分配 |
| **Figma Professional** | 按月累积 | 项目数量、版本历史按月累积 |
| **Notion** | 按月发放 | AI 积分按月发放，不可累积 |

### 行业共识
1. **即使年度付费，服务配额也应按月发放**
2. **防止用户滥用和早期取消订阅**
3. **便于成本控制和资源规划**
4. **符合用户对订阅制的心理预期**

## 🎯 解决方案设计

### 核心原则
1. **按月发放**：所有用户（包括年度用户）按月获得积分
2. **公平合理**：年度用户享受价格优惠，但不是服务优势
3. **防止滥用**：避免用户短期内大量消耗积分
4. **平滑过渡**：现有用户的体验尽量不受影响

### 新的积分发放规则

#### 月度用户
- **标准月度 ($10/月)**：每月发放 1,000 积分
- **迷你月度 ($5/月)**：每月发放 200 积分

#### 年度用户
- **标准年度 ($100/年)**：每月发放 1,000 积分 × 12个月
- **迷你年度 ($50/年)**：每月发放 200 积分 × 12个月

#### 积分特性
- **有效期**：积分在发放后 12 个月内有效
- **累积规则**：未使用的积分可以累积，但有上限（如 3个月的积分量）
- **取消处理**：用户取消订阅后不再发放新积分，已有积分在有效期内可继续使用

## 🏗️ 技术架构设计

### 数据模型设计

#### 1. 月度积分计划表 (monthly_credit_schedules)
```sql
CREATE TABLE monthly_credit_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_uuid VARCHAR NOT NULL,
  subscription_id VARCHAR,
  billing_period VARCHAR NOT NULL, -- YYYY-MM 格式
  credits_allocated INTEGER NOT NULL,
  credits_granted BOOLEAN DEFAULT FALSE,
  granted_at TIMESTAMP,
  plan_type VARCHAR NOT NULL, -- 'monthly', 'yearly'
  product_type VARCHAR NOT NULL, -- 'mini-monthly', 'standard-yearly'
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_uuid, billing_period, subscription_id)
);
```

#### 2. 积分发放日志表 (credit_distribution_logs)
```sql
CREATE TABLE credit_distribution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES monthly_credit_schedules(id),
  user_uuid VARCHAR NOT NULL,
  credits_granted INTEGER NOT NULL,
  billing_period VARCHAR NOT NULL,
  grant_method VARCHAR NOT NULL, -- 'auto', 'manual', 'migration'
  error_message TEXT,
  status VARCHAR DEFAULT 'success', -- 'success', 'failed', 'retry'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 核心服务组件

#### 1. 月度积分计划服务 (MonthlyCreditsScheduleService)
- 创建用户订阅的积分发放计划
- 处理订阅变更和取消
- 管理积分发放时间表

#### 2. 积分发放执行器 (CreditsDistributionExecutor)
- 定时执行月度积分发放
- 处理发放失败重试
- 记录发放日志

#### 3. 积分管理服务增强 (Enhanced CreditService)
- 新增按月发放的积分类型
- 处理积分累积和过期逻辑
- 提供积分发放历史查询

### 定时任务设计

#### Vercel Cron Jobs 配置
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/distribute-monthly-credits",
      "schedule": "0 2 1 * *"
    },
    {
      "path": "/api/cron/check-pending-credits",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**说明**：
- `0 2 1 * *`：每月1日凌晨2点执行积分发放
- `0 3 * * *`：每日凌晨3点检查漏发积分（容错机制）
- 需要 Vercel Pro 计划支持
- 单次执行时间限制10分钟

#### API 端点设计
```
POST /api/cron/distribute-monthly-credits    # 月度积分发放
POST /api/cron/check-pending-credits         # 检查待发放积分
GET  /api/internal/credits/pending-distribution # 获取待发放列表
POST /api/internal/credits/retry-failed      # 重试失败的发放
GET  /api/user/credits/monthly-history       # 用户积分历史
```

#### 安全配置
```javascript
// api/cron/distribute-monthly-credits.js
export default async function handler(req, res) {
  // 验证请求来源
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 验证 Vercel Cron 请求头
  if (req.headers['x-vercel-cron'] !== '1') {
    return res.status(401).json({ error: 'Invalid cron request' });
  }
  
  // 执行积分发放逻辑
  // ...
}
```

## 🚧 关键技术要点

### Vercel 环境配置
```bash
# 环境变量设置
CRON_SECRET=your-secret-key-here
DATABASE_URL=your-supabase-connection-string
```

### 部署要求
- **Vercel Pro 计划**：支持 Cron Jobs 功能
- **执行时间限制**：单次任务最长10分钟
- **并发限制**：考虑数据库连接池大小
- **错误处理**：完善的重试和容错机制

## 📝 结论

当前的积分发放机制存在严重的业务风险，亟需按照行业最佳实践进行改进。建议采用祖父条款的迁移策略，对现有用户保持友好的同时，为新用户建立更合理的积分发放机制。

这个改进不仅能够降低业务风险，还能提高用户留存率，为公司带来长期的价值。建议尽快启动实施计划。