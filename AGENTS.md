# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js 14 routes, layouts, and server actions grouped by feature.
- `components/`: Shared UI; `contexts/` and `providers/` wrap client state and theming.
- `services/`, `lib/`, `utils/`: External integrations, domain logic, and helpers—keep side effects isolated here.
- `models/`, `types/`, `public/`, `i18n/`, `scripts/`, `supabase/`: Contracts, assets, localization, tooling, and environment templates that should stay in sync.

## Build, Test, and Development Commands
- `pnpm dev`: Local server with HMR.
- `pnpm build`: Production bundle with type checks.
- `pnpm start`: Serve `.next/` output locally.
- `pnpm lint`: Next.js ESLint suite; fixes most formatting issues.
- `pnpm test`: Jest via `ts-jest`.
- `pnpm analyze`: Bundle analyzer overlay.
- `pnpm cf:preview` / `pnpm cf:deploy`: Cloudflare Pages preview + release pipeline.

## Coding Style & Naming Conventions
- TypeScript + ES modules, 2-space indentation, single quotes by default, JSX attributes double quotes.
- React components use PascalCase; hooks start with `use`; utilities stay camelCase; shared styles belong in `components/`.
- Keep Tailwind classes ordered layout → spacing → typography → state, and run `pnpm lint` (or editor Prettier) before committing.
- Guard environment-specific code (`if (typeof window !== 'undefined')`) and favor dependency injection in `services/` for testability.

## Testing Guidelines
- Place specs in `__tests__/` directories with `.test.ts` suffix to match Jest config.
- Mock AI providers, Stripe, and Supabase; avoid real network calls in CI.
- Prioritize coverage for new logic under `services/` and `lib/`, plus smoke tests for major user flows in `app/`.
- Run `pnpm test` before every PR and note skipped areas in the description.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) with imperative, scoped messages.
- Reference issue IDs, call out env or migration changes, and attach UI captures when altering surfaces.
- Confirm `pnpm lint`, `pnpm test`, and `pnpm build` succeed before requesting review; list blockers or follow-ups explicitly.

## Environment & Security Notes
- Copy `.env.example` → `.env.local`; manage secrets through Vercel, Cloudflare, or your password vault.
- Use sandbox credentials for external services and never commit `.next/` or raw key files.
- Review changes in `middleware.ts` and `auth/` with security in mind to keep restricted routes protected.
