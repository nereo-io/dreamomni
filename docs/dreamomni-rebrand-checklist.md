# DreamOmni 改名迁移清单

> 状态:**规划中(暂未动代码)** · 生成于 2026-05-22

## 0. 决策背景

- **改名**:`GeminiOmni` → `DreamOmni`,域名 `geminiomni.tv` → `dreamomni.ai`
- **动机**:规避 `Gemini`(Google 注册商标)带来的法律 / 封号风险(尤其站内用 Google OAuth 登录 + 可能跑 Google Ads)
- **时机**:当前流量 ≈ 0、SEO 排名未起,沉没成本最低,现在改最划算
- **已知并接受的尾部风险**:
  - 同名 AI 图像项目 `DreamOmni / DreamOmni2`(CUHK + ByteDance + HKUST,贾佳亚团队)与本站**业务领域完全重合**。目前仅学术项目 + 低流量套壳站(`dreamomni.net` 月访问 0、`dreamomni.com` 月访问 64),竞争近乎空白;但若原团队将来产品化,存在"被原主碾压 / 被迫第五次改名"的低概率高影响风险。
  - 这是**借势名,非终局名**——与前三次(Veo3→Seedance→Gemini Omni)同一种打法。
- **改名前 no-regret 自查(建议先做)**:
  - [ ] USPTO 商标检索 `DreamOmni`(第 9 类软件 / 第 42 类 SaaS)
  - [ ] 中国商标网检索 `DreamOmni`
  - [ ] (可选)向 `dreamomni.com` 站主(月访问 64)发报价收购邮件

---

## 范围原则

| 处理方式 | 内容 |
|---|---|
| ✅ **改** | 所有用户可见品牌文案 + 域名 |
| 🚫 **别碰** | repo 名 `veo3`、git remote、Supabase 项目 `Seedance`、内部 `seedance` 标识符、发给 Kie.ai 的 video model id、provider 内部类名/文件名 |
| 🤔 **本次保留** | `gemini-omni-*` 的 landing slug(只改文案,零 SEO 风险;未来再议) |

---

## A. 代码改动(可由 Claude 执行 + 自测)

### A1. 核心品牌文案 / 配置
- [ ] `config/geminiomni-landing.ts` — 首页 9 语言文案、metadata、CTA 文案
- [ ] `config/geminiomni-footer.ts` — 页脚品牌
- [ ] `config/geminiomni-messages.ts` — 品牌字符串运行时清洗;**考虑新增 `geminiomni → dreamomni` 的清洗规则**
- [ ] `app/[locale]/(default)/page.tsx` — 含底部 CTA、hero 文案(注:hero/CTA 按钮目前硬编码 `Free Gemini Omni`)
- [ ] `components/blocks/omni-video-hero/index.tsx` — 硬编码按钮 `Free Gemini Omni`

### A2. i18n 文案(品牌词替换)
- [ ] `i18n/messages/en.json`(~61 处)
- [ ] `i18n/messages/zh.json`(~6 处)
- [ ] 其余 `i18n/messages/*.json`(按需复查)
- [ ] `i18n/pages/landing/*.json` — 全 10 个语言(de/en/es/fr/it/ja/ko/pt/ru/zh)均含 `geminiomni.tv`

### A3. 域名常量 `geminiomni.tv` → `dreamomni.ai`(26 文件)
关键非 i18n 文件:
- [ ] `.env.example`
- [ ] `lib/env.ts`(默认/兜底 URL)
- [ ] `package.json`
- [ ] `app/[locale]/layout.tsx`
- [ ] `app/[locale]/(legal)/metadata.ts`
- [ ] `app/[locale]/(default)/blog/[slug]/page.tsx`、`blog/page.tsx`
- [ ] `app/[locale]/(home)/home/page.tsx`
- [ ] `components/seo/structured-data.tsx`
- [ ] `components/blocks/blog-detail/index.tsx`、`feedback-form/index.tsx`、`model-landing-page/breadcrumb.tsx`
- [ ] `app/api/outrank/__tests__/webhook.test.ts`(测试里的固定域名)

### A4. 品牌素材(需重做设计资源,非纯替换)
- [ ] `public/geminiomni-hero.jpg` → 新品牌 hero 图
- [ ] OG / Twitter 卡片图(分享缩略图)
- [ ] favicon / logo(确认 `components/icon` 与 logo 资源)

