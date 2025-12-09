# 图片来源追踪功能 - 测试指南

## 修复完成状态

✅ **所有链路已修复并验证**

## 数据流链路

```
用户从 My Creations 选择图片
    ↓
ImageSelectionModal 传递 SelectedImage[] ({id, url})
    ↓
上传组件 (Multi/Single/Grid) 接收并保存
    ↓
组件调用 onImagesChange(urls, sourceIds)
    ↓
VideoGenerator 的 handleImagesChange 保存到状态
    ↓
buildGenerationParams 包含 source_image_ids
    ↓
API 接收并保存到数据库
```

## 已修复的组件

### 1. 前端组件层
- ✅ `ImageSelectionModal.tsx` - 传递 `{ id, url }` 对象
- ✅ `useImageUpload.ts` - Hook 支持 sourceImageIds
- ✅ `MultiImageUploader.tsx` - 调用 addUrls 时传递 IDs
- ✅ `SingleImageUploader.tsx` - 调用 addUrls 时传递 IDs
- ✅ `ImageGridUploader.tsx` - **新修复**，完整支持来源 ID 追踪

### 2. 页面层
- ✅ `video-generator/index.tsx` - 添加 sourceImageIds 状态
- ✅ `handleImagesChange` - 接收第二个参数 sourceIds
- ✅ `buildGenerationParams` - 包含 source_image_ids 字段
- ✅ `VideoGenerationParams` 接口 - 添加 source_image_ids 字段

### 3. 后端 API
- ✅ `app/api/video-generation/submit/route.ts` - 接收并保存
- ✅ `app/api/image-generation/submit/route.ts` - 接收并保存

### 4. 数据库
- ✅ Supabase 迁移已执行
- ✅ 字段和索引验证通过

## 测试步骤

### 准备工作
```bash
# 确保服务运行
cd veo3-main
pnpm dev  # 启动在 localhost:3000
```

### 测试场景 1：MultiImageUploader（双帧/三帧模型）

1. **生成原始图片**
   - 访问 Image Generator
   - 生成 2-3 张图片
   - 记录生成的图片 ID（可从浏览器 DevTools Network 查看响应）

2. **使用 My Creations 选择**
   - 访问 Video Generator（选择双帧或三帧模型）
   - 点击上传区域的 "My Creations" 按钮
   - 选择刚才生成的图片
   - 点击 "Add" 确认

3. **提交视频生成**
   - 填写 prompt
   - 点击 "Generate Video"

4. **验证数据库**
   ```sql
   -- 查询最新的视频生成记录
   SELECT
     id,
     prompt,
     image_urls,
     source_image_ids,
     created_at
   FROM video_generations
   ORDER BY created_at DESC
   LIMIT 1;

   -- 应该看到 source_image_ids 包含选择的图片 ID
   -- 例如: ["uuid-1", "uuid-2"]
   ```

### 测试场景 2：SingleImageUploader（单帧模型）

1. 访问 Video Generator（选择单帧模型，如 Veo3）
2. 点击上传区域的 "select from My Creations"
3. 选择 1 张图片
4. 提交生成
5. 验证数据库：
   ```sql
   SELECT id, source_image_ids
   FROM video_generations
   ORDER BY created_at DESC
   LIMIT 1;

   -- 应该看到: ["uuid"]
   ```

### 测试场景 3：ImageGridUploader（Reference-to-Video）

1. 访问 Video Generator（选择 Reference-to-Video 模型）
2. 点击 "select from My Creations"
3. 选择最多 3 张图片
4. 提交生成
5. 验证数据库：
   ```sql
   SELECT id, source_image_ids
   FROM video_generations
   ORDER BY created_at DESC
   LIMIT 1;

   -- 应该看到: ["uuid-1", "uuid-2", "uuid-3"]
   ```

### 测试场景 4：混合上传（上传 + My Creations）

1. 先上传 1 张本地图片
2. 再从 My Creations 选择 1 张图片
3. 提交生成
4. 验证数据库：
   ```sql
   SELECT id, image_urls, source_image_ids
   FROM video_generations
   ORDER BY created_at DESC
   LIMIT 1;

   -- image_urls 应该有 2 个 URL
   -- source_image_ids 应该只有 1 个 ID（My Creations 的那张）
   -- 例如: image_urls = ["url1", "url2"]
   --      source_image_ids = ["uuid2"]  <- 只有第二张有来源ID
   ```

