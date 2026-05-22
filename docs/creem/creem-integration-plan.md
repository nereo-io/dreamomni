# Creem 支付集成技术方案

## 1. 项目背景

### 1.1 现有支付系统架构
- **Stripe**: 国际支付，支持一次性支付和订阅
- **Payssion V2**: 俄罗斯地区支付，仅支持订阅
- **PaymentRouter**: 智能路由，根据地理位置选择支付提供商

### 1.2 现有问题
1. **API 不统一**: Stripe 使用 `/api/checkout`，Payssion 使用 `/api/subscription/create`
2. **功能不完整**: Payssion 缺少一次性支付支持
3. **维护复杂**: 两套 SDK 和 Webhook 处理逻辑
4. **地理限制**: 支付方式受地理位置限制

### 1.3 Creem 集成目标
- **统一接口**: 提供统一的支付 API
- **功能完整**: 同时支持一次性支付和订阅
- **简化维护**: 减少多 SDK 维护成本
- **扩展性**: 为未来支付方式扩展提供基础

## 2. 技术架构设计

### 2.1 整体架构
```
Frontend → Unified Payment API → PaymentRouter → [Creem | Stripe | Payssion]
```

### 2.2 Creem Provider 设计
```typescript
// 新增 CreemProvider 类
class CreemProvider implements PaymentProvider {
  name = "creem";
  
  // 一次性支付
  async createPayment(request: PaymentRequest): Promise<PaymentResponse>
  
  // 订阅相关
  async createMandate(request: MandateRequest): Promise<MandateResponse>
  async createSubscription(request: SubscriptionRequest): Promise<SubscriptionResponse>
  async cancelSubscription(subscriptionId: string): Promise<boolean>
  async querySubscription(subscriptionId: string): Promise<SubscriptionStatus>
  
  // Webhook 处理
  async handleWebhook(data: any): Promise<WebhookResult>
  async handleSubscriptionWebhook(data: any): Promise<SubscriptionWebhookResult>
  
  // 配置验证
  validateConfig(): boolean
}
```

### 2.3 路由策略更新
```typescript
// PaymentRouter 更新
class PaymentRouter {
  private getDefaultProvider(location?: LocationInfo): string {
    // 优先级: Payssion（俄罗斯）> Stripe（非俄罗斯默认）> Creem（备用/可选）
    if (shouldUsePayssion(location?.countryCode)) return "payssion";
    if (this.providers.has("stripe")) return "stripe";
    if (this.providers.has("creem")) return "creem";
    return "stripe";
  }
  
  // 支持提供商回退
  async createPaymentWithFallback(request: PaymentRequest): Promise<PaymentResponse> {
    const providers = this.getProviderPriority(request.location);
    
    for (const providerName of providers) {
      try {
        const provider = this.providers.get(providerName);
        return await provider.createPayment(request);
      } catch (error) {
        console.warn(`Provider ${providerName} failed:`, error);
        // 继续尝试下一个提供商
      }
    }
    
    throw new PaymentError("ALL_PROVIDERS_FAILED", "所有支付提供商都失败");
  }
}
```

## 3. API 接口设计

### 3.1 统一支付接口
```typescript
// 新增 /api/payment/create 接口
POST /api/payment/create
{
  // 基础信息
  "amount": 2500,
  "currency": "USD",
  "product_id": "prod_monthly_plan",
  "product_name": "Monthly Pro Plan",
  "product_type": "subscription",
  
  // 支付类型
  "payment_type": "one-time" | "subscription",
  "interval": "month" | "year", // 订阅时必填
  
  // 支付方式（可选，由系统自动选择）
  "payment_method": "auto" | "stripe" | "payssion" | "creem",
  
  // 用户信息
  "user_location": {
    "country": "US",
    "countryCode": "US"
  },
  
  // 回调地址
  "return_url": "https://veo3ai.io/success",
  "cancel_url": "https://veo3ai.io/cancel"
}
```

### 3.2 响应格式
```typescript
// 成功响应
{
  "success": true,
  "order_no": "1234567890",
  "payment_provider": "creem",
  "checkout_url": "https://checkout.creem.io/pay/cs_...",
  "session_id": "cs_...",
  "requires_redirect": true
}

// 失败响应
{
  "success": false,
  "error": "PAYMENT_FAILED",
  "message": "支付创建失败",
  "fallback_provider": "stripe" // 建议的备用提供商
}
```

### 3.3 Webhook 统一处理
```typescript
// 新增 /api/payment/webhook/creem
POST /api/payment/webhook/creem
// 处理 Creem 的所有 Webhook 事件

// 更新现有的 Webhook 处理
POST /api/payment/webhook/unified
// 统一的 Webhook 入口，根据 provider 分发
```

## 4. 数据库设计

### 4.1 Order 表更新
```sql
-- 新增字段
ALTER TABLE orders ADD COLUMN payment_provider VARCHAR(50) DEFAULT 'stripe';
ALTER TABLE orders ADD COLUMN session_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN external_id VARCHAR(255); -- Creem 的订单/订阅 ID
ALTER TABLE orders ADD COLUMN webhook_data JSONB; -- 存储 Webhook 原始数据
```

### 4.2 Payment Provider 配置表
```sql
-- 新增 payment_providers 表
CREATE TABLE payment_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- 优先级，数字越小优先级越高
  config JSONB, -- 提供商配置
  supported_countries TEXT[], -- 支持的国家
  supported_payment_types TEXT[], -- 支持的支付类型
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始数据
INSERT INTO payment_providers (name, priority, supported_countries, supported_payment_types) VALUES
('creem', 1, ARRAY['*'], ARRAY['one-time', 'subscription']),
('stripe', 2, ARRAY['*'], ARRAY['one-time', 'subscription']),
('payssion', 3, ARRAY['RU', 'BY', 'KZ'], ARRAY['subscription']);
```

