# Seedance AI 视频生成 API

本项目集成了 [fal.ai](https://fal.ai) 的视频生成 API，支持 Seedance 1.0 和其他 AI 视频模型，专注于高质量 1080p 视频生成和多镜头叙事功能。

## 环境配置

确保在环境变量中设置了 `FAL_KEY`：

```bash
export FAL_KEY="your-fal-api-key"
```

## API 端点

### 1. 同步视频生成 (`/api/video-generation`)

直接生成视频并等待结果返回。适用于快速测试和较短的视频生成任务。

**请求方法**: `POST`

**请求参数**:

- `model` (必需): 视频生成模型
- `prompt` (必需): 视频描述文本
- `image_url` (图片转视频时必需): 输入图片 URL
- `aspect_ratio`: 视频宽高比 (默认: "16:9")
- `resolution`: 视频分辨率 (默认: "720p")
- `num_frames`: 视频帧数
- `frames_per_second`: 帧率 (默认: 16)
- `negative_prompt`: 负面提示词
- `seed`: 随机种子
- `enable_safety_checker`: 是否启用安全检查 (默认: true)

### 2. 异步任务提交 (`/api/video-generation/submit`)

将视频生成任务提交到队列中，适用于长时间运行的任务。

**请求方法**: `POST`

支持所有同步生成的参数，额外支持：

- `webhook_url`: 任务完成时的回调 URL

### 3. 状态查询 (`/api/video-generation/status`)

查询视频生成任务的状态。

**请求方法**: `POST` 或 `GET`

**参数**:

- `model` (必需): 模型端点
- `requestId` (必需): 任务请求 ID

### 4. 结果获取 (`/api/video-generation/result`)

获取已完成的视频生成结果。

**请求方法**: `POST` 或 `GET`

**参数**:

- `model` (必需): 模型端点
- `requestId` (必需): 任务请求 ID

### 5. 模型列表 (`/api/video-generation/models`)

获取所有支持的视频生成模型及其详细信息。

**请求方法**: `GET`

### 6. 健康检查 (`/api/video-generation/health`)

检查 API 服务状态和配置。

**请求方法**: `GET`

## 支持的模型

### 主要模型 - Seedance 1.0

- `seedance-1-0-text-to-video`: Seedance 1.0 文本转视频 - 专业级 1080p 视频生成，支持多镜头叙事和电影美学
- `seedance-1-0-image-to-video`: Seedance 1.0 图片转视频 - 将图片转换为高质量 1080p 视频，支持风格多样性

### 文本转视频模型 (Legacy)

- `kling-2-1-text-to-video-master`: Kling 2.1 Master 文本转视频
- `kling-1-6-text-to-video-pro`: Kling 1.6 Pro 文本转视频
- `kling-1-6-text-to-video-std`: Kling 1.6 Standard 文本转视频

### 图片转视频模型 (Legacy)

- `kling-2-1-image-to-video-master`: Kling 2.1 Master 图片转视频
- `kling-2-1-image-to-video-pro`: Kling 2.1 Pro 图片转视频
- `kling-1-6-image-to-video-std`: Kling 1.6 Standard 图片转视频

## 使用示例

### Seedance 1.0 文本转视频

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "A cinematic shot of a futuristic city at sunset with smooth camera movements and rich details",
    "aspect_ratio": "16:9",
    "duration": 8
  }'
```

### Seedance 1.0 图片转视频

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-image-to-video",
    "prompt": "The person starts walking with natural motion and cinematic aesthetics",
    "image_url": "https://example.com/person.jpg",
    "aspect_ratio": "16:9",
    "duration": 8
  }'
```

### 异步任务提交

```bash
curl -X POST http://localhost:3000/api/video-generation/submit \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "A multi-shot narrative with complex character interactions and camera movements",
    "webhook_url": "https://your-domain.com/webhook/video-complete"
  }'
```

### 获取模型列表

```bash
curl -X GET http://localhost:3000/api/video-generation/models
```

### 健康检查

```bash
curl -X GET http://localhost:3000/api/video-generation/health
```

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "video_url": "https://storage.googleapis.com/...",
    "seed": 12345,
    "model": "seedance-1-0-text-to-video",
    "requestId": "abc123...",
    "duration": 5.0,
    "metadata": {
      "prompt": "...",
      "aspect_ratio": "16:9",
      "resolution": "720p"
    }
  }
}
```

### 错误响应

```json
{
  "code": -1,
  "message": "错误信息"
}
```

## 测试

项目包含了完整的 HTTP 测试文件 `debug/apitest.http`，可以使用 VS Code 的 REST Client 扩展或类似工具进行测试。

## 注意事项

1. 视频生成是计算密集型任务，根据模型和参数不同，生成时间可能从几分钟到几十分钟不等
2. 对于长时间运行的任务，建议使用异步提交方式
3. 图片转视频模型需要提供有效的 `image_url` 参数
4. 不同模型支持的参数可能略有差异，请参考 fal.ai 官方文档
5. 确保有足够的 fal.ai 积分来运行视频生成任务

## 链接

- [fal.ai 官方文档](https://docs.fal.ai/)
- [fal.ai 视频模型列表](https://fal.ai/video)
- [fal.ai 视频生成指南](https://docs.fal.ai/guides/generating-videos-from-image/)
