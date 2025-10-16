# Repository Guidelines

## Project Structure & Module Organization
Feature modules live under `app/` with nested routes (e.g., `app/dashboard/page.tsx`). Shared UI primitives sit in `components/`, while client state wrappers stay in `contexts/` and `providers/`. Keep business logic and side effects isolated in `services/`, `lib/`, and `utils/`. Contracts reside in `models/` and `types/`; static assets and translations stay in `public/` and `i18n/`. Use `docs/` for architectural notes and `scripts/` or `supabase/` for operational tooling.

## Build, Test, and Development Commands
- `pnpm dev`: start the Next.js dev server with HMR.
- `pnpm build`: compile the production bundle and run type checks.
- `pnpm start`: serve the generated `.next/` output locally.
- `pnpm lint`: run the project ESLint + Prettier rules.
- `pnpm test`: execute Jest (ts-jest) test suites.
- `pnpm analyze`: inspect bundle composition.
- `pnpm cf:preview` / `pnpm cf:deploy`: push preview or production builds to Cloudflare Pages.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation, single quotes in code, and double quotes for JSX attributes. Components use PascalCase (`UserMenu`), hooks start with `use`, utilities stay camelCase, and Tailwind classes are ordered layout → spacing → typography → state. Run `pnpm lint` or your editor’s Prettier integration before committing, and guard browser-specific code with `if (typeof window !== 'undefined')`.

## Testing Guidelines
Store specs in `__tests__/` directories using the `feature.test.ts` suffix (e.g., `services/__tests__/billing.test.ts`). Run `pnpm test` locally; target meaningful coverage for new logic in `services/` and `lib/` and ship at least a smoke test for new routes in `app/`. Mock AI providers, Stripe, and Supabase clients to keep CI deterministic, and document any skipped suites in the PR.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat(auth): add session refresh`) and keep messages imperative. Reference related issues, call out migrations or env changes, and attach UI captures for surface updates. Before opening a PR, ensure `pnpm lint`, `pnpm test`, and `pnpm build` pass, enumerate risks or follow-ups, and include deployment notes when Cloudflare workflows are affected.

## Security & Configuration Tips
Copy `.env.example` to `.env.local`, store credentials via Vercel or Cloudflare secrets, and never commit `.next/` or raw keys. Keep `middleware.ts` and `auth/` changes minimal and security reviewed, and prefer sandbox credentials when running integration scripts.
