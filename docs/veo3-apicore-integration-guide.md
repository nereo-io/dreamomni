# Veo3 APICore 集成指南

## 概述

本文档详细介绍了如何在 Veo3 AI 平台中集成和使用 Google Veo3 模型通过 APICore 接口。该集成允许用户使用 Google 的先进视频生成技术，同时保持与现有系统的完全兼容性。

## 系统架构

### 集成架构图

```
Frontend (React)
    ↓
Video Generator Component
    ↓
API Routes (/api/video-generation/*)
    ↓
Provider Factory
    ↓
Veo3Provider (APICore)
    ↓
External APICore API
    ↓
Database (Supabase)
```

### 核心组件

1. **Veo3Provider**: 实现 VideoProvider 接口的 APICore 客户端
2. **Video Model Config**: veo3-apicore 模型配置
3. **Database Extensions**: 支持 veo3 特定字段的数据库架构
4. **API Routes**: 扩展现有端点以支持 veo3 处理

## 模型配置

### veo3-apicore 模型规格

```typescript
"veo3-apicore": {
  id: "veo3-apicore",
  name: "Veo3 APICore",
  type: VideoModelType.TEXT_TO_VIDEO,
  provider: VideoModelProvider.VEO3,
  displayName: "Veo3 (Google)",
  perSecondCredits: 5,              // 每秒5积分
  maxDuration: 8,                   // 最大8秒
  supportedAspectRatios: ["adaptive"], // 自适应宽高比
  supportsAudio: true,              // 支持音频生成
  supportedDurations: [5, 8],       // 支持5秒和8秒时长
  supportedResolutions: ["1080p", "4K"], // 支持高分辨率
}
```

### 积分计费

- **基础费率**: 5积分/秒
- **示例计算**:
  - 5秒视频 = 25积分
  - 8秒视频 = 40积分
- **音频**: 包含在基础费率中，无额外费用

## API 接口详细说明

### 1. 视频生成提交接口

**端点**: `POST /api/video-generation/submit`

**请求参数**:
```json
{
  "model": "veo3-apicore",
  "prompt": "视频描述文本",
  "duration": "5",                    // 可选: "5" 或 "8"
  "aspect_ratio": "adaptive",         // 固定值
  "image_url": "https://...",         // 可选: 参考图片URL
  "generate_audio": true              // 可选: 是否生成音频
}
```

**响应格式**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "uuid",
    "requestId": "veo3-fast:79733203-82aa-45d3-bf98-1b559689bb8d",
    "model": "veo3-apicore",
    "status": "submitted"
  }
}
```

## APICore 底层接口规格

### 1. APICore 流式提交接口

**端点**: `POST https://api.apicore.ai/v1/chat/completions`

**请求头**:
```http
Authorization: Bearer sk-your-apicore-key
Content-Type: application/json
```

**请求体** (纯文本提示):
```json
{
  "model": "veo3",
  "messages": [
    {
      "role": "user",
      "content": "A beautiful butterfly landing on a colorful flower in slow motion, cinematic lighting"
    }
  ],
  "stream": true
}
```

**请求体** (包含图片):
```json
{
  "model": "veo3",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Generate a video based on this image with magical effects"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/reference-image.jpg"
          }
        }
      ]
    }
  ],
  "stream": true
}
```

**流式响应格式**:
APICore 返回 Server-Sent Events (SSE) 格式的流式响应：

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1750397898,"model":"veo3","choices":[{"index":0,"delta":{"content":"I'll help you generate a video. Let me process your request.\n\n**Task ID: `veo3-fast:79733203-82aa-45d3-bf98-1b559689bb8d`**\n\nYour video generation task has been submitted successfully. The video will be generated with the following specifications:\n\n- **Model**: Veo3-Fast\n- **Prompt**: A beautiful butterfly landing on a colorful flower in slow motion, cinematic lighting\n- **Duration**: ~5 seconds\n- **Quality**: High definition\n- **Aspect Ratio**: Adaptive\n\nThe task is now being processed. You can check the status using the task ID provided above.\n\n**Estimated completion time**: 2-5 minutes\n\nOnce completed, the video will be available for download with both standard and upsampled (high quality) versions."},"finish_reason":null}],"usage":null}

