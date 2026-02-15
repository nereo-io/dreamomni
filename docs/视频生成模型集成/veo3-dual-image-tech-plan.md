# Veo3 双图片上传（首尾帧）技术实施方案

## 1. 概述

本方案描述如何为 Veo3 模型实现双图片上传功能，支持用户上传两张图片作为视频的首帧和尾帧，生成平滑过渡的视频内容。

### 1.1 核心原则
- **保持简单**：不过度设计，Kie.ai API 会自动处理生成模式判断
- **渐进增强**：当前专注于双图片支持，未来需要时再扩展
- **向后兼容**：确保单图片功能不受影响

## 2. 现状分析

### 2.1 当前实现限制
- **前端**：`VideoGenerator` 组件仅支持单图片上传
- **API**：`/api/video-generation/submit` 仅接收单个 `image_url`
- **类型定义**：`VideoGenerationRequest` 仅有 `image_url?: string`
- **数据库**：`video_generations` 表仅有 `input_image_url` 字段
- **Provider**：虽然 Kie.ai API 支持 `imageUrls` 数组，但当前实现仅传递单图

### 2.2 Kie.ai API 能力
根据 API 文档，Veo3 支持：
- `FIRST_AND_LAST_FRAMES_2_VIDEO` 生成模式
- `imageUrls` 数组支持 1-2 张图片
- 第一张作为首帧，第二张作为尾帧

## 3. 技术方案

### 3.0 模型能力设计

#### 3.0.1 当前支持情况
根据 `config/video-models.ts` 配置和 API 文档：

| 模型 ID | 最大图片数 | 说明 |
|---------|-----------|------|
| `kie-veo3-image-to-video` | 2 | 支持1-2张，第一张为首帧，第二张为尾帧 |
| `sora-2-image-to-video` | 1 | 目前仅支持单张参考图 |
| 其他图生视频模型 | 1 | 默认单张 |

#### 3.0.2 未来扩展考虑
- **三图支持**：首帧、中间关键帧、尾帧
- **多参考图**：REFERENCE_2_VIDEO 模式可能支持 3-5 张参考图
- **动态配置**：通过配置文件或数据库动态管理模型能力

#### 3.0.3 设计原则
1. **渐进式增强**：从单图 → 双图 → 多图逐步支持
2. **模型驱动**：UI 根据模型能力动态调整
3. **向后兼容**：新功能不影响现有单图功能
4. **配置化**：模型能力通过配置管理，避免硬编码

### 3.1 数据库层改造

#### 3.1.1 数据库表结构调整
```sql
-- 为 video_generations 表增加新字段
ALTER TABLE video_generations
ADD COLUMN image_urls JSONB DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN video_generations.image_urls IS '输入图片URLs数组，支持1-2张图片，第一张为首帧，第二张为尾帧';

-- 保留原 input_image_url 字段用于向后兼容
-- 新数据优先使用 image_urls，老数据通过 input_image_url 兼容
```

#### 3.1.2 模型层更新
```typescript
// models/videoGeneration.ts
export interface CreateVideoGenerationParams {
  // ... existing fields
  input_image_url?: string;  // 保留用于向后兼容
  image_urls?: string[];      // 新增：支持多图片
  // 注意：不需要 generation_type 字段
  // Kie.ai API 会根据 imageUrls 数组长度自动判断模式：
  // - 0张图片：TEXT_2_VIDEO
  // - 1张图片：FIRST_AND_LAST_FRAMES_2_VIDEO（单图生成）
  // - 2张图片：FIRST_AND_LAST_FRAMES_2_VIDEO（首尾帧）
}
```

### 3.2 类型系统改造

#### 3.2.1 Provider 类型更新
```typescript
// services/providers/types.ts
export interface VideoGenerationRequest {
  model: string;
  prompt: string;
  image_url?: string;        // 保留用于向后兼容
  image_urls?: string[];      // 新增：支持多图片
  // 不需要 generation_type 字段（API 自动判断）
  // ... other fields
}
```

#### 3.2.2 API 参数类型
```typescript
// app/blocks/video-generator/index.tsx
export interface VideoGenerationParams {
  // ... existing fields
  image_url?: string;        // 保留单图兼容
  image_urls?: string[];     // 新增双图支持
  // 不需要 generation_type 字段
}
```

