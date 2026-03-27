# Component Props Contracts: Transactions Page Redesign

**Phase**: 1 | **Date**: 2026-03-26

---

## New Components

### `TransactionSearch` (`components/transaction-search.tsx`)

Client component. Renders a debounced search input that updates `?query=` URL param.

```ts
// No props — reads from useSearchParams internally.
// Exports a single default export:
export function TransactionSearch(): JSX.Element
```

**Behaviour**:
- Reads initial value from `searchParams.get("query")`
- Debounces URL updates at 300ms
- Uses `router.replace` (no history stack pollution)
- Wrapped in `<Suspense>` internally; fallback is a disabled `<Input />`

**Dependencies**: `useSearchParams`, `useRouter` (Next.js), `<Input />` from shadcn/ui

---

### `TransactionList` (`components/transaction-list.tsx`)

Client component. Manages accumulated rows, undo-delete, and load-more.

```ts
type TransactionListProps = {
  initialTransactions: TransactionWithCategory[];
  initialHasMore: boolean;
  filter: FilterState;  // { type?: TransactionType; search?: string }
  totals: TransactionTotals;
};

export function TransactionList(props: TransactionListProps): JSX.Element
```

**Internal state**:
- `rows: TransactionWithCategory[]` — accumulated across load-more calls; reset when `filter` prop changes (controlled by server re-render)
- `hasMore: boolean` — drives "Load more" button visibility
- `isPending: boolean` — from `useTransition`; drives button disabled + "Loading…" label

**Responsibilities**:
- Renders `TransactionSummary` with live totals (passed as prop, reflects full filtered set)
- Groups `rows` by date → renders `DateGroup` section headers
- Renders `TransactionItem` for each row, passing `onDelete` handler
- Renders "Load more" button when `hasMore`
- Handles optimistic delete + undo toast via `sonner`

**Note**: `totals` always reflects the full server-computed filtered set, not just the loaded rows.

---

### `TransactionSummary` (`components/transaction-summary.tsx`)

Lightweight display component (can be server or client — no interactivity).

```ts
type TransactionSummaryProps = {
  totals: TransactionTotals;  // { count, totalIncome, totalExpenses }
};

export function TransactionSummary(props: TransactionSummaryProps): JSX.Element
```

**Renders**: `"14 transactions · +$2,400 · −$870"` using `formatCurrency` from `lib/finance-utils.ts`.
**Visibility**: Always rendered when `totals.count > 0`. Parent (`TransactionList`) conditionally renders it.

---

## Modified Components

### `TransactionItem` (`components/transaction-item.tsx`)

**Removed**: Inline `<Button variant="outline">Edit</Button>` and `<Button variant="ghost">Delete</Button>` with their associated state.

**Added**: `DropdownMenu` trigger (`"..."` icon button) that reveals Edit and Delete menu items.

**Changed props**:
```ts
// Before: handled delete internally
// After: delete handling lifted to parent

type TransactionItemProps = {
  transaction: TransactionWithCategory;
  onDelete: (transaction: TransactionWithCategory) => void;  // NEW — lifted up
  // onEdit remains internal (calls openEdit from useTransactionSheet)
};
```

**Why lifted**: `TransactionList` owns the optimistic rows array and must handle the undo logic before calling the Server Action. `TransactionItem` signals intent; `TransactionList` decides when to actually delete.

**Trigger button**: `<Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">` with `<MoreHorizontal />` icon from lucide-react.

---

## Modified Pages

### `TransactionsPage` (`app/(app)/transactions/page.tsx`)

**Before**: Fetched transactions, rendered them directly as `<TransactionItem />` list.

**After**: Fetches initial batch + totals server-side, passes to `<TransactionList />`.

```ts
// Server component data flow:
const PAGE_SIZE = 50;
const [transactions, totals] = await Promise.all([
  getTransactions({ limit: PAGE_SIZE + 1, offset: 0, type: typeParam, search: searchQuery, orderBy: "date_desc" }),
  getTransactionTotals({ type: typeParam, search: searchQuery }),
]);
const hasMore = transactions.length > PAGE_SIZE;

// Renders:
// <TransactionSearch /> — client, replaces <Input />
// Filter buttons — updated hrefs to preserve ?query= param
// <TransactionList
//   initialTransactions={transactions.slice(0, PAGE_SIZE)}
//   initialHasMore={hasMore}
//   filter={{ type: typeParam, search: searchQuery }}
//   totals={totals}
// />
```

**Empty state logic** (server-rendered, outside `TransactionList`):
- `transactions.length === 0 && !typeParam && !searchQuery` → first-time user message
- `transactions.length === 0 && (typeParam || searchQuery)` → no-results message with current filter context
