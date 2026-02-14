# Sora 2 视频模型集成技术方案

> 文档版本：V1.0  
> 更新日期：2025-09-29  
> 作者：平台架构组

---

## 1. 概述

本文档定义 Sora 2 视频模型接入 Veo3 平台的技术方案，覆盖架构、接口适配、数据模型、鉴权、监控与测试策略。目标是在不影响现有视频生成工作流的前提下，为 `text-to-video` 与 `image-to-video` 场景新增 Sora 2 模型选项。

---

## 2. 现有架构回顾

- 前端：`VideoGenerationTool` 组件负责参数输入、模型切换、提交请求以及轮询状态。
- 服务层：`/api/video-generation/submit` 校验积分 → `ProviderFactory` 根据 `model_id` 实例化提供商 → 调用各 Provider 的 `submit` / `status` / `result`。
- 数据层：Supabase `video_generations` 表保存任务信息与各 Provider 的 requestId / 视频地址。
- 配置：`config/video-models.ts` 定义模型元数据，用于渲染 UI 与计算积分。

Sora 2 集成将沿用上述骨架，通过新增配置与 Provider 实现保持兼容性。

---

## 3. 架构设计

### 3.1 模块关系

```mermaid
graph TD
    UI[VideoGenerationTool] --> SubmitAPI[/api/video-generation/submit]
    SubmitAPI --> ProviderFactory
    ProviderFactory -->|model: sora-2-*| KieAiSoraProvider
    KieAiSoraProvider --> KieAIAPI[https://api.kie.ai/api/v1/jobs]
    StatusAPI[/api/video-generation/status] --> ProviderFactory
    ResultAPI[/api/video-generation/result] --> ProviderFactory
    ProviderFactory -.-> Supabase[(video_generations)]
    KieAIAPI --> Webhook[/api/video-generation/webhook]
```

### 3.2 请求流程

1. 前端提交参数，`submit` 接口完成积分计算与校验（复用现有逻辑）。
2. `ProviderFactory` 根据模型配置返回单例 `KieAiSoraProvider`，调用 `submit()` 向 `createTask` 接口发起请求，并附带平台 `/api/video-generation/webhook` 作为 `callBackUrl`。
3. Provider 返回的 `taskId` 持久化到 `video_generations.sora_request_id`。
4. 任务完成后 Kie 平台向 webhook 发送回调，服务端根据 payload 更新状态；若短时间未收到回调，则通过 `status()` 调用 `recordInfo` 兜底查询。
5. 成功后写入 `video_url_sora` 字段，触发通知与历史记录展示。

---

## 4. 详细方案

### 4.1 配置层改造

文件：`config/video-models.ts`

1. 复用现有 `VideoModelProvider.KIEAI` 枚举值，无需新增 Provider 类型。
2. `VIDEO_MODELS` 新增两条记录：
   - `sora-2-text-to-video`
   - `sora-2-image-to-video`

示例（伪代码）：

```ts
"sora-2-text-to-video": {
  id: "sora-2-text-to-video",
  name: "Sora 2 Text-to-Video",
  type: VideoModelType.TEXT_TO_VIDEO,
  provider: VideoModelProvider.KIEAI,
  displayName: "Sora 2",
  perSecondCredits: 0.4, // 10 秒 4 积分
  features: ["HD", "高保真动作"],
  maxDuration: 15,
  supportedAspectRatios: ["16:9", "9:16"],
  supportedDurations: [10, 15],
  supportedResolutions: ["1080p"],
  supportsAudio: false,
  estimatedGenerationTime: 180,
},
```

3. `calculateCredits` 针对 `provider === VideoModelProvider.KIEAI` 且模型 ID 以 `sora-2-` 开头的场景固定返回 HD 定价（无额外加价因子）。

### 4.2 Provider 实现

新增文件：`services/providers/KieAiSoraProvider.ts`

关键实现：

