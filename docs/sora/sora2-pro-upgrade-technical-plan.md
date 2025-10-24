# Sora 2/2 Pro 升级技术方案

## 文档信息

- **创建日期**: 2025-10-24
- **版本**: v1.0
- **状态**: Draft

## 1. 需求概述

### 1.1 核心需求

1. **非 Pro Sora 时长扩展**
   - 当前状态: Sora 2 仅支持 10s 时长
   - 目标: 添加 15s 时长选项
   - 前端: 需要显示时长选择器

2. **Sora 2 Pro 模型支持**
   - 添加 Text-to-Video Pro 版本
   - 添加 Image-to-Video Pro 版本
   - 前端: 需要提供模型选择（Standard vs Pro）
   - 定价: Pro 版本价格为标准版的 6 倍

3. **Storyboard 功能（仅 API）**
   - 支持多图（2-8张）序列生成视频
   - 支持时长: 10s/15s/25s
   - 前端: 不暴露 UI，仅通过 API 支持
   - 用途: 为未来功能预留接口

### 1.2 API 提供商

- **Provider**: Kie.ai
- **Base URL**: `https://api.kie.ai/api/v1/jobs`
- **认证方式**: Bearer Token

---

## 2. API 规格分析

### 2.1 Sora 2 Standard (现有)

#### Text-to-Video
- **Model ID**: `sora-2-text-to-video`
- **支持时长**: 10s, 15s
- **参数**:
  ```json
  {
    "model": "sora-2-text-to-video",
    "input": {
      "prompt": "string (max 5000 chars)",
      "aspect_ratio": "landscape" | "portrait",
      "n_frames": "10" | "15",
      "remove_watermark": true
    }
  }
  ```

#### Image-to-Video
- **Model ID**: `sora-2-image-to-video`
- **支持时长**: 10s, 15s
- **参数**:
  ```json
  {
    "model": "sora-2-image-to-video",
    "input": {
      "prompt": "string",
      "image_urls": ["https://..."],
      "aspect_ratio": "landscape" | "portrait",
      "n_frames": "10" | "15",
      "remove_watermark": true
    }
  }
  ```

### 2.2 Sora 2 Pro (新增)

#### Text-to-Video Pro
- **Model ID**: `sora-2-pro-text-to-video`
- **支持时长**: 10s, 15s
- **质量**: 固定 1080p（standard）
  ```json
  {
    "model": "sora-2-pro-text-to-video",
    "input": {
      "prompt": "string (max 5000 chars)",
      "aspect_ratio": "landscape" | "portrait",
      "n_frames": "10" | "15",
      "remove_watermark": true
    }
  }
  ```

#### Image-to-Video Pro
- **Model ID**: `sora-2-pro-image-to-video`
- **支持时长**: 10s, 15s
- **质量**: 固定 1080p（standard）
  ```json
  {
    "model": "sora-2-pro-image-to-video",
    "input": {
      "prompt": "string",
      "image_urls": ["https://..."],
      "aspect_ratio": "landscape" | "portrait",
      "n_frames": "10" | "15",
      "remove_watermark": true
    }
  }
  ```

### 2.3 Storyboard (Pro Only, 新增)

- **Model ID**: `sora-2-pro-storyboard`
- **支持时长**: 10s, 15s, 25s
- **特点**: 多图序列 (2-8 张)
  ```json
  {
    "model": "sora-2-pro-storyboard",
    "input": {
      "n_frames": "10" | "15" | "25",
      "image_urls": [
        "https://image1.jpg",
        "https://image2.jpg",
        "https://image3.jpg"
      ],
      "aspect_ratio": "landscape" | "portrait"
    }
  }
  ```

---

## 3. 定价策略

### 3.1 当前定价（Sora 2 Standard）

- **基础价格**: 0.5 credits/秒
- **10 秒**: 5 credits ($0.125)
- **15 秒**: 7.5 credits ($0.1875)

### 3.2 Pro 定价（6倍标准版）

- **基础价格**: 3 credits/秒
- **10 秒**: 30 credits ($0.75)
- **15 秒**: 45 credits ($1.125)

### 3.3 Storyboard 定价（与 Pro 相同）

- **10 秒**: 30 credits
- **15 秒**: 45 credits
- **25 秒**: 75 credits

