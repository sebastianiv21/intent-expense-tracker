# Codebase Concerns

**Analysis Date:** 2026-04-23

## Tech Debt

**BUCKET_META constant duplicated across four components:**
- Issue: The `BUCKET_META` record mapping `AllocationBucket` to icon, color, border class, and text class is defined separately in four files with slightly different values.
- Files: `web/components/transaction-sheet.tsx:45`, `web/components/budgets-page.tsx:73`, `web/components/recurring-page.tsx:92`, and the `wants` color differs (`#c4714a` vs `#c97a5a` between files).
- Impact: Color inconsistency in UI; any brand color change requires editing four locations.
- Fix approach: Extract to `lib/finance-utils.ts` or a dedicated `lib/bucket-meta.ts` constant and import everywhere.

**`getAmountFontSize` function duplicated in five places:**
- Issue: An identical helper mapping digit count to Tailwind font-size class is copy-pasted in every component that renders an amount input.
- Files: `web/components/transaction-sheet.tsx:80`, `web/components/budgets-page.tsx:106`, `web/components/recurring-page.tsx:125`, `web/components/financial-profile-sheet.tsx:29`, `web/app/(auth)/onboarding/page.tsx:44`.
- Impact: Maintenance burden; any resize threshold change requires five edits.
- Fix approach: Move to `lib/finance-utils.ts` and export as `getAmountFontSize`.

**Pervasive unsafe type casts from Drizzle query results:**
- Issue: Every query and action casts raw Drizzle `returning()` results directly to domain types using `as Transaction`, `as Category`, etc., bypassing type safety.
- Files: All `lib/queries/*.ts` and `lib/actions/*.ts` files — e.g., `web/lib/queries/dashboard.ts:207-212`, `web/lib/actions/transactions.ts:54`, `web/lib/queries/budgets.ts:23-24`.
- Impact: Silent runtime mismatches if Drizzle schema diverges from `@/types`; no compile-time protection against missing columns.
- Fix approach: Use `$inferSelect` from Drizzle table definitions instead of hand-authored types, or at minimum add runtime validation at the query boundary.

**`updateTransaction` uses `Record<string, string | null>` for update payload:**
- Issue: In `lib/actions/transactions.ts:76` and similar update actions (budgets, categories, recurring), update values are built into a loosely-typed `Record<string, string | null>` that bypasses Drizzle's column type system.
- Files: `web/lib/actions/transactions.ts:76`, `web/lib/actions/recurring.ts:99`, `web/lib/actions/budgets.ts:67`, `web/lib/actions/categories.ts:68`.
- Impact: Type errors in update payloads are not caught at compile time; boolean fields like `isActive` require the `string | boolean | null` union hack in recurring actions.
- Fix approach: Build typed update objects using `Partial<typeof table.$inferInsert>` or Drizzle's `.set()` method directly.

**`next.config.ts` is effectively empty:**
- Issue: The Next.js config at `web/next.config.ts` has no meaningful options (no `headers`, no `rewrites`, no `images` config).
- Files: `web/next.config.ts`.
- Impact: Missing security headers (CSP, HSTS, X-Frame-Options, etc.); no cache-control tuning.
- Fix approach: Add security headers via `next.config.ts` `headers()` function.

**`BUCKET_META` icon values are hardcoded Lucide component references:**
- Issue: `BUCKET_META` stores icon components as `typeof Home` typed values. This creates a hard coupling between display logic and component identity inside both `transaction-sheet.tsx` and `budgets-page.tsx`.
- Files: `web/components/transaction-sheet.tsx:45`, `web/components/budgets-page.tsx:73`, `web/components/recurring-page.tsx:92`.
- Impact: Circular dependency risk; cannot serialize or lazily import buckets.
- Fix approach: Store icon name strings and resolve components at render time, or split `BUCKET_META` into data-only and render-only layers.

## Known Bugs

**Weekly budgets compared against full-month spending:**
- Symptoms: When a budget has `period = "weekly"`, the spending query in `getBudgetsWithSpending` fetches all transactions for the selected calendar month, not the current week. The `period` field is stored but never used to slice the date range.
- Files: `web/lib/queries/budgets.ts:27-62`.
- Trigger: Create a weekly budget; the "spent" figure will include the entire month.
- Workaround: None. The period selector in the UI appears to work but has no backend effect on the comparison window.

**Google OAuth new-user flow may skip onboarding:**
- Symptoms: After Google sign-in, the callback URL is hardcoded to `/onboarding`. If a returning user signs in via Google again (account linking), they are redirected to `/onboarding` even if a `financial_profile` already exists. The `AppLayout` guard then immediately redirects them to `/`.
- Files: `web/app/(auth)/register/page.tsx:39`, `web/app/(app)/layout.tsx:32-34`.
- Trigger: Existing Google-auth user signs in via the register page.
- Workaround: The double redirect is harmless but causes a flash.

