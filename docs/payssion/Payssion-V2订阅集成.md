# Payssion V2 订阅集成分析文档

## 项目背景

当前产品已支持 Payssion V1 单次支付，可支持俄罗斯支付方式，但不支持订阅功能。现在需要升级到 Payssion V2 以支持俄罗斯用户的订阅付费。

## 现有支付架构分析

### 当前支付系统结构

1. **统一支付接口设计**
   - `services/payment/PaymentProvider.ts` - 基础抽象类
   - `services/payment/types.ts` - 通用类型定义
   - `services/payment/PaymentRouter.ts` - 支付路由器
   - 支持多种支付提供商：Stripe、Payssion V1

2. **现有 Payssion V1 实现**
   - `services/payment/PayssionProvider.ts` - V1 API 实现
   - 支持俄罗斯支付方式：mir、yoomoney、sberpay
   - 完整的单次支付流程：创建支付、状态查询、Webhook 处理、退款

3. **订阅相关的现有结构**
   - `models/membership.ts` - 会员管理
   - `types/membership.ts` - 会员类型定义
   - 当前会员类型：monthly、yearly、quarterly
   - 会员状态：active、expired

## Payssion V2 订阅功能分析

### V2 API 端点详情（已确认）

通过 Payssion V2 官方文档确认的订阅相关端点：

1. **订阅管理端点**
   - `POST https://api.payssion.com/v2/subscriptions` - 创建订阅
   - `GET https://api.payssion.com/v2/subscriptions/{subscription_id}` - 获取单个订阅
   - `GET https://api.payssion.com/v2/subscriptions/{subscription_id}/payments` - 获取订阅支付列表
   - `POST https://api.payssion.com/v2/subscriptions/{subscription_id}/cancel` - 取消订阅

2. **标准和格式**
   - 日期格式：ISO 8601 (e.g. `2022-01-01T13:25:00Z`)
   - 国家代码：ISO 3166 alpha-2 (e.g. `US`)
   - 货币代码：ISO 4217 (e.g. `USD`)
   - 电话号码：E.164 规范

### 创建订阅接口详情

**端点：** `POST https://api.payssion.com/v2/subscriptions`

**必需参数：**
- `mandate_id` (string, required) - 从 Create Mandate API 创建的授权ID，长度必须为20字符
- `currency` (string, required) - 货币代码，ISO 4217 格式
- `amount` (string, required) - 订阅金额，例如 "9.99" USD格式
- `interval_unit` (string, required) - 订阅周期单位：`day`, `week`, `month`, `quarter`, `year`
- `times` (int32, required) - 总发票次数，必须 > 1

**可选参数：**
- `reference` (string) - 外部参考标识
- `email` (string) - 接收发票邮件的邮箱地址
- `description` (string) - 订阅描述

**响应：**
- 200: 创建成功
- 400: 参数错误

### 俄罗斯支付方式支持（已确认）

V2 API 支持以下俄罗斯支付方式，**所有方式都支持订阅（Auto Debit）**：

| Payment Method ID | 支付方式名称 | 地区 | 支持类型 | 金额限制 |
|-------------------|-------------|------|----------|----------|
| `card_ru` | Credit Card in Russia | RU | Regular, Auto Debit | - |
| `yoomoney_ru` | YooMoney | RU | Regular, Auto Debit | - |
| `sberpay_ru` | SberPay | RU | Regular, Auto Debit | - |
| `tbank_ru` | T-Pay | RU | Regular, Auto Debit | - |

### Webhook 通知机制（已确认）

**支持的订阅相关事件：**
- `subscription.created` - 订阅创建时触发
- `subscription.canceled` - 订阅取消时触发
- `subscription.completed` - 订阅完成时触发
- `payment.succeeded` - 订阅支付成功时触发
- `payment.failed` - 订阅支付失败时触发
- `mandate.succeeded` - 授权成功时触发
- `mandate.canceled` - 授权取消时触发

**重试机制：**
- 支持 3xx, 4xx, 5xx 响应状态码的重试
- 重试间隔：5s, 10s, 2min, 5min, 10min, 30min, 1h, 2h, 6h, 12h
- 最多重试 10 次

**配置方式：**
1. **固定配置（推荐）**：基于 Webhook 端点 URL，多个事件可配置到同一端点
2. **动态配置**：通过 `notify_url` 参数为特定对象设置回调（仅适用于调试）

### 订阅工作流程

1. **创建授权（Mandate）**
   - 用户授权定期扣款
   - 获得 `mandate_id`

2. **创建订阅**
   - 使用 `mandate_id` 创建订阅
   - 设置金额、周期、次数等参数

3. **定期扣款**
   - Payssion 按设定周期自动扣款
   - 每次扣款都会触发 `payment.succeeded` 或 `payment.failed` 事件

4. **订阅管理**
   - 查询订阅状态
   - 取消订阅（触发 `subscription.canceled` 事件）

### 关键技术发现

