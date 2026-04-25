# Technology Stack

**Analysis Date:** 2026-04-23

## Languages

**Primary:**
- TypeScript 5.x - All application code in `web/`
- TSX - React component files throughout `web/app/` and `web/components/`

**Secondary:**
- CSS - Global styles in `web/app/globals.css` (Tailwind v4 utility classes + CSS variables)
- SQL - Drizzle migration files in `web/drizzle/`

## Runtime

**Environment:**
- Node.js 20.x (detected v20.11.1)

**Package Manager:**
- pnpm (workspace-aware)
- Lockfile: `web/pnpm-lock.yaml` present
- Workspace config: `web/pnpm-workspace.yaml`

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework; App Router with route groups `(app)` and `(auth)`
- React 19.2.3 - UI rendering; Server Components used by default, Client Components where needed

**UI Component Library:**
- shadcn/ui - Component scaffolding; config at `web/components.json`; style: default, baseColor: neutral, cssVariables enabled
- Radix UI primitives - Underlying accessible headless components (avatar, dialog, dropdown-menu, label, popover, progress, select, separator, slot, tabs, toggle)

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS; processed via `@tailwindcss/postcss`; dark mode enabled by default (`dark` class on `<body>`)
- tw-animate-css 1.4.0 - Animation utilities

**Data / ORM:**
- Drizzle ORM 0.45.1 - Type-safe SQL query builder and schema definition
- drizzle-kit 0.31.9 - Migration generation, push, and studio (dev tool)

**Auth:**
- better-auth 1.5.5 - Authentication framework; config at `web/lib/auth.ts`

**Validation:**
- Zod 4.3.6 - Schema validation; used in `web/lib/validations/`

**Build/Dev:**
- ESLint 9.x with `eslint-config-next` (Core Web Vitals + TypeScript rules) - config at `web/eslint.config.mjs`
- PostCSS with `@tailwindcss/postcss` - config at `web/postcss.config.mjs`
- TypeScript compiler - config at `web/tsconfig.json`; strict mode enabled; path alias `@/*` → `./`

## Key Dependencies

**Critical:**
- `next` 16.1.6 - Application framework; drives routing, server components, API routes
- `drizzle-orm` 0.45.1 - Database access layer; schema at `web/lib/schema.ts`
- `better-auth` 1.5.5 - Session management, OAuth, email/password auth
- `@neondatabase/serverless` 1.0.2 - Neon PostgreSQL driver for serverless/edge environments
- `zod` 4.3.6 - Runtime validation for all form inputs and server action params

**Infrastructure:**
- `ws` 8.20.0 - WebSocket polyfill required by `@neondatabase/serverless` in Node.js (non-edge) environments
- `drizzle-kit` 0.31.9 - Schema migrations; scripts: `db:generate`, `db:push`, `db:migrate`, `db:studio`

**UI Utilities:**
- `lucide-react` 0.577.0 - Icon library (set as shadcn iconLibrary)
- `class-variance-authority` 0.7.1 - Component variant management
- `clsx` 2.1.1 + `tailwind-merge` 3.5.0 - Conditional class merging (used in `web/lib/utils.ts`)
- `sonner` 2.0.7 - Toast notifications; configured globally in `web/app/layout.tsx`
- `recharts` 3.8.0 - Charts for the insights page
- `react-day-picker` 9.14.0 - Date picker component
- `date-fns` 4.1.0 - Date manipulation utilities

**Fonts:**
- `@fontsource/plus-jakarta-sans` 5.2.8 - Local font package
- `next/font/google` (Plus Jakarta Sans + Geist Mono) - Google Fonts loaded via Next.js font optimization; applied in `web/app/layout.tsx`

## Configuration

**Environment (required vars — see `web/.env.example`):**
- `DATABASE_URL` - Neon PostgreSQL connection string (required at startup; validated in `web/lib/db.ts`)
- `BETTER_AUTH_SECRET` - Signing secret for better-auth sessions
- `BETTER_AUTH_URL` - Server-side base URL for auth
- `NEXT_PUBLIC_BETTER_AUTH_URL` - Client-side base URL for auth client (`web/lib/auth-client.ts`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials

**Build:**
- `web/next.config.ts` - Minimal Next.js config (no custom options set)
- `web/tsconfig.json` - TypeScript strict mode; path alias `@/*` → `./`; target ES2017
- `web/drizzle.config.ts` - Drizzle dialect: postgresql; schema: `./lib/schema.ts`; output: `./drizzle`

## Platform Requirements

**Development:**
- Node.js 20.x
- pnpm
- PostgreSQL-compatible database (Neon recommended)
- Google OAuth app credentials for social login

**Production:**
- Serverless/edge-compatible Node.js host (Vercel recommended based on `@neondatabase/serverless` + edge WebSocket handling pattern)
- Neon PostgreSQL (serverless driver configured with WebSocket support for Node.js)

---

*Stack analysis: 2026-04-23*