### 3.3 前端组件改造

#### 3.3.1 状态管理
```typescript
// components/blocks/video-generator/index.tsx
const [uploadedImages, setUploadedImages] = useState<string[]>([]);
const [imageFiles, setImageFiles] = useState<File[]>([]);
const [isUploadingImages, setIsUploadingImages] = useState<boolean[]>([]);

// 获取模型支持的最大图片数量
const getMaxImagesForModel = (modelId: string): number => {
  // 基于模型能力配置，支持未来扩展
  const modelCapabilities: Record<string, number> = {
    'kie-veo3-image-to-video': 2,      // Veo3 支持1-2张图片（首尾帧）
    'sora-2-image-to-video': 1,        // Sora 2 目前只支持单张
    // 未来可能的扩展：
    // 'kie-veo3-plus-image-to-video': 3,  // 支持首帧、中间帧、尾帧
    // 'reference-model': 5,               // 支持多张参考图
  };

  return modelCapabilities[modelId] || 1; // 默认支持单张
};

// 使用辅助函数判断
const maxImages = getMaxImagesForModel(selectedModel);
const supportsDualImages = maxImages >= 2;
const supportsTripleImages = maxImages >= 3; // 预留三图支持
```

#### 3.3.2 UI 组件设计
```typescript
// 双图片上传组件
const DualImageUploader = () => {
  return (
    <div className="space-y-4">
      {/* 图片预览区 */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((index) => (
          <div key={index} className="relative">
            {/* 标签 */}
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="secondary">
                {index === 0 ? '首帧' : '尾帧'}
              </Badge>
            </div>

            {/* 图片上传/预览 */}
            {uploadedImages[index] ? (
              <div className="relative">
                <img src={uploadedImages[index]} />
                <Button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2"
                >
                  <X />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed"
                onClick={() => selectImage(index)}
              >
                <ImageIcon />
                <p>点击上传{index === 0 ? '首帧' : '尾帧'}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 顺序调整按钮 */}
      {uploadedImages.length === 2 && (
        <Button onClick={swapImages} variant="outline">
          <ArrowLeftRight /> 交换首尾帧
        </Button>
      )}
    </div>
  );
};
```

#### 3.3.3 图片处理逻辑
```typescript
const handleImageUpload = async (file: File, index: number) => {
  // 验证图片
  const validation = validateImage(file);
  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }

  // 上传图片
  setIsUploadingImages(prev => {
    const newState = [...prev];
    newState[index] = true;
    return newState;
  });

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    setUploadedImages(prev => {
      const newImages = [...prev];
      newImages[index] = result.data.url;
      return newImages;
    });

    toast.success(`${index === 0 ? '首帧' : '尾帧'}上传成功`);
  } catch (error) {
    toast.error(`${index === 0 ? '首帧' : '尾帧'}上传失败`);
  } finally {
    setIsUploadingImages(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  }
};

// 交换首尾帧
const swapImages = () => {
  setUploadedImages(prev => [prev[1], prev[0]]);
  setImageFiles(prev => [prev[1], prev[0]]);
};
```

### 3.4 后端 API 改造

#### 3.4.1 API 参数处理
```typescript
// app/api/video-generation/submit/route.ts
const {
  model,
  prompt,
  image_url,      // 保留单图兼容
  image_urls,     // 新增双图支持
  // ... other params
} = await req.json();

// 兼容性处理：统一转换为数组
let finalImageUrls: string[] = [];
if (image_urls && Array.isArray(image_urls)) {
  finalImageUrls = image_urls;
} else if (image_url) {
  finalImageUrls = [image_url];
}

// 验证图片数量（根据模型能力）
const maxImages = getMaxImagesForModel(model);
if (finalImageUrls.length > maxImages) {
  return respErr(`Model ${model} supports maximum ${maxImages} images`);
}
```

