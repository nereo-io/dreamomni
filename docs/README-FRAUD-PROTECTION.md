# 🛡️ 反薅羊毛防护系统

## 📋 概述

由于8月29日-31日期间发生大规模薅羊毛攻击，已实施全面的防护措施，成功阻止了攻击者利用免费积分进行批量视频生成。

## 🚨 攻击情况分析

### 攻击规模
- **时间**: 2025年8月29日 - 8月31日 
- **攻击源**: AWS服务器 (34.203.68.42, 3.228.45.243)
- **虚假账号**: 10,823个
- **经济损失**: ~$2,750 USD
- **生成量暴增**: 从每天1,000次增至4,500次

### 攻击手法
- 使用AWS服务器 (34.203.68.42, 3.228.45.243) 批量攻击
- **临时邮箱大量注册**: 主要使用 `drmail.in` (10,761个账号，99.4%)
- 每个账号注册后立即消耗免费10积分生成1个视频
- 完全自动化脚本攻击，绕过传统邮箱验证

## ✅ 已实施防护措施

### 1. 紧急响应 (已完成)
- [x] **IP封禁**: 立即封禁主要攻击IP
- [x] **账号禁用**: 批量禁用10,823个虚假账号
- [x] **积分回收**: 回收剩余虚假积分

### 2. 系统防护 (已部署)
- [x] **IP频率限制**: 每IP每小时最多5次注册
- [x] **邮箱域名验证**: 禁止临时/一次性邮箱注册
- [x] **用户验证**: 被禁用户无法使用服务
- [x] **积分策略**: 新用户积分保持10分(有其他防护)
- [x] **实时监控**: 异常检测和自动告警

### 3. 监控系统 (已上线)
- [x] **管理面板**: `/admin/fraud-monitor` 实时监控
- [x] **自动告警**: 异常行为自动检测和通知
- [x] **数据统计**: 实时安全指标和威胁分析

## 🔧 技术实现

### 数据库表结构

```sql
-- IP注册限制表
CREATE TABLE ip_registration_limits (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR NOT NULL UNIQUE,
    registration_count INTEGER DEFAULT 1,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 可疑用户标记表  
CREATE TABLE suspicious_users (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR NOT NULL,
    reason TEXT,
    signin_ip VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表增加禁用字段
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
```

### 核心服务

#### IP限制服务 (`services/ip-rate-limit.ts`)
```typescript
// 检查IP注册限制
await checkIPRegistrationLimit(clientIP)

// 记录IP注册事件  
await recordIPRegistration(clientIP)

// 检查并封禁滥用IP
await checkAndBanAbusiveIP(clientIP)
```

#### 邮箱验证服务 (`services/email-validation.ts`)
```typescript
// 验证邮箱域名（防止临时邮箱）
const emailValidation = comprehensiveEmailValidation(email)

// 检测可疑邮箱模式
const patternCheck = detectSuspiciousEmailPatterns(email)

// 临时邮箱黑名单检查
const domainValidation = validateEmailDomain(email)
```

#### 监控脚本 (`scripts/fraud-monitor.ts`)
```typescript
// 启动实时监控
npm run ts scripts/fraud-monitor.ts

// 或在生产环境中作为后台服务运行
pm2 start scripts/fraud-monitor.ts --name fraud-monitor
```

## 🚀 部署和使用

### 1. 环境变量配置

```bash
# .env.local
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### 2. 启动监控脚本

```bash
# 开发环境
pnpm ts scripts/fraud-monitor.ts

# 生产环境 (使用PM2)
pm2 start "pnpm ts scripts/fraud-monitor.ts" --name fraud-monitor
pm2 save
pm2 startup
```

### 3. 访问管理面板

管理员可通过以下链接访问实时监控面板：
```
https://veo3ai.io/admin/fraud-monitor
```

## 📊 监控指标

### 实时统计
- **被禁用用户**: 当前被封禁的用户数量
- **封禁IP**: 被屏蔽的IP地址数量  
- **今日注册**: 当天新用户注册数量
- **今日生成**: 当天视频生成总量

### 告警阈值
- **每小时注册量 > 100**: 高风险
- **单IP注册 > 10**: 可疑行为
- **每小时生成 > 50**: 异常活动
- **新用户批量生成 > 20**: 严重威胁

## 🔒 防护机制

### 注册阶段
1. **邮箱域名验证** - 拒绝临时/一次性邮箱
2. **IP地址频率检查** - 限制注册频率
3. **黑名单IP自动拦截** - 已知攻击IP直接屏蔽
4. **异常模式检测** - 可疑邮箱格式识别

### 使用阶段  
1. 被禁用户服务限制
2. 积分消耗严格验证
3. 异常生成模式检测

### 监控告警
1. 实时异常检测
2. 自动防护执行
3. 管理员通知系统

## 📈 效果评估

### 防护效果
- ✅ **攻击阻断**: 成功阻止持续攻击
- ✅ **临时邮箱封禁**: drmail.in等域名已全面屏蔽
- ✅ **损失控制**: 防止进一步经济损失
- ✅ **系统稳定**: 恢复正常服务水平  
- ✅ **多层防护**: IP+邮箱+用户验证全覆盖

### 性能影响
- **注册延迟**: +50ms (IP检查开销)
- **系统负载**: 可忽略不计
- **数据库**: 新增3个防护表

## ⚠️ 注意事项

### 管理员权限
- 管理面板需要管理员邮箱验证
- 在 `ADMIN_EMAILS` 环境变量中配置授权邮箱

### 监控维护
- 监控脚本需要持续运行
- 建议使用PM2或systemd管理进程
- 定期检查监控日志和告警

### 误判处理
- 正常用户可能偶尔触发限制
- 管理员可通过面板手动解除IP封禁
- 建立用户申诉和人工审核机制

## 🛠️ 故障排除

### 常见问题

**Q: 监控脚本无法启动？**
A: 检查环境变量配置和数据库连接权限

**Q: 管理面板无法访问？**  
A: 确认邮箱已添加到 `ADMIN_EMAILS` 环境变量

**Q: IP限制过于严格？**
A: 可调整 `services/ip-rate-limit.ts` 中的限制参数

**Q: 如何手动解除用户封禁？**
A: 在数据库中将 `users.is_banned` 设为 `false`

### 维护命令

```sql
-- 查看被禁用用户统计
SELECT COUNT(*) FROM users WHERE is_banned = true;

-- 查看封禁IP列表
SELECT * FROM ip_registration_limits WHERE is_blocked = true;

-- 解除特定用户封禁
UPDATE users SET is_banned = false WHERE uuid = 'user-uuid';

-- 解除特定IP封禁
UPDATE ip_registration_limits SET is_blocked = false WHERE ip_address = 'ip-address';
```

## 📝 更新日志

- **2025-08-31**: 实施紧急防护措施，成功阻止大规模薅羊毛攻击
- **2025-08-31**: 部署IP频率限制和用户验证机制  
- **2025-08-31**: 上线实时监控系统和管理面板
- **2025-08-31**: 调整新用户积分策略，降低滥用风险