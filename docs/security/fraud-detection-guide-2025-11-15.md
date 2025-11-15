# 反薅羊毛监测指南

定期运行监测查询，识别和封禁恶意用户。

## 监测频率

| 检查项 | 频率 | 执行方式 |
|--------|------|---------|
| 高频IP注册 | **每周一次** | 手动SQL查询 |
| 新一次性邮箱域名 | **每周一次** | 手动SQL查询 |
| 高生成零付费用户 | **每两周一次** | 手动SQL查询 |
| 异常国家注册激增 | **每月一次** | 手动SQL查询 |

---

## 1. 高频IP注册检测

### 检测目标
单个IP在短时间内注册大量账号（接近或超过限制）

### SQL查询

```sql
-- 最近7天，注册≥5个账号的IP（接近每日7个限制）
SELECT
  signin_ip,
  COUNT(*) as account_count,
  COUNT(DISTINCT SUBSTRING(email FROM '@(.*)')) as unique_domains,
  STRING_AGG(DISTINCT SUBSTRING(email FROM '@(.*)'), ', ') as email_domains,
  STRING_AGG(DISTINCT signup_country, ', ') as countries,
  MIN(created_at) as first_registration,
  MAX(created_at) as last_registration,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/3600 as hours_span
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND signin_ip IS NOT NULL
GROUP BY signin_ip
HAVING COUNT(*) >= 5
ORDER BY account_count DESC;
```

### 判断标准

| 账号数 | 时间跨度 | 域名数 | 判定 | 操作 |
|--------|---------|--------|------|------|
| ≥20 | <7天 | 多个 | **高危** | 立即封禁IP |
| 10-19 | <7天 | ≥5个 | **可疑** | 人工审核 |
| 7-9 | <1天 | 多个 | **警告** | 观察，可能是学校/公司 |
| ≥5 | <1小时 | 多个 | **高危** | 立即封禁IP |

### 封禁SQL

```sql
-- 确认后执行封禁
UPDATE ip_registration_limits
SET is_blocked = true
WHERE ip_address = 'xxx.xxx.xxx.xxx';

-- 批量封禁（替换为实际IP列表）
UPDATE ip_registration_limits
SET is_blocked = true
WHERE ip_address IN (
  '202.58.73.18',
  '180.242.178.226'
);
```

---

## 2. 新一次性邮箱域名检测

### 检测目标
识别新出现的、被大量使用的一次性邮箱服务

### SQL查询

```sql
-- 最近7天，使用≥20次的邮箱域名（排除常见邮箱）
SELECT
  SUBSTRING(email FROM '@(.*)') as email_domain,
  COUNT(*) as user_count,
  COUNT(DISTINCT signin_ip) as ip_count,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT signin_ip), 0), 2) as avg_accounts_per_ip,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/3600 as hours_span,
  -- 付费情况
  COUNT(DISTINCT CASE WHEN EXISTS (
    SELECT 1 FROM orders o
    WHERE o.user_uuid = users.uuid
    AND o.status = 'paid'
  ) THEN users.uuid END) as paid_users,
  -- 生成情况
  SUM((SELECT COUNT(*) FROM video_generations vg WHERE vg.user_id = users.uuid)) as total_generations
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY email_domain
HAVING COUNT(*) >= 20
  -- 排除知名邮箱服务
  AND SUBSTRING(email FROM '@(.*)') NOT IN (
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'icloud.com', 'qq.com', '163.com', '126.com'
  )
ORDER BY user_count DESC;
```

### 判断标准

| 用户数 | IP数 | 账号/IP比 | 付费用户 | 判定 | 操作 |
|--------|------|----------|---------|------|------|
| ≥100 | <50 | ≥2.0 | 0 | **高危一次性邮箱** | 立即加入黑名单 |
| 50-99 | <30 | ≥2.0 | 0-2 | **可疑域名** | 人工审核 |
| 20-49 | <15 | ≥1.5 | 0 | **警告** | 观察1周 |

### 加入黑名单

修改 `app/api/auth/signup/route.ts`:

```typescript
const BLOCKED_EMAIL_DOMAINS = [
  // ... 现有域名
  // 2025-XX-XX 新增 - 监测发现的薅羊毛域名
  'new-bad-domain.com',  // XXX账号，XX天内批量注册
];
```

提交部署即可生效。

---

## 3. 高生成零付费用户检测

### 检测目标
疯狂生成视频但从不付费的薅羊毛用户

### SQL查询

