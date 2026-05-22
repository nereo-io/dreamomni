# 首页 Hero 改为 seedance 全屏背景视频风格

日期:2026-05-21

## 背景与目标

geminiomni 首页(`app/[locale]/(default)/page.tsx`)顶部当前是浅色内联 hero(左侧文字 + 右侧视频卡片)。目标:替换为与 seedance 项目一致的**全屏背景视频 Hero**(居中白色标题 + 描述 + 两个 RainbowButton),复用 geminiomni 中已存在、与 seedance 完全相同的 `components/blocks/hero` 组件;背景视频换成指定的 Gemini Omni 介绍片;poster 换成从该视频抽帧的新封面。首页下方所有 Gemini Omni SEO 板块**原样保留**。

## 关键发现

- geminiomni 已包含与 seedance 字节一致的 `components/blocks/hero/{index,bg,happy-users}.tsx`,但首页未引用(目前仅该组件自身 import 其类型)。所需依赖(`components/ui/rainbow-button`、`hooks/useHasInteracted`、`components/icon`、`types/blocks/hero.d.ts`、`public/imgs/intro/` poster 目录)均已存在。
- seedance 的 hero 数据通路 `getLandingPage(locale).hero` 在 geminiomni 中仍是旧的 "Seedance 2.0" 文案 → **不复用该数据源**,否则首页会显示 Seedance 品牌。
- `HERO_VIDEO_SRC` / `HERO_POSTER_SRC` 在 `bg.tsx` 中硬编码;该 Hero 组件目前无其他页面引用,直接改安全。

## 设计决策(已与用户确认)

1. **范围**:仅替换首屏 hero `<section>`,保留下方所有 SEO 板块。
2. **文案源**:`getGeminiOmniLandingCopy(locale).hero`(9 语言 i18n、Gemini Omni 品牌)。构造 Hero prop:`{ name: 'hero', title: copy.hero.title, highlight_text: 'Gemini Omni', description: copy.hero.description }`。
3. **按钮**:保持 seedance 原样硬编码 "Image to Video"→`/image-to-video`、"Text to Video"→`/text-to-video`,**不改** `components/blocks/hero/index.tsx`。
4. **背景视频**:`HERO_VIDEO_SRC` = `https://r2.seedance.tv/intro/gemini%20omin/YTDown_YouTube_Introducing-Gemini-Omni-Create-Anything-_Media_KUyRq7szZsM_002_720p.mp4`(已验证可达,7.5MB,video/mp4)。
5. **poster**:安装 ffmpeg,从视频抽一帧 → 转 webp → `public/imgs/intro/gemini-omni-hero-poster.webp`,更新 `HERO_POSTER_SRC`。

## 改动清单

1. `components/blocks/hero/bg.tsx`:更新 `HERO_VIDEO_SRC` 与 `HERO_POSTER_SRC` 两个常量。
2. `public/imgs/intro/gemini-omni-hero-poster.webp`:新增(从视频抽帧生成)。
3. `app/[locale]/(default)/page.tsx`:删除内联 hero `<section>`(约 182–267 行)与不再使用的 import;新增 `import Hero from '@/components/blocks/hero'`;构造 `heroData` 并渲染 `<Hero hero={heroData} />`;调整外层结构,确保 `HeroBg` 的 `absolute inset-0 -z-50` 背景视频正确铺满首屏、文字浮于其上。

## 风险与验证

- **布局/定位上下文**:`HeroBg` 用 `absolute inset-0 -z-50`,需确保其定位上下文使背景视频铺满首屏区域且文字浮于其上;当前 `<main className="min-h-screen bg-slate-950 text-white">` 结构需参照 seedance 首页调整。实现后用浏览器验证实际渲染。
- **视觉过渡**:深色全屏 hero 下方紧接白色 examples section,过渡正常。
- **移动端性能**:`bg.tsx` 已含「移动端 / 省流量 / prefers-reduced-motion 不自动下载视频 + 桌面端 idle 延迟加载」逻辑,poster 作为首屏 LCP 图(priority + eager)。抽帧 poster 的质量直接影响 LCP 观感。
- **验证**:`pnpm dev` → 浏览器查看 `/`(及 `/zh` 等其他 locale):全屏背景视频可播放、标题高亮 "Gemini Omni"、两个按钮跳转正确、下方 SEO 板块完整无回归、移动视口不自动拉取视频、poster 正常显示。
- 非必要不跑 `pnpm lint` / `pnpm build`(用户偏好 `CLAUDE.local.md`)。

## 非目标

- 不改动下方任何 SEO 板块的内容或样式。
- 不引入 `AIModelsHero` / `DeferredHomepageSections` 等 seedance 特有板块。
- 不改 `components/blocks/hero/index.tsx`(按钮文字、布局保持原样)。

## 实现备注(实际偏离)

1. **抽帧工具**:本机未装 Homebrew/ffmpeg。改用 macOS 自带 `qlmanage` + pip `imageio-ffmpeg`(自带 ffmpeg 二进制,不污染系统)生成 contact sheet 选帧,最终取第 36s 的太空宇航员镜头。
2. **poster 格式**:`sips` 不支持 webp 输出,poster 改为 `gemini-omni-hero-poster.jpg`(1280×720,~127KB),`HERO_POSTER_SRC` 相应改用 `.jpg`。
3. **深色遮罩(可读性修复)**:指定视频是 Google 官方介绍片,整体偏亮(大量白底/线描/vlog 画面),白色 hero 文字可读性差。在 `bg.tsx` 的 HeroBg 内、视频之上加了一层自上而下的深色渐变遮罩 `bg-gradient-to-b from-black/40 via-black/45 to-black/65`。seedance 原组件无此遮罩(其背景视频偏暗,白字本就清晰)。
4. **待用户确认**:该介绍片内容较杂、调性偏生活化,与 "cinematic AI video" 的定位有差距。若不满意可更换为更暗/更具电影感的背景视频(只需改 `HERO_VIDEO_SRC` 并重抽 poster)。

## v2 调整(改为卡片式视频 hero,2026-05-22)

全屏背景视频版上线后,确认指定的 Google 介绍片偏亮且内容偏生活化,即便加遮罩,全屏背景观感仍不理想。用户决定改成 seedance `AIModelsHero` 式的**居中清晰视频卡片**(而非模糊全屏背景):

- **新增** `components/blocks/omni-video-hero/index.tsx`(client 组件):深色 section(`bg-slate-950`)+ 标题(Gemini Omni 高亮,沿用 seedance Hero 的 `split + 渐变 span` 逻辑)+ 描述 + 两个 RainbowButton(Image/Text to Video)+ 16:9 圆角视频卡片(借用 `AIModelsHero` 的 `useInViewport` 进视口自动播放 + `controls`)。图标改用 lucide(`ImageIcon`/`Type`)避免依赖 Icon 组件的图标注册。
- **`page.tsx`**:`<Hero hero={heroData}>` → `<OmniVideoHero .../>`,删除 `heroData`。
- **`bg.tsx`**:首页不再用全屏背景 Hero 组件,`git checkout db76d2dc^` 还原为 seedance 原版。
- 视频源仍用指定的 Gemini Omni 介绍片(卡片内清晰展示,不再压暗/裁切),poster 沿用抽帧太空帧。可选:换成 seedance `cover-video.mp4`(眼睛特写)做更纯粹的电影感卡片。
- 注:`db76d2dc` 之后仓库新增 `305b7f7d`(首页 SEO 板块本地化,page.tsx 扩到 ~1407 行),本次改动基于该状态。
