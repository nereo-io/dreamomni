# 代理服务器移除 - 具体实施方案

## 背景说明

### 问题现状
生产环境日志显示，系统在处理AI服务回调时频繁出现代理服务器连接超时错误：

```
ConnectTimeoutError: Connect Timeout Error
(attempted address: 173.242.125.44:80, timeout: 10000ms)
```

**影响范围**：
- `/api/video-generation/webhook` - 视频生成回调
- `/api/ai-callback/nano_banana` - 图片生成回调

**实际影响**：
- 每个请求额外等待10秒（代理超时）才降级到直连
- 产生大量错误日志，影响问题排查
- 用户体验下降（响应变慢）

### 决策原因
1. **代理服务器已欠费停用** - 173.242.125.44 不再可用
2. **服务已部署在海外** - Vercel/Cloudflare 与AI服务同区域，无需代理
3. **直连已验证可行** - 日志显示降级后的直连100%成功
4. **维护成本不必要** - 代理服务器成为单点故障，增加复杂度

### 技术决策
**移除代理层，全部改为直连**，理由：
- 减少10秒延迟
- 降低系统复杂度
- 提高稳定性
- 节省运维成本

## 一、当前代码架构分析

### 1.1 代理实现位置
经过代码审查，代理功能集中在以下位置：

#### 核心文件
1. **`/lib/storage.ts`** - 第99-115行
   - `downloadAndUpload` 方法包含代理逻辑
   - 通过环境变量 `PROXY_URL` 和 `PROXY_SECRET` 判断是否使用代理
   - 代理失败后自动降级到直连

2. **`/utils/video-download-proxy.ts`** - 整个文件
   - `VideoDownloadProxy` 类实现代理下载
   - 通过 `http://173.242.125.44/api/download` 转发下载请求

### 1.2 调用链路
```
图片回调: /api/ai-callback/[provider]
视频回调: /api/video-generation/webhook/
阿里回调: /api/video-generation/webhook/ali/
     ↓
services/imageStorageService.ts
services/videoStatusService.ts
services/pixverseStatusService.ts
     ↓
storage.downloadAndUpload() [/lib/storage.ts:99]
     ↓
判断 PROXY_URL && PROXY_SECRET 存在？
     ├─是→ videoDownloadProxy.downloadVideo() [代理下载]
     │     ↓ (失败)
     │     降级到直连
     └─否→ 直接使用 fetch() [直连下载]
```

### 1.3 环境变量配置
```bash
# .env.local 中的代理配置
PROXY_URL="http://173.242.125.44"
PROXY_SECRET="jUXTv+M2jKybx0/+/TFCh1JroltTGyzHvZoCwecNciE="
```

## 二、具体修改方案

### 2.1 第一步：修改 `/lib/storage.ts`

**文件位置**：`/lib/storage.ts` 第85-137行

**修改前**：
```typescript
async downloadAndUpload({
  url,
  key,
  bucket,
  contentType,
  disposition = "inline",
}: {
  url: string;
  key: string;
  bucket?: string;
  contentType?: string;
  disposition?: "inline" | "attachment";
}) {
  // 优先使用代理下载（如果配置了代理）
  if (process.env.PROXY_URL && process.env.PROXY_SECRET) {
    try {
      const { videoDownloadProxy } = await import('@/utils/video-download-proxy');
      const buffer = await videoDownloadProxy.downloadVideo(url);

      return this.uploadFile({
        body: buffer,
        key,
        bucket,
        contentType,
        disposition,
      });
    } catch (proxyError) {
      console.warn("代理下载失败，回退到直连:", proxyError);
      // 继续执行原有的直连逻辑
    }
  }

  // 原有的直连下载逻辑
  const response = await fetch(url);
  // ... 后续代码
}
```

**修改后**：
```typescript
async downloadAndUpload({
  url,
  key,
  bucket,
  contentType,
  disposition = "inline",
}: {
  url: string;
  key: string;
  bucket?: string;
  contentType?: string;
  disposition?: "inline" | "attachment";
}) {
  // 直接使用直连下载，移除代理逻辑
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // 可选：添加重试机制的 headers
      headers: {
        'User-Agent': 'Veo3AI/1.0',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No body in response");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return this.uploadFile({
      body: buffer,
      key,
      bucket,
      contentType,
      disposition,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Download timeout after 15 seconds');
    }
    throw error;
  }
}
```

### 2.2 第二步：删除代理相关文件

**完全删除**：
```bash
rm /utils/video-download-proxy.ts
```

### 2.3 第三步：清理环境变量

**从 `.env.local` 和 `.env.production` 中删除**：
```bash
# 删除这两行
PROXY_URL="http://173.242.125.44"
PROXY_SECRET="jUXTv+M2jKybx0/+/TFCh1JroltTGyzHvZoCwecNciE="
```

