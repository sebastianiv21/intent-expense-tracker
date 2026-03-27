# Implementation Plan: Transactions Page Redesign

**Branch**: `004-transactions-page-redesign` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-transactions-page-redesign/spec.md`

## Summary

Refactor the Transactions page to fix six functional gaps: wire the search input to URL params with a 300ms debounce, group transactions by date, replace inline Edit/Delete buttons with a DropdownMenu overflow control, add a persistent totals summary bar, implement load-more pagination, and add CSV export. One new dependency (`sonner`) is introduced for the undo-delete toast pattern chosen during clarification. No database schema changes are required.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16.1.6 (App Router), React 19.2.3
**Primary Dependencies**: Tailwind CSS 4, shadcn/ui (Radix UI), Drizzle ORM 0.45, Zod 4, date-fns 4.1, lucide-react 0.577, `sonner` (to be added)
**Storage**: PostgreSQL via Neon Serverless, Drizzle ORM — no schema changes
**Testing**: `pnpm lint` (ESLint), `pnpm build`
**Target Platform**: Web, mobile-first (375px base), progressive enhancement to desktop
**Performance Goals**: Debounce search at 300ms; initial server render unchanged; load-more fetches ≤ 50 rows per batch
**Constraints**: No new component libraries beyond shadcn/ui; no REST API routes; `sonner` justified (see Complexity Tracking)
**Scale/Scope**: Single authenticated user; pagination in 50-item batches

## Constitution Check

*GATE: Must pass before implementation. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | ✅ Pass | All new interactive targets sized ≥ 44px. DropdownMenu trigger uses `min-h-[44px]`. No centered dialogs introduced. Delete uses toast (bottom) not dialog. |
| I. Loading states / no spinners | ✅ Pass | "Load more" button loading state uses `isPending` text-label change (`"Loading…"`), not a spinner icon. Skeleton screens in `loading.tsx` unchanged. |
| I. Animations | ✅ Pass | No new animation primitives. Existing `motion-safe:transition-colors` preserved. |
| II. Type Safety | ✅ Pass | New Server Action typed with `TransactionWithCategory[]`. New `TransactionBatch` type added to `types/index.ts`. All inputs validated via Zod or Drizzle types. |
| III. Security | ✅ Pass | `getAuthenticatedUser()` called in `loadMoreTransactions` (via `getTransactions` call chain). CSV export Server Action scoped by `userId`. |
| IV. Accessibility | ✅ Pass | DropdownMenu uses Radix primitives (ARIA roles managed). Focus returns to trigger on close. Toast `role="status"` handled by sonner. |
| V. Simplicity / new deps | ⚠️ Justified | `sonner` added for undo-delete toast. See Complexity Tracking. No other new packages. |
| Tech: No REST routes | ✅ Pass | CSV export uses a Server Action returning data; client generates Blob download. No new route handlers. |
| Tech: Data access pattern | ✅ Pass | New reads in `lib/queries/transactions.ts`. New `loadMoreTransactions` and `exportTransactions` Server Actions in `lib/actions/transactions.ts`. |
| Tech: shadcn/ui components | ✅ Pass | DropdownMenu already installed. No alternative component libraries used. |

## Project Structure

### Documentation (this feature)

```text
specs/004-transactions-page-redesign/
├── plan.md              ← this file
├── research.md          ← Phase 0
├── data-model.md        ← Phase 1
├── quickstart.md        ← Phase 1
├── contracts/
│   ├── server-actions.md
│   └── component-props.md
└── checklists/
    └── requirements.md
```

### Source Code Changes

```text
web/
├── app/
│   ├── layout.tsx                              MODIFY — add <Toaster /> from sonner
│   └── (app)/
│       └── transactions/
│           └── page.tsx                        MODIFY — major refactor
├── components/
│   ├── transaction-item.tsx                    MODIFY — replace inline buttons with DropdownMenu
│   ├── transaction-list.tsx                    NEW — client component; owns accumulated rows, undo-delete, load-more
│   ├── transaction-search.tsx                  NEW — client component; debounced URL search input
│   └── transaction-summary.tsx                 NEW — server or client component; totals bar
└── lib/
    ├── actions/
    │   └── transactions.ts                     MODIFY — add loadMoreTransactions, exportTransactions
    ├── queries/
    │   └── transactions.ts                     MODIFY — add getTransactionTotals helper
    └── (no schema changes — no migrations)
```

**Structure Decision**: Hybrid server/client split. `TransactionsPage` (Server Component) fetches the initial batch and totals, then passes data to `TransactionList` (Client Component) for pagination, undo-delete, and search integration. This preserves SSR for initial load while enabling client-side state for accumulated rows.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency: `sonner` | Undo-delete toast pattern (Q2 clarification) requires a toast notification system. No such mechanism exists in the current codebase. | `@radix-ui/react-toast` not installed either; building a custom toast adds more code than adding the canonical shadcn/ui recommendation (`sonner`, ~4KB gzipped). Inline confirm button (Option A) was rejected in clarification as adding visual noise to a long list. |
