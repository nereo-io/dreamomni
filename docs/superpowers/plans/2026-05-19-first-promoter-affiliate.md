# First Promoter Affiliate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接入 FirstPromoter affiliate 追踪链路，覆盖 click、signup、sale、subscription cancellation、refund。

**Architecture:** 前端只负责加载 fpr.js 和触发已登录后的 signup 上报入口；signup 阶段读取 FirstPromoter cookie，并同时上报项目内 `user_uuid` 作为 FirstPromoter `uid`。支付成功、取消订阅、退款都来自服务端 webhook 或内部接口，只依赖 `uid/email/event_id` 等服务端可得字段，不依赖浏览器 cookie。

**Tech Stack:** Next.js App Router、NextAuth、Supabase、Stripe/Creem/Payssion webhook、FirstPromoter fpr.js、FirstPromoter V2 Tracking API。

## 当前进度

- [x] 2026-05-19：已撤回上一版一次性实现 commit，重新按任务逐项推进。
- [x] Phase 1 / Task 1：已实现 FirstPromoter fpr.js click tracking。
  - 新增 `components/analytics/first-promoter-tracker.tsx`。
  - 已在 `app/[locale]/layout.tsx` 全局挂载 `<FirstPromoterTracker />`。
  - 已在 `.env.example` 增加 `NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID`、`FIRST_PROMOTER_API_KEY`。
  - 已运行 `pnpm lint --file components/analytics/first-promoter-tracker.tsx` 通过。
- [x] Phase 1 / Task 2：已实现 FirstPromoter service 基础设施。
  - 新增 `lib/first-promoter/config.ts`、`lib/first-promoter/cookies.ts`、`lib/first-promoter/types.ts`。
  - 新增 `services/analytics/first-promoter.ts`，封装 signup/sale/cancellation/refund V2 Tracking API。
  - `getFirstPromoterCookies` 使用 Next.js `req.cookies` 这类结构化 cookie store，不手写解析 raw `Cookie` header。
  - 已修复 `services/analytics/first-promoter.ts` 的 TypeScript 隐式 `any` 问题，四个 tracking 函数均显式返回 `Promise<FirstPromoterTrackResult>`。
  - 已运行 `pnpm lint --file lib/first-promoter/config.ts --file lib/first-promoter/cookies.ts --file lib/first-promoter/types.ts --file services/analytics/first-promoter.ts` 通过。
  - 额外运行 `tsc --noEmit --pretty false` 确认 Task 2 service 已无 TS 错误；当前剩余 TS 错误来自 `.next/types` 引用尚未创建的后续 route 文件。
- [x] Phase 1 / Task 3：已实现 Sign In / Signup 上报。
  - 新增 `app/api/first-promoter/signup/route.ts`，只允许已登录新用户上报 signup。
  - 已在 `services/analytics/first-promoter.ts` 封装 `trackFPRSignUp()`，新用户注册追踪时由 `SignupTracker` 调用该方法。
  - 已运行 `pnpm lint --file app/api/first-promoter/signup/route.ts --file components/analytics/signup-tracker.tsx --file lib/first-promoter/cookies.ts --file services/analytics/first-promoter.ts` 通过。
  - 额外运行 `tsc --noEmit --pretty false` 确认 Task 3 代码无 TS 错误；当时剩余 TS 错误来自 `.next/types` 引用尚未创建的 refund route。
- [x] Phase 1 / Task 4：已实现销售事件上报。
  - Stripe 首次支付和续费成功后调用 `trackFirstPromoterSale`。
  - Creem / Payssion 通过 `PaymentProcessingService.processPayment` 成功路径统一调用 `trackFirstPromoterSale`。
  - Creem / Payssion 调用 `processPayment` 时传入 `paymentProvider`，统一上报使用本地订单金额作为最小货币单位。
  - 已运行 `pnpm lint --file services/payment/PaymentProcessingService.ts --file services/order.ts --file app/api/creem/webhook/route.ts --file services/payment/PayssionProvider.ts --file services/analytics/first-promoter.ts` 通过。
  - 额外运行 `tsc --noEmit --pretty false` 确认 Task 4 代码无 TS 错误；当时剩余 TS 错误来自 `.next/types` 引用尚未创建的 refund route。