data: [DONE]
```

**任务ID提取**:
从流式响应中提取任务ID的正则表达式：
```javascript
const taskIdPattern = /Task ID: `([^`]+)`/;
const match = responseContent.match(taskIdPattern);
const taskId = match ? match[1] : null;
```

### 2. APICore 状态查询接口

**端点**: `GET https://asyncdata.net/source/{taskId}`

**示例**: `GET https://asyncdata.net/source/veo3-fast:79733203-82aa-45d3-bf98-1b559689bb8d`

**完整响应格式**:
```json
{
  "completed_at": 1750398084687,
  "created_at": 1750397898681,
  "id": "veo3-fast:79733203-82aa-45d3-bf98-1b559689bb8d",
  "images": [
    {
      "mediaId": "CAMaJDk0NDQ2Mjk3LTg3OWYtNDc1ZC1iZWIyLTc5ZjA0N2IwNzkxMiIDQ0FFKiQ3ZWNjMmI1Ny1mNmY2LTRjOGYtODBlOS03MWY3YmQxNWY1M2I",
      "status": "completed",
      "url": "https://filesystem.site/cdn/20250612/998IGmUiM2koBGZM3UnZeImbPBNIUL.png"
    }
  ],
  "max_retries": 3,
  "req": {
    "enable_upsample": true,
    "enhance_prompt": true,
    "images": [
      "https://filesystem.site/cdn/20250612/998IGmUiM2koBGZM3UnZeImbPBNIUL.png"
    ],
    "model": "veo3-fast",
    "prompt": "horse and cow dancing gracefully"
  },
  "retry_count": 0,
  "running": false,
  "status": "completed",
  "status_update_time": 1750398084687,
  "upsample_generation_id": "c44d3464cb97c354296dbc7d3f3a1457",
  "upsample_status": "MEDIA_GENERATION_STATUS_SUCCESSFUL",
  "upsample_video_url": "https://filesystem.site/cdn/20250620/fVzXC5Gpx7a41MCOxKCnUHfM9G14hV.mp4",
  "video_generation_id": "c89c2cfefa0c6084296dbc7d3f3a1457",
  "video_generation_status": "MEDIA_GENERATION_STATUS_SUCCESSFUL",
  "video_media_id": "CAUSJDE1Y2I4ZGRhLWM4ZmYtNDZlZS1iMDNmLTUwZmVmZWY0ZDg0MhokMGIyOGJiZTMtODFlMy00NjY2LWEyMjQtZjU1Mjc2ODAxN2ViIgNDQUUqJGI0ZTE2OTUyLThkYWYtNGUzZC1hZDUxLTIyMTJhOWUxNTIyZA",
  "video_url": "https://filesystem.site/cdn/20250620/GeUF2PlB8RJCZyejWTUQuQrO0eRKU7.mp4"
}
```

### 3. 系统状态查询接口

**端点**: `POST /api/video-generation/status`

**请求参数**:
```json
{
  "id": "generation-uuid"
}
```

