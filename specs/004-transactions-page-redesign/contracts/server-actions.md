# Server Action Contracts: Transactions Page Redesign

**Phase**: 1 | **Date**: 2026-03-26

---

## Existing Actions (Unchanged Signatures)

### `createTransaction(formData: unknown): Promise<ActionResult<Transaction>>`
### `updateTransaction(id: string, data: unknown): Promise<ActionResult<Transaction>>`
### `deleteTransaction(id: string): Promise<ActionResult>`

All in `lib/actions/transactions.ts`. Signatures and behaviour unchanged.

---

## New Server Actions

### `loadMoreTransactions`

**File**: `lib/actions/transactions.ts`
**Purpose**: Fetches the next batch of transactions for the "Load more" pagination control.

```ts
export async function loadMoreTransactions(params: {
  limit: number;   // Number of items per page (matches PAGE_SIZE constant, default 50)
  offset: number;  // Number of rows already loaded
  type?: TransactionType;  // Optional type filter preserved from active filter state
  search?: string;         // Optional search query preserved from active filter state
}): Promise<TransactionBatch>
// TransactionBatch = { transactions: TransactionWithCategory[]; hasMore: boolean }
```

**Auth**: Calls `getAuthenticatedUser()` via `getTransactions`.
**Validation**: `limit` must be a positive integer; `offset` must be non-negative. Both validated at call site (component enforces this structurally).
**Error behaviour**: If auth fails, throws (handled by Next.js error boundary). No partial results returned.

---

### `exportTransactions`

**File**: `lib/actions/transactions.ts`
**Purpose**: Returns all transactions matching the current filter for client-side CSV generation.

```ts
export async function exportTransactions(params: FilterState): Promise<TransactionWithCategory[]>
// FilterState = { type?: TransactionType; search?: string }
```

**Auth**: Calls `getAuthenticatedUser()` via `getTransactions`. All rows are scoped to the authenticated user's `userId`.
**Limit**: Hardcoded ceiling of `10_000` rows to prevent accidental over-fetch. In practice, personal finance apps rarely exceed this.
**Returns**: Plain array, serialisable across the Server Action boundary. No streaming.
**Error behaviour**: Returns empty array if auth fails gracefully; component shows error toast on empty result when export was expected.

---

## New Query Functions

### `getTransactionTotals`

**File**: `lib/queries/transactions.ts`
**Purpose**: Computes aggregate income and expense totals for the current filter. Called server-side only.

```ts
export async function getTransactionTotals(params: {
  type?: TransactionType;
  search?: string;
}): Promise<TransactionTotals>
// TransactionTotals = { count: number; totalIncome: number; totalExpenses: number }
```

**Auth**: Calls `getAuthenticatedUser()`. Results scoped to `userId`.
**Implementation**: Single Drizzle query with conditional aggregate expressions. No raw SQL.
**Returns**: `totalIncome` and `totalExpenses` as positive `number` values. Caller formats for display.