- [x] Phase 2 / Task 5：已实现订阅取消事件上报。
  - Payssion 本地取消接口、Creem 本地取消接口在取消成功后调用 `trackFirstPromoterCancellation`。
  - `SubscriptionManagementService.cancelOtherSubscriptions` 自动取消旧订阅成功后也会上报 cancellation。
  - Creem / Payssion 远端 cancellation webhook 成功更新本地状态后上报 cancellation。
  - Stripe `customer.subscription.deleted` / canceled `customer.subscription.updated` webhook 会更新本地 Stripe subscription 状态并上报 cancellation。
  - 已运行 `pnpm lint --file app/api/subscription/cancel/route.ts --file app/api/creem/subscription/cancel/route.ts --file app/api/creem/webhook/route.ts --file app/api/stripe/webhook/handler.ts --file services/order.ts --file services/payment/SubscriptionManagementService.ts --file services/payment/PayssionProvider.ts --file models/stripe-subscription.ts --file services/analytics/first-promoter.ts` 通过。
  - 额外运行 `tsc --noEmit --pretty false` 确认 Task 5 代码无 TS 错误；当时剩余 TS 错误来自 `.next/types` 引用尚未创建的 refund route。
- [x] Phase 2 / Task 6：已实现内部订单退款接口与退款事件上报。
  - 新增 `app/api/internal/orders/refund/route.ts`，使用 `Authorization: Bearer ${INTERNAL_API_KEY}` 鉴权，只接受 `order_no` 和可选 `reason`。
  - 新增 `lib/refund-utils.ts`，按支付渠道和支付方式计算真实退款金额。
  - 新增 `services/payment/PaymentRefundService.ts`，负责查订单、推导 provider/transaction id、计算真实退款金额、调用 provider 退款、更新订单 refund 字段，并在退款成功后上报 FirstPromoter refund。
  - Stripe / Creem 固定按 92% 计算真实退款金额；Payssion 按 `payment_method` 区分 95% / 92%。
  - `orders.refund_amount` 写入真实退给用户的金额；FirstPromoter refund 上报使用订单原金额 `order.amount`。
  - 已在 `.env.example` 增加 `INTERNAL_API_KEY`。
  - 已运行 `pnpm lint --file app/api/internal/orders/refund/route.ts --file lib/refund-utils.ts --file services/payment/PaymentRefundService.ts --file models/order.ts --file services/payment/types.ts --file services/payment/PaymentRouter.ts --file services/payment/StripeProvider.ts --file services/payment/PayssionProvider.ts --file services/payment/CreemProvider.ts --file types/order.d.ts` 通过。
  - 已运行 `pnpm exec tsc --noEmit --pretty false` 通过。

---

## 背景与官方接口

- fpr.js click 追踪：页面加载 FirstPromoter 脚本后，FirstPromoter 会处理 referral click，并落下 `_fprom_ref`、`_fprom_tid` 等 cookie；这些 cookie 只在 signup 阶段读取，用来把新用户归因到 promoter。
- V2 API 鉴权：服务端请求 FirstPromoter API 时使用 `Authorization: Bearer <API_KEY>` 和 `Account-ID: <ACCOUNT_ID>`。
- V2 signup：`POST https://api.firstpromoter.com/api/v2/track/signup`。
- V2 sale：`POST https://api.firstpromoter.com/api/v2/track/sale`，金额使用最小货币单位，例如 USD 10.00 传 `1000`；sale webhook 阶段用 signup 已登记的 `uid/email` 匹配 referral，不读取 `_fprom_tid`。
- V2 cancellation：`POST https://api.firstpromoter.com/api/v2/track/cancellation`。项目里可把“cancelled 接口”统一映射到这个 V2 cancellation endpoint。
- V2 refund：`POST https://api.firstpromoter.com/api/v2/track/refund`。

