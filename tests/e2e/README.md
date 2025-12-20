# Agent E2E（真实 credits）

只保留一个“全链路保通”用例：创建任务 → 等待出片（真实调用模型，消耗 credits）。

## 文件说明

- `anime-short-full-workflow.spec.ts`：全链路用例
- `global-setup.ts`：自动邮箱登录并缓存 session（`tests/e2e/.auth/user.json`，已在 `.gitignore` 忽略）

## 凭据（通过 `.env.e2e.local`）

在 `veo3-main/.env.e2e.local` 填入（该文件已在 `.gitignore` 忽略）：

```bash
# Local-only Playwright E2E credentials (do not commit)
E2E_TEST_EMAIL="your@email.com"
E2E_TEST_PASSWORD="your-password"
# E2E_FORCE_LOGIN="true"
# E2E_REAL_RUN="true"
# E2E_MAX_WAIT_MINUTES="45"
```


## 运行

启动依赖：

- `cd veo3-main && pnpm dev`（http://localhost:3000）
- `cd python-agent && uv run uvicorn app.main:app --reload`（http://localhost:8000）
- Redis + Celery worker（用于拼接）

运行全链路：

```bash
cd veo3-main
E2E_REAL_RUN=true pnpm exec playwright test tests/e2e/anime-short-full-workflow.spec.ts --reporter=line
```

可选参数：

- `E2E_KEYFRAMES_ENABLED=false`：关闭关键帧（更快）
- `E2E_VIDEO_MODEL=auto|sora-2-image-to-video|kie-veo3-image-to-video|byteplus-seedance-pro-image-to-video`：指定视频模型（默认 Veo3）
- `E2E_ASPECT_RATIO=16:9|9:16`：指定画幅（默认 16:9）
- `E2E_MAX_WAIT_MINUTES=45`：最大等待时长
- `E2E_FORCE_LOGIN=true`：忽略已保存 session，强制重新登录
