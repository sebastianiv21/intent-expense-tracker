# Codebase Concerns

**Analysis Date:** 2026-04-19

---

## Technical Debt

### Duplicated `BUCKET_META` constant — `HIGH`
- Issue: An identical `BUCKET_META` record mapping `AllocationBucket` to label, icon, color, and Tailwind classes is defined independently in four different files.
- Files:
  - `web/components/transaction-sheet.tsx` (line 45)
  - `web/components/recurring-page.tsx` (line 92)
  - `web/components/budgets-page.tsx` (line 73)
  - `web/components/financial-profile-sheet.tsx` (line 29 area)
- Impact: Color or label changes must be made in four places. Already diverging — `transaction-sheet.tsx` uses `"#c4714a"` for "wants" while `recurring-page.tsx` also uses `"#c4714a"` but `BUCKET_DEFINITIONS` in `finance-utils.ts` has `"#c97a5a"`. Inconsistent theming will silently emerge.
- Fix approach: Export `BUCKET_META` from `web/lib/finance-utils.ts` alongside `BUCKET_DEFINITIONS` and import it in all four consumers.

### Duplicated `getAmountFontSize` helper — `MEDIUM`
- Issue: An identical font-size-by-digit-count function is copy-pasted in five files.
- Files:
  - `web/app/(auth)/onboarding/page.tsx` (line 44)
  - `web/components/financial-profile-sheet.tsx` (line 29)
  - `web/components/recurring-page.tsx` (line 125)
  - `web/components/budgets-page.tsx` (line 106)
  - `web/components/transaction-sheet.tsx` (line 80)
- Impact: Any change to breakpoints requires touching five files. Low breakage risk but high maintenance cost.
- Fix approach: Export `getAmountFontSize` from `web/lib/finance-utils.ts`.

### Oversized "page" client components — `MEDIUM`
- Issue: Core page components bundle full data-fetching state, form state, inline sheet UIs, and display logic into single files.
  - `web/components/recurring-page.tsx` — 966 lines
  - `web/components/budgets-page.tsx` — 808 lines
  - `web/components/categories-page.tsx` — 696 lines
  - `web/components/transaction-sheet.tsx` — 516 lines
- Impact: Hard to navigate, test, or extend. Sheet / form sub-components cannot be reused independently. As features grow these files will become unmaintainable.
- Fix approach: Extract inline sheet forms (create/edit/delete) into dedicated sub-components under `web/components/`.

### Schema: inconsistent `userId` column type — `MEDIUM`
- Issue: Better-auth tables (`session`, `account`) define `userId` as `text`, while all application tables (`financialProfile`, `categories`, `transactions`, `budgets`, `recurringTransactions`) define it as `varchar(255)`. Foreign key relationships between auth tables and app tables rely on matching values at the application layer without a database-enforced FK from app tables to `user.id`.
- Files: `web/lib/schema.ts` (lines 66, 79, 115, 150, 168, 192, 208)
- Impact: No DB-level referential integrity guarantees between app data and auth users. Orphaned rows possible on user deletion since no `onDelete` cascade exists from app tables to `user`.
- Fix approach: Add explicit `.references(() => user.id, { onDelete: "cascade" })` on `userId` columns in all app tables and align type to `text` to match the `user.id` PK.

### `updateValues` typed as `Record<string, T>` in actions — `LOW`
- Issue: All update actions (`transactions`, `categories`, `budgets`, `recurring`, `financial-profile`) build a `Record<string, string | null>` object and pass it to `.set()`, bypassing Drizzle's column-aware type system.
- Files: `web/lib/actions/transactions.ts` (line 76), `web/lib/actions/budgets.ts` (line 67), `web/lib/actions/categories.ts` (line 68), `web/lib/actions/recurring.ts` (line 99), `web/lib/actions/financial-profile.ts` (line 92)
- Impact: A typo in a key name compiles and only fails at runtime.
- Fix approach: Use Drizzle's `InferInsertModel` partial type or construct the update object directly from validated schema fields.

---

## Security Concerns

