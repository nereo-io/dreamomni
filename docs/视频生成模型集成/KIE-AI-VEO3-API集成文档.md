# KIE.AI Veo3 API 接口文档

## 概述

KIE.AI 提供的 Veo3 AI 视频生成 API，支持文本生成视频和图片生成视频两种模式。本文档整理了完整的接口信息供开发使用。

**Base URL**: `https://kieai.erweima.ai`

**认证方式**: Bearer Token (在 Header 中添加 `Authorization: Bearer <token>`)

## 接口列表

### 1. 生成 Veo3 视频

**接口地址**: `POST /api/v1/veo/generate`

**功能描述**: 使用 Veo3 AI 模型创建新的视频生成任务

#### 使用模式

1. **文本生成视频**: 仅提供文本提示词 `prompt`
2. **图片生成视频**: 提供文本提示词 `prompt` 和图片链接列表 `imageUrls`

#### 请求参数

| 参数名      | 类型     | 必填 | 说明                                                                                                                                                                                      |
| ----------- | -------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prompt      | string   | ✅   | 描述所需视频内容的文本提示词<br/>• 应该详细且具体地描述视频内容<br/>• 可以包含动作、场景、风格等信息<br/>• 对于图片生成视频，描述希望图片如何动起来<br/>• 示例: "A dog playing in a park" |
| imageUrls   | string[] | ❌   | 图片链接列表（图片生成视频模式使用，最多 3 个）<br/>• 必须是有效的图片 URL<br/>• 图片必须能被 API 服务器访问<br/>• 示例: ["http://example.com/image1.jpg"]                                |
| model       | string   | ❌   | 选择使用的模型类型<br/>• `veo3`: 标准模型，支持文本生成视频和图片生成视频<br/>• `veo3_fast`: 快速生成模型，生成速度更快但仅支持文本生成视频<br/>• 默认值: veo3                            |
| watermark   | string   | ❌   | 水印文本，如果提供将在生成的视频上添加水印                                                                                                                                                |
| callBackUrl | string   | ❌   | 完成回调地址<br/>• 建议在生产环境中使用<br/>• 系统将通过 POST 请求将任务完成状态发送到此 URL<br/>• 也可使用查询接口检查状态                                                               |

#### 请求示例

```bash
curl -X POST "https://kieai.erweima.ai/api/v1/veo/generate" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A dog playing in a park",
    "imageUrls": ["http://example.com/image1.jpg"],
    "model": "veo3",
    "watermark": "MyBrand",
    "callBackUrl": "http://your-callback-url.com/complete"
  }'
```

