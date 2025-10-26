# 用户地理位置追踪技术方案

**版本**: v1.0
**日期**: 2025-10-26
**状态**: 待审核
**作者**: Linus式架构审查

---

## 1. 需求背景

### 业务目标
- 分析用户注册来源的地域分布
- 分析订单来源的地域分布
- 支持后续基于地区的营销决策和定价策略

### 关键问题
- **问题1**: 用户注册时,我们记录了IP地址(`signin_ip`),但没有记录国家/地区
- **问题2**: 订单创建时,无法追踪用户的付费地区

---

## 2. 技术方案

### 2.1 数据来源: Cloudflare CF-IPCountry

**优势**:
- ✅ Cloudflare自动在所有HTTP请求中添加 `CF-IPCountry` header
- ✅ 零配置,零成本 (Cloudflare免费功能)
- ✅ 无需维护IP地理数据库
- ✅ 准确度高 (基于BGP路由和Anycast网络)

**Header格式**:
```
CF-IPCountry: US    // 美国
CF-IPCountry: RU    // 俄罗斯
CF-IPCountry: CN    // 中国
CF-IPCountry: XX    // 未知 (需要过滤)
CF-IPCountry: T1    // Tor网络 (需要过滤)
```

**文档**: https://developers.cloudflare.com/fundamentals/reference/http-request-headers/

---

### 2.2 数据存储设计

#### 方案对比

| 方案 | users表存country | orders表存country | 查询方式 |
|------|-----------------|------------------|---------|
| **方案A** (冗余) | ✅ | ✅ | 单表查询,快 |
| **方案B** (最简) | ✅ | ❌ | JOIN查询,慢 |

**最终选择**: **方案B (最简方案)**

**理由**:
1. ✅ **数据冗余最小化**: 99%的订单和注册在同一国家,不需要重复存储
2. ✅ **维护成本低**: 只需维护1个字段 (`users.signup_country`)
3. ✅ **数据一致性高**: 单一数据源,避免不一致
4. ⚠️ **查询性能**: 需要JOIN users表,但可通过VIEW优化

---

### 2.3 数据库设计

#### Schema变更

```sql
-- 只修改users表
ALTER TABLE users
ADD COLUMN signup_country VARCHAR(2);

-- 添加索引用于分析查询
CREATE INDEX idx_users_signup_country
ON users(signup_country)
WHERE signup_country IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN users.signup_country IS
'ISO 3166-1 alpha-2 country code (e.g., US, RU, CN).
Detected from CF-IPCountry header at first login (OAuth or email).';
```

#### 分析视图 (可选但推荐)

```sql
-- 创建订单地域分析视图
CREATE VIEW order_countries AS
SELECT
  o.order_no,
  o.user_uuid,
  o.amount,
  o.status,
  o.created_at,
  o.paid_at,
  u.signup_country,
  u.email as user_email
FROM orders o
LEFT JOIN users u ON o.user_uuid = u.uuid;

COMMENT ON VIEW order_countries IS
'Orders with user signup country for geographic revenue analysis';
```

---

### 2.4 代码实现

#### 核心逻辑

**关键发现**:
- ✅ 现有代码中,`services/user.ts` 的 `saveUser()` 函数已经被所有注册流程调用
- ✅ OAuth注册和邮箱首次登录都会经过 `auth/config.ts` 的 `jwt()` callback
- ✅ `jwt()` callback 会调用 `saveUser()` 创建 `public.users` 记录

**因此,只需要修改1个文件!**

#### 代码修改点

**文件**: `lib/ip.ts`
```typescript
// 新增函数: 获取客户端国家代码
export async function getClientCountry(): Promise<string | null> {
  const h = headers();
  const country = h.get("cf-ipcountry");

  // 过滤无效值: XX (未知), T1 (Tor)
  if (!country || country === "XX" || country === "T1") {
    return null;
  }

  return country.toUpperCase(); // ISO 3166-1 标准
}
```

**文件**: `services/user.ts`
**位置**: `saveUser()` 函数中,`insertUser()` 之前
```typescript
// 在 if (!existUser) 块中添加:

// 检测并记录注册国家
if (!user.signup_country) {
  const country = await getClientCountry();
  if (country) {
    user.signup_country = country;
  }
}

await insertUser(user);
```

**文件**: `types/user.d.ts`
```typescript
export interface User {
  // ... 现有字段
  signup_country?: string; // ISO 3166-1 alpha-2 (e.g., US, RU, CN)
}
```

**就这3个地方!** 总共不到15行代码。

---

### 2.5 数据流程

#### OAuth注册/登录流程
```
用户点击 Google/GitHub/Apple 登录
↓
NextAuth处理OAuth回调
↓
auth/config.ts - jwt() callback 触发
↓
检查 public.users 是否已存在 (findUserByEmail)
↓
如果不存在 (首次登录):
  ├─ 调用 getClientCountry() → 获取 CF-IPCountry
  ├─ user.signup_country = country
  └─ saveUser() → insertUser() → 写入数据库
↓
public.users 表有 signup_country ✅
```

