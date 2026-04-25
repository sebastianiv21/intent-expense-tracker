# Architecture

**Analysis Date:** 2026-04-23

## Pattern Overview

**Overall:** Next.js App Router with Server Components + Server Actions

**Key Characteristics:**
- Pages are React Server Components that fetch data directly (no API layer for reads)
- Mutations use Next.js Server Actions with Zod validation
- Database access is direct via Drizzle ORM — no repository abstraction layer
- Auth is session-based, checked in layouts and query helpers
- The app is a single Next.js application in `web/` — no separate backend service

## Layers

**Routing / Pages Layer:**
- Purpose: Renders UI, orchestrates Server Component data fetching
- Location: `web/app/`
- Contains: `page.tsx`, `layout.tsx`, `loading.tsx` files
- Depends on: queries (read), components (render), actions (indirectly via client components)
- Used by: Next.js router

**Component Layer:**
- Purpose: Reusable UI — both server and client components
- Location: `web/components/`
- Contains: Feature page components (e.g., `budgets-page.tsx`), shared UI primitives (`ui/`), skeleton loaders (`skeletons/`)
- Depends on: types, lib/finance-utils, lib/actions (for mutations), Context providers
- Used by: pages

**Queries Layer (read-only data access):**
- Purpose: Encapsulates all DB read operations; always scoped to authenticated user
- Location: `web/lib/queries/`
- Contains: Per-entity query functions (`transactions.ts`, `budgets.ts`, `dashboard.ts`, etc.)
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/queries/auth.ts`
- Used by: pages (Server Components), server actions (when they need to read after write)

**Actions Layer (write/mutation):**
- Purpose: Next.js Server Actions for create/update/delete; validated via Zod before DB write
- Location: `web/lib/actions/`
- Contains: Per-entity mutation files (`transactions.ts`, `budgets.ts`, `categories.ts`, `recurring.ts`, `financial-profile.ts`)
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/validations/`, `lib/queries/auth.ts`
- Used by: Client components (`"use client"`)

**Validation Layer:**
- Purpose: Zod schemas defining input shapes for all mutations
- Location: `web/lib/validations/`
- Contains: Per-entity schema files exporting `createXSchema`, `updateXSchema`, and inferred TypeScript types
- Depends on: nothing internal
- Used by: `lib/actions/`

**Data / Schema Layer:**
- Purpose: Single source of truth for the database schema and Drizzle relations
- Location: `web/lib/schema.ts`
- Contains: All `pgTable` definitions and `relations`
- Depends on: nothing internal
- Used by: `lib/db.ts`, all queries and actions

**Types Layer:**
- Purpose: Shared TypeScript domain types used across the full stack
- Location: `web/types/index.ts`
- Contains: Entity types (`Transaction`, `Category`, `Budget`, etc.), relation composites (`TransactionWithCategory`), `ActionResult<T>`, `FilterState`
- Depends on: nothing
- Used by: queries, actions, components, pages

**Utility Layer:**
- Purpose: Pure functions for finance logic, currency formatting, amount parsing
- Location: `web/lib/finance-utils.ts`, `web/lib/utils.ts`, `web/lib/currencies.ts`
- Contains: `formatCurrency`, `formatCurrencyCompact`, `parseAmountInput`, `formatAmountDisplay`, `calculateBucketTarget`, `BUCKET_DEFINITIONS`
- Depends on: nothing internal
- Used by: components, queries

## Data Flow

**Read Flow (Server Component page):**

1. Next.js renders the page Server Component
2. Page calls a query function from `lib/queries/` (e.g., `getDashboardData()`)
3. Query calls `getAuthenticatedUser()` which reads the session via `auth.api.getSession()`
4. Query runs Drizzle ORM against Neon Postgres via `lib/db.ts`
5. Typed data is passed as props to child components for rendering

**Mutation Flow (Client Component → Server Action):**

1. User interacts with a client component (e.g., `transaction-sheet.tsx`)
2. Component calls a server action (e.g., `createTransaction(formData)`)
3. Server action calls `getAuthenticatedUser()` for auth + `userId` scope
4. Server action parses and validates input with Zod `safeParse`
5. On success, runs Drizzle insert/update/delete returning the record
6. Calls `revalidatePath()` on affected routes to bust Next.js cache
7. Returns `ActionResult<T>` (`{ success: true, data }` or `{ success: false, error }`)
8. Client component shows a toast (via `sonner`) and updates UI state