## 5. 实施计划

### 5.1 Phase 1: 基础集成（Week 1-2）
- [ ] 创建 CreemProvider 类
- [ ] 实现基础的一次性支付功能
- [ ] 添加 Creem 到 PaymentRouter
- [ ] 创建统一的 `/api/payment/create` 接口
- [ ] 实现 Creem Webhook 处理

### 5.2 Phase 2: 订阅功能（Week 3-4）
- [ ] 实现 Creem 订阅功能
- [ ] 添加订阅管理接口
- [ ] 实现订阅状态同步
- [ ] 添加订阅取消功能

### 5.3 Phase 3: 前端集成（Week 5-6）
- [ ] 更新前端支付组件
- [ ] 统一支付流程
- [ ] 添加支付方式选择逻辑
- [ ] 实现支付状态监控

### 5.4 Phase 4: 测试与优化（Week 7-8）
- [ ] 集成测试
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 日志和监控

## 6. 配置管理

### 6.1 环境变量
```env
# Creem 配置
CREEM_API_KEY=creem_live_...
CREEM_API_SECRET=creem_secret_...
CREEM_WEBHOOK_SECRET=whsec_...
CREEM_BASE_URL=https://api.creem.io
CREEM_TEST_MODE=false

# 支付提供商优先级
PAYMENT_PROVIDER_PRIORITY=creem,stripe,payssion
```

### 6.2 配置文件
```typescript
// config/creem.ts
export const creemConfig = {
  apiKey: process.env.CREEM_API_KEY,
  apiSecret: process.env.CREEM_API_SECRET,
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET,
  baseUrl: process.env.CREEM_BASE_URL || 'https://api.creem.io',
  testMode: process.env.CREEM_TEST_MODE === 'true',
  
  // 支付配置
  payment: {
    supportedCurrencies: ['USD', 'EUR', 'CNY'],
    defaultReturnUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/success`,
    defaultCancelUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/payment/cancel`,
  },
  
  // 订阅配置
  subscription: {
    supportedIntervals: ['month', 'year'],
    defaultReturnUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/subscription/success`,
  }
};
```

## 7. 监控与日志

### 7.1 支付日志
```typescript
// 统一的支付日志格式
interface PaymentLog {
  order_no: string;
  user_uuid: string;
  payment_provider: string;
  action: 'create' | 'success' | 'failed' | 'webhook';
  amount: number;
  currency: string;
  status: string;
  error?: string;
  duration?: number;
  timestamp: string;
}
```

### 7.2 监控指标
- **支付成功率**: 按提供商统计
- **支付处理时间**: 平均处理时间
- **错误率**: 错误类型分布
- **提供商可用性**: 实时状态监控

## 8. 错误处理与回退

### 8.1 错误处理策略
```typescript
// 错误处理优先级
const errorHandlingStrategy = {
  // 网络错误 -> 重试
  'NETWORK_ERROR': 'retry',
  
  // 配置错误 -> 回退到下一个提供商
  'CONFIG_ERROR': 'fallback',
  
  // 业务错误 -> 返回用户
  'BUSINESS_ERROR': 'return_error',
  
  // 未知错误 -> 记录日志并回退
  'UNKNOWN_ERROR': 'log_and_fallback'
};
```

### 8.2 回退机制
```typescript
// 提供商回退顺序
const providerFallbackOrder = {
  primary: 'creem',
  secondary: 'stripe',
  tertiary: 'payssion'
};
```

## 9. 测试策略

### 9.1 单元测试
- CreemProvider 各方法测试
- PaymentRouter 路由逻辑测试
- Webhook 处理逻辑测试

### 9.2 集成测试
- 端到端支付流程测试
- 多提供商回退测试
- 订阅生命周期测试

### 9.3 性能测试
- 并发支付处理测试
- 大量 Webhook 处理测试
- 数据库性能测试

## 10. 风险评估

### 10.1 技术风险
- **Creem API 稳定性**: 新接入的第三方服务稳定性未知
- **数据迁移**: 现有订单数据需要兼容处理
- **性能影响**: 多提供商路由可能影响响应时间

### 10.2 业务风险
- **支付中断**: 集成过程中可能影响现有支付流程
- **用户体验**: 支付流程变更可能影响用户体验
- **合规性**: 不同地区的支付合规要求

### 10.3 风险缓解措施
- **灰度发布**: 逐步切换用户到新系统
- **监控告警**: 实时监控支付成功率
- **回滚机制**: 快速回滚到原系统的能力
- **数据备份**: 完整的数据备份和恢复方案

## 11. 成功指标

### 11.1 技术指标
- 支付成功率 > 99%
- 支付处理时间 < 3秒
- 系统可用性 > 99.9%
- 错误恢复时间 < 5分钟

### 11.2 业务指标
- 支付转化率提升 10%
- 客户支付满意度 > 4.5/5
- 支付相关客服工单减少 30%
- 国际用户支付成功率提升 15%

## 12. 后续规划

### 12.1 功能扩展
- 支持更多支付方式（Apple Pay, Google Pay 等）
- 实现智能路由算法优化
- 添加支付数据分析看板
- 支持多币种动态定价

### 12.2 技术优化
- 实现支付缓存策略
- 优化数据库查询性能
- 添加支付重试机制
- 实现支付状态实时推送

---

*本文档将根据实际开发进度和需求变化持续更新*
