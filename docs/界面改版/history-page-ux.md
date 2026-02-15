# /history 页面展示优化需求

## 背景
- 当前 /history（My Creations）卡片信息过于杂乱，媒体主体不突出。
- 需要提升媒体浏览效率、单页展示数量与滚动性能，同时兼容移动端。

## 目标
- 媒体优先：卡片仅展示图片/视频，信息收敛到详情弹窗。
- 交互清晰：hover 预览与快捷操作，点击打开详情。
- 性能提升：单页 50 条 + 缓存 + 可视化加载。
- 移动端友好：分页与弹窗布局适配小屏。

## 需求范围
- 覆盖 tab：Video、Image、Jobs。
- Jobs tab 同步使用卡片样式、Hover 交互、详情弹窗与分页规范。
- Jobs tab 默认仅展示存在 `final_video_url` 的任务（保持当前逻辑）。
- 复用现有下载/删除 handler，不新增后端接口。

## 交互与布局规范

### 1) 卡片展示（Video/Image/Jobs 统一）
- 卡片只展示媒体（视频或图片），不展示标题/提示词等文本。
- 统一媒体比例（建议 16:9 或 4:3），保持网格整洁。
- Hover 显示操作浮层：下载、删除（图标按钮）。
- 点击卡片打开详情弹窗。

### 2) 视频 Hover 自动播放
- Hover 时触发预览播放，默认尝试开声音。
- 若浏览器限制自动播放声音，降级为静音播放，并在卡片右下角提供“一键开声/取消静音”按钮。
- Hover 离开后暂停并复位首帧。

### 3) 详情弹窗布局（参考截图二）
- 左侧：媒体展示区（视频/图片），占主要视觉面积。
- 右侧：信息与操作区，信息精简。
- 右侧顶部展示作者头像/用户名（若已有数据），右上角关闭按钮。
- 操作区放在右侧顶部或底部固定区域，保持易触达。

## 详情弹窗信息与操作（精简版）

### 视频（基于 `VideoGeneration`）
信息字段（精简）：
- Prompt（可折叠展示）
- 状态（status）
- 模型（model_id -> displayName）
- 比例（aspect_ratio）
- 时长（duration_seconds）
- 创建时间（created_at）
- 音频标识（has_audio）
- 输入图片（input_image_url 或 image_urls[0..1]，若存在）
- 失败信息（error_message，仅失败时展示）

操作项：
- 播放/打开（优先本地播放，无法时新开窗口）
- 下载
- 删除
- 复制 Prompt（可选）

### 图片（基于 `ImageGenerationResult`）
信息字段（精简）：
- Prompt（可折叠展示）
- 状态（status）
- 模型（model）
- 比例/分辨率（image_size, resolution）
- Credits（credits_used）
- 创建时间（created_at）
- Agent 标识（is_agent_mode + agent_image_count）
- 输入图片（input_image_urls，若存在）
- 失败信息（error_message，仅失败时展示）

操作项：
- 打开（新开或放大查看）
- 下载
- 删除
- 复制 Prompt（可选）

### Jobs（基于 `AgentJob`）
信息字段（精简）：
- Prompt（可折叠展示）
- 状态（status）
- 视频模型（video_model）
- 图片模型（image_model）
- 比例（aspect_ratio）
- 时长（duration_seconds）
- 镜头数（num_shots）
- Credits（credits_charged）
- 创建时间（created_at）
- 参考图（reference_image_url 或 reference_image_urls[0..n]，若存在）
- 失败信息（error_message，仅失败时展示）

操作项：
- 播放/打开（优先本地播放，无法时新开窗口）
- 下载
- 删除（复用 `DELETE /api/agent/jobs/[id]`）

## 分页与性能
- 单页展示数量提升为 50（Video/Image/Jobs 统一为 50）。
- 分页页码最多显示 10 个：
  - 有超出时显示首尾与省略号，当前页保持居中范围。
- 缓存与可视化加载：
  - 参考 `/image-to-video` 页视频历史组件（`components/blocks/video-history`）的历史缓存策略。
  - 前端缓存已拉取页（Map<page, data>），切换页码优先读缓存。
  - 预取相邻页（current±1）以降低翻页延迟。
  - 列表虚拟化或按需渲染（可使用 react-virtual），避免 50 条同时完整渲染造成卡顿。
  - 图片/视频使用 lazy load，hover 时再提升加载优先级。

## 移动端建议
- 网格布局：手机 2 列、平板 3 列、桌面 4-5 列。
- 详情弹窗建议采用全屏弹窗：
  - 顶部媒体（16:9），底部信息与操作列表。
  - 操作按钮置底固定栏，避免滚动时丢失操作入口。
- Hover 行为在移动端替换为点击预览/播放，长按或显式操作按钮触发下载/删除。

## 参考与关联
- 参考组件：`components/blocks/video-history/index.tsx`（历史加载、缓存、刷新逻辑）
- 当前历史页入口：`components/blocks/my-creations-page`
