# Reference-to-Video 落地页 - 技术方案

## 方案概要

**目标**：构建可复用的通用落地页组件体系，适用于所有模型页面（reference-to-video、text-to-video、image-to-video 等）

**核心原则**："好品味" - 通过配置驱动所有变化，消除特殊情况，而不是用条件判断

---

## 1. 组件架构

### 1.1 设计哲学

- **单一职责**：每个组件只做一件事
- **数据驱动**：所有变化通过 props 控制，而不是内部逻辑
- **零特殊情况**：组件内部没有模型专属代码
- **视觉一致性**：所有组件共享相同的设计语言

### 1.2 组件层级

```
reference-to-video/page.tsx
├── VideoGenerationTool (现有组件)
├── LandingPageHero (新建，通用)
├── FeatureHighlights (新建，通用)
├── ModelUsageGuide (现有组件，复用)
├── FAQSection (现有组件，复用)
└── CTA (现有组件，复用)
```

---

## 2. 组件设计

### 2.1 LandingPageHero 组件

**用途**：所有模型落地页的通用 Hero 区块

**视觉规范**（与 VideoEffectHero 保持一致）：

- 背景色：`bg-gradient-to-b from-black to-gray-950`
- 内边距：`pt-16 pb-8`
- 标题：`text-3xl md:text-4xl lg:text-5xl font-bold` 渐变色 `from-purple-400 to-pink-400`
- 描述：`text-base md:text-lg text-gray-300`
- 按钮：`RainbowButton`
- 视频容器：`rounded-2xl` 渐变边框 `from-purple-900/20 to-pink-900/20`

**TypeScript 接口定义**：

```typescript
// types/blocks/landing-page-hero.ts
export interface LandingPageHero {
  title: string;
  description: string;
  cta?: {
    buttonText: string;
    onClick?: () => void; // Optional custom handler
    scrollTarget?: string; // Default: "[data-video-generation-tool]"
  };
  media?: {
    type: "video" | "image";
    src: string;
    poster?: string; // For video
    alt?: string; // For image
  };
  badge?: {
    text: string;
    variant?: "default" | "beta" | "new";
  };
}
```

**组件 Props**：

```typescript
interface LandingPageHeroProps {
  data: LandingPageHero;
}
```

**核心功能**：

- CTA 点击自动滚动到生成器工具
- 视频自动播放、循环、静音
- 视频不可用时优雅降级到封面/图片
- 可选的徽章（如 "Beta"、"新模型"）

---

### 2.2 FeatureHighlights 组件

**用途**：展示 1-n 个核心特性，媒体左右交替布局

**视觉规范**（与 HowToUse 风格一致）：

- 背景色：`bg-gray-900`（非透明）
- 区块内边距：`py-20 px-6`
- 特性卡片：`bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50`
- 卡片内边距：`p-8`
- 标题：`text-2xl md:text-3xl font-semibold text-white`
- 描述：`text-gray-300 text-lg leading-relaxed`
- 媒体容器：`rounded-xl overflow-hidden`

**TypeScript 接口定义**：

```typescript
// types/blocks/feature-highlights.ts
export interface Feature {
  id: string;
  title: string;
  description: string;
  highlights?: string[]; // Optional bullet points
  media?: {
    type: "image" | "video";
    src: string;
    alt: string;
    poster?: string; // For video
  };
  mediaPosition?: "left" | "right"; // Default: auto (alternating)
}

export interface FeatureHighlights {
  title?: string; // Optional section title
  features: Feature[];
  cta?: {
    buttonText: string;
    scrollTarget?: string;
  };
}
```

**组件 Props**：

```typescript
interface FeatureHighlightsProps {
  data: FeatureHighlights;
}
```

**布局逻辑**：

```typescript
// 如果未指定 mediaPosition，则自动左右交替
features.map((feature, index) => {
  const position =
    feature.mediaPosition || (index % 2 === 0 ? "right" : "left");
  // ...
});
```

**核心功能**：

