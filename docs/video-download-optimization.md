# 视频下载优化方案

## 背景

### 当前实现原因

为了解决 **移动端特别是 Safari 浏览器无法下载视频** 的问题，当前所有视频下载都通过 Vercel 服务端代理实现。

**关键实现文件**：
- `/app/api/proxy-video/route.ts` - 视频代理下载 API
- `components/blocks/video-history/index.tsx:252-301` - Video History 下载逻辑
- `components/blocks/agent/AgentJobItem.tsx:76-131` - Agent 下载逻辑

### 当前方案的流程

```
用户点击下载
   ↓
浏览器 fetch → Vercel API (/api/proxy-video)
                    ↓
                Vercel fetch → R2 Storage
                    ↓
                返回视频流 + Content-Disposition header
                    ↓
            用户浏览器下载成功 ✓
```

### 为什么需要代理

1. **CORS 限制**：浏览器跨域下载受限
2. **关键 Header 缺失**：R2 直接链接缺少 `Content-Disposition: attachment`，导致浏览器播放而非下载
3. **Safari 兼容性**：iOS Safari 对跨域下载限制严格，必须有正确的响应头
4. **安全考虑**：限制只能代理白名单域名

## 当前方案的问题

### 性能问题
- ❌ 消耗 Vercel 带宽（视频文件几十 MB）
- ❌ 增加服务器负载和响应时间
- ❌ 用户下载速度受限于 **Vercel → R2 → 用户** 的双跳网络
- ❌ 用户体验差：下载速度慢，需要等待代理转发

### 成本问题
- ❌ Vercel 带宽消耗大（Pro 计划 $20/月，100GB 带宽）
- ❌ 每个视频 30-50MB，1000 次下载 = 30-50GB 带宽
- ❌ 可能超出免费套餐限制，产生额外费用

### 代码维护
- 需要在多个组件中复制相同的下载逻辑
- 每次新增下载功能都要实现 `createProxyDownloadUrl` + `triggerDownload`

## 推荐优化方案：Cloudflare Workers

### 方案优势

✅ **性能提升**
- 无需 Vercel 带宽，直接从 R2 到用户
- Cloudflare 全球 300+ 边缘节点，自动就近访问
- R2 → Cloudflare Workers 流量免费
- 预期下载速度提升 **2-3 倍**

✅ **成本节约**
- Workers 免费套餐：每天 10 万请求（足够使用）
- R2 出站流量到 Workers 免费
- 节省 Vercel 带宽费用

✅ **简化代码**
- 前端直接使用 Worker URL，无需代理逻辑
- 统一下载入口，易于维护

### 架构对比

**当前架构**：
```
用户 → Vercel (中转) → R2 Storage
        (慢 + 费带宽)
```

**优化架构**：
```
用户 → Cloudflare Worker → R2 Storage
        (快 + 免费)
```

## 实现步骤

### 1. 创建 Cloudflare Worker

**文件**: `workers/r2-download.js`

```javascript
// Cloudflare Worker - R2 视频下载代理
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 从路径中提取 R2 对象 key
    // 例如: https://download.veo3ai.io/videos/abc123.mp4 → videos/abc123.mp4
    const objectKey = url.pathname.slice(1);

    // 从 R2 获取对象
    const object = await env.VEO3_VIDEOS_BUCKET.get(objectKey);

    if (!object) {
      return new Response('Video not found', { status: 404 });
    }

    // 提取文件名（用于 Content-Disposition）
    const filename = objectKey.split('/').pop() || 'video.mp4';

    // 返回视频流，设置下载头
    return new Response(object.body, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Cache-Control': 'public, max-age=31536000', // 1年缓存（视频不变）
      }
    });
  }
}
```

### 2. 配置 Worker 绑定

**文件**: `wrangler.toml`

```toml
name = "veo3-video-download"
main = "workers/r2-download.js"
compatibility_date = "2024-11-14"

# 绑定 R2 bucket
[[r2_buckets]]
binding = "VEO3_VIDEOS_BUCKET"
bucket_name = "veo3-videos"

# 自定义域名（可选）
routes = [
  { pattern = "download.veo3ai.io/*", zone_name = "veo3ai.io" }
]
```

### 3. 部署 Worker

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署 Worker
cd workers
wrangler deploy

