# Data Model: Transactions Page Redesign

**Phase**: 1 | **Date**: 2026-03-26 | **Branch**: `004-transactions-page-redesign`

> No database schema changes are required for this feature. All entities already exist.
> This document captures the TypeScript type additions and query shape changes needed.

---

## Existing Entities (Unchanged Schema)

### Transaction
Defined in `lib/schema.ts` → `transactions` table.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `uuid` | Primary key |
| `userId` | `varchar(255)` | Foreign key to `user.id`; all queries scoped by this |
| `categoryId` | `uuid \| null` | Foreign key to `categories.id` (set null on delete) |
| `amount` | `numeric(12,2)` | Stored as string in JS (`"12.50"`); formatted via `formatCurrency()` |
| `type` | `transaction_type` enum | `"expense"` or `"income"` |
| `description` | `text \| null` | Optional free-text label |
| `date` | `date` | ISO 8601 string (`YYYY-MM-DD`); basis for date grouping |
| `createdAt` | `timestamp` | Insertion time; NOT used for display grouping |

### Category
Defined in `lib/schema.ts` → `categories` table. Unchanged.

---

## New / Modified TypeScript Types

### `TransactionBatch` (NEW — `types/index.ts`)

Returned by `loadMoreTransactions` Server Action.

```ts
export type TransactionBatch = {
  transactions: TransactionWithCategory[];
  hasMore: boolean;
};
```

### `TransactionTotals` (NEW — `types/index.ts`)

Returned by `getTransactionTotals` query and passed to `TransactionSummary`.

```ts
export type TransactionTotals = {
  count: number;
  totalIncome: number;   // sum of all income amounts in current filter
  totalExpenses: number; // sum of all expense amounts in current filter (positive value)
};
```

### `FilterState` (NEW — `types/index.ts`)

Represents the URL search parameter state passed between server and client components.

```ts
export type FilterState = {
  type?: TransactionType;
  search?: string;
};
```

---

## Query Shape Changes

### `getTransactions` (`lib/queries/transactions.ts`) — EXISTING, no change

Already accepts `{ limit, offset, type, search, orderBy }`. No changes needed.

### `getTransactionTotals` (`lib/queries/transactions.ts`) — NEW

Fetches aggregated income and expense totals matching the current filter. No `limit`/`offset` — operates on the full filtered dataset.

```ts
export async function getTransactionTotals(params: {
  type?: TransactionType;
  search?: string;
}): Promise<TransactionTotals>
```

**Implementation approach**: Single SQL query using `COUNT(*)`, conditional `SUM` for income, conditional `SUM` for expenses. Uses the same `userId` + `type` + `search` conditions as `getTransactions`.

### `exportTransactions` (`lib/actions/transactions.ts`) — NEW Server Action

Returns all matching transactions (no `limit`) for CSV generation. Calls `getTransactions` with `limit: 10_000` as a safety ceiling.

```ts
export async function exportTransactions(params: FilterState): Promise<TransactionWithCategory[]>
```

### `loadMoreTransactions` (`lib/actions/transactions.ts`) — NEW Server Action

```ts
export async function loadMoreTransactions(params: {
  limit: number;
  offset: number;
  type?: TransactionType;
  search?: string;
}): Promise<TransactionBatch>
```

Calls `getTransactions({ ...params, limit: params.limit + 1 })` and returns `{ transactions: rows.slice(0, limit), hasMore: rows.length > limit }`.

---

## Date Grouping Logic (Render-Only)

No persistence. Groups are computed at render time inside `TransactionList`.

```ts
// Pseudocode
type DateGroup = {
  label: string;           // "Today" | "Yesterday" | "Mar 24"
  transactions: TransactionWithCategory[];
};

function groupByDate(transactions: TransactionWithCategory[]): DateGroup[]
```

Labels use `date-fns`:
- `isToday(parseISO(t.date))` → `"Today"`
- `isYesterday(parseISO(t.date))` → `"Yesterday"`
- otherwise → `format(parseISO(t.date), "MMM d")`

---

## Data Validation Rules

| Rule | Enforcement |
|------|-------------|
| `amount` is always a positive numeric string | Existing `createTransactionSchema` in `lib/validations/transactions.ts` |
| `type` is `"expense"` or `"income"` | Postgres enum + Zod enum in validation schema |
| `date` is a valid ISO date string | Zod `.string().date()` in validation schema |
| Totals calculations treat `amount` as `parseFloat(t.amount)` | Existing `finance-utils.ts` pattern |
| CSV `amount` column: negative for expenses, positive for income | Applied during CSV assembly in client component |
