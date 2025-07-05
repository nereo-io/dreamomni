# Payssion V2 API 接口详细文档

基于官方文档和测试，整理的 Payssion V2 关键接口格式。

## 1. Create Customer Mandate (创建客户授权)

### 接口信息
- **方法**: `POST`
- **端点**: `https://api.payssion.com/v2/customers/{customer_id}/mandates`
- **认证**: `Authorization: Bearer {api_key}`

### 请求参数
```json
{
  "reference": "string",           // 商户参考号
  "payment_method": "string",      // 支付方式 (card_ru, yoomoney_ru, sberpay_ru, tbank_ru)
  "terminal_type": "web",          // 终端类型，默认 "web"
  "return_url": "string"           // 授权成功后的返回 URL
}
```

### 俄罗斯支付方式映射
| payment_method | 支付方式名称 | 需要的额外信息 |
|----------------|-------------|----------------|
| `card_ru` | 俄罗斯信用卡 | - |
| `yoomoney_ru` | YooMoney | - |
| `sberpay_ru` | SberPay | - |
| `tbank_ru` | T-Pay (原 Tinkoff) | - |

### 响应格式
```json
{
  "id": "string",                  // Mandate ID (20字符)
  "object": "mandate",
  "reference": "string",
  "customer_id": "string",
  "payment_method": "string",
  "terminal_type": "web",
  "return_url": "string",
  "action": {
    "type": "redirect",            // 或其他操作类型
    "url": "string"                // 用户需要访问的授权 URL
  },
  "status": "pending",             // pending, succeeded, canceled
  "created_at": "2023-01-01T00:00:00Z"
}
```

## 2. Create Subscription (创建订阅)

### 接口信息
- **方法**: `POST`
- **端点**: `https://api.payssion.com/v2/subscriptions`
- **认证**: `Authorization: Bearer {api_key}`

### 请求参数
```json
{
  "reference": "string",           // 可选，商户参考号
  "mandate_id": "string",          // 必需，来自 Create Mandate 的 ID (20字符)
  "email": "string",               // 可选，接收发票的邮箱
  "currency": "USD",               // 必需，ISO 4217 货币代码
  "amount": "9.99",                // 必需，订阅金额 (字符串格式)
  "description": "string",         // 可选，订阅描述
  "interval_unit": "month",        // 必需，订阅周期：day, week, month, quarter, year
  "times": 12                      // 必需，总计费次数，必须 > 1
}
```

### 周期映射
| interval_unit | 说明 | 适用场景 |
|---------------|------|----------|
| `day` | 按天 | 测试或特殊场景 |
| `week` | 按周 | - |
| `month` | 按月 | 月付会员 |
| `quarter` | 按季度 | 季付会员 |
| `year` | 按年 | 年付会员 |

### 响应格式
```json
{
  "id": "string",                  // 订阅 ID
  "object": "subscription",
  "livemode": true,
  "reference": "string",
  "customer_id": "string",
  "email": "string",
  "mandate_id": "string",
  "amount": "9.99",
  "currency": "USD",
  "description": "string",
  "time_created": "2023-01-01T00:00:00Z",
  "time_start": "2023-01-01T00:00:00Z",
  "time_current_period_start": "2023-01-01T00:00:00Z",
  "time_current_period_end": "2023-02-01T00:00:00Z",
  "interval_unit": "month",
  "times": 12,
  "times_completed": 0,
  "status": "created",             // created, active, canceled, completed
  "metadata": {},
  "custom_field": "string"
}
```

## 3. Cancel Subscription (取消订阅)

### 接口信息
- **方法**: `POST`
- **端点**: `https://api.payssion.com/v2/subscriptions/{subscription_id}/cancel`
- **认证**: `Authorization: Bearer {api_key}`

### 请求参数
```json
{}  // 空 body
```

### 响应格式
```json
{
  "id": "string",
  "object": "subscription", 
  "status": "canceled",
  "canceled_at": "2023-01-01T00:00:00Z"
}
```

## 4. Retrieve Subscription (查询订阅)

### 接口信息
- **方法**: `GET`
- **端点**: `https://api.payssion.com/v2/subscriptions/{subscription_id}`
- **认证**: `Authorization: Bearer {api_key}`