### 3.4 定价对比表

| 模型类型 | 10s | 15s | 25s | 备注 |
|---------|-----|-----|-----|------|
| Sora 2 Standard | 5 | 7.5 | - | 当前价格 |
| Sora 2 Pro | 30 | 45 | - | 6x 标准版 |
| Storyboard | 30 | 45 | 75 | Pro only |

---

## 4. 技术实施方案

### 4.1 配置层修改

**文件**: `config/video-models.ts`

#### 4.1.1 修改现有模型（添加 15s 支持）

```typescript
// 修改 sora-2-text-to-video
"sora-2-text-to-video": {
  id: "sora-2-text-to-video",
  name: "Sora 2 Text-to-Video",
  type: VideoModelType.TEXT_TO_VIDEO,
  provider: VideoModelProvider.KIEAI,
  displayName: "Sora 2",
  perSecondCredits: 0.5,
  description: "OpenAI's Sora 2 model, Limited-time promotion",
  features: ["wait 200s", "Audio"],
  maxDuration: 15, // 从 10 改为 15
  supportedAspectRatios: ["16:9", "9:16"],
  supportsAudio: false,
  estimatedGenerationTime: 180,
  supportedDurations: [10, 15], // 添加 15
  supportedResolutions: ["1080p"],
  requiresMembership: true,
},

// 修改 sora-2-image-to-video
"sora-2-image-to-video": {
  id: "sora-2-image-to-video",
  name: "Sora 2 Image-to-Video",
  type: VideoModelType.IMAGE_TO_VIDEO,
  provider: VideoModelProvider.KIEAI,
  displayName: "Sora 2",
  perSecondCredits: 0.5,
  description: "OpenAI's Sora 2 model, Limited-time promotion",
  features: ["wait 200s", "Audio"],
  maxDuration: 15, // 从 10 改为 15
  supportedAspectRatios: ["16:9", "9:16"],
  supportsAudio: false,
  estimatedGenerationTime: 180,
  supportedDurations: [10, 15], // 添加 15
  supportedResolutions: ["1080p"],
  requiresMembership: true,
  imageCapabilities: {
    maxImages: 1,
  },
},
```

#### 4.1.2 新增 Pro 模型

```typescript
// Sora 2 Pro Text-to-Video
"sora-2-pro-text-to-video": {
  id: "sora-2-pro-text-to-video",
  name: "Sora 2 Pro Text-to-Video",
  type: VideoModelType.TEXT_TO_VIDEO,
  provider: VideoModelProvider.KIEAI,
  displayName: "Sora 2 Pro",
  perSecondCredits: 3, // 6x 标准版
  description: "OpenAI's Sora 2 Pro model with enhanced quality",
  features: ["wait 200s", "High Quality", "Better Detail"],
  maxDuration: 15,
  supportedAspectRatios: ["16:9", "9:16"],
  supportsAudio: false,
  estimatedGenerationTime: 240, // Pro 版本可能更慢
  supportedDurations: [10, 15],
  supportedResolutions: ["1080p"],
  requiresMembership: true,
},

// Sora 2 Pro Image-to-Video
"sora-2-pro-image-to-video": {
  id: "sora-2-pro-image-to-video",
  name: "Sora 2 Pro Image-to-Video",
  type: VideoModelType.IMAGE_TO_VIDEO,
  provider: VideoModelProvider.KIEAI,
  displayName: "Sora 2 Pro",
  perSecondCredits: 3, // 6x 标准版
  description: "OpenAI's Sora 2 Pro model with enhanced quality",
  features: ["wait 200s", "High Quality", "Better Detail"],
  maxDuration: 15,
  supportedAspectRatios: ["16:9", "9:16"],
  supportsAudio: false,
  estimatedGenerationTime: 240,
  supportedDurations: [10, 15],
  supportedResolutions: ["1080p"],
  requiresMembership: true,
  imageCapabilities: {
    maxImages: 1,
  },
},

// Sora 2 Pro Storyboard (仅 API 支持)
"sora-2-pro-storyboard": {
  id: "sora-2-pro-storyboard",
  name: "Sora 2 Pro Storyboard",
  type: VideoModelType.IMAGE_TO_VIDEO,
  provider: VideoModelProvider.KIEAI,
  displayName: "Sora 2 Pro Storyboard",
  perSecondCredits: 3,
  description: "Multi-image sequence video generation (2-8 images)",
  features: ["wait 300s", "Multi-Image", "Extended Duration"],
  maxDuration: 25,
  supportedAspectRatios: ["16:9", "9:16"],
  supportsAudio: false,
  estimatedGenerationTime: 360, // Storyboard 可能需要更长时间
  supportedDurations: [10, 15, 25],
  supportedResolutions: ["1080p"],
  requiresMembership: true,
  imageCapabilities: {
    minImages: 2,
    maxImages: 8,
  },
  // 标记为内部使用，前端不显示
  internal: true,
},
```

