# 模型落地页快速生产指南

## 📋 目录

- [核心原则](#核心原则)
- [完整流程](#完整流程)
- [批量生成工具](#批量生成工具)
- [文案写作公式](#文案写作公式)
- [时间估算](#时间估算)
- [快速上手模板](#快速上手模板)

---

## 🎯 核心原则

### 1. 用户价值驱动，而非技术展示

**❌ 错误示例**（技术驱动）：
```
"Google Nano Banana AI delivers high prompt fidelity and contextual coherence across styles."
```

**✅ 正确示例**（业务驱动）：
```
"Perfect for e-commerce teams, marketers, and designers who need pixel-perfect control.
Nano Banana understands complex, detailed prompts—lighting angles, material textures,
composition rules—delivering exactly what you described without trial-and-error iterations."
```

### 2. 真实业务场景，而非通用案例

**❌ 错误示例**（泛泛而谈）：
```
Prompt: "A cute baby panda eating bamboo in a lush green forest"
```

**✅ 正确示例**（业务场景）：
```
Prompt: "Professional product photography: luxury rose gold watch on white marble surface,
soft studio lighting from top-left at 45°, shallow depth of field f/2.8,
minimalist composition with negative space on right side"
```

### 3. 可量化的价值，而非模糊描述

**❌ 模糊**: "Fast image generation"
**✅ 具体**: "Generate 50-200 product variants in one batch job—ideal for ad A/B tests"

---

## 📝 完整流程

### 第一步：理解模型的核心能力（30分钟）

**不要问**：这个模型能做什么？
**要问**：用户用这个模型解决什么问题？

#### 分析框架

1. **识别目标用户**
   - 电商运营团队
   - 品牌营销人员
   - 产品设计师
   - 内容创作者

2. **列出用户痛点**
   - 拍摄成本高（产品摄影、场景搭建）
   - 修图慢（反复试错、调整细节）
   - 无法快速迭代（传统流程周期长）
   - 多语言团队协作困难

3. **匹配模型能力到解决方案**
   - 精准 prompt 理解 → 减少试错次数
   - 产品融入场景 → 省去拍摄成本
   - 批量生成 → 提升生产效率

#### 案例（Nano Banana）

| 技术能力 | 用户价值 | 目标用户 |
|---------|---------|---------|
| 复杂 prompt 理解 | 精准控制光线、材质、构图 | 产品摄影师 |
| Multi-Image Fusion | 产品抠图融入生活场景 | 电商运营 |
| 多语言支持 | 中俄团队无需英文 prompt | 国际化团队 |
| 批量生成 | 一次生成 50+ 变体 | 广告投放团队 |

---

### 第二步：定义 5-6 个 Key Features（1小时）

#### Feature 设计模板

```json
{
  "title": "Feature 名称（用户视角，而非技术名词）",
  "description": "为 [用户角色] 解决 [具体痛点]。[模型能力] 让你 [可量化的业务价值]，避免 [传统方法的痛点]。",
  "type": "table",
  "data": {
    "headers": [
      { "title": "输入/场景" },
      { "title": "输出/结果" }
    ],
    "rows": [
      {
        "cells": [
          { "type": "text", "content": "具体的业务场景描述" },
          { "type": "image", "content": "真实示例图片" }
        ]
      }
    ]
  }
}
```

#### Feature 类型矩阵

| Feature 类型 | 适用场景 | 表格结构 |
|-------------|---------|---------|
| **精准控制** | 产品摄影、专业设计 | Prompt → Output |
| **编辑能力** | 修图、场景替换 | Original → Prompt → Output |
| **融合能力** | 产品上人/场景 | Product Cutout → Prompt → Lifestyle Scene |
| **批量生产** | 广告投放、SKU 变体 | Pain Point → Solution → Example |
| **多语言** | 国际化团队 | Language → Prompt → Output |

---

### 第三步：设计真实业务场景的示例（1小时）

#### Prompt 设计原则

**公式**：`[用户角色需求] + [技术参数] + [商业目标]`

#### 案例对比

**场景 1: State-of-the-Art Image Generation**

❌ **泛泛而谈**：
```
"Futuristic cyberpunk cityscape at night with neon signs"
```

✅ **业务场景**：
```
"E-commerce product shot: premium white sneaker floating in mid-air,
clean gradient background from light gray to white,
dramatic side lighting casting soft shadow below left,
photorealistic leather texture and fabric weave,
studio quality 8k resolution"

→ 用户：电商运营
→ 痛点：需要高质量产品图，但拍摄成本高
→ 价值：AI 生成专业级产品图，省去拍摄和修图成本
```

**场景 2: Seamless Multi-Image Fusion**

❌ **没有实际价值**：
```
Input: 咖啡杯 + 运动鞋 + 植物
Output: 融合后的场景
```

✅ **真实电商场景**：
```
Input: "Product cutout on white background: luxury silver smartwatch
       with black leather strap, front view, clean studio product photography"

Prompt: "Place the smartwatch on a person's wrist in a modern coffee shop scene:
        wooden table, laptop in background softly blurred,
        warm afternoon natural light from window on left,
        lifestyle product photography for advertisement,
        keep watch design exactly the same"

Output: 智能手表戴在手腕上，咖啡厅场景，自然光影

→ 用户：电商团队
→ 痛点：需要产品在生活场景中的展示，但拍摄成本高
→ 价值：把白底产品图直接融入场景，省去模特和场地费用
```

---

### 第四步：批量生成图片素材（30分钟 - 自动化）

#### 目录结构

```
scripts/[model-name]-batch-generator/
├── generate-samples.ts        # 主脚本
├── url-mapping.json           # 假URL→真实R2 URL映射（自动生成）
└── README.md                  # 使用文档
```

#### 核心配置：IMAGE_TASKS 数组

```typescript
interface ImageTask {
  id: string;              // 唯一ID
  filename: string;        // R2文件名（如 'feature-1.png'）
  mode: 'text-to-image' | 'image-to-image';
  prompt: string;          // 详细的业务场景 prompt
  fakeUrl: string;         // JSON 中的占位 URL
  dependsOn?: string;      // 依赖的任务ID（用于 image-to-image）
}

const IMAGE_TASKS: ImageTask[] = [
  // Feature 1: 精准控制 - text-to-image
  {
    id: 'luxury-watch',
    filename: 'luxury-watch.png',
    mode: 'text-to-image',
    prompt: 'Professional product photography: luxury rose gold watch on white marble surface, soft studio lighting from top-left at 45°, shallow depth of field f/2.8, minimalist composition with negative space on right side, high-end jewelry catalog style',
    fakeUrl: 'https://assets.example.com/model/luxury-watch.png',
  },

  // Feature 2: 融合能力 - image-to-image（有依赖关系）
  {
    id: 'watch-cutout',
    filename: 'watch-cutout.png',
    mode: 'text-to-image',
    prompt: 'Product cutout on white background: luxury silver smartwatch with black leather strap, front view, clean studio product photography, no shadows, isolated object for e-commerce',
    fakeUrl: 'https://assets.example.com/model/watch-cutout.png',
  },
  {
    id: 'watch-lifestyle',
    filename: 'watch-lifestyle.png',
    mode: 'image-to-image',
    prompt: 'Place the smartwatch on a person\'s wrist in a modern coffee shop scene: wooden table, laptop in background softly blurred, warm afternoon natural light from window on left, lifestyle product photography for advertisement, keep watch design exactly the same',
    fakeUrl: 'https://assets.example.com/model/watch-lifestyle.png',
    dependsOn: 'watch-cutout',  // 等待上一个任务完成
  },
];
```

#### 运行流程

```bash
# 1. 配置环境变量（.env.local）
# 确保有以下配置：
# - STORAGE_ENDPOINT
# - STORAGE_ACCESS_KEY
# - STORAGE_SECRET_KEY
# - STORAGE_BUCKET
# - STORAGE_DOMAIN
# - KIE_AI_API_KEY（或其他模型的 API Key）

# 2. 运行批量生成脚本
pnpm tsx scripts/[model]-batch-generator/generate-samples.ts

# 脚本会自动完成：
# ✅ 调用 API 生成图片（自动轮询状态）
# ✅ 下载图片并上传到 R2 存储
# ✅ 生成 URL 映射表（url-mapping.json）
# ✅ 自动替换 JSON 文件中的假 URL 为真实 R2 URL
```

#### 生成统计示例

```
🎉 All tasks completed successfully!

📊 Final Report
================================================================================
✅ Completed: 12/12
❌ Failed: 0/12
⏳ Pending: 0/12

📝 Detailed Results:
  ✅ luxury-watch: completed
     URL: https://r2.veo3ai.io/intro/model-name/luxury-watch.png
  ✅ watch-cutout: completed
     URL: https://r2.veo3ai.io/intro/model-name/watch-cutout.png
  ✅ watch-lifestyle: completed
     URL: https://r2.veo3ai.io/intro/model-name/watch-lifestyle.png

总耗时: ~4分钟
总积分消耗: 24 credits ($0.60 USD)
```

---

### 第五步：优化文案和描述（30分钟）

#### Feature 描述公式

```
[用户角色] 需要 [业务目标]。
[模型名称] 通过 [技术能力] 让你 [可量化的价值]，
避免 [传统方法的痛点]。
```

#### 案例库

**1. 精准控制类**

❌ 技术驱动：
```
"Nano Banana AI delivers high prompt fidelity and contextual coherence
across styles—from photorealistic to abstract and stylized."
```

✅ 业务驱动：
```
"Perfect for e-commerce teams, marketers, and designers who need
pixel-perfect control. Nano Banana understands complex, detailed prompts
—lighting angles, material textures, composition rules—delivering
exactly what you described without trial-and-error iterations."

→ 用户角色：电商团队、营销、设计师
→ 业务目标：需要精准控制每个细节
→ 技术能力：理解复杂的详细 prompt
→ 可量化价值：避免反复试错
→ 传统痛点：trial-and-error iterations
```

**2. 融合能力类**

❌ 技术驱动：
```
"Blend product shots, scenes, and style references into one realistic
composition with contact shadows and reflections."
```

✅ 业务驱动：
```
"Turn product cutouts into lifestyle scenes instantly. Perfect for
e-commerce teams who need to show products in context without
expensive photoshoots. Maintains product accuracy while adding
realistic environments, lighting, and human interaction."

→ 用户角色：电商团队
→ 业务目标：展示产品在场景中的效果
→ 技术能力：产品融入场景
→ 可量化价值：省去昂贵的拍摄成本
→ 传统痛点：expensive photoshoots
```

**3. 批量生产类**

❌ 技术驱动：
```
"Low-latency inference enables rapid ideation and production."
```

✅ 业务驱动：
```
"Ship faster. Nano Banana's low-latency inference enables rapid
ideation and production. Run batch jobs (sizes, aspect ratios,
copy variables) for 50–200 assets in one go—ideal for ad A/B tests,
campaign refreshes, and e-commerce rollouts."

→ 用户角色：广告投放团队、电商运营
→ 业务目标：快速生产大量素材变体
→ 技术能力：低延迟推理 + 批量生成
→ 可量化价值：一次生成 50-200 个素材
→ 传统痛点：逐个生成效率低
```

#### 文案检查清单

- [ ] 是否明确用户角色？
- [ ] 是否描述了具体痛点？
- [ ] 是否有可量化的价值？（数字、时间、成本）
- [ ] 是否避免了技术术语？
- [ ] 是否在 2-3 句话内？
- [ ] 是否回答了"所以呢？"（So what?）

---

### 第六步：清除缓存并验证（15分钟）

#### Next.js 缓存清理

```bash
# 1. 清除 Next.js 构建缓存
rm -rf .next

# 2. 关闭现有开发服务器
lsof -ti:3000 | xargs kill -9

# 3. 重启开发服务器
pnpm dev
```

#### 浏览器验证

1. **硬刷新页面**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

2. **禁用缓存（开发者工具）**
   - 打开浏览器开发者工具 (F12)
   - Network 面板
   - 勾选 "Disable cache"
   - 刷新页面

3. **验证图片加载**
   - 检查所有图片是否加载成功
   - 检查图片分辨率是否正确（1024×1024）
   - 检查 URL 是否为 R2 域名

4. **验证文案更新**
   - 检查所有描述是否已更新
   - 检查 prompt 文本是否正确显示
   - 检查是否有遗漏的占位文本

---

## 🛠️ 批量生成工具详解

### 脚本核心功能

```typescript
// 1. 提交图片生成任务
async function submitImageGeneration(task: ImageTask, inputImageUrls?: string[]) {
  const body: any = {
    model: task.mode === 'text-to-image' ? 'google/nano-banana' : 'nano-banana-edit',
    prompt: task.prompt,
    mode: task.mode,
    provider: 'nano_banana',
    enable_prompt_enhancement: false,
    image_size: '1:1',        // 1024×1024
    output_format: 'png',     // 高质量
  };

  if (task.mode === 'image-to-image' && inputImageUrls) {
    body.image_urls = inputImageUrls;
  }

  const response = await fetch(`${BASE_URL}/api/image-generation/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': USER_COOKIE },
    body: JSON.stringify(body),
  });

  return response.json();
}

// 2. 轮询任务状态（每 5 秒检查一次）
async function pollTaskStatus(generationId: string) {
  for (let i = 0; i < 60; i++) {  // 最多等待 5 分钟
    await new Promise(resolve => setTimeout(resolve, 5000));

    const status = await checkStatus(generationId);

    if (status === 'completed') {
      return { status: 'completed', image_url: '...' };
    } else if (status === 'failed') {
      throw new Error('Generation failed');
    }
  }
  throw new Error('Task timeout');
}

// 3. 下载并上传到 R2
async function downloadAndUploadToR2(imageUrl: string, filename: string) {
  const storage = newStorage();
  const key = `intro/model-name/${filename}`;

  await storage.downloadAndUpload({
    url: imageUrl,
    key: key,
    bucket: 'veo3',
    contentType: 'image/png',
  });

  return `https://r2.veo3ai.io/${key}`;
}

// 4. 自动更新 JSON 文件
async function updateJsonFile(mapping: Record<string, string>) {
  const jsonPath = 'i18n/pages/model-landing/model-name/en.json';
  let content = await fs.readFile(jsonPath, 'utf-8');

  // 替换所有假 URL 为真实 R2 URL
  for (const [fakeUrl, realUrl] of Object.entries(mapping)) {
    content = content.replace(new RegExp(fakeUrl, 'g'), realUrl);
  }

  await fs.writeFile(jsonPath, content, 'utf-8');
}
```

### 依赖关系处理

```typescript
// 自动处理 image-to-image 的依赖关系
async function processTask(task: ImageTask) {
  let inputImageUrls: string[] | undefined;

  // 如果有依赖，等待依赖任务完成
  if (task.dependsOn) {
    const dependentResult = results.get(task.dependsOn);
    if (!dependentResult || dependentResult.status !== 'completed') {
      throw new Error(`Dependent task ${task.dependsOn} not completed`);
    }
    inputImageUrls = [dependentResult.r2Url];  // 使用依赖任务的输出
  }

  // 提交当前任务
  const submission = await submitImageGeneration(task, inputImageUrls);

  // 轮询 + 上传 + 记录结果
  // ...
}

// 按顺序处理所有任务（自动处理依赖）
for (const task of IMAGE_TASKS) {
  await processTask(task);
  await new Promise(resolve => setTimeout(resolve, 2000));  // 任务间隔 2 秒
}
```

---

## 📊 时间估算

### 首次制作（包含学习曲线）

| 阶段 | 时间 | 主要工作 |
|------|------|---------|
| 需求分析 | 1小时 | 研究模型能力、识别用户痛点 |
| Feature 设计 | 2小时 | 定义 5-6 个 Features、设计场景 |
| Prompt 编写 | 1小时 | 编写详细的业务场景 prompt |
| 图片生成 | 1小时 | 配置脚本、运行批量生成（自动） |
| 文案优化 | 1小时 | 使用公式优化所有描述 |
| 测试验证 | 30分钟 | 清除缓存、验证效果 |
| **总计** | **6.5小时** | |

### 熟练后（第二次及以后）

| 阶段 | 时间 | 优化点 |
|------|------|--------|
| 需求分析 | 30分钟 | 直接套用分析框架 |
| Feature 设计 | 1小时 | 复用模板结构 |
| Prompt 编写 | 30分钟 | 参考案例库 |
| 图片生成 | 30分钟 | 自动化脚本（复制配置即可） |
| 文案优化 | 30分钟 | 套用公式 |
| 测试验证 | 15分钟 | 流程化验证 |
| **总计** | **2.5-3小时** | |

---

## 🚀 快速上手模板

### 创建新模型落地页（3 分钟）

```bash
# 1. 复制脚本文件夹
cp -r scripts/nano-banana-batch-generator scripts/[new-model]-batch-generator

# 2. 修改脚本配置
cd scripts/[new-model]-batch-generator

# 编辑 generate-samples.ts：
# - 修改 R2_BASE_PATH = 'intro/[new-model]'
# - 修改 JSON 文件路径 = 'i18n/pages/model-landing/[new-model]/en.json'
# - 替换 IMAGE_TASKS 数组

# 3. 运行生成
pnpm tsx generate-samples.ts
```

### IMAGE_TASKS 配置模板

```typescript
const IMAGE_TASKS: ImageTask[] = [
  // ========================================
  // Feature 1: [Feature 名称]
  // 用户角色：[目标用户]
  // 痛点：[具体痛点]
  // ========================================
  {
    id: 'feature-1-example-1',
    filename: 'feature-1-example-1.png',
    mode: 'text-to-image',
    prompt: '[详细的业务场景 prompt，包含用户角色、技术参数、商业目标]',
    fakeUrl: 'https://assets.example.com/[model]/feature-1-example-1.png',
  },

  // ========================================
  // Feature 2: [Feature 名称] - image-to-image
  // 用户角色：[目标用户]
  // 痛点：[具体痛点]
  // ========================================
  {
    id: 'feature-2-input',
    filename: 'feature-2-input.png',
    mode: 'text-to-image',
    prompt: '[生成输入图片的 prompt]',
    fakeUrl: 'https://assets.example.com/[model]/feature-2-input.png',
  },
  {
    id: 'feature-2-output',
    filename: 'feature-2-output.png',
    mode: 'image-to-image',
    prompt: '[基于输入图片的转换指令]',
    fakeUrl: 'https://assets.example.com/[model]/feature-2-output.png',
    dependsOn: 'feature-2-input',
  },

  // 重复以上结构，直到所有 Features 完成
];
```

### JSON 文件模板

```json
{
  "features": {
    "title": "Key Features of [Model Name]",
    "details": [
      {
        "title": "[Feature 名称 - 用户视角]",
        "description": "为 [用户角色] 解决 [具体痛点]。[模型名称] 通过 [技术能力] 让你 [可量化的价值]，避免 [传统方法的痛点]。",
        "type": "table",
        "data": {
          "headers": [
            { "title": "[列名 1]" },
            { "title": "[列名 2]" }
          ],
          "rows": [
            {
              "cells": [
                {
                  "type": "text",
                  "content": "[详细的 prompt 或场景描述]"
                },
                {
                  "type": "image",
                  "content": "https://assets.example.com/[model]/[filename].png",
                  "altText": "[图片描述]"
                }
              ]
            }
          ]
        }
      }
    ]
  }
}
```

---

## 📚 案例库

### Nano Banana（图片生成模型）

#### Feature 1: State-of-the-Art Image Generation

**用户角色**: 电商运营、产品摄影师
**痛点**: 需要高质量产品图，但拍摄和修图成本高，调整细节需要反复试错

**Prompt 示例**:
```
"Professional product photography: luxury rose gold watch on white marble surface,
soft studio lighting from top-left at 45 degrees, subtle reflections on polished surface,
shallow depth of field f/2.8, minimalist composition with negative space on right side,
high-end jewelry catalog style"
```

**描述**:
```
"Perfect for e-commerce teams, marketers, and designers who need pixel-perfect control.
Nano Banana understands complex, detailed prompts—lighting angles, material textures,
composition rules—delivering exactly what you described without trial-and-error iterations."
```

#### Feature 2: Seamless Multi-Image Fusion

**用户角色**: 电商团队、品牌营销
**痛点**: 需要产品在生活场景中的展示，但实景拍摄成本高（模特、场地、摄影师）

**Prompt 示例**:
```
Input: "Product cutout on white background: luxury silver smartwatch with black leather strap,
       front view, clean studio product photography, no shadows"

Transform: "Place the smartwatch on a person's wrist in a modern coffee shop scene:
           wooden table, laptop in background softly blurred, warm afternoon natural light
           from window on left, lifestyle product photography for advertisement,
           keep watch design exactly the same"
```

**描述**:
```
"Turn product cutouts into lifestyle scenes instantly. Perfect for e-commerce teams
who need to show products in context without expensive photoshoots. Maintains product
accuracy while adding realistic environments, lighting, and human interaction."
```

---

## 🔍 常见问题

### Q1: 为什么图片生成后前端没有显示？

**原因**: Next.js 缓存了 i18n JSON 文件

**解决方案**:
```bash
# 1. 清除 Next.js 缓存
rm -rf .next

# 2. 重启开发服务器
lsof -ti:3000 | xargs kill -9
pnpm dev

# 3. 浏览器硬刷新
Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

### Q2: 图片分辨率不够清晰怎么办？

**检查点**:
1. **生成参数**: 确保脚本中 `image_size: '1:1'` → 1024×1024
2. **Next.js Image 组件**: 确保 `width={1024} height={1024}`
3. **next.config.mjs**: 确保 `imageSizes` 数组包含 1024

```typescript
// next.config.mjs
images: {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200],
}
```

### Q3: 如何验证图片已成功上传到 R2？

```bash
# 检查图片是否存在
curl -I https://r2.veo3ai.io/intro/[model-name]/[filename].png

# 应该返回 HTTP/1.1 200 OK
```

### Q4: image-to-image 任务失败怎么办？

**常见原因**:
1. **依赖任务未完成**: 检查 `dependsOn` 的任务是否成功
2. **输入图片 URL 失效**: 确保依赖任务的 R2 URL 可访问
3. **API 限流**: 增加任务间隔时间（默认 2 秒）

---

## 📝 检查清单

### 准备阶段
- [ ] 研究模型核心能力（3-5 个）
- [ ] 识别目标用户（设计师/营销/开发者/电商）
- [ ] 列出每个用户角色的 2-3 个痛点

### 内容设计
- [ ] 定义 5-6 个 Key Features
- [ ] 每个 Feature 有明确的用户角色和痛点
- [ ] 编写详细的业务场景 prompt
- [ ] 确定图片类型（text-to-image / image-to-image）

### 图片生成
- [ ] 配置 `IMAGE_TASKS` 数组
- [ ] 设置正确的 R2 路径和 JSON 文件路径
- [ ] 运行批量生成脚本
- [ ] 验证所有图片成功上传到 R2

### 文案优化
- [ ] 使用"用户角色 + 痛点 + 解决方案"公式
- [ ] 每个描述控制在 2-3 句话
- [ ] 避免技术术语，聚焦业务价值
- [ ] 包含可量化的价值（数字、时间、成本）

### 发布验证
- [ ] 清除 Next.js 缓存
- [ ] 重启开发服务器
- [ ] 浏览器硬刷新
- [ ] 检查所有图片加载正常
- [ ] 检查文案更新正确
- [ ] 检查图片分辨率清晰度

---

## 🎯 总结

### 核心要点

1. **用户价值驱动**: 不要展示"AI能做什么"，而是"用户用AI解决什么问题"
2. **真实业务场景**: 不要用"熊猫吃竹子"，而是"电商产品摄影"
3. **可量化价值**: 不要说"快速"，而是"一次生成 50-200 个变体"
4. **自动化工具**: 使用批量生成脚本，从 6.5 小时缩短到 2.5 小时

### 下次制作新模型落地页时：

1. **复制脚本文件夹** (1分钟)
2. **修改 3 个关键配置** (5分钟)
   - IMAGE_TASKS 数组
   - JSON 文件路径
   - R2 存储路径
3. **运行一键生成** (30分钟 - 自动)
4. **验证效果** (15分钟)

**总时间**: ~1小时（自动化后）

---

*最后更新: 2025-10-16*
*作者: Veo3 AI Team*