参考：
- [Tracking with fpr.js](https://docs.firstpromoter.com/guides/tracking-with-fprjs)
- [Create signup with V2 API](https://docs.firstpromoter.com/api-reference-v2/api-admin/tracking-api/create-a-new-signup)
- [Create sale with V2 API](https://docs.firstpromoter.com/api-reference-v2/api-admin/tracking-api/create-a-sale)
- [Create cancellation with V2 API](https://docs.firstpromoter.com/api-reference-v2/api-admin/tracking-api/create-a-cancellation)
- [Create refund with V2 API](https://docs.firstpromoter.com/api-reference-v2/api-admin/tracking-api/create-a-refund)

## 现有代码落点

- 全局 analytics 挂载：`app/[locale]/layout.tsx`，当前已挂载 `SignupTracker`、`AttributionTracker`、Yandex、GA、Plausible、Bing。
- 新用户识别：`components/analytics/signup-tracker.tsx` 读取 `session.isNewUser`，目前用于 Yandex/GA/Bing 注册事件。
- NextAuth 注册保存：`auth/config.ts` 的 `jwt` callback 调用 `saveUser`，并把 `savedUser.isNewUser` 写入 token/session。
- 订单创建：`app/api/checkout/route.ts` 已保存 first/last touch 和 Yandex client id。
- Stripe 首次支付/续费：`services/order.ts` 的 `handleOrderSession`、`handleInvoicePayment`。
- Creem 首次支付/续费：`app/api/creem/webhook/route.ts` 的 `handleCheckoutCompleted`、`handleSubscriptionPaid`。
- Payssion V2 webhook：`app/api/payssion/v2-webhook/route.ts` 委托到 payment provider，sale 上报需要在 provider 完成订单入账后接入。
- 订阅取消：`app/api/subscription/cancel/route.ts`、`app/api/creem/subscription/cancel/route.ts`。
- 内部 Authorization 模式参考：`app/api/internal/credits/refund/route.ts` 使用 `Authorization: Bearer ${INTERNAL_API_KEY}`。

## 环境变量

- [x] `NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID=<FirstPromoter account id>`
- [x] `FIRST_PROMOTER_API_KEY=<FirstPromoter V2 API key>`
- [x] `INTERNAL_API_KEY=<internal API bearer token>`

说明：

- `NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID` 同时用于前端 fpr.js 初始化，以及服务端 V2 API 的 `Account-ID` header。
- FirstPromoter V2 endpoint 固定写在 `services/analytics/first-promoter.ts` 中，例如 `https://api.firstpromoter.com/api/v2/track/sale`，不额外增加 `BASE_URL` 配置。
- 不增加单独的 enabled flag；缺少 `NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID` 或 `FIRST_PROMOTER_API_KEY` 时，服务端上报自动跳过并记录原因。
- 内部订单退款接口的 `Authorization` 校验复用项目现有 `INTERNAL_API_KEY` 模式。


## 归因字段策略

- Signup 上报负责建立 referral/customer 关系，payload 包含 `email`、`uid=user_uuid`，并尽量带上 `tid` 或 `ref_id`。
- Sale、refund、cancellation 上报发生在支付 webhook、取消订阅接口或内部订单退款接口中，这些请求通常没有浏览器 cookie，所以只传 `uid=user_uuid`、`email`、`event_id/payment_id/subscription_id`、金额等服务端字段。
- 不在 sale/refund/cancellation 逻辑中解析 `_fprom_tid` 或 `_fprom_ref`；FirstPromoter 应通过 signup 阶段保存的 `uid/email` 找到对应 referral。

## 文件结构计划

- Create: `lib/first-promoter/config.ts`，集中读取、校验 FirstPromoter 环境变量。
- Create: `lib/first-promoter/cookies.ts`，只供 signup route 解析 `_fprom_tid`、`_fprom_ref`。
- Create: `lib/first-promoter/types.ts`，定义 signup/sale/cancellation/refund request 类型。
- Create: `services/analytics/first-promoter.ts`，封装 V2 API 请求和日志。
- Create: `components/analytics/first-promoter-tracker.tsx`，加载 fpr.js。
- Create: `app/api/first-promoter/signup/route.ts`，客户端 signup tracker 调用的服务端入口。
- Create: `app/api/internal/orders/refund/route.ts`，提供项目内部订单退款入口。
- Create: `services/payment/PaymentRefundService.ts`，封装查单、退款、订单状态更新和 FirstPromoter refund 上报。
- Modify: `services/payment/types.ts`、`services/payment/PaymentRouter.ts`、`services/payment/StripeProvider.ts`、`services/payment/PayssionProvider.ts`、`services/payment/CreemProvider.ts`，补充 provider refund 能力。
- Modify: `app/[locale]/layout.tsx`，挂载 `FirstPromoterTracker`。
- Modify: `components/analytics/signup-tracker.tsx`，新用户登录后调用 signup 上报 API。
- Modify: `services/order.ts`，Stripe 首次支付和续费成功后调用 sale 上报。
- Modify: `app/api/creem/webhook/route.ts`，Creem 首次支付和续费成功后调用 sale 上报。
- Modify: `services/payment/PayssionProvider.ts`，Payssion 首次支付和续费成功入账后调用 sale 上报。
- Modify: `app/api/subscription/cancel/route.ts`、`app/api/creem/subscription/cancel/route.ts`，取消成功后调用 cancellation 上报。

---

## Phase 1: Click、Sign In、Sales

### Task 1: fpr.js Click Tracking

**Files:**
- Create: `components/analytics/first-promoter-tracker.tsx`
- Modify: `app/[locale]/layout.tsx`
- [x] **Step 1: 实现 fpr.js loader**

```tsx
'use client';

import Script from 'next/script';

export default function FirstPromoterTracker() {
  const accountId = process.env.NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID;

  if (!accountId) {
    return null;
  }

  return (
    <>
      <Script
        id="first-promoter-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w){w.fpr=w.fpr||function(){w.fpr.q=w.fpr.q||[];w.fpr.q[arguments[0]=='set'?'unshift':'push'](arguments);};})(window);
            fpr("init", { cid: "${accountId}" });
            fpr("click");
          `,
        }}
      />
      <Script
        id="first-promoter-fpr-js"
        src="https://cdn.firstpromoter.com/fpr.js"
        strategy="afterInteractive"
      />
    </>
  );
}
```

- [x] **Step 2: 挂载到全局 layout**

Add import in `app/[locale]/layout.tsx`:

```tsx
import FirstPromoterTracker from '@/components/analytics/first-promoter-tracker';
```

Add before existing analytics trackers:

```tsx
<FirstPromoterTracker />
```

- [x] **Step 3: 验证**

Run: `pnpm lint --file components/analytics/first-promoter-tracker.tsx`

Expected: FirstPromoter tracker lint passes.

### Task 2: FirstPromoter Service 基础设施

**Files:**
- Create: `lib/first-promoter/config.ts`
- Create: `lib/first-promoter/cookies.ts`
- Create: `lib/first-promoter/types.ts`
- Create: `services/analytics/first-promoter.ts`

- [x] **Step 1: 定义类型**

```ts
export type FirstPromoterEventType = 'signup' | 'sale' | 'cancellation' | 'refund';

export interface FirstPromoterSignupInput {
  userUuid: string;
  email: string;
  firstName?: string;
  trackingId?: string | null;
  refId?: string | null;
}

export interface FirstPromoterSaleInput {
  orderNo: string;
  paymentProvider: string;
  paymentId?: string | null;
  userUuid: string;
  email: string;
  amount: number;
  currency: string;
}

export interface FirstPromoterCancellationInput {
  paymentProvider: string;
  subscriptionId: string;
  userUuid?: string;
  email?: string;
}

export interface FirstPromoterRefundInput {
  paymentProvider: string;
  orderNo?: string;
  paymentId?: string;
  userUuid?: string;
  email?: string;
  amount: number;
  currency: string;
  reason?: string;
}
```

- [x] **Step 2: 实现 cookie 解析**

This helper is signup-only. Do not use it from sale, refund, or cancellation webhook flows.

```ts
interface FirstPromoterCookieStore {
  get(name: string): { value?: string } | undefined;
}

export function getFirstPromoterCookies(cookieStore: FirstPromoterCookieStore) {
  return {
    trackingId: cookieStore.get('_fprom_tid')?.value || null,
    refId: cookieStore.get('_fprom_ref')?.value || null,
  };
}
```

- [x] **Step 3: 实现 API client**

Service method signatures:

```ts
export async function trackFirstPromoterSignup(
  input: FirstPromoterSignupInput
): Promise<FirstPromoterTrackResult> {}
export async function trackFirstPromoterSale(
  input: FirstPromoterSaleInput
): Promise<FirstPromoterTrackResult> {}
export async function trackFirstPromoterCancellation(
  input: FirstPromoterCancellationInput
): Promise<FirstPromoterTrackResult> {}
export async function trackFirstPromoterRefund(
  input: FirstPromoterRefundInput
): Promise<FirstPromoterTrackResult> {}
```

Rules:

- 缺少 `NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID` 或 `FIRST_PROMOTER_API_KEY` 时，直接返回 `{ success: true, skipped: true, reason: 'missing_config' }`，不发外部请求。
- Signup payload maps `userUuid` to FirstPromoter `uid`; include `tid` from `_fprom_tid` when present, otherwise include `ref_id` from `_fprom_ref` when present.
- Sale payload maps `paymentId || orderNo` to `event_id`, maps `userUuid` to `uid`, and includes `email`; it must not include `tid` or `ref_id`.
- Cancellation and refund payloads use `uid/email` plus subscription/payment identifiers available on the server; they must not depend on browser cookies.
- 发送 V2 API 失败时只打 `console.error`，返回 `{ success: false }`，不得 throw 到支付 webhook 顶层。

- [x] **Step 4: 验证**

Run: `pnpm lint --file lib/first-promoter/config.ts --file lib/first-promoter/cookies.ts --file lib/first-promoter/types.ts --file services/analytics/first-promoter.ts`

Expected: FirstPromoter service infrastructure lint passes.

### Task 3: Sign In / Signup 上报

**Files:**
- Create: `app/api/first-promoter/signup/route.ts`
- Modify: `components/analytics/signup-tracker.tsx`

- [x] **Step 1: 实现服务端 route**

Route behavior:

- 只接受已登录用户。
- 只在 session 有 `isNewUser === true` 时上报。
- 从 request cookie 读取 `_fprom_tid`、`_fprom_ref`。
- 调用 `trackFirstPromoterSignup`，其中 `session.user.uuid` 会作为 FirstPromoter `uid` 上报。

```ts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.uuid || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.isNewUser !== true) {
    return NextResponse.json({ skipped: true, reason: 'not_new_user' });
  }

  const { trackingId, refId } = getFirstPromoterCookies(req.cookies);

  const result = await trackFirstPromoterSignup({
    userUuid: session.user.uuid,
    email: session.user.email,
    firstName: session.user.nickname,
    trackingId,
    refId,
  });

  return NextResponse.json(result);
}
```

- [x] **Step 2: 更新 `SignupTracker`**

When `session.isNewUser` is true, call:

```ts
trackFPRSignUp();
```

Do not block existing Yandex/GA/Bing tracking.

### Task 4: Sales 销售事件上报

**Files:**
- Modify: `services/order.ts`
- Modify: `app/api/creem/webhook/route.ts`
- Modify: `services/payment/PayssionProvider.ts`

- [x] **Step 1: Stripe 首次支付**

After `increaseCredits` and order status update in `handleOrderSession`, call:

```ts
await trackFirstPromoterSale({
  orderNo: order.order_no,
  paymentProvider: 'stripe',
  paymentId: session.payment_intent?.toString() || session.id,
  userUuid: order.user_uuid,
  email: paid_email || order.user_email,
  amount: order.amount,
  currency: order.currency,
});
```

- [x] **Step 2: Stripe 续费**

After renewal credits are increased in `handleInvoicePayment`, call:

```ts
await trackFirstPromoterSale({
  orderNo: order_no || invoice.id,
  paymentProvider: 'stripe',
  paymentId: invoice.id,
  userUuid: user_uuid,
  email: invoice.customer_email || '',
  amount: invoice.amount_paid,
  currency: invoice.currency,
});
```

- [x] **Step 3: Creem 首次支付和续费**

In `handleCheckoutCompleted` and `handleSubscriptionPaid`, pass `paymentProvider: 'creem'` to `PaymentProcessingService.processPayment`:

```ts
await PaymentProcessingService.processPayment({
  paymentId: transactionId,
  orderId: orderNo,
  userUuid,
  amount: productConfig.amount.toString(),
  userEmail: userEmail || customer?.email || "",
  paymentProvider: 'creem',
});
```

For renewal, use `renewalOrderNo`.

- [x] **Step 4: Payssion 支付成功**

In `services/payment/PayssionProvider.ts`, pass `paymentProvider: 'payssion'` to `PaymentProcessingService.processPayment`:

```ts
await PaymentProcessingService.processPayment({
  paymentId,
  orderId: finalOrderNo,
  userUuid: metadata.user_uuid,
  amount: amount.toString(),
  userEmail: metadata.user_email,
  paymentProvider: 'payssion',
});
```

Sale 上报只使用 webhook/服务端流程可得字段：`uid=user_uuid`、`email`、`event_id=paymentId || orderNo`、`amount`、`currency`。不要在 sale 上报中读取或要求 `_fprom_tid` / `_fprom_ref`。

---

## Phase 2: Cancellation 与 Refund

### Task 5: 订阅取消事件上报评估与接入

**Files:**
- Modify: `app/api/subscription/cancel/route.ts`
- Modify: `app/api/creem/subscription/cancel/route.ts`
- Optional Modify: provider webhook handlers if remote cancellation can arrive outside local cancel route

- [x] **Step 1: 确认取消来源**

评估并记录这些入口是否都会经过本项目：

- 用户在本项目点击取消 Payssion 订阅：`app/api/subscription/cancel/route.ts`。
- 用户在本项目点击取消 Creem 订阅：`app/api/creem/subscription/cancel/route.ts`。
- 用户在 Stripe/Creem/Payssion 后台直接取消后，是否有 webhook 回到本项目。

Decision:

- 项目内取消成功后立即上报 cancellation。
- 后台直取消如果有 webhook 支持，再在 webhook 成功更新本地 subscription status 后补充上报。
- 自动取消旧订阅走 `SubscriptionManagementService.cancelOtherSubscriptions`，取消成功后同样上报 cancellation。
- Stripe 后台或 Customer Portal 取消走 `customer.subscription.deleted` 或 canceled `customer.subscription.updated` webhook。
- Creem 后台取消走 `subscription.canceled` / `subscription.cancelled` webhook。
- Payssion 后台取消走 `subscription.canceled` webhook。

- [x] **Step 2: 本地取消成功后上报**

Add after provider cancellation and local status update:

```ts
await trackFirstPromoterCancellation({
  paymentProvider: 'creem',
  subscriptionId: subscription_id,
  userUuid: subscription.user_uuid,
});
```

Payssion route uses `paymentProvider: 'payssion'` and `subscriptionId` from body.
Cancellation 上报只依赖本地 subscription 记录中的 `userUuid/email/subscriptionId`，不读取浏览器 cookie。

- [x] **Step 3: 远端取消 webhook 补充上报**

Stripe、Creem、Payssion 的远端取消 webhook 在成功更新本地 subscription status 后调用 `trackFirstPromoterCancellation`。

### Task 6: 内部订单退款接口与退款事件上报

**Files:**
- Create: `app/api/internal/orders/refund/route.ts`
- Create: `services/payment/PaymentRefundService.ts`
- Create: `lib/refund-utils.ts`
- Modify: `services/payment/types.ts`
- Modify: `services/payment/PaymentRouter.ts`
- Modify: `services/payment/StripeProvider.ts`
- Modify: `services/payment/PayssionProvider.ts`
- Modify: `services/payment/CreemProvider.ts`
- Modify: `.env.example`

- [x] **Step 1: 定义内部调用 contract**

Endpoint:

```http
POST /api/internal/orders/refund
Authorization: Bearer ${INTERNAL_API_KEY}
Content-Type: application/json
```

Body:

```json
{
  "order_no": "123456",
  "reason": "customer_refund"
}
```

接口只处理当前项目订单，不支持也不需要 `project` 参数。

- [x] **Step 2: 实现 Authorization 校验**

Rules:

- Missing `INTERNAL_API_KEY` returns 500。
- Missing or mismatched `Authorization` returns 401。
- Missing `order_no` returns 400。

- [x] **Step 3: 查询订单并计算真实退款金额**

退款入口只接受 `order_no`，服务端查询当前项目 `orders` 表后，从本地订单推导：

- `paymentProvider`: `order.payment_provider`，缺失时从 `payssion_transaction_id` / `stripe_session_id` 推断。
- `transactionId`: Stripe 使用 `payment_intent` / `charge` / `stripe_session_id`，Payssion 使用 `payment_id` / `payssion_transaction_id`，Creem 使用 `payment_id` / webhook detail 中的 transaction id。
- `amount/currency/user_uuid/email`: 均来自本地订单。

前端或调用方不能传退款金额。真实退给用户的金额在后端计算，和 FirstPromoter 上报金额是两条不同的金额线。

`lib/refund-utils.ts`:

```ts
export function getRefundRate(
  paymentProvider: string | null | undefined,
  paymentMethod: string | null | undefined
): number {
  if (paymentProvider === 'stripe' || paymentProvider === 'creem') {
    return 0.92;
  }

  if (!paymentMethod) {
    return 0.92;
  }

  const method = paymentMethod.toLowerCase();

  if (method.startsWith('card') || method === 'mir') {
    return 0.95;
  }

  if (method.startsWith('sberpay') || method.startsWith('yoomoney')) {
    return 0.92;
  }

  return 0.92;
}

