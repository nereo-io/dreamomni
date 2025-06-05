# 视频生成 IN_QUEUE 问题补偿 SOP

## 📋 概述

当视频生成服务出现故障，导致用户的视频长时间处于 `IN_QUEUE` 状态时，使用本 SOP 进行快速补偿处理。

一开始，需要老板告诉我需要查询 IN_QUEUE 问题的时间段。

## 🔍 第一步：调查 IN_QUEUE 问题

### 1.1 连接 Supabase

```bash
# 获取项目列表，找到 Veo3 项目
mcp_supabase_list_projects
```

### 1.2 查询受影响用户

```sql
-- 查询 IN_QUEUE 状态的视频生成记录及用户信息
SELECT
    vg.id,
    vg.user_id,
    vg.status,
    vg.created_at,
    vg.model_id,
    u.email,
    u.nickname
FROM video_generations vg
JOIN users u ON vg.user_id = u.uuid
WHERE vg.status = 'IN_QUEUE'
  AND vg.created_at >= CURRENT_DATE - INTERVAL '1 day'  -- 调整时间范围
  AND vg.created_at <= NOW()
ORDER BY vg.created_at DESC;
```

### 1.3 统计受影响用户数量

```sql
-- 统计总数
SELECT
    COUNT(*) as total_in_queue_videos,
    COUNT(DISTINCT vg.user_id) as unique_affected_users
FROM video_generations vg
WHERE vg.status = 'IN_QUEUE'
  AND vg.created_at >= CURRENT_DATE - INTERVAL '1 day'
  AND vg.created_at <= NOW();
```

## 💰 第二步：确定补偿方案

### 补偿标准

- **每位受影响用户**: 10 积分
- **补偿类型**: `system_compensation`
- **有效期**: 1 年

## ⚡ 第三步：执行补偿

### 执行 SQL 补偿

```sql
INSERT INTO credits (trans_no, created_at, user_uuid, trans_type, credits, order_no, expired_at)
SELECT
    'COMP-' || gen_random_uuid() as trans_no,
    NOW() as created_at,
    vg.user_id as user_uuid,
    'system_compensation' as trans_type,
    10 as credits,
    'IN_QUEUE_COMPENSATION' as order_no,
    NOW() + INTERVAL '1 year' as expired_at
FROM video_generations vg
WHERE vg.status = 'IN_QUEUE'
  AND vg.created_at >= CURRENT_DATE - INTERVAL '1 day'
  AND vg.created_at <= NOW()
GROUP BY vg.user_id;
```

## ✅ 第四步：验证补偿结果

### 4.1 检查补偿记录数量

```sql
SELECT
    COUNT(*) as compensation_records,
    SUM(credits) as total_credits_given
FROM credits
WHERE trans_type = 'system_compensation'
AND order_no = 'IN_QUEUE_COMPENSATION'
AND created_at >= NOW() - INTERVAL '5 minutes';
```

### 4.2 验证所有用户都收到补偿

```sql
SELECT
    vg.user_id,
    u.email,
    u.nickname,
    vg.created_at as video_created_at,
    c.trans_no as compensation_trans_no,
    c.credits as compensation_credits,
    CASE
        WHEN c.trans_no IS NOT NULL THEN 'Received'
        ELSE 'Not Received'
    END as compensation_status
FROM (
    SELECT DISTINCT user_id, MIN(created_at) as created_at
    FROM video_generations vg
    WHERE vg.status = 'IN_QUEUE'
      AND vg.created_at >= CURRENT_DATE - INTERVAL '1 day'
      AND vg.created_at <= NOW()
    GROUP BY user_id
) vg
JOIN users u ON vg.user_id = u.uuid
LEFT JOIN credits c ON vg.user_id = c.user_uuid
    AND c.trans_type = 'system_compensation'
    AND c.order_no = 'IN_QUEUE_COMPENSATION'
    AND c.created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY compensation_status DESC, vg.created_at DESC;
```

## 📋 操作清单

执行前确认：

- [ ] 确定问题时间范围
- [ ] 统计受影响用户数量
- [ ] 确认补偿金额（10 积分/用户）

执行后验证：

- [ ] 补偿记录数量 = 受影响用户数量
- [ ] 所有用户状态都是 "Received"
- [ ] 总补偿积分 = 用户数量 × 10

## ⚠️ 注意事项

1. **避免重复补偿**: 检查 `order_no` 确保同一问题不重复补偿
2. **时间范围**: 根据实际故障时间调整查询条件
3. **数据备份**: 大量操作前建议先备份 `credits` 表

---

**最后更新**: 2025-06-05  
**版本**: v2.0 (简化版)
