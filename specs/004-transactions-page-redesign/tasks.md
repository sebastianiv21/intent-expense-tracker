# Tasks: Transactions Page Redesign

**Input**: Design documents from `/specs/004-transactions-page-redesign/`
**Branch**: `004-transactions-page-redesign`
**Stack**: Next.js 16 App Router, TypeScript 5, React 19, Tailwind CSS 4, shadcn/ui, Drizzle ORM, sonner

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the one new dependency and add new shared types.

- [ ] T001 Add `sonner` dependency with `pnpm add sonner` in `web/`, then import `<Toaster position="bottom-center" richColors />` from `sonner` and render it inside `<body>` in `web/app/layout.tsx`
- [ ] T002 [P] Add `TransactionBatch`, `TransactionTotals`, and `FilterState` types to `web/types/index.ts`: `TransactionBatch = { transactions: TransactionWithCategory[]; hasMore: boolean }`, `TransactionTotals = { count: number; totalIncome: number; totalExpenses: number }`, `FilterState = { type?: TransactionType; search?: string }`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New data-layer functions, new Server Actions, and the structural page refactor that ALL user stories depend on.

**⚠️ CRITICAL**: No user story phase can be independently tested until this phase is complete.

- [ ] T003 [P] Add `getTransactionTotals(params: { type?: TransactionType; search?: string }): Promise<TransactionTotals>` to `web/lib/queries/transactions.ts` — single Drizzle query using conditional aggregate expressions (`sql` with `CASE WHEN type = 'income' THEN amount ELSE 0 END`) scoped by `userId` via `getAuthenticatedUser()`
- [ ] T004 Add `loadMoreTransactions(params: { limit: number; offset: number; type?: TransactionType; search?: string }): Promise<TransactionBatch>` as a `"use server"` export to `web/lib/actions/transactions.ts` — calls `getTransactions({ ...params, limit: params.limit + 1 })`, slices to `params.limit`, sets `hasMore = rows.length > params.limit`
- [ ] T005 Add `exportTransactions(params: FilterState): Promise<TransactionWithCategory[]>` as a `"use server"` export to `web/lib/actions/transactions.ts` (same file as T004) — calls `getTransactions({ ...params, limit: 10_000, orderBy: "date_desc" })` after `getAuthenticatedUser()`
- [ ] T006 Create `web/components/transaction-list.tsx` as a minimal `"use client"` component accepting `{ initialTransactions: TransactionWithCategory[]; initialHasMore: boolean; filter: FilterState; totals: TransactionTotals }` props — for now render a flat `<div className="space-y-4">` mapping `initialTransactions` to `<TransactionItem key={t.id} transaction={t} onDelete={() => {}} />` (stub `onDelete`); manage `rows` and `hasMore` in `useState` initialized from props
- [ ] T007 Refactor `web/app/(app)/transactions/page.tsx`: replace single `getTransactions` call with `const [transactions, totals] = await Promise.all([getTransactions({ limit: 51, offset: 0, type: typeParam, search: searchQuery, orderBy: "date_desc" }), getTransactionTotals({ type: typeParam, search: searchQuery })])`, compute `const hasMore = transactions.length > 50`, pass `transactions.slice(0, 50)` + `hasMore` + `filter` + `totals` to `<TransactionList />`, replace `<Input>` with a placeholder `<div>` (search component added in US1), keep filter buttons unchanged for now

**Checkpoint**: `pnpm build` must pass. The page renders transactions via `TransactionList` with no visible regressions.

---

## Phase 3: User Story 1 — Search and Filter Transactions (Priority: P1) 🎯 MVP

**Goal**: Search input updates the transaction list automatically after a 300ms debounce. Switching type filters preserves the active search query in the URL.

**Independent Test**: Type "coffee" in the search box, wait ~300ms, confirm only matching transactions appear without page reload. Click "Expense" — "coffee" stays in the input and URL.

- [ ] T008 [US1] Create `web/components/transaction-search.tsx` as a `"use client"` component — use `useRef<ReturnType<typeof setTimeout> | null>(null)` for the debounce timer; on `onChange`, clear the timer and set a new 300ms timeout that calls `router.replace(\`/transactions?${params.toString()}\`)` using `new URLSearchParams(searchParams.toString())` to preserve existing params; wrap the inner component in `<Suspense fallback={<Input placeholder="Search transactions" disabled className="bg-background" />}>` because `useSearchParams()` requires it in Next.js App Router; initialize input with `defaultValue={searchParams.get("query") ?? ""}`
- [ ] T009 [US1] Update `web/app/(app)/transactions/page.tsx`: replace the placeholder `<div>` from T007 with `<TransactionSearch />`; update each filter button's `href` to include the current `searchQuery` param (e.g., `href={\`/transactions?type=${filter.value}${searchQuery ? \`&query=${encodeURIComponent(searchQuery)}\` : ""}\`}`) so switching type tabs preserves the search; the "All" tab href becomes `\`/transactions${searchQuery ? \`?query=${encodeURIComponent(searchQuery)}\` : ""}\``

