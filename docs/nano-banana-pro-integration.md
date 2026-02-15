# Nano Banana Pro 集成方案

## 概述

将 Kie.ai 的 **Nano Banana Pro** 模型集成到现有图片生成系统。Pro 模型同时支持文生图和图生图,提供增强的分辨率选项(1K/2K/4K)和灵活的宽高比。

---

## 现有系统分析

### 当前实现

**Provider**: `NanoBananaProvider` (services/providers/NanoBananaProvider.ts)
- **API 端点**: `https://api.kie.ai/api/v1/playground/createTask`
- **模型**:
  - `google/nano-banana` (文生图)
  - `google/nano-banana-edit` (图生图)
- **回调地址**: `/api/ai-callback/nano_banana`

### Pro 模型差异对比

| 功能 | 标准 API | Pro API |
|---------|-------------|---------|
| **端点** | `/api/v1/playground/createTask` | `/api/v1/jobs/createTask` |
| **模型名称** | `google/nano-banana` | `nano-banana-pro` |
| **文生图** | ✅ | ✅ |
| **图生图** | ✅ (通过 `google/nano-banana-edit`) | ✅ (统一模型) |
| **最大输入图片数** | 5 | 8 |
| **分辨率** | 1K (1024x1024) | 1K / 2K / 4K |
| **宽高比选项** | 10 种 ✅ | 10 种 ✅ |
| **回调格式** | 相同 | 相同 |
| **定价** | 1-2 积分 | **统一定价(所有分辨率相同价格)** |

**注**:
- 标准 API 和 Pro API 支持相同的 10 种宽高比选项
- 标准版图生图最多支持 5 张参考图,Pro 版支持 8 张

---

## API 规范

### 请求格式

```typescript
// POST https://api.kie.ai/api/v1/jobs/createTask
{
  "model": "nano-banana-pro",
  "input": {
    "prompt": string,              // 必填,最长 5000 字符
    "image_input": string[],       // 可选,最多 8 张图片 (文生图: [], 图生图: [url1, url2, ...])
    "aspect_ratio": string,        // 可选,默认 "1:1"
    "resolution": string,          // 可选,默认 "1K"
    "output_format": "png" | "jpg" // 可选,默认 "png"
  },
  "callBackUrl": string            // 可选
}
```

#### 输入参数

| 参数 | 类型 | 必填 | 选项 | 默认值 | 说明 |
|-----------|------|----------|---------|---------|-------------|
| `prompt` | string | 是 | - | - | 文本描述(最长 5000 字符) |
| `image_input` | string[] | 否 | 最多 8 个 URL | `[]` | 参考图片(文生图传空数组) |
| `aspect_ratio` | string | 否 | 见下方 | `"1:1"` | 输出宽高比 |
| `resolution` | string | 否 | `"1K"`, `"2K"`, `"4K"` | `"1K"` | 输出分辨率 |
| `output_format` | string | 否 | `"png"`, `"jpg"` | `"png"` | 图片格式 |

**支持的宽高比**:
- `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

### 响应格式

```typescript
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "281e5b0...f39b9"
  }
}
```

### 回调格式

```typescript
// POST {callBackUrl}
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": string,
    "state": "success" | "fail" | "processing" | "pending",
    "model": "nano-banana-pro",
    "createTime": number,
    "updateTime": number,
    "completeTime": number,     // 当 state === "success"
    "costTime": number,         // 秒
    "resultJson": string,       // JSON 字符串: {"resultUrls": ["url1", ...]}
    "failCode": string,         // 当 state === "fail"
    "failMsg": string,          // 当 state === "fail"
    "param": string             // 原始请求参数(JSON 字符串)
  }
}
```

**重要**: 回调格式与现有 Nano Banana API **完全相同**,无需修改 `handleCallback()` 方法。

---

## 集成方案

### 阶段 0: 创建图片模型配置文件

**新建文件**: `config/image-models.ts`

✅ **已完成** - 创建独立的图片模型配置文件(类似 `config/video-models.ts`)

**配置内容**:
```typescript
// 图片模型提供商
export enum ImageModelProvider {
  KIE = 'kie', // Kie.ai (提供 Nano Banana 等模型)
}

