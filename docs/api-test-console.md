# API Console Testing Guide

在浏览器开发者工具的 Console 中直接测试 API，比 HTTP 文件更简单直接。

## 基础 API 测试

### 1. 检查用户积分

```javascript
fetch("/api/credits", {
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```

### 2. 获取用户信息

```javascript
fetch("/api/user/info", {
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```

## PixVerse 视频特效生成

### 基础测试（无图片上传）

```javascript
fetch("/api/video-effects/pixverse", {
  method: "POST",
  credentials: "include",
  body: (() => {
    const formData = new FormData();
    formData.append("effect_id", "muscle-surge-effect");
    formData.append(
      "prompt",
      "Earth planet transforming with amazing cosmic effects"
    );
    formData.append("duration", "5");
    formData.append("quality", "540p");
    formData.append("model", "v4.5");
    return formData;
  })(),
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

### 带图片上传的测试

#### 方法 1：使用本地文件（public/1.png）

```javascript
// 使用fetch获取本地图片文件
fetch("/1.png")
  .then((response) => response.blob())
  .then((blob) => {
    const formData = new FormData();
    formData.append("effect_id", "342180291926592");
    formData.append(
      "prompt",
      "Earth planet transforming with amazing cosmic effects"
    );
    formData.append("duration", "5");
    formData.append("quality", "540p");
    formData.append("model", "v4.5");
    formData.append("image1", blob, "1.png");

    return fetch("/api/video-effects/pixverse", {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  })
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

#### 方法 2：选择本地文件上传

```javascript
// 创建文件选择器
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append("effect_id", "muscle-surge-effect");
    formData.append(
      "prompt",
      "Earth planet transforming with amazing cosmic effects"
    );
    formData.append("duration", "5");
    formData.append("quality", "540p");
    formData.append("model", "v4.5");
    formData.append("image1", file);

    fetch("/api/video-effects/pixverse", {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((r) => r.json())
      .then(console.log)
      .catch(console.error);
  }
};
// 触发文件选择
fileInput.click();
```

### 一行版本（复制粘贴友好）

```javascript
fetch("/api/video-effects/pixverse", {
  method: "POST",
  credentials: "include",
  body: (() => {
    const f = new FormData();
    f.append("effect_id", "muscle-surge-effect");
    f.append("prompt", "Earth planet transforming with amazing cosmic effects");
    f.append("duration", "5");
    f.append("quality", "540p");
    f.append("model", "v4.5");
    return f;
  })(),
})
  .then((r) => r.json())
  .then(console.log);
```

## 视频生成状态查询

```javascript
// 使用上面返回的ID替换 'your-generation-id'
fetch("/api/video-generation/status", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: "your-generation-id",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

## 生成历史查询

```javascript
fetch("/api/video-generations/history?page=1&limit=5", {
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```

## Prompt 优化测试

### 纯文字优化

```javascript
fetch("/api/video-generation/optimize-prompt", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    videoGenerationId: "057a488c-c5fc-4f53-97b7-6e98b7e41410",
    originalPrompt: "一只可爱的小猫在花园里玩耍",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

### 文字+图片多模态优化

```javascript
fetch("/api/video-generation/optimize-prompt", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    videoGenerationId: "057a488c-c5fc-4f53-97b7-6e98b7e41410",
    originalPrompt: "美丽的日落风景，天空中有云朵",
    imageUrl: "https://picsum.photos/id/1018/800/600",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

## 使用说明

1. **打开浏览器开发者工具**：按 F12 或右键 → 检查元素
2. **切换到 Console 标签页**
3. **确保已登录**：在网站上正常登录
4. **复制粘贴代码**：直接运行即可
5. **查看结果**：API 响应会直接显示在 console 中

## 优势

- ✅ 自动携带登录状态（cookies）
- ✅ 不需要手动配置认证信息
- ✅ 直接在已登录的浏览器环境中测试
- ✅ 支持文件上传等复杂操作
- ✅ 实时查看响应结果
