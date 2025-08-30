# API层改动详细文档

## 概述

本文档详细说明为支持PixVerse特效而需要进行的API层改动，包括现有接口的扩展和新增的处理逻辑。

## 核心改动文件

### 1. 视频生成提交接口

#### 文件：`app/api/video-generation/submit/route.ts`

**改动策略**：扩展现有接口，支持特效类型路由

**主要变更**：

##### 请求参数扩展
```typescript
// 新增特效相关参数
interface VideoGenerationRequest {
  // 现有字段保持不变
  modelId: string;
  prompt: string;
  inputImageUrl?: string;
  
  // 新增字段
  effectId?: string;           // 特效ID，用于特效生成
  images?: File[];             // 多图上传支持
  effectOverride?: {           // 特效参数覆盖
    prompt?: string;
    duration?: number;
  };
}
```

##### 请求处理逻辑修改
```typescript
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // 1. 解析请求参数
    const effectId = formData.get('effectId') as string;
    const modelId = formData.get('modelId') as string;
    
    // 2. 特效路由判断
    if (effectId) {
      // 特效生成流程
      return await handleEffectGeneration(formData, effectId);
    } else {
      // 普通模型生成流程（现有逻辑）
      return await handleModelGeneration(formData, modelId);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
```

##### 特效生成处理函数
```typescript
async function handleEffectGeneration(formData: FormData, effectId: string) {
  // 1. 获取特效配置
  const effect = await getEffectConfigById(effectId);
  if (!effect) {
    throw new Error('Effect not found');
  }
  
  // 2. 验证图片数量
  const images = formData.getAll('images') as File[];
  if (images.length > effect.max_images) {
    throw new Error(`最多支持${effect.max_images}张图片`);
  }
  
  // 3. 路由到对应的特效处理服务
  const effectService = new EffectService();
  const result = await effectService.processEffect(
    effect,
    images,
    formData.get('prompt') as string
  );
  
  return NextResponse.json(result);
}
```

##### 响应格式统一
```typescript
// 统一的响应格式，隐藏底层provider差异
interface VideoGenerationResponse {
  success: boolean;
  taskId: string;
  estimatedTime: number;
  provider: 'hailuo' | 'pixverse';  // 内部标识，前端可选使用
  message?: string;
}
```

### 2. 特效服务集成

#### 新增文件：`services/effectService.ts`

**核心功能**：特效类型路由和处理

```typescript
export class EffectService {
  async processEffect(
    effect: VideoEffect,
    images: File[],
    userPrompt: string
  ): Promise<VideoGenerationResponse> {
    
    switch (effect.effect_type) {
      case 'hailuo_prompt':
        return await this.processHailuoEffect(effect, images[0], userPrompt);
        
      case 'pixverse_template':
        return await this.processPixVerseEffect(effect, images, userPrompt);
        
      default:
        throw new Error(`Unsupported effect type: ${effect.effect_type}`);
    }
  }

  private async processHailuoEffect(
    effect: VideoEffect,
    image: File,
    userPrompt: string
  ): Promise<VideoGenerationResponse> {
    // 1. 构造完整prompt（模板 + 用户输入）
    const fullPrompt = this.buildHailuoPrompt(effect.prompt_template, userPrompt);
    
    // 2. 上传图片到云存储
    const imageUrl = await this.uploadImageToR2(image);
    
    // 3. 调用Hailuo模型
    const provider = ProviderFactory.getProvider('minimax-hailuo02-image-to-video');
    const result = await provider.generateVideo({
      modelId: 'minimax-hailuo02-image-to-video',
      prompt: fullPrompt,
      inputImageUrl: imageUrl,
      duration: 5
    });
    
    return {
      success: true,
      taskId: result.taskId,
      estimatedTime: 200,
      provider: 'hailuo'
    };
  }

  private async processPixVerseEffect(
    effect: VideoEffect,
    images: File[],
    userPrompt: string
  ): Promise<VideoGenerationResponse> {
    // 1. 验证PixVerse特效配置
    if (!effect.pixverse_template_id) {
      throw new Error('PixVerse template ID not configured');
    }
    
    // 2. 调用PixVerse Provider
    const provider = ProviderFactory.getProvider('pixverse-effect-template');
    const result = await provider.generateVideo({
      modelId: 'pixverse-effect-template',
      prompt: userPrompt,
      images: images,
      templateId: effect.pixverse_template_id,
      duration: 5
    });
    
    return {
      success: true,
      taskId: result.taskId,
      estimatedTime: 120,
      provider: 'pixverse'
    };
  }

  private buildHailuoPrompt(template: string, userInput: string): string {
    // 模板变量替换逻辑
    return template.replace('{{user_input}}', userInput);
  }

  private async uploadImageToR2(image: File): Promise<string> {
    // 图片上传到R2存储的逻辑
    // 返回公网可访问的URL
  }
}
```

