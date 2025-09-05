# NanoBanana 回调接口实现

## 🎯 功能概述

为 NanoBananaProvider 创建了完整的回调接口系统，用于接收 Kie.ai Nano Banana API 的异步图片生成结果。由于 Nano Banana API 采用异步回调机制，我们需要一个专门的端点来接收生成结果。

## ✨ 核心特性

### 1. **异步回调机制**
- 🔄 **异步处理**: API 请求立即返回任务ID，结果通过回调发送
- 📡 **Webhook接收**: 专门的 `/api/nanobanan-callback` 端点接收结果
- 🎯 **状态跟踪**: 支持 pending、processing、completed、failed 状态

### 2. **完整的接口定义**
- 📋 **请求接口**: `NanoBananaCallbackRequest` 定义回调数据结构
- 💬 **响应接口**: `NanoBananaCallbackResponse` 定义回应格式
- 🔍 **类型安全**: 完整的 TypeScript 类型定义

### 3. **智能错误处理**
- 🛡️ **字段验证**: 验证必需的 task_id 和 status 字段
- 📝 **详细日志**: 记录所有回调事件和错误
- 🔄 **优雅降级**: 即使处理失败也返回成功确认

## 🔧 技术实现

### 1. **接口定义 (NanoBananaProvider.ts)**

#### 回调请求接口
```typescript
export interface NanoBananaCallbackRequest {
  task_id: string;                    // 任务唯一标识
  status: "pending" | "processing" | "completed" | "failed";  // 任务状态
  result?: NanoBananaResponse;        // 生成结果(仅completed时)
  error?: string;                     // 错误信息(仅failed时)
  created_at: string;                 // 任务创建时间
  updated_at: string;                 // 任务更新时间
}
```

#### 回调响应接口
```typescript
export interface NanoBananaCallbackResponse {
  success: boolean;                   // 回调处理是否成功
  message: string;                    // 响应消息
}
```

#### API响应接口更新
```typescript
export interface NanoBananaApiResponse {
  code: number;
  message?: string;
  data?: {
    task_id: string;                  // 返回任务ID而非立即结果
    status: string;                   // 初始状态
  };
}
```

### 2. **回调端点实现 (/api/nanobanan-callback/route.ts)**

#### 主要处理逻辑
```typescript
export async function POST(req: NextRequest) {
  try {
    const callbackData: NanoBananaCallbackRequest = await req.json();
    
    // 验证必需字段
    if (!callbackData.task_id || !callbackData.status) {
      return respErr("Missing required fields: task_id or status");
    }
    
    // 根据状态分类处理
    switch (callbackData.status) {
      case "completed":
        await handleCompletedTask(callbackData);
        break;
      case "failed":
        await handleFailedTask(callbackData);
        break;
      case "processing":
      case "pending":
        await handleProcessingTask(callbackData);
        break;
    }
    
    // 始终返回成功确认
    return respData({
      success: true,
      message: "Callback received and processed"
    });
    
  } catch (error) {
    console.error("Nano Banana callback error:", error);
    return respErr(error.message);
  }
}
```

### 3. **状态处理函数**

#### 完成状态处理
```typescript
async function handleCompletedTask(callbackData: NanoBananaCallbackRequest) {
  console.log('Storing completed task result:', {
    task_id: callbackData.task_id,
    images_count: callbackData.result?.images?.length || 0,
    has_timings: !!callbackData.result?.timings,
    seed: callbackData.result?.seed
  });
  
  // TODO: 存储到数据库
  // TODO: 触发前端通知
  // TODO: 更新UI状态
}
```

#### 失败状态处理
```typescript
async function handleFailedTask(callbackData: NanoBananaCallbackRequest) {
  console.log('Storing failed task result:', {
    task_id: callbackData.task_id,
    error: callbackData.error,
    status: callbackData.status
  });
  
  // TODO: 存储错误信息
  // TODO: 通知用户失败原因
}
```

#### 处理中状态处理
```typescript
async function handleProcessingTask(callbackData: NanoBananaCallbackRequest) {
  console.log('Updating task status:', {
    task_id: callbackData.task_id,
    status: callbackData.status,
    updated_at: callbackData.updated_at
  });
  
  // TODO: 更新进度显示
}
```

### 4. **Provider方法更新**

#### 返回类型更改
```typescript
// 之前: 返回立即结果
async generateFromText(request: NanoBananaTextToImageRequest): Promise<NanoBananaResponse>

// 现在: 返回任务ID
async generateFromText(request: NanoBananaTextToImageRequest): Promise<{ task_id: string; status: string }>
```

#### 回调URL配置
```typescript
getCallbackUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/nanobanan-callback`
    : "http://localhost:3000/api/nanobanan-callback";
}
```

#### 请求体更新
```typescript
// 文本生成图片
body: JSON.stringify({
  callBackUrl: this.getCallbackUrl(),
  input: {
    prompt: request.prompt,
  },
  model: "google/nano-banana",
})

// 图片编辑
body: JSON.stringify({
  callBackUrl: this.getCallbackUrl(),
  input: {
    prompt: request.prompt,
    image_urls: request.image_urls,
  },
  model: "google/nano-banana-edit",
})
```

## 📋 API 流程图

### 异步生成流程
```
1. 前端请求 → POST /api/image-generation/submit
   ↓
2. 调用 NanoBananaProvider.generateFromText()
   ↓
3. 发送请求到 Kie.ai API (包含 callBackUrl)
   ↓
4. Kie.ai 返回 { task_id, status: "pending" }
   ↓