#### 响应格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "veo_task_abcdef123456"
  }
}
```

### 2. 查询 Veo3 视频详情

**接口地址**: `GET /api/v1/veo/record-info`

**功能描述**: 查询 Veo3 视频生成任务的执行情况和结果

#### 状态描述

| 状态码 | 描述                              |
| ------ | --------------------------------- |
| 0      | 生成中 - 任务正在处理             |
| 1      | 成功 - 任务成功完成               |
| 2      | 失败 - 任务生成失败               |
| 3      | 生成失败 - 任务创建成功但生成失败 |

#### 请求参数

| 参数名 | 类型   | 必填 | 说明                                                             |
| ------ | ------ | ---- | ---------------------------------------------------------------- |
| taskId | string | ✅   | 任务 ID（通过 Query 参数传递）<br/>• 示例: veo_task_abcdef123456 |

#### 请求示例

```bash
curl -X GET "https://kieai.erweima.ai/api/v1/veo/record-info?taskId=veo_task_abcdef123456" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <token>"
```

#### 重要说明

- 可通过 taskId 实时查询任务状态
- 建议定期轮询直到任务完成

### 3. 获取 1080P 视频

**接口地址**: `GET /api/v1/veo/get-1080p-video`

**功能描述**: 获取 Veo3 视频生成任务的高清 1080P 版本视频

#### 使用说明

- 当视频生成任务成功完成后，系统会自动开始生成 1080P 高清版本
- 1080P 视频生成需要额外的处理时间，请在原视频生成完成后等待一段时间再调用此接口
- 如果 1080P 视频尚未准备好，接口可能返回错误信息

#### 重要提示

- 只有成功生成的视频任务才能获取 1080P 版本
- 建议在收到视频生成成功回调后，等待几分钟再调用此接口

#### 请求参数

| 参数名 | 类型   | 必填 | 说明                                                             |
| ------ | ------ | ---- | ---------------------------------------------------------------- |
| taskId | string | ✅   | 任务 ID（通过 Query 参数传递）<br/>• 示例: veo_task_abcdef123456 |

#### 请求示例

```bash
curl -X GET "https://kieai.erweima.ai/api/v1/veo/get-1080p-video?taskId=veo_task_abcdef123456" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <token>"
```

## 回调机制

### 视频生成完成回调

当视频生成任务完成时，系统将通过 POST 请求将结果发送到您提供的回调 URL (`callBackUrl`)。

#### 回调请求格式

```json
{
  "code": 200,
  "msg": "Veo3 视频生成成功。",
  "data": {
    // 任务详细信息
  }
}
```

#### 回调状态码

| 状态码 | 描述                    |
| ------ | ----------------------- |
| 200    | 成功 - 视频生成任务成功 |
| 501    | 失败 - 视频生成任务失败 |

#### 回调响应

回调接收成功后，您的服务器应返回 HTTP 200 状态码。

## 通用状态码说明

| 状态码 | 描述                                                        |
| ------ | ----------------------------------------------------------- |
| 200    | 成功 - 请求已成功处理                                       |
| 400    | 1080P 正在处理中。预计 1-2 分钟后准备就绪。请稍后再次查看。 |
| 401    | 未授权 - 认证凭据缺失或无效                                 |
| 402    | 积分不足 - 账户没有足够的积分执行操作                       |
| 404    | 未找到 - 请求的资源或端点不存在                             |
| 422    | 验证错误 - 请求参数验证失败                                 |
| 429    | 请求限制 - 已超过该资源的请求限制                           |
| 455    | 服务不可用 - 系统正在进行维护                               |
| 500    | 服务器错误 - 处理请求时发生意外错误                         |
| 501    | 生成失败 - 视频生成任务失败                                 |
| 505    | 功能禁用 - 请求的功能当前已禁用                             |

## 完整工作流程

1. **提交视频生成任务**

   - 调用 `/api/v1/veo/generate` 接口
   - 获取 taskId

2. **轮询任务状态**

   - 定期调用 `/api/v1/veo/record-info` 接口
   - 检查任务状态，直到完成（状态为 1）

3. **获取高清视频**（可选）

   - 任务完成后等待几分钟
   - 调用 `/api/v1/veo/get-1080p-video` 接口
   - 获取 1080P 高清版本

4. **回调处理**（推荐）
   - 在生成任务时提供 `callBackUrl`
   - 接收系统推送的完成通知
   - 减少轮询频率，提高效率

## 代码示例

### JavaScript/Node.js

```javascript
// 生成视频
const generateVideo = async (prompt, imageUrls = null) => {
  const response = await fetch("https://kieai.erweima.ai/api/v1/veo/generate", {
    method: "POST",
    headers: {
      Authorization: "Bearer YOUR_TOKEN",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      imageUrls,
      model: "veo3",
      callBackUrl: "https://your-domain.com/webhook",
    }),
  });

  return await response.json();
};

// 查询状态
const checkStatus = async (taskId) => {
  const response = await fetch(
    `https://kieai.erweima.ai/api/v1/veo/record-info?taskId=${taskId}`,
    {
      headers: {
        Authorization: "Bearer YOUR_TOKEN",
      },
    }
  );

  return await response.json();
};

// 获取1080P视频
const get1080P = async (taskId) => {
  const response = await fetch(
    `https://kieai.erweima.ai/api/v1/veo/get-1080p-video?taskId=${taskId}`,
    {
      headers: {
        Authorization: "Bearer YOUR_TOKEN",
      },
    }
  );

  return await response.json();
};
```

### Python

```python
import requests

class Veo3Client:
    def __init__(self, token):
        self.token = token
        self.base_url = "https://kieai.erweima.ai"
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def generate_video(self, prompt, image_urls=None, model="veo3", callback_url=None):
        data = {
            "prompt": prompt,
            "model": model
        }
        if image_urls:
            data["imageUrls"] = image_urls
        if callback_url:
            data["callBackUrl"] = callback_url

        response = requests.post(
            f"{self.base_url}/api/v1/veo/generate",
            headers=self.headers,
            json=data
        )
        return response.json()

    def check_status(self, task_id):
        response = requests.get(
            f"{self.base_url}/api/v1/veo/record-info",
            headers=self.headers,
            params={"taskId": task_id}
        )
        return response.json()

    def get_1080p(self, task_id):
        response = requests.get(
            f"{self.base_url}/api/v1/veo/get-1080p-video",
            headers=self.headers,
            params={"taskId": task_id}
        )
        return response.json()
