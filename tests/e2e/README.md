# E2E 测试文档索引

Agent 功能端到端测试的完整文档和经验总结。

## 📚 文档导航

### 1. [测试报告](./TEST_REPORT.md) 📊
完整的测试执行报告,包含:
- 测试结果概览 (22/22 通过,100% 通过率)
- 已修复的问题详情
- Phase 7 完整工作流验证结果
- 测试性能指标

**适合阅读对象**: 项目经理、QA、开发人员

### 2. [测试最佳实践](./TESTING_BEST_PRACTICES.md) 🎯
自动化测试经验总结,包含:
- 测试架构设计模式
- 7 个关键经验总结
- 常见问题和解决方案
- 调试技巧和 CI/CD 建议

**适合阅读对象**: E2E 测试编写者、新团队成员

### 3. [测试套件](./agent.spec.ts) 💻
实际的 Playwright 测试代码,包含:
- 7 个测试阶段 (Phase 1-7)
- 23 个测试用例
- 完整的 Agent 功能覆盖

**适合阅读对象**: 开发人员

---

## 🚀 快速开始

### 运行所有测试

```bash
# 标准测试 (Phase 1-6, 不消耗 AI credits)
npx playwright test tests/e2e/agent.spec.ts

# 完整工作流测试 (Phase 7, 消耗 AI credits)
RUN_FULL_WORKFLOW_TEST=true npx playwright test tests/e2e/agent.spec.ts --grep "7.1"
```

### 运行特定阶段

```bash
# Phase 1: 任务创建
npx playwright test tests/e2e/agent.spec.ts --grep "Phase 1"

# Phase 2: 列表展示
npx playwright test tests/e2e/agent.spec.ts --grep "Phase 2"

# 任意特定测试
npx playwright test tests/e2e/agent.spec.ts --grep "1.4"
```

### 调试模式

```bash
# 开启浏览器和调试器
PWDEBUG=1 npx playwright test tests/e2e/agent.spec.ts --grep "1.4"

# 生成详细 trace
npx playwright test --trace on

# 查看 trace
npx playwright show-trace test-results/.../trace.zip
```

---

## 📋 测试覆盖范围

| Phase | 测试内容 | 测试数 | 状态 |
|-------|---------|--------|------|
| Phase 1 | 任务创建功能 | 8 | ✅ 100% |
| Phase 2 | 任务列表展示 | 5 | ✅ 100% |
| Phase 3 | 任务详情展示 | 3 | ✅ 100% |
| Phase 4 | 错误处理 | 2 | ✅ 100% |
| Phase 5 | 响应式设计 | 2 | ✅ 100% |
| Phase 6 | 性能测试 | 2 | ✅ 100% |
| Phase 7 | 完整工作流 | 1 | ⏭️ 可选 |
| **总计** | | **23** | **✅ 22/22** |

---

## 🔧 核心功能验证状态

### ✅ 已验证的功能

- ✅ **分镜头脚本生成** - Claude Sonnet AI 拆分
- ✅ **关键帧图像生成** - Nano Banana (Kie.ai)
- ✅ **分镜视频生成** - Kie.ai Veo3
- ✅ **视频拼接** - Celery Worker + FFmpeg
- ✅ **前端状态显示** - 实时轮询和更新
- ✅ **用户交互流程** - 创建、查看、删除、重试

### 🔧 已修复的 Bug

1. **TypeScript 类型定义缺失** - `generating_videos` 状态未定义
2. **API 字段不匹配** - 前端期待 `job_id`,后端返回 `id`
3. **UUID 正则表达式宽松** - 匹配错误的字符串
4. **测试超时设置不合理** - 10s → 30s
5. **认证 URL 错误** - `/sign-in` → `/auth/signin`

---

## 💡 重要提示

### 关于 Phase 7 测试

Phase 7 完整工作流测试会调用真实的 AI 服务:
- **Claude Sonnet** - 分镜脚本生成
- **Nano Banana (Kie.ai)** - 关键帧图像生成
- **Veo3 (Kie.ai)** - 视频生成

**预计耗时**: 5-15 分钟
**预计消耗**: 约 30 credits (具体取决于视频长度和分镜数)

**推荐做法**:
- ✅ 日常开发: 运行 Phase 1-6 (不消耗 credits)
- ✅ 部署前验证: 手动运行 Phase 7 或验证后端 API
- ✅ 重大功能变更: 运行完整 Phase 7 测试

### 测试环境要求

```bash
# 1. 前端服务运行
pnpm dev  # http://localhost:3000

# 2. Python Agent 服务运行
cd ../python-agent
uvicorn app.main:app --reload  # http://localhost:8000

# 3. Redis 运行
brew services start redis  # macOS
# 或 docker run -d -p 6379:6379 redis:7-alpine

# 4. 环境变量配置
# .env.local 需要包含所有必需的 API keys
```

---

## 🤝 贡献指南

### 添加新测试

1. 遵循现有的 Phase 模式
2. 使用清晰的测试命名: `<Phase>.<Number> 应该<行为>`
3. 添加详细的日志输出
4. 更新 TEST_REPORT.md

### 修复 Flaky Tests

1. 增加合理的 `waitForTimeout`
2. 使用更健壮的选择器
3. 添加重试机制
4. 记录到 TESTING_BEST_PRACTICES.md

### 报告问题

在 TEST_REPORT.md 中记录:
- 问题描述
- 错误日志
- 修复方案
- 修改的文件和行号

---

## 📞 联系方式

- **测试报告问题**: 查看 [TEST_REPORT.md](./TEST_REPORT.md)
- **测试编写问题**: 查看 [TESTING_BEST_PRACTICES.md](./TESTING_BEST_PRACTICES.md)
- **功能实现问题**: 参考主项目 README

---

**文档版本**: 1.0
**最后更新**: 2025-11-12
**维护者**: Claude Code