// 图片模型类型
export enum ImageModelType {
  TEXT_TO_IMAGE = 'text-to-image',
  IMAGE_TO_IMAGE = 'image-to-image',
}

// 图片模型配置接口
export interface ImageModelConfig {
  id: string;
  name: string;
  displayName: string;
  provider: ImageModelProvider;
  type: ImageModelType;
  status: 'active' | 'inactive';
  features: string[];
  credits: number;
  maxInputImages?: number; // 图生图最多支持几张输入图片
  supportedAspectRatios: string[];
  supportedResolutions?: string[]; // 1K, 2K, 4K
  supportedFormats: string[];
  estimatedGenerationTime?: number; // 预估生成时间(秒)
}
```

**模型配置**:
```typescript
export const IMAGE_MODELS: Record<string, ImageModelConfig> = {
  // 标准版 - 文生图
  'nano-banana': {
    provider: ImageModelProvider.KIE,
    credits: 1,
    supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    estimatedGenerationTime: 10,
  },

  // 标准版 - 图生图
  'nano-banana-edit': {
    provider: ImageModelProvider.KIE,
    credits: 2,
    maxInputImages: 5, // 最多 5 张
    supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    estimatedGenerationTime: 15,
  },

  // Pro 版 - 统一模型
  'nano-banana-pro': {
    provider: ImageModelProvider.KIE,
    credits: 3, // 所有分辨率统一定价
    maxInputImages: 8, // 最多 8 张
    supportedAspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
    supportedResolutions: ['1K', '2K', '4K'],
    estimatedGenerationTime: 20,
  },
};
```

**辅助函数**:
```typescript
export function getImageModel(modelId: string): ImageModelConfig | undefined;
export function calculateImageCredits(modelId: string): number;
```

### 阶段 1: 扩展请求类型

**文件**: `services/providers/BaseAIProvider.ts`

**操作**: 扩展 `GenerateImageRequest` 接口

```typescript
export interface GenerateImageRequest {
  // 现有字段
  prompt: string;
  negativePrompt?: string;
  model?: string;
  output_format?: "png" | "jpeg";
  image_size?: "auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9";

  // Pro 模型新增参数
  aspect_ratio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  resolution?: '1K' | '2K' | '4K';
  image_input?: string[];  // 用于图生图(替代 EditImageRequest 中的 imageUrls)
}
```

**设计理由**:
- `image_input: []` = 文生图
- `image_input: [url1, ...]` = 图生图
- 将两种模式统一到单个 API 调用

### 阶段 2: 实现 Pro API

**文件**: `services/providers/NanoBananaProvider.ts`

#### 2.1 添加 Pro API 请求类型

```typescript
export interface NanoBananaProRequest {
  prompt: string;
  image_input?: string[];  // 0-8 张图片
  aspect_ratio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  resolution?: '1K' | '2K' | '4K';
  output_format?: 'png' | 'jpg';
}
```

#### 2.2 实现 `generateWithProApi()` 方法

```typescript
private async generateWithProApi(request: GenerateImageRequest): Promise<ProviderResponse> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.apiKey}`,
  };

  const body = {
    model: 'nano-banana-pro',
    input: {
      prompt: request.prompt,
      image_input: request.image_input || [],  // 文生图传空数组
      aspect_ratio: request.aspect_ratio || '1:1',
      resolution: request.resolution || '1K',
      output_format: request.output_format || 'png',
    },
    callBackUrl: this.getCallbackUrl(),
  };

  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nano Banana Pro API 错误: ${response.status} - ${errorText}`);
  }

  const apiResponse: NanoBananaApiResponse = await response.json();

  if (apiResponse.code !== 200 || !apiResponse.data) {
    throw new Error(`API 错误: ${apiResponse.code}`);
  }

  return {
    taskId: apiResponse.data.taskId,
    status: 'pending',
    metadata: {
      provider: this.getProvider(),
      model: 'nano-banana-pro',
      api_version: 'pro',
      recordId: apiResponse.data.recordId,
      resolution: request.resolution || '1K',
      aspect_ratio: request.aspect_ratio || '1:1',
    },
  };
}
```

#### 2.3 更新 `generateImage()` 方法

```typescript
async generateImage(request: GenerateImageRequest): Promise<ProviderResponse> {
  try {
    this.validateRequest(request);

    // 根据模型 ID 自动检测 API 版本
    const isPro = request.model === 'nano-banana-pro';

    if (isPro) {
      return await this.generateWithProApi(request);
    } else {
      // 现有标准 API 逻辑
      return await this.generateFromText({
        prompt: request.prompt,
        output_format: request.output_format,
        image_size: request.image_size,
      });
    }
  } catch (error) {
    return {
      taskId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : '未知错误',
      metadata: { provider: this.getProvider() },
    };
  }
}
```

#### 2.4 回调处理

**无需修改** - Pro API 使用相同的回调格式。现有 `handleCallback()` 方法同时适用于标准和 Pro 模型。

### 阶段 3: 更新 AIServiceManager

**文件**: `services/AIServiceManager.ts`

**操作**: 从配置文件导入模型定义,替代硬编码的 `PROVIDER_CONFIGS`

```typescript
import { IMAGE_MODELS, getImageModel, calculateImageCredits } from '@/config/image-models';