#### 4.1.3 新增辅助函数

```typescript
// 检查模型是否为 Sora 2 Pro 模型
export function isSora2ProModel(modelId: string): boolean {
  return modelId.includes("sora-2-pro-");
}

// 检查模型是否为 Storyboard 模型
export function isStoryboardModel(modelId: string): boolean {
  return modelId === "sora-2-pro-storyboard";
}
```

### 4.2 Provider 层修改

**文件**: `services/providers/KieAiSoraProvider.ts`

#### 4.2.1 添加 n_frames 参数支持

```typescript
async submit(
  model: string,
  input: VideoGenerationRequest,
  webhookUrl?: string
): Promise<VideoGenerationResponse> {
  try {
    const endpoint = "/createTask";

    const aspectRatio = this.normalizeAspectRatio(
      input.aspect_ratio || input.aspectRatio
    );

    const requestBody: any = {
      model: model,
      input: {
        prompt: input.prompt,
        aspect_ratio: aspectRatio,
        aspectRatio,
      },
    };

    // 添加时长参数（n_frames）
    if (input.duration) {
      requestBody.input.n_frames = String(input.duration);
    }

    // 添加图片 URL（image-to-video 和 storyboard）
    if (input.image_url) {
      const trimmedImageUrl = input.image_url.trim();
      requestBody.input.image_url = trimmedImageUrl;
      requestBody.input.image_urls = [trimmedImageUrl];
      requestBody.input.imageUrl = trimmedImageUrl;
      requestBody.input.imageUrls = [trimmedImageUrl];
    }

    // Storyboard 支持多图
    if (input.image_urls && Array.isArray(input.image_urls)) {
      requestBody.input.image_urls = input.image_urls;
      requestBody.input.imageUrls = input.image_urls;
    }

    // 添加回调 URL
    if (webhookUrl) {
      requestBody.callBackUrl = webhookUrl;
    }

    console.log(
      `🎬 Kie.ai Sora 视频生成请求参数:`,
      JSON.stringify(requestBody, null, 2)
    );

    const response = await this.makeRequest(endpoint, "POST", requestBody);

    // ... 现有响应处理逻辑
  }
}
```

### 4.3 API 层修改

**文件**: `app/api/video-generation/submit/route.ts`

#### 4.3.1 参数接收（无需修改）

现有参数已足够支持 Sora 2 Pro：
- `duration`: 时长参数（支持 10/15）
- `resolution`: 固定 "1080p"
- 其他参数保持不变

#### 4.3.2 时长验证逻辑

```typescript
// 验证模型支持的时长
const durationInt = parseInt(duration);
if (!modelConfig?.supportedDurations?.includes(durationInt)) {
  return respErr(
    `${model} 模型不支持 ${durationInt} 秒时长，支持的时长: ${modelConfig?.supportedDurations?.join(
      ", "
    )} 秒`
  );
}

// 根据时长确定交易类型
let transType: CreditsTransType;
if (durationInt === 5) {
  transType = CreditsTransType.VideoGeneration5s;
} else if (durationInt === 6) {
  transType = CreditsTransType.VideoGeneration6s;
} else if (durationInt === 8) {
  transType = CreditsTransType.VideoGeneration8s;
} else if (durationInt === 10) {
  transType = CreditsTransType.VideoGeneration10s;
} else if (durationInt === 15) {
  transType = CreditsTransType.VideoGeneration15s; // 新增
} else if (durationInt === 25) {
  transType = CreditsTransType.VideoGeneration25s; // 新增（Storyboard）
} else {
  return respErr(`不支持的时长: ${durationInt}秒`);
}
```

#### 4.3.3 Provider 参数传递