1. **Mandate 机制**：V2 使用 Mandate（授权）机制来实现定期扣款，这是与 V1 的主要区别
2. **俄罗斯支付全面支持**：所有俄罗斯主要支付方式都支持订阅功能
3. **灵活的 Webhook 系统**：完善的事件通知机制，支持订阅生命周期的所有关键节点
4. **标准化接口**：遵循 RESTful 设计，与现有系统集成友好

## 集成方案设计

### 方案 1：扩展现有 PayssionProvider

**优点：**
- 保持代码一致性
- 复用现有的错误处理和日志逻辑
- 最小化对现有系统的影响

**实现思路：**
```typescript
// 在 PayssionProvider 中添加订阅相关方法
class PayssionProvider extends BasePaymentProvider {
  // 现有的单次支付方法...
  
  // 新增订阅相关方法
  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse>
  async cancelSubscription(subscriptionId: string): Promise<CancelResult>
  async querySubscription(subscriptionId: string): Promise<SubscriptionStatus>
  async handleSubscriptionWebhook(data: any): Promise<WebhookResult>
}
```

### 方案 2：创建独立的 PayssionV2Provider

**优点：**
- 清晰分离 V1 和 V2 逻辑
- 便于并行测试和逐步迁移
- 降低现有功能的风险

**实现思路：**
```typescript
class PayssionV2Provider extends BasePaymentProvider {
  name = "payssion-v2";
  
  // 实现所有订阅相关接口
  // 保持与现有 PaymentProvider 接口兼容
}
```

### 推荐方案

**建议采用方案 1**，原因：
1. 用户视角下仍然是 "payssion" 支付方式
2. 避免支付方式选择的复杂化
3. 便于统一管理 Payssion 相关配置和逻辑

## 数据库结构扩展需求

### 需要新增的表或字段

1. **Payssion 授权表** (新建)
```sql
CREATE TABLE payssion_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID NOT NULL,
  mandate_id VARCHAR(255) NOT NULL UNIQUE, -- Payssion 授权 ID
  status VARCHAR(50) NOT NULL, -- succeeded, canceled, pending
  payment_method VARCHAR(50) NOT NULL, -- card_ru, yoomoney_ru, sberpay_ru, tbank_ru
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  mandate_data JSONB -- 存储 Payssion 返回的完整授权数据
);
```

2. **Payssion 订阅表** (新建)
```sql
CREATE TABLE payssion_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID NOT NULL,
  subscription_id VARCHAR(255) NOT NULL UNIQUE, -- Payssion 订阅 ID
  mandate_id VARCHAR(255) NOT NULL, -- 关联的授权 ID
  order_no VARCHAR(255) NOT NULL, -- 关联到初始订单
  status VARCHAR(50) NOT NULL, -- active, canceled, completed
  plan_type VARCHAR(50) NOT NULL, -- monthly, yearly, quarterly
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  interval_unit VARCHAR(10) NOT NULL DEFAULT 'day', -- Payssion 只支持 day
  interval_count INT NOT NULL, -- 30 for monthly, 365 for yearly
  total_times INT NOT NULL, -- 总计费次数
  completed_times INT DEFAULT 0, -- 已完成计费次数
  next_billing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  subscription_data JSONB -- 存储 Payssion 返回的完整订阅数据
);
```

3. **订阅支付记录表** (新建)
```sql
CREATE TABLE payssion_subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id VARCHAR(255) NOT NULL, -- Payssion 订阅 ID
  payment_id VARCHAR(255) NOT NULL UNIQUE, -- Payssion 支付 ID
  user_uuid UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL, -- succeeded, failed
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  payment_data JSONB -- 存储支付详细信息
);
```

4. **现有表的扩展**
   - `orders` 表：添加 `subscription_type` 字段（'single', 'subscription'）
   - `memberships` 表：添加 `payssion_subscription_id` 字段关联订阅
   - `memberships` 表：添加 `auto_renewal` 字段标识是否自动续费

## 测试策略

### 测试环境需求

1. **Payssion V2 测试环境配置**
   - 测试 API 密钥和 Secret Key
   - 测试环境 URL：`https://sandbox-api.payssion.com/v2`
   - 俄罗斯支付方式测试信息（需向 Payssion 获取）

2. **关键测试用例**
   - **授权流程测试**：创建 Mandate，测试各种俄罗斯支付方式
   - **订阅创建测试**：使用有效 mandate_id 创建订阅
   - **周期支付测试**：验证自动扣款功能（可能需要缩短测试周期）
   - **Webhook 处理测试**：模拟各种订阅事件通知
   - **订阅取消测试**：用户主动取消和系统取消
   - **失败处理测试**：支付失败、授权失效等异常情况

3. **集成测试重点**
   - 与现有会员系统的数据同步
   - 积分发放逻辑的正确性
   - 多语言界面的支持
   - 俄罗斯用户地理位置检测

## 待确认的产品需求

### 关键产品决策

1. **订阅计费周期映射**
   - 现有 monthly (30天) → Payssion interval_unit=day, times=按需计算
   - 现有 yearly (365天) → Payssion interval_unit=day, times=按需计算  
   - 现有 quarterly → 是否继续支持？