### No Next.js middleware for auth enforcement — `HIGH`
- Issue: There is no `web/middleware.ts` file. Route protection for the `(app)` group is handled only inside `web/app/(app)/layout.tsx` via a server component redirect. This means the auth check runs after the page begins rendering, not at the edge before the request is handled.
- Impact: Slightly more attack surface than edge middleware; no centralized enforcement point. Any new route added under `(app)` must remember to inherit this layout — easy to forget.
- Fix approach: Add `middleware.ts` at the web root using `better-auth`'s session helper to enforce auth at the edge for all `(app)` routes.

### App tables lack database-level FK to `user` — `HIGH`
- Issue: `categories`, `transactions`, `budgets`, `recurringTransactions`, and `financialProfile` all store a `userId varchar(255)` but have no database foreign key referencing `user.id`.
- Files: `web/lib/schema.ts`
- Impact: Rows belonging to a deleted user are not automatically removed. No cascading deletes. Data leakage risk if a user id is reused or a query condition is accidentally omitted.
- Fix approach: See Technical Debt entry above.

### `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` used with non-null assertion — `LOW`
- Issue: `web/lib/auth.ts` accesses both env vars with `process.env.GOOGLE_CLIENT_ID!`. If missing at runtime, the auth server initialises silently and Google OAuth will fail cryptically.
- File: `web/lib/auth.ts` (lines 21–22)
- Impact: Poor startup-time failure mode; no clear error if env is misconfigured.
- Fix approach: Add a startup check that throws a descriptive error if either var is absent, similar to the `DATABASE_URL` check in `web/lib/db.ts`.

---

## Performance Risks

### `processRecurringTransactions` runs synchronously on every app page load — `HIGH`
- Issue: `web/app/(app)/layout.tsx` calls `await processRecurringTransactions()` on every navigation within the app group. This function performs a DB select plus N sequential `db.transaction()` calls (one per overdue recurring item × number of missed periods).
- Files: `web/app/(app)/layout.tsx` (line 38), `web/lib/actions/recurring.ts` (line 183)
- Impact: Every page load incurs DB latency proportional to the number of overdue recurring transactions. With a large backlog (e.g., daily items missed for months) this can block rendering for multiple seconds and exhaust Neon serverless connection slots.
- Fix approach: Move processing to a background job or cron endpoint; in the layout, only check `nextDueDate` and render a stale indicator rather than blocking on generation.

### Unbounded transaction export — `MEDIUM`
- Issue: `exportTransactions` in `web/lib/actions/transactions.ts` (line 167) loads up to `10_000` rows into memory in a single query, then returns the full array to the client.
- File: `web/lib/actions/transactions.ts`
- Impact: A user with many transactions triggers a large memory allocation on the server and a large payload transfer. Will degrade or timeout under Neon's serverless connection timeout.
- Fix approach: Stream CSV generation server-side using a `Response` with a `ReadableStream` or paginate the export.

### `getTransactionTotals` runs a separate full-table aggregation alongside `getTransactions` — `LOW`
- Issue: `web/app/(app)/transactions/page.tsx` fires both `getTransactions` and `getTransactionTotals` in parallel, each scanning the `transactions` table with the same filter conditions.
- Files: `web/app/(app)/transactions/page.tsx` (line 62), `web/lib/queries/transactions.ts`
- Impact: Two passes over the same filtered data instead of one. Minor at low scale, noticeable as row count grows.
- Fix approach: Merge both into a single query using a window function or SQL aggregate alongside the paginated rows.

### Currency formatter cache unbounded — `LOW`
- Issue: `web/lib/finance-utils.ts` caches `Intl.NumberFormat` instances in module-level `Map` objects (`formatterCache`, `compactFormatterCache`). The number of distinct currencies is small so this is not a practical issue today.
- File: `web/lib/finance-utils.ts` (lines 50–51)
- Impact: Negligible at current scale; acceptable as-is.

---

## Missing Infrastructure

### Zero automated tests — `HIGH`
- Issue: No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files exist anywhere in the codebase. No test runner config (`jest.config.*`, `vitest.config.*`) is present.
- Impact: All regressions are caught manually. Financial calculation logic (`finance-utils.ts`), action error paths, and recurring transaction date arithmetic have no coverage. The `processRecurringTransactions` while-loop is particularly risky to change without tests.
- Fix approach: Add Vitest, write unit tests for `web/lib/finance-utils.ts` and `web/lib/actions/recurring.ts` as a first pass.

