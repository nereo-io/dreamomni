# Seedance 1.0 视频生成模型使用指南

本指南专门介绍如何使用 Seedance 1.0 AI 视频生成模型，实现专业级 1080p 视频生成和多镜头叙事功能。

## Seedance 1.0 模型特性

### 核心功能

- **1080p 高质量视频**: 生成高分辨率、电影级品质的视频内容
- **多镜头叙事**: 原生支持多镜头叙事视频创作，保持视觉一致性
- **电影美学**: 平滑运动、丰富细节和电影美学效果
- **风格多样性**: 支持从写实主义到赛博朋克、插画等多种视觉风格
- **复杂提示理解**: 精确解读自然语言指令，实现创意控制
- **多智能体交互**: 控制角色互动和摄像机运动

### 支持的模型

#### Seedance 1.0 文本转视频
- **模型 ID**: `seedance-1-0-text-to-video`
- **端点**: `fal-ai/seedance-1.0/text-to-video`
- **功能**: 基于文本描述生成专业级 1080p 视频
- **特点**: 多镜头叙事、电影美学、风格多样性

#### Seedance 1.0 图片转视频
- **模型 ID**: `seedance-1-0-image-to-video`
- **端点**: `fal-ai/seedance-1.0/image-to-video`
- **功能**: 将静态图片转换为动态 1080p 视频
- **特点**: 视觉一致性、自然运动、风格适应

## 生成参数

### 必需参数

#### 文本转视频模式
- `prompt` (string): 视频描述文本，支持复杂的创意指令

#### 图片转视频模式
- `prompt` (string): 视频描述文本
- `image_url` (string): 输入图片 URL

### 可选参数

- `duration` (number): 视频时长，支持 5 或 8 秒，默认 8 秒
- `aspect_ratio` (string): 宽高比，支持 "16:9", "9:16", "1:1"，默认 "16:9"
- `style` (string): 视觉风格，如 "photorealism", "cyberpunk", "illustration" 等
- `camera_movement` (string): 摄像机运动类型，如 "static", "pan", "zoom", "dolly"
- `mood` (string): 氛围设定，如 "cinematic", "dramatic", "peaceful", "energetic"

## 使用示例

### 基础文本转视频

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "A cinematic drone shot flying over a futuristic city at sunset with neon lights reflecting on glass buildings, smooth camera movements",
    "duration": 8,
    "aspect_ratio": "16:9",
    "style": "cinematic"
  }'
```

### 多镜头叙事视频

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "A multi-shot narrative: Close-up of a character looking determined, cut to wide shot of a vast landscape, then medium shot showing character walking forward with purpose",
    "duration": 8,
    "aspect_ratio": "16:9",
    "camera_movement": "dynamic"
  }'
```

### 图片转视频生成

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-image-to-video",
    "prompt": "The person starts walking forward with confident steps, maintaining natural body language and facial expressions",
    "image_url": "https://example.com/portrait.jpg",
    "duration": 8,
    "aspect_ratio": "16:9",
    "style": "photorealism"
  }'
```

### 风格化视频生成

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "Cyberpunk street scene with neon signs, rain reflections, and futuristic vehicles passing by",
    "duration": 8,
    "aspect_ratio": "16:9",
    "style": "cyberpunk",
    "mood": "dramatic"
  }'
```

## 最佳实践

### 提示词优化策略

#### 1. 多镜头叙事提示词
```json
{
  "multi_shot_examples": [
    "Three-shot sequence: Wide establishing shot of a forest clearing, medium shot of a deer looking up alertly, close-up of dewdrops on leaves sparkling in sunlight",
    "Cinematic sequence: Extreme close-up of hands typing on keyboard, cut to medium shot showing focused expression, pull back to wide shot revealing modern office environment",
    "Narrative flow: Bird's eye view of a winding road, tracking shot following a red car, interior shot showing driver's concentrated face"
  ]
}
```

#### 2. 风格控制提示词
```json
{
  "style_prompts": [
    "Photorealistic portrait with natural lighting and authentic facial expressions",
    "Cyberpunk aesthetic with neon lighting, rain effects, and futuristic architecture",
    "Illustrated animation style with vibrant colors and stylized character movements",
    "Film noir atmosphere with dramatic shadows and high contrast lighting"
  ]
}
```

