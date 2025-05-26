# Kling 视频生成模型使用指南

本指南专门介绍如何使用 Kling 1.6 和 Kling 2.0 Master 视频生成模型。

## 支持的 Kling 模型

### Kling 1.6 Pro 版

- **模型 ID**: `kling-1-6-pro`
- **图片转视频端点**: `fal-ai/kling-video/v1.6/pro/image-to-video`
- **文本转视频端点**: `fal-ai/kling-video/v1.6/pro/text-to-video`
- **特点**: 稳定可靠的高质量视频生成
- **适用场景**: 日常视频创作、基础动画生成、专业内容制作

### Kling 2.0 Master

- **模型 ID**: `kling-2-0-master`
- **图片转视频端点**: `fal-ai/kling-video/v2/master/image-to-video`
- **文本转视频端点**: `fal-ai/kling-video/v2/master/text-to-video`
- **特点**: 增强的文本理解和运动质量
- **适用场景**: 专业视频制作、复杂动作序列

## Kling 模型生成模式

### 文本转视频（Text-to-Video）

- **必需参数**:
  - `prompt` (string): 视频描述文本
- **可选参数**: 同下
- **说明**: 仅基于文本描述生成视频，无需上传图片

### 图片转视频（Image-to-Video）

- **必需参数**:
  - `prompt` (string): 视频描述文本
  - `image_url` (string): 输入图片的 URL
- **可选参数**: 同下
- **说明**: 基于参考图片和文本描述生成视频

## Kling 模型通用参数

### 可选参数

- `duration` (string): 视频时长，支持 "5" 或 "10" 秒，默认 "5"
- `aspect_ratio` (string): 宽高比，支持 "16:9", "9:16", "1:1"，默认 "16:9"
- `negative_prompt` (string): 负面提示词，默认 "blur, distort, and low quality"
- `cfg_scale` (float): CFG 引导强度，范围 0-1，默认 0.5

## CFG Scale 参数详解

CFG (Classifier Free Guidance) Scale 控制模型对提示词的遵循程度：

- **0.1-0.3**: 低引导强度，更自然的运动，创意性更高
- **0.4-0.6**: 中等引导强度，平衡的效果（推荐）
- **0.7-1.0**: 高引导强度，严格遵循提示词，可能略显僵硬

### CFG Scale 使用建议

| 场景         | 推荐值  | 说明               |
| ------------ | ------- | ------------------ |
| 自然风景动画 | 0.2-0.4 | 保持自然流动感     |
| 人物动作     | 0.4-0.6 | 平衡表现力和自然度 |
| 特定动作要求 | 0.6-0.8 | 精确控制动作       |
| 创意实验     | 0.1-0.3 | 让模型发挥创造力   |

## 使用示例

### 基础图片转视频（Kling 1.6 Pro）

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-1-6-pro",
    "prompt": "A gentle butterfly landing on a flower and fluttering its wings",
    "image_url": "https://example.com/flower.jpg",
    "duration": "5",
    "aspect_ratio": "16:9",
    "cfg_scale": 0.4
  }'
```

### 文本转视频（Kling 1.6 Pro）

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-1-6-pro",
    "prompt": "A majestic dragon flying through ancient mountains with clouds swirling around its wings",
    "duration": "5",
    "aspect_ratio": "16:9",
    "cfg_scale": 0.5
  }'
```

### 高质量动作序列（Kling 2.0 Master）

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-2-0-master",
    "prompt": "A cinematic slow-motion sequence of raindrops hitting water surface, creating ripples that expand outward in perfect circles",
    "image_url": "https://example.com/water.jpg",
    "duration": "10",
    "aspect_ratio": "16:9",
    "cfg_scale": 0.6,
    "negative_prompt": "static water, no movement, poor lighting"
  }'
