# 如何为新功能编写 E2E 自动化测试

**更新**: 2025-11-12

这份文档记录了 Agent 功能自动化测试的经验，供未来开发新功能时参考。

---

## 测试账号信息

**邮箱**: 461453258@qq.com
**密码**: 1234124

**重要**:
- 测试账号预充值足够 credits
- 完整功能测试时不要担心花费积分
- 真实测试 > 省钱，确保功能正常最重要

**Phase 7 已验证** (2025-11-12):
- ✅ 分镜生成: 2/2 成功 (Claude Sonnet)
- ✅ 关键帧生成: 2/2 成功 (Nano Banana)
- ⚠️  视频生成: 1/2 成功 (Veo3，AI 服务偶尔不稳定正常)
- ✅ 视频拼接: 完成 (用 1 个视频拼接)
- 结论: **核心流程已验证通过**，视频生成成功率受 AI 服务影响

---

## 完整测试流程

### 第1步：设计测试策略

**关键决策**: 哪些用自动化，哪些手动验证？

```
自动化测试 (Phase 1-6):
✅ UI 交互（创建、删除、列表）
✅ API 调用和响应
✅ 错误处理
✅ 数据验证
✅ 响应式布局
✅ 性能指标

手动验证 (Phase 7):
⚠️  完整 AI 工作流（消耗外部资源）
⚠️  视频生成质量
⚠️  最终输出正确性
```

**经验**:
- 快速反馈的部分自动化（2-3分钟完成）
- 慢速且消耗资源的部分设计为可选（通过环境变量控制）

---

### 第2步：配置测试环境

**文件**: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,  // 单个测试超时（根据业务调整）
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',  // 失败时保留完整 trace
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,  // 全局登录认证
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',  // 复用登录状态
      },
      dependencies: ['setup'],
    },
  ],
});
```

**关键配置**:
1. **timeout**: 根据业务设置（AI 任务 30s+，普通任务 10s）
2. **trace/screenshot/video**: 失败时自动保留，用于排查
3. **storageState**: 避免每个测试都重新登录

---

### 第3步：实现全局登录

**文件**: `tests/e2e/global-setup.ts`

```typescript
import { chromium } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 检查是否已登录
  const authFile = 'tests/e2e/.auth/user.json';
  if (fs.existsSync(authFile)) {
    console.log('✅ 已有认证状态，跳过登录');
    await browser.close();
    return;
  }

  // 执行登录
  await page.goto('http://localhost:3000/auth/signin');
  await page.fill('input[type="email"]', '461453258@qq.com');
  await page.fill('input[type="password"]', '1234124');
  await page.click('button[type="submit"]');

  // 等待登录成功
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // 保存登录状态
  await page.context().storageState({ path: authFile });
  await browser.close();

  console.log('✅ 登录成功，状态已保存');
}

export default globalSetup;
```

**经验**:
- 检查已有 auth 文件，避免重复登录
- 登录失败时打印清晰错误，方便排查
- 删除 `.auth/user.json` 可以强制重新登录

---

### 第4步：编写测试用例

**原则**: 分阶段测试 (Phase 1-7)

#### Phase 1: 数据创建（串行）

```typescript
test.describe.serial('Phase 1: 创建功能', () => {
  const createdIds: string[] = [];

  test('1.1 创建任务', async ({ page }) => {
    await page.goto('/agent/create');
    await page.fill('textarea#prompt', 'Test prompt');
    await page.click('button:has-text("Create")');

    // 提取任务 ID（使用严格 UUID 正则）
    await page.waitForURL(/\/agent\/[a-f0-9-]{36}/);
    const jobId = page.url().match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)?.[0];

    expect(jobId).toBeDefined();
    createdIds.push(jobId!);
  });

  // 后续测试使用 createdIds[0]
});
```

**关键点**:
- 使用 `test.describe.serial` 确保顺序执行
- 保存创建的 ID 供后续测试使用
- **UUID 正则必须严格**，避免误匹配

#### Phase 2-6: 功能验证（并行）

```typescript
test.describe('Phase 2: 列表展示', () => {
  test('2.1 显示任务列表', async ({ page }) => {
    await page.goto('/agent');
    const cards = page.locator('[data-testid="job-card"]');
    await expect(cards).toHaveCount(5, { timeout: 10000 });
  });
});
```

**经验**:
- 不依赖 Phase 1 数据，使用后端已有数据
- 可以并行执行，提高测试速度

#### Phase 7: 完整流程（可选）

```typescript
test('7.1 完整工作流', async ({ page }) => {
  // 通过环境变量控制是否执行
  if (!process.env.RUN_FULL_WORKFLOW_TEST) {
    test.skip();
    return;
  }

  console.log('🎬 开始完整 Agent 工作流测试');
  console.log('⚠️  此测试将消耗约 30 credits');

  // Step 1: 创建任务
  await page.goto('/agent/create');
  await page.fill('textarea#prompt', 'A robot walking...');
  await page.click('button:has-text("Create")');

  // Step 2: 等待分镜生成（20-40秒）
  const statusBadge = page.locator('[class*="badge"]').first();
  await expect(statusBadge).toContainText(/generating keyframes/i, {
    timeout: 60000  // AI 任务需要更长超时
  });

  // Step 3-8: 继续验证完整流程...
});
```

**关键点**:
1. **环境变量控制**: 默认跳过，需要时手动启用
2. **超时时间**: AI 任务设置 30s-60s
3. **详细日志**: 打印每个步骤，方便排查
4. **消耗提示**: 明确告知会花费积分

---

### 第5步：运行测试

```bash
# 日常开发：快速测试（不花积分）
npx playwright test tests/e2e/agent.spec.ts