**从 `.env.example` 中删除（如果存在）**：
```bash
# 删除代理相关示例配置
# PROXY_URL=
# PROXY_SECRET=
```

### 2.4 第四步：添加重试机制（可选优化）

为了提高稳定性，可以在 `/lib/storage.ts` 中添加重试逻辑：

```typescript
async downloadAndUploadWithRetry({
  url,
  key,
  bucket,
  contentType,
  disposition = "inline",
  maxRetries = 2,
}: {
  url: string;
  key: string;
  bucket?: string;
  contentType?: string;
  disposition?: "inline" | "attachment";
  maxRetries?: number;
}) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for ${url}`);
        // 指数退避：1秒、2秒、4秒...
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }

      return await this.downloadAndUpload({
        url,
        key,
        bucket,
        contentType,
        disposition,
      });
    } catch (error) {
      lastError = error as Error;
      console.error(`Download attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries) {
        break;
      }
    }
  }

  throw lastError || new Error('Download failed after all retries');
}
```

## 三、保留的功能（不要删除）

### 3.1 `/api/proxy-video/route.ts` 和 `/api/proxy-image/route.ts`
**这两个文件需要保留**！它们是反向代理，用于：
- 让前端能够访问 R2 存储的资源
- 处理 CORS 问题
- 添加安全头和缓存控制
- **与代理服务器下载无关**

## 四、测试验证步骤

### 4.1 本地测试
```bash
# 1. 删除环境变量
unset PROXY_URL
unset PROXY_SECRET

# 2. 重启开发服务器
pnpm dev

# 3. 测试各个功能
- 生成一个图片（Nano Banana）
- 生成一个视频（Seedance/Veo3）
- 检查日志，确认没有"代理下载失败"的警告
```

### 4.2 验证清单
- [ ] 图片生成回调正常（/api/ai-callback/nano_banana）
- [ ] 视频生成回调正常（/api/video-generation/webhook）
- [ ] 阿里视频回调正常（/api/video-generation/webhook/ali）
- [ ] R2 上传成功
- [ ] 前端能正常播放/查看生成的内容

## 五、部署步骤

### 5.1 Vercel 部署
```bash
# 1. 在 Vercel Dashboard 中删除环境变量
# Settings → Environment Variables
# 删除 PROXY_URL 和 PROXY_SECRET

# 2. 部署新代码
git add -A
git commit -m "chore: remove proxy server, use direct connection"
git push

# 3. Vercel 会自动部署
```

### 5.2 监控指标
部署后监控以下指标：
- **错误率**：应该下降（无代理超时错误）
- **响应时间**：应该减少10秒左右
- **下载成功率**：应该保持或提升

## 六、回滚方案

如果需要回滚（虽然概率很低）：

### 6.1 快速回滚
```bash
# 1. 恢复环境变量
PROXY_URL="http://新代理服务器地址"
PROXY_SECRET="新密钥"

# 2. 恢复代码
git revert HEAD
git push
```

### 6.2 使用功能开关（推荐）
在 `/lib/storage.ts` 中保留开关：

```typescript
async downloadAndUpload(...) {
  // 通过环境变量控制是否使用代理
  const useProxy = process.env.USE_PROXY === 'true';

  if (useProxy && process.env.PROXY_URL && process.env.PROXY_SECRET) {
    // 代理逻辑
  }

  // 直连逻辑
}
```

## 七、时间估算

| 任务 | 时间 |
|-----|------|
| 修改 storage.ts | 30分钟 |
| 删除 video-download-proxy.ts | 5分钟 |
| 清理环境变量 | 10分钟 |
| 本地测试 | 1小时 |
| 部署到生产 | 15分钟 |
| 监控验证 | 2小时 |
| **总计** | **约4小时** |

## 八、风险评估

### 低风险原因
1. **已有数据支撑**：从日志看，直连一直成功
2. **代码改动小**：主要是删除代码，不是新增
3. **有降级经验**：系统已经在自动降级到直连
4. **可快速回滚**：通过环境变量即可恢复

### 潜在问题
- **无**：因为现在实际上已经在使用直连（代理总是失败）

## 九、总结

**核心改动**：
1. 修改 `/lib/storage.ts` 的 `downloadAndUpload` 方法
2. 删除 `/utils/video-download-proxy.ts`
3. 清理环境变量 `PROXY_URL` 和 `PROXY_SECRET`

**不要动**：
- `/api/proxy-video/route.ts`
- `/api/proxy-image/route.ts`

**预期效果**：
- 每个请求节省10秒
- 错误日志大幅减少
- 系统更简单可靠

---
更新时间：2024-10-18
状态：待实施