```typescript
// 构建请求输入
const input: any = {
  model: finalModel,
  prompt: enhancedPrompt,
};

// 通用参数
if (aspect_ratio) {
  input.aspect_ratio = aspect_ratio;
}

if (duration) {
  input.duration = duration; // 传递给 Provider（Provider 会转为 n_frames）
}

// Storyboard 参数验证
if (isStoryboardModel(finalModel)) {
  if (!finalImageUrls || finalImageUrls.length < 2 || finalImageUrls.length > 8) {
    return respErr(
      `Storyboard requires 2-8 images, but got ${finalImageUrls?.length || 0}`
    );
  }
  input.image_urls = finalImageUrls;
}
```

### 4.4 积分系统修改

**文件**: `services/credit.ts`

#### 4.4.1 新增交易类型

```typescript
export enum CreditsTransType {
  // ... 现有类型
  VideoGeneration5s = "video_generation_5s",
  VideoGeneration6s = "video_generation_6s",
  VideoGeneration8s = "video_generation_8s",
  VideoGeneration10s = "video_generation_10s",
  VideoGeneration15s = "video_generation_15s", // 新增
  VideoGeneration25s = "video_generation_25s", // 新增（Storyboard）
  RefundVideoGenerationFailed = "refund_video_generation_failed",
}
```

### 4.5 前端 UI 修改（无需开发）

**现有组件已完整支持**，无需额外开发工作：

#### 4.5.1 模型自动发现机制（已实现）

**位置**: `components/blocks/video-generator/index.tsx`

现有组件通过以下函数自动获取所有可用模型：
```typescript
// Text-to-Video 模式
const models = getTextToVideoModels();

// Image-to-Video 模式
const models = getImageToVideoModels();
```

只需在 `config/video-models.ts` 中添加 Pro 模型配置，前端会**自动显示**。

#### 4.5.2 时长动态选择（已实现）

现有代码：
```typescript
// 372-380行：自动读取模型支持的时长
const supportedDurations = modelConfig.supportedDurations || [5, 10];
setSelectedDuration((prev) => {
  if (!prev) {
    return `${supportedDurations[0]}s`;
  }
  // 验证当前选择是否在支持列表中
  const currentDuration = parseInt(prev.replace("s", ""));
  if (!supportedDurations.includes(currentDuration)) {
    return `${supportedDurations[0]}s`;
  }
  return prev;
});

// 1006-1030行：动态渲染时长选项
{(selectedModelConfig?.supportedDurations || [5, 10]).map(
  (duration) => (
    <label key={duration}>
      <input
        type="radio"
        value={`${duration}s`}
        checked={selectedDuration === `${duration}s`}
        onChange={(e) => setSelectedDuration(e.target.value)}
      />
      {duration}s
    </label>
  )
)}
```

**工作原理**：
1. 用户选择模型 → 读取 `modelConfig.supportedDurations`
2. 自动生成对应的时长选项（10s/15s）
3. 如果当前选择的时长不在新模型支持列表，自动切换到首个支持的时长

#### 4.5.3 分辨率自动适配（已实现）

现有代码已支持从 `modelConfig.supportedResolutions` 读取：
```typescript
// Sora 2 模型固定 1080p，前端会自动设置
```

### 结论

✅ **零前端开发工作量**
只需在后端配置文件中添加 Pro 模型定义，前端组件会自动：
- 在模型列表中显示 Pro 选项
- 根据 Pro 模型的 `supportedDurations` 显示 10s/15s 选项
- 自动计算和显示积分消耗

**唯一需要注意**：确保 `displayName` 包含 "Pro" 标识，帮助用户区分。

---

## 5. 数据库修改

### 5.1 Schema 检查

**表**: `video_generations`

现有字段已足够，无需新增字段：
- `duration_seconds` - 存储时长（支持 10/15/25）
- `metadata` - JSON 字段，可存储 `size` 参数

### 5.2 数据迁移

无需数据迁移，现有记录保持不变。

---

## 6. 测试计划

### 6.1 单元测试

- [ ] 积分计算函数测试（15s, 25s）
- [ ] 模型配置验证测试
- [ ] 时长验证测试

### 6.2 集成测试