**`processRecurringTransactions` silently eats errors at the layout level:**
- Symptoms: If recurring transaction processing fails (e.g., DB error mid-loop), `generated` returns `0` and nothing is surfaced to the user. Partially processed batches leave `nextDueDate` advanced on some records but not others.
- Files: `web/app/(app)/layout.tsx:37-41`, `web/lib/actions/recurring.ts:243-246`.
- Trigger: DB connectivity issues during layout render.
- Workaround: Each iteration is wrapped in a DB transaction, so individual failures are atomic, but the outer loop failure leaves the batch incomplete.

**`exportTransactions` hardcodes a 10,000 row limit with no user feedback:**
- Symptoms: If a user has more than 10,000 transactions, the export silently truncates.
- Files: `web/lib/actions/transactions.ts:163-170`.
- Trigger: Large account with > 10,000 transactions.
- Workaround: None visible to the user.

## Security Considerations

**Google OAuth credentials use non-null assertion without runtime guard:**
- Risk: `process.env.GOOGLE_CLIENT_ID!` and `process.env.GOOGLE_CLIENT_SECRET!` in `lib/auth.ts:22-23` will produce a runtime `undefined` value passed to `better-auth` rather than throwing a clear startup error if the env vars are absent.
- Files: `web/lib/auth.ts:22-23`.
- Current mitigation: `drizzle.config.ts` and `db.ts` do throw on missing `DATABASE_URL`, setting a partial precedent.
- Recommendations: Add explicit startup guards for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` matching the `DATABASE_URL` pattern.

**No HTTP security headers configured:**
- Risk: Missing Content-Security-Policy, X-Frame-Options, Referrer-Policy, and Permissions-Policy headers. A Next.js app with a financial context is a higher-value target for clickjacking.
- Files: `web/next.config.ts`.
- Current mitigation: None. Neon and better-auth provide their own session/token security.
- Recommendations: Add security headers via the `headers()` export in `next.config.ts`.

**Password policy enforced only via HTML `minLength` attribute:**
- Risk: The register form uses `minLength={8}` on the password `<input>`, but there is no server-side or Zod-level password length/complexity validation. The HTML attribute is easily bypassed.
- Files: `web/app/(auth)/register/page.tsx:111`.
- Current mitigation: `better-auth` may enforce its own minimum server-side (unverified in current config).
- Recommendations: Add explicit password validation in server-side signup logic or configure `better-auth` password rules.

**`categoryId` ownership not verified on transaction creation:**
- Risk: When creating or updating a transaction, the `categoryId` is validated as a valid UUID format but is not checked to confirm it belongs to the authenticated user. A user could assign a `categoryId` from another user's account.
- Files: `web/lib/actions/transactions.ts:22-58`, `web/lib/actions/recurring.ts:32-81`, `web/lib/actions/budgets.ts:14-49`.
- Current mitigation: Category data is never returned for unauthorized users in queries (all queries filter by `userId`), so the impact is limited to data tagging, not data exposure.
- Recommendations: Add a `db.select` ownership check before inserting with a foreign `categoryId`.

## Performance Bottlenecks

**`processRecurringTransactions` runs synchronously on every page load in AppLayout:**
- Problem: Every request to any authenticated route triggers a sequential DB read + N×(insert + update) loop inside `web/app/(app)/layout.tsx:38`. For users with many overdue recurring items, this adds unbounded latency to every navigation.
- Files: `web/app/(app)/layout.tsx:37-41`, `web/lib/actions/recurring.ts:183-247`.
- Cause: Processing is triggered in the layout render rather than a background job or cron.
- Improvement path: Move to a dedicated cron/webhook endpoint (e.g., Vercel Cron) called on a schedule, not on user requests.

**Dashboard runs 5 parallel DB queries every render (no caching):**
- Problem: `getDashboardData` fires 5 concurrent queries on every page load with no Next.js `cache()` wrapper or `unstable_cache`.
- Files: `web/lib/queries/dashboard.ts:71-139`.
- Cause: Server Components are not cached by default in Next.js app router when using dynamic data.
- Improvement path: Wrap in `unstable_cache` with a per-user tag; invalidate via `revalidateTag` from server actions.

**No compound index on `(userId, date)` for transactions:**
- Problem: Queries filtering by `userId` AND `date` range (dashboard, insights) use two separate single-column indexes: `transactions_userId_idx` and `transactions_date_idx`. PostgreSQL will only use one.
- Files: `web/lib/schema.ts:183-185`.
- Cause: Indexes were added individually rather than as a covering composite.
- Improvement path: Add `index("transactions_userId_date_idx").on(table.userId, table.date)` in schema and generate a migration.

**No compound index on `(userId, isActive, nextDueDate)` for recurring:**
- Problem: `processRecurringTransactions` queries recurring by `userId + isActive + nextDueDate` but only `recurring_userId_idx` exists.
- Files: `web/lib/schema.ts:227`.
- Improvement path: Add composite index on `(userId, isActive, nextDueDate)`.

**`getInsights` issues two sequential DB queries rather than one:**
- Problem: `getInsights` runs a totals query then a `spendingByCategory` query sequentially (no `Promise.all`).
- Files: `web/lib/queries/insights.ts:28-60`.
- Cause: Sequential `await` calls.
- Improvement path: Wrap both in `Promise.all`.

## Fragile Areas

**`inferDecimalSeparator` heuristic in `parseAmountInput`:**
- Files: `web/lib/finance-utils.ts:110-128`.
- Why fragile: The function infers whether a separator character is a decimal or thousands separator by counting trailing digits. Inputs like `"1.000"` are ambiguous and the heuristic returns `null` (treating the dot as a thousands separator), which may surprise users from locales where `.` is the thousands separator.
- Safe modification: The heuristic is tested indirectly by the amount input UI; any change must be verified across `onboarding/page.tsx`, `transaction-sheet.tsx`, `financial-profile-sheet.tsx`, `budgets-page.tsx`, and `recurring-page.tsx`.
- Test coverage: No automated tests exist for this function.

**`computeNextDueDate` has no case for `"monthly"` frequency:**
- Files: `web/lib/actions/recurring.ts:15-30`.
- Why fragile: The `switch` statement handles `daily`, `weekly`, `biweekly`, `quarterly`, `yearly`, but `"monthly"` falls through to the `default` branch which also returns `addMonths(date, 1)`. While functionally correct today, adding new frequency values could accidentally use the monthly default.
- Safe modification: Add an explicit `case "monthly":` branch to make intent clear.

**`AppLayout` session fetch is duplicated from `getAuthenticatedUser`:**
- Files: `web/app/(app)/layout.tsx:18-24`, `web/lib/queries/auth.ts:1-15`.
- Why fragile: `AppLayout` makes its own `auth.api.getSession` call rather than using `getAuthenticatedUser()`, creating two separate session fetches per request and diverging guard logic.
- Safe modification: Replace layout's inline session check with `getAuthenticatedUser()`.

**`formatCurrency` always uses `"en-US"` locale regardless of user's currency:**
- Files: `web/lib/finance-utils.ts:56`, `web/lib/finance-utils.ts:68`.
- Why fragile: Currencies like JPY, CLP, or KRW have no decimal places, but the formatter explicitly sets `minimumFractionDigits: 2`. This will display `¥1,234.00` instead of `¥1,234` for Japanese Yen.
- Safe modification: Remove the fixed fraction digit overrides and rely on the `Intl.NumberFormat` defaults for the given currency code.

## Scaling Limits

**All-time transaction count is unbounded with no archiving strategy:**
- Current capacity: The `transactions` table has no row limit; `exportTransactions` caps at 10,000 rows.
- Limit: `getTransactions` with `limit: 50` is fine for UI, but aggregation queries in `getDashboardData` and `getInsights` do full table scans filtered only by `userId`. Performance will degrade as rows grow into the tens of thousands per user.
- Scaling path: Add date-range partitioning or archiving strategy; use materialized summaries for dashboard aggregates.

**Single Neon connection pool for all server-side requests:**
- Current capacity: One `Pool` instance in `web/lib/db.ts` shared across all serverless invocations.
- Limit: Neon serverless handles connection multiplexing, but the `ws` polyfill path in `db.ts:13-15` may not behave optimally under high concurrency in edge runtimes.
- Scaling path: Switch to Neon HTTP driver (`neon()`) for simple queries; reserve pool for transactions.

## Dependencies at Risk

**`better-auth` at `^1.5.5` is a relatively new and fast-moving library:**
- Risk: The library's API surface (especially `databaseHooks`, `drizzleAdapter`) has changed between minor versions. Pin to an exact version or lock at patch level.
- Impact: Auth breakage on pnpm update.
- Migration plan: Lock to `1.5.5` in `package.json`; monitor changelog before upgrading.

**`next` at `16.1.6` (pre-release series):**
- Risk: Next.js 16 is the current stable series but `16.1.6` may include breaking changes from `15.x` patterns (e.g., `searchParams` is now a `Promise` in server components, which the codebase handles with `await searchParams` — correct, but fragile against future changes).
- Files: `web/app/(app)/transactions/page.tsx:58`, `web/app/(app)/budgets/page.tsx:15`.
- Impact: API surface changes may require coordinated updates across all page files.

## Missing Critical Features

**No automated recurring transaction processing job:**
- Problem: Recurring transactions are only processed when a user loads an authenticated page (`AppLayout`). If a user doesn't log in, transactions are never generated. The `processRecurringTransactions` function also adds latency to every page load.
- Blocks: Reliable financial tracking for users who log in infrequently; accurate balance for dormant accounts.

**No validation that budget `categoryId` belongs to the authenticated user:**
- Problem: `createBudget` accepts any valid UUID as `categoryId` without confirming ownership. See Security Considerations above.
- Blocks: Full data integrity for multi-user isolation.

## Test Coverage Gaps

**Zero test files in the entire codebase:**
- What's not tested: All server actions, query functions, validation schemas, finance utilities including the `inferDecimalSeparator` heuristic, and all UI components.
- Files: Entire `web/` directory.
- Risk: Regressions in critical paths (authentication, transaction CRUD, recurring processing) are caught only in production. The `inferDecimalSeparator` function in `web/lib/finance-utils.ts:110-128` has complex branching logic with no tests.
- Priority: High — especially for `lib/actions/`, `lib/queries/`, and `lib/finance-utils.ts`.

---

*Concerns audit: 2026-04-23*