**Checkpoint**: Search and filter work correctly together. `pnpm lint` passes.

---

## Phase 4: User Story 2 — Date-Grouped Transaction List (Priority: P2)

**Goal**: Transactions are visually grouped under lightweight date section headers in descending chronological order. Headers read "Today", "Yesterday", or "Mar DD".

**Independent Test**: With transactions on at least two different dates, confirm section headers appear between groups with correct relative or formatted labels.

- [ ] T010 [US2] Update `web/components/transaction-list.tsx` to group `rows` by date before rendering — add a `groupByDate(rows: TransactionWithCategory[])` helper inside the file that uses `date-fns` `isToday`, `isYesterday`, and `format` with `parseISO` to build an array of `{ label: string; transactions: TransactionWithCategory[] }` groups; render each group as a `<section>` with a `<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2 pt-1">` header followed by the group's `<TransactionItem>` entries; replace the flat map with this grouped render

**Checkpoint**: Scrolling through the list shows date section dividers. `pnpm lint` passes.

---

## Phase 5: User Story 3 — Transaction Totals Summary Bar (Priority: P3)

**Goal**: A summary bar always visible above the list showing the count, total income, and total expenses for the current view (filtered or unfiltered).

**Independent Test**: On the unfiltered "All" view, confirm a summary line appears. Apply "Expense" filter — confirm totals update to reflect only expenses.

- [ ] T011 [P] [US3] Create `web/components/transaction-summary.tsx` — accepts `{ totals: TransactionTotals }` props; renders a single `<div className="flex items-center gap-2 text-sm text-muted-foreground px-1">` with: count label (`{totals.count} transaction{totals.count !== 1 ? "s" : ""}`), income formatted with `formatCurrency` from `@/lib/finance-utils` prefixed `+`, expenses formatted and prefixed `−`, separated by `·`; export as a named export `TransactionSummary`
- [ ] T012 [US3] Update `web/components/transaction-list.tsx` to render `<TransactionSummary totals={props.totals} />` above the grouped list when `props.totals.count > 0`; import `TransactionSummary` from `@/components/transaction-summary`

**Checkpoint**: Summary bar visible on all views with transactions, hidden on empty states. `pnpm lint` passes.

---

## Phase 6: User Story 4 — Transaction Actions via Overflow Menu (Priority: P3)

**Goal**: No inline Edit/Delete buttons on transaction cards. Actions are accessed via a "..." dropdown menu. Delete triggers immediate removal with a 5-second undo toast.

**Independent Test**: Load the list — no buttons visible on cards. Click "..." on one item — Edit and Delete appear. Delete an item — it disappears and a toast shows "Undo". Click Undo — item reappears.

- [ ] T013 [US4] Update `web/components/transaction-item.tsx`: remove the existing `<div className="mt-3 flex items-center gap-2">` block containing Edit/Delete buttons and all associated `isDeleting`/`error` state; add `onDelete?: (transaction: TransactionWithCategory) => void` (optional, no default needed — the DropdownMenu Delete item calls `props.onDelete?.(transaction)`) to `TransactionItemProps`; making it optional preserves backward compatibility with existing usages on the dashboard page that do not pass this prop; add a `<DropdownMenu>` in the top-right of the card header using `DropdownMenuTrigger` wrapping `<Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] -mr-2 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>` and `DropdownMenuContent` with two `DropdownMenuItem` entries: "Edit" (calls `openEdit(transaction)`) and "Delete" (calls `props.onDelete(transaction)` styled with `text-destructive focus:text-destructive`); import `MoreHorizontal` from `lucide-react` and all `DropdownMenu*` from `@/components/ui/dropdown-menu`
- [ ] T014 [US4] Update `web/components/transaction-list.tsx`: import `toast` from `sonner` and `deleteTransaction` from `@/lib/actions/transactions`; add `handleDelete(transaction: TransactionWithCategory)` function that: (1) captures `const originalIndex = rows.findIndex(t => t.id === transaction.id)` **before** any state mutation (so the index is valid while the item still exists in `rows`), (2) calls `setRows(prev => prev.filter(t => t.id !== transaction.id))` to optimistically remove, (3) sets `let undone = false`, (4) calls `toast(\`"\${transaction.description ?? transaction.category?.name ?? "Transaction"}" deleted\`, { duration: 5000, action: { label: "Undo", onClick: () => { undone = true; setRows(prev => { const next = [...prev]; next.splice(originalIndex, 0, transaction); return next; }); } }, onAutoClose: () => { if (!undone) deleteTransaction(transaction.id); }, onDismiss: () => { if (!undone) deleteTransaction(transaction.id); } })`; pass `onDelete={handleDelete}` to each `<TransactionItem />`