- 自动左右交替布局（可配置覆盖）
- 优雅处理缺失媒体（文本全宽显示）
- 可选的亮点列表（bullet points）
- 响应式：移动端垂直堆叠

---

### 2.3 ModelUsageGuide 组件（复用现有）

**用途**：分步指南的展示（复用 model-landing-page 的组件）

**视觉特点**：

- 背景：地球图 + 遮罩 `bg-gray-950/75 backdrop-blur-sm`
- 区块内边距：`py-12`
- 标题：`text-4xl md:text-5xl font-bold`
- 步骤网格：`grid-cols-1 md:grid-cols-3 gap-8`
- 步骤卡片：`bg-card/80 backdrop-blur-md rounded-xl p-8 border border-border`
- 动画：渐入动画 + hover 上浮效果

**TypeScript 接口定义**（已存在）：

```typescript
// types/pages/model-landing-page.ts
export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface UsageGuideSection {
  title: string;
  description: string;
  steps: Step[];
  buttonText: string;
}

export interface ModelUsageGuideProps {
  section: UsageGuideSection;
}
```

**使用方式**：

```tsx
import ModelUsageGuide from "@/components/blocks/model-landing-page/model-usage-guide";

<ModelUsageGuide section={pageData.usageGuide} />;
```

---

## 3. 数据结构设计

### 3.1 i18n 文件结构

```
i18n/pages/reference-to-video/
├── en.json
├── zh.json
└── ...
```

### 3.2 JSON 数据结构

```json
{
  "hero": {
    "title": "Reference-to-Video: Consistent Character Generation",
    "description": "Upload 1-3 reference images and generate videos with perfect character consistency across all frames. Create unlimited scenes while maintaining character identity.",
    "cta": {
      "buttonText": "Try Reference-to-Video Now",
      "scrollTarget": "[data-video-generation-tool]"
    },
    "media": {
      "type": "video",
      "src": "https://r2.veo3ai.io/landing/reference-to-video-hero.mp4",
      "poster": "/imgs/reference-to-video/hero-poster.jpg",
      "alt": "Reference-to-video demonstration"
    },
    "badge": {
      "text": "Powered by Veo 3.1",
      "variant": "default"
    }
  },
  "features": {
    "title": "Why Choose Reference-to-Video?",
    "features": [
      {
        "id": "character-consistency",
        "title": "Perfect Character Identity Lock",
        "description": "Upload 1-3 reference images of your character from different angles. Our AI analyzes facial features, clothing, and style to maintain 100% consistency across every frame.",
        "highlights": [
          "Supports 1-3 reference images",
          "Multi-angle analysis for better accuracy",
          "Consistent across all video frames"
        ],
        "media": {
          "type": "image",
          "src": "/imgs/reference-to-video/feature-consistency.jpg",
          "alt": "Character consistency demonstration"
        }
      },
      {
        "id": "scene-flexibility",
        "title": "Unlimited Scene Possibilities",
        "description": "Lock your character's identity, then place them in any scene you imagine. From fantasy worlds to realistic environments, your character maintains their appearance.",
        "highlights": [
          "Any scene, any environment",
          "Full creative control with prompts",
          "High-quality 1080p output"
        ],
        "media": {
          "type": "video",
          "src": "https://r2.veo3ai.io/landing/scene-flexibility.mp4",
          "poster": "/imgs/reference-to-video/scene-poster.jpg",
          "alt": "Scene flexibility demonstration"
        },
        "mediaPosition": "left"
      },
      {
        "id": "quality-output",
        "title": "Professional-Grade Results",
        "description": "Generate broadcast-quality videos with smooth motion, natural lighting, and cinematic effects. Perfect for content creators, marketers, and storytellers.",
        "highlights": [
          "Up to 8-second video duration",
          "1080p resolution support",
          "Natural motion and lighting"
        ],
        "media": {
          "type": "image",
          "src": "/imgs/reference-to-video/quality-output.jpg",
          "alt": "Professional quality output"
        }
      }
    ],
    "cta": {
      "buttonText": "Start Creating Now",
      "scrollTarget": "[data-video-generation-tool]"
    }
  },
  "usageGuide": {
    "title": "How to Use Reference-to-Video?",
    "description": "Follow these simple steps to create videos with consistent character identity",
    "steps": [
      {
        "number": "1",
        "title": "Upload Reference Images",
        "description": "Select 1-3 high-quality images of your character from different angles. Clear, well-lit photos work best."
      },
      {
        "number": "2",
        "title": "Describe Your Scene",
        "description": "Write a detailed prompt describing the action, environment, and mood. Be specific about what you want your character to do."
      },
      {
        "number": "3",
        "title": "Generate & Download",
        "description": "Click generate and wait 60-120 seconds. Your video will maintain perfect character consistency throughout."
      }
    ],
    "buttonText": "Try Reference-to-Video Now"
  },
  "faq": {
    "title": "FAQs",
    "description": "Find answers to common questions about our AI reference-to-video generation with consistent character features.",
    "items": [
      {
        "id": "what-is-reference-to-video",
        "question": "What is reference-to-video with consistent character?",
        "answer": "Reference-to-video is an advanced AI feature that uses 1-3 reference images to generate videos while maintaining consistent character identity, appearance, and style across all frames."
      }
    ]
  },
  "cta": {
    "title": "Create Videos with Consistent Characters!",
    "buttonText": "Try Reference-to-Video Now"
  }
}
```