**Auth Flow:**

1. Users sign in via email/password or Google OAuth at `/(auth)/login`
2. After sign-in, redirected to `/(app)`
3. New users are redirected to `/onboarding` if no `financialProfile` row exists
4. `app/(app)/layout.tsx` enforces auth and profile existence before rendering any app page
5. All queries and actions re-validate the session via `getAuthenticatedUser()`

**State Management:**
- Global UI state: React Context (`TransactionSheetContext`, `CurrencyContext`)
- Server state: Next.js cache invalidated via `revalidatePath()`
- No client-side state manager (no Redux, Zustand, etc.)

## Key Abstractions

**`getAuthenticatedUser()`:**
- Purpose: Centralizes session extraction and redirects unauthenticated callers to `/login`
- File: `web/lib/queries/auth.ts`
- Pattern: Called at the top of every query and server action to get `userId`

**`ActionResult<T>`:**
- Purpose: Discriminated union return type for all server actions
- File: `web/types/index.ts`
- Pattern: `{ success: true, data?: T } | { success: false, error: string, issues?: ZodIssue[] }`

**`TransactionSheetContext`:**
- Purpose: Global state for the create/edit transaction sheet modal shared across pages
- Files: `web/components/transaction-sheet-context.tsx`, `web/components/transaction-sheet.tsx`
- Pattern: React Context with `openCreate()`, `openEdit(transaction)`, `close()` methods

**`CurrencyProvider` / `useCurrency()`:**
- Purpose: Propagates user's preferred currency to all client components that format amounts
- Files: `web/components/currency-provider.tsx`
- Pattern: React Context wrapping the entire `(app)` layout; provides bound `formatCurrency` and `formatCurrencyCompact`

**50/30/20 Bucket System:**
- Purpose: Categorizes expenses into Needs/Wants/Future allocation buckets
- Files: `web/lib/finance-utils.ts` (constants + math), `web/lib/schema.ts` (`allocationBucketEnum`)
- Pattern: Categories have an optional `allocationBucket` field; dashboard aggregates spending per bucket vs. targets derived from `financialProfile`

## Entry Points

**Root Layout:**
- Location: `web/app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Font setup, global CSS, Sonner `<Toaster>` provider

**App Layout (authenticated):**
- Location: `web/app/(app)/layout.tsx`
- Triggers: Any route under `/(app)/`
- Responsibilities: Session check → redirect to `/login`; profile check → redirect to `/onboarding`; triggers `processRecurringTransactions()`; provides `CurrencyProvider` and `AppShell`

**Auth Layout:**
- Location: `web/app/(auth)/layout.tsx`
- Triggers: Routes `/login`, `/register`, `/onboarding`
- Responsibilities: Centered single-column layout wrapper

**Auth API Route:**
- Location: `web/app/api/auth/[...all]/route.ts`
- Triggers: All better-auth HTTP requests (sign-in, sign-up, OAuth callback, session)
- Responsibilities: Proxies to `better-auth` handler via `toNextJsHandler(auth)`

**Dashboard Page:**
- Location: `web/app/(app)/page.tsx`
- Triggers: GET `/`
- Responsibilities: Parallel-fetches dashboard data; renders balance card, bucket summaries, recent transactions, upcoming recurring

## Error Handling

**Strategy:** Layered — validation errors surfaced to client; DB errors logged and returned as generic messages

**Patterns:**
- Server actions return `ActionResult<T>` — never throw to the client
- All DB writes wrapped in `try/catch`; errors logged with `console.error` and returned as `{ success: false, error: string }`
- `revalidatePath()` is called only after confirmed successful DB writes
- `processRecurringTransactions()` in the app layout is wrapped in try/catch so failures do not block page render
- Queries use `getAuthenticatedUser()` which calls `redirect()` on auth failure (does not return an error value)

## Cross-Cutting Concerns

**Logging:** `console.error` only, used in server actions and `lib/auth.ts` hooks. No structured logging library.

**Validation:** Zod schemas in `lib/validations/` for all mutations; schema types are exported and used by actions. No runtime validation on read queries.

**Authentication:** `better-auth` with Drizzle adapter; session read via `auth.api.getSession({ headers })` in both layouts and the `getAuthenticatedUser()` helper. Google OAuth and email/password both supported.

---

*Architecture analysis: 2026-04-23*