## 验证检查清单

### ✅ 前端验证
- [ ] ImageSelectionModal 打开后能加载图片列表
- [ ] 选择图片后显示勾选标记
- [ ] 点击 "Add" 后图片正确添加到上传区域
- [ ] 浏览器控制台无报错
- [ ] Plausible 事件正确发送（检查 Network 面板）

### ✅ 网络请求验证
打开浏览器 DevTools > Network，提交生成时检查：

```json
// POST /api/video-generation/submit
// Request Payload 应包含:
{
  "model": "...",
  "prompt": "...",
  "image_urls": ["url1", "url2"],
  "source_image_ids": ["uuid1", "uuid2"]  // ← 关键！
}
```

### ✅ 数据库验证

```sql
-- 1. 检查字段是否存在
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'video_generations'
  AND column_name = 'source_image_ids';

-- 2. 检查最近的记录
SELECT
  id,
  prompt,
  source_image_ids,
  jsonb_array_length(source_image_ids) as source_count,
  created_at
FROM video_generations
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 3. 统计使用率
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE jsonb_array_length(source_image_ids) > 0) as with_sources,
  ROUND(100.0 * COUNT(*) FILTER (WHERE jsonb_array_length(source_image_ids) > 0) / COUNT(*), 2) as pct
FROM video_generations
WHERE created_at > NOW() - INTERVAL '1 day';
```

## 常见问题排查

### 问题 1：source_image_ids 为空数组
**可能原因**：
- 用户上传了本地图片（正常行为，本地上传没有来源 ID）
- 前端未正确传递数据

**排查**：
```javascript
// 在浏览器控制台查看提交的数据
// 在 buildGenerationParams 函数中添加 console.log
console.log('sourceImageIds:', sourceImageIds);
```

### 问题 2：TypeScript 类型错误
**解决方案**：
- 确保所有 `onImagesChange` 签名都是 `(urls: string[], sourceIds?: string[]) => void`
- 运行 `pnpm build` 验证无类型错误

### 问题 3：Plausible 事件未发送
**检查**：
```javascript
// 浏览器控制台执行
console.log(window.plausible);  // 应该是一个函数
```

## 性能监控

### 查询示例

```sql
-- 每小时使用率
SELECT
  date_trunc('hour', created_at) as hour,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE jsonb_array_length(source_image_ids) > 0) as with_sources
FROM video_generations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- 最受欢迎的原始图片
SELECT
  source_id,
  COUNT(*) as reuse_count,
  ig.prompt as original_prompt
FROM (
  SELECT jsonb_array_elements_text(source_image_ids) as source_id
  FROM video_generations
  WHERE created_at > NOW() - INTERVAL '7 days'
) sources
LEFT JOIN image_generations ig ON ig.id::text = sources.source_id
GROUP BY source_id, ig.prompt
ORDER BY reuse_count DESC
LIMIT 10;
```

## 回滚方案

如果发现问题需要回滚：

```sql
-- 清空已有数据（可选）
UPDATE video_generations
SET source_image_ids = '[]'::jsonb
WHERE jsonb_array_length(source_image_ids) > 0;

-- 删除字段和索引
DROP INDEX IF EXISTS idx_video_gen_source_images;
DROP INDEX IF EXISTS idx_image_gen_source_images;
ALTER TABLE video_generations DROP COLUMN IF EXISTS source_image_ids;
ALTER TABLE image_generations DROP COLUMN IF EXISTS source_image_ids;
```

代码回滚：
```bash
git log --oneline  # 找到修复前的 commit
git revert <commit-hash>
```

## 成功标准

✅ 功能正常工作的标志：
1. 从 My Creations 选择图片后，数据库 `source_image_ids` 字段不为空
2. 上传本地图片时，`source_image_ids` 为空数组（预期行为）
3. 混合上传时，只有 My Creations 的图片有 ID
4. 无 TypeScript 编译错误
5. 无浏览器控制台错误
6. Plausible 事件正常发送

---

**测试时间**: 预计 15-20 分钟
**测试人员**: 开发团队
**测试日期**: 2025-12-09