```

### 异步任务提交

```bash
curl -X POST http://localhost:3000/api/video-generation/submit \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kling-2-0-master",
    "prompt": "A majestic eagle soaring through mountain peaks at golden hour",
    "image_url": "https://example.com/mountains.jpg",
    "duration": "10",
    "aspect_ratio": "16:9",
    "cfg_scale": 0.7,
    "webhook_url": "https://your-domain.com/webhook/video-complete"
  }'
```

## 最佳实践

### 提示词优化

1. **具体描述**: 明确指出想要的动作和效果
2. **摄像机运动**: 可以描述摄像机移动（慢镜头、特写等）
3. **时间描述**: 可以包含时间相关的描述（缓慢、快速等）
4. **环境细节**: 描述光照、天气、氛围等

### 示例优质提示词

```json
{
  "good_prompts": [
    "A close-up shot of dewdrops on flower petals gently swaying in the morning breeze, with soft golden sunlight creating sparkles",
    "Cinematic sequence of waves gently lapping against the shore at sunset, with the camera slowly pulling back to reveal the coastline",
    "Slow-motion capture of a hummingbird hovering near colorful flowers, wings beating rapidly creating a mesmerizing display",
    "A peaceful scene of falling autumn leaves drifting down in a forest clearing, with dappled sunlight filtering through trees"
  ]
}
```

### 参数组合建议

#### 自然场景（推荐）

```json
{
  "duration": "10",
  "aspect_ratio": "16:9",
  "cfg_scale": 0.3,
  "negative_prompt": "artificial, robotic movement, harsh lighting"
}
```

#### 动作场景

```json
{
  "duration": "5",
  "aspect_ratio": "16:9",
  "cfg_scale": 0.6,
  "negative_prompt": "static, motionless, blurry motion"
}
```

#### 肖像/特写

```json
{
  "duration": "5",
  "aspect_ratio": "9:16",
  "cfg_scale": 0.5,
  "negative_prompt": "distorted face, unnatural expression, poor lighting"
}
```

## WebSocket 实时生成

对于需要实时监控生成进度的应用，可以使用 WebSocket：

```javascript
// 获取 WebSocket 连接信息
const response = await fetch("/api/video-generation/websocket", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "kling-2-0-master",
    prompt: "Your prompt here",
    image_url: "https://example.com/image.jpg",
    duration: "10",
    cfg_scale: 0.6,
  }),
});

const { websocket_endpoint, payload } = await response.json();

// 建立 WebSocket 连接
const ws = new WebSocket(websocket_endpoint);

ws.onopen = () => {
  ws.send(JSON.stringify(payload));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "end") {
    console.log("Video generated:", data.response.video.url);
  }
};
```

## 错误处理

### 常见错误及解决方案

1. **图片格式错误**

   - 确保图片是 JPEG, PNG, WebP 格式
   - 图片尺寸建议不超过 2048x2048

2. **CFG Scale 值无效**

   - 确保值在 0-1 范围内
   - 使用浮点数格式

3. **Duration 参数错误**

   - 只支持字符串 "5" 或 "10"
   - 不要使用数字格式

4. **API 配额不足**
   - 检查 fal.ai 账户余额
   - 考虑优化生成频率

## 性能优化建议

1. **批量处理**: 使用异步提交处理多个视频
2. **缓存结果**: 对相同参数的请求进行缓存
3. **合理时长**: 5 秒视频比 10 秒生成更快
4. **图片优化**: 使用合适分辨率的输入图片

## 费用说明

- **Kling 1.6 Pro**: 高性价比选择，适合大多数场景
- **Kling 2.0 Master**: 费用较高，适合高质量需求
- **时长影响**: 10 秒视频费用约为 5 秒的 2 倍

根据 fal.ai 官方定价，建议在测试阶段使用 5 秒时长，确认效果后再生成长视频。

## 自动模型选择策略

为了简化用户体验，系统会自动选择合适的模型：

1. **有图片上传**: 自动使用 Kling 1.6 Pro Image-to-Video
2. **无图片上传**: 自动使用 Kling 1.6 Pro Text-to-Video

这样既保证了生成质量，又避免了用户需要理解不同模型的复杂性。