### 3. 状态查询接口增强

#### 文件：`app/api/video-generation/status/[taskId]/route.ts`

**改动内容**：支持PixVerse状态查询

```typescript
export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    
    // 1. 从数据库获取任务信息
    const task = await getVideoGenerationTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // 2. 根据provider类型查询状态
    let status;
    if (task.provider === 'pixverse') {
      status = await this.getPixVerseStatus(task);
    } else {
      // 现有provider状态查询逻辑
      status = await this.getStandardStatus(task);
    }
    
    // 3. 返回统一格式的状态
    return NextResponse.json({
      status: status.status,
      progress: status.progress,
      videoUrl: status.videoUrl,
      errorMessage: status.errorMessage,
      estimatedTime: status.remainingTime
    });
    
  } catch (error) {
    return handleApiError(error);
  }
}

private async getPixVerseStatus(task: VideoGenerationTask) {
  const provider = ProviderFactory.getProvider('pixverse-effect-template') as PixVerseProvider;
  const pixverseStatus = await provider.getGenerationStatus(task.externalTaskId);
  
  // 状态映射和格式转换
  return this.normalizePixVerseStatus(pixverseStatus);
}

private normalizePixVerseStatus(pixverseResponse: any): VideoGenerationStatus {
  const PIXVERSE_STATUS_MAP = {
    1: 'COMPLETED',     // 生成成功
    5: 'PROCESSING',    // 生成中
    6: 'DELETED',       // 已删除  
    7: 'FAILED',        // 内容审核失败
    8: 'FAILED'         // 生成失败
  };
  
  const status = PIXVERSE_STATUS_MAP[pixverseResponse.status] || 'UNKNOWN';
  
  return {
    status,
    progress: this.calculateProgress(status, pixverseResponse.create_time),
    videoUrl: status === 'COMPLETED' ? pixverseResponse.url : null,
    errorMessage: status === 'FAILED' ? this.getPixVerseErrorMessage(pixverseResponse.status) : null,
    remainingTime: this.estimateRemainingTime(status, pixverseResponse.create_time)
  };
}
```

### 4. 请求参数验证

#### 文件：`lib/validation/videoGeneration.ts`

**新增验证规则**：

```typescript
import { z } from 'zod';

// 特效生成请求验证
export const effectGenerationSchema = z.object({
  effectId: z.string().uuid('Invalid effect ID'),
  prompt: z.string().min(1, 'Prompt is required').max(2048, 'Prompt too long'),
  images: z.array(z.instanceof(File)).min(1, 'At least one image required'),
  duration: z.number().min(5).max(8).optional(),
}).refine(data => {
  // 动态验证：根据特效配置验证图片数量
  // 这里需要异步获取特效配置，在实际处理中进行
  return true;
}, {
  message: 'Invalid image count for this effect'
});

// 扩展现有的模型生成验证
export const videoGenerationSchema = z.union([
  effectGenerationSchema,
  existingModelGenerationSchema
]);
```

### 5. 错误处理统一

#### 文件：`lib/errors/apiErrors.ts`

**新增PixVerse特有错误处理**：

