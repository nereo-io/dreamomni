# 视频特效系统业务需求文档

## 核心业务目标

为用户提供统一的视频特效生成体验，支持两种技术路径，但用户界面完全一致。

## 用户交互流程（统一体验）

```
用户进入/video-effects页面
↓
选择想要的特效（如"Muscle Surge"）
↓
进入特效详情页 /video-effects/[slug]
↓
上传图片（1-2张图片）
↓
点击生成
↓
系统后台根据特效配置选择技术路径：
  - 路径A：hailuo模型 + prompt模板
  - 路径B：pixverse API + template_id
↓
返回生成的视频
```

## 两种特效模式对比

| 特性         | 模式 1：Hailuo+Prompt              | 模式 2：PixVerse 特效               |
| ------------ | ---------------------------------- | ----------------------------------- |
| **用户界面** | 选择特效 → 上传图片 → 生成         | 选择特效 → 上传图片 → 生成          |
| **后端实现** | 调用 hailuo 模型 + prompt_template | 调用 PixVerse API + template_id     |
| **图片支持** | 1 张图片                           | 1-2 张图片                          |
| **配置存储** | effect_configs.prompt_template     | effect_configs.pixverse_template_id |

## 数据需求

### effect_configs 表需要新增字段

```sql
-- 现有字段（保持不变）
title, description, preview_image, preview_video,
prompt_template, credits_required, ...

-- 新增字段
effect_type VARCHAR -- 'hailuo_prompt' | 'pixverse_template'
pixverse_template_id BIGINT -- PixVerse模板ID（如352981446212096）
max_images INTEGER DEFAULT 1 -- 最大支持图片数量（1=单图，2=双图）
```

### 示例配置数据

**Hailuo 特效示例**：

```json
{
  "title": "爆炸效果",
  "effect_type": "hailuo_prompt",
  "prompt_template": "添加爆炸特效，火光四射...",
  "max_images": 1
}
```

**PixVerse 单图特效示例**：

```json
{
  "title": "Muscle Surge",
  "effect_type": "pixverse_template",
  "pixverse_template_id": 352981446212096,
  "max_images": 1
}
```

**PixVerse 多图特效示例**：

```json
{
  "title": "Multi-Image Effect",
  "effect_type": "pixverse_template",
  "pixverse_template_id": 348361261605632,
  "max_images": 2
}
```

## 技术路径选择逻辑

系统根据`effect_type`字段自动选择：

- `effect_type = 'hailuo_prompt'` → 使用现有 hailuo 模型 + prompt_template
- `effect_type = 'pixverse_template'` → 调用 PixVerse API + pixverse_template_id

## 图片上传规则

- **单图特效** (max_images=1)：用户上传 1 张图片
- **多图特效** (max_images=2)：用户上传 1-2 张图片
- **UI 适配**：上传组件根据特效的 max_images 配置动态调整可上传图片数量

## 用户体验保证

1. **界面统一**：两种模式的界面完全一致，用户无法区分
2. **功能透明**：用户不需要知道背后用的什么技术
3. **响应一致**：两种模式的加载状态、错误处理、成功反馈保持一致
4. **性能预期**：向用户展示预估生成时间（不同技术路径可能不同）

## PixVerse 技术集成要点

### 核心 API 参数

- **template_id**: PixVerse 特效模板 ID（示例：352981446212096）
- **img_ids**: 图片 ID 数组（支持 1-2 张图片）
- **prompt**: 用户输入的描述文本
- **duration**: 视频时长（5 秒或 8 秒）
- **quality**: 视频质量（540p, 720p, 1080p）
- **model**: 模型版本（v4.5, v5 等）

### API 调用流程

#### 1. 上传图片获取 img_id

```curl
curl --location 'https://app-api.pixverse.ai/openapi/v2/image/upload' \
--header 'API-KEY: your-api-key' \
--header 'Ai-trace-id: your-Ai-trace-id' \
--form 'image=@"/path/to/image.jpg"'
```

**上传响应示例**：

```json
{
  "ErrCode": 0,
  "ErrMsg": "success",
  "Resp": {
    "img_id": 123,
    "img_url": "https://media.pixverse.ai/uploaded_image.jpg"
  }
}
```

**图片要求**：

- 支持格式：PNG, WEBP, JPEG, JPG
- 最大尺寸：4000×4000 像素
- 文件大小：< 20MB

#### 2. 提交生成任务

```curl
curl --location 'https://app-api.pixverse.ai/openapi/v2/video/img/generate' \
--header 'API-KEY: your-api-key' \
--header 'Ai-trace-id: your-Ai-trace-id' \
--header 'Content-Type: application/json' \
--data '{
    "duration": 5,
    "img_ids":[123,123],
    "model": "v4.5",
    "motion_mode": "normal",
    "template_id": 352981446212096,
    "prompt": "Muscle Surge effect",
    "quality": "540p"
}'
```

**注意**：

- `img_ids` 数组中使用的是步骤 1 中获取的 `img_id`
- 不能直接使用图片 URL，必须先上传获取 img_id

**响应示例**：

```json
{
  "ErrCode": 0,
  "ErrMsg": "success",
  "Resp": {
    "video_id": 123456789
  }
}
```

#### 2. 轮询生成状态

```curl
curl --location 'https://app-api.pixverse.ai/openapi/v2/video/result/{video_id}' \
--header 'API-KEY: your-api-key' \
--header 'Ai-trace-id: your-Ai-trace-id'
```

**状态码说明**：

- `status: 1` - 生成成功
- `status: 5` - 生成中
- `status: 7` - 内容审核失败
- `status: 8` - 生成失败

**成功响应示例**：

```json
{
  "ErrCode": 0,
  "ErrMsg": "string",
  "Resp": {
    "create_time": "2025-08-29T10:00:00Z",
    "id": 123456789,
    "status": 1,
    "url": "https://example.com/generated-video.mp4",
    "outputWidth": 960,
    "outputHeight": 540,
    "size": 5242880,
    "prompt": "Muscle Surge effect"
  }
}
```

### 集成方式

#### 轮询模式（唯一方式）

- 提交任务后获取 `video_id`
- 定期轮询检查生成状态（建议间隔 10-15 秒）
- 生成完成后获取视频 URL
- 适合现有架构，与其他 provider 保持一致

**注意**：PixVerse API 不支持 webhook 回调机制，只能通过轮询方式获取结果

### 预估生成时间

- **单图特效**：约 60-120 秒
- **多图特效**：约 90-150 秒
- **高质量模式**：时间可能延长 20-30%

  **新增路径**：PixVerse API + template_id