**Checkpoint**: Clean list view, overflow menu works, undo-delete works. `pnpm lint` passes.

---

## Phase 7: User Story 5 — Load More Pagination (Priority: P4)

**Goal**: Users with more than 50 transactions can load additional batches without losing their active search or filter.

**Independent Test**: With 51+ transactions, the "Load more" button appears. Clicking it appends transactions and disables the button while loading.

- [ ] T015 [US5] Update `web/components/transaction-list.tsx`: add `const [isPending, startTransition] = useTransition()` and `const [loadError, setLoadError] = useState<string | null>(null)`; add `handleLoadMore` function that calls `startTransition(async () => { setLoadError(null); try { const result = await loadMoreTransactions({ limit: 50, offset: rows.length, type: filter.type, search: filter.search }); setRows(prev => [...prev, ...result.transactions]); setHasMore(result.hasMore); } catch { setLoadError("Failed to load more. Please try again."); } })`; render below the grouped list: when `hasMore` render `<Button variant="outline" className="w-full min-h-[44px]" onClick={handleLoadMore} disabled={isPending}>{isPending ? "Loading…" : "Load more"}</Button>`; when `loadError` is non-null render `<p className="text-sm text-destructive text-center" role="alert">{loadError} <button className="underline" onClick={handleLoadMore}>Retry</button></p>`; import `loadMoreTransactions` from `@/lib/actions/transactions` and `useTransition` from `react`

**Checkpoint**: Load more appends rows and respects active filter. `pnpm lint` passes.

---

## Phase 8: User Story 6 — CSV Export (Priority: P5)

**Goal**: An Export button visible on all viewports downloads a CSV file of all matching transactions (not limited to loaded batch).

**Independent Test**: Click Export — a `.csv` file downloads containing all matching transactions with columns `date,description,category,type,amount` where amounts are signed decimals.

- [ ] T016 [P] [US6] Create `web/components/export-button.tsx` as a `"use client"` component accepting `{ filter: FilterState }` props — add `const [isExporting, setIsExporting] = useState(false)` and `handleExport` async function that wraps its body in `try { ... } finally { setIsExporting(false) }` to guarantee the button re-enables on success or error: (1) sets `setIsExporting(true)`, (2) calls `const rows = await exportTransactions(filter)`, (3) if `rows.length === 0` calls `toast.error("No transactions to export")` and returns early, (4) builds CSV string: header row `"date,description,category,type,amount\n"` + rows mapped to `` `${t.date},"${(t.description ?? t.category?.name ?? "").replace(/"/g, '""')}","${(t.category?.name ?? "Uncategorized").replace(/"/g, '""')}",${t.type},${t.type === "expense" ? "-" : ""}${Math.abs(parseFloat(t.amount)).toFixed(2)}\n` ``, (5) creates `new Blob([csv], { type: "text/csv" })`, (6) creates `URL.createObjectURL(blob)`, (7) programmatically clicks a temporary `<a download="transactions.csv">`, (8) revokes the object URL; on catch calls `toast.error("Export failed. Please try again.")`; renders `<Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="min-h-[44px]">{isExporting ? "Exporting…" : "Export"}</Button>` — note: `min-h-[44px]` on all viewports per constitution §I; import `exportTransactions` from `@/lib/actions/transactions` and `toast` from `sonner`
- [ ] T017 [US6] Update `web/app/(app)/transactions/page.tsx`: remove the existing `<Button variant="outline" size="sm" className="hidden sm:inline-flex">Export</Button>` from `PageHeader`'s `action` prop; replace with `<ExportButton filter={{ type: typeParam, search: searchQuery }} />` imported from `@/components/export-button`

