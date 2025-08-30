# 视频特效系统技术实现方案

## 概述

采用**最小化改动**策略支持 PixVerse 特效，在保持与现有 Hailuo 特效统一用户体验的前提下，扩展支持 PixVerse API 的特效生成能力。

## 设计原则

1. **最小化改动**：复用现有架构，仅在必要处扩展
2. **统一体验**：用户无法区分两种技术路径
3. **向后兼容**：不影响现有 Hailuo 特效功能
4. **类型安全**：严格的 TypeScript 类型定义

## 核心策略

- **Hailuo 特效**：继续使用现有的 `/api/video-generation/submit` API（已支持 effect_id）
- **PixVerse 特效**：新增专门的 `/api/video-effects/pixverse` API 处理多图上传和模板调用
- **前端智能判断**：根据特效类型（effect_type）自动选择对应的 API 端点
- **数据统一存储**：两种特效都存储在相同的 video_generations 表中

## 数据层改动

### 1. 数据库结构调整

#### 新增字段到 `effect_configs` 表

- `effect_type` VARCHAR DEFAULT 'hailuo_prompt'
- `pixverse_template_id` BIGINT NULL
- `max_images` INTEGER DEFAULT 1

#### 新增字段到 `video_generations` 表

- `pixverse_request_id` VARCHAR NULL

#### 数据迁移策略

- 现有数据自动设置 `effect_type = 'hailuo_prompt'`
- `max_images` 默认值为 1，保持向后兼容
- 新增 PixVerse 特效时手动配置相关字段

### 2. TypeScript 类型更新

#### 文件：`types/video-effect.ts`

**状态**：✅ 已更新（新增字段已添加）

#### 文件：`models/effectConfig.ts`

- 无需修改，现有查询方法自动支持新字段
- 类型推断会自动包含新增字段

#### 文件：`models/videoGeneration.ts`

**改动内容**：✅ 已完成

- 新增 `getVideoGenerationByPixVerseRequestId()` 方法
- 新增 `updateVideoGenerationByPixVerseRequestId()` 方法
- 支持通过 PixVerse request ID 查询和更新记录

## 架构设计

### 3. 现有系统复用

#### Hailuo 特效（无需改动）

- **API 端点**：继续使用 `/api/video-generation/submit`
- **处理逻辑**：现有代码已支持 effect_id 参数和 prompt 模板应用
- **模型选择**：自动使用 `minimax-hailuo02-image-to-video`
- **数据存储**：video_generations 表，effect_id 字段关联特效

#### PixVerse 特效（新增支持）

由于 PixVerse 需要多图上传和模板 ID，需要专门的处理逻辑。

### 4. PixVerse 特效 API 架构

#### 分离式 API 设计（✅ 已实现）

为了提供更好的灵活性和用户体验，PixVerse API 采用分离式设计：

##### 4.1 图片上传端点：`/api/video-effects/pixverse/upload`

**功能**：独立处理图片上传到 PixVerse
**支持格式**：

- JSON: 传入 `imageUrl` 自动下载
- FormData: 直接上传本地文件
  **返回值**：`imgId` 和 `imgUrl`

##### 4.2 视频生成端点：`/api/video-effects/pixverse/generate`

**功能**：使用已上传的图片生成视频
**核心参数**：

- `effectId`: 特效配置 ID
- `imgIds`: 支持单个或多个图片 ID
- `prompt`: 生成提示词
  **特性**：
- 自动处理单图/多图模板差异（img_id vs img_ids）
- 失败时自动退还积分
- template_id 自动转换为数字类型

## API 层改动

### 5. 视频生成 API 增强

#### 文件：`app/api/video-generation/submit/route.ts`

**改动内容**：

- 保持现有逻辑不变
- 继续支持 effect_id 参数处理 Hailuo 特效
- 应用 prompt 模板和特效积分配置

### 6. 状态查询增强

#### 文件：`app/api/video-generation/status/[taskId]/route.ts`

**改动内容**：

- 扩展支持 PixVerse 状态查询
- 如果记录有 pixverse_request_id 且状态为进行中，主动查询 PixVerse 状态
- 统一状态格式转换
- PixVerse 状态码映射规则

**PixVerse 状态码映射**：

- 1: "COMPLETED" (生成成功)
- 5: "IN_PROGRESS" (生成中)
- 6: "FAILED" (已删除)
- 7: "FAILED" (内容审核失败)
- 8: "FAILED" (生成失败)

response 数据结构
{
"ErrCode": 0,
"ErrMsg": "string",
"Resp": {
"create_time": "string",
"id": 0,
"modify_time": "string",
"negative_prompt": "string",
"outputHeight": 0,
"outputWidth": 0,
"prompt": "string",
"resolution_ratio": 0,
"seed": 0,
"size": 0,
"status": 0,
"style": "string",
"url": "string"
}
}

## 前端组件改动

### 7. 特效生成工具更新

#### 文件：`components/blocks/ai-video-generation-tool.tsx`

**智能路由逻辑**：

- 根据 `effect_type` 选择 API 端点
- `hailuo_prompt` → 使用现有 `/api/video-generation/submit`
- `pixverse_template` → 使用新的 `/api/video-effects/pixverse`

**UI 动态适配**：

- 根据 `effect.max_images` 调整上传界面
- 多图上传的 UI 状态管理
- 上传进度和错误反馈

## 环境配置

### 9. 环境变量新增

#### 文件：`.env.local` / `.env.example`

**新增配置**：

- `PIXVERSE_API_KEY=your-pixverse-api-key`

#### 环境变量验证

- PixVerse API 初始化时验证 API Key
- 开发环境下的调试模式配置

## 错误处理和监控
