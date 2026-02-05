# 年订阅积分按月发放功能实施说明

## 功能概述

将年订阅的积分发放方式从**一次性发放**改为**按月发放**（每月发放总积分的1/12），同时保持现有订单的一次性发放逻辑不变。

### 核心特性
- ✅ 新年订阅：按月发放积分（每月1/12）
- ✅ 旧年订阅：保持一次性发放（向后兼容）
- ✅ 定时任务：每天自动检查并发放到期积分
- ✅ 幂等性：防止重复发放
- ✅ 退款处理：订单退款时自动取消后续发放

## 实施步骤

### 1. 数据库迁移

在 Supabase SQL Editor 中执行迁移脚本：

```bash
supabase/migrations/add_monthly_credit_distribution.sql
```

该脚本会：
- 在 `orders` 表添加 `is_monthly_distribution` 字段
- 创建 `credit_distribution_schedule` 表（发放计划）
- 创建 `credit_distribution_history` 表（发放历史）
- 创建必要的索引和约束

### 2. 环境变量配置

在 `.env.local` 和 Vercel 环境变量中添加：

```bash
# 生成随机密钥
openssl rand -base64 32

# 添加到环境变量
CRON_SECRET=your-generated-secret-here
```

### 3. 部署到 Vercel

```bash
# 提交代码
git add .
git commit -m "feat: 实现年订阅积分按月发放功能"
git push

# Vercel 会自动部署并配置 Cron Job
```

### 4. 验证 Cron Job

在 Vercel Dashboard 中：
1. 进入项目设置
2. 查看 "Cron Jobs" 标签
3. 确认 `/api/cron/distribute-credits` 已配置
4. 查看执行日志

## 技术实现

### 数据库表结构

#### credit_distribution_schedule（发放计划表）
```sql
- id: UUID (主键)
- order_no: 订单号
- user_uuid: 用户ID
- subscription_id: 订阅ID
- payment_provider: 支付提供商（creem/payssion/stripe）
- total_credits: 总积分数
- monthly_credits: 每月发放积分
- total_months: 总月数（12）
- distributed_months: 已发放月数
- next_distribution_date: 下次发放日期
- last_distribution_date: 上次发放日期
- status: 状态（active/completed/canceled）
```

#### credit_distribution_history（发放历史表）
```sql
- id: UUID (主键)
- schedule_id: 发放计划ID
- order_no: 订单号
- user_uuid: 用户ID
- month_number: 第几个月（1-12）
- credits_distributed: 发放的积分数
- distribution_date: 发放日期
- credit_trans_no: 积分交易号
```

### 核心服务

#### CreditDistributionService
位置：`services/creditDistributionService.ts`

主要方法：
- `getPendingDistributions()`: 查询待发放的订阅
- `distributeCreditsForSchedule()`: 执行单个订阅的积分发放
- `processAllPendingDistributions()`: 批量处理所有待发放
- `cancelSchedule()`: 取消发放计划（用于退款）

### 业务流程

#### 新订阅创建流程
1. 用户购买年订阅
2. `app/api/subscription/create/route.ts` 设置 `is_monthly_distribution = true`
3. 支付成功后，`PaymentProcessingService` 检测到该标记
4. 只发放 1/12 积分（首月）
5. 创建 `credit_distribution_schedule` 记录
6. 设置下次发放日期为1个月后

#### 定时发放流程
1. Vercel Cron 每天凌晨2点（UTC）触发
2. 调用 `/api/cron/distribute-credits`
3. `CreditDistributionService.processAllPendingDistributions()` 执行
4. 查询 `next_distribution_date <= now` 的记录
5. 逐个发放积分并更新状态
6. 记录发放历史

#### 退款处理流程
1. 订单状态更新为 `refunded`
2. `models/order.ts` 中的 `updateOrderStatus` 检测到退款
3. 调用 `CreditDistributionService.cancelSchedule()`
4. 将发放计划状态改为 `canceled`
5. 后续不再发放积分

### 幂等性保证

1. **订单级别**：通过 `order_no` + `payment_id` 检查是否已处理
2. **月份级别**：通过 `schedule_id` + `month_number` 唯一索引防止重复发放
3. **状态检查**：发放前检查订单状态，退款订单自动跳过

## 测试验证

### 1. 手动触发 Cron Job