```

### 完整工作流程示例

```javascript
// 完整的视频生成工作流程
async function completeVideoWorkflow(prompt, imageUrls = null) {
  try {
    // 1. 提交生成任务
    const generateResult = await generateVideo(prompt, imageUrls);
    if (generateResult.code !== 200) {
      throw new Error(`Generation failed: ${generateResult.msg}`);
    }

    const taskId = generateResult.data.taskId;
    console.log(`Task created: ${taskId}`);

    // 2. 轮询状态直到完成
    let status = 0;
    while (status === 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待5秒

      const statusResult = await checkStatus(taskId);
      if (statusResult.code === 200) {
        status = statusResult.data.status;
        console.log(`Task status: ${status}`);

        if (status === 1) {
          console.log("Video generation completed!");
          console.log("Video URL:", statusResult.data.videoUrl);
          break;
        } else if (status === 2 || status === 3) {
          throw new Error("Video generation failed");
        }
      }
    }

    // 3. 等待并获取1080P版本
    console.log("Waiting for 1080P processing...");
    await new Promise((resolve) => setTimeout(resolve, 120000)); // 等待2分钟

    const hd1080Result = await get1080P(taskId);
    if (hd1080Result.code === 200) {
      console.log("1080P video ready:", hd1080Result.data.videoUrl);
    } else if (hd1080Result.code === 400) {
      console.log("1080P still processing, please retry later");
    }
  } catch (error) {
    console.error("Workflow error:", error);
  }
}
```

## 最佳实践

1. **生产环境使用回调**: 提供 `callBackUrl` 提高效率，减少轮询
2. **错误处理**: 对所有状态码实现适当的错误处理
3. **重试机制**: 对 429 (频率限制) 错误实现指数退避重试
4. **图片 URL 验证**: 提交图片生成视频请求前验证图片 URL 有效性
5. **积分监控**: 监控账户积分余额避免 402 错误
6. **适当等待**: 请求 1080P 版本前等待充足时间
7. **任务 ID 存储**: 保存 taskId 用于状态跟踪和 1080P 获取

## 注意事项

1. **认证**: 所有接口都需要在 Header 中提供有效的 Bearer Token
2. **积分系统**: 请确保账户有足够积分，否则会返回 402 错误
3. **频率限制**: 注意遵守 API 调用频率限制，避免 429 错误
4. **图片要求**: 用于图片生成视频的图片必须是有效的 URL 且可被服务器访问
5. **异步处理**: 视频生成是异步过程，需要通过轮询或回调获取结果
6. **1080P 延迟**: 高清视频需要额外处理时间，建议在标准视频完成后等待再请求
7. **安全考虑**:
   - 保护好 API Token，不要在客户端代码中暴露
   - 回调 URL 使用 HTTPS
   - 对回调请求进行验证以确保来源可信

## 项目集成进度

### ✅ 已完成 (第一、二阶段)

#### 核心 Provider 实现

- [x] **KieAiVeo3Provider** - 完整实现所有接口方法
- [x] **ProviderFactory 集成** - 添加 KIEAI provider 支持
- [x] **类型系统扩展** - VideoGenerationResult 支持 1080P 字段
- [x] **模型配置** - 新增 kie-veo3-text-to-video 和 kie-veo3-image-to-video
- [x] **错误处理** - 完善的状态码映射和用户友好错误信息

#### 1080P 集成功能

- [x] **智能 1080P 获取** - 非阻塞式高清视频检索
- [x] **优雅降级** - 1080P 失败不影响标准视频返回
- [x] **状态标识** - hd_available, hd_processing 字段

#### 回调机制

- [x] **回调 URL 支持** - submit 方法集成 webhookUrl 参数
- [x] **现有架构兼容** - 无缝集成到轮询机制

### 🚧 第三阶段：图片转视频功能增强

#### 多图片支持实现

```typescript
// 目标：支持最多3张图片的批量处理
interface VideoGenerationRequest {
  image_urls?: string[];  // 扩展为数组支持
  image_url?: string;     // 保持向后兼容
}