```sql
-- 最近30天注册，生成≥10个视频，但零付费的用户
SELECT
  u.uuid,
  u.email,
  SUBSTRING(u.email FROM '@(.*)') as email_domain,
  u.signin_ip,
  u.signup_country,
  u.created_at,
  COUNT(DISTINCT vg.id) as video_count,
  MIN(vg.created_at) as first_video,
  EXTRACT(EPOCH FROM (MIN(vg.created_at) - u.created_at))/60 as minutes_to_first_video,
  -- 付费情况
  (SELECT COUNT(*) FROM orders o WHERE o.user_uuid = u.uuid AND o.status = 'paid') as paid_orders,
  (SELECT COALESCE(SUM(o.amount), 0) FROM orders o WHERE o.user_uuid = u.uuid AND o.status = 'paid') as total_paid
FROM users u
LEFT JOIN video_generations vg ON u.uuid = vg.user_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.uuid, u.email, u.signin_ip, u.signup_country, u.created_at
HAVING COUNT(DISTINCT vg.id) >= 10
  AND (SELECT COUNT(*) FROM orders o WHERE o.user_uuid = u.uuid AND o.status = 'paid') = 0
ORDER BY video_count DESC;
```

### 判断标准

| 视频数 | 注册到首次生成 | 付费订单 | 判定 | 操作 |
|--------|---------------|---------|------|------|
| ≥50 | <10分钟 | 0 | **明确薅羊毛** | 封禁用户 |
| 20-49 | <30分钟 | 0 | **高度可疑** | 封禁用户 |
| 10-19 | <60分钟 | 0 | **可疑** | 观察或封禁 |

### 封禁用户

```sql
-- 单个用户封禁
UPDATE users
SET is_banned = true
WHERE uuid = 'user-uuid-here';

-- 批量封禁（基于邮箱域名）
UPDATE users
SET is_banned = true
WHERE email LIKE '%@wyoxafp.com'
  AND is_banned = false;

-- 批量封禁（基于IP）
UPDATE users
SET is_banned = true
WHERE signin_ip = '202.58.73.18'
  AND is_banned = false;
```

---

## 4. 异常国家注册激增检测

### 检测目标
某个国家在短时间内注册量异常激增（可能是机房攻击）

### SQL查询

```sql
-- 最近7天，每个国家的注册统计
WITH country_stats AS (
  SELECT
    signup_country,
    COUNT(*) as recent_7d_count,
    COUNT(DISTINCT signin_ip) as unique_ips,
    ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT signin_ip), 0), 2) as avg_per_ip
  FROM users
  WHERE created_at >= NOW() - INTERVAL '7 days'
    AND signup_country IS NOT NULL
  GROUP BY signup_country
),
baseline AS (
  SELECT
    signup_country,
    COUNT(*) / 4.0 as avg_weekly_baseline  -- 过去30天的平均每周注册数
  FROM users
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND created_at < NOW() - INTERVAL '7 days'
    AND signup_country IS NOT NULL
  GROUP BY signup_country
)
SELECT
  cs.signup_country,
  cs.recent_7d_count as this_week,
  ROUND(b.avg_weekly_baseline, 0) as avg_baseline,
  ROUND(cs.recent_7d_count / NULLIF(b.avg_weekly_baseline, 0), 2) as increase_ratio,
  cs.unique_ips,
  cs.avg_per_ip
FROM country_stats cs
LEFT JOIN baseline b ON cs.signup_country = b.signup_country
WHERE cs.recent_7d_count >= 20  -- 至少20个注册
ORDER BY increase_ratio DESC NULLS LAST;
```

### 判断标准

| 增长倍数 | 单IP账号数 | 判定 | 操作 |
|---------|-----------|------|------|
| ≥5倍 | ≥2.0 | **异常激增** | 检查IP列表，可能是机房攻击 |
| 3-5倍 | ≥1.5 | **可疑** | 人工审核 |
| 2-3倍 | <1.5 | **正常波动** | 观察 |

---

## 5. 综合异常行为检测

### SQL查询（一次性跑完所有指标）

```sql
-- 综合异常检测：高频IP + 一次性邮箱 + 零付费
WITH high_freq_ips AS (
  SELECT signin_ip, COUNT(*) as ip_count
  FROM users
  WHERE created_at >= NOW() - INTERVAL '7 days'
    AND signin_ip IS NOT NULL
  GROUP BY signin_ip
  HAVING COUNT(*) >= 5
),
suspicious_domains AS (
  SELECT SUBSTRING(email FROM '@(.*)') as domain, COUNT(*) as domain_count
  FROM users
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY domain
  HAVING COUNT(*) >= 20
),
zero_payment_users AS (
  SELECT u.uuid, COUNT(DISTINCT vg.id) as video_count
  FROM users u
  LEFT JOIN video_generations vg ON u.uuid = vg.user_id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY u.uuid
  HAVING COUNT(DISTINCT vg.id) >= 10
    AND (SELECT COUNT(*) FROM orders o WHERE o.user_uuid = u.uuid AND o.status = 'paid') = 0
)
SELECT
  u.uuid,
  u.email,
  u.signin_ip,
  u.signup_country,
  u.created_at,
  -- 异常标记
  CASE WHEN hip.signin_ip IS NOT NULL THEN 'HIGH_FREQ_IP' END as ip_flag,
  CASE WHEN sd.domain IS NOT NULL THEN 'SUSPICIOUS_DOMAIN' END as domain_flag,
  CASE WHEN zp.uuid IS NOT NULL THEN 'ZERO_PAYMENT' END as payment_flag,
  -- 统计
  hip.ip_count,
  sd.domain_count,
  zp.video_count
FROM users u
LEFT JOIN high_freq_ips hip ON u.signin_ip = hip.signin_ip
LEFT JOIN suspicious_domains sd ON SUBSTRING(u.email FROM '@(.*)') = sd.domain
LEFT JOIN zero_payment_users zp ON u.uuid = zp.uuid
WHERE u.created_at >= NOW() - INTERVAL '30 days'
  AND (hip.signin_ip IS NOT NULL OR sd.domain IS NOT NULL OR zp.uuid IS NOT NULL)
ORDER BY
  CASE WHEN hip.signin_ip IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN sd.domain IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN zp.uuid IS NOT NULL THEN 1 ELSE 0 END DESC,
  u.created_at DESC;
```