### 响应格式
```json
{
  "id": "string",
  "object": "subscription",
  "livemode": true,
  "reference": "string",
  "customer_id": "string", 
  "email": "string",
  "mandate_id": "string",
  "amount": "9.99",
  "currency": "USD",
  "description": "string",
  "time_created": "2023-01-01T00:00:00Z",
  "time_start": "2023-01-01T00:00:00Z", 
  "time_current_period_start": "2023-01-01T00:00:00Z",
  "time_current_period_end": "2023-02-01T00:00:00Z",
  "interval_unit": "month",
  "times": 12,
  "times_completed": 3,
  "status": "active",
  "metadata": {},
  "custom_field": "string"
}
```

## 5. Webhook 事件格式

### Subscription Created
```json
{
  "object": "event",
  "livemode": true,
  "type": "subscription.created",
  "data": {
    "object": {
      "id": "sub_SafelyDagOQUDlr",
      "object": "subscription",
      "reference": null,
      "customer_id": "cst_MRe15556LCOCRpT",
      "email": "test@customer.com",
      "mandate_id": "mdt_AfL5ZpbCRoEAApT",
      "amount": "9.99",
      "currency": "USD",
      "description": "test",
      "time_created": "2022-09-10T15:06:13+00:00",
      "time_start": "2022-09-10T15:12:00+00:00",
      "time_current_period_start": null,
      "time_current_period_end": null,
      "interval_unit": "day",
      "times": 3,
      "times_completed": 0,
      "extra": {},
      "metadata": {},
      "status": "created"
    }
  },
  "request": "iar_DtcT0WGhqfOqyT4MleMS",
  "account": "acct_yZNtAP",
  "time_created": "2022-10-25T09:49:00+00:00"
}
```

### Payment Succeeded (订阅支付成功)
```json
{
  "object": "event",
  "livemode": true,
  "type": "payment.succeeded",
  "data": {
    "object": {
      "id": "payment_id",
      "object": "payment",
      "subscription_id": "sub_SafelyDagOQUDlr",
      "amount": "9.99",
      "currency": "USD",
      "status": "succeeded",
      "payment_method": "card_ru",
      "created_at": "2023-01-01T00:00:00Z"
    }
  },
  "request": "iar_DtcT0WGhqfOqyT4MleMS",
  "account": "acct_yZNtAP", 
  "time_created": "2022-10-25T09:49:00+00:00"
}
```

### Payment Failed (订阅支付失败)
```json
{
  "object": "event",
  "livemode": true,
  "type": "payment.failed",
  "data": {
    "object": {
      "id": "payment_id",
      "object": "payment",
      "subscription_id": "sub_SafelyDagOQUDlr",
      "amount": "9.99",
      "currency": "USD",
      "status": "failed",
      "payment_method": "card_ru",
      "failure_reason": "insufficient_funds",
      "created_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

### Subscription Canceled
```json
{
  "object": "event",
  "livemode": true,
  "type": "subscription.canceled", 
  "data": {
    "object": {
      "id": "sub_SafelyDagOQUDlr",
      "object": "subscription",
      "status": "canceled",
      "canceled_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

## 6. Webhook 签名验证

### 验证步骤
1. 获取 `Payssion-Signature` 头部
2. 提取 webhook 事件数据（JSON 格式）
3. 使用 HMAC-SHA256 计算签名
4. 比较签名

### PHP 示例
```php
$signature = \hash_hmac('sha256', $payloadJson, $signingSecret);
```

### Node.js 示例
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', signingSecret)
  .update(payloadString)
  .digest('hex');
```

## 7. 错误响应格式

```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Invalid mandate_id: test_mandate_id. Length should be 20.",
    "param": "mandate_id",
    "code": "parameter_invalid"
  }
}
```

### 常见错误代码
- `unauthorized` - API 密钥无效
- `parameter_invalid` - 参数格式错误
- `request_invalid` - 请求 URL 无效
- `resource_not_found` - 资源不存在

## 8. 最佳实践

1. **Mandate 管理**：
   - 一个客户可以有多个 mandate（最多5个）
   - 建议为每种支付方式创建单独的 mandate
   - Mandate 创建后需要用户完成授权流程

2. **订阅管理**：
   - 订阅创建前必须有有效的 mandate
   - 建议设置合理的重试和失败处理机制
   - 定期检查订阅状态以确保数据同步

3. **Webhook 处理**：
   - 必须验证签名以确保安全性
   - 实现幂等性处理，避免重复处理同一事件
   - 设置合理的超时和重试机制