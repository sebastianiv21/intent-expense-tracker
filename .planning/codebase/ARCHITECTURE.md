# Architecture

**Analysis Date:** 2026-04-19

## Pattern Overview

**Overall:** Next.js App Router monolith with a layered server/client split

**Key Characteristics:**
- Single `web/` package — no monorepo, no separate API service
- React Server Components (RSC) handle data fetching directly on the server
- Next.js Server Actions (`"use server"`) are used for all mutations
- Client components are isolated to interactive UI only (forms, sheets, context providers)
- No REST API layer beyond the auth handler — data access goes Server Component → query → Drizzle → Neon

## Layers

**Route Layer (Pages):**
- Purpose: Render pages by calling queries and composing server components
- Location: `web/app/(app)/` and `web/app/(auth)/`
- Contains: Async server components that fetch data with `await`
- Depends on: `lib/queries/`, `components/`
- Used by: Next.js router

**Query Layer:**
- Purpose: Read data from the database, scoped to the authenticated user
- Location: `web/lib/queries/`
- Contains: Async functions that call `db` (Drizzle) directly
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/queries/auth.ts`
- Used by: Server components (pages and layouts)

**Action Layer:**
- Purpose: Handle all mutations (create, update, delete) with validation and cache revalidation
- Location: `web/lib/actions/`
- Contains: `"use server"` functions that validate input with Zod, write to DB via Drizzle, and call `revalidatePath`
- Depends on: `lib/db.ts`, `lib/schema.ts`, `lib/validations/`, `lib/queries/auth.ts`
- Used by: Client components (forms, sheets)

**Component Layer:**
- Purpose: Reusable UI, both server and client
- Location: `web/components/`
- Contains: Feature components (page-level views, sheets, cards) and primitives (`ui/`)
- Depends on: `types/`, `lib/auth-client.ts`, actions (for mutation callbacks)
- Used by: Pages and layouts

**Database Layer:**
- Purpose: Schema definition, migration files, and DB client
- Location: `web/lib/schema.ts`, `web/lib/db.ts`, `web/drizzle/`
- Contains: Drizzle ORM table definitions and relations; Neon serverless pool connection
- Depends on: `@neondatabase/serverless`, `drizzle-orm`

## Data Flow

**Read (Server Component):**
1. Next.js renders a page as an async server component
2. Page calls a query function from `lib/queries/` (e.g., `getDashboardData()`)
3. Query calls `getAuthenticatedUser()` to get `userId` from the session
4. Query executes Drizzle SQL against the Neon PostgreSQL DB
5. Data is passed as props to child components for rendering

**Mutation (Client → Server Action):**
1. User interacts with a client component (e.g., transaction form in a Sheet)
2. Client component calls a Server Action imported from `lib/actions/`
3. Server Action validates input with Zod schema
4. On success: writes to DB via Drizzle, calls `revalidatePath` to bust RSC cache
5. Returns `ActionResult<T>` (discriminated union `{ success: true, data }` or `{ success: false, error }`)
6. Client component reads the result and shows a toast or error message

**State Management:**
- Server state: owned by RSC cache, invalidated via `revalidatePath`
- Client state: React `useState` and React Context (e.g., `TransactionSheetContext`)
- No global client state library (no Zustand, Redux, etc.)
- Currency is propagated via `CurrencyProvider` context from the `(app)` layout

## Key Abstractions

**`ActionResult<T>`:**
- Purpose: Typed discriminated union return from every Server Action
- Definition: `web/types/index.ts`
- Pattern: `{ success: true; data?: T } | { success: false; error: string; issues?: ZodIssue[] }`

**`getAuthenticatedUser()`:**
- Purpose: Centralized session check used by every query and action
- Location: `web/lib/queries/auth.ts`
- Pattern: Throws or redirects if no session; returns `{ userId, name }`

**`TransactionSheetContext`:**
- Purpose: Global client-side state for the create/edit transaction sheet
- Location: `web/components/transaction-sheet-context.tsx`
- Pattern: Context + `useState`; exposes `openCreate()`, `openEdit(tx)`, `close()`

**`AppShell`:**
- Purpose: Shared authenticated app chrome wrapping all `(app)` pages
- Location: `web/components/app-shell.tsx`
- Contains: `SideNav` (desktop), `BottomNav` (mobile), `TransactionSheet`, `TransactionSheetProvider`

**`finance-utils`:**
- Purpose: Domain logic for 50/30/20 budget allocation calculations
- Location: `web/lib/finance-utils.ts`
- Contains: `BUCKET_DEFINITIONS`, `calculateBucketTarget`, `calculatePercentage`, amount formatting/parsing utilities

## Auth Architecture

**Provider:** `better-auth` (`web/lib/auth.ts`)
- Supports email/password and Google OAuth
- Account linking enabled for Google
- DB adapter: Drizzle against Neon, using `user`, `session`, `account`, `verification` tables

**Server-side session check:**
- `auth.api.getSession({ headers })` called in server components and layouts
- `(app)` layout (`web/app/(app)/layout.tsx`) redirects to `/login` if no session, to `/onboarding` if no `financialProfile`

**Client-side auth:**
- `authClient` from `web/lib/auth-client.ts` (uses `better-auth/react`)
- Exposes `signIn`, `signUp`, `signOut`, `useSession`, `getSession`
- Login and register pages are client components that call `signIn.email()` and `signIn.social()`

**Auth API route:**
- `web/app/api/auth/[...all]/route.ts` — delegates all auth HTTP traffic to `better-auth` via `toNextJsHandler`

**Post-registration hook:**
- On user creation, `better-auth` `databaseHooks.user.create.after` seeds default categories for the new user

## Database Schema Overview

All tables are in PostgreSQL (Neon). Drizzle ORM is used for all access. Schema defined in `web/lib/schema.ts`.

**Core tables:**
- `user` — auth identity (id, name, email, emailVerified, image)
- `session` — active sessions with token and expiry; FK → user
- `account` — OAuth provider accounts; FK → user
- `verification` — email/token verification records

**App tables:**
- `financial_profile` — per-user 50/30/20 allocation percentages and monthly income target; PK = userId
- `categories` — user-defined income/expense categories with optional `allocation_bucket` (needs/wants/future) and emoji icon
- `transactions` — individual income or expense entries with amount, date, type, optional categoryId
- `budgets` — spending limits per category, monthly or weekly, with a start date
- `recurring_transactions` — recurring income/expense templates with frequency, nextDueDate, lastGeneratedDate, isActive flag

**Enums:**
- `transaction_type`: `expense | income`
- `budget_period`: `monthly | weekly`
- `allocation_bucket`: `needs | wants | future`
- `recurrence_frequency`: `daily | weekly | biweekly | monthly | quarterly | yearly`

**Key relations:**
- user → financialProfile (one-to-one)
- user → categories, transactions, budgets, recurringTransactions (one-to-many)
- categories → transactions, budgets, recurringTransactions (one-to-many, nullable FK with set-null on delete)

**Migrations:**
- Located in `web/drizzle/` as numbered SQL files (`0000_lyrical_demogoblin.sql`, etc.)

---

*Architecture analysis: 2026-04-19*