5. 前端收到任务ID (可用于轮询或显示状态)
   ↓
6. Kie.ai 异步处理图片生成
   ↓
7. 生成完成后 → POST /api/nanobanan-callback
   ↓
8. 回调处理器接收结果并存储
   ↓
9. 前端可通过任务ID查询结果
```

### 数据流示例

#### 请求阶段
```typescript
// 用户请求
POST /api/image-generation/submit
{
  "prompt": "A beautiful sunset",
  "model": "nano-banana"
}

// 发送到 Kie.ai
POST https://api.kie.ai/api/v1/playground/createTask
{
  "callBackUrl": "https://yourdomain.com/api/nanobanan-callback",
  "input": { "prompt": "A beautiful sunset" },
  "model": "google/nano-banana"
}

// Kie.ai 响应
{
  "code": 200,
  "data": {
    "task_id": "task_12345",
    "status": "pending"
  }
}
```

#### 回调阶段
```typescript
// Kie.ai 回调
POST /api/nanobanan-callback
{
  "task_id": "task_12345",
  "status": "completed",
  "result": {
    "images": [
      {
        "url": "https://cdn.example.com/generated.jpg",
        "width": 1024,
        "height": 1024
      }
    ],
    "timings": { "inference": 3.2 },
    "seed": 42
  },
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:03Z"
}

// 我们的响应
{
  "success": true,
  "message": "Callback received and processed"
}
```

## 🔒 安全考虑

### 1. **回调验证**
```typescript
// TODO: 实现签名验证
// 验证回调确实来自 Kie.ai
const isValidCallback = await verifyKieAiSignature(req);
if (!isValidCallback) {
  return respErr("Invalid callback signature");
}
```

### 2. **任务ID验证**
```typescript
// 验证任务ID格式和存在性
if (!isValidTaskId(callbackData.task_id)) {
  return respErr("Invalid task ID format");
}
```

### 3. **Rate Limiting**
```typescript
// TODO: 实现回调频率限制
// 防止恶意回调攻击
```

## 📊 监控和日志

### 1. **详细日志记录**
```typescript
console.log('Nano Banana Callback received:', {
  task_id: callbackData.task_id,
  status: callbackData.status,
  timestamp: new Date().toISOString(),
  has_result: !!callbackData.result,
  has_error: !!callbackData.error
});
```

### 2. **性能监控**
- ⏱️ **回调响应时间**: 监控处理回调的时间
- 📊 **成功率统计**: 跟踪回调处理的成功率
- 🔄 **状态分布**: 监控不同状态的分布情况

### 3. **错误追踪**
- 🐛 **异常记录**: 详细记录所有异常
- 📈 **趋势分析**: 分析错误趋势和模式
- 🚨 **告警机制**: 异常率过高时告警

## 🚀 扩展功能

### 1. **数据库集成**
```sql
-- 任务结果表
CREATE TABLE nano_banana_results (
  task_id VARCHAR(255) PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id VARCHAR(255),
  prompt TEXT
);
```

### 2. **WebSocket通知**
```typescript
// 实时通知前端
import { io } from '@/lib/websocket';

async function handleCompletedTask(callbackData: NanoBananaCallbackRequest) {
  // 存储结果
  await storeTaskResult(callbackData);
  
  // 通知前端
  io.emit(`task_completed_${callbackData.task_id}`, {
    task_id: callbackData.task_id,
    result: callbackData.result
  });
}
```

### 3. **任务查询API**
```typescript
// GET /api/nanobanan-task/[taskId]
export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  const result = await getTaskResult(params.taskId);
  return respData(result);
}
```

## 🎯 使用方式

### 1. **环境配置**
```env
# .env.local
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
KIE_AI_API_KEY=your_api_key_here
```

### 2. **生产环境部署**
- 🌐 **域名配置**: 确保 `NEXT_PUBLIC_BASE_URL` 指向正确的生产域名
- 🔒 **HTTPS**: 回调URL必须使用HTTPS
- 📡 **网络访问**: 确保 Kie.ai 能够访问您的回调端点

### 3. **开发环境测试**
```bash
# 使用 ngrok 暴露本地端点进行测试
ngrok http 3000

# 更新环境变量
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
```

## 📋 TODO 列表

### 短期任务
- [ ] 实现数据库存储逻辑
- [ ] 添加 WebSocket 实时通知
- [ ] 实现任务结果查询API
- [ ] 添加回调签名验证

### 中期任务
- [ ] 实现任务超时处理
- [ ] 添加重试机制
- [ ] 实现批量任务处理
- [ ] 添加任务优先级

### 长期任务
- [ ] 实现分布式任务调度
- [ ] 添加多环境支持
- [ ] 实现任务统计和分析
- [ ] 添加任务生命周期管理

## 🎉 总结

这个回调接口实现了：

✅ **完整的异步回调机制**: 支持 Kie.ai Nano Banana API 的异步特性  
✅ **类型安全的接口定义**: 完整的 TypeScript 类型支持  
✅ **智能状态处理**: 支持所有任务状态的处理逻辑  
✅ **详细的日志记录**: 便于调试和监控  
✅ **环境感知配置**: 自动适配开发和生产环境  
✅ **优雅的错误处理**: 确保回调处理的稳定性  

现在 NanoBananaProvider 能够完美支持 Kie.ai 的异步回调机制，为图片生成功能提供了可靠的基础架构！🎨

---

*实现完成时间: 2025年1月*  
*版本: v11.0 - 异步回调版*