**响应格式**:
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "requestId": "veo3-fast:79733203-82aa-45d3-bf98-1b559689bb8d",
    "model": "veo3-apicore",
    "prompt": "原始提示词",
    "video_url": "https://filesystem.site/cdn/20250620/GeUF2PlB8RJCZyejWTUQuQrO0eRKU7.mp4",
    "video_url_veo3": "https://filesystem.site/cdn/20250620/GeUF2PlB8RJCZyejWTUQuQrO0eRKU7.mp4",
    "upsample_video_url_veo3": "https://filesystem.site/cdn/20250620/fVzXC5Gpx7a41MCOxKCnUHfM9G14hV.mp4",
    "created_at": "2025-06-20T06:58:18.681Z",
    "updated_at": "2025-06-20T07:01:24.687Z"
  }
}
```

### 3. APICore 直接状态查询

**端点**: `GET /api/video-generation/apicore/status?taskId={taskId}`

**响应格式**:
```json
{
  "success": true,
  "taskId": "veo3-fast:task-id",
  "data": {
    "status": "completed",
    "video_url": "https://...",
    "upsample_video_url": "https://...",
    "video_generation_status": "MEDIA_GENERATION_STATUS_SUCCESSFUL"
  }
}
```

## 数据库架构

### 扩展字段

在 `video_generations` 表中添加了以下字段：

```sql
ALTER TABLE video_generations 
ADD COLUMN IF NOT EXISTS veo3_request_id TEXT,
ADD COLUMN IF NOT EXISTS video_url_veo3 TEXT,
ADD COLUMN IF NOT EXISTS upsample_video_url_veo3 TEXT;
```

### 字段说明

- `veo3_request_id`: APICore 任务ID，格式为 "veo3-fast:uuid"
- `video_url_veo3`: Veo3 生成的原始视频URL
- `upsample_video_url_veo3`: 高质量升级版本的视频URL

## 前端集成

### 模型选择器

在视频生成器组件中，veo3-apicore 模型会自动出现在模型选择下拉菜单中：

```
Veo3 (Google) ⚡ 5/s
Google's Veo3 model via APICore with text and image input support
✓ Text-to-video  ✓ Image-to-video  ✓ High quality  ✓ Upsample support
```

### 参数控制

当选择 veo3-apicore 模型时，界面会自动调整可用选项：

- **时长**: 5秒（默认）、8秒
- **分辨率**: 1080p（默认）、4K
- **音频**: 开关控制
- **宽高比**: 自动隐藏（因为使用 adaptive）

## 开发指南

### 环境变量配置

```bash
# .env.local
VEO3_API_KEY=sk-your-apicore-key  # APICore API密钥
```

### Provider 实现

```typescript
// services/providers/Veo3Provider.ts
export class Veo3Provider implements VideoProvider {
  private baseUrl = "https://api.apicore.ai/v1/chat/completions";
  private statusBaseUrl = "https://asyncdata.net/source";
  
  async submit(model: string, input: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    // 1. 发送流式请求到 APICore
    // 2. 解析响应获取 taskId
    // 3. 返回标准化响应
  }
  
  async status(model: string, requestId: string): Promise<VideoGenerationStatus> {
    // 查询 asyncdata.net 获取任务状态
  }
  
  async result(model: string, requestId: string): Promise<VideoGenerationResult> {
    // 获取最终生成结果
  }
}
```

### 模型识别函数

```typescript
// config/video-models.ts
export function isVeo3ApicoreModel(modelId: string): boolean {
  return modelId === "veo3-apicore";
}

export function getVeo3Models(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(model => 
    model.provider === VideoModelProvider.VEO3
  );
}
```

## 测试指南

### 1. 单元测试

测试 veo3-apicore 模型识别：
```bash
# 运行特定测试
jest --testNamePattern="veo3"
```

### 2. API 测试

#### 完整的端到端测试流程

**Step 1: 提交视频生成任务**
```bash
# 提交任务
RESPONSE=$(curl -s -X POST http://localhost:3000/api/video-generation/submit \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "model": "veo3-apicore",
    "prompt": "A beautiful sunset over mountains",
    "duration": "5",
    "aspect_ratio": "adaptive"
  }')

echo "Submit Response: $RESPONSE"

# 提取任务ID
TASK_ID=$(echo $RESPONSE | jq -r '.data.requestId')
GENERATION_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "Task ID: $TASK_ID"
echo "Generation ID: $GENERATION_ID"
```

**Step 2: 状态轮询测试**
```bash
# 检查系统状态
curl -s -X POST http://localhost:3000/api/video-generation/status \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"$GENERATION_ID\"}" | jq .

# 检查APICore原始状态
curl -s "http://localhost:3000/api/video-generation/apicore/status?taskId=$TASK_ID" | jq .

# 直接检查asyncdata.net状态
curl -s "https://asyncdata.net/source/$TASK_ID" | jq .
```

**Step 3: 轮询直到完成**
```bash
#!/bin/bash
TASK_ID="veo3-fast:your-task-id"
MAX_ATTEMPTS=60
ATTEMPT=0

