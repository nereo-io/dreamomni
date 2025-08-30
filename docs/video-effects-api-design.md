# 视频特效专用API接口设计

## 设计理念

基于PixVerse特效的独特需求（图片上传+模板ID），设计专门的特效API接口，与传统视频生成API分离，提供更清晰的职责划分和更好的用户体验。

## 核心差异分析

### 传统视频生成 vs 特效生成

| 特性 | 传统视频生成 | PixVerse特效生成 |
|------|-------------|-----------------|
| **输入** | 文本prompt + 可选图片URL | 图片文件 + 模板ID + 描述文本 |
| **图片处理** | 直接使用URL | 必须上传获取img_id |
| **图片数量** | 0-1张 | 1-2张（根据模板） |
| **核心参数** | modelId + prompt | effectId + template_id |
| **处理流程** | 单步API调用 | 两步（上传+生成） |

## 新API接口设计

### 1. 特效生成提交接口

#### 路径：`/api/video-effects/generate`

```typescript
POST /api/video-effects/generate

Content-Type: multipart/form-data

// 请求参数
interface EffectGenerationRequest {
  effectId: string;              // 特效ID（从effect_configs表）
  images: File[];                // 图片文件数组（1-2张）
  prompt?: string;               // 用户自定义描述（可选）
  duration?: number;             // 视频时长（5或8秒）
  quality?: '540p' | '720p' | '1080p';  // 视频质量
}

// 响应格式
interface EffectGenerationResponse {
  success: boolean;
  taskId: string;                // 任务ID
  effectTitle: string;           // 特效名称
  estimatedTime: number;         // 预估时间（秒）
  imagesCount: number;           // 使用的图片数量
  message?: string;
}
```

#### 处理流程
```typescript
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // 1. 参数解析和验证
    const effectId = formData.get('effectId') as string;
    const images = formData.getAll('images') as File[];
    const prompt = formData.get('prompt') as string || '';
    
    // 2. 获取特效配置
    const effect = await getEffectConfigById(effectId);
    if (!effect || effect.status !== 'online') {
      throw new EffectNotFoundError(effectId);
    }
    
    // 3. 验证图片数量
    if (images.length === 0 || images.length > effect.max_images) {
      throw new InvalidImageCountError(images.length, effect.max_images);
    }
    
    // 4. 路由到特效处理服务
    const result = await processVideoEffect({
      effect,
      images,
      prompt,
      userId: await getUserId(request)
    });
    
    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      effectTitle: effect.title,
      estimatedTime: result.estimatedTime,
      imagesCount: images.length
    });
    
  } catch (error) {
    return handleEffectError(error);
  }
}
```

### 2. 特效状态查询接口

#### 路径：`/api/video-effects/status/[taskId]`

```typescript
GET /api/video-effects/status/:taskId

// 响应格式
interface EffectStatusResponse {
  taskId: string;
  effectTitle: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;              // 0-100
  videoUrl?: string;             // 生成完成时提供
  thumbnailUrl?: string;         // 视频缩略图
  errorMessage?: string;         // 失败时的错误信息
  processingTime: number;        // 已处理时间（秒）
  estimatedRemaining: number;    // 预估剩余时间（秒）
}
```

### 3. 特效预览接口

#### 路径：`/api/video-effects/preview/[effectId]`

```typescript
GET /api/video-effects/preview/:effectId

// 响应格式
interface EffectPreviewResponse {
  effect: {
    id: string;
    title: string;
    description: string;
    previewImage?: string;
    previewVideo?: string;
    maxImages: number;           // 支持的最大图片数量
    creditsRequired: number;     // 所需积分
    estimatedTime: number;       // 预估生成时间
    supportedQualities: string[]; // 支持的画质
    supportedDurations: number[]; // 支持的时长
  };
}
```

## 特效处理服务

### 核心服务：`EffectGenerationService`

```typescript
export class EffectGenerationService {
  async processEffect(request: EffectProcessRequest): Promise<EffectProcessResult> {
    const { effect, images, prompt, userId } = request;
    
    // 1. 创建任务记录
    const task = await this.createEffectTask({
      userId,
      effectId: effect.id,
      imagesCount: images.length,
      prompt,
      status: 'PROCESSING'
    });
    
    // 2. 根据特效类型路由处理
    let result;
    switch (effect.effect_type) {
      case 'hailuo_prompt':
        result = await this.processHailuoEffect(effect, images[0], prompt);
        break;
        
      case 'pixverse_template':
        result = await this.processPixVerseEffect(effect, images, prompt);
        break;
        
      default:
        throw new UnsupportedEffectTypeError(effect.effect_type);
    }
    
    // 3. 更新任务状态
    await this.updateTaskStatus(task.id, 'SUBMITTED', {
      externalTaskId: result.externalTaskId,
      estimatedTime: result.estimatedTime
    });
    
    return {
      taskId: task.id,
      estimatedTime: result.estimatedTime
    };
  }

  private async processPixVerseEffect(
    effect: VideoEffect,
    images: File[],
    prompt: string
  ): Promise<EffectProcessResult> {
    
    // 1. 初始化PixVerse服务
    const pixverseService = new PixVerseEffectService();
    
    // 2. 上传图片到PixVerse
    const imgIds = await Promise.all(
      images.map(image => pixverseService.uploadImage(image))
    );
    
    // 3. 提交特效生成任务
    const generateResult = await pixverseService.generateVideo({
      templateId: effect.pixverse_template_id!,
      imgIds: imgIds,
      prompt: prompt || effect.title,
      duration: 5,
      quality: '540p'
    });
    
    return {
      externalTaskId: generateResult.videoId.toString(),
      estimatedTime: 120 // PixVerse预估2分钟
    };
  }
}
```

