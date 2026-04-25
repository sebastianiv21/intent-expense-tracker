<!-- GSD:project-start source:PROJECT.md -->
## Project

**Intent Expense Tracker — Date Picker Visual Bug Fix**

Intent Expense Tracker is a personal finance app (intent.luisibarra.dev) that lets users log expenses and income as "awareness" entries. The app is built with Next.js App Router, shadcn/ui, Radix UI, and Tailwind CSS 4.x. This work targets a visual bug in the date picker component inside the "New Awareness" transaction sheet.

**Core Value:** The date picker must fit cleanly within the sheet's available vertical space so users can see and interact with the full calendar without layout overlap or truncation.

### Constraints

- **Tech Stack**: Must use existing shadcn/ui Calendar + Tailwind CSS — no new calendar library
- **Design**: Match existing dark-mode design language and brand colors (orange accent)
- **Scope**: Fix only the calendar layout; do not refactor unrelated sheet components
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - All application code in `web/`
- TSX - React component files throughout `web/app/` and `web/components/`
- CSS - Global styles in `web/app/globals.css` (Tailwind v4 utility classes + CSS variables)
- SQL - Drizzle migration files in `web/drizzle/`
## Runtime
- Node.js 20.x (detected v20.11.1)
- pnpm (workspace-aware)
- Lockfile: `web/pnpm-lock.yaml` present
- Workspace config: `web/pnpm-workspace.yaml`
## Frameworks
- Next.js 16.1.6 - Full-stack React framework; App Router with route groups `(app)` and `(auth)`
- React 19.2.3 - UI rendering; Server Components used by default, Client Components where needed
- shadcn/ui - Component scaffolding; config at `web/components.json`; style: default, baseColor: neutral, cssVariables enabled
- Radix UI primitives - Underlying accessible headless components (avatar, dialog, dropdown-menu, label, popover, progress, select, separator, slot, tabs, toggle)
- Tailwind CSS 4.x - Utility-first CSS; processed via `@tailwindcss/postcss`; dark mode enabled by default (`dark` class on `<body>`)
- tw-animate-css 1.4.0 - Animation utilities
- Drizzle ORM 0.45.1 - Type-safe SQL query builder and schema definition
- drizzle-kit 0.31.9 - Migration generation, push, and studio (dev tool)
- better-auth 1.5.5 - Authentication framework; config at `web/lib/auth.ts`
- Zod 4.3.6 - Schema validation; used in `web/lib/validations/`
- ESLint 9.x with `eslint-config-next` (Core Web Vitals + TypeScript rules) - config at `web/eslint.config.mjs`
- PostCSS with `@tailwindcss/postcss` - config at `web/postcss.config.mjs`
- TypeScript compiler - config at `web/tsconfig.json`; strict mode enabled; path alias `@/*` → `./`
## Key Dependencies
- `next` 16.1.6 - Application framework; drives routing, server components, API routes
- `drizzle-orm` 0.45.1 - Database access layer; schema at `web/lib/schema.ts`
- `better-auth` 1.5.5 - Session management, OAuth, email/password auth
- `@neondatabase/serverless` 1.0.2 - Neon PostgreSQL driver for serverless/edge environments
- `zod` 4.3.6 - Runtime validation for all form inputs and server action params
- `ws` 8.20.0 - WebSocket polyfill required by `@neondatabase/serverless` in Node.js (non-edge) environments
- `drizzle-kit` 0.31.9 - Schema migrations; scripts: `db:generate`, `db:push`, `db:migrate`, `db:studio`
- `lucide-react` 0.577.0 - Icon library (set as shadcn iconLibrary)
- `class-variance-authority` 0.7.1 - Component variant management
- `clsx` 2.1.1 + `tailwind-merge` 3.5.0 - Conditional class merging (used in `web/lib/utils.ts`)
- `sonner` 2.0.7 - Toast notifications; configured globally in `web/app/layout.tsx`
- `recharts` 3.8.0 - Charts for the insights page
- `react-day-picker` 9.14.0 - Date picker component
- `date-fns` 4.1.0 - Date manipulation utilities
- `@fontsource/plus-jakarta-sans` 5.2.8 - Local font package
- `next/font/google` (Plus Jakarta Sans + Geist Mono) - Google Fonts loaded via Next.js font optimization; applied in `web/app/layout.tsx`
## Configuration
- `DATABASE_URL` - Neon PostgreSQL connection string (required at startup; validated in `web/lib/db.ts`)
- `BETTER_AUTH_SECRET` - Signing secret for better-auth sessions
- `BETTER_AUTH_URL` - Server-side base URL for auth
- `NEXT_PUBLIC_BETTER_AUTH_URL` - Client-side base URL for auth client (`web/lib/auth-client.ts`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `web/next.config.ts` - Minimal Next.js config (no custom options set)
- `web/tsconfig.json` - TypeScript strict mode; path alias `@/*` → `./`; target ES2017
- `web/drizzle.config.ts` - Drizzle dialect: postgresql; schema: `./lib/schema.ts`; output: `./drizzle`
## Platform Requirements
- Node.js 20.x
- pnpm
- PostgreSQL-compatible database (Neon recommended)
- Google OAuth app credentials for social login
- Serverless/edge-compatible Node.js host (Vercel recommended based on `@neondatabase/serverless` + edge WebSocket handling pattern)
- Neon PostgreSQL (serverless driver configured with WebSocket support for Node.js)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: `kebab-case.tsx` (e.g., `transaction-sheet.tsx`, `currency-provider.tsx`)
- Server actions: `kebab-case.ts` under `lib/actions/` (e.g., `lib/actions/transactions.ts`)
- Query functions: `kebab-case.ts` under `lib/queries/` (e.g., `lib/queries/transactions.ts`)
- Validation schemas: `kebab-case.ts` under `lib/validations/` (e.g., `lib/validations/budgets.ts`)
- Skeleton components: `{entity}-skeleton.tsx` under `components/skeletons/` (e.g., `components/skeletons/transactions-skeleton.tsx`)
- UI primitives: `kebab-case.tsx` under `components/ui/`
- Exported functions: `camelCase` (e.g., `createTransaction`, `getTransactions`, `formatCurrency`)
- React components: `PascalCase` named exports (e.g., `export function TransactionSheet(...)`)
- Custom hooks: `use` prefix, `camelCase` (e.g., `useCurrency`, `useTransactionSheet`)
- Context providers: `PascalCase` + `Provider` suffix (e.g., `CurrencyProvider`, `TransactionSheetProvider`)
- Context hook: `use` + context name (e.g., `useTransactionSheet`, `useCurrency`)
- Variables: `camelCase`
- Module-level constants: `SCREAMING_SNAKE_CASE` (e.g., `BUCKET_DEFINITIONS`, `BUCKET_ORDER`, `DEFAULT_CURRENCY`)
- Config objects: `SCREAMING_SNAKE_CASE` for static lookups (e.g., `BUCKET_META`, `FILTERS`)
- Type aliases and interfaces: `PascalCase`
- Props types: `{ComponentName}Props` (e.g., `TransactionSheetProps`, `PageHeaderProps`)
- Action result type: generic `ActionResult<T>` defined in `types/index.ts`
- Schema-inferred types: `z.infer<typeof schema>` exported as `PascalCase` + `Input` (e.g., `CreateTransactionInput`)
- Table names: `camelCase` for exports (e.g., `transactions`, `financialProfile`, `recurringTransactions`)
- Column names: `camelCase` in TypeScript, `snake_case` in the database string argument (e.g., `createdAt: timestamp("created_at")`)
- Enum exports: `camelCase` + `Enum` suffix (e.g., `transactionTypeEnum`, `budgetPeriodEnum`)
- Index names: `{table}_{column}_idx` pattern (e.g., `"transactions_userId_idx"`)
## Code Style
- No Prettier config detected — formatting is enforced only by ESLint (Next.js core web vitals + TypeScript rules)
- Semicolons: used consistently throughout
- Quotes: double quotes for JSX attributes, double quotes in TypeScript imports
- Trailing commas: used in multi-line arrays and objects
- Config: `web/eslint.config.mjs` using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- `eslint-disable-next-line` used sparingly (one known instance: `react-hooks/exhaustive-deps` in `transaction-sheet.tsx`)
## Import Organization
- `@/` maps to the `web/` root (configured in `tsconfig.json`)
- All internal imports use `@/` — no relative imports observed
- `import type { ... }` used consistently for types that are not used as values
- Example: `import type { ActionResult, Transaction } from "@/types";`
## React / Next.js Directives
- All interactive components declare `"use client"` at the top of the file
- Page-level components in `app/` are server components by default (no directive)
- UI primitives with Radix interactivity all declare `"use client"` (e.g., `components/ui/sheet.tsx`)
- All server action files declare `"use server"` as the first line (e.g., `lib/actions/transactions.ts`)
- Never mixed in the same file as client-side code
## Error Handling
- Validate input via Zod `safeParse` before any DB call; return early if validation fails
- Wrap DB operations in `try/catch`
- Return discriminated union `ActionResult<T>`:
- Log errors with `console.error("Failed to ...", err)` — no error monitoring service
- No try/catch — errors propagate to callers (React Server Components let Next.js handle them)
- Action results checked: `if (result.success)` branch; error surfaced via `sonner` toast or local `error` state
- `getAuthenticatedUser()` in `lib/queries/auth.ts` calls `redirect("/login")` if no session — used at the top of every server action and query
## Logging
## Comments
- Visual separators used for distinct logical sections within a file:
- Applied in: `lib/schema.ts`, `lib/finance-utils.ts`, `types/index.ts`, `components/transaction-sheet.tsx`
- Used for complex utility functions with non-obvious behavior — includes `@example` blocks
- Example: `formatAmountDisplay` and `parseAmountInput` in `lib/finance-utils.ts` have multi-line JSDoc with examples
- Used to document intentional hacks: `// eslint-disable-next-line react-hooks/exhaustive-deps`
- Used to document intent: `// Clamp limit to prevent abuse`, `// don't let failures block the page`
## Function Design
- Server actions accept `formData: unknown` as the first argument when consuming form data (validated via Zod inside)
- Query functions accept a single `params` object for multiple optional filters
- Pure utilities accept explicit typed primitives
- Server actions: always `Promise<ActionResult<T>>`
- Query functions: always `Promise<Entity | Entity[]>`
- Utility functions: synchronous, return typed primitives
## Module Design
- Named exports only — no default exports for utilities, actions, or queries
- Page components (`page.tsx`, `layout.tsx`) use `export default function`
- UI primitives (`components/ui/`) use named exports only
- Single barrel: `types/index.ts` — all shared types exported from one file
- No barrel for `lib/actions/`, `lib/queries/`, or `lib/validations/` — import directly by path
## Tailwind CSS
## Component Structure Pattern (large components)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Pages are React Server Components that fetch data directly (no API layer for reads)
- Mutations use Next.js Server Actions with Zod validation
- Database access is direct via Drizzle ORM — no repository abstraction layer
- Auth is session-based, checked in layouts and query helpers
- The app is a single Next.js application in `web/` — no separate backend service
## Layers
- Purpose: Renders UI, orchestrates Server Component data fetching
- Location: `web/app/`
- Contains: `page.tsx`, `layout.tsx`, `loading.tsx` files
- Depends on: queries (read), components (render), actions (indirectly via client components)
- Used by: Next.js router
- Purpose: Reusable UI — both server and client components
- Location: `web/components/`
- Contains: Feature page components (e.g., `budgets-page.tsx`), shared UI primitives (`ui/`), skeleton loaders (`skeletons/`)
- Depends on: types, lib/finance-utils, lib/actions (for mutations), Context providers
- Used by: pages
- Purpose: Encapsulates all DB read operations; always scoped to authenticated user
- Location: `web/lib/queries/`
- Contains: Per-entity query functions (`transactions.ts`, `budgets.ts`, `dashboard.ts`, etc.)
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/queries/auth.ts`
- Used by: pages (Server Components), server actions (when they need to read after write)
- Purpose: Next.js Server Actions for create/update/delete; validated via Zod before DB write
- Location: `web/lib/actions/`
- Contains: Per-entity mutation files (`transactions.ts`, `budgets.ts`, `categories.ts`, `recurring.ts`, `financial-profile.ts`)
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/validations/`, `lib/queries/auth.ts`
- Used by: Client components (`"use client"`)
- Purpose: Zod schemas defining input shapes for all mutations
- Location: `web/lib/validations/`
- Contains: Per-entity schema files exporting `createXSchema`, `updateXSchema`, and inferred TypeScript types
- Depends on: nothing internal
- Used by: `lib/actions/`
- Purpose: Single source of truth for the database schema and Drizzle relations
- Location: `web/lib/schema.ts`
- Contains: All `pgTable` definitions and `relations`
- Depends on: nothing internal
- Used by: `lib/db.ts`, all queries and actions
- Purpose: Shared TypeScript domain types used across the full stack
- Location: `web/types/index.ts`
- Contains: Entity types (`Transaction`, `Category`, `Budget`, etc.), relation composites (`TransactionWithCategory`), `ActionResult<T>`, `FilterState`
- Depends on: nothing
- Used by: queries, actions, components, pages
- Purpose: Pure functions for finance logic, currency formatting, amount parsing
- Location: `web/lib/finance-utils.ts`, `web/lib/utils.ts`, `web/lib/currencies.ts`
- Contains: `formatCurrency`, `formatCurrencyCompact`, `parseAmountInput`, `formatAmountDisplay`, `calculateBucketTarget`, `BUCKET_DEFINITIONS`
- Depends on: nothing internal
- Used by: components, queries
## Data Flow
- Global UI state: React Context (`TransactionSheetContext`, `CurrencyContext`)
- Server state: Next.js cache invalidated via `revalidatePath()`
- No client-side state manager (no Redux, Zustand, etc.)
## Key Abstractions
- Purpose: Centralizes session extraction and redirects unauthenticated callers to `/login`
- File: `web/lib/queries/auth.ts`
- Pattern: Called at the top of every query and server action to get `userId`
- Purpose: Discriminated union return type for all server actions
- File: `web/types/index.ts`
- Pattern: `{ success: true, data?: T } | { success: false, error: string, issues?: ZodIssue[] }`
- Purpose: Global state for the create/edit transaction sheet modal shared across pages
- Files: `web/components/transaction-sheet-context.tsx`, `web/components/transaction-sheet.tsx`
- Pattern: React Context with `openCreate()`, `openEdit(transaction)`, `close()` methods
- Purpose: Propagates user's preferred currency to all client components that format amounts
- Files: `web/components/currency-provider.tsx`
- Pattern: React Context wrapping the entire `(app)` layout; provides bound `formatCurrency` and `formatCurrencyCompact`
- Purpose: Categorizes expenses into Needs/Wants/Future allocation buckets
- Files: `web/lib/finance-utils.ts` (constants + math), `web/lib/schema.ts` (`allocationBucketEnum`)
- Pattern: Categories have an optional `allocationBucket` field; dashboard aggregates spending per bucket vs. targets derived from `financialProfile`
## Entry Points
- Location: `web/app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Font setup, global CSS, Sonner `<Toaster>` provider
- Location: `web/app/(app)/layout.tsx`
- Triggers: Any route under `/(app)/`
- Responsibilities: Session check → redirect to `/login`; profile check → redirect to `/onboarding`; triggers `processRecurringTransactions()`; provides `CurrencyProvider` and `AppShell`
- Location: `web/app/(auth)/layout.tsx`
- Triggers: Routes `/login`, `/register`, `/onboarding`
- Responsibilities: Centered single-column layout wrapper
- Location: `web/app/api/auth/[...all]/route.ts`
- Triggers: All better-auth HTTP requests (sign-in, sign-up, OAuth callback, session)
- Responsibilities: Proxies to `better-auth` handler via `toNextJsHandler(auth)`
- Location: `web/app/(app)/page.tsx`
- Triggers: GET `/`
- Responsibilities: Parallel-fetches dashboard data; renders balance card, bucket summaries, recent transactions, upcoming recurring
## Error Handling
- Server actions return `ActionResult<T>` — never throw to the client
- All DB writes wrapped in `try/catch`; errors logged with `console.error` and returned as `{ success: false, error: string }`
- `revalidatePath()` is called only after confirmed successful DB writes
- `processRecurringTransactions()` in the app layout is wrapped in try/catch so failures do not block page render
- Queries use `getAuthenticatedUser()` which calls `redirect()` on auth failure (does not return an error value)
## Cross-Cutting Concerns
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
