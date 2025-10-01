# 视频删除功能需求文档

## 1. 背景与目标

### 1.1 背景
当前系统支持用户生成视频，但缺少视频删除功能。用户反馈无法清理自己的视频历史记录，导致历史列表过长且无法管理。图片生成功能已经实现了完善的软删除机制，视频功能需要补齐这一能力。

### 1.2 目标
- 允许用户删除自己生成的视频记录
- 与现有的图片删除功能保持一致的用户体验
- 采用软删除机制，保留数据用于审计
- 不退还已消耗的积分

## 2. 功能需求

### 2.1 核心功能

#### FR-1: 视频软删除
**描述**: 用户可以标记删除自己的视频生成记录

**详细说明**:
- 删除操作不会物理删除数据库记录
- 通过设置 `is_delete = true` 字段标记为已删除
- 已删除的视频不会在用户历史列表中显示
- 已删除的视频不计入用户统计数据

**前置条件**:
- 用户已登录
- 用户拥有该视频的所有权

**后置条件**:
- 视频在历史列表中消失
- 数据库记录保留但标记为已删除
- 积分不退还

#### FR-2: 删除确认对话框
**描述**: 删除前必须显示确认对话框，防止误删

**详细说明**:
- 点击删除按钮后弹出确认对话框
- 对话框样式和文案与图片删除保持一致
- 提供"取消"和"删除"两个操作按钮
- 删除按钮使用 destructive 样式（红色）

**确认对话框内容**:
- 标题: "Delete Confirmation" (屏幕阅读器可见)
- 描述: "Are you sure you want to delete this video?"
- 取消按钮: "Cancel"
- 确认按钮: "Delete" / "Deleting..." (删除中状态)

#### FR-3: 删除按钮集成
**描述**: 在视频详情卡片中添加删除按钮

**详细说明**:
- 删除按钮位置: 与 Edit、Regenerate 按钮并列显示
- 图标: Trash2 (lucide-react)
- 样式: 与现有图片删除按钮保持一致
- 按钮文本: "Delete" (支持国际化)

**显示条件**:
- 仅对视频所有者显示
- 示例视频不显示删除按钮
- 删除中状态按钮禁用

#### FR-4: 删除状态反馈
**描述**: 提供清晰的操作状态反馈

**详细说明**:
- 删除中: 按钮显示 "Deleting..." 并禁用
- 删除成功: 显示 toast 提示 "Video deleted successfully"
- 删除失败: 显示 toast 提示 "Failed to delete video"
- 删除成功后视频从列表中移除（客户端直接移除，无需刷新）

### 2.2 权限控制

#### FR-5: 用户权限验证
**描述**: 确保只有视频所有者可以删除

**验证点**:
1. API层验证: 检查请求用户的 UUID 是否与视频记录的 user_id 匹配
2. 数据库层验证: 通过 RLS (Row Level Security) 策略强制执行
3. UI层控制: 非所有者不显示删除按钮

**错误处理**:
- 未登录用户: 返回 401 Unauthorized
- 非所有者: 返回 404 Not Found (不暴露视频存在性)
- 视频不存在: 返回 404 Not Found

### 2.3 数据一致性

#### FR-6: 历史列表过滤
**描述**: 自动过滤已删除的视频

**实现点**:
- `getUserVideoGenerations()` 查询时自动添加 `is_delete = false` 过滤
- 统计数据排除已删除视频
- 分页计数排除已删除视频

#### FR-7: 积分不退还
**描述**: 删除视频不退还已消耗的积分

**理由**:
- 视频已经生成完成，AI算力已消耗
- 与图片删除策略保持一致
- 防止滥用（生成后立即删除以回收积分）

**记录保留**:
- `credits` 表的消费记录保持不变
- `video_generations` 表的 `credits_used` 字段保留
- 用于财务审计和数据分析

## 3. 非功能需求

### 3.1 性能要求
- 删除操作响应时间 < 500ms
- 列表查询添加 `is_delete` 索引，保持查询性能
- 客户端删除后直接移除DOM，无需重新请求列表

### 3.2 可用性要求
- UI交互与图片删除完全一致
- 删除确认对话框必须清晰易懂
- 操作反馈及时（loading状态、toast提示）
- 支持国际化（英语、俄语）

### 3.3 兼容性要求
- 向后兼容：现有视频记录默认 `is_delete = false`
- API响应格式保持标准化（使用 `respData/respErr`）
- 不影响现有视频生成流程

### 3.4 安全要求
- 必须验证用户身份（session）
- 必须验证视频所有权
- 防止SQL注入（使用参数化查询）
- UUID格式验证（正则表达式）

## 4. 界面设计要求

### 4.1 删除按钮样式
```typescript
<Button
  variant="secondary"
  size="sm"
  className="bg-gray-700/60 hover:bg-gray-600/80 text-white border-gray-600/50 hover:border-gray-500 px-4"
>
  <Trash2 className="h-4 w-4 mr-2" />
  Delete
</Button>
```

