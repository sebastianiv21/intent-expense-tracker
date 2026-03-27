# Quickstart: Transactions Page Redesign

**Branch**: `004-transactions-page-redesign`

## Prerequisites

- Node.js 24, pnpm installed
- `.env` file with `DATABASE_URL` and `BETTER_AUTH_SECRET` set
- Database already migrated (no new migrations for this feature)

## Setup

```bash
# 1. Switch to the feature branch (already done by speckit)
git checkout 004-transactions-page-redesign

# 2. Install dependencies (adds sonner)
cd web && pnpm install

# 3. Start the dev server
pnpm dev
```

## Adding `sonner`

This feature adds one new dependency:

```bash
cd web && pnpm add sonner
```

Then add `<Toaster />` to `web/app/layout.tsx`:

```tsx
import { Toaster } from "sonner";

// Inside <body>:
<Toaster position="bottom-center" richColors />
```

## No Database Migrations

This feature makes no schema changes. `pnpm db:generate` and `pnpm db:push` are not required.

## Verification Steps

After implementation, verify each requirement:

```bash
# Lint
pnpm lint

# Build
pnpm build
```

### Manual verification checklist

1. **Search (FR-001/002)**: Type in search box → list updates after ~300ms without pressing Enter. Refresh page → query is preserved in URL.

2. **Filter + search (FR-003/004)**: Type a keyword, then click "Expense" → keyword stays in input and URL. Click "All" → type filter removed, keyword preserved.

3. **Date grouping (FR-005/006)**: Confirm transactions are grouped with "Today", "Yesterday", or "Mar DD" headers.

4. **Summary bar (FR-007)**: Visible on all views with transactions. Shows correct count, income, and expense totals.

5. **Overflow menu (FR-008/009)**: No inline Edit/Delete buttons visible. Click `...` → Edit and Delete appear. Tap targets ≥ 44px.

6. **Undo delete (FR-008b)**: Delete a transaction → it disappears, toast shows "Undo". Click Undo → transaction restores. Wait 5 seconds → transaction permanently deleted.

7. **Load more (FR-010/011)**: With > 50 transactions, "Load more" button visible. Click → button shows "Loading…", new rows append. Filter + load more → filter preserved.

8. **CSV export (FR-012/013)**: Click Export on mobile and desktop → CSV downloads. Open in spreadsheet → columns are `date,description,category,type,amount`; amounts are signed decimals.

9. **Empty states (FR-014)**: With a search that returns nothing → "No results" message. New account with no transactions → first-use message.

## Key Files

| File | Change |
|------|--------|
| `app/layout.tsx` | Add `<Toaster />` |
| `app/(app)/transactions/page.tsx` | Major refactor |
| `components/transaction-item.tsx` | Replace buttons with DropdownMenu; lift `onDelete` |
| `components/transaction-list.tsx` | NEW |
| `components/transaction-search.tsx` | NEW |
| `components/transaction-summary.tsx` | NEW |
| `lib/queries/transactions.ts` | Add `getTransactionTotals` |
| `lib/actions/transactions.ts` | Add `loadMoreTransactions`, `exportTransactions` |
| `types/index.ts` | Add `TransactionBatch`, `TransactionTotals`, `FilterState` |