### A5. 可选改名(纯整洁,牵连 import)
- [ ] `config/geminiomni-*.ts` 三个文件改名为 `dreamomni-*.ts`(需同步所有 import)
- [ ] `public/geminiomni-hero.jpg` 文件名

---

## B. SEO(本次决策:保留 slug)

- 本次**不改** `gemini-omni-*` 路由(`api` / `pricing` / `free` / `alternatives-vs-veo-3-1` / `video` / `text-to-video` / `image-to-video`),只改页面内文案 → 零 SEO 风险。
- 📌 未来若改 slug:需在 `next.config` / middleware 建立 `gemini-omni-* → dreamomni-*` 的 **301 映射表**,并更新 sitemap。

---

## C. 必须手动操作(账号 / 外部控制台,Claude 不能代做)

> ⚠️ 这些不做 = 改完代码后登录、支付、回调直接挂。

- [ ] 注册 / 接入 `dreamomni.ai`,DNS 解析
- [ ] Cloudflare Pages 绑定 `dreamomni.ai` 自定义域
- [ ] 环境变量:`NEXT_PUBLIC_WEB_URL` / `NEXTAUTH_URL` → `https://dreamomni.ai`
- [ ] **OAuth 回调 redirect URI**(任一漏配 → 对应登录全挂):
  - [ ] Google(`AUTH_GOOGLE_ID`)
  - [ ] GitHub
  - [ ] Apple
  - [ ] VK
- [ ] **支付 webhook URL** 更新到新域名:
  - [ ] Creem
  - [ ] Stripe
  - [ ] Payssion
- [ ] 老域名 `geminiomni.tv` 配 **301 永久重定向** → `dreamomni.ai`(保权重 + 不丢老链接)
- [ ] 分析平台域名更新:Plausible domain、Yandex Metrica、Google Analytics、Microsoft Clarity、OpenPanel
- [ ] (如有)邮件发信域名 / SPF / DKIM 更新

---

## D. 🚫 别碰清单(防误改 → 会挂功能)

- `veo3` repo 名 / git remote — **不动**
- Supabase 项目 `Seedance` / 内部 `seedance` 标识符 — **不动**(`geminiomni-messages.ts` 已在运行时清洗,逻辑保留)
- 发给 Kie.ai 的 **video model id**(API 契约) — **不动**
- `services/providers/KieAiGeminiOmniProvider.ts` 类名 / 文件名 — 建议**不动**(纯内部命名,改了牵连一堆 import,无收益)
- `VideoModel` 枚举值 — **不动**

---

## E. 验证清单(改完上线前必测)

- [ ] 各 OAuth 登录:Google / GitHub / Apple / VK(回调走新域名)
- [ ] 支付:下单 → webhook 回调 → 积分到账(Creem / Stripe / Payssion)
- [ ] 生成功能未被误伤:视频 / 图像 / 音乐 / 特效各跑一条(确认 provider model id 没动)
- [ ] SEO:首页 + landing 页 metadata / OG / structured data 显示 DreamOmni;`/sitemap.xml` 正常
- [ ] 老域名 `geminiomni.tv` 任意路径 301 → `dreamomni.ai` 对应路径
- [ ] 全站搜不到残留 `Gemini Omni` / `geminiomni.tv` 字样(`grep` 复扫)

---

## F. 建议执行顺序(分阶段)

1. **基础设施先行(你手动)**:域名 → Cloudflare 自定义域 → env → OAuth/webhook 回调 → 分析平台
2. **代码批量替换(Claude)**:A1–A3 文案 + 域名常量,逐模块自测
3. **品牌素材(设计)**:A4 hero/OG/logo
4. **老域名 301**:上线后立即配
5. **上线验证**:跑一遍 E 清单
6. **(可选,稳定后)**:A5 文件改名、B 的 slug 迁移 + 301

---

## 待决问题

- [ ] `config/geminiomni-*.ts` 三个文件名要不要一并改(本清单默认**暂不改**,只改内容)
- [ ] `geminiomni-messages.ts` 是否新增 `geminiomni → dreamomni` 运行时清洗(建议加,兜底残留)
- [ ] 品牌素材谁来出(hero / OG / logo)
- [ ] `dreamomni.com` 是否尝试收购(当前在月访问 64 的套壳站手里)
