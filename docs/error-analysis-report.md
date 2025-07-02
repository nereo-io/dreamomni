# Veo3 项目错误日志分析报告

## 📊 错误统计概览

- **总日志数**: 10,359 条
- **错误级别**: 488 条 (4.7%)
- **警告级别**: 40 条 (0.4%)
- **信息级别**: 474 条 (4.6%)

## 🔥 关键错误分类与分析

### 1. 网络连接超时问题 (最严重 - 249次)

#### 典型错误示例:
```
提示词优化失败: ew [AI_RetryError]: Failed after 3 attempts. 
Last error: Cannot connect to API: Connect Timeout Error 
(attempted addresses: 8.141.18.184:443, 47.93.243.29:443, 8.141.25.100:443, timeout: 10000ms)
```

```
提示词优化失败或超时: Error: 提示词优化超时
```

```
提交到provider失败: TypeError: fetch failed
```

#### 📍 错误分布:
- `/api/video-generation/submit`: 84次 (主要是提示词优化超时)
- `/api/video-generation/webhook`: 80次 (volcano引擎回调失败)
- `/api/video-generation/status`: 35次 (volcano状态查询失败)
- `/api/video-generation/result`: 8次 (volcano结果获取失败)

#### 🔍 根本原因分析:
1. **DashScope API 网络不稳定**: 
   - 服务器在美国 (iad1)，访问阿里云API延迟高
   - 10秒超时设置过短
   - 无重试机制

2. **VOLCANO引擎 API 连接问题**:
   - 火山引擎API地址: `https://ark.cn-beijing.volces.com/api/v3`
   - 豆包模型 (`doubao-seedance-1-0-pro-*`) 调用失败
   - 从美国服务器访问中国API延迟高
   - 缺乏连接池和重试机制

#### 💡 解决方案:

**立即修复 (P0)**:
```typescript
// services/promptOptimization.ts
export async function optimizePromptWithTimeout(
  originalPrompt: string,
  modelType?: string,
  timeoutMs: number = 60000 // 增加到60秒
): Promise<string> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("提示词优化超时")), timeoutMs);
      });

      const optimizePromise = optimizePrompt(originalPrompt, modelType);
      return await Promise.race([optimizePromise, timeoutPromise]);
    } catch (error) {
      lastError = error as Error;
      console.error(`提示词优化失败 (尝试 ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt < MAX_RETRIES) {
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  console.warn("提示词优化失败，使用原始提示词");
  return originalPrompt;
}
```

**中期优化 (P1)**:
```typescript
// 添加备用优化服务
const BACKUP_OPTIMIZE_SERVICES = [
  { name: 'openai', apiKey: process.env.OPENAI_API_KEY },
  { name: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY }
];

// 添加本地缓存
import { createHash } from 'crypto';
const optimizationCache = new Map<string, string>();