#### Sora 2 Standard (15s)
- [ ] Text-to-Video 15s 生成
- [ ] Image-to-Video 15s 生成
- [ ] 积分扣除验证（7.5 credits）
- [ ] Webhook 回调验证

#### Sora 2 Pro
- [ ] Text-to-Video 10s
- [ ] Text-to-Video 15s
- [ ] Image-to-Video 10s
- [ ] Image-to-Video 15s
- [ ] 积分扣除验证（30/45 credits）
- [ ] 质量验证（确认输出为 1080p）

#### Storyboard (API Only)
- [ ] 2 张图片 10s
- [ ] 5 张图片 15s
- [ ] 8 张图片 25s
- [ ] 边界测试（1 张/9 张图片应报错）
- [ ] 积分扣除验证

### 6.3 前端测试

- [ ] 模型选择器显示正确（Standard/Pro）
- [ ] 时长选项根据模型动态更新（10s/15s）
- [ ] 积分估算显示正确
- [ ] Storyboard 不显示在 UI
- [ ] Pro 模型明确标注 "PRO" badge

### 6.4 端到端测试

- [ ] 完整生成流程（Standard 15s）
- [ ] 完整生成流程（Pro 10s）
- [ ] 完整生成流程（Pro 15s）
- [ ] 失败退款流程验证

---

## 7. 部署计划

### 7.1 阶段 1: 后端开发（4-6 小时）

**配置层修改**（1 小时）
- [ ] 修改 `config/video-models.ts`
  - 更新 `sora-2-text-to-video`：添加 15s 支持
  - 更新 `sora-2-image-to-video`：添加 15s 支持
  - 新增 `sora-2-pro-text-to-video`
  - 新增 `sora-2-pro-image-to-video`
  - 新增 `sora-2-pro-storyboard`（internal）
- [ ] 添加辅助函数（`isSora2ProModel`, `isStoryboardModel`）

**Provider 层修改**（1 小时）
- [ ] 修改 `services/providers/KieAiSoraProvider.ts`
  - 添加 `n_frames` 参数支持
  - 添加多图支持（Storyboard）

**API 层修改**（1 小时）
- [ ] 修改 `app/api/video-generation/submit/route.ts`
  - 添加 15s/25s 时长验证
  - 添加 Storyboard 参数验证

**积分系统修改**（30 分钟）
- [ ] 修改 `services/credit.ts`
  - 新增 `VideoGeneration15s` 交易类型
  - 新增 `VideoGeneration25s` 交易类型

**单元测试**（30-1 小时）
- [ ] 积分计算测试
- [ ] 模型配置验证测试

### 7.2 阶段 2: 集成测试（2-3 小时）

**API 测试**
- [ ] Sora 2 Standard 15s（text + image）
- [ ] Sora 2 Pro 10s/15s（text + image）
- [ ] Storyboard API（2-8 张图）
- [ ] 积分扣费/退费验证

**Webhook 测试**
- [ ] 验证 Pro 模型 webhook 处理
- [ ] 验证 Storyboard webhook 处理

### 7.3 阶段 3: 前端验证（30 分钟）

**无需开发，仅需验证**：
- [ ] 刷新页面，确认 Pro 模型显示在选择器中
- [ ] 选择 Pro 模型，确认显示 10s/15s 选项
- [ ] 验证积分估算显示正确（30/45 credits）
- [ ] 确认 Storyboard 不显示在 UI

### 7.4 阶段 4: 生产部署（1-2 小时）

- [ ] 代码审查
- [ ] 部署到生产环境
- [ ] 灰度测试（内部账号）
- [ ] 监控关键指标（30 分钟）
- [ ] 全量发布

**总计时间**: 1 个工作日（8-12 小时）

---

## 8. 监控指标

### 8.1 关键指标

- Sora 2 Standard 15s 成功率
- Sora 2 Pro 成功率
- 平均生成时间（Standard vs Pro）
- 积分扣费准确性
- 退款率

### 8.2 告警规则

- 成功率 < 90%
- 平均生成时间 > 5 分钟
- 退款率 > 5%

---

## 9. 回滚计划

### 9.1 触发条件

- 成功率下降 > 20%
- 严重 bug 导致积分错误扣费
- API 错误率 > 10%

### 9.2 回滚步骤