```bash
curl -X GET "https://your-domain.com/api/cron/distribute-credits" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 2. 测试场景

#### 场景1：新年订阅
1. 创建新的年订阅订单
2. 验证 `orders.is_monthly_distribution = true`
3. 验证首次只发放 1/12 积分
4. 验证 `credit_distribution_schedule` 表中创建了记录

#### 场景2：旧年订阅（向后兼容）
1. 使用现有订单数据测试
2. 验证仍然一次性发放全部积分
3. 验证不创建 `credit_distribution_schedule` 记录

#### 场景3：定时发放
1. 手动触发 cron job
2. 验证查询到待发放的订阅
3. 验证成功发放积分
4. 验证更新 `distributed_months` 和 `next_distribution_date`
5. 验证创建 `credit_distribution_history` 记录

#### 场景4：幂等性
1. 多次调用 cron job
2. 验证不会重复发放同一个月的积分

#### 场景5：订单退款
1. 将订单状态更新为 `refunded`
2. 验证 `credit_distribution_schedule.status` 变为 `canceled`
3. 验证后续不再发放积分

## 监控和维护

### 日志监控

在 Vercel Logs 中查看：
- `🚀 Starting credit distribution cron job...`
- `✅ Distributed X credits for month Y`
- `❌ Failed to distribute credits`

### 数据库查询

```sql
-- 查看活跃的发放计划
SELECT * FROM credit_distribution_schedule
WHERE status = 'active'
ORDER BY next_distribution_date;

-- 查看发放历史
SELECT * FROM credit_distribution_history
ORDER BY distribution_date DESC
LIMIT 100;

-- 查看待发放的订阅
SELECT * FROM credit_distribution_schedule
WHERE status = 'active'
AND next_distribution_date <= NOW();
```

## 边界情况处理

### 订阅续费
- 续费时创建新的 `credit_distribution_schedule` 记录
- 旧的发放计划自动完成

### 定时任务失败
- 下次执行时会自动重试（基于 `next_distribution_date`）
- 幂等性保证不会重复发放

### 积分计算余数
- 如果总积分不能被12整除，最后一个月发放剩余积分
- 例如：2400 credits → 每月200，共12个月

### 订阅取消 vs 订单退款

**订阅取消（subscription.canceled）**：
- 只是停止自动续费
- 当前周期的积分继续按月发放
- 发放计划保持 `active` 状态

**订单退款（order.status = 'refunded'）**：
- 用户申请退款
- 立即停止积分发放
- 发放计划状态改为 `canceled`
- 已发放的积分不回收（业务决策）

## 回滚方案

如果需要回滚：

1. **停用 Cron Job**
   - 从 `vercel.json` 中移除 cron 配置
   - 重新部署

2. **恢复旧逻辑**
   - 将 `PaymentProcessingService` 恢复到原始版本
   - 新订单仍会设置 `is_monthly_distribution = false`

3. **数据清理**（可选）
   - 保留数据库表和数据用于审计
   - 或删除 `credit_distribution_schedule` 和 `credit_distribution_history` 表

## 文件清单

### 新增文件
- `supabase/migrations/add_monthly_credit_distribution.sql` - 数据库迁移脚本
- `services/creditDistributionService.ts` - 积分发放服务
- `app/api/cron/distribute-credits/route.ts` - Cron API 端点
- `MONTHLY_DISTRIBUTION_IMPLEMENTATION.md` - 本文档

### 修改文件
- `types/order.d.ts` - 添加 `is_monthly_distribution` 字段
- `app/api/subscription/create/route.ts` - 创建订单时设置标记
- `services/payment/PaymentProcessingService.ts` - 支付处理逻辑
- `services/credit.ts` - 添加 `monthly_distribution` 交易类型
- `models/order.ts` - 退款时取消发放计划
- `vercel.json` - 添加 cron 配置
- `.env.example` - 添加 `CRON_SECRET` 说明

## 常见问题

### Q: 如何查看某个用户的发放计划？
```sql
SELECT * FROM credit_distribution_schedule
WHERE user_uuid = 'xxx'
ORDER BY created_at DESC;
```

### Q: 如何手动触发某个订单的发放？
不建议手动触发。如果需要，可以：
1. 更新 `next_distribution_date` 为当前时间
2. 等待 cron job 自动执行

### Q: 如何查看发放失败的记录？
查看 Vercel Logs 中的错误日志，搜索 `❌ Failed to distribute credits`

### Q: 积分有效期如何计算？
- 首月：1个月 + 1天缓冲
- 后续每月：1个月 + 1天缓冲
- 从发放日期开始计算

## 联系支持

如有问题，请查看：
- Vercel Logs: 查看 cron job 执行日志
- Supabase Logs: 查看数据库操作日志
- GitHub Issues: 提交问题报告
