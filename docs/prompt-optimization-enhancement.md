# Prompt 优化功能实施指南

> 基于 commit `4ec2d4a98bbb67bf89e1e1076f10dfed996e1105` 的功能增强

## 📋 功能概述

这个增强功能为视频生成系统添加了智能 Prompt 优化能力，让用户能够：

- 实时查看 Prompt 优化过程
- 对比原始和优化后的 Prompt
- 获得更好的用户体验和教育价值
- 提升对 AI 系统的信任度

## 🎯 用户体验改进

### Before vs After

| 方面           | 优化前                       | 优化后                                     |
| -------------- | ---------------------------- | ------------------------------------------ |
| **提交反馈**   | 需等待 3-5 秒才有反馈        | 立即显示提交状态                           |
| **过程透明度** | 黑盒操作，不知道系统在做什么 | 清楚显示"正在优化 Prompt"                  |
| **教育价值**   | 只能看到最终结果             | 可对比学习优化前后差异                     |
| **状态精细度** | 粗糙状态：提交 → 生成 → 完成 | 精细状态：提交 → 优化 → 排队 → 生成 → 完成 |

## 🔧 技术实现

### 1. 数据结构变化

```typescript
// 添加新的状态类型
interface VideoGenerationResult {
  id: string;
  model: string;
  status: string;
  prompt: string;
  optimized_prompt?: string; // 新增字段
  video_url?: string;
  error_message?: string;
  created_at?: string;
  // ... 其他字段
}

// 新增状态类型
type GenerationStatus =
  | "submitted"
  | "PROMPT_OPTIMIZING" // 新增状态
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "completed"
  | "failed";
```

### 2. API 接口变化

#### 2.1 状态查询接口 (`/api/video-generation/status`)

**GET 方法响应增加字段：**

```typescript
return respJson({
  id: videoGeneration?.id,
  requestId: finalRequestId,
  status: videoGeneration?.status || "unknown",
  prompt: videoGeneration?.prompt,
  optimized_prompt: videoGeneration?.optimized_prompt, // 新增
  logs: videoGeneration?.logs || [],
  metrics: videoGeneration?.metrics || {},
  videoGeneration: videoGeneration,
});
```

**POST 方法响应增加字段：**

```typescript
return respJson({
  // ... 其他字段
  prompt: videoGeneration.prompt,
  optimized_prompt: videoGeneration.optimized_prompt, // 新增
  video_url:
    videoGeneration.video_url_r2 ||
    videoGeneration.video_url_volcano ||
    videoGeneration.video_url,
  // ...
});
```

### 3. 前端组件改进

#### 3.1 视频生成器组件 (`components/blocks/video-generator/index.tsx`)

**立即反馈机制：**

```typescript
// 立即设置初始生成状态，给用户即时反馈
const initialGeneration = {
  id: `temp-${Date.now()}`,
  requestId: `temp-request-${Date.now()}`,
  model: selectedModel,
  status: "submitted",
  prompt: description.trim(),
  optimized_prompt: undefined,
  video_url: undefined,
  error_message: undefined,
  created_at: new Date().toISOString(),
  aspect_ratio: aspectRatio,
  duration_seconds: parseInt(duration),
};

// 直接设置完整的初始状态
updateCurrentGeneration({
  ...initialGeneration,
});
```

#### 3.2 视频结果组件 (`components/blocks/video-result/index.tsx`)

**新增状态映射：**

```typescript
const getStatusMap = (t: any) => ({
  // ... 现有状态
  PROMPT_OPTIMIZING: {
    label: t("status.optimizingPrompt"),
    color: "bg-purple-500",
    icon: Loader2,
  },
  // ...
});
```

**Prompt 对比展示：**

```jsx
{
  /* 原始Prompt */
}
<div className="bg-muted/50 border border-border rounded-lg p-4">
  <h3 className="font-medium mb-2 text-foreground flex items-center gap-2">
    {t("originalPrompt")}
    {generation.status === "PROMPT_OPTIMIZING" && (
      <div className="flex items-center gap-1 text-purple-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">{t("optimizing")}</span>
      </div>
    )}
  </h3>
  <p className="text-sm text-muted-foreground leading-relaxed max-h-24 overflow-y-auto">
    {generation.prompt}
  </p>
</div>;

{
  /* 优化后Prompt - 可折叠设计 */
}
{
  generation.optimized_prompt &&
    generation.optimized_prompt !== generation.prompt && (
      <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-lg p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowOptimizedPrompt(!showOptimizedPrompt)}
        >
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            {t("optimizedPrompt")}
            <Badge
              variant="outline"
              className="text-xs bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700"
            >
              {t("enhanced")}
            </Badge>
          </h3>
          {showOptimizedPrompt ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {showOptimizedPrompt && (
          <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-700/50">
            <p className="text-sm text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
              {generation.optimized_prompt}
            </p>
          </div>
        )}
      </div>
    );
}
```

#### 3.3 状态管理 Hook (`hooks/useVideoGeneration.ts`)

**优化的状态更新逻辑：**

