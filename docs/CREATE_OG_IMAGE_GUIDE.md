# 创建 OG 社交媒体图片指南

## 图片规格要求
- **尺寸**: 1200x630px (Facebook/Twitter 推荐)
- **格式**: PNG 或 JPG
- **文件名**: `og-image.png`
- **路径**: `/public/og-image.png`

## 设计内容建议

### 主要元素
1. **Logo**: Seedance logo (左上角)
2. **主标题**: "Seedance AI Video Generator" (大字体，居中)
3. **副标题**: "Create Professional 1080p Videos" (中等字体)
4. **关键特性**: "Multi-Shot Storytelling • Cinematic Quality"
5. **CTA**: "Try Free Today"

### 设计规范
- **背景**: 深色渐变 (#000000 到 #1a1a1a)
- **主文字**: 白色 (#FFFFFF)
- **强调色**: 品牌主色 (如有的话)
- **字体**: Sans-serif, 现代感强

### 在线工具推荐
1. **Canva**: [canva.com](https://canva.com) - 有现成的社交媒体模板
2. **Figma**: [figma.com](https://figma.com) - 专业设计工具
3. **Adobe Express**: [express.adobe.com](https://express.adobe.com) - 免费设计工具

## 快速创建步骤 (使用Canva)

1. 访问 canva.com
2. 选择 "Custom Size" → 1200 x 630 px
3. 添加深色背景
4. 添加文字:
   - 标题: "Seedance AI Video Generator"
   - 副标题: "Create Professional 1080p Videos"
   - 特性: "Multi-Shot Storytelling • Cinematic Quality"
5. 下载为 PNG 格式
6. 重命名为 `og-image.png`
7. 放入 `/public/` 目录

## 临时解决方案
如果暂时没有图片，可以使用以下代码生成纯色背景的图片：

```html
<!-- 可以使用 HTML/CSS 生成简单的 OG 图片 -->
<div style="width:1200px;height:630px;background:linear-gradient(135deg,#000,#333);color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:Arial;">
  <h1 style="font-size:60px;margin:0;">Seedance</h1>
  <h2 style="font-size:36px;margin:10px 0;">AI Video Generator</h2>
  <p style="font-size:24px;margin:0;">Create Professional 1080p Videos</p>
</div>
```

完成后请将图片保存到项目的 `public/og-image.png` 路径。