// 使用配置文件中的模型定义
const PROVIDER_CONFIGS = {
  nano_banana: {
    id: 'nano_banana',
    name: 'kie',
    displayName: 'Kie.ai',
    status: 'active',
    models: Object.values(IMAGE_MODELS).filter(m => m.provider === 'kie'),
    // ... 其他配置
  },
};
```

---

## 前端集成

### API 调用示例

```typescript
import { aiServiceManager } from '@/services/AIServiceManager';

// 文生图 - Pro 模型
const textToImageResult = await aiServiceManager.generateImage('nano_banana', {
  prompt: '一座充满霓虹灯的未来都市夜景',
  model: 'nano-banana-pro',
  aspect_ratio: '16:9',
  resolution: '4K',
  output_format: 'png',
  image_input: [],  // 文生图传空数组
});

// 图生图 - Pro 模型
const imageToImageResult = await aiServiceManager.generateImage('nano_banana', {
  prompt: '将这张图片转换为水彩画风格',
  model: 'nano-banana-pro',
  aspect_ratio: '1:1',
  resolution: '2K',
  output_format: 'jpg',
  image_input: [
    'https://example.com/reference1.jpg',
    'https://example.com/reference2.jpg',
  ],
});
```

### UI 组件建议

1. **分辨率选择器** - 下拉菜单: 1K / 2K / 4K
2. **宽高比选择器** - 下拉菜单: 10 种选项
3. **多图片上传** - 最多 8 张参考图
4. **Pro 标识** - 显示 "Pro Model" 徽章和定价(3 积分)

---

## 数据库 Schema

**无需修改** - 现有 `image_generations` 表已支持 Pro 模型:

```sql
CREATE TABLE image_generations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  task_id text,
  prompt text,
  model text,                 -- 可存储 'nano-banana-pro'
  status text,
  result_urls text[],
  metadata jsonb,             -- 存储 resolution、aspect_ratio 等
  credits_used integer,       -- 为 Pro 模型存储 3
  created_at timestamptz,
  updated_at timestamptz
);
```

**Metadata JSON 示例**:
```json
{
  "provider": "kie",
  "model": "nano-banana-pro",
  "resolution": "4K",
  "aspect_ratio": "16:9",
  "api_version": "pro",
  "image_input_count": 2
}
```

---

## 错误处理

### 验证规则

```typescript
protected validateRequest(request: GenerateImageRequest): void {
  if (!request.prompt || request.prompt.trim().length === 0) {
    throw new Error('提示词为必填项');
  }

  if (request.prompt.length > 5000) {
    throw new Error('提示词过长(Pro 模型最长 5000 字符)');
  }

  // Pro 模型特定检查
  if (request.model === 'nano-banana-pro') {
    if (request.image_input && request.image_input.length > 8) {
      throw new Error('Pro 模型最多支持 8 张输入图片');
    }

    const validAspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
    if (request.aspect_ratio && !validAspectRatios.includes(request.aspect_ratio)) {
      throw new Error(`无效的宽高比。支持: ${validAspectRatios.join(', ')}`);
    }

    const validResolutions = ['1K', '2K', '4K'];
    if (request.resolution && !validResolutions.includes(request.resolution)) {
      throw new Error(`无效的分辨率。支持: ${validResolutions.join(', ')}`);
    }
  }
}
```

### 错误码

| 代码 | 含义 | 处理方式 |
|------|---------|--------|
| 200 | 成功 | 正常处理 |
| 400 | 无效参数 | 向用户显示错误 |
| 401 | 认证失败 | 检查 API 密钥 |
| 402 | 余额不足 | 提示用户购买积分 |
| 404 | 资源未找到 | 重试请求 |
| 422 | 验证失败 | 检查输入参数 |
| 429 | 速率限制 | 实施指数退避 |
| 500 | 服务器错误 | 带退避重试 |

---

## 测试计划

### 单元测试

```typescript
describe('NanoBananaProvider - Pro 模型', () => {
  it('应使用 Pro 模型生成文生图', async () => {
    const result = await provider.generateImage({
      prompt: '测试提示词',
      model: 'nano-banana-pro',
      resolution: '4K',
      aspect_ratio: '16:9',
      image_input: [],
    });

    expect(result.status).toBe('pending');
    expect(result.taskId).toBeTruthy();
    expect(result.metadata?.model).toBe('nano-banana-pro');
  });

  it('应处理多输入图片的图生图', async () => {
    const result = await provider.generateImage({
      prompt: '转换这些图片',
      model: 'nano-banana-pro',
      image_input: ['url1', 'url2', 'url3'],
    });

    expect(result.metadata?.image_input_count).toBe(3);
  });

  it('应正确计算积分(所有分辨率均为 3)', () => {
    expect(calculateImageCredits('nano-banana-pro')).toBe(3);
  });

  it('应验证 Pro 模型参数', () => {
    expect(() => {
      provider.validateRequest({
        prompt: '测试',
        model: 'nano-banana-pro',
        image_input: new Array(10).fill('url'),  // 图片过多
      });
    }).toThrow('最多支持 8 张输入图片');
  });
});
```

### 集成测试

```bash
# 测试 Pro API 端点
curl -X POST https://api.kie.ai/api/v1/jobs/createTask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KIE_AI_API_KEY" \
  -d '{
    "model": "nano-banana-pro",
    "input": {
      "prompt": "山脉上美丽的日落",
      "image_input": [],
      "aspect_ratio": "16:9",
      "resolution": "4K",
      "output_format": "png"
    },
    "callBackUrl": "https://veo3ai.io/api/ai-callback/nano_banana"
  }'