- 构造函数复用 `process.env.KIE_AI_API_KEY`，请求头 `Authorization: Bearer ${apiKey}`。
- 基础地址与官方文档保持一致：`https://api.kie.ai/api/v1/jobs`。
- 默认回调 URL 从环境变量（如 `VIDEO_GENERATION_WEBHOOK_URL`）读取，Provider 在缺省时回落到平台 `/api/video-generation/webhook`。
- `submit(model, input, webhookUrl)` → `POST /api/v1/jobs/createTask`
  - 请求体：
    ```json
    {
      "model": "sora-2-text-to-video",
      "input": {
        "prompt": "...",
        "aspect_ratio": "16:9",
        "quality": "hd"
      },
      "callBackUrl": "${webhookUrl || DEFAULT_CALLBACK}" // 默认为平台 webhook
    }
    ```
  - 响应成功时返回 `taskId`。
- `status(model, requestId)` → `GET /api/v1/jobs/recordInfo?taskId=...`
  - 根据返回的 `state` / `successFlag` 映射为：
    - `waiting`/`pending` → `IN_PROGRESS`、`progress=25`。
    - `processing` → `IN_PROGRESS`、`progress=60`。
    - `successFlag = 1` 且 `response.resultUrls` 存在 → `COMPLETED`。
    - `errorCode` 存在 → `FAILED`，携带 `errorMessage`。
- `result(model, requestId)`：
  - 在 `status` 为 `COMPLETED` 时，提取 `data.response.resultUrls[0]` 作为默认视频地址（API 输出即为 1080p HD）。
- 错误处理：
  - 对 HTTP 状态做映射（401、402、429 等）并抛出可读错误，参考 `KieAiVeo3Provider`。
  - 捕捉超时（使用 `AbortSignal.timeout(120000)`）。

`services/providers/ProviderFactory.ts`：在 `VideoModelProvider.KIEAI` 分支中，根据 `modelId` 前缀返回 `KieAiSoraProvider` 或 `KieAiVeo3Provider`，并共享缓存实例。

### 4.3 环境变量

- 复用现有 `KIE_AI_API_KEY`。确保 `.env.example` 与部署环境已正确配置该变量，无需新增 Secrets。

### 4.4 数据层

- Supabase 表 `video_generations` 增加字段：
  - `sora_request_id TEXT`：保存任务 ID。
  - `video_url_sora TEXT`：保存最终视频 URL。
- 同步更新 `types/video.d.ts`、`models/videoGeneration.ts`：
  - `VideoGeneration`、`CreateVideoGenerationParams`、`UpdateVideoGenerationParams` 新增上述字段。
  - `getVideoGenerationBySoraRequestId` 查询方法（类比 `getVideoGenerationByVeo3RequestId`）。

### 4.5 API 层改动

1. `app/api/video-generation/submit/route.ts`
   - 允许 `model` 为 `sora-2-*`。
   - 调用 `ProviderFactory.getProvider()` 返回 `KieAiSoraProvider`。
   - `createVideoGeneration` 时写入 `sora_request_id`。

2. `app/api/video-generation/status/route.ts`
   - 当 `videoGeneration.sora_request_id` 存在时，使用 `provider.status()`。
   - 将 Provider 返回的 `video_url` 写入响应。

3. `app/api/video-generation/result/route.ts`
   - 追加 Sora 分支，写入 Supabase 与响应体。

4. `app/api/video-generation/webhook/route.ts`
   - 默认注册为 Sora 任务的回调地址，解析成功与失败的 payload，更新状态与积分（失败时返还）。
   - 回调体与 `recordInfo` 响应一致：`data.state` 区分 `success`/`fail`，`resultJson` 中的 `resultUrls` 需解析为数组；`failCode`/`failMsg` 用于记录错误原因。

### 4.6 前端改动

- `components/blocks/ai-video-generation-tool/index.tsx`
  - 模型列表引入 `sora-2-*` 配置（使用 `VIDEO_MODELS`）。
  - 在参数区域显示只读“1080p HD”标签（无需切换控件），并确保提交时 `quality` 固定为 `hd`。
  - 根据 `modelConfig.supportedAspectRatios` 控制下拉项。

- `components/blocks/video-generator`（若存在）
  - 增加新模型对应的默认参数。

