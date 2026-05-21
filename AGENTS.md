# Repository Guidelines

## Project Shape
- Next.js routes live in `app/`; shared UI in `components/`; state wrappers in `contexts/` and `providers/`.
- Keep business logic and side effects in `services/`, `lib/`, and `utils/`.
- Contracts live in `models/` and `types/`; assets and translations in `public/` and `i18n/`.
- Use `docs/`, `scripts/`, and `supabase/` for notes, operations, and migrations.

## Workflow
After every code change, exercise the changed behavior before claiming completion.

- Frontend: test the affected route in a real browser. Prefer Codex in Chrome when it can cover the task, especially logged-in flows or provider/admin dashboards with existing Chrome session state. Use Playwright for repeatable automation, CI, isolated state, multi-viewport checks, or scripted regression evidence.
- Backend/API: call the real endpoint with realistic payloads and verify status, response, and side effects.
- High-risk areas: for AI providers, Stripe, Supabase, auth, credits, webhooks, and generation flows, explicitly decide whether a full smoke/E2E path is needed.
- Production: when behavior depends on production, verify the live URL, Cloudflare Pages deployment, Vercel env/secrets, or provider dashboard as applicable.
- If something cannot be tested, say exactly what was not tested and why.

## Code Rules
- TypeScript, 2-space indentation, single quotes in code, double quotes in JSX.
- Components use PascalCase, hooks start with `use`, utilities stay camelCase.
- Guard browser-only code with `if (typeof window !== 'undefined')`.
- Put tests in `__tests__/` with `feature.test.ts` naming; mock AI providers, Stripe, and Supabase clients.

## Git & Security
- Commit only after relevant self-tests pass.
- Stage only files you edited; do not include unrelated user work.
- Do not push unless explicitly asked.
- Never commit raw secrets, `.env.local`, or `.next/`; use Vercel or Cloudflare secrets for credentials.
