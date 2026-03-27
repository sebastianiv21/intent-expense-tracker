# Research: Transactions Page Redesign

**Phase**: 0 | **Date**: 2026-03-26 | **Branch**: `004-transactions-page-redesign`

## Decision 1 — Debounced Search with URL Params

**Decision**: Client component `TransactionSearch` uses `useSearchParams` + `useRouter.replace` with a 300ms `setTimeout` debounce managed via `useRef`. Wrapped in `<Suspense>` as required by Next.js App Router.

**Rationale**: `router.replace` (not `push`) avoids polluting browser history on every keystroke. `defaultValue` (uncontrolled) is used rather than `value` (controlled) so the input does not lag — the URL update is intentionally deferred by 300ms. `useRef` for the timer avoids re-renders. The `Suspense` boundary is mandatory because `useSearchParams` reads from the RSC context; the fallback renders a disabled input so layout does not shift.

**Alternatives considered**:
- `useDebounce` hook library (e.g., `use-debounce`) — rejected; a single `setTimeout`/`clearTimeout` in `useRef` is sufficient and adds zero dependencies.
- Controlled input with `value` state — rejected; causes visible input lag during the 300ms window before the URL update.

**Key pattern**:
```tsx
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
function handleChange(e) {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString());
    e.target.value.trim() ? params.set("query", e.target.value.trim()) : params.delete("query");
    router.replace(`/transactions?${params.toString()}`);
  }, 300);
}
```

---

## Decision 2 — "Load More" with Server Actions

**Decision**: `TransactionList` (Client Component) holds an accumulated `rows` array in `useState`. A `loadMoreTransactions` Server Action (added to `lib/actions/transactions.ts`) wraps the existing `getTransactions` query, fetching `limit + 1` rows and slicing to detect `hasMore`. `useTransition` drives the loading state to keep the UI non-blocking.

**Rationale**: The `getTransactions` query in `lib/queries/transactions.ts` already accepts `limit` and `offset` — no schema changes needed. `useTransition`'s `isPending` state replaces the need for a separate `useState<boolean>` for loading, and keeps interactions responsive during the async fetch. Fetching `limit + 1` rows is the idiomatic "has more pages" sentinel — avoids a separate `COUNT(*)` query.

**Alternatives considered**:
- Infinite scroll (IntersectionObserver) — rejected in clarification Q5 in favour of explicit "Load more" button for user control.
- URL-based pagination (`?page=2`) — rejected; navigating to a new URL would clear already-loaded rows and require scroll restoration logic.
- Converting the page to a full Client Component — rejected; loses SSR for initial render and contradicts the constitution's "Server Components for reads" principle.

**Key pattern**:
```ts
// lib/actions/transactions.ts
export async function loadMoreTransactions(params) {
  const rows = await getTransactions({ ...params, limit: params.limit + 1 });
  return { transactions: rows.slice(0, params.limit), hasMore: rows.length > params.limit };
}
```

---

## Decision 3 — Undo-Delete Toast

**Decision**: Add `sonner` (`pnpm add sonner`). `TransactionList` optimistically removes the item from its `rows` state immediately on delete. A `toast()` call shows the item name with an "Undo" action button for 5 seconds. Both `onAutoClose` and `onDismiss` callbacks commit the delete via the existing `deleteTransaction` Server Action. An `undone` closure flag prevents double-commit if Undo is clicked.

**Rationale**: `sonner` is the official shadcn/ui toast recommendation, is ~4KB gzipped, and integrates cleanly with the Radix/Tailwind stack. `<Toaster position="bottom-center" />` placed in the root layout (`app/layout.tsx`) ensures availability across the app. The `undone` closure variable (not React state) captures the intent without triggering re-renders inside the callback.

**Alternatives considered**:
- `@radix-ui/react-toast` — not installed; adds similar bundle weight without the built-in `action` + `onAutoClose` API that sonner provides.
- Custom toast built from `shadcn Sheet` or `Dialog` — more code, no benefit.
- Inline confirm step (Option A from clarification) — rejected in Q2 as adding visual noise.
- Modal dialog (Option B from clarification) — rejected in Q2 as interrupting flow.

**`<Toaster />` placement**: `web/app/layout.tsx` (root layout, inside `<body>`) so it is available on all authenticated and unauthenticated routes.

---

## Decision 4 — CSV Export (No Route Handler)

**Decision**: A new `exportTransactions` Server Action in `lib/actions/transactions.ts` fetches all matching transactions (no `limit`) and returns a serialisable array. A client component button calls this action, builds a CSV string in memory, creates a `Blob`, and triggers download via a programmatic `<a>` click.

**Rationale**: A route handler at `/api/export` would violate the constitution ("the only API route is `/api/auth/*`"). A Server Action returning raw data to the client is the cleanest alternative — the CSV assembly is trivial JavaScript and adds no bundle weight.

**CSV format** (per clarification Q4):
- Columns: `date,description,category,type,amount`
- `date`: ISO 8601 (`YYYY-MM-DD`)
- `amount`: signed decimal, no currency symbol (e.g., `-12.50` for expenses, `12.50` for income)
- First row: header row

**Alternatives considered**:
- `papaparse` or similar CSV library — rejected; CSV generation for 5 columns requires no library.
- Streaming `ReadableStream` response — not possible from a Server Action (cannot return a `Response` object); would require a route handler (prohibited by constitution).

---

## Decision 5 — Date Grouping

**Decision**: Pure render-time grouping in the `TransactionList` client component. Transactions are already returned in descending date order by `getTransactions`. Group by the `date` string field using `reduce`. Use `date-fns` `isToday`, `isYesterday`, and `format` (already installed) for section header labels.

**Rationale**: No server-side change needed — grouping is a presentation concern. `date-fns` is already a project dependency; no new library required.

**Label format**:
- Today → `"Today"`
- Yesterday → `"Yesterday"`
- All other dates → `format(date, "MMM d")` → e.g., `"Mar 24"`

---

## Decision 6 — Summary Bar

**Decision**: Compute totals server-side in `TransactionsPage` using a new `getTransactionTotals` query helper in `lib/queries/transactions.ts`. Pass `{ count, totalIncome, totalExpenses }` as props to a `TransactionSummary` server component rendered above the list. Always displayed when at least one transaction is visible (per clarification Q3).

**Rationale**: Computing totals on the server avoids sending all transaction data to the client just for arithmetic. The totals reflect the current filter state (same `type` + `search` params). Since the summary is always visible, it can be a simple server component with no client-side state.

**Alternatives considered**:
- Computing totals client-side in `TransactionList` from the accumulated rows — rejected; only reflects loaded rows, not the full filtered dataset (mismatches after "Load more" unless a separate fetch is done anyway).
