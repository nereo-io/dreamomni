# 视频生成功能集成计划

本文档规划了将 fal.ai 视频生成功能集成到现有落地页，并实现结果展示、历史记录以及数据持久化的步骤。

## 1. 前端界面适配 (落地页)

### 1.1. 输入组件增强

- **目标**: 更新现有图片生成或内容创作的表单，以支持视频生成特有的参数。
- **涉及组件**: 需要识别当前落地页中用于输入提示词和上传图片的组件。
- **修改点**:
  - **尺寸比例 (Aspect Ratio)**: 添加下拉选择器或按钮组，选项如 `16:9`, `9:16`, `1:1`。默认 `16:9`。
  - **视频时长 (Duration)**: 添加下拉选择器或按钮组，选项 `5秒`, `10秒`。默认 `5秒`。
  - **提示词输入**: 保持现有提示词输入框。
  - **图片上传**: 保持现有图片上传功能 (Kling 模型需要图片输入)。
- **状态管理**: 更新前端状态管理逻辑以包含这些新参数。
- **API 调用**: 修改表单提交逻辑，调用 `/api/video-generation/submit` (推荐异步) 或 `/api/video-generation` (同步，用于快速测试)。

### 1.2. 用户体验

- **明确引导**: 清晰告知用户正在进行视频生成，以及预计等待时间。
- **加载状态**: 在请求发送和等待结果期间，提供明确的加载指示 (例如，进度条、旋转动画、状态文本)。

## 2. 视频生成结果与历史记录展示

### 2.1. 实时/异步结果展示

- **目标**: 用户提交生成请求后，能够看到任务状态并最终展示生成的视频。
- **方案 1 (推荐 - 异步)**:
  - 提交到 `/api/video-generation/submit` 并获取 `requestId`。
  - 前端轮询 `/api/video-generation/status?requestId={requestId}&model={modelEndpoint}` 获取任务状态。
  - 状态更新时，在界面上显示 (例如：排队中、处理中 X%、已完成、失败)。
  - 任务完成后，从状态 API 或结果 API (`/api/video-generation/result`) 获取视频 URL (将是 R2 URL)。
  - 使用 HTML `<video>` 标签播放视频。
- **方案 2 (WebSocket - 更实时，但需要客户端逻辑)**:
  - 前端可以直接连接 fal.ai 提供的 WebSocket URL (通过调用我们后端的 `/api/video-generation/websocket` 获取连接信息和 payload)。
  - 实时处理 WebSocket 消息流，更新 UI 状态和进度。
- **失败处理**: 如果生成失败，清晰展示错误信息。

### 2.2. 视频历史记录页面/区块

- **目标**: 用户可以查看自己过去生成的视频列表。
- **新 API**: 需要后端提供一个新 API 端点，例如 `/api/video-generations/history` (GET)，用于获取当前用户的生成历史 (从 Supabase 查询)。
- **前端页面/组件**: 创建一个新的页面或在用户中心添加一个区块来展示历史记录。
- **展示内容**: 每个历史条目应包含：
  - 视频缩略图 (如果可以生成或截取第一帧)。
  - 生成的视频 (可点击播放)。
  - 提示词。
  - 生成时间。
  - 模型、时长、宽高比等关键参数。
  - 重新生成或编辑参数的选项 (可选)。

## 3. 后端数据持久化

### 3.1. Supabase 数据库设计

- **目标**: 存储视频生成的元数据、任务状态和 R2 文件链接。
- **新建表**: `video_generations`
  - `id` (uuid, primary key, default: `uuid_generate_v4()`)
  - `user_id` (uuid, foreign key to `users.id`, indexed)
  - `fal_request_id` (text, nullable): Fal.ai 返回的请求 ID。
  - `model_id` (text): 使用的模型 ID (例如, `kling-1-6`)。
  - `prompt` (text)
  - `input_image_url` (text, nullable): 用户上传的原始图片 URL (如果适用)。
  - `negative_prompt` (text, nullable)
  - `aspect_ratio` (text, default: `'16:9'`)
  - `duration_seconds` (integer, default: 5)
  - `cfg_scale` (float, nullable)
  - `seed` (integer, nullable)
  - `status` (text, default: `'PENDING'`, e.g., `PENDING`, `IN_QUEUE`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `SAVED_TO_R2`)
  - `video_url_r2` (text, nullable): 存储在 R2 上的视频文件 URL。
  - `video_url_fal` (text, nullable): Fal.ai 返回的临时视频 URL。
  - `error_message` (text, nullable): 如果生成失败，记录错误信息。
  - `logs` (jsonb, nullable): Fal.ai 返回的日志信息。
  - `metrics` (jsonb, nullable): Fal.ai 返回的性能指标 (如 `inference_time`)。
  - `created_at` (timestamp with time zone, default: `now()`)
  - `updated_at` (timestamp with time zone, default: `now()`)
- **RLS 策略**: 确保用户只能访问自己的生成记录。

### 3.2. Supabase Model 操作 (`models/videoGeneration.ts`)

- **目标**: 封装与 `video_generations` 表的数据库交互逻辑。
- **函数**:
  - `createVideoGeneration(data)`: 创建新的生成记录。
  - `getVideoGenerationById(id, userId)`: 根据 ID 获取记录。
  - `getVideoGenerationByFalRequestId(falRequestId)`: 根据 Fal ID 获取记录。
  - `updateVideoGenerationStatus(id, status, details)`: 更新任务状态和 R2 URL、错误信息等。
  - `getUserVideoGenerations(userId, limit, offset)`: 获取用户的历史记录 (分页)。