echo "开始轮询任务状态: $TASK_ID"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  echo "尝试 $((ATTEMPT + 1))/$MAX_ATTEMPTS"
  
  STATUS=$(curl -s "https://asyncdata.net/source/$TASK_ID" | jq -r '.status')
  RUNNING=$(curl -s "https://asyncdata.net/source/$TASK_ID" | jq -r '.running')
  
  echo "状态: $STATUS, 运行中: $RUNNING"
  
  if [ "$RUNNING" = "false" ] && [ "$STATUS" = "completed" ]; then
    echo "任务完成！"
    curl -s "https://asyncdata.net/source/$TASK_ID" | jq '.video_url, .upsample_video_url'
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "任务失败"
    break
  fi
  
  sleep 5
  ATTEMPT=$((ATTEMPT + 1))
done
```

#### APICore 直接测试

**测试流式提交接口**
```bash
# 纯文本prompt测试
curl -X POST https://api.apicore.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_APICORE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo3",
    "messages": [
      {
        "role": "user",
        "content": "A majestic eagle soaring through mountains"
      }
    ],
    "stream": true
  }' --no-buffer

# 图片+文本prompt测试
curl -X POST https://api.apicore.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_APICORE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo3",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Create a video based on this image"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/image.jpg"
            }
          }
        ]
      }
    ],
    "stream": true
  }' --no-buffer
```

#### 响应解析测试

**从流式响应提取任务ID**
```bash
# 使用grep提取Task ID
curl -X POST https://api.apicore.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_APICORE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "veo3",
    "messages": [{"role": "user", "content": "test prompt"}],
    "stream": true
  }' --no-buffer | \
  grep -o 'Task ID: `[^`]*`' | \
  sed 's/Task ID: `\(.*\)`/\1/'
```

#### 状态检查测试脚本

```bash
#!/bin/bash
# 状态检查函数
check_status() {
  local task_id=$1
  local response=$(curl -s "https://asyncdata.net/source/$task_id")
  
  echo "=== 状态检查结果 ==="
  echo "任务ID: $task_id"
  echo "运行状态: $(echo $response | jq -r '.running')"
  echo "当前状态: $(echo $response | jq -r '.status')"
  echo "视频生成状态: $(echo $response | jq -r '.video_generation_status')"
  echo "升级状态: $(echo $response | jq -r '.upsample_status')"
  echo "视频URL: $(echo $response | jq -r '.video_url')"
  echo "升级视频URL: $(echo $response | jq -r '.upsample_video_url')"
  echo "错误消息: $(echo $response | jq -r '.error_message // "无"')"
  echo "=================="
}

# 使用示例
check_status "veo3-fast:79733203-82aa-45d3-bf98-1b559689bb8d"
```

### 3. 前端测试

1. 启动开发服务器：`pnpm dev`
2. 访问 http://localhost:3000
3. 在模型选择器中确认 "Veo3 (Google)" 选项
4. 配置参数并生成视频
5. 验证状态轮询和结果显示

### 4. 日志监控

监控 veo3 相关日志：
```bash
tail -f log/veo3-apicore.log
```

日志格式示例：
```
[2025-06-20T07:00:00.000Z] [INFO] Submitting veo3 task | Data: {"model":"veo3-apicore","prompt":"..."}
[2025-06-20T07:00:05.000Z] [SUCCESS] Task submitted | TaskId: veo3-fast:uuid
[2025-06-20T07:02:30.000Z] [SUCCESS] Task completed | Status: completed, hasVideoUrl: true
```

## 视频生成状态判断方法

### 状态字段说明

APICore 响应包含多个状态相关字段，需要综合判断任务的实际状态：

#### 主要状态字段
- `running`: 布尔值，表示任务是否正在运行
- `status`: 字符串，表示任务的当前状态
- `video_generation_status`: 视频生成的详细状态
- `upsample_status`: 高质量版本生成状态

#### 状态映射逻辑

