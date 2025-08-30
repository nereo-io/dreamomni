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

### 4. PixVerse 特效专用 API

#### 新增文件：`app/api/video-effects/pixverse/route.ts`

**核心流程**：

1. 用户认证和积分检查（复用现有逻辑）
2. 解析表单数据（支持多图上传）
3. 获取特效配置并验证类型
4. 扣除积分（复用现有逻辑）
5. 创建数据库记录（与现有流程一致）
6. 调用 PixVerse API（两步：上传图片 → 生成视频）
7. 更新 pixverse_request_id

**PixVerse API 调用逻辑**：

- 上传图片到 PixVerse 获取 img_id
- 调用模板生成 API，传入 template_id、img_ids、prompt

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

### 10. 错误处理策略

#### PixVerse 特有错误处理

- 图片上传失败重试机制
- API 限流和配额管理
- 内容审核失败的用户友好提示
- 网络超时和连接错误恢复

#### 统一错误格式

- 两种特效模式返回相同的错误结构
- 用户无法感知底层技术差异
- 开发调试时保留详细错误信息

### 11. 日志和监控

#### 新增监控指标

- PixVerse API 调用成功率
- 图片上传成功率和耗时
- 特效生成时长统计
- 不同特效类型的使用量分析

## 测试策略

### 12. 单元测试

#### 新增测试文件

- `tests/api/video-effects-pixverse.test.ts`
- `tests/components/ai-video-generation-tool.test.ts`

#### 测试覆盖范围

- PixVerse API 交互测试（Mock）
- 特效类型路由逻辑
- 错误处理和边界情况
- 图片上传和格式转换