#### 3.4.2 Provider 调用更新
```typescript
// 构建 Provider 输入
const input: VideoGenerationRequest = {
  model,
  prompt: finalPrompt,
  image_urls: finalImageUrls,  // 使用数组
  // 不需要 generation_type，API 会自动判断
  aspect_ratio,
  // ... other params
};

// 向后兼容：对于不支持数组的 provider，使用单个 image_url
if (finalImageUrls.length > 0 && !supportsImageArray(provider)) {
  input.image_url = finalImageUrls[0];
  delete input.image_urls;
}
```

### 3.5 Provider 实现改造

#### 3.5.1 KieAiVeo3Provider 更新（简化版）
```typescript
// services/providers/KieAiVeo3Provider.ts
async submit(
  model: string,
  input: VideoGenerationRequest,
  webhookUrl?: string
): Promise<VideoGenerationResponse> {
  const requestBody: any = {
    prompt: input.prompt,
    model: 'veo3_fast',  // 默认使用 veo3_fast
  };

  // 处理图片输入（简单直接）
  if (input.image_urls && input.image_urls.length > 0) {
    // 直接传递图片数组，API 会自动判断模式
    requestBody.imageUrls = input.image_urls;
  } else if (input.image_url) {
    // 向后兼容单个 image_url
    requestBody.imageUrls = [input.image_url];
  }

  // 不需要设置 generationType，Kie.ai API 会根据 imageUrls 自动判断：
  // - 没有图片：文生视频
  // - 1张图片：单图生成视频
  // - 2张图片：首尾帧生成视频

  // 其他参数处理
  if (input.aspect_ratio) {
    requestBody.aspectRatio = input.aspect_ratio;
  }

  // ... rest of the implementation
}
```

### 3.6 兼容性策略

#### 3.6.1 向后兼容
1. **数据库**：保留 `input_image_url` 字段，新增 `image_urls` JSONB 字段
2. **API**：同时接受 `image_url` 和 `image_urls` 参数
3. **读取优先级**：优先使用 `image_urls`，如果为空则回退到 `input_image_url`

#### 3.6.2 模型切换处理
```typescript
// 从 veo3 切换到其他模型
useEffect(() => {
  if (!supportsDualImages && uploadedImages.length > 1) {
    // 保留第一张图片
    setUploadedImages([uploadedImages[0]]);
    toast.info('当前模型仅支持单张图片，已保留首帧');
  }
}, [selectedModel, supportsDualImages]);
```

#### 3.6.3 错误处理
```typescript
// 验证图片数量
if (mode === 'image-to-video') {
  if (supportsDualImages) {
    if (uploadedImages.length === 0) {
      return toast.error('请至少上传一张图片');
    }
    if (uploadedImages.length === 1) {
      toast.info('仅上传了首帧，将基于首帧生成视频');
    }
  } else {
    if (!uploadedImages[0]) {
      return toast.error('请上传图片');
    }
  }
}
```

## 4. 实施要点总结

### 4.1 需要修改的部分
1. **前端组件**：支持双图片上传、预览、顺序管理
2. **API 路由**：接收 `image_urls` 数组参数
3. **数据库**：添加 `image_urls` JSONB 字段（可选，用于记录）
4. **类型定义**：添加 `image_urls?: string[]` 字段

### 4.2 不需要修改的部分
1. **KieAiVeo3Provider**：保持 `model: 'veo3_fast'`，只需传递 `imageUrls` 数组
2. **generationType 字段**：当前不需要，API 自动判断
3. **模型判断逻辑**：基于模型 ID 配置最大图片数即可

### 4.3 关键实现逻辑
```typescript
// 前端：根据模型判断支持的图片数
const maxImages = modelCapabilities[selectedModel] || 1;

// 后端：统一处理图片参数
const finalImageUrls = image_urls || (image_url ? [image_url] : []);

// Provider：直接传递数组
requestBody.imageUrls = finalImageUrls;
```

## 5. 实施步骤

### Phase 1: 基础架构（第1-2天）
1. ✅ 数据库迁移：添加 `image_urls` 字段
2. ✅ 更新类型定义和接口
3. ✅ 修改模型层支持新字段

### Phase 2: 后端实现（第2-3天）
1. ✅ 更新 API 路由处理双图片
2. ✅ 修改 KieAiVeo3Provider 实现
3. ✅ 实现兼容性逻辑