**Checkpoint**: Export downloads CSV on both mobile and desktop. `pnpm lint` passes.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Context-aware empty states and final quality verification.

- [ ] T018 Update empty state logic in `web/app/(app)/transactions/page.tsx` — when `transactions.length === 0`, render two distinct messages: if `!typeParam && !searchQuery` render first-use empty state (`"No transactions yet. Tap the + button to add your first entry."`); otherwise render no-results empty state (`\`No results for${searchQuery ? \` "\${searchQuery}"\` : ""}${typeParam ? \` in \${typeParam}\` : ""}. Try a different search or filter.\``)
- [ ] T019 Run `pnpm lint` in `web/` and fix any ESLint errors introduced by this feature
- [ ] T020 Run `pnpm build` in `web/` and confirm the build completes without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3–8 (User Stories)**: All depend on Phase 2 completion; can then proceed sequentially (P1 → P2 → P3 → P4 → P5) or in priority order
- **Phase 9 (Polish)**: Depends on all desired user story phases being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — can start immediately after Phase 2
- **US2 (P2)**: No dependency on US1 — can start in parallel after Phase 2
- **US3 (P3)**: No dependency on US1/US2 — can start in parallel after Phase 2
- **US4 (P3)**: No dependency on US1/US2/US3 — can start in parallel after Phase 2
- **US5 (P4)**: No dependency on other stories — can start in parallel after Phase 2
- **US6 (P5)**: No dependency on other stories — can start in parallel after Phase 2

> **⚠️ Shared file warning**: US2 (T010), US3 (T012), US4 (T014), and US5 (T015) all modify `web/components/transaction-list.tsx`. Although these user stories are logically independent, they CANNOT be safely worked in parallel by different developers on the same branch — doing so will produce merge conflicts. A single developer should implement them sequentially in priority order. US1 (T008–T009) and US6 (T016–T017) do not touch `transaction-list.tsx` and can be worked in parallel with other stories.

### Within Each Phase

- Tasks marked [P] in the same phase can run in parallel
- T004 and T005 are sequential (same file: `lib/actions/transactions.ts`)
- T003 [P] can run in parallel with T004/T005 (different file: `lib/queries/transactions.ts`)
- T006 and T007 are sequential (T007 imports from T006)

---

## Parallel Opportunities Per User Story

```
Phase 2 — Foundational:
  Parallel group A: T003 (queries), T004→T005 (actions, sequential within group)
  Sequential after T003+T004+T005: T006 → T007

Phase 5 — US3 (Summary Bar):
  Parallel: T011 (create TransactionSummary) and T012 (wire into TransactionList)
  T011 has no deps on T012 (different files); T012 imports T011 so T011 must complete first

Phase 8 — US6 (CSV Export):
  Parallel: T016 (create ExportButton) independent of T017 (wire into page)
  T016 must complete before T017
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) — ~15 min
2. Complete Phase 2 (Foundational) — ~45 min, CRITICAL gate
3. Complete Phase 3 (US1: Search & Filter) — ~30 min
4. **STOP AND VALIDATE**: Search debounces correctly, filter preserves query, URL updates
5. Deploy/demo — core navigation restored

### Incremental Delivery

1. Phase 1 + Phase 2 → structural scaffolding in place
2. Phase 3 (US1) → working search + filter ✅
3. Phase 4 (US2) → date grouping ✅
4. Phase 5 (US3) → totals bar ✅
5. Phase 6 (US4) → overflow menu + undo delete ✅
6. Phase 7 (US5) → load more pagination ✅
7. Phase 8 (US6) → CSV export ✅
8. Phase 9 → polish + build verification ✅

### Full Parallel Strategy (Multiple Developers)

Once Phase 2 is complete:
- Developer A: US1 (T008–T009) → US2 (T010)
- Developer B: US3 (T011–T012) → US4 (T013–T014)
- Developer C: US5 (T015) → US6 (T016–T017)

All three streams merge for Phase 9 (Polish).

---

## Notes

- [P] = task touches a different file from all other concurrent [P] tasks; no blocking dependency
- Each user story phase is independently completable and testable after Phase 2
- No database migrations needed for this feature
- `sonner` toast fires both `onAutoClose` and `onDismiss` — both callbacks needed to reliably commit delete
- The `TransactionList` component grows incrementally across phases (T006 → T010 → T012 → T014 → T015); each phase adds one capability without breaking the previous
- Filter button `href` construction in T009 must use `encodeURIComponent` to handle special characters in the query