### 3.3 TypeScript 类型定义

```typescript
// types/pages/reference-to-video.ts
import { LandingPageHero } from "@/types/blocks/landing-page-hero";
import { FeatureHighlights } from "@/types/blocks/feature-highlights";
import { UsageGuideSection } from "@/types/pages/model-landing-page";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ReferenceToVideoPage {
  hero: LandingPageHero;
  features: FeatureHighlights;
  usageGuide: UsageGuideSection;
  faq: {
    title: string;
    description: string;
    items: FAQItem[];
  };
  cta: {
    title: string;
    buttonText: string;
  };
}
```

---

## 4. 视觉设计规范

### 4.1 色彩系统（现有体系）

```css
/* 背景图层 */
--bg-hero: linear-gradient(to bottom, black, rgb(3, 7, 18));
--bg-section: rgb(17, 24, 39); /* gray-900 */
--bg-card: rgba(31, 41, 55, 0.5); /* gray-800/50 */

/* 文本颜色 */
--text-primary: white;
--text-secondary: rgb(209, 213, 219); /* gray-300 */
--text-muted: rgb(156, 163, 175); /* gray-400 */

/* 渐变色 */
--gradient-text: linear-gradient(
  to right,
  rgb(192, 132, 252),
  rgb(244, 114, 182)
); /* purple-400 to pink-400 */
--gradient-border: linear-gradient(
  to right,
  rgba(88, 28, 135, 0.2),
  rgba(131, 24, 67, 0.2)
);

/* 边框颜色 */
--border-card: rgba(55, 65, 81, 0.5); /* gray-700/50 */
```

### 4.2 文字排版

```css
/* Hero 标题 */
.hero-title {
  font-size: clamp(1.875rem, 5vw, 3rem); /* 3xl → 5xl */
  font-weight: 700;
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 区块标题 */
.section-title {
  font-size: clamp(1.5rem, 4vw, 2.25rem); /* 2xl → 4xl */
  font-weight: 700;
  color: var(--text-primary);
}

/* 特性标题 */
.feature-title {
  font-size: clamp(1.5rem, 3vw, 1.875rem); /* 2xl → 3xl */
  font-weight: 600;
  color: var(--text-primary);
}

/* 正文文本 */
.body-text {
  font-size: clamp(1rem, 2vw, 1.125rem); /* base → lg */
  line-height: 1.75;
  color: var(--text-secondary);
}
```

### 4.3 间距与布局

