# Payssion V2 生产环境监控指南

## 概述

本文档提供 Payssion V2 订阅系统在 Vercel 生产环境中的监控策略和故障排查指南。

## 🎯 关键监控点

### 1. Webhook 处理状态
**监控路径：** `/api/payssion/v2-webhook`

**关键日志标识：**
```bash
🎯 Webhook: [事件类型]           # webhook 接收确认
🔐 Signature verification: VALID/INVALID  # 签名验证状态
✅ [事件类型] processed          # 事件处理成功
❌ [事件类型] failed:           # 事件处理失败
```

**核心 Webhook 事件流程：**
1. `mandate.succeeded` - 用户授权成功
2. `subscription.created` - 订阅创建成功
3. `subscription.completed` - 订阅激活（忽略处理）
4. `payment.succeeded` - 首次支付成功

### 2. 订阅创建流程
**监控路径：** `/api/subscription/create`

**关键日志标识：**
```bash
🚀 创建订阅 {product_id, payment_method}  # 创建开始
❌ 用户未认证                           # 身份验证失败
❌ 缺少必要参数                         # 参数验证失败
❌ 无效的订阅类型 {interval}            # 订阅类型错误
🚨 订阅创建异常 [错误信息]              # 创建过程异常
```

### 3. 支付处理关键节点
**业务流程必检日志序列：**
```bash
# 完整的成功流程应该包含以下日志（按顺序）：
1. 🚀 创建订阅 {product_id: "mini-yearly", payment_method: "sberpay"}
2. 🎯 Webhook: mandate.succeeded
3. 🔐 Signature verification: VALID
4. ✅ mandate.succeeded processed
5. 🎯 Webhook: subscription.created
6. ✅ subscription.created processed
7. 🎯 Webhook: payment.succeeded
8. ✅ Payment processed: [订单号] → [积分数] credits awarded
9. ✅ payment.succeeded processed
```

## 🚨 报警配置

### 立即报警（P0 - 系统安全）
```bash
❌ Signature validation failed         # 签名验证失败
❌ Missing signature in webhook request # 缺少签名
❌ Missing API key for signature verification # 缺少 API Key
❌ Async webhook processing failed     # 异步处理失败
```

### 高优先级报警（P1 - 业务中断）
```bash
❌ JSON parse error                    # JSON 解析错误
❌ Provider not found                  # 支付提供者未找到
❌ 订阅创建异常                         # 订阅创建失败
❌ [事件类型] failed: [错误信息]        # 事件处理失败
```

### 中等优先级报警（P2 - 业务异常）
```bash
❌ 用户未认证                          # 用户认证问题
❌ 缺少必要参数                        # 参数验证问题
❌ 无效的订阅类型                      # 业务逻辑错误
```

## 📊 监控仪表板指标

### 实时健康度指标
1. **API 成功率**
   - `/api/subscription/create` 成功率 >95%
   - `/api/payssion/v2-webhook` 成功率 >99%

2. **响应时间**
   - Webhook 处理时间 <2s
   - 订阅创建时间 <10s

3. **业务转化率**
   - 订阅创建成功率：`🚀 创建订阅` → 成功响应
   - 支付完成率：`mandate.succeeded` → `payment.succeeded`
   - 积分发放成功率：`payment.succeeded` → `credits awarded`

### 错误率监控
- HTTP 4xx 错误率 <5%
- HTTP 5xx 错误率 <1%
- Webhook 签名验证失败率 <0.1%

## 🔍 故障排查指南

### 常见问题及解决方案

#### 1. 签名验证失败
**症状：** `❌ Signature validation failed`
**检查项：**
- 环境变量 `PAYSSION_V2_SECRET_KEY` 是否正确配置
- Payssion 控制台中的 Webhook 签名密钥是否匹配
- 请求头中是否包含正确的签名字段

#### 2. 积分数量错误
**症状：** 日志显示 `credits: 10800` 但应该是 `2400`
**检查项：**
- `PaymentProcessingService.ts:112` 是否使用 `order.credits` 而非 `order.amount`
- 产品配置中的积分数量是否正确
- 订单创建时的积分参数是否正确传递

#### 3. Webhook 处理超时
**症状：** `❌ Async webhook processing failed`
**检查项：**
- 数据库连接是否正常
- 外部 API 调用是否响应及时
- Vercel 函数执行时间是否超过限制

#### 4. 订阅创建失败
**症状：** `🚨 订阅创建异常`
**检查项：**
- 用户认证状态
- 产品配置参数完整性
- Payssion API 连通性
- 订单数据库写入是否成功

## 📈 性能优化建议

### 监控频率
- **实时监控：** 错误日志、签名验证失败
- **分钟级监控：** API 成功率、响应时间
- **小时级监控：** 业务转化率、积分发放统计
- **日级监控：** 订阅趋势、用户行为分析

### 日志采样策略
- **保留所有：** 错误日志、警告日志
- **采样保留：** 成功日志（10% 采样率）
- **定期清理：** 超过 30 天的调试日志

## 🛠️ 调试工具

### Vercel 日志查询示例
```bash
# 查询 webhook 错误
vercel logs --filter="❌" --since=1h

# 查询特定订单处理
vercel logs --filter="订单号" --since=24h

# 查询签名验证问题
vercel logs --filter="Signature verification" --since=1h
```

### 关键环境变量检查清单
- [ ] `PAYSSION_V2_SECRET_KEY` - Webhook 签名密钥
- [ ] `PAYSSION_V2_API_KEY` - API 认证密钥
- [ ] `NEXT_PUBLIC_WEB_URL` - 回调地址配置
- [ ] 数据库连接相关环境变量

## 📋 上线检查清单

### 部署前验证
- [ ] 所有环境变量已正确配置
- [ ] Webhook 端点已在 Payssion 控制台配置
- [ ] 签名验证功能已启用
- [ ] 产品配置与积分发放逻辑一致

### 部署后验证
- [ ] Webhook 接收正常（查看 `🎯 Webhook` 日志）
- [ ] 签名验证通过（查看 `🔐 Signature verification: VALID`）
- [ ] 订阅创建流程完整（验证完整事件序列）
- [ ] 积分发放数量正确（验证 credits 字段）
- [ ] 监控和报警系统正常工作

## 📞 紧急联系信息

**生产环境异常处理：**
1. 立即检查 Vercel 函数日志
2. 验证 Payssion 控制台状态
3. 确认数据库连接正常
4. 如需紧急关闭，可临时返回 HTTP 503 状态码

---

**文档版本：** v1.0  
**最后更新：** 2025-06-30  
**负责人：** 开发团队