# 预期响应:
# {
#   "code": 200,
#   "msg": "success",
#   "data": {
#     "taskId": "abc123..."
#   }
# }
```

### 手动测试清单

- [ ] 文生图(1K/2K/4K)
- [ ] 单参考图的图生图
- [ ] 多参考图的图生图(2-8 张图片)
- [ ] 所有 10 种宽高比正确渲染
- [ ] 回调正确更新数据库
- [ ] 积分正确扣除(3 积分)
- [ ] 无效输入的错误处理
- [ ] 回退到标准 API 正常工作
- [ ] PNG 和 JPG 输出正常

---

## 部署策略

### 环境变量

**无需新变量** - 复用现有 `KIE_AI_API_KEY`

```bash
# .env
KIE_AI_API_KEY=your_key_here  # 标准和 Pro API 使用相同密钥
```

### 发布计划

**阶段 1: 开发测试(第 1-2 天)**
- 实现 Pro API 集成
- 本地测试和单元测试
- 修复发现的问题

**阶段 2: 预发布(第 3-4 天)**
- 部署到预发布环境
- 内部测试和验收
- 性能和稳定性验证

**阶段 3: 生产发布(第 5 天)**
- 灰度发布(10% 用户)
- 监控错误率和成功率
- 逐步扩大到 100% 用户

---

## 向后兼容性

### 保证的兼容性

- ✅ **标准 API**: 保持不变,继续工作
- ✅ **现有模型**: `google/nano-banana` 和 `google/nano-banana-edit` 保持功能
- ✅ **回调 URL**: 相同端点 `/api/ai-callback/nano_banana`
- ✅ **数据库**: 无需 schema 变更
- ✅ **积分系统**: 兼容现有计费逻辑

### 迁移路径

**对于现有用户**:
- 无需迁移
- 现有生成记录保持可访问
- 新的 Pro 生成使用相同表结构
- 可选升级到 Pro 模型

---

## 成本分析

### 定价对比

| 模型 | 分辨率 | 积分 | 成本($) | 生成时间 |
|-------|-----------|---------|----------|---------|
| 标准 | 1K | 1 | $0.025 | ~10s |
| 标准编辑 | 1K | 2 | $0.050 | ~15s |
| **Pro** | **1K** | **3** | **$0.075** | ~20s |
| **Pro** | **2K** | **3** | **$0.075** | ~20s |
| **Pro** | **4K** | **3** | **$0.075** | ~20s |

**关键洞察**:
- Pro 模型的统一定价使 4K 生成极具成本效益(与 1K 价格相同)
- 4K 质量提升但成本仅为标准版 3 倍(而非传统的 16 倍)

### 预期 ROI

- **用户收益**: 以 1K 价格获得 4K 质量
- **平台收益**: 简化定价,更易营销
- **转化率**: 预期更高的 Pro 模型使用率

---

## 待明确问题

### 产品决策

1. **默认分辨率**: 应默认为 1K、2K 还是让用户选择?
   - 建议: 默认 1K,允许用户升级
2. **UI 位置**: 在下拉菜单中显示 Pro 模型还是作为单独 tab?
   - 建议: 下拉菜单,标注 "Pro" 徽章
3. **定价展示**: 向用户显示 "3 积分" 还是 "$0.075"?
   - 建议: 显示积分,鼠标悬停显示美元
4. **图片输入 UX**: 参考图片使用拖放还是 URL 输入?
   - 建议: 拖放上传为主,URL 输入为辅

---

## 集成状态

### 已完成 ✅

1. ✅ **配置文件** - 已创建 `config/image-models.ts` (93 行)
   - 定义 3 个模型: `nano-banana`, `nano-banana-edit`, `nano-banana-pro`
   - 辅助函数: `getImageModel()`, `calculateImageCredits()`

2. ✅ **扩展类型** - 修改 `BaseAIProvider.ts`
   - 扩展 `GenerateImageRequest` 接口,添加 `aspect_ratio`, `resolution`, `image_input`
   - 增强 `validateRequest()` 方法,支持 Pro 模型验证 (最长 5000 字符, 最多 8 张图)

3. ✅ **实现 Pro API** - 修改 `NanoBananaProvider.ts`
   - 新增 `NanoBananaProRequest` 接口
   - 实现 `generateWithProApi()` 私有方法 (调用 `/api/v1/jobs/createTask`)
   - 更新 `generateImage()` 和 `editImage()` 方法,自动检测 Pro 模型
   - 添加 Pro 模型到构造函数配置

4. ✅ **更新管理器** - 修改 `AIServiceManager.ts`
   - 导入配置文件并动态加载模型
   - 新增 `getImageModelConfig()` 和 `calculateImageCreditsFromConfig()` 辅助方法

5. ✅ **TypeScript 编译** - 通过所有类型检查
   - 修复 `status` 类型映射 (`'active' | 'inactive'` → `'active' | 'beta' | 'deprecated'`)
   - 构建成功,无错误

6. ✅ **文档** - 完整文档覆盖
   - 技术集成文档: `docs/nano-banana-pro-integration.md`
   - 使用指南: `docs/nano-banana-pro-usage.md`

7. ✅ **前端 UI 集成** - 修改 `ImageGenerationTab.tsx`
   - ✅ 动态模型选择器(显示所有可用模型和积分)
   - ✅ Pro 模型分辨率选择器 (1K/2K/4K)
   - ✅ Pro 模型宽高比选择器 (10 种选项)
   - ✅ 动态积分计算(`calculateImageCredits` 从配置文件读取)
   - ✅ Pro 模型专属 "PRO" 徽章标识
   - ✅ 多图片上传组件支持最多 8 张(从 `maxInputImages` 配置读取)
   - ✅ 自动检测 Pro 模型并传递 `aspect_ratio`/`resolution` 参数

### 待完成 ⏳

1. ⏳ **测试** - 单元测试和集成测试
   - 文生图 1K/2K/4K 测试
   - 图生图单图/多图测试
   - 10 种宽高比验证
   - 参数验证错误处理测试
   - 前端 UI 交互测试

2. ⏳ **部署** - 预发布和生产发布
   - 预发布环境测试
   - 监控 Pro API 调用成功率
   - 积分扣除验证(确认 3 积分正确扣除)
   - 性能监控和优化

---

## 文档修订历史

| 日期 | 版本 | 变更 | 作者 |
|------|---------|---------|--------|
| 2025-11-22 | 1.0 | 初始草稿 | Claude |
| 2025-11-22 | 2.0 | 更新配置文件结构,简化接口 | Claude |
| 2025-11-22 | 3.0 | **后端集成完成** - 更新为已完成状态,添加实际变更摘要 | Claude |
| 2025-11-22 | 4.0 | **前端集成完成** - 添加模型选择器和 Pro 参数控制 | Claude |

---

## 附录: 代码变更摘要

### 已修改的文件

1. ✅ **新建** `config/image-models.ts` - 图片模型配置 (93 行)
   - 3 个模型定义: `nano-banana`, `nano-banana-edit`, `nano-banana-pro`
   - 2 个辅助函数: `getImageModel()`, `calculateImageCredits()`

2. ✅ `services/providers/BaseAIProvider.ts` - 扩展请求类型 (+35 行)
   - `GenerateImageRequest` 接口新增 `aspect_ratio`, `resolution`, `image_input`
   - `validateRequest()` 方法增强 Pro 模型验证逻辑

3. ✅ `services/providers/NanoBananaProvider.ts` - 实现 Pro API (+96 行)
   - 新增 `NanoBananaProRequest` 接口
   - 新增 `generateWithProApi()` 私有方法 (70 行)
   - 更新 `generateImage()` 方法支持 Pro API (26 行新增/修改)
   - 更新 `editImage()` 方法支持 Pro API
   - 构造函数添加 Pro 模型配置

4. ✅ `services/AIServiceManager.ts` - 导入配置文件 (+23 行, -35 行硬编码)
   - 导入 `IMAGE_MODELS`, `getImageModel`, `calculateImageCredits`
   - 动态加载 `nano_banana` provider 模型
   - 新增 2 个辅助方法

5. ✅ **新建** `docs/nano-banana-pro-usage.md` - 使用指南文档 (完整)

6. ✅ `components/blocks/ai-image-generation-tool/ImageGenerationTab.tsx` - 前端集成 (+~150 行)
   - 导入 `IMAGE_MODELS`, `getImageModel`, `calculateImageCredits`
   - 添加模型选择状态 (`selectedModel`, `aspectRatio`, `resolution`)
   - 实现动态模型选择器 UI (支持标准和 Pro 模型)
   - 添加 Pro 模型分辨率选择器 (1K/2K/4K)
   - 添加智能宽高比选择器 (Pro 模型显示 10 种,标准模型显示 6 种)
   - 更新 `handleGenerate` 逻辑,Pro 模型传递 `aspect_ratio`/`resolution` 参数
   - 图片上传组件支持最多 8 张图片(从配置文件 `maxInputImages` 读取)
   - 动态积分计算显示

### 实际变更统计

- **新增文件**: 2 个
  - `config/image-models.ts` (93 行)
  - `docs/nano-banana-pro-usage.md` (完整文档)
- **修改文件**: 4 个
  - `BaseAIProvider.ts` (+35 行)
  - `NanoBananaProvider.ts` (+96 行)
  - `AIServiceManager.ts` (+23 行, -35 行)
  - `ImageGenerationTab.tsx` (+~150 行)
- **净变更**: +362 行代码

### 技术亮点

1. **统一配置**: 所有模型配置集中在 `config/image-models.ts`,类似 `video-models.ts` 架构
2. **自动检测**: 根据 `model` 参数自动选择 Standard 或 Pro API
3. **向后兼容**: 标准 API 完全保持不变,Pro 模型作为新选项无缝集成
4. **类型安全**: 通过 TypeScript 严格类型检查,构建成功
5. **回调复用**: Pro API 使用相同回调格式,无需修改 `handleCallback()`

### 风险等级

**低** - 变更隔离在 provider 层,不破坏 API 契约,向后兼容现有功能。所有代码已通过 TypeScript 编译检查。