### 4.2 确认对话框样式
- 复用 `DeleteConfirmDialog.tsx` 组件
- 宽度: `sm:max-w-[400px]`
- 按钮布局: 居中对齐
- 删除按钮颜色: `bg-destructive`

### 4.3 交互流程
```
1. 用户点击删除按钮
   ↓
2. 弹出确认对话框
   ↓ (用户选择)
   ├─ 取消 → 关闭对话框
   └─ 确认 →
      ↓
3. 按钮显示 "Deleting..."（禁用状态）
   ↓
4. 调用 DELETE API
   ↓ (响应结果)
   ├─ 成功 →
   │    ├─ 显示成功 toast
   │    └─ 从列表移除视频
   └─ 失败 →
        └─ 显示失败 toast
```

## 5. 数据模型

### 5.1 数据库变更
```sql
-- 添加软删除字段
ALTER TABLE video_generations
ADD COLUMN is_delete BOOLEAN DEFAULT false;

-- 添加索引优化查询
CREATE INDEX idx_video_generations_is_delete
ON video_generations(user_id, is_delete, created_at DESC);
```

### 5.2 类型定义更新
```typescript
// types/video.d.ts
export interface VideoGeneration {
  // ... existing fields
  is_delete?: boolean; // 新增字段
}

export interface CreateVideoGenerationParams {
  // ... existing fields
  is_delete?: boolean; // 可选参数
}
```

## 6. API规范

### 6.1 删除视频端点
**端点**: `DELETE /api/video-generations/[id]`

**请求头**:
```
Content-Type: application/json
Authorization: (NextAuth session cookie)
```

**请求体**:
```json
{
  "videoId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**成功响应** (200):
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "success": true,
    "videoId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Video deleted successfully"
  }
}
```

**失败响应** (401):
```json
{
  "code": -1,
  "message": "Unauthorized"
}
```

**失败响应** (404):
```json
{
  "code": -1,
  "message": "Failed to delete video. Please check if: 1) Video exists 2) You own this video 3) Database has is_delete field"
}
```

## 7. 国际化文案

### 7.1 英语 (en.json)
```json
{
  "videoHistory": {
    "videoDeleted": "Video deleted successfully",
    "deleteFailed": "Failed to delete video",
    "deleteVideo": "Delete video",
    "deleteConfirmDescription": "Are you sure you want to delete this video?"
  }
}
```

### 7.2 俄语 (ru.json)
```json
{
  "videoHistory": {
    "videoDeleted": "Видео успешно удалено",
    "deleteFailed": "Не удалось удалить видео",
    "deleteVideo": "Удалить видео",
    "deleteConfirmDescription": "Вы уверены, что хотите удалить это видео?"
  }
}
```

## 8. 验收标准

### 8.1 功能验收
- [ ] 用户可以成功删除自己的视频
- [ ] 删除前显示确认对话框
- [ ] 删除后视频从列表中消失
- [ ] 删除失败时显示错误提示
- [ ] 非所有者无法删除他人视频
- [ ] 已删除视频不计入统计数据

### 8.2 性能验收
- [ ] 删除操作响应时间 < 500ms
- [ ] 列表查询性能无明显下降
- [ ] 客户端删除无需重新加载列表

### 8.3 兼容性验收
- [ ] 现有视频记录可正常显示
- [ ] 数据库迁移不影响现有功能
- [ ] API向后兼容

### 8.4 UI验收
- [ ] 删除按钮样式与图片删除一致
- [ ] 确认对话框样式与图片删除一致
- [ ] 删除中状态显示正确
- [ ] Toast提示文案正确

## 9. 风险与依赖

### 9.1 技术风险
- **数据库迁移风险**: 生产环境需要谨慎执行ALTER TABLE操作
  - 缓解措施: 先在测试环境验证，选择低峰期执行

- **索引性能影响**: 新增索引可能影响写入性能
  - 缓解措施: 使用CONCURRENTLY创建索引（PostgreSQL）

### 9.2 业务风险
- **误删风险**: 用户可能误删重要视频
  - 缓解措施: 必须显示确认对话框

- **数据恢复需求**: 用户可能要求恢复已删除视频
  - 缓解措施: 软删除机制保留数据，管理员可手动恢复

### 9.3 依赖项
- NextAuth session 身份验证
- Supabase RLS 策略
- lucide-react 图标库
- sonner toast 组件
- next-intl 国际化

## 10. 后续优化方向

### 10.1 批量删除
- 允许选择多个视频批量删除
- 添加"全选"功能
- 降低用户操作成本

### 10.2 回收站功能
- 已删除视频保留30天
- 用户可在回收站恢复视频
- 30天后自动物理删除

### 10.3 数据清理策略
- 定期物理删除超过90天的软删除记录
- 释放数据库存储空间
- 提升查询性能

## 11. 参考资料

- 图片删除实现: `components/blocks/image-history-for-generation/`
- 图片删除API: `app/api/image-generations/delete/route.ts`
- 图片Model: `models/imageGeneration.ts:346-459`
- 删除确认对话框: `components/blocks/image-history-for-generation/components/DeleteConfirmDialog.tsx`
