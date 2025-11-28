# Seedance Pro 模型 Volcano 降级方案

> **临时方案**：为降低成本，Seedance Pro 模型优先使用 Volcano Engine（便宜但成功率偏低），失败后自动降级到 BytePlus（稳定但价格较高）。

## 背景

| 供应商 | API 端点 | 价格 | 成功率 |
|--------|----------|------|--------|
| Volcano Engine | `ark.cn-beijing.volces.com` | 便宜 | 偏低 |
| BytePlus | `ark.ap-southeast.bytepluses.com` | 较贵 | 高 |

## 开关控制

通过环境变量控制是否启用降级：

```bash
# 启用降级（优先 Volcano，失败后降级到 BytePlus）
ENABLE_VOLCANO_FALLBACK=true

# 禁用降级（直接使用 BytePlus，原有行为）
ENABLE_VOLCANO_FALLBACK=false  # 或不设置
```

## 工作流程

```
用户提交 Seedance 请求
        ↓
  检查开关是否启用
        ↓
    [启用] → 尝试 Volcano → 成功 → 记录 actual_provider=volcano → 完成
                ↓ 失败
             BytePlus → 完成
        ↓
    [禁用] → 直接 BytePlus → 完成
```

## 改动文件清单

### 1. 新增文件

| 文件 | 说明 |
|------|------|
| `services/seedanceFallbackService.ts` | 独立的降级服务，包含所有降级逻辑 |

### 2. 修改文件

| 文件 | 改动说明 |
|------|----------|
| `app/api/video-generation/submit/route.ts` | 添加 Volcano 降级尝试逻辑，保存 `actual_provider` 到 metadata |
| `services/videoStatusService.ts` | 根据 `metadata.actual_provider` 选择正确的 Provider 查询状态 |

## 详细改动

### services/seedanceFallbackService.ts（新增）

```typescript
// 核心函数

// 1. 检查开关
isVolcanoFallbackEnabled(): boolean

// 2. 检查模型类型
isBytePlusSeedanceModel(modelId: string): boolean

// 3. 尝试 Volcano 提交（失败返回 null）
tryVolcanoSubmit(modelId, input, webhookUrl): Promise<VideoGenerationResponse | null>

// 4. 获取状态查询用的 Provider
getStatusProviderForFallback(actualProvider): VolcanoProvider | null
```

### app/api/video-generation/submit/route.ts

```typescript
// 添加 import
import { tryVolcanoSubmit } from "@/services/seedanceFallbackService";

// 在 provider.submit() 之前添加（约第 471-480 行）
let actualProvider: string | undefined;
const volcanoResponse = await tryVolcanoSubmit(finalModel, input, webhookUrl);
if (volcanoResponse) {
  submitResponse = volcanoResponse;
  actualProvider = "volcano";
}

// 在更新数据库时保存 actual_provider（约第 551-557 行）
if (actualProvider) {
  updateParams.metadata = {
    ...videoGeneration.metadata,
    actual_provider: actualProvider,
  };
}
```

### services/videoStatusService.ts

```typescript
// 添加 import
import { getStatusProviderForFallback } from "@/services/seedanceFallbackService";

// 在 syncStatusFromProvider 和 handleCompletedStatus 中添加
const actualProvider = videoGeneration.metadata?.actual_provider;
const fallbackProvider = getStatusProviderForFallback(actualProvider);
const provider = fallbackProvider || ProviderFactory.getProvider(videoGeneration.model_id);
```

## 数据库影响

在 `video_generations.metadata` 字段中新增：

```json
{
  "actual_provider": "volcano"  // 仅当使用 Volcano 时存在
}
```

## 日志输出

### Volcano 成功
```
🌋 [Volcano Fallback] 尝试使用火山引擎...
🔥 火山引擎视频生成请求参数: {...}
✅ [Volcano Fallback] 火山引擎请求成功, request_id: cgt-xxx
```

### Volcano 失败，降级到 BytePlus
```
🌋 [Volcano Fallback] 尝试使用火山引擎...
⚠️ [Volcano Fallback] 火山引擎失败，将降级到 BytePlus: [错误信息]
🌏 BytePlus 视频生成请求参数: {...}
```

### 状态查询（Volcano）
```
🌋 [Volcano Fallback] 检测到 actual_provider=volcano，使用 VolcanoProvider 查询状态
使用provider查询状态: volcano (fallback), requestId: cgt-xxx
```

## 还原方案

当不再需要降级功能时，按以下步骤还原：

### Step 1: 删除服务文件

```bash
rm services/seedanceFallbackService.ts
```

### Step 2: 还原 submit/route.ts

删除以下代码块：

```typescript
// 1. 删除 import（约第 35 行）
import { tryVolcanoSubmit } from "@/services/seedanceFallbackService";

// 2. 删除 actualProvider 变量和 Volcano 尝试逻辑（约第 473-480 行）
let actualProvider: string | undefined;
const volcanoResponse = await tryVolcanoSubmit(finalModel, input, webhookUrl);
if (volcanoResponse) {
  submitResponse = volcanoResponse;
  actualProvider = "volcano";
}

// 3. 删除保存 actual_provider 的逻辑（约第 551-557 行）
if (actualProvider) {
  updateParams.metadata = {
    ...videoGeneration.metadata,
    actual_provider: actualProvider,
  };
}
```

### Step 3: 还原 videoStatusService.ts

删除以下代码块：

```typescript
// 1. 删除 import（约第 3 行）
import { getStatusProviderForFallback } from "@/services/seedanceFallbackService";

// 2. 删除 syncStatusFromProvider 中的降级检查（约第 98-100 行）
const actualProvider = videoGeneration.metadata?.actual_provider;
const fallbackProvider = getStatusProviderForFallback(actualProvider);
// 并将 provider 赋值改回：
const provider = ProviderFactory.getProvider(videoGeneration.model_id);

// 3. 删除 handleCompletedStatus 中的降级检查（约第 276-278 行）
const actualProvider = videoGeneration.metadata?.actual_provider;
const fallbackProvider = getStatusProviderForFallback(actualProvider);
// 并将 provider 赋值改回：
const provider = ProviderFactory.getProvider(videoGeneration.model_id);
```

### Step 4: 删除环境变量

```bash
# 从 .env.local 和 .env.production 中删除
ENABLE_VOLCANO_FALLBACK=true
```

### Step 5: 验证

```bash
pnpm build  # 确保无编译错误
pnpm dev    # 本地测试
```

## 注意事项

1. **历史数据兼容**：已有的 `metadata.actual_provider=volcano` 记录在还原后不会影响功能，状态查询会正常使用 BytePlus（因为 `getStatusProviderForFallback` 被删除了）

2. **环境变量依赖**：
   - `ENABLE_VOLCANO_FALLBACK` - 开关
   - `ARK_API_KEY` - Volcano Engine API Key（需要已配置代理）

3. **Webhook 兼容**：Volcano 和 BytePlus 使用相同的 webhook 处理逻辑，无需修改

## 相关文件

- `services/providers/VolcanoProvider.ts` - Volcano Engine Provider 实现
- `services/providers/BytePlusProvider.ts` - BytePlus Provider 实现
- `config/video-models.ts` - 模型配置（Volcano model ID: `doubao-seedance-1-0-pro-250528`）
