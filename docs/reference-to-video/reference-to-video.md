# Reference-to-Video（参考生视频·角色一致性）页面需求概要

## TDK

- **Title**：Reference-to-Video (Consistent Character) | Veo3
- **Meta Description**：Turn 1–3 reference images into consistent-character videos. Lock identity and style across scenes with Veo3's Reference-to-Video.
- **Keywords**：reference-to-video, reference image to video, image to video, consistent character, character reference, identity lock, Veo3

## 核心目标

- 打造 `/reference-to-video` 新落地页，突出 Veo3.1 在角色一致性上的能力。
- 复用现有 `/image-to-video` 页面结构，降低研发成本。
- 指导用户上传 1-3 张参考图，提交 `REFERENCE_2_VIDEO` 任务。

## 视频生成组件改造概要

- **多张参考图上传**：扩展现有上传能力，最多支持 3 张参考图，交互需明确剩余可上传数量。
- **组件标题更新**：统一文案为 `Reference to Video (Consistent Character)`，并在中文语境中解释为“参考生视频”。
- **默认模型锁定**：默认选中 Veo3 Image to Video (`veo3_i2v`) 模型，其余不兼容选项隐藏或禁用。
- **专用 API 调用**：生成按钮直接触发 `/api/video-generation/reference-to-video`，携带参考图、提示词等参数完成参考生视频任务。

## 视频生成组件改造需求

### 组件功能要求

1. **多图上传支持**

   - 支持上传最多 3 张参考图片
   - 图片格式：JPG、PNG、WebP
   - 单张图片大小限制：10MB
   - 显示已上传图片的预览缩略图
   - 支持删除和替换已上传的图片

2. **组件界面调整**

   - 组件标题：从 "Image to Video" 改为 "Reference to Video (Consistent Character)"（中文展示为“参考生视频 · 角色一致性”）
   - 上传区域提示文字：
     - 未上传时："Upload 1-3 reference images to maintain character consistency"
     - 已上传部分："Add more reference images (up to 3 total)"
   - 显示已上传图片数量："2/3 images uploaded"

3. **默认模型配置**

   - 默认展示和选择：kie-veo3-image-to-video，参考 config/video-models.ts；不要出现其他模型了

4. **API 请求处理**
   - 点击生成按钮后，调用专门的参考生视频 API 接口生成参考生视频的视频

### 用户体验优化

1. 上传图片交互和现在 /image-to-video 的上传图片的交互保持一致

### 技术实现要点

1. **组件复用**

   - 基于现有 Image-to-Video 组件进行扩展
   - 共享现有的模型选择、参数配置逻辑

## 页面布局设计

### Hero 区域

- **主标题**：Reference-to-Video with Consistent Characters
- **副标题**：Upload multiple reference images to create videos with consistent character identity across all frames
- **CTA 按钮**：Try Reference-to-Video Now

### 功能展示区

1. **特性卡片**

   - 角色一致性：保持人物特征在整个视频中的统一
   - 多参考支持：支持 1-3 张参考图片输入
   - 场景灵活性：在不同场景中保持角色特征
   - 高质量输出：1080p 高清视频输出

2. **使用步骤**
   - Step 1: Upload 1-3 reference images of your character
   - Step 2: Describe the scene and action
   - Step 3: Generate consistent character video

### 视频生成区域

#### 上传区域布局

```
┌─────────────────────────────────────────┐
│  Reference to Video (Consistent Character) │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ Img1 │ │ Img2 │ │ + Add │          │
│  │      │ │      │ │ Image │          │
│  └──────┘ └──────┘ └──────┘          │
│                                         │
│  2/3 images uploaded                   │
│                                         │
├─────────────────────────────────────────┤
│  Prompt:                                │
│  ┌─────────────────────────────────┐  │
│  │ Describe your scene...          │  │
│  └─────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  Model: Veo3 Image to Video (Recommended)│
│  Duration: 5s | Resolution: 1080p      │
├─────────────────────────────────────────┤
│         [Generate Video]                │
└─────────────────────────────────────────┘
```

#### 图片预览功能

- 点击缩略图可查看大图
- 每张图片右上角有删除按钮 (×)
- 支持拖拽调整图片顺序
- 鼠标悬停显示图片信息（尺寸、格式）

## 积分消耗规则

### Reference-to-Video 积分计算

- 费用：与 Image-to-Video 相同
