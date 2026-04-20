# Technology Stack

**Analysis Date:** 2026-04-19

## Languages

**Primary:**
- TypeScript ^5 — all application code in `web/`
- TSX — React component files throughout `web/app/` and `web/components/`

**Secondary:**
- CSS — global styles in `web/app/globals.css` via Tailwind CSS v4 utility classes

## Runtime

**Environment:**
- Node.js (version not pinned via `.nvmrc` or `engines` field; `@types/node ^20` implies Node 20+)

**Package Manager:**
- pnpm (lockfile `web/pnpm-lock.yaml` present; workspace config in `web/pnpm-workspace.yaml`)
- Lockfile: present

## Frameworks

**Core:**
- Next.js 16.1.6 — App Router, React Server Components, server actions; config at `web/next.config.ts`
- React 19.2.3 — UI rendering
- React DOM 19.2.3 — DOM bindings

**UI Component Library:**
- shadcn/ui (default style, neutral base color) — component registry at `web/components.json`
  - Radix UI primitives: `@radix-ui/react-avatar`, `dialog`, `dropdown-menu`, `label`, `popover`, `progress`, `select`, `separator`, `slot`, `tabs`, `toggle`
  - Icon set: `lucide-react ^0.577.0`

**Styling:**
- Tailwind CSS ^4 — utility-first CSS; PostCSS integration via `@tailwindcss/postcss ^4`
- `tailwind-merge ^3.5.0` — merge conflicting Tailwind classes safely
- `class-variance-authority ^0.7.1` — variant-based component styling (CVA)
- `tw-animate-css ^1.4.0` — animation utilities

**Data / ORM:**
- Drizzle ORM ^0.45.1 — type-safe SQL query builder; schema at `web/lib/schema.ts`
- `drizzle-orm/neon-serverless` adapter — Neon PostgreSQL serverless driver

**Authentication:**
- better-auth ^1.5.5 — auth framework; server config at `web/lib/auth.ts`, client at `web/lib/auth-client.ts`

**Validation:**
- Zod ^4.3.6 — schema validation; used in `web/lib/validations/`

**Date Handling:**
- date-fns ^4.1.0 — date utilities
- react-day-picker ^9.14.0 — calendar/date picker component

**Charts:**
- Recharts ^3.8.0 — composable charting library

**Notifications:**
- Sonner ^2.0.7 — toast notification system

**Fonts:**
- `@fontsource/plus-jakarta-sans ^5.2.8` — self-hosted Plus Jakarta Sans

## Build / Dev Tooling

**Linter:**
- ESLint ^9 — config at `web/eslint.config.mjs` using `eslint-config-next` (core-web-vitals + TypeScript rules)

**Formatter:**
- No dedicated formatter config detected (Prettier not present; formatting relies on ESLint rules)

**Compiler:**
- TypeScript `target: ES2017`, `module: esnext`, `moduleResolution: bundler`, strict mode enabled; config at `web/tsconfig.json`
- Path alias: `@/*` maps to `web/`

**Database Migrations:**
- drizzle-kit ^0.31.9 — migration generation and push; config at `web/drizzle.config.ts`
  - `db:generate` — generate migration files to `web/drizzle/`
  - `db:push` — push schema directly to DB
  - `db:migrate` — run migrations
  - `db:studio` — open Drizzle Studio GUI

**PostCSS:**
- `postcss.config.mjs` using `@tailwindcss/postcss`

## Key Dependencies

**Critical:**
- `@neondatabase/serverless ^1.0.2` — Neon PostgreSQL serverless driver; used in `web/lib/db.ts`
- `ws ^8.20.0` — WebSocket polyfill for Neon in Node.js environments (non-edge)
- `better-auth ^1.5.5` — handles sessions, email/password, and Google OAuth
- `drizzle-orm ^0.45.1` — only ORM layer; no fallback query client
- `zod ^4.3.6` — runtime validation for all form/action data

**Infrastructure:**
- `clsx ^2.1.1` — conditional className builder (used alongside tailwind-merge)

## Configuration

**Environment:**
- Configured via `.env` file (not committed; no `.env.example` found)
- Key vars required: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_BETTER_AUTH_URL`

**Build:**
- `web/next.config.ts` — minimal Next.js config (no custom rewrites or headers currently set)
- `web/tsconfig.json` — TypeScript compiler options
- `web/drizzle.config.ts` — Drizzle Kit schema and credentials

## Platform Requirements

**Development:**
- Node.js 20+, pnpm
- Neon PostgreSQL database accessible via `DATABASE_URL`
- Google OAuth credentials for social sign-in

**Production:**
- Edge-compatible deployment target (Neon serverless driver supports edge runtimes)
- Vercel or similar Next.js-compatible host recommended

---

*Stack analysis: 2026-04-19*
