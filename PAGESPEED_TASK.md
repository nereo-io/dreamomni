# PageSpeed Optimization Task

## Current Scores (Lighthouse Mobile)
- Performance: 50
- SEO: 100
- FCP: 1.4s ✅
- LCP: 4.5s ❌ (target < 2.5s)
- TBT: 9,020ms ❌ (target < 200ms)
- CLS: 0 ✅
- TTI: 16.5s ❌
- Speed Index: 5.2s

## Root Causes

### 1. Main thread blocked 15.6s
- "Other" category: 11.5s (likely SSR hydration)
- Script Evaluation: 2s
- Style & Layout: 854ms

### 2. Heavy JS chunks
- chunk `2838` takes 759ms (623ms scripting)
- chunk `0e76bef3` takes 340ms
- webpack runtime takes 156ms

### 3. Third-party scripts blocking main thread
- Yandex Metrika (tag.js): 692ms
- Microsoft Clarity: 259ms
- Google GSI (accounts.google.com/gsi/client): 96ms + 69KB unused JS

### 4. bf-cache disabled
- cache-control:no-store on main resource
- WebSocket usage

## Required Optimizations (in priority order)

### P0: Defer third-party scripts
- Load Yandex Metrika, Clarity, and Google GSI with `strategy="afterInteractive"` or `strategy="lazyOnload"` in next/script
- These alone account for ~1s of main thread time
- Google GSI should only load on pages that need login (not homepage)

### P1: Reduce hydration cost
- Convert heavy homepage sections to React Server Components where possible
- Use `dynamic(() => import(...), { ssr: false })` for below-fold components
- Specifically: video showcase, testimonials, FAQ sections should lazy load

### P2: Analyze and split chunk 2838
- Run `npx @next/bundle-analyzer` to identify what's in chunk 2838 (623ms scripting)
- Consider code splitting or lazy loading the heavy dependencies

### P3: Enable ISR for homepage
- Change homepage from SSR to ISR with `revalidate: 3600` (1 hour)
- This will dramatically reduce TTFB for repeat visitors
- Also set appropriate cache-control headers to enable bf-cache

### P4: Remove unused JS
- Google GSI client: 69KB unused — only load on auth pages
- Yandex Metrika: 47KB unused — consider lighter alternative or defer

## Files to check
- `app/[locale]/layout.tsx` — where analytics scripts are loaded
- `app/[locale]/(home)/page.tsx` or equivalent — homepage component
- `components/analytics/` — analytics script components
- `next.config.js` — build config, potential bundle optimization

## Constraints
- Do NOT remove any analytics (Yandex, Clarity, GA4) — just defer loading
- Do NOT break any functionality
- Test that the site still works after changes
- Commit with descriptive message