#### 3. 摄像机运动指令
```json
{
  "camera_movements": [
    "Smooth dolly shot moving forward through the scene",
    "Slow zoom in revealing intricate details",
    "Gentle pan following the subject's movement",
    "Dynamic tracking shot maintaining subject in frame",
    "Cinematic crane shot descending from above"
  ]
}
```

### 参数组合建议

#### 电影级别叙事视频
```json
{
  "duration": 8,
  "aspect_ratio": "16:9",
  "style": "cinematic",
  "camera_movement": "dynamic",
  "mood": "dramatic"
}
```

#### 产品展示视频
```json
{
  "duration": 5,
  "aspect_ratio": "16:9",
  "style": "photorealism",
  "camera_movement": "smooth",
  "mood": "professional"
}
```

#### 创意艺术视频
```json
{
  "duration": 8,
  "aspect_ratio": "1:1",
  "style": "illustration",
  "camera_movement": "expressive",
  "mood": "energetic"
}
```

#### 社交媒体内容
```json
{
  "duration": 5,
  "aspect_ratio": "9:16",
  "style": "vibrant",
  "camera_movement": "engaging",
  "mood": "upbeat"
}
```

## 高级功能

### 角色交互控制

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "Two characters having an animated conversation: Character A gestures expressively while speaking, Character B listens intently and responds with subtle nods, natural eye contact and body language throughout",
    "duration": 8,
    "multi_agent": true
  }'
```

### 环境叙事

```bash
curl -X POST http://localhost:3000/api/video-generation \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "Environmental storytelling: Camera starts on a busy coffee shop, slowly focuses on steam rising from a cup, then reveals hands holding the cup, finally shows the person reading with a peaceful expression",
    "duration": 8,
    "narrative_focus": "environmental"
  }'
```

## 异步处理

对于复杂的多镜头叙事视频，建议使用异步处理：

```bash
curl -X POST http://localhost:3000/api/video-generation/submit \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance-1-0-text-to-video",
    "prompt": "Complex multi-shot narrative with character development, environmental transitions, and dynamic camera work",
    "duration": 8,
    "webhook_url": "https://your-domain.com/webhook/seedance-complete"
  }'
```

## 质量优化提示

### 1. 细节丰富度
- 描述具体的视觉细节和纹理
- 包含光照、色彩和氛围描述
- 指定材质和表面特性

### 2. 运动自然度
- 描述运动的节奏和流畅度
- 包含物理真实性指示
- 考虑重力和惯性效果

### 3. 情感表达
- 描述角色的情感状态
- 包含面部表情和肢体语言
- 指定情感的强度和变化

## 性能和费用优化

### 生成时间
- **5 秒视频**: 约 3-5 分钟生成时间
- **8 秒视频**: 约 5-8 分钟生成时间
- **复杂多镜头**: 可能需要额外时间

### 费用结构
- **每秒费用**: 8 积分 (约 $0.20 USD)
- **5 秒视频**: 40 积分 (约 $1.00 USD)
- **8 秒视频**: 64 积分 (约 $1.60 USD)

### 优化建议
1. **测试阶段使用 5 秒时长**进行概念验证
2. **批量生成**多个变体进行比较
3. **缓存成功的参数组合**供重复使用
4. **使用异步处理**避免超时问题

## 常见问题

### Q: Seedance 1.0 与其他模型的区别？
A: Seedance 1.0 专注于 1080p 高质量输出、多镜头叙事能力，以及对复杂创意指令的精确理解。

### Q: 如何实现最佳的多镜头效果？
A: 在提示词中明确描述镜头切换，使用"cut to"、"transition to"等指令，并保持视觉一致性。

### Q: 支持哪些视频风格？
A: 支持写实主义、赛博朋克、插画、动画、电影noir等多种风格，可在提示词中指定。

### Q: 如何控制摄像机运动？
A: 通过描述具体的摄像机动作，如"dolly shot"、"crane movement"、"tracking shot"等。

## 技术支持

如需了解更多 Seedance 1.0 的高级功能或遇到技术问题，请联系技术支持团队。