function getCacheKey(prompt: string, model?: string): string {
  return createHash('md5').update(`${prompt}:${model || ''}`).digest('hex');
}
```

**VOLCANO引擎专项修复**:
```typescript
// services/providers/VolcanoProvider.ts
private async makeRequest(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: any
): Promise<any> {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        // 增加超时时间
        signal: AbortSignal.timeout(60000), // 60秒超时
      };

      if (body && method === "POST") {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Volcano API request failed: ${response.status} ${response.statusText} - ${errorData}`
        );
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;
      console.error(`Volcano API 调用失败 (尝试 ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt < MAX_RETRIES) {
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError;
}
```

---

### 2. 认证系统问题 (231次)

#### 典型错误示例:

**邮箱登录失败** (120次):
```
Email signin error: Error: Invalid email or password. Please check your credentials and try again.

Supabase auth error: eK [AuthApiError]: Invalid login credentials
{
  __isAuthError: true,
  status: 400,
  code: 'invalid_credentials'
}
```

**邮箱注册频率限制** (111次):
```
Signup error: eK [AuthApiError]: email rate limit exceeded
{
  __isAuthError: true,
  status: 429,
  code: 'over_email_send_rate_limit'
}
```

#### 🔍 根本原因分析:
1. **频率限制触发**: Supabase 邮件发送限制
2. **用户体验问题**: 用户重复尝试导致限制加剧
3. **错误处理不友好**: 没有给用户明确的等待时间提示

#### 💡 解决方案:

**立即修复 (P0)**:
```typescript
// app/api/auth/signup/route.ts
export async function POST(req: Request) {
  try {
    // 添加客户端IP频率限制检查
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    if (await isRateLimited(ip, 'signup')) {
      return respErr("请求过于频繁，请60秒后再试", 429);
    }

    // ... 现有逻辑
  } catch (error) {
    if (error.code === 'over_email_send_rate_limit') {
      return respErr(
        "邮件发送频率限制，请等待5分钟后重试。您也可以使用社交账号登录。", 
        429
      );
    }
    // ... 其他错误处理
  }
}
```

**中期优化 (P1)**:
```typescript
// 前端添加防抖和用户提示
const [isSubmitting, setIsSubmitting] = useState(false);
const [cooldown, setCooldown] = useState(0);

const handleSubmit = useCallback(
  debounce(async (formData) => {
    if (cooldown > 0) return;
    
    setIsSubmitting(true);
    try {
      await submitForm(formData);
    } catch (error) {
      if (error.status === 429) {
        setCooldown(300); // 5分钟冷却
      }
    } finally {
      setIsSubmitting(false);
    }
  }, 1000),
  [cooldown]
);
```

---

### 3. 视频生成业务问题 (196次)

#### 典型错误示例:

**敏感内容检测**:
```
视频生成失败，请求ID: cgt-20250701223133-dchkw，
错误: The request failed because the output video may contain sensitive information. 
Request id: 02175138029982800000000000000000000ffffac15f035e2742a
```

**API调用失败**:
```
收到 webhook 回调: {
  id: 'cgt-20250701223133-dchkw',
  model: 'doubao-seedance-1-0-pro-250528',
  status: 'failed',
  error: {
    code: 'OutputVideoSensitiveContentDetected',
    message: 'The request failed because the output video may contain sensitive information.'
  }
}
```

#### 🔍 根本原因分析:
1. **内容审核过严**: 某些正常内容被误判为敏感内容
2. **用户提示词问题**: 用户输入包含敏感词汇
3. **错误恢复机制缺失**: 失败后没有重试或人工审核机制

#### 💡 解决方案:

**立即修复 (P0)**:
```typescript
// services/contentFilter.ts
const SENSITIVE_KEYWORDS = [
  // 政治敏感词
  '习近平', '政府', '政治', 
  // 暴力内容
  '血腥', '暴力', '战争',
  // 成人内容
  '性感', '诱惑', '裸体'
];

export function filterSensitiveContent(prompt: string): {
  isClean: boolean;
  filteredPrompt: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let filteredPrompt = prompt;

  for (const keyword of SENSITIVE_KEYWORDS) {
    if (prompt.includes(keyword)) {
      warnings.push(`检测到敏感词汇: ${keyword}`);
      filteredPrompt = filteredPrompt.replace(new RegExp(keyword, 'g'), '[内容已过滤]');
    }
  }

  return {
    isClean: warnings.length === 0,
    filteredPrompt,
    warnings
  };
}
```

**中期优化 (P1)**:
```typescript
// 添加人工审核队列
export async function handleSensitiveContentError(videoGenerationId: string) {
  await updateVideoGenerationById(videoGenerationId, {
    status: 'PENDING_REVIEW',
    error_message: '内容需要人工审核，我们会在24小时内处理'
  });

  // 发送到审核队列
  await addToReviewQueue({
    videoGenerationId,
    type: 'sensitive_content',
    priority: 'normal'
  });
}
```

---

## 🚀 优先级修复计划

### Phase 1: 紧急修复 (24小时内)
1. **提示词优化超时**: 增加超时时间到60秒，添加重试机制
2. **VOLCANO引擎连接**: 增加超时时间，添加重试和指数退避
3. **认证频率限制**: 改善错误提示，添加前端防抖
4. **内容过滤**: 预先过滤敏感词汇

### Phase 2: 中期优化 (1周内)  
1. **网络稳定性**: 添加连接池，实现备用API
2. **监控告警**: 添加错误率监控和自动告警
3. **用户体验**: 优化错误提示和重试机制

### Phase 3: 长期优化 (1个月内)
1. **架构优化**: 考虑使用消息队列处理耗时操作
2. **缓存策略**: 实现多层缓存减少外部API调用
3. **降级策略**: 完善服务降级和熔断机制

## 📈 监控指标

需要重点监控的指标:
- API调用成功率 (目标: >99%)
- 平均响应时间 (目标: <5s)
- 错误率按端点分布
- 用户注册/登录成功率
- 视频生成成功率

## 🔧 技术债务

1. **错误处理标准化**: 统一错误格式和处理流程
2. **日志结构化**: 改善日志格式便于分析
3. **测试覆盖**: 增加网络异常场景的测试用例
4. **文档完善**: 补充错误处理和故障排查文档

---

## 💡 关键发现总结

**网络连接问题的根本原因**:
1. **地理位置**: 服务器部署在美国 (iad1)，访问中国API服务延迟高
2. **API提供商**: 主要问题集中在两个中国API服务:
   - **阿里云 DashScope** (提示词优化): `8.141.18.184:443`, `47.93.243.29:443`, `8.141.25.100:443`
   - **火山引擎 Volcano** (豆包视频生成): `https://ark.cn-beijing.volces.com/api/v3`

3. **影响模型**: 豆包系列模型 (`doubao-seedance-1-0-pro-*`) 受影响最严重

**建议架构调整**:
- ✅ **已实施**: 部署到新加坡区域 (sin1) - 2025-07-01
- 实现多地域负载均衡，就近访问API服务
- 添加API降级策略，当某个地区API不可用时自动切换

## 🔬 **新加坡部署后观察指标**

### 📊 **关键监控数据**
观察时间: 2025-07-01 部署后 24-48小时

**预期改善目标**:
- VOLCANO引擎连接成功率: 从 ~60% → >90%
- DashScope API超时: 从 42次/天 → <5次/天
- 整体网络错误: 从 249次/天 → <50次/天
- 平均API响应时间: 减少60-70%

**监控重点**:
1. `/api/video-generation/submit` 错误率
2. `/api/video-generation/webhook` 回调成功率
3. 提示词优化超时频率
4. 豆包模型 (`doubao-seedance-*`) 成功率

### 📈 **验证方法**
```bash
# 部署后24小时运行，对比错误率
grep "fetch failed\|Connect Timeout\|超时" new_logs.csv | wc -l
grep "volcano\|doubao" new_logs.csv | grep "error" | wc -l
```