export function calculateRefundAmount(
  orderAmountCents: number,
  paymentProvider: string | null | undefined,
  paymentMethod: string | null | undefined
): number {
  const rate = getRefundRate(paymentProvider, paymentMethod);
  const amount = orderAmountCents / 100;
  return Math.round(amount * rate * 100) / 100;
}
```

真实退款金额规则：

- Payssion `card*` / `mir`: 退 95%。
- Payssion `sberpay*` / `yoomoney*`: 退 92%。
- Payssion `payment_method` 为空或未知: 退 92%。
- Stripe: 退 92%。
- Creem: 退 92%。

92% / 95% 是扣除渠道成本后的实际退款金额，不是利润留存。

- [x] **Step 4: 调用实际支付渠道退款接口**

`PaymentRouter.refundPayment(provider, request)` 负责分发到 provider：

- Stripe: 使用 Stripe Refund API，对 `pi_`、`ch_`、`cs_`、`in_` 做解析；`amount` 传 `Math.round(refundAmount * 100)`。
- Payssion: 使用 `POST /v2/refunds`；`amount` 传 `refundAmount.toFixed(2)`，`currency` 传 `order.currency || 'USD'`。
- Creem: 调用 Creem 实际退款接口；金额按 Creem API 需要的格式传入，但来源必须是后端计算出的 `refundAmount`。

真实退款成功后更新订单：

```ts
{
  status: 'refunded',
  refund_status: 'succeeded',
  refund_amount: refundAmount,
  refunded_at: now,
  refund_detail: providerRefundResponse,
}
```

`orders.refund_amount` 写入真实退给用户的金额。

- [x] **Step 5: 成功退款后上报 FirstPromoter refund**

FirstPromoter refund 上报金额必须使用订单原金额 `order.amount`，不是真实退款金额 `refundAmount`。真实退款按 92% / 95% 扣除渠道成本，但 affiliate 佣金冲销要按原始 sale 金额处理。

```ts
await trackFirstPromoterRefund({
  paymentProvider,
  orderNo: order.order_no,
  paymentId: transactionId,
  userUuid: order.user_uuid,
  email: order.paid_email || order.user_email,
  amount: order.amount, // 订单原金额，不是 refundAmount
  currency: order.currency,
  reason,
});
```

FirstPromoter 上报失败只记录日志，不影响真实退款结果。

---


## Rollout Checklist

- [ ] Staging 环境配置 FirstPromoter env。
- [ ] 用 FirstPromoter 测试推广链接访问站点，确认 `_fprom_tid` / `_fprom_ref` cookie 存在。
- [ ] 新用户登录后确认 FirstPromoter dashboard 出现 signup。
- [ ] Stripe 测试支付后确认 FirstPromoter dashboard 出现 sale。
- [ ] Creem 测试支付后确认 FirstPromoter dashboard 出现 sale。
- [ ] Payssion sandbox 支付后确认 FirstPromoter dashboard 出现 sale。
- [ ] 本项目取消订阅后确认 FirstPromoter dashboard 出现 cancellation。
- [ ] 内部系统调用订单退款 endpoint 后确认真实退款成功，并确认 FirstPromoter dashboard 出现 refund。

## 风险与确认项

- [ ] Payssion 成功入账的最准确代码落点需要在实现时沿 provider 调用链确认。
- [ ] 如果 FirstPromoter signup 必须在服务端读取 `_fprom_tid`，signup route 必须由浏览器发起，不能只放在 NextAuth server callback。
- [ ] FirstPromoter API 失败不能阻塞登录、支付、取消订阅和退款主流程。
