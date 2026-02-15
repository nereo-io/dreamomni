# 订单续费系统重构 - 部署执行指南

> **状态**: 代码已完成，待部署
> **创建日期**: 2025-10-26
> **预计执行时间**: 30-60分钟

---

## 📋 部署前检查清单

- [ ] 确认有数据库访问权限（Supabase Dashboard）
- [ ] 确认当前系统运行正常
- [ ] 准备好监控工具（查看订单和 credits 表）
- [ ] 通知团队成员即将进行数据库迁移

---

## 🚀 部署步骤

### Step 1: 数据库迁移（在 Supabase Dashboard 执行）

#### 1.1 执行字段添加脚本

```bash
# 文件位置：supabase/migrations/20251026_add_renewal_fields.sql
```

**操作步骤**：
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `20251026_add_renewal_fields.sql` 内容
4. 点击 "Run" 执行
5. 查看输出，确认以下信息：
   - ✅ 备份完成提示
   - ✅ 字段添加成功提示
   - ✅ 索引创建结果

**预期输出**：
```
✅ 备份完成 - orders: XXX 条记录, backup: XXX 条记录
✅ 字段添加成功：is_renewal, payment_id
✅ Step 1 完成 - 字段和索引已添加
```

#### 1.2 执行历史数据迁移脚本

```bash
# 文件位置：supabase/migrations/20251026_migrate_renewal_history.sql
```

**操作步骤**：
1. 在 SQL Editor 中打开新标签
2. 复制 `20251026_migrate_renewal_history.sql` 内容
3. 点击 "Run" 执行
4. 查看输出统计信息

**预期输出**：
```
✅ 前置检查通过
✅ Step 1: 已标记现有订单为首次购买
✅ Step 2: 创建了 XX 条续费订单记录
✅ Step 3: 更新了 XX 条 credits 记录
====================================
📊 数据迁移统计
====================================
总订单数: XXX
首次购买: XXX
续费订单: XX
孤儿积分记录: 0 (应该为 0)
====================================
```

**⚠️ 如果孤儿积分记录 > 0**：
- 停止后续步骤
- 使用 verify_and_rollback.sql 中的回滚脚本
- 检查数据问题后重新执行

---

### Step 2: 验证数据迁移

```bash
# 文件位置：supabase/migrations/verify_and_rollback.sql
```

**操作步骤**：
1. 复制验证脚本（Part 1 部分）
2. 在 SQL Editor 执行
3. 检查所有验证结果

**关键验证点**：
- ✅ 字段存在检查
- ✅ 订单统计合理
- ✅ 无重复 payment_id
- ✅ 无孤儿 credits 记录

---

### Step 3: 部署代码到生产环境

#### 3.1 提交代码

```bash
# 查看改动的文件
git status

# 预期看到以下文件：
# modified:   types/order.d.ts
# modified:   app/api/creem/webhook/route.ts
# modified:   services/payment/PayssionProvider.ts
# new file:   supabase/migrations/20251026_add_renewal_fields.sql
# new file:   supabase/migrations/20251026_migrate_renewal_history.sql
# new file:   supabase/migrations/verify_and_rollback.sql

# 添加改动
git add types/order.d.ts
git add app/api/creem/webhook/route.ts
git add services/payment/PayssionProvider.ts
git add supabase/migrations/

# 提交
git commit -m "feat(orders): 支持续费订单独立追踪

- 添加 is_renewal 和 payment_id 字段
- Creem/Payssion 续费时自动创建新订单（RNW_ 前缀）
- 历史数据迁移：从 credits 表反推续费记录
- 双重幂等性保护（代码层 + 数据库层）

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送到远程
git push origin main
```

#### 3.2 等待 Vercel 自动部署

**监控步骤**：
1. 访问 Vercel Dashboard
2. 查看部署日志
3. 确认构建成功
4. 等待部署完成（通常 2-3 分钟）

---

### Step 4: 生产环境验证

#### 4.1 测试续费订单创建（使用现有订阅）

**如果有测试订阅**：
- 等待下一次续费触发
- 检查 orders 表是否生成新的 `RNW_` 订单

**或手动触发测试 webhook**（可选）：
```bash
# 使用 Creem/Payssion 提供的 webhook 测试工具
# 发送续费 webhook 到生产环境
```

#### 4.2 查询生产数据验证

```sql
-- 检查最近的续费订单
SELECT
  order_no,
  is_renewal,
  payment_id,
  amount / 100.0 as amount_usd,
  product_name,
  paid_at
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 检查续费统计
SELECT
  DATE(paid_at) as date,
  COUNT(*) FILTER (WHERE is_renewal = false) as first_purchase,
  COUNT(*) FILTER (WHERE is_renewal = true) as renewals
FROM orders
WHERE status = 'paid'
  AND paid_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(paid_at)
ORDER BY date DESC;
```

---

## ⚠️ 紧急回滚方案

**如果发现严重问题，立即回滚**：

### 回滚步骤

1. **停止新部署**（如果可能）

2. **执行数据库回滚**：
   ```sql
   -- 打开 verify_and_rollback.sql
   -- 取消注释 Part 2 中的回滚脚本
   -- 在 Supabase Dashboard 执行
   ```

3. **回退代码**：
   ```bash
   # 回退到上一个提交
   git revert HEAD
   git push origin main
   ```

4. **验证回滚成功**：
   ```sql
   SELECT COUNT(*) FROM orders WHERE order_no LIKE 'RNW_%';
   -- 应该返回 0
   ```

---

## 📊 部署后监控

### 监控指标（前3天）

1. **订单创建监控**
   - 续费时是否生成 RNW_ 订单
   - 日志中是否有 "续费订单创建成功" 提示

2. **幂等性检查**
   - webhook 重试时不会创建重复订单
   - 日志中有 "续费订单已存在" 提示

3. **Credits 发放正常**
   - 续费用户积分正常增加
   - credits 表的 order_no 指向正确的 RNW_ 订单

### 日志关键字

```bash
# 查看 Vercel 日志，搜索以下关键字：
"🔄 检测到续费支付，创建续费订单"
"✅ 续费订单创建成功"
"ℹ️ 续费订单已存在，跳过创建"
```

---

## ✅ 验收标准

- [ ] 数据库迁移无错误
- [ ] 所有验证脚本通过
- [ ] 代码成功部署到生产
- [ ] 续费订单能正常创建（RNW_ 前缀）
- [ ] credits 表数据完整
- [ ] 无重复订单
- [ ] 监控日志正常

---

## 📞 问题处理

### 常见问题

**Q1: 迁移脚本执行超时**
- A: 分批执行，限制 LIMIT 数量

**Q2: 发现重复 payment_id**
- A: 这是数据问题，需要人工检查并修复

**Q3: 续费订单未创建**
- A: 检查日志，确认是否识别为续费（existingSubscription 存在）

---

## 📝 部署记录

**执行人员**: ___________
**执行日期**: ___________
**数据库记录数**:
- 迁移前订单总数: ___________
- 迁移后订单总数: ___________
- 新增续费订单: ___________

**验证结果**: ⬜ 通过 / ⬜ 失败
**备注**: ___________

---

**部署指南结束**