// KieAiVeo3Provider 增强
async submit(model: string, input: VideoGenerationRequest) {
  const requestBody: any = {
    prompt: input.prompt,
    model: input.model || "veo3",
  };

  // 多图片处理逻辑
  if (input.image_urls && input.image_urls.length > 0) {
    requestBody.imageUrls = input.image_urls.slice(0, 3); // 最多3张
  } else if (input.image_url) {
    requestBody.imageUrls = [input.image_url]; // 单图片兼容
  }
}
```

#### 前端 UI 增强

- [ ] **多图片上传组件** - 支持拖拽、预览、排序
- [ ] **图片验证** - 格式、大小、分辨率检查
- [ ] **批量管理** - 删除、替换、重新排序

#### 模型配置优化

- [ ] **启用图片转视频模型** - 取消注释并测试
- [ ] **多图片积分计算** - 根据图片数量调整费用
- [ ] **UI 显示优化** - 区分文本和图片转视频模式

### 🎯 第四阶段：用户体验优化

#### 进度指示增强

```typescript
// 更精确的进度计算
interface VideoGenerationStatus {
  progress?: number;
  stage?: "queued" | "processing" | "generating" | "upsampling" | "completed";
  estimated_time_remaining?: number; // 预估剩余时间
}

// 前端进度条组件
const ProgressIndicator = ({ status, stage, estimatedTime }) => {
  const stageProgress = {
    queued: 10,
    processing: 30,
    generating: 70,
    upsampling: 90,
    completed: 100,
  };
};
```

#### 预估时间系统

- [ ] **动态时间计算** - 基于历史数据和当前队列
- [ ] **实时更新** - 轮询时更新预估时间
- [ ] **用户提醒** - 完成时桌面通知

#### 1080P 用户体验

- [ ] **智能提醒** - 标准视频完成后提示 1080P 处理中
- [ ] **自动刷新** - 1080P 准备好时自动更新 UI
- [ ] **下载选项** - 提供标准和高清两个下载选项

#### 错误处理优化

```typescript
// 用户友好的错误处理
const ErrorHandler = {
  402: {
    title: "积分不足",
    message: "您的账户积分不足，请充值后继续使用",
    action: "前往充值",
    actionUrl: "/pricing",
  },
  429: {
    title: "请求过于频繁",
    message: "系统繁忙，请稍后再试",
    action: "稍后重试",
    autoRetry: true,
  },
};
```

#### 回调优化

- [ ] **Webhook 端点实现** - `/api/video-generation/kie-ai-webhook`
- [ ] **签名验证** - 确保回调来源可信
- [ ] **实时 UI 更新** - 收到回调时立即更新前端状态
- [ ] **降级兼容** - 回调失败时自动切回轮询

## Kie.ai Veo3 错误信息数据流转 0704

1. 错误产生 (KieAiVeo3Provider.ts)

// 9 种具体错误码映射
case 401: "Unauthorized - Authentication credentials missing or invalid"
case 422: "Validation Error - The request parameters failed validation checks"
case 429: "Rate Limited - Request limit has been exceeded"
case 501: "Generation Failed - Video generation task failed"

2. 错误包装传递

// 所有错误都被包装为统一格式
throw new Error(`Kie.ai Veo3 Provider ${operation} failed: ${error.message}`)

3. API 路由处理 (submit/route.ts)

// 错误发生时自动退还积分
await increaseCredits({
user_uuid: userInfo.uuid!,
credits: requiredCredits,
});

// 更新数据库状态为失败
await updateVideoGenerationById(videoGeneration.id, {
status: "FAILED",
error_message: providerError.message,
});

4. 数据库存储

- status: "FAILED"
- error_message: 存储具体错误信息
- logs: 存储详细日志

5. 前端轮询获取 (useVideoGeneration.ts)

// 检测到失败状态，显示错误信息
if (status.status === "FAILED") {
toast.error(status.error_message || "Video generation failed");
}

6. 用户友好显示 (video-result/index.tsx)

// 将技术错误转换为用户友好信息
const getFriendlyErrorMessage = (apiErrorMessage) => {
// 状态码映射
case 422: return "There's an issue with your input or settings"
case 500: return "An unexpected error occurred on our end"
// 敏感内容检测
if (includes("SensitiveContent")) return "Content policy violation"
}

⚠️ 发现问题

Webhook 处理缺失：当前 webhook 路由 (webhook/route.ts) 没有正确处理 KieAI 的回调，缺少：
// 缺少 veo3_request_id 查找
if (!videoGeneration) {
videoGeneration = await getVideoGenerationByVeo3RequestId(request_id);
}

数据流转路径：

1. KieAI API 错误 → Provider 错误消息 (状态码映射)
2. Provider 错误 → 数据库存储 (FAILED 状态 + 错误信息)
3. 数据库 → 前端轮询 (获取错误状态)
4. 前端处理 → 用户显示 (友好错误消息)

这样确保了从技术错误到用户友好提示的完整转换链路。