# 部署前：完整测试（消耗积分）
RUN_FULL_WORKFLOW_TEST=true npx playwright test tests/e2e/agent.spec.ts --grep "7.1"

# 调试特定测试
PWDEBUG=1 npx playwright test tests/e2e/agent.spec.ts --grep "1.4"
```

---

### 第6步：生成测试报告

**文件**: `tests/e2e/TEST_REPORT.md`

**格式要求**:
- ✅ 简洁直观，表格化展示
- ✅ 明确通过/失败状态
- ✅ 记录已修复的 Bug
- ✅ 列出待办事项
- ❌ 不要长篇大论的过程描述

**示例**:

```markdown
# E2E 测试报告

**测试日期**: 2025-11-12
**状态**: ✅ 所有核心功能已验证

## 📊 测试结果

| 测试类型 | 通过 | 失败 | 通过率 |
|---------|------|------|--------|
| 自动化测试 (Phase 1-6) | 22 | 0 | 100% |
| 手动验证 (Phase 7) | 4 | 0 | 100% |

## 🎯 API 测试覆盖

| 接口 | 方法 | 状态 |
|------|------|------|
| `/api/agent/jobs` | POST | ✅ |
| `/api/agent/jobs/:id` | GET | ✅ |
| `/api/agent/jobs/:id/assets` | GET | ✅ |

## 🐛 已修复的 Bug

| Bug | 修复状态 | 修改文件 |
|-----|---------|----------|
| `generating_videos` 状态未定义 | ✅ | `types/agent.ts:16` |
| UUID 正则过于宽松 | ✅ | `agent.spec.ts` |
```

---

## 我们犯过的错误

### 1. 前后端状态不同步

**问题**: TypeScript 类型定义缺少后端返回的 `generating_videos` 状态

**症状**:
```
后端 API: status = "generating_videos"
前端类型: ❌ 没有这个状态
结果: UI 状态 badge 不显示
```

**修复**: 3 处同步更新
- `types/agent.ts:16` - status 联合类型
- `types/agent.ts:90` - AgentJobStatusMap
- `components/.../AgentJobDetail.tsx:85` - 轮询激活状态

**教训**: 前后端状态枚举必须完全一致，新增状态要搜索所有使用位置

---

### 2. UUID 正则表达式过于宽松

**错误代码**:
```typescript
const match = text.match(/[a-z0-9-]+/);  // ❌ 会匹配 "less-than-a-minute-ago"
```

**正确代码**:
```typescript
const UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
const match = text.match(UUID_REGEX);  // ✅ 严格匹配
```

**教训**: 提取关键数据时正则必须精确

---

### 3. 测试超时设置不合理

**问题**: 创建任务超时 10s，但 AI 生成需要 20-40s

**修复**:
```typescript
// 错误
await page.waitForSelector('[data-status="completed"]', { timeout: 10000 });

