# Payssion 多订阅清理包

本文件夹用于处理 **Payssion 多订阅用户** 的清理与会员时间修正。

## 包含内容
- `Supabase Multi-Subscription Leaderboard (3).csv`：多订阅用户清单（每用户仅保留最高金额订阅）。
- `cleanup-payssion-multi-subscriptions.ts`：清理脚本。
- `README.md`：使用说明。

## 逻辑说明
### 1) 保留订阅 + 取消其他订阅
- **保留“最高价格订阅”**：CSV 来自多订阅视图（已按金额排序并取每用户最高金额订阅），因此以 CSV 中的 `subscription_id` 作为每个用户**保留的订阅**。
- 查询 `subscriptions` 表中该用户的全部记录。
- 对非终态订阅（`active / pending / past_due`）且 **不是保留订阅** 的记录：
  - 调用 Payssion API 取消订阅（`cancelSubscription`），并在本地更新状态为 `canceled`。

> 终态订阅（`canceled / expired`）会跳过，不再重复取消。

### 2) 会员时间更新逻辑
- 使用与 Payssion webhook 成功回调一致的逻辑：
  - 直接调用 `createOrUpdateMembership(userUuid, planType)`。
  - `planType` 取保留订阅的 `plan_type`（`yearly` / `monthly`），若为空则回退到 CSV 的 `plan_type`。
- 该逻辑会 **延长或更新** 当前会员结束时间（如果已有未过期会员）。

## 使用方式
在 `veo3-main/` 目录执行：

### 1) Dry-run（推荐先跑小批量）
```bash
pnpm tsx docs/payssion-multi-subscription-cleanup/cleanup-payssion-multi-subscriptions.ts --dry-run --limit=5
```

### 2) 指定单个用户核验
```bash
pnpm tsx docs/payssion-multi-subscription-cleanup/cleanup-payssion-multi-subscriptions.ts --dry-run --only-user=USER_UUID_OR_EMAIL
```

### 3) 小批量真实执行
```bash
pnpm tsx docs/payssion-multi-subscription-cleanup/cleanup-payssion-multi-subscriptions.ts --apply --limit=5 --sleep-ms=500
```

### 4) 全量执行
```bash
pnpm tsx docs/payssion-multi-subscription-cleanup/cleanup-payssion-multi-subscriptions.ts --apply
```

## 参数说明
- `--apply`：执行真实操作（取消订阅 + 更新会员）
- `--dry-run`：只打印日志，不改数据（默认）
- `--skip-cancel`：不取消订阅，仅更新会员
- `--skip-membership`：不更新会员，仅取消订阅
- `--only-user=...`：只处理某个用户（uuid 或 email）
- `--limit=N`：限制处理用户数
- `--sleep-ms=200`：每次取消之间的间隔

## 依赖的环境变量
- Supabase（必需）：
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Payssion（仅在 `--apply` + 未 `--skip-cancel` 时需要）：
  - `PAYSSION_V2_API_KEY`
  - `PAYSSION_V2_SECRET_KEY`
  - `PAYSSION_V2_BASE_URL`

## 推荐执行流程（多检查）
1. `--dry-run --limit=5` 检查日志与统计。
2. `--dry-run --only-user=...` 核验具体用户。
3. `--apply --limit=5` 小批量执行。
4. 全量执行。
5. 执行后用 SQL 复核：

```sql
select user_uuid, count(*) as active_subs
from subscriptions
where status in ('active','pending','past_due')
group by user_uuid
having count(*) > 1
order by active_subs desc;
```