```css
/* 区块间距 */
.section-padding {
  padding-top: 5rem; /* 20 */
  padding-bottom: 5rem;
  padding-left: 1.5rem; /* 6 */
  padding-right: 1.5rem;
}

/* 卡片内边距 */
.card-padding {
  padding: 2rem; /* 8 */
}

/* 网格间距 */
.feature-gap {
  gap: 3rem; /* 桌面端 12 */
  gap: 2rem; /* 移动端 8 */
}
```

### 4.4 组件边框与效果

```css
/* 卡片样式 */
.card {
  background: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  border: 1px solid rgba(55, 65, 81, 0.5);
}

/* 视频/图片容器 */
.media-container {
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* 渐变边框（Hero 视频用） */
.gradient-border {
  padding: 1px;
  background: linear-gradient(
    to right,
    rgba(88, 28, 135, 0.2),
    rgba(131, 24, 67, 0.2)
  );
  border-radius: 1rem;
}
```

---

## 5. 实施计划

### 阶段 1：类型定义

1. 创建 `types/blocks/landing-page-hero.ts`
2. 创建 `types/blocks/feature-highlights.ts`
3. 创建 `types/pages/reference-to-video.ts`

### 阶段 2：组件实现

1. 创建 `components/blocks/landing-page-hero/index.tsx`
2. 创建 `components/blocks/feature-highlights/index.tsx`

### 阶段 3：数据与服务

1. 更新 `i18n/pages/reference-to-video/en.json` 为新数据结构
2. 更新 `services/page.ts` - 添加 `getReferenceToVideoPage()` 并使用正确类型

### 阶段 4：页面集成

1. 重构 `app/[locale]/(home)/reference-to-video/page.tsx`
2. 用新组件替换 AIModelsHero + CreatorShowcase
3. 导入 `ModelUsageGuide` 组件
4. 测试各断点下的视觉一致性

### 阶段 5：验收测试

1. 视觉 QA：与 VideoEffectHero 和 ModelUsageGuide 对比
2. 响应式测试：移动端、平板、桌面
3. 无障碍性：ARIA 标签、键盘导航
4. 性能：视频懒加载、图片优化

---

## 6. 迁移策略

### 保留现有组件（无破坏性变更）

- `VideoEffectHero` - 仍被 `/video-effects/[slug]` 使用
- `HowToUse` - 仍被 `/video-effects/[slug]` 使用
- `ModelUsageGuide` - 被多个 model landing page 使用
- `AIModelsHero` - 仍被 `/image-to-video` 使用
- `CreatorShowcase` - 仍被 `/image-to-video` 使用

### 新增组件（增量添加）

- `LandingPageHero` - 新建，通用版本
- `FeatureHighlights` - 新建，填补空白

### 未来统一（可选）

稳定后可考虑：

1. 迁移 `/text-to-video` 使用新组件
2. 迁移 `/image-to-video` 使用新组件
3. 所有页面迁移完成后废弃旧组件

---

## 7. 使用示例

### 页面组件代码

```tsx
// app/[locale]/(home)/reference-to-video/page.tsx
import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { LandingPageHero } from "@/components/blocks/landing-page-hero";
import { FeatureHighlights } from "@/components/blocks/feature-highlights";
import ModelUsageGuide from "@/components/blocks/model-landing-page/model-usage-guide";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import { getReferenceToVideoPage } from "@/services/page";

export default async function ReferenceToVideoPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const pageData = await getReferenceToVideoPage(locale);

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool
        mode="image-to-video"
        generationType="REFERENCE_2_VIDEO"
      />

      {/* Hero Section */}
      <LandingPageHero data={pageData.hero} />

      {/* Feature Highlights */}
      <FeatureHighlights data={pageData.features} />

      {/* How to Use */}
      <ModelUsageGuide section={pageData.usageGuide} />

      {/* FAQ Section */}
      <FAQSection
        title={pageData.faq.title}
        description={pageData.faq.description}
        faqItems={pageData.faq.items}
      />

      {/* CTA Section */}
      <CTA
        section={{
          title: pageData.cta.title,
          buttons: [
            {
              title: pageData.cta.buttonText,
              url: "/reference-to-video",
            },
          ],
        }}
      />
    </>
  );
}
```