### Phase 3: 前端实现（第3-5天）
1. ✅ 实现双图片上传组件
2. ✅ 添加首尾帧标识和交换功能
3. ✅ 模型切换时的降级处理
4. ✅ 错误处理和用户提示

### Phase 4: 测试优化（第5-6天）
1. ✅ 单图片上传兼容性测试
2. ✅ 双图片上传功能测试
3. ✅ 首尾帧交换测试
4. ✅ 模型切换测试
5. ✅ 性能优化

## 5. 风险和注意事项

### 5.1 技术风险
- **数据库迁移**：需要确保不影响现有数据
- **API 兼容性**：需要同时支持新旧客户端
- **文件上传**：双图片可能增加上传时间

### 5.2 用户体验
- 清晰的首尾帧标识
- 直观的交换操作
- 合理的错误提示
- 加载状态反馈

### 5.3 性能考虑
- 图片预览使用缩略图
- 异步上传避免阻塞
- 合理的图片大小限制

## 6. 测试用例

### 6.1 功能测试
- [ ] 上传单张图片（首帧）
- [ ] 上传两张图片（首尾帧）
- [ ] 交换首尾帧顺序
- [ ] 删除单张图片
- [ ] 替换已上传图片

### 6.2 兼容性测试
- [ ] veo3 模型双图片
- [ ] 其他模型单图片
- [ ] 模型切换降级
- [ ] API 向后兼容

### 6.3 边界测试
- [ ] 超大图片上传
- [ ] 不支持的格式
- [ ] 网络中断恢复
- [ ] 并发上传

## 7. 监控指标

- 双图片使用率
- 上传成功率
- 生成成功率
- 用户满意度

## 8. 未来优化

### 8.1 三图及多图支持设计

#### 8.1.1 三图模式（参考图生成）
```typescript
// 未来扩展：当支持 3 张参考图时才需要 generationType
type GenerationType =
  | 'TEXT_2_VIDEO'                       // 文生视频
  | 'FIRST_AND_LAST_FRAMES_2_VIDEO'     // 图生视频（1-2张，当前自动判断）
  | 'REFERENCE_2_VIDEO';                 // 参考图生视频（3张以上，需要明确指定）

// 三图参考生成 UI
const ReferenceImageUploader = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <ImageSlot label="参考图 1" index={0} />
      <ImageSlot label="参考图 2" index={1} />
      <ImageSlot label="参考图 3" index={2} />
    </div>
  );
};

// 只有在 3 张图以上时，才需要在 API 中指定 generationType
if (finalImageUrls.length >= 3) {
  requestBody.generationType = 'REFERENCE_2_VIDEO';
  // 此时需要传递 generationType 字段
}
```

#### 8.1.2 多参考图模式（3-5张）
```typescript
// 动态图片槽位
const MultiReferenceUploader = ({ maxImages = 5 }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
      {Array.from({ length: maxImages }).map((_, index) => (
        <ImageSlot
          key={index}
          label={`参考图 ${index + 1}`}
          index={index}
          optional={index > 0} // 第一张必需，其他可选
        />
      ))}
    </div>
  );
};
```

#### 8.1.3 配置扩展
```typescript
// config/video-models.ts 扩展
interface VideoModelConfig {
  // ... existing fields
  imageCapabilities?: {
    minImages: number;
    maxImages: number;
    modes: GenerationType[];
    labels?: string[]; // ['首帧', '关键帧', '尾帧'] 或 ['参考图1', '参考图2', ...]
  };
}

// 示例配置
'kie-veo3-plus-image-to-video': {
  imageCapabilities: {
    minImages: 1,
    maxImages: 3,
    modes: ['FIRST_AND_LAST_FRAMES_2_VIDEO', 'KEY_FRAMES_2_VIDEO'],
    labels: ['首帧', '关键帧', '尾帧']
  }
}
```

### 8.2 其他优化方向

- **图片编辑功能**：裁剪、滤镜、调整
- **AI 辅助排序**：自动建议最佳图片顺序
- **批量上传**：拖拽多张图片同时上传
- **智能匹配**：基于内容相似度自动匹配首尾帧
- **预设模板**：常用的图片组合模板