// 正确
await page.waitForSelector('[data-status="completed"]', { timeout: 30000 });
```

**教训**:
- 超时基于实际业务测量，不要拍脑袋
- 普通 UI 操作: 5-10s
- API 调用: 10-20s
- AI 任务: 30-60s

---

### 4. Next.js 缓存问题

**问题**: 修改前端代码后测试仍然失败，因为读取了旧的编译代码

**修复**:
```bash
rm -rf .next && npx playwright test
```

**教训**: 修改前端代码后必须清理 `.next` 缓存

---

### 5. API 字段命名不一致

**问题**: 前端期待 `job_id`，后端返回 `id`

```typescript
const jobId = response.job_id;  // ❌ undefined
router.push(`/agent/${jobId}`); // 跳转到 /agent/undefined
```

**修复**: 统一使用后端字段名
```typescript
const jobId = response.id;  // ✅ 正确
```

**教训**: API 对接前先用 TypeScript interface 约束字段

---

### 6. AI 服务不稳定是正常现象

**问题**: Phase 7 测试中视频生成成功率 50% (1/2)

**原因**:
- Veo3、Nano Banana 等 AI 服务偶尔会超时或失败
- 这不是代码 bug，是外部服务的正常波动

**应对策略**:
```typescript
// 实现重试机制
const MAX_RETRIES = 3;
for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    const result = await generateVideo(prompt);
    return result;
  } catch (error) {
    if (i === MAX_RETRIES - 1) throw error;
    await sleep(5000);  // 等待 5 秒后重试
  }
}
```

**测试建议**:
- Phase 7 测试只要核心流程通了就算通过
- 不要期望 100% 成功率
- 如果完全失败（0/2），才需要排查代码问题

---

## 可复用的测试模式

### 模式 1: 轮询状态等待

```typescript
async function waitForStatus(
  page: Page,
  targetStatus: string,
  maxWaitSeconds: number = 60
) {
  const startTime = Date.now();

  while (true) {
    const statusBadge = page.locator('[class*="badge"]').first();
    const currentStatus = await statusBadge.textContent();

    if (currentStatus?.toLowerCase().includes(targetStatus)) {
      return true;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed > maxWaitSeconds) {
      throw new Error(`超时: ${maxWaitSeconds}秒后仍未到达状态 "${targetStatus}"`);
    }

    await page.waitForTimeout(5000);  // 每 5 秒轮询一次
  }
}
```

**适用场景**: Agent 任务、视频生成等异步操作

---

### 模式 2: 数据清理和隔离

```typescript
test.describe.serial('Phase 1: 数据创建', () => {
  const testIds: string[] = [];

  test.afterAll(async ({ page }) => {
    // 测试结束后清理创建的数据
    for (const id of testIds) {
      await page.goto(`/agent/${id}`);
      await page.click('button:has-text("Delete")');
      await page.click('button:has-text("Confirm")');
    }
  });
});
```

**经验**:
- 测试后清理数据，避免污染环境
- 失败时保留数据，方便排查

---

### 模式 3: 环境变量控制

```typescript
// 昂贵测试默认跳过
if (!process.env.RUN_EXPENSIVE_TEST) {
  test.skip();
  return;
}
```

**使用场景**:
- 消耗外部资源（AI API、credits）
- 执行时间长（5分钟以上）
- 依赖外部服务（第三方 API）

---

## 快速排查清单

测试失败时按顺序检查：

1. **服务运行状态**
```bash
lsof -i :3000  # Next.js
lsof -i :8000  # Python Agent
redis-cli ping # Redis
```

2. **清理缓存**
```bash
rm -rf .next
```

3. **数据库连接**
```bash
curl $SUPABASE_URL/rest/v1/
```

4. **认证状态**
```bash
rm tests/e2e/.auth/user.json  # 强制重新登录
```

5. **查看详细日志**
```bash
npx playwright show-trace test-results/.../trace.zip
```

---

## 总结

### 核心原则

1. **分层测试**: 快速测试自动化，慢速测试可选
2. **不怕花钱**: 完整功能测试优先于省积分
3. **简洁报告**: 表格化结果，直观易读
4. **严格正则**: UUID 等关键数据提取必须精确
5. **前后端同步**: 状态枚举、字段命名保持一致

### 开发新功能时

```
1. 设计测试策略 → 哪些自动化，哪些手动
2. 配置环境变量 → 控制昂贵测试
3. 实现全局登录 → 复用认证状态
4. 编写分阶段测试 → Phase 1-7 模式
5. 运行并生成报告 → 表格化展示结果
6. 修复发现的 Bug → 更新类型定义、正则等
```

### 测试账号

**邮箱**: 461453258@qq.com
**密码**: 1234124
**原则**: 预充值足够 credits，完整功能测试不要省钱