2. **用户体验设计**
   - **俄罗斯用户识别**：如何检测用户地理位置并推荐 Payssion？
   - **支付方式选择**：如何在 Stripe 和 Payssion 之间智能切换？
   - **授权流程**：如何向用户解释 Mandate 授权的必要性？

3. **订阅管理功能范围**
   - 用户是否可以自助取消订阅？（Payssion 支持）
   - 是否支持订阅暂停？（Payssion V2 未明确支持）
   - 是否支持订阅升级/降级？（需要取消旧订阅，创建新订阅）
   - 订阅到期前的续费提醒机制？

4. **支付失败处理策略**
   - **宽限期设置**：支付失败后给用户多长时间修复？
   - **重试机制**：Payssion 自动重试 vs 手动重试
   - **降级机制**：多次失败后是否自动降级为免费用户？
   - **通知策略**：邮件、站内信、推送通知的配合

5. **多支付方式并存**
   - 现有 Stripe 订阅用户如何处理？
   - 是否允许用户在两种支付方式间切换？
   - 数据统计和分析如何区分不同支付渠道？

### 技术实现细节确认

1. **周期计算逻辑**
   - ✅ Payssion V2 直接支持 `month` 和 `year` 单位
   - 现有 monthly → `interval_unit: "month", times: 按需设置`
   - 现有 yearly → `interval_unit: "year", times: 按需设置`
   - 现有 quarterly → `interval_unit: "quarter", times: 按需设置`

2. **货币和定价**
   - 是否继续使用 USD？
   - 是否考虑卢布定价（RUB）？
   - 汇率波动如何处理？

3. **数据同步和一致性**
   - Payssion 订阅状态与本地会员状态如何同步？
   - 网络中断时如何保证数据一致性？
   - 是否需要定期的状态校验任务？

## 下一步行动计划

### 阶段 1：需求确认和环境准备 (1-2天)

1. **[✅] 获取 Payssion V2 API 文档** - 已完成
   - ✅ 通过 Puppeteer 获取完整 API 文档
   - ✅ 确认俄罗斯支付方式支持情况
   - ✅ 了解 Webhook 机制和重试策略

2. **[ ] 获取测试环境访问**
   - 联系 Payssion 获取测试 API 密钥
   - 获取俄罗斯支付方式测试信息
   - 配置 Webhook 测试端点

3. **[ ] 产品需求最终确认**
   - 与产品团队确认订阅周期映射方案
   - 确定用户体验流程设计
   - 制定支付失败处理策略

### 阶段 2：数据库和基础架构 (2-3天)

4. **[ ] 数据库结构设计和实现**
   - 创建 `payssion_mandates` 表
   - 创建 `payssion_subscriptions` 表  
   - 创建 `payssion_subscription_payments` 表
   - 扩展现有表字段

5. **[ ] 扩展支付提供商接口**
   - 在 `types.ts` 中添加订阅相关类型定义
   - 扩展 `PaymentProvider` 接口支持订阅方法
   - 创建订阅相关的数据模型

### 阶段 3：核心功能实现 (3-5天)

6. **[ ] 实现 Payssion V2 订阅功能**
   - 扩展 `PayssionProvider` 支持 V2 API
   - 实现 Mandate 创建和管理
   - 实现订阅创建、查询、取消
   - 实现订阅 Webhook 处理

7. **[ ] 集成现有业务逻辑**
   - 订阅支付成功后的会员创建/续费
   - 积分发放逻辑适配
   - 订阅状态与会员状态同步

### 阶段 4：用户界面和体验 (2-3天)

8. **[ ] 前端界面开发**
   - 俄罗斯用户支付方式选择界面
   - 订阅管理页面（查看、取消）
   - 支付失败处理和重试界面

9. **[ ] 地理位置检测和智能推荐**
   - 基于用户地理位置推荐支付方式
   - 支付方式选择逻辑优化

### 阶段 5：测试和部署 (2-3天)

10. **[ ] 全面测试**
    - 单元测试和集成测试
    - 俄罗斯支付方式端到端测试
    - Webhook 通知处理测试
    - 失败场景和边界条件测试

11. **[ ] 部署和监控**
    - 生产环境配置
    - 监控和告警设置
    - 灰度发布计划

### 阶段 6：优化和完善 (持续)

12. **[ ] 数据分析和优化**
    - 订阅转化率分析
    - 支付成功率监控
    - 用户体验优化

## 风险和注意事项

1. **API 兼容性风险**
   - V1 到 V2 的接口变化可能较大
   - 需要充分测试以确保现有功能不受影响

2. **支付方式支持**
   - 需要验证 V2 中俄罗斯支付方式的实际可用性
   - 可能需要重新配置支付方式映射

3. **数据一致性**
   - 订阅状态与会员状态的同步
   - 支付失败时的数据回滚

4. **监控和日志**
   - 订阅相关的关键指标监控
   - 详细的错误日志记录