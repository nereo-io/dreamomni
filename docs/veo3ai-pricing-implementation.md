# Veo3AI 定价与积分调整 - 技术落地方案

**版本**: 1.0
**日期**: 2026-01-22
**适用范围**: veo3-main + python-agent

---

## 目标与范围

- **目标**
  - Mini 月付从 $15 提升到 $20
  - Mini 年付从 $108 调整到 $144（保持 40% 折扣）
  - 音乐生成从 12 积分调整为 3 积分
  - 模型积分消耗下调，毛利率统一到 80%-90%
  - 保持 Standard/Plus 方案不变

- **范围**
  - 订阅产品配置与前端展示
  - 视频/图片模型积分计算
  - Agent 侧积分估算与扣费映射

- **不在范围**
  - Standard/Plus 方案价格与 Credits 变更

---

## 变更清单（代码级）

### 1) 订阅方案与定价展示

- **Creem 产品配置**
  - `veo3-main/config/products.ts`
  - `mini-monthly.amount: 1500 -> 2000`
  - `mini-yearly.amount: 10800 -> 14400`

- **Payssion 订阅映射**
  - `veo3-main/config/payssion.ts`
  - `PAYSSION_PRODUCT_CONFIG["1500"] -> "2000"` 并保持 `product_id=mini-monthly`
  - `PAYSSION_PRODUCT_CONFIG["10800"] -> "14400"` 并保持 `product_id=mini-yearly`

- **定价页面展示**
  - `veo3-main/i18n/blocks/pricing/en.json`
  - `veo3-main/i18n/blocks/pricing/fr.json`
  - `veo3-main/i18n/blocks/pricing/de.json`
  - `veo3-main/i18n/blocks/pricing/ru.json`
  - Mini 月付 `amount: 1500 -> 2000`, `price: $15.00 -> $20.00`
  - Mini 年付 `amount: 10800 -> 14400`, `price: $9.00 -> $12.00`, `tip: $108.00 -> $144.00`
  - Mini 年付 `original_price` 同步为 `$20.00` 以匹配新锚点价

### 2) 视频模型积分

- **核心计算逻辑**
  - `veo3-main/config/video-models.ts`
  - Veo 3.1 基础消耗调整：
    - 720p 8s: 6 credits (0.75/s)
    - 1080p 8s: 8 credits (1.0/s)
    - 4K 8s: 12 credits (1.5/s)
  - Seedance 1.5 Pro 调整：
    - 480p 4/8/12s: 4/8/12 credits (1.0/s)
    - 720p 4/8/12s: 8/16/24 credits (2.0/s)
  - Sora 2 调整：
    - 10s: 4 credits (0.4/s)
    - 15s: 6 credits (0.4/s)
  - 实施点：
    - `kie-veo3-*` 的 `perSecondCredits` 改为 `0.75`
    - `byteplus-seedance-1-5-pro-*` 的 `perSecondCredits` 改为 `1`，`supportedDurations` 改为 `[4, 8, 12]`
    - `calculateCredits()` 中 Veo 3 分辨率倍率改为 `1080p: 4/3`、`4k: 2x`
    - `sora-2-*` 的 `perSecondCredits` 改为 `0.4`

### 3) 图片模型积分

- **核心配置**
  - `veo3-main/config/image-models.ts`
  - `nano-banana` 与 `nano-banana-edit`: 3 -> **1**
  - `nano-banana-pro`: 1K/2K/4K = **2/2/4** (基础 credits = 2)

- **辅助展示配置**
  - `veo3-main/config/aiProviders.ts`
  - 同步 Nano Banana 的展示 credits

### 4) Agent 侧估算与扣费

- **Next.js 前端估算**
  - `veo3-main/components/blocks/agent/AgentCreatePanel.tsx`
  - 移除硬编码 perImageCost (3/6)，改为使用 `calculateImageCredits()`

- **python-agent 扣费映射**
  - `python-agent/app/graph/nodes.py`
  - `python-agent/app/graph/resume.py`
  - 更新 `_IMAGE_CREDITS_BY_MODEL` 与 `_VIDEO_PER_SECOND_CREDITS`

### 5) 音乐生成积分

- **核心配置**
  - `veo3-main/config/music-models.ts`
  - `suno-v5.credits: 12 -> 3`

- **Agent 估算与扣费**
  - `veo3-main/components/blocks/agent/AgentCreatePanel.tsx`
  - `python-agent/app/graph/nodes.py`
  - `python-agent/app/graph/resume.py`
  - 统一 `BGM` 预扣为 `3 credits`

---

## 外部系统配置

- **Creem**
  - Mini 月付产品价格同步到 $20
  - Mini 年付产品价格同步到 $144

- **Payssion**
  - 无需后台同步，仅代码侧金额映射生效

---

## 兼容性与风险

- 积分消耗下降会影响历史用户对“可生成数量”的感知，需确保前端展示与实际扣费一致
- Agent 侧与前端积分口径需保持一致，否则会出现估算/扣费偏差

---

## 验证与回归

- **前端**
  - 进入 `/pricing` 验证 Mini 月付展示与结算金额
  - 进入 `/pricing` 验证 Mini 年付展示与结算金额
  - 音乐生成提交扣费为 3 积分
  - Seedance 1.5 Pro 选项支持 4/8/12 秒，720p 价格为 2 积分/秒
  - 生成视频/图片时的积分提示与扣费一致

- **后端/Agent**
  - 执行一次 Agent 流程，核对 keyframe + video 扣费是否与新口径一致

---

## 回滚方案

- 还原 `products.ts`、`payssion.ts`、`pricing/*.json` 的 Mini 月付金额
- 还原 `products.ts`、`payssion.ts`、`pricing/*.json` 的 Mini 年付金额
- 还原 `video-models.ts` 与 `image-models.ts` 的 credits 配置
- 还原 `byteplus-seedance-1-5-pro-*` 的时长与积分配置
- 还原 `music-models.ts` 与 BGM 相关扣费配置
- 还原 python-agent 的 credits 映射