- `hooks/useVideoGeneration.ts`
  - 响应中解析 `video_url_sora`。
  - 历史列表支持展示 Sora 标签。

- 多语言文案：
  - `i18n/pages/text-to-video/*.json` 与 `image-to-video/*.json` 增补 Sora 描述。

### 4.7 监控与日志

- 在 `submit/status/result` 路由中使用 `console.log` / Logtail 上报时加上 `provider: "sora2"`。
- 指标：请求成功率、平均耗时、报错次数；接入 Grafana 仪表盘。
- 告警：
  - 5 分钟内失败率 > 20% 触发 Ops 通知。
  - HTTP 429/402（配额/限流）需单独统计。

### 4.8 权限与风控

- 沿用现有 Turnstile 校验逻辑（低积分需要 CAPTCHA）。
- 若 Sora API 对 IP 有限制，需在 `fetch` 调用处添加代理配置（可复用现有 `global-agent` 设置）。
- 对用户输入做二次校验：禁止超过 5000 字符、过滤违禁词（复用现有 prompt guard）。

---

## 5. 开发任务拆解

| 模块 | 内容 | 负责人 |
| ---- | ---- | ---- |
| 配置 | 新增 Sora 模型配置与积分策略 | 后端 |
| Provider | 实现 `KieAiSoraProvider` 与工厂路由 | 后端 |
| 数据库 | Supabase 迁移、模型类型扩展 | 后端 |
| API | `submit/status/result` 适配 | 后端 |
| 前端 | UI 模型列表、参数表单调整、历史记录展示 | 前端 |
| 文案 | i18n 翻译与公告 | 产品/运营 |
| 运维 | 验证 `KIE_AI_API_KEY`、监控告警 | 运维 |

---

## 6. 测试计划

### 6.1 单元测试

- `services/providers/__tests__/kie-ai-sora-provider.test.ts`
  - Mock `fetch` 检查 submit/status/result 流程。
  - 覆盖错误状态码映射与超时处理。
- `config/__tests__/video-models.test.ts`
  - 确认 `calculateCredits` 对 Sora 模型的积分计算正确。
- `app/api/video-generation/__tests__/sora-webhook.test.ts`
  - 校验回调解析逻辑（成功/失败分支、积分返还、去重处理）。

### 6.2 集成测试

- `app/api/video-generation/__tests__/sora-flow.test.ts`
  - 使用 Supertest 模拟提交 → 等待回调 → 状态查询兜底。
  - 确认数据库写入 `sora_request_id`，回调成功后状态更新并在失败时返还积分。

### 6.3 手工验证

1. 文本转视频 10 秒默认 1080p HD 成功生成，结果分辨率符合预期。
2. 文本转视频 10 秒请求，检查积分扣除与返回的 1080p 视频链接。
3. 图生视频任务（上传 PNG），确认 `aspect_ratio` 选项 `16:9`、`9:16` 均可正常生成。
4. 模拟 API 429，确保提示友好且可重试。
5. 模拟回调（成功/失败）并验证状态与积分变化。
6. 历史记录中可以播放/重新生成 Sora 视频。
7. 移除 `KIE_AI_API_KEY` 后请求失败，错误提示明确。

---

## 7. 发布与回滚

- 发布前确保 `.env.production` 已配置 `KIE_AI_API_KEY`，Supabase 表结构迁移完成，回调 URL 可被公网访问。
- 使用 Feature Flag（模型配置 `status = offline`）控制灰度：
  - 第一天只对内部账号可见，确认稳定后再公开。
- 回滚策略：
  - 通过下线模型配置（`VIDEO_MODELS` → `status: offline`）隐藏入口。
  - 如需代码层回滚，恢复 ProviderFactory 旧版本并保留数据列（向后兼容），同时禁用 webhook（返回 410）。

---

## 8. 后续迭代方向

1. 增强回调链路：增加签名校验、失败自动重试与死信队列。
2. 支持音频轨道输出（若 API 开放）。
3. 提供模板化预设与多任务并发排队。
