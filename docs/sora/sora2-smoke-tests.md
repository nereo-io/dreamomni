# Sora 2 集成关键链路测试用例

> 文档版本：V1.0  
> 更新日期：2025-09-29  
> 作者：QA 团队

---

## 1. 测试目的

验证 Sora 2 模型在 Veo3 平台的关键链路可用性，包括任务提交、回调更新、历史记录展示与异常处理，确保上线后核心能力无阻塞。

---

## 2. 测试范围

- 文本转视频（Sora 2）基础能力
- 图像转视频（Sora 2）基础能力
- 回调与状态同步
- 积分扣减与返还
- 历史记录与重生成入口

以下场景仅做通路验证，不覆盖 UI 细节与跨浏览器测试。

---

## 3. 前置条件

1. 部署环境已配置有效的 `KIE_AI_API_KEY`，并可访问 `https://api.kie.ai/`。
2. `VIDEO_MODELS` 中 `sora-2-text-to-video`、`sora-2-image-to-video` 均处于在线状态。
3. `app/api/video-generation/webhook` 对外网可访问，必要时开放临时公网地址。
4. 测试账号剩余积分 ≥ 100，账号未被封禁且 Turnstile 验证通过。
5. Supabase 表 `video_generations` 已新增 `sora_request_id`、`video_url_sora` 字段。

---

## 4. 测试用例

| 编号 | 场景 | 前置 | 操作步骤 | 预期结果 |
| ---- | ---- | ---- | -------- | -------- |
| TC-01 | 文本转视频提交流程 | 使用 EN locale 登录，进入文本转视频页 | ① 选择模型 `Sora 2 Text-to-Video` ② 输入 20 字左右提示词 ③ 选择 `16:9`，持续时长 `5s` ④ 提交任务 | - 接口返回成功，任务记录状态为 `IN_PROGRESS` - 积分扣除正确（12 积分/5 秒） - 页面提示预计耗时 |
| TC-02 | 回调成功落库 | 紧接 TC-01 | ① 观察日志或等待回调 ② 请求 `/api/video-generation/status` 查看状态 | - 在 5 分钟内收到回调成功日志 - Supabase 记录状态更新为 `COMPLETED`，`video_url_sora` 存在 - 前端历史列表出现视频，可播放 |
| TC-03 | 回调失败处理 | 模拟失败任务（调整 prompt 引发错误或使用 mock 环境） | ① 提交任务 ② Kie AI 返回失败回调 | - 状态更新为 `FAILED`，错误信息记录 - 积分自动返还 - 前端展示失败提示，可重新尝试 |
| TC-04 | 状态兜底轮询 | 临时屏蔽回调（例如调整 webhook URL） | ① 提交任务 ② 人工触发 `status` 轮询 | - 轮询可获取 `COMPLETED` 状态 - 一旦恢复 webhook，后续回调仍可被接受（幂等） |
| TC-05 | 图像转视频流程 | 登录后进入图像转视频页，准备一张 JPG | ① 选择模型 `Sora 2 Image-to-Video` ② 上传图片 ③ 选择 `9:16`，持续 `5s` ④ 提交 | - 任务成功生成 - 视频为竖屏 1080p，时长与参数一致 - 历史记录可播放、复制提示词 |
| TC-06 | 历史重生成 | 有已完成的 Sora 任务 | ① 在历史记录中选择一条 Sora 任务 ② 点击“重新生成” | - 表单自动填充原参数 - 新任务进入 `IN_PROGRESS` 状态，流程同 TC-01 |

---

## 5. 数据校验要点

- Supabase `video_generations`：
  - `model_id = sora-2-*`，`sora_request_id` 非空，`video_url_sora` 为公网可访问 URL。
  - `status` 状态随回调/轮询更新；失败记录包含 `error_message`。
- 日志（Logtail/Grafana）：
  - 提交、状态、回调日志包含 `provider=sora2`、`taskId`、`userId`。
- 积分表/服务：扣减和返还记录对齐任务状态。

---

## 6. 测试交付

- 测试执行人：QA
- 执行日期：上线前 1 天
- 结论：通过后在发布检查清单中记录；若有失败，阻塞上线并生成缺陷单。