### No error boundaries or `error.tsx` files — `HIGH`
- Issue: The Next.js `(app)` group and all sub-routes have no `error.tsx` files. Any unhandled server error in a page component will produce Next.js's default error screen.
- Files: All routes under `web/app/(app)/`
- Impact: Poor user experience on unexpected errors. No ability to recover gracefully or display contextual messages.
- Fix approach: Add `web/app/(app)/error.tsx` (and optionally `web/app/global-error.tsx`) using the Next.js `"use client"` error boundary pattern.

### No structured logging or error tracking — `MEDIUM`
- Issue: Error handling in all server actions is `console.error(...)` only. No external monitoring service (Sentry, Datadog, etc.) is configured.
- Files: All files in `web/lib/actions/`
- Impact: Production errors are invisible unless actively tailing logs. Silent failures (like category seed failure in `web/lib/auth.ts` line 53) may go unnoticed.
- Fix approach: Integrate Sentry or a lightweight logger; at minimum ensure server action errors surface in a queryable log.

### No CI pipeline — `MEDIUM`
- Issue: No `.github/workflows/`, `Makefile`, or CI config file exists in the repository.
- Impact: No automated lint, type-check, or build validation on PRs. Broken builds only discovered locally.
- Fix approach: Add a GitHub Actions workflow running `tsc --noEmit`, `eslint`, and `next build`.

---

## Scalability Concerns

### Recurring transaction processing is user-scoped, not system-scoped — `MEDIUM`
- Issue: `processRecurringTransactions` only processes items for the currently authenticated user. Items for users who have not logged in recently will fall further and further behind.
- File: `web/lib/actions/recurring.ts` (line 193)
- Impact: Long-absent users return to a large backlog that generates many transactions at once, causing UI confusion and a slow first page load.
- Fix approach: Decouple processing from user sessions; run as a scheduled server-side job that processes all users.

### No pagination on categories or budgets queries — `LOW`
- Issue: `getCategories()` and `getBudgets()` load all records for the user with no limit or pagination.
- Files: `web/lib/queries/categories.ts`, `web/lib/queries/budgets.ts`
- Impact: Acceptable for a personal finance app where category/budget counts are naturally small. Could become noticeable if a power user creates hundreds of categories.
- Fix approach: Not urgent; add server-side limits if usage data indicates excessive row counts.

---

## Code Quality Issues

### `toNumber` helper duplicated between query files — `LOW`
- Issue: A local `toNumber(value: unknown): number` helper is defined in `web/lib/queries/dashboard.ts` (line 51). The same conversion logic is also inlined as `Number(...)` calls throughout `web/lib/queries/insights.ts`.
- Files: `web/lib/queries/dashboard.ts`, `web/lib/queries/insights.ts`
- Impact: Minor inconsistency. Not a bug risk.
- Fix approach: Export `toNumber` from a shared utils module and use it consistently.

### Bucket percentage targets recalculated inline in insights — `LOW`
- Issue: `web/lib/queries/insights.ts` `getAllocationSummary` (lines 121–140) manually multiplies `incomeTarget * percentage / 100` inline without reusing `calculateBucketTarget` from `finance-utils.ts`.
- File: `web/lib/queries/insights.ts`
- Impact: If the target calculation formula changes, `getAllocationSummary` will silently diverge from the rest of the app.
- Fix approach: Import and use `calculateBucketTarget` from `web/lib/finance-utils.ts`.

### `next: "16.1.6"` pinned as exact version — `LOW`
- Issue: The `next` and `eslint-config-next` versions are pinned without a caret (`^`) while all other deps use `^`.
- File: `web/package.json` (lines 35, 55)
- Impact: Patch security fixes to Next.js will not be automatically picked up on `npm install`.
- Fix approach: Use `^16.1.6` or stay current by running `npm update next`.

---

*Concerns audit: 2026-04-19*