---

## 8. 测试清单

### 视觉一致性

- [ ] Hero 渐变色与 VideoEffectHero 一致
- [ ] Feature 卡片与 HowToUse 卡片一致
- [ ] RainbowButton 在所有区块外观一致
- [ ] 间距节奏统一（区块垂直间距 20）

### 功能性

- [ ] CTA 按钮滚动到生成器工具
- [ ] 视频自动播放、循环、静音
- [ ] 视频失败时降级到封面图
- [ ] 响应式布局：移动端 → 平板 → 桌面

### 无障碍性

- [ ] 所有图片有 alt 文本
- [ ] 视频有 aria-label
- [ ] 键盘导航正常工作
- [ ] 颜色对比度符合 WCAG AA

### 性能

- [ ] 折叠下方视频懒加载
- [ ] 图片优化（WebP，合适尺寸）
- [ ] 加载时无布局偏移
- [ ] 首次内容绘制 < 1.5s

---

## 9. 待确认问题

### 内容素材

1. **Hero 视频**：有 reference-to-video 演示视频吗？尺寸？时长？ 没有演示视频，先占位，具体展示尺寸样式和 VideoEffectHero 保持一致
2. **Feature 媒体**：有 3 个展示特性的图片/视频吗？ 没有，先占位
3. **徽章文本**："Powered by Veo 3.1" 还是 "Beta" 还是其他？ 不需要

### 设计决策

1. **区块背景**：features 用 `bg-gray-900` 还是继承父级？ 继承父级
2. **Feature 布局**：始终左右交替，还是允许配置覆盖？Feature 布局我设想的就是最简单的每个 feature 居中展示
3. **CTA 位置**：在 features 后？在 how-to-use 后？两处都放？ 放在 how-to-use 后

### 技术问题

1. **视频托管**：像现有视频一样用 R2，还是其他 CDN？ R2
2. **图片优化**：用 Next.js Image 组件还是原生 `<img>`？你来定
3. **i18n 降级**：如果 zh.json 缺失，降级到 en.json？ 是的

---

## 10. 成功指标

### 代码质量

- 组件间零重复样式
- 所有组件 < 200 行代码
- 100% TypeScript 类型覆盖
- 零 props 层层传递（数据流清晰）

### 用户体验

- 视觉一致性：10/10（与现有设计匹配）
- 页面加载时间：3G 网络 < 2s
- 移动端体验：无横向滚动、文字不过小
- 无障碍评分：100/100（Lighthouse）

### 可维护性

- 新模型页面可直接复用组件无需修改
- 非技术团队可通过 JSON 更新内容
- 没有特定模型的"特殊情况"代码
- 清晰分离：内容（i18n）vs 展示（组件）

---

## 附录：文件结构

```
veo3-main/
├── components/blocks/
│   ├── landing-page-hero/
│   │   └── index.tsx (新建)
│   ├── feature-highlights/
│   │   └── index.tsx (新建)
│   └── model-landing-page/
│       └── model-usage-guide.tsx (复用现有)
├── types/blocks/
│   ├── landing-page-hero.ts (新建)
│   └── feature-highlights.ts (新建)
├── types/pages/
│   ├── model-landing-page.ts (已存在，复用 UsageGuideSection)
│   └── reference-to-video.ts (新建)
├── i18n/pages/reference-to-video/
│   ├── en.json (更新数据结构)
│   └── zh.json (待创建)
├── services/
│   └── page.ts (更新 getReferenceToVideoPage)
└── app/[locale]/(home)/reference-to-video/
    └── page.tsx (重构)
```

---

**技术方案完成**

**下一步**：审阅方案，确认设计决策，然后按阶段实施：阶段 1（类型定义）→ 阶段 2（组件实现）→ 阶段 3（数据）→ 阶段 4（集成）