```typescript
// 构建更新数据，保持现有的 created_at 不变
const updates: Partial<VideoGenerationResult> = {
  id: result.data.id,
  requestId: result.data.requestId,
  model: result.data.model,
  status: result.data.metadata?.optimized_prompt
    ? "PROMPT_OPTIMIZING"
    : "IN_QUEUE",
  optimized_prompt: result.data.metadata?.optimized_prompt,
};

// 如果当前没有生成记录，创建完整记录
if (!currentGeneration) {
  const newGeneration: VideoGenerationResult = {
    id: result.data.id,
    requestId: result.data.requestId,
    model: result.data.model,
    status: "submitted",
    prompt: params.prompt,
    aspect_ratio: params.aspect_ratio,
    duration_seconds: parseInt(params.duration || "5"),
    created_at: new Date().toISOString(),
    optimized_prompt: result.data.metadata?.optimized_prompt,
  };
  setCurrentGeneration(newGeneration);
} else {
  // 如果已有记录，只更新必要字段，保持 created_at 不变
  setCurrentGeneration((prev) => (prev ? { ...prev, ...updates } : null));
}
```

**改进的更新函数：**

```typescript
const updateCurrentGeneration = useCallback(
  (updates: Partial<VideoGenerationResult>) => {
    setCurrentGeneration((prev) =>
      prev ? { ...prev, ...updates } : (updates as VideoGenerationResult)
    );
  },
  []
);
```

### 4. 国际化文本

#### 4.1 英文 (`i18n/messages/en.json`)

```json
{
  "video-result": {
    "status": {
      "submitted": "Submitted",
      "optimizingPrompt": "Optimizing Prompt",
      "inQueue": "In Queue",
      "generating": "Generating",
      "completed": "Completed",
      "failed": "Failed"
    },
    "optimizingPrompt": "Optimizing your prompt for better results, estimated time remaining: {time}",
    "originalPrompt": "Original Prompt",
    "optimizedPrompt": "Enhanced Prompt",
    "enhanced": "Enhanced",
    "optimizing": "Optimizing..."
  }
}
```

#### 4.2 俄文 (`i18n/messages/ru.json`)

```json
{
  "video-result": {
    "status": {
      "submitted": "Отправлено",
      "optimizingPrompt": "Оптимизация запроса",
      "inQueue": "В очереди",
      "generating": "Генерация",
      "completed": "Завершено",
      "failed": "Не удалось"
    },
    "optimizingPrompt": "Оптимизируем ваш запрос для лучших результатов, примерное время ожидания: {time}",
    "originalPrompt": "Исходный запрос",
    "optimizedPrompt": "Улучшенный запрос",
    "enhanced": "Улучшено",
    "optimizing": "Оптимизация..."
  }
}
```

## 🚀 实施步骤

### 步骤 1: 更新数据模型

1. 在数据库表中添加 `optimized_prompt` 字段
2. 更新 TypeScript 接口定义
3. 添加新的状态类型 `PROMPT_OPTIMIZING`

### 步骤 2: 修改 API 接口

1. 更新视频生成状态 API 的响应格式
2. 确保返回 `optimized_prompt` 字段
3. 处理新的状态流转逻辑

### 步骤 3: 更新前端组件

1. 修改视频生成器组件，添加立即反馈机制
2. 更新视频结果组件，支持 Prompt 对比展示
3. 添加可折叠交互设计

### 步骤 4: 更新状态管理

1. 修改 `useVideoGeneration` Hook
2. 优化状态更新逻辑
3. 确保数据一致性

### 步骤 5: 添加国际化支持

1. 为所有支持的语言添加相关文本
2. 更新状态映射和消息提示

### 步骤 6: 样式优化

1. 添加渐变背景样式
2. 实现折叠/展开动画
3. 优化视觉层次

## 🎨 样式指南

### CSS 类名参考

```css
/* 优化后 Prompt 容器样式 */
.optimized-prompt-container {
  @apply bg-gradient-to-r from-purple-50/50 to-blue-50/50 
         dark:from-purple-900/20 dark:to-blue-900/20 
         border border-purple-200/50 dark:border-purple-700/50 
         rounded-lg p-4;
}

/* 增强标签样式 */
.enhanced-badge {
  @apply text-xs bg-purple-100 dark:bg-purple-900/50 
         border-purple-200 dark:border-purple-700;
}

/* 分隔线样式 */
.prompt-divider {
  @apply border-t border-purple-200/50 dark:border-purple-700/50;
}
```

## 🔍 关键图标

需要的 Lucide React 图标：

```typescript
import {
  Loader2, // 加载动画
  ChevronDown, // 折叠指示
  ChevronUp, // 展开指示
  Sparkles, // 增强效果图标
} from "lucide-react";
```

## ⚠️ 注意事项

1. **状态一致性**：确保前端状态与后端状态保持同步
2. **性能考虑**：避免频繁的状态更新导致组件重渲染
3. **错误处理**：处理 Prompt 优化失败的情况
4. **向后兼容**：确保没有 `optimized_prompt` 的历史记录正常显示
5. **移动端适配**：确保折叠交互在移动设备上友好

## 📈 预期效果

实施这个功能后，预期能够：

- **提升用户满意度**：通过透明的过程和教育价值
- **增加用户粘性**：用户能学会写更好的 Prompt
- **建立信任感**：展示 AI 系统的专业能力
- **减少重复生成**：优化后的 Prompt 生成更好的结果

## 🧪 测试清单

- [ ] 提交视频生成请求后立即显示状态
- [ ] Prompt 优化状态正确显示
- [ ] 优化后 Prompt 正确显示和折叠
- [ ] 各种语言的文本显示正确
- [ ] 移动端交互体验良好
- [ ] 错误情况处理正确
- [ ] 历史记录兼容性测试

---

_这个功能增强将显著提升用户体验，让视频生成从工具使用变成学习和成长的过程。_