1. 恢复 `config/video-models.ts`（移除 Pro 模型）
2. 恢复 Provider 代码
3. 前端紧急更新（隐藏 Pro 选项）
4. 数据库无需回滚（向后兼容）

---

## 10. 风险评估

### 10.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Kie.ai API 不稳定 | 高 | 中 | 添加重试机制，降级到 Standard |
| Pro 模型成本过高 | 中 | 低 | 前端明确显示积分消耗 |
| Storyboard 被滥用 | 中 | 低 | 仅 API 支持，未来添加频控 |
| 积分计算错误 | 高 | 低 | 充分单元测试 |

### 10.2 产品风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 用户误选 Pro 导致积分快速消耗 | 中 | 中 | 前端明确提示，添加确认弹窗 |
| 15s 生成时间过长导致用户流失 | 中 | 低 | 设定合理预期，显示预估时间 |
| Standard 与 Pro 质量差异不明显 | 低 | 中 | 产品文档说明差异点 |

---

## 11. 未来优化

### 11.1 短期（1 个月内）

- [ ] 添加 Storyboard 前端 UI
- [ ] 优化 Pro 模型生成速度
- [ ] 添加批量生成折扣

### 11.2 长期（3 个月内）

- [ ] 支持自定义时长（5-25s 连续可选）
- [ ] 添加预设质量档位（Economy/Standard/Premium/Ultra）
- [ ] 支持视频续写（extend）功能

---

## 12. 参考文档

- Kie.ai Sora 2 Text-to-Video API: `docs/api/kie-ai/sora-2-text-to-video.md`
- Kie.ai Sora 2 Pro Text-to-Video API: `docs/api/kie-ai/sora-2-pro-text-to-video.md`
- Kie.ai Sora 2 Image-to-Video API: `docs/api/kie-ai/sora-2-image-to-video.md`
- Kie.ai Sora 2 Pro Image-to-Video API: `docs/api/kie-ai/sora-2-pro-image-to-video.md`
- Kie.ai Sora 2 Pro Storyboard API: `docs/api/kie-ai/sora-2-pro-storyboard.md`
- 现有 Sora 2 技术方案: `docs/sora/sora2-technical-plan.md`

---

## 附录 A: API 请求示例

### A.1 Sora 2 Standard Text-to-Video (15s)

```bash
curl -X POST https://api.kie.ai/api/v1/jobs/createTask \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sora-2-text-to-video",
    "input": {
      "prompt": "A cinematic shot of the ocean waves",
      "aspect_ratio": "landscape",
      "n_frames": "15",
      "remove_watermark": true
    }
  }'
```

### A.2 Sora 2 Pro Text-to-Video (15s)

```bash
curl -X POST https://api.kie.ai/api/v1/jobs/createTask \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sora-2-pro-text-to-video",
    "input": {
      "prompt": "A cinematic shot of the ocean waves",
      "aspect_ratio": "landscape",
      "n_frames": "15",
      "remove_watermark": true
    }
  }'
```

### A.3 Storyboard (3 images, 15s)

```bash
curl -X POST https://api.kie.ai/api/v1/jobs/createTask \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sora-2-pro-storyboard",
    "input": {
      "n_frames": "15",
      "image_urls": [
        "https://example.com/scene1.jpg",
        "https://example.com/scene2.jpg",
        "https://example.com/scene3.jpg"
      ],
      "aspect_ratio": "landscape"
    }
  }'
```

---

## 附录 B: 数据库 Schema

### video_generations 表（现有）

```sql
CREATE TABLE video_generations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  model_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  duration_seconds INTEGER, -- 支持 5/6/8/10/15/25
  aspect_ratio TEXT,
  resolution TEXT, -- Pro 模型固定 "1080p"
  has_audio BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL,
  sora_request_id TEXT, -- Sora 2/Pro 使用此字段
  metadata JSONB, -- 存储积分扣费等信息
  -- ... 其他字段
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### metadata 字段示例

```json
{
  "credit_deduction": {
    "pools": [...],
    "total_deducted": 45
  }
}
```

---

## 文档变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2025-10-24 | Claude Code | 初始版本 |
| v1.1 | 2025-10-24 | Claude Code | 移除 `size` 参数，Pro 模型统一使用 1080p |
| v1.2 | 2025-10-24 | Claude Code | 更新前端部分：确认无需开发，现有组件已完整支持 |