### 风险评分

| 命中标记 | 风险等级 | 操作 |
|---------|---------|------|
| 3个全命中 | **极高风险** | 立即封禁 |
| 2个命中 | **高风险** | 人工审核后封禁 |
| 1个命中 | **中等风险** | 观察 |

---

## 处理流程

### 发现可疑行为后的标准流程

```
1. 运行检测SQL
   ↓
2. 导出结果（保存为CSV/截图）
   ↓
3. 人工审核（检查是否有误伤）
   ↓
4. 执行封禁SQL
   ├─ 封禁IP: UPDATE ip_registration_limits SET is_blocked = true
   ├─ 封禁用户: UPDATE users SET is_banned = true
   └─ 封禁域名: 修改代码中的 BLOCKED_EMAIL_DOMAINS
   ↓
5. 验证生效
   ├─ 查询封禁结果: SELECT * FROM ip_registration_limits WHERE is_blocked = true
   └─ 尝试注册测试
   ↓
6. 记录日志（可选）
   └─ 更新 docs/security/ban-list-YYYY-MM-DD.md
```

---

## 自动化建议

### 短期（手动执行）
1. 创建 SQL 文件 `scripts/fraud-detection.sql`，保存所有查询
2. 每周一固定时间执行（如周一上午10点）
3. 结果发送到管理员邮箱或Slack

### 中期（半自动）
1. 使用 Supabase Database Webhooks 监听注册事件
2. 定时任务（Cron）每日运行检测脚本
3. 异常时发送告警通知

### 长期（全自动）
1. 开发管理后台页面 `/admin/fraud-monitor`
2. 实时监控仪表板（注册趋势、异常IP、可疑域名）
3. 自动封禁 + 人工复核机制

---

## 快速检查清单

**每周必做（10分钟）**：
- [ ] 运行"高频IP检测"查询
- [ ] 运行"新一次性邮箱域名检测"查询
- [ ] 检查是否有≥20个账号的新域名
- [ ] 检查是否有≥10个账号的高频IP

**每月必做（20分钟）**：
- [ ] 运行"高生成零付费用户检测"
- [ ] 运行"异常国家注册激增检测"
- [ ] 运行"综合异常行为检测"
- [ ] 更新邮箱黑名单代码（如有新发现）

**发现异常时**：
- [ ] 保存查询结果截图/CSV
- [ ] 人工审核（避免误伤）
- [ ] 执行封禁SQL
- [ ] 验证生效
- [ ] 记录到文档

---

## 误封处理

如果收到用户申诉，认为被误封：

```sql
-- 1. 检查用户状态
SELECT uuid, email, signin_ip, is_banned, created_at
FROM users
WHERE email = 'user@example.com';

-- 2. 检查IP状态
SELECT ip_address, registration_count, is_blocked, first_registration
FROM ip_registration_limits
WHERE ip_address = 'xxx.xxx.xxx.xxx';

-- 3. 解除用户封禁
UPDATE users
SET is_banned = false
WHERE uuid = 'user-uuid';

-- 4. 解除IP封禁
UPDATE ip_registration_limits
SET is_blocked = false
WHERE ip_address = 'xxx.xxx.xxx.xxx';
```

---

## 总结

**核心原则**：
1. **定期执行**：每周检查，不要等到损失发生
2. **数据驱动**：基于明确指标，不凭感觉
3. **人工审核**：自动检测 + 人工确认，避免误伤
4. **快速响应**：发现高危情况立即封禁

**三个关键指标**：
- 高频IP：≥5个账号/7天
- 一次性邮箱：≥20个账号/7天
- 零付费高生成：≥10个视频但0付费

**两个防御维度**：
- 入口防御：IP限制 + 邮箱黑名单
- 行为防御：封禁薅羊毛用户账号

简单、直接、有效。数据不会说谎。