### 3.3. R2 存储集成

- **目标**: 将 fal.ai 生成的视频文件持久化存储到 Cloudflare R2。
- **凭证配置**: 需要在环境变量中配置 R2 相关的 Access Key ID, Secret Access Key, Bucket Name, Endpoint, Public URL。
- **上传逻辑**: (在 `/api/video-generation/webhook` 或异步任务处理逻辑中)
  1.  当 fal.ai Webhook 通知任务 `COMPLETED` 时，获取 `response.video.url` (fal.ai 临时 URL)。
  2.  下载视频文件到服务器临时位置或直接流式上传到 R2。
  3.  使用 R2 SDK (例如 `@aws-sdk/client-s3`，因为 R2 兼容 S3 API) 上传文件。
  4.  生成 R2 文件的公开访问 URL。
  5.  更新 Supabase 中对应记录的 `video_url_r2` 和 `status` (例如, `SAVED_TO_R2`)。
- **错误处理**: 处理 R2 上传失败的情况，并更新 Supabase 记录。

## 4. 后端 API 修改与新增

### 4.1. 修改现有 Video API

- `/api/video-generation/submit` (异步提交):
  1.  接收前端请求。
  2.  **创建记录**: 调用 `models/videoGeneration.ts` 的 `createVideoGeneration` 在 Supabase 中创建一条初始记录 (状态: `PENDING` 或 `IN_QUEUE`)，包含用户 ID 和所有输入参数。
  3.  调用 `fal.queue.submit()` 并传入 `webhook_url` 指向 `/api/video-generation/webhook`。
  4.  将 Supabase 生成的 `id` 或 fal.ai 的 `request_id` 返回给前端，用于后续状态查询。
- `/api/video-generation` (同步生成 - 如果保留):
  1.  接收前端请求。
  2.  **创建记录**: 同上，在 Supabase 创建初始记录。
  3.  调用 `fal.subscribe()`。
  4.  成功后，下载视频到 R2，更新 Supabase 记录的 `video_url_r2` 和 `status`。
  5.  返回 R2 URL 给前端。

### 4.2. 修改 Webhook 处理 API

- `/api/video-generation/webhook`:
  1.  接收 fal.ai 的回调。
  2.  根据 `request_id` (fal.ai) 查询 Supabase 中的记录 (使用 `getVideoGenerationByFalRequestId`)。
  3.  如果状态是 `COMPLETED`:
      - 获取 fal.ai 返回的视频 URL (`response.video.url`)。
      - 下载视频并上传到 R2。
      - 更新 Supabase 记录：`status = 'COMPLETED'` (或 `'SAVED_TO_R2'`)，`video_url_r2`，`logs`, `metrics`。
  4.  如果状态是 `FAILED`:
      - 更新 Supabase 记录：`status = 'FAILED'`，`error_message`。
  5.  其他状态 (`IN_QUEUE`, `IN_PROGRESS`):
      - 更新 Supabase 记录：`status`，`logs`。

### 4.3. 新增历史记录 API

- `/api/video-generations/history` (GET):
  - 需要用户认证 (获取 `session.user.id`)。
  - 调用 `models/videoGeneration.ts` 的 `getUserVideoGenerations(userId, limit, offset)` 从 Supabase 获取该用户的视频生成历史。
  - 返回记录列表给前端。

## 5. 工作流程与任务拆分 (示例)

### Phase 1: 基础持久化与异步流程

1.  **DB Setup**: 设计并创建 `video_generations` Supabase 表。
2.  **Model**: 实现 `models/videoGeneration.ts` 的 `createVideoGeneration`, `getVideoGenerationByFalRequestId`, `updateVideoGenerationStatus`。
3.  **R2 Config**: 配置 R2 环境变量。
4.  **Webhook Logic**: 实现 `/api/video-generation/webhook` 的核心逻辑 (接收回调, R2 上传, Supabase 更新)。
5.  **Submit API**: 修改 `/api/video-generation/submit` 以创建 Supabase 记录并正确调用 fal.ai 队列。
6.  **Frontend Input**: 初步适配前端输入组件，使其能调用 `/api/video-generation/submit`。
7.  **Basic Result Display**: 前端能够轮询状态接口，并在完成后显示 R2 视频链接或视频。

### Phase 2: 历史记录与 UI 优化

1.  **History API**: 实现 `/api/video-generations/history`。
2.  **History Model**: 实现 `getUserVideoGenerations`。
3.  **Frontend History UI**: 开发历史记录展示页面/组件。
4.  **UI/UX Polish**: 优化加载状态、错误提示、视频播放器等。

### Phase 3: 高级功能与可选优化

1.  **WebSocket Integration**: 如果需要更实时的进度更新，客户端集成 WebSocket。
2.  **Thumbnail Generation**: 后端或前端生成视频缩略图。
3.  **Admin Panel**: 管理员查看所有生成记录 (可选)。

## 6. 注意事项与风险

- **成本控制**: R2 存储和传出流量、Supabase 数据库读写、Fal.ai API 调用都会产生费用。需要监控。
- **错误处理**: 全链路的错误捕获和友好提示至关重要。
- **安全性**: RLS 策略、API 认证、防止未授权访问 R2 文件。
- **Fal.ai API 限制**: 注意 fal.ai 的并发限制和配额。
- **视频处理时间**: 视频生成耗时较长，前端需有良好等待体验设计。

---

下一步：我们可以从 Phase 1 开始，首先搭建数据库和核心的异步处理流程。