```typescript
function mapVeo3StatusToSystemStatus(apiResponse: any): string {
  const { running, status, video_generation_status, upsample_status } = apiResponse;
  
  // 任务完成：不在运行且状态为completed
  if (running === false && status === "completed") {
    return "COMPLETED";
  }
  
  // 任务正在运行
  if (running === true) {
    switch (status) {
      case "video_generating":
        return "IN_PROGRESS";
      case "video_upsampling":
        return "IN_PROGRESS";
      case "processing":
        return "IN_PROGRESS";
      default:
        return "IN_QUEUE";
    }
  }
  
  // 任务失败
  if (status === "failed") {
    return "FAILED";
  }
  
  // 其他情况
  return "UNKNOWN";
}
```

### 详细状态说明

#### 1. 队列等待状态
```json
{
  "running": true,
  "status": "pending",
  "video_generation_status": null,
  "upsample_status": null
}
```
- **含义**: 任务已提交，等待处理
- **系统状态**: `IN_QUEUE`
- **用户提示**: "您的视频正在队列中等待处理..."

#### 2. 视频生成中
```json
{
  "running": true,
  "status": "video_generating",
  "video_generation_status": "MEDIA_GENERATION_STATUS_RUNNING",
  "upsample_status": null
}
```
- **含义**: 正在生成标准质量视频
- **系统状态**: `IN_PROGRESS`
- **用户提示**: "正在生成您的视频..."

#### 3. 视频升级处理中
```json
{
  "running": true,
  "status": "video_upsampling",
  "video_generation_status": "MEDIA_GENERATION_STATUS_SUCCESSFUL",
  "upsample_status": "MEDIA_GENERATION_STATUS_RUNNING"
}
```
- **含义**: 标准视频已完成，正在生成高质量版本
- **系统状态**: `IN_PROGRESS`
- **用户提示**: "正在生成高质量版本..."

#### 4. 完全完成状态
```json
{
  "running": false,
  "status": "completed",
  "video_generation_status": "MEDIA_GENERATION_STATUS_SUCCESSFUL",
  "upsample_status": "MEDIA_GENERATION_STATUS_SUCCESSFUL",
  "video_url": "https://...",
  "upsample_video_url": "https://..."
}
```
- **含义**: 所有处理完成，视频可用
- **系统状态**: `COMPLETED`
- **用户提示**: "视频生成完成！"

#### 5. 失败状态
```json
{
  "running": false,
  "status": "failed",
  "video_generation_status": "MEDIA_GENERATION_STATUS_FAILED",
  "error_message": "Generation failed due to content policy violation"
}
```
- **含义**: 任务处理失败
- **系统状态**: `FAILED`
- **用户提示**: "视频生成失败，请重试"

### 状态轮询策略

#### 轮询频率控制
```typescript
class StatusPoller {
  private baseInterval = 2000; // 2秒
  private maxInterval = 10000;  // 10秒
  private maxAttempts = 150;    // 最多5分钟
  
  async pollStatus(taskId: string): Promise<any> {
    let attempts = 0;
    let interval = this.baseInterval;
    
    while (attempts < this.maxAttempts) {
      const status = await this.checkStatus(taskId);
      
      // 完成或失败时停止轮询
      if (status.running === false) {
        return status;
      }
      
      // 动态调整轮询间隔
      await this.sleep(interval);
      interval = Math.min(interval * 1.1, this.maxInterval);
      attempts++;
    }
    
    throw new Error('Status polling timeout');
  }
}
```

#### 错误重试机制
```typescript
async function checkStatusWithRetry(taskId: string, maxRetries = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`https://asyncdata.net/source/${taskId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Status check attempt ${i + 1} failed:`, error);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 指数退避延迟
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 进度计算

基于状态阶段计算任务进度：

```typescript
function calculateProgress(apiResponse: any): number {
  const { running, status, video_generation_status, upsample_status } = apiResponse;
  
  // 完成状态
  if (!running && status === "completed") {
    return 100;
  }
  
  // 失败状态
  if (status === "failed") {
    return 0;
  }
  
  // 正在处理的状态
  if (running) {
    switch (status) {
      case "pending":
        return 10;
      case "video_generating":
        return video_generation_status === "MEDIA_GENERATION_STATUS_RUNNING" ? 60 : 30;
      case "video_upsampling":
        return 80;
      default:
        return 20;
    }
  }
  
  return 0;
}
```