### PixVerse专用服务

```typescript
export class PixVerseEffectService {
  constructor(private apiKey: string) {}
  
  async uploadImage(imageFile: File): Promise<number> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch('https://app-api.pixverse.ai/openapi/v2/image/upload', {
      method: 'POST',
      headers: {
        'API-KEY': this.apiKey,
        'Ai-trace-id': crypto.randomUUID()
      },
      body: formData
    });
    
    const result = await response.json();
    if (result.ErrCode !== 0) {
      throw new PixVerseUploadError(result.ErrMsg);
    }
    
    return result.Resp.img_id;
  }
  
  async generateVideo(params: PixVerseGenerateParams): Promise<PixVerseGenerateResult> {
    const response = await fetch('https://app-api.pixverse.ai/openapi/v2/video/img/generate', {
      method: 'POST',
      headers: {
        'API-KEY': this.apiKey,
        'Ai-trace-id': crypto.randomUUID(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration: params.duration,
        img_ids: params.imgIds,
        model: 'v4.5',
        template_id: params.templateId,
        prompt: params.prompt,
        quality: params.quality
      })
    });
    
    const result = await response.json();
    if (result.ErrCode !== 0) {
      throw new PixVerseGenerateError(result.ErrMsg);
    }
    
    return {
      videoId: result.Resp.video_id
    };
  }
  
  async getVideoStatus(videoId: number): Promise<PixVerseStatusResult> {
    const response = await fetch(`https://app-api.pixverse.ai/openapi/v2/video/result/${videoId}`, {
      method: 'GET',
      headers: {
        'API-KEY': this.apiKey,
        'Ai-trace-id': crypto.randomUUID()
      }
    });
    
    const result = await response.json();
    return {
      status: result.Resp.status,
      videoUrl: result.Resp.url,
      createTime: result.Resp.create_time
    };
  }
}
```

## 数据库设计

### 特效任务表

```sql
-- 新增专门的特效任务表
CREATE TABLE effect_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  effect_id UUID NOT NULL REFERENCES effect_configs(id),
  
  -- 任务状态
  status VARCHAR NOT NULL DEFAULT 'PROCESSING',
  progress INTEGER DEFAULT 0,
  
  -- 输入参数
  images_count INTEGER NOT NULL,
  user_prompt TEXT,
  duration INTEGER DEFAULT 5,
  quality VARCHAR DEFAULT '540p',
  
  -- 外部服务信息
  effect_type VARCHAR NOT NULL, -- 'hailuo_prompt' | 'pixverse_template'
  external_task_id VARCHAR,      -- PixVerse video_id 或其他外部ID
  
  -- 结果
  video_url TEXT,
  thumbnail_url TEXT,
  error_message TEXT,
  
  -- 时间统计
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- 索引
  INDEX idx_effect_generations_user_id (user_id),
  INDEX idx_effect_generations_effect_id (effect_id),
  INDEX idx_effect_generations_status (status)
);
```

## 前端调用示例

### React组件集成

```typescript
// 特效生成调用
const generateEffect = async (effectId: string, images: File[], prompt: string) => {
  const formData = new FormData();
  formData.append('effectId', effectId);
  formData.append('prompt', prompt);
  images.forEach(image => formData.append('images', image));
  
  const response = await fetch('/api/video-effects/generate', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    // 开始轮询状态
    pollEffectStatus(result.taskId);
  }
};

// 状态轮询
const pollEffectStatus = async (taskId: string) => {
  const response = await fetch(`/api/video-effects/status/${taskId}`);
  const status = await response.json();
  
  if (status.status === 'COMPLETED') {
    // 显示生成的视频
    showGeneratedVideo(status.videoUrl);
  } else if (status.status === 'PROCESSING') {
    // 继续轮询
    setTimeout(() => pollEffectStatus(taskId), 10000);
  } else {
    // 处理错误
    showError(status.errorMessage);
  }
};
```

## 优势分析

### 1. 职责分离
- **传统API**：专注模型驱动的视频生成
- **特效API**：专注模板驱动的特效生成

### 2. 用户体验
- 专门的上传界面和进度反馈
- 特效专用的状态显示和错误处理
- 更精确的时间预估

### 3. 技术架构
- 独立的数据表和处理逻辑
- 专门的错误处理和重试机制
- 便于独立测试和优化

### 4. 扩展性
- 易于添加新的特效提供商
- 支持特效专用的配置参数
- 独立的性能监控和优化

## 总结

通过设计专门的视频特效API接口，我们能够：

1. **更好地适配PixVerse的API模式**（图片上传+模板）
2. **提供更专业的特效生成体验**
3. **保持与传统视频生成API的清晰分离**
4. **为未来扩展更多特效提供商奠定基础**

这种设计既满足了当前的业务需求，又保持了架构的清晰性和可扩展性。