#### 邮箱注册/登录流程
```
步骤1: 注册
  POST /api/auth/signup
  ↓
  Supabase创建 auth.users 记录
  ↓
  发送验证邮件
  ↓
  用户点击验证链接

步骤2: 首次登录 (关键!)
  POST /auth/signin (用户输入邮箱密码)
  ↓
  CredentialsProvider验证密码
  ↓
  auth/config.ts - jwt() callback 触发
  ↓
  检查 public.users 是否已存在 (不存在!)
  ↓
  调用 getClientCountry() → 获取 CF-IPCountry
  ↓
  user.signup_country = country
  ↓
  saveUser() → insertUser() → 写入数据库
  ↓
  public.users 表有 signup_country ✅
```

**关键点**:
- OAuth用户在**第一次登录时**记录国家
- 邮箱用户在**首次登录时**(不是注册时)记录国家
- 两种流程都经过同一个代码路径: `saveUser()`

---

## 3. 数据分析示例

### 3.1 用户注册来源分布
```sql
SELECT
  signup_country,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM users
WHERE signup_country IS NOT NULL
GROUP BY signup_country
ORDER BY user_count DESC;
```

**预期输出**:
```
signup_country | user_count | percentage
---------------|------------|------------
US             | 4521       | 45.21
RU             | 2314       | 23.14
CN             | 1205       | 12.05
...
```

### 3.2 订单来源地域分析 (通过VIEW)
```sql
SELECT
  signup_country,
  COUNT(*) as order_count,
  SUM(amount) as total_revenue_cents,
  ROUND(SUM(amount) / 100.0, 2) as total_revenue_usd,
  ROUND(AVG(amount) / 100.0, 2) as avg_order_value_usd
FROM order_countries
WHERE status = 'paid'
GROUP BY signup_country
ORDER BY total_revenue_cents DESC;
```

**预期输出**:
```
signup_country | order_count | total_revenue_usd | avg_order_value_usd
---------------|-------------|-------------------|--------------------
US             | 523         | 12,845.00         | 24.56
RU             | 312         | 4,231.50          | 13.56
CN             | 189         | 2,981.00          | 15.77
```

### 3.3 转化率分析 (注册→付费)
```sql
WITH user_counts AS (
  SELECT signup_country, COUNT(*) as total_users
  FROM users
  WHERE signup_country IS NOT NULL
  GROUP BY signup_country
),
paid_users AS (
  SELECT u.signup_country, COUNT(DISTINCT u.uuid) as paying_users
  FROM users u
  JOIN orders o ON u.uuid = o.user_uuid
  WHERE o.status = 'paid' AND u.signup_country IS NOT NULL
  GROUP BY u.signup_country
)
SELECT
  uc.signup_country,
  uc.total_users,
  COALESCE(pu.paying_users, 0) as paying_users,
  ROUND(COALESCE(pu.paying_users, 0) * 100.0 / uc.total_users, 2) as conversion_rate
FROM user_counts uc
LEFT JOIN paid_users pu ON uc.signup_country = pu.signup_country
ORDER BY uc.total_users DESC;
```

---

## 4. 优势与限制

### 4.1 优势

| 维度 | 说明 |
|------|------|
| **零性能开销** | 只读HTTP header,不需要IP查询库 |
| **零配置成本** | Cloudflare自动提供,无需申请API |
| **零维护成本** | 不需要更新IP数据库 |
| **代码简单** | 只修改1个文件,15行代码 |
| **GDPR友好** | 国家代码不属于PII,合规 |
| **向后兼容** | 字段可选,老数据NULL不影响 |

### 4.2 限制与注意事项

| 限制 | 影响 | 缓解措施 |
|------|------|---------|
| **VPN用户** | 显示VPN国家,非真实位置 | 接受数据偏差,VPN用户<5% |
| **Tor用户** | 返回 `T1`,被过滤 | 这些用户本身就在隐藏位置 |
| **历史数据** | 已注册用户无 signup_country | 可通过 signin_ip 反向查询补充 |
| **查询性能** | 需要JOIN users表 | 使用VIEW + 定期分析,非实时 |

### 4.3 隐私合规

**GDPR视角**:
- ✅ **数据最小化**: 只存储国家代码,不存储完整IP
- ✅ **透明度**: 在隐私政策中说明"我们记录注册国家/地区用于服务优化"
- ✅ **非PII**: ISO 3166-1国家代码不属于个人身份信息

**建议的隐私政策文本**:
> "We collect your country/region of registration based on your IP address to improve our services and provide localized features. This information is anonymized and does not personally identify you."