### 错误检测和处理

#### 内容策略违规检测
```typescript
function checkContentPolicy(apiResponse: any): { violated: boolean, reason?: string } {
  const errorMessage = apiResponse.error_message || "";
  
  const policyViolations = [
    "content policy violation",
    "inappropriate content",
    "prohibited content",
    "violates guidelines"
  ];
  
  for (const violation of policyViolations) {
    if (errorMessage.toLowerCase().includes(violation)) {
      return { violated: true, reason: violation };
    }
  }
  
  return { violated: false };
}
```

#### 超时检测
```typescript
function checkTimeout(createdAt: number, maxDurationMs = 600000): boolean {
  const now = Date.now();
  const elapsed = now - createdAt;
  return elapsed > maxDurationMs;
}
```

## 错误处理

### 常见错误及解决方案

1. **API Key 无效**
   ```
   错误: Invalid API key
   解决: 检查 VEO3_API_KEY 环境变量
   ```

2. **任务提交失败**
   ```
   错误: Failed to parse task ID from response
   解决: 检查 APICore 接口响应格式
   ```

3. **状态查询超时**
   ```
   错误: Task status check timeout
   解决: 检查 asyncdata.net 可访问性
   ```

### 错误码映射

| APICore 状态 | 系统状态 | 说明 |
|-------------|----------|------|
| `completed` | `COMPLETED` | 生成完成 |
| `running` | `IN_PROGRESS` | 生成中 |
| `failed` | `FAILED` | 生成失败 |
| `pending` | `IN_QUEUE` | 队列等待 |

## 性能优化

### 1. 状态轮询优化

- 初始间隔: 2秒
- 最大间隔: 10秒
- 指数退避策略
- 最大轮询时间: 5分钟

### 2. 缓存策略

- 完成的任务结果缓存 24小时
- 失败任务信息缓存 1小时
- 使用 Redis 或内存缓存

### 3. 并发控制

- 单用户最大并发: 3个任务
- 系统最大并发: 50个任务
- 队列管理和优先级排序

## 监控和分析

### 关键指标

1. **成功率**: veo3 任务完成率
2. **平均时长**: 从提交到完成的时间
3. **错误率**: 各类错误的发生频率
4. **用户满意度**: 基于反馈的质量评分

### 监控工具

- 实时日志监控
- 数据库查询分析
- 用户行为追踪
- 成本分析报告

## 部署注意事项

### 生产环境配置

1. **API限流**: 配置合理的请求频率限制
2. **错误重试**: 实现指数退避重试机制
3. **监控告警**: 设置关键指标阈值告警
4. **数据备份**: 定期备份生成记录和用户数据

### 安全考虑

- API Key 安全存储
- 请求参数验证
- 输出内容过滤
- 用户权限控制

## 故障排查

### 常见问题诊断

1. **检查模型可用性**
   ```bash
   # 验证模型配置
   curl http://localhost:3000/api/video-generation/models
   ```

2. **验证数据库连接**
   ```bash
   # 检查数据库架构
   psql -d your_db -c "\d video_generations"
   ```

3. **测试 APICore 连接**
   ```bash
   # 直接测试 APICore API
   curl -X POST https://api.apicore.ai/v1/chat/completions \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{"model":"veo3-fast","messages":[...]}'
   ```

## 更新日志

### v1.0.0 (2025-06-20)
- ✅ 初始 veo3-apicore 集成
- ✅ 完整的前端界面支持
- ✅ 数据库架构扩展
- ✅ API 端点实现
- ✅ 错误处理和日志记录
- ✅ 测试覆盖和文档

## 支持和反馈

如遇到问题或需要技术支持，请：

1. 查看日志文件: `log/veo3-apicore.log`
2. 检查系统状态: `GET /api/ping`
3. 提交问题报告: 包含错误日志和复现步骤

---

*本文档随系统更新持续维护，最后更新时间: 2025-06-20*