```typescript
export class PixVerseAPIError extends Error {
  constructor(
    message: string,
    public pixverseErrorCode: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PixVerseAPIError';
  }
}

export class EffectConfigurationError extends Error {
  constructor(message: string, public effectId: string) {
    super(message);
    this.name = 'EffectConfigurationError';
  }
}

// 错误映射函数
export function mapPixVerseError(pixverseResponse: any): PixVerseAPIError {
  switch (pixverseResponse.ErrCode) {
    case 500052:
      return new PixVerseAPIError(
        '图片内容不符合平台规范，请修改后重试',
        pixverseResponse.ErrCode,
        false
      );
    case 429:
      return new PixVerseAPIError(
        'API调用频率过高，请稍后重试',
        pixverseResponse.ErrCode,
        true
      );
    default:
      return new PixVerseAPIError(
        pixverseResponse.ErrMsg || 'PixVerse API调用失败',
        pixverseResponse.ErrCode,
        false
      );
  }
}

// 统一错误响应格式
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof PixVerseAPIError) {
    return NextResponse.json({
      success: false,
      error: 'PIXVERSE_ERROR',
      message: error.message,
      retryable: error.retryable
    }, { status: error.retryable ? 429 : 400 });
  }
  
  if (error instanceof EffectConfigurationError) {
    return NextResponse.json({
      success: false,
      error: 'EFFECT_CONFIG_ERROR',
      message: error.message,
      effectId: error.effectId
    }, { status: 400 });
  }
  
  // 其他错误处理...
  return NextResponse.json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'Internal server error'
  }, { status: 500 });
}
```

### 6. 数据库操作扩展

#### 文件：`models/videoGeneration.ts`

**新增字段和方法**：

```typescript
// 扩展VideoGeneration模型
export interface VideoGenerationRecord {
  // 现有字段...
  id: string;
  modelId: string;
  status: string;
  
  // 新增字段
  effectId?: string;           // 关联的特效ID
  provider: string;            // 'hailuo' | 'pixverse' | 'other'
  externalTaskId: string;      // 外部provider的任务ID
  pixverseVideoId?: number;    // PixVerse特有的video_id
}

// 新增查询方法
export async function getVideoGenerationsByEffect(
  effectId: string,
  userId: string
): Promise<VideoGenerationRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('video_generations')
    .select('*')
    .eq('effect_id', effectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
}

export async function updatePixVerseStatus(
  taskId: string,
  pixverseResponse: any
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const updateData: any = {
    status: mapPixVerseStatusToInternal(pixverseResponse.status),
    updated_at: new Date().toISOString()
  };
  
  // 如果生成成功，保存视频URL
  if (pixverseResponse.status === 1 && pixverseResponse.url) {
    updateData.video_url_pixverse = pixverseResponse.url;
  }
  
  const { error } = await supabase
    .from('video_generations')
    .update(updateData)
    .eq('id', taskId);
    
  if (error) throw error;
}
```

## 接口兼容性

### 向后兼容保证
1. **现有接口不变**：所有现有的API调用方式保持完全兼容
2. **渐进式增强**：新增的特效功能是可选的，不影响现有功能
3. **统一响应格式**：无论使用哪种技术路径，API响应格式保持一致

### 前端调用示例

```typescript
// 普通模型生成（现有方式，保持不变）
const response = await fetch('/api/video-generation/submit', {
  method: 'POST',
  body: formData // 包含 modelId, prompt, image 等
});

// 特效生成（新增方式）
const effectFormData = new FormData();
effectFormData.append('effectId', 'effect-uuid');
effectFormData.append('prompt', 'Custom prompt');
effectFormData.append('images', imageFile1);
effectFormData.append('images', imageFile2); // 多图支持

const response = await fetch('/api/video-generation/submit', {
  method: 'POST',
  body: effectFormData
});
```

## 性能考虑

### 图片上传优化
- 并行上传多张图片到PixVerse
- 图片格式验证和压缩
- 上传进度反馈

### 缓存策略
- 特效配置缓存（减少数据库查询）
- PixVerse img_id缓存（避免重复上传相同图片）
- 状态查询结果缓存（减少外部API调用）

## 监控和日志

### 关键指标
- 特效生成成功率
- 各provider响应时间对比
- 图片上传失败率
- API调用量统计

### 日志记录
- 详细的错误日志（包含provider特有信息）
- 性能指标记录
- 用户行为追踪

## 总结

通过以上API层改动，系统能够：
1. 在保持现有功能完全兼容的前提下，支持PixVerse特效
2. 提供统一的用户体验，隐藏底层技术实现差异
3. 具备良好的扩展性，便于未来集成更多特效提供商
4. 包含完善的错误处理和监控机制

所有改动均遵循最小化修改原则，确保系统的稳定性和可维护性。