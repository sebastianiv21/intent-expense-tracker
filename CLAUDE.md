<!-- GSD:project-start source:PROJECT.md -->
## Project

**Intent Expense Tracker — Multi-Currency Milestone**

A personal expense tracker that helps one user manage and categorize spending against intentional budget buckets (needs/wants/future). Currently live with full transaction management, categories, and financial profile in a single currency. This milestone adds multi-currency support so transactions can be recorded in their original currency (COP or USD) and automatically converted to the user's preferred base currency for all reporting.

**Core Value:** Every transaction is recorded in the currency it was actually made in, with accurate historical conversion, so totals always reflect true spending in the user's preferred currency.

### Constraints

- **Tech stack**: Next.js App Router + Drizzle + Neon — no new infrastructure
- **API budget**: ExchangeRate-API free tier (1,500 req/month) — 24h cache is mandatory
- **DB migrations**: Drizzle migrations — any schema changes need a migration file
- **Single user**: App is personal, no multi-tenant concerns
- **No tests**: No existing test framework — don't add test infrastructure as part of this milestone
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ^5 — all application code in `web/`
- TSX — React component files throughout `web/app/` and `web/components/`
- CSS — global styles in `web/app/globals.css` via Tailwind CSS v4 utility classes
## Runtime
- Node.js (version not pinned via `.nvmrc` or `engines` field; `@types/node ^20` implies Node 20+)
- pnpm (lockfile `web/pnpm-lock.yaml` present; workspace config in `web/pnpm-workspace.yaml`)
- Lockfile: present
## Frameworks
- Next.js 16.1.6 — App Router, React Server Components, server actions; config at `web/next.config.ts`
- React 19.2.3 — UI rendering
- React DOM 19.2.3 — DOM bindings
- shadcn/ui (default style, neutral base color) — component registry at `web/components.json`
- Tailwind CSS ^4 — utility-first CSS; PostCSS integration via `@tailwindcss/postcss ^4`
- `tailwind-merge ^3.5.0` — merge conflicting Tailwind classes safely
- `class-variance-authority ^0.7.1` — variant-based component styling (CVA)
- `tw-animate-css ^1.4.0` — animation utilities
- Drizzle ORM ^0.45.1 — type-safe SQL query builder; schema at `web/lib/schema.ts`
- `drizzle-orm/neon-serverless` adapter — Neon PostgreSQL serverless driver
- better-auth ^1.5.5 — auth framework; server config at `web/lib/auth.ts`, client at `web/lib/auth-client.ts`
- Zod ^4.3.6 — schema validation; used in `web/lib/validations/`
- date-fns ^4.1.0 — date utilities
- react-day-picker ^9.14.0 — calendar/date picker component
- Recharts ^3.8.0 — composable charting library
- Sonner ^2.0.7 — toast notification system
- `@fontsource/plus-jakarta-sans ^5.2.8` — self-hosted Plus Jakarta Sans
## Build / Dev Tooling
- ESLint ^9 — config at `web/eslint.config.mjs` using `eslint-config-next` (core-web-vitals + TypeScript rules)
- No dedicated formatter config detected (Prettier not present; formatting relies on ESLint rules)
- TypeScript `target: ES2017`, `module: esnext`, `moduleResolution: bundler`, strict mode enabled; config at `web/tsconfig.json`
- Path alias: `@/*` maps to `web/`
- drizzle-kit ^0.31.9 — migration generation and push; config at `web/drizzle.config.ts`
- `postcss.config.mjs` using `@tailwindcss/postcss`
## Key Dependencies
- `@neondatabase/serverless ^1.0.2` — Neon PostgreSQL serverless driver; used in `web/lib/db.ts`
- `ws ^8.20.0` — WebSocket polyfill for Neon in Node.js environments (non-edge)
- `better-auth ^1.5.5` — handles sessions, email/password, and Google OAuth
- `drizzle-orm ^0.45.1` — only ORM layer; no fallback query client
- `zod ^4.3.6` — runtime validation for all form/action data
- `clsx ^2.1.1` — conditional className builder (used alongside tailwind-merge)
## Configuration
- Configured via `.env` file (not committed; no `.env.example` found)
- Key vars required: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_BETTER_AUTH_URL`
- `web/next.config.ts` — minimal Next.js config (no custom rewrites or headers currently set)
- `web/tsconfig.json` — TypeScript compiler options
- `web/drizzle.config.ts` — Drizzle Kit schema and credentials
## Platform Requirements
- Node.js 20+, pnpm
- Neon PostgreSQL database accessible via `DATABASE_URL`
- Google OAuth credentials for social sign-in
- Edge-compatible deployment target (Neon serverless driver supports edge runtimes)
- Vercel or similar Next.js-compatible host recommended
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: `kebab-case.tsx` (e.g., `transaction-sheet.tsx`, `page-header.tsx`, `currency-provider.tsx`)
- Server actions: `kebab-case.ts` inside `lib/actions/` (e.g., `lib/actions/transactions.ts`)
- Queries: `kebab-case.ts` inside `lib/queries/` (e.g., `lib/queries/transactions.ts`)
- Validations: `kebab-case.ts` inside `lib/validations/` (e.g., `lib/validations/transactions.ts`)
- Next.js route files: Next.js conventions (`page.tsx`, `loading.tsx`)
- Utility files: `kebab-case.ts` (e.g., `finance-utils.ts`, `auth-client.ts`)
- Named exports using PascalCase (e.g., `export function TransactionSheet`, `export function PageHeader`)
- No default exports for components — only for Next.js route pages (`export default async function TransactionsPage`)
- Context providers: `[Feature]Provider` (e.g., `TransactionSheetProvider`, `CurrencyProvider`)
- Custom hooks: `use[Feature]` (e.g., `useTransactionSheet`, `useCurrency`)
- camelCase for local variables and function parameters
- SCREAMING_SNAKE_CASE for module-level constants and lookup objects (e.g., `BUCKET_META`, `BUCKET_ORDER`, `BUCKET_DEFINITIONS`, `FILTERS`)
- camelCase for exported utility functions (e.g., `formatCurrency`, `parseAmountInput`)
- PascalCase for type aliases and interfaces (e.g., `TransactionType`, `ActionResult`, `FormState`)
- Inline `type` keyword preferred over `interface` for object shapes
- `interface` used for component prop types that extend HTML attributes (e.g., `ButtonProps`)
- Suffix `Props` for component prop types (e.g., `TransactionSheetProps`, `PageHeaderProps`)
- Suffix `State` for state shape types (e.g., `FormState`, `TransactionSheetState`)
- Suffix `ContextValue` for React context value types (e.g., `TransactionSheetContextValue`, `CurrencyContextValue`)
## Import Style
- `@/*` maps to `web/` root (configured in `tsconfig.json`)
- All non-relative imports use the `@/` alias (e.g., `import { cn } from "@/lib/utils"`)
- No relative imports observed between feature modules
- `web/types/index.ts` is the single barrel for all domain types — always import types from `@/types`
- No barrel files for components or lib — each file imported directly by path
## Component Patterns
- Route pages (`page.tsx`) are async server components by default — no `"use client"` directive
- Interactive or stateful components use `"use client"` at the top of the file (e.g., `transaction-sheet.tsx`, `transaction-sheet-context.tsx`, `currency-provider.tsx`)
- Server components fetch data directly using async query functions from `@/lib/queries/`
- Client components receive data as props from their parent server component (data-down pattern)
- Props typed with a local `type [Name]Props = { ... }` declaration above the component function
- Optional props marked with `?` (e.g., `description?: string`, `action?: React.ReactNode`)
- `React.ReactNode` used for `children` and renderable slot props
- Props destructured inline in the function signature
## State Management Approach
- No global state library (no Redux, Zustand, Jotai)
- UI state owned by `useState` within client components
- Shared interactive state hoisted into React Context providers (e.g., `TransactionSheetContext` for open/close + mode)
- Context defined with `createContext` + `null` default, guarded by a custom hook that throws if used outside provider
- `useMemo` used inside providers to stabilize context value objects
- URL search params (`searchParams`) used as lightweight server-side filter state (e.g., `?type=expense&query=...`)
- `router.refresh()` used to re-fetch server component data after a mutation
## Error Handling Patterns
- All actions return `ActionResult<T>` discriminated union: `{ success: true, data?: T }` or `{ success: false, error: string, issues?: ZodIssue[] }`
- Input validated with Zod `safeParse` before any DB operation
- DB operations wrapped in `try/catch`; errors logged with `console.error` and a user-safe message returned
- Auth checked at the top of every action with `getAuthenticatedUser()` which throws/redirects on failure
- `error` state (`useState<string | null>`) held within the form component
- Error shown inline via a styled `<p role="alert">` paragraph inside the form
- `setError(null)` called before each submission attempt
- Generic fallback: `"Something went wrong. Please try again."` for unexpected exceptions
## Linting and TypeScript Config
- Config: `web/eslint.config.mjs` using flat config format (`defineConfig`)
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Custom ignores: `.next/**`, `out/**`, `build/**`, `node_modules/**`, `dist/**`, `coverage/**`, `*.min.js`
- Linting run with: `pnpm lint` (calls `eslint`)
- Config: `web/tsconfig.json`
- `strict: true` enabled
- Target: `ES2017`
- `moduleResolution: "bundler"` (modern, Next.js compatible)
- `noEmit: true` (type-checking only, Next.js handles compilation)
## Code Style
- No Prettier config file detected — likely relies on editor defaults or ESLint formatting rules
- Consistent use of 2-space indentation and double quotes observed throughout source files
- Trailing commas present in multi-line arrays and objects
- Long files use ASCII banner comments to separate logical sections:
- JSDoc-style block comments used for non-obvious utility functions (e.g., `formatAmountDisplay`, `parseAmountInput` in `lib/finance-utils.ts`)
- Inline comments used sparingly for non-obvious logic (e.g., suppressing Radix close button, eslint-disable-next-line)
## Validation Pattern
- Zod schemas defined in `lib/validations/[feature].ts`
- Schema names follow `[action][Entity]Schema` (e.g., `createTransactionSchema`, `updateTransactionSchema`)
- Inferred TypeScript types exported alongside schemas: `export type CreateTransactionInput = z.infer<typeof createTransactionSchema>`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Single `web/` package — no monorepo, no separate API service
- React Server Components (RSC) handle data fetching directly on the server
- Next.js Server Actions (`"use server"`) are used for all mutations
- Client components are isolated to interactive UI only (forms, sheets, context providers)
- No REST API layer beyond the auth handler — data access goes Server Component → query → Drizzle → Neon
## Layers
- Purpose: Render pages by calling queries and composing server components
- Location: `web/app/(app)/` and `web/app/(auth)/`
- Contains: Async server components that fetch data with `await`
- Depends on: `lib/queries/`, `components/`
- Used by: Next.js router
- Purpose: Read data from the database, scoped to the authenticated user
- Location: `web/lib/queries/`
- Contains: Async functions that call `db` (Drizzle) directly
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/queries/auth.ts`
- Used by: Server components (pages and layouts)
- Purpose: Handle all mutations (create, update, delete) with validation and cache revalidation
- Location: `web/lib/actions/`
- Contains: `"use server"` functions that validate input with Zod, write to DB via Drizzle, and call `revalidatePath`
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/validations/`, `lib/queries/auth.ts`
- Used by: Client components (forms, sheets)
- Purpose: Reusable UI, both server and client
- Location: `web/components/`
- Contains: Feature components (page-level views, sheets, cards) and primitives (`ui/`)
- Depends on: `types/`, `lib/auth-client.ts`, actions (for mutation callbacks)
- Used by: Pages and layouts
- Purpose: Schema definition, migration files, and DB client
- Location: `web/lib/schema.ts`, `web/lib/db.ts`, `web/drizzle/`
- Contains: Drizzle ORM table definitions and relations; Neon serverless pool connection
- Depends on: `@neondatabase/serverless`, `drizzle-orm`
## Data Flow
- Server state: owned by RSC cache, invalidated via `revalidatePath`
- Client state: React `useState` and React Context (e.g., `TransactionSheetContext`)
- No global client state library (no Zustand, Redux, etc.)
- Currency is propagated via `CurrencyProvider` context from the `(app)` layout
## Key Abstractions
- Purpose: Typed discriminated union return from every Server Action
- Definition: `web/types/index.ts`
- Pattern: `{ success: true; data?: T } | { success: false; error: string; issues?: ZodIssue[] }`
- Purpose: Centralized session check used by every query and action
- Location: `web/lib/queries/auth.ts`
- Pattern: Throws or redirects if no session; returns `{ userId, name }`
- Purpose: Global client-side state for the create/edit transaction sheet
- Location: `web/components/transaction-sheet-context.tsx`
- Pattern: Context + `useState`; exposes `openCreate()`, `openEdit(tx)`, `close()`
- Purpose: Shared authenticated app chrome wrapping all `(app)` pages
- Location: `web/components/app-shell.tsx`
- Contains: `SideNav` (desktop), `BottomNav` (mobile), `TransactionSheet`, `TransactionSheetProvider`
- Purpose: Domain logic for 50/30/20 budget allocation calculations
- Location: `web/lib/finance-utils.ts`
- Contains: `BUCKET_DEFINITIONS`, `calculateBucketTarget`, `calculatePercentage`, amount formatting/parsing utilities
## Auth Architecture
- Supports email/password and Google OAuth
- Account linking enabled for Google
- DB adapter: Drizzle against Neon, using `user`, `session`, `account`, `verification` tables
- `auth.api.getSession({ headers })` called in server components and layouts
- `(app)` layout (`web/app/(app)/layout.tsx`) redirects to `/login` if no session, to `/onboarding` if no `financialProfile`
- `authClient` from `web/lib/auth-client.ts` (uses `better-auth/react`)
- Exposes `signIn`, `signUp`, `signOut`, `useSession`, `getSession`
- Login and register pages are client components that call `signIn.email()` and `signIn.social()`
- `web/app/api/auth/[...all]/route.ts` — delegates all auth HTTP traffic to `better-auth` via `toNextJsHandler`
- On user creation, `better-auth` `databaseHooks.user.create.after` seeds default categories for the new user
## Database Schema Overview
- `user` — auth identity (id, name, email, emailVerified, image)
- `session` — active sessions with token and expiry; FK → user
- `account` — OAuth provider accounts; FK → user
- `verification` — email/token verification records
- `financial_profile` — per-user 50/30/20 allocation percentages and monthly income target; PK = userId
- `categories` — user-defined income/expense categories with optional `allocation_bucket` (needs/wants/future) and emoji icon
- `transactions` — individual income or expense entries with amount, date, type, optional categoryId
- `budgets` — spending limits per category, monthly or weekly, with a start date
- `recurring_transactions` — recurring income/expense templates with frequency, nextDueDate, lastGeneratedDate, isActive flag
- `transaction_type`: `expense | income`
- `budget_period`: `monthly | weekly`
- `allocation_bucket`: `needs | wants | future`
- `recurrence_frequency`: `daily | weekly | biweekly | monthly | quarterly | yearly`
- user → financialProfile (one-to-one)
- user → categories, transactions, budgets, recurringTransactions (one-to-many)
- categories → transactions, budgets, recurringTransactions (one-to-many, nullable FK with set-null on delete)
- Located in `web/drizzle/` as numbered SQL files (`0000_lyrical_demogoblin.sql`, etc.)
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