# 输出：
# Published veo3-video-download (0.0.1)
#   https://veo3-video-download.workers.dev
#   https://download.veo3ai.io
```

### 4. 修改前端代码

**简化下载逻辑** - 直接使用 Worker URL：

```typescript
// components/blocks/agent/AgentJobItem.tsx
const handleDownloadFinal = () => {
  if (!job.final_video_url) return;

  // 将 R2 URL 替换为 Worker URL
  // 例如：https://r2.veo3ai.io/videos/abc123.mp4
  //   →  https://download.veo3ai.io/videos/abc123.mp4
  const downloadUrl = job.final_video_url.replace(
    'https://r2.veo3ai.io',
    'https://download.veo3ai.io'
  );

  // 直接打开下载链接（无需 fetch + blob）
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `agent_video_${job.id}.mp4`;
  link.click();
};
```

**或者在后端生成下载 URL**：

```typescript
// python-agent/app/repositories/job_repository.py
def get_job_with_download_urls(job_id: str) -> AgentJob:
    job = db.query(AgentJob).get(job_id)

    # 转换 R2 URL 为 Worker 下载 URL
    if job.final_video_url:
        job.final_video_download_url = job.final_video_url.replace(
            'r2.veo3ai.io',
            'download.veo3ai.io'
        )

    return job
```

### 5. 清理旧代码

删除或废弃以下文件/函数：
- `/app/api/proxy-video/route.ts` ❌ 可删除
- `createProxyDownloadUrl()` 函数 ❌ 不再需要
- `triggerDownload()` 中的 blob 处理逻辑 ❌ 简化为直接链接

## 测试清单

部署后需要测试：

- [ ] **桌面浏览器**
  - [ ] Chrome/Edge - 下载成功
  - [ ] Firefox - 下载成功
  - [ ] Safari - 下载成功

- [ ] **移动端浏览器**
  - [ ] iOS Safari - 下载成功（关键测试）
  - [ ] Android Chrome - 下载成功
  - [ ] 微信内置浏览器 - 下载成功

- [ ] **下载体验**
  - [ ] 文件名正确（`agent_video_xxx.mp4`）
  - [ ] 不会打开新标签页播放
  - [ ] 下载速度提升明显

- [ ] **CDN 缓存**
  - [ ] 第二次下载同一视频更快
  - [ ] Cloudflare 边缘节点命中（检查响应头 `CF-Cache-Status: HIT`）

## 回退计划

如果 Worker 方案出现问题，可以快速回退：

1. **DNS 切换**：将 `download.veo3ai.io` 指向 Vercel
2. **保留代理 API**：暂时不删除 `/app/api/proxy-video/route.ts`
3. **前端切换**：通过环境变量控制使用 Worker 还是代理
   ```typescript
   const downloadUrl = process.env.NEXT_PUBLIC_USE_WORKER_DOWNLOAD
     ? workerUrl
     : proxyUrl;
   ```

## 预期效果

| 指标 | 当前方案 | Worker 方案 | 提升 |
|------|---------|-------------|------|
| 下载速度 | 2-5 MB/s | 10-20 MB/s | **3-4x** |
| 服务器负载 | 高 | 无 | **-100%** |
| 带宽成本 | $20+/月 | $0 | **-100%** |
| 用户体验 | 需等待转发 | 即时下载 | **显著提升** |
| 代码复杂度 | 高（proxy + blob） | 低（直接链接） | **简化 70%** |

## 播放缓存策略（R2 + Cloudflare）

**目标**：页面刷新或重复播放时尽量命中浏览器/边缘缓存，减少回源和带宽。

**已在代码中处理**：
- 新上传到 R2 的视频对象带 `Cache-Control: public, max-age=31536000, immutable`
- 下载代理 `/api/proxy-video` 不再强制 `no-cache`，会保留上游的缓存头

**还需要在 Cloudflare 控制台完成**：
- Cache Rules：`host == r2.veo3ai.io` 且 `path starts_with /videos/`
  - Cache Everything
  - Edge TTL：例如 30d/90d（按内容更新频率选择）
  - Browser TTL：遵循源站（source headers）
- 如使用 Range 请求，建议开启 **Cache Range Requests**

**注意事项**：
- 旧视频对象没有 `Cache-Control` 时，需重新上传或用 Cache Rule 覆盖
- 若 URL 带签名参数，不建议忽略 query string（可能绕过权限控制）

## 参考资料

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [R2 Workers 集成](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Vercel 定价](https://vercel.com/pricing)（带宽限制说明）
- Safari 下载限制：[MDN - Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)

## 实施优先级

**优先级**：🔥 高（建议在用户量增长前实施）

**预计工作量**：
- Worker 开发 + 测试：2-3 小时
- 前端代码修改：1 小时
- 移动端兼容性测试：2 小时
- **总计**：5-6 小时

**建议时间**：下个 Sprint 或流量突增前

---

*文档创建时间*：2025-01-14
*状态*：待实施
*负责人*：待分配