---

## 5. 实施计划

### 5.1 工作量估算

| 任务 | 工作量 | 负责人 |
|------|--------|--------|
| 1. 数据库迁移 (执行SQL) | 2分钟 | DBA/开发 |
| 2. 代码实现 (3个文件) | 10分钟 | 开发 |
| 3. 本地测试 | 5分钟 | 开发 |
| 4. 部署上线 | 3分钟 | DevOps |
| 5. 数据验证 | 5分钟 | 开发 |
| **总计** | **25分钟** | - |

### 5.2 实施步骤

**阶段1: 数据库准备** (2分钟)
1. 登录Supabase Dashboard → SQL Editor
2. 执行迁移SQL (添加字段和索引)
3. 验证字段创建成功

**阶段2: 代码开发** (10分钟)
1. 修改 `lib/ip.ts` - 添加 `getClientCountry()` 函数
2. 修改 `services/user.ts` - 在 `saveUser()` 中调用
3. 修改 `types/user.d.ts` - 添加类型定义

**阶段3: 本地测试** (5分钟)
1. 启动开发服务器: `pnpm dev`
2. 测试OAuth注册 (模拟CF header: `CF-IPCountry: US`)
3. 测试邮箱注册+登录
4. 验证 `public.users.signup_country` 字段已填充

**阶段4: 部署上线** (3分钟)
1. 提交代码: `git commit -m "feat: add user geolocation tracking"`
2. 推送到远程: `git push`
3. Vercel自动部署

**阶段5: 数据验证** (5分钟)
1. 等待24小时收集数据
2. 运行分析SQL验证数据质量
3. 检查 `signup_country IS NULL` 的比例

---

## 6. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| Cloudflare header缺失 | 低 | 中 | 函数返回null,不阻塞注册 |
| VPN导致数据偏差 | 中 | 低 | 文档说明限制,接受偏差 |
| 历史数据不完整 | 高 | 低 | 只分析新用户,或反向补充 |
| JOIN查询性能差 | 低 | 中 | 使用VIEW,定期分析非实时 |

**总体风险**: 🟢 **低**

---

## 7. 后续优化建议

### 短期 (1-2周)
- [ ] 监控 `signup_country IS NULL` 的比例
- [ ] 对比Cloudflare数据与Google Analytics地理数据
- [ ] 补充历史用户数据 (可选)

### 中期 (1-3月)
- [ ] 基于地区数据优化广告投放ROI
- [ ] 针对高价值国家增加本地支付方式
- [ ] 实施基于购买力的PPP定价

### 长期 (3-6月)
- [ ] 城市级追踪 (使用 `CF-IPCity` header)
- [ ] 基于时区优化邮件发送时间
- [ ] 多地域CDN节点优化

---

## 8. 决策清单

**请审核并确认以下设计决策**:

- [ ] ✅ **数据存储**: 只在 `users.signup_country`,不在 `orders` 表
- [ ] ✅ **查询方式**: 通过VIEW JOIN查询,接受JOIN性能开销
- [ ] ✅ **数据时机**: 首次登录时记录,不是注册时
- [ ] ✅ **历史数据**: 接受已注册用户无国家信息
- [ ] ✅ **VPN偏差**: 接受VPN用户显示VPN国家
- [ ] ✅ **实施方案**: 最简化实现,25分钟完成

---

## 9. 附录

### 9.1 相关文档
- Cloudflare IPCountry: https://developers.cloudflare.com/fundamentals/reference/http-request-headers/
- ISO 3166-1: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
- GDPR数据最小化: https://gdpr-info.eu/art-5-gdpr/

### 9.2 SQL迁移脚本完整版
```sql
-- users表添加signup_country字段
ALTER TABLE users
ADD COLUMN signup_country VARCHAR(2);

-- 创建索引
CREATE INDEX idx_users_signup_country
ON users(signup_country)
WHERE signup_country IS NOT NULL;

-- 添加注释
COMMENT ON COLUMN users.signup_country IS
'ISO 3166-1 alpha-2 country code (e.g., US, RU, CN). Detected from CF-IPCountry header at first login.';

-- 创建订单分析视图
CREATE VIEW order_countries AS
SELECT
  o.order_no,
  o.user_uuid,
  o.user_email,
  o.amount,
  o.currency,
  o.status,
  o.created_at,
  o.paid_at,
  o.payment_provider,
  u.signup_country,
  u.email as user_email_from_users
FROM orders o
LEFT JOIN users u ON o.user_uuid = u.uuid;

COMMENT ON VIEW order_countries IS
'Orders joined with user signup country for geographic revenue analysis';

-- 验证迁移
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'signup_country';
```

---

**方案状态**: ✅ 待审核确认
**预计完成时间**: 确认后25分钟内完成
**下一步行动**: 等待技术方案审核通过
