# Research: Budgets Page Redesign

## Existing Pattern Audit

All design and interaction decisions for this feature are resolved by direct reference to
existing implementations. No external research or new library evaluation is needed.

---

### Decision 1: Card accent border pattern

**Decision**: Apply `borderLeftWidth: "3px"` and `borderLeftColor: getBucketColor(bucket)` as inline styles on the budget card wrapper `<div>`.

**Rationale**: Exact pattern already used in `categories-page.tsx` for category list items. Keeps the visual language consistent.

**Source**: `web/components/categories-page.tsx` → category list item div.

---

### Decision 2: Emoji icon circle tint formula

**Decision**: `backgroundColor: getBucketColor(bucket) + "26"` (15% opacity via hex `26`).

**Rationale**: Same formula used in `categories-page.tsx` (`accentColor + "26"`) and `transaction-sheet.tsx`.

**Icon fallback**: When `budget.category.icon` is null/undefined, render `"•"` (same fallback as categories-page).

**Source**: `web/components/categories-page.tsx` → icon circle div.

---

### Decision 3: Progress bar coloring

**Decision**:
- **Per-card progress bar**: track background = `getBucketColor(bucket) + "22"` (via `style` prop on root); indicator color = `getBucketColor(bucket)` (via `indicatorStyle` prop).
- **Overall summary progress bar**: track background = default (`bg-secondary` from `Progress` component); indicator color = `var(--destructive)` when overspent, `var(--primary)` otherwise (via `indicatorClassName`).

**Rationale**: The `Progress` component in `web/components/ui/progress.tsx` already accepts `indicatorStyle` and `indicatorClassName` props. Per-card bars use bucket color for full visual identity. The overall bar uses a neutral primary/destructive dichotomy since it aggregates across all buckets.

**Source**: `web/components/ui/progress.tsx` — `indicatorStyle` and `indicatorClassName` props confirmed present.

---

### Decision 4: Action menu pattern (DropdownMenu vs separate buttons)

**Decision**: Replace the current separate Edit + Trash buttons with a single `MoreHorizontal` `DropdownMenu` trigger containing "Edit" and "Delete" items — identical to the categories-page pattern. When delete is triggered, the dropdown is replaced inline with the two-step confirm UI.

**Rationale**: Reduces visual noise on cards. Consistent with categories-page.

**Source**: `web/components/categories-page.tsx` → DropdownMenu with MoreHorizontal trigger.

---

### Decision 5: Inline delete focus management

**Decision**: Mirror the exact `useRef` + `useEffect` pattern from `categories-page.tsx`:
- `confirmButtonRefs`: `Record<string, HTMLButtonElement | null>` — focus the confirm button when entering confirm state.
- `deleteButtonRefs`: `Record<string, HTMLButtonElement | null>` — restore focus to the trigger button when cancelling.
- `prevConfirmingIdRef`: tracks the previous confirming ID to restore focus correctly.

**Rationale**: Already established and constitution-compliant (WCAG 2.1 AA focus management).

**Source**: `web/components/categories-page.tsx` → useEffect on `confirmingDeleteId`.

---

### Decision 6: Sheet layout structure

**Decision**: Bottom sheet with:
- `[&>button]:hidden` on `SheetContent` (hide default close button)
- Flex column layout: sticky header row (title + manual X button) → `flex-1 overflow-y-auto` scrollable body → pinned footer with gradient Save button
- Max height: `max-h-[90vh]`
- Gradient CTA: `linear-gradient(to right, #c97a5a, #a36248)` (wants bucket warm gradient — same as categories-page Save button)

**Rationale**: Exact pattern from `categories-page.tsx` sheet. The "Start date" field replaces the emoji picker as the bottom-most form field.

**Source**: `web/components/categories-page.tsx` → SheetContent structure.

---

### Decision 7: Per-bucket empty state

**Decision**:
```tsx
<div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
  <div className="text-4xl">💸</div>
  <p className="font-semibold text-foreground">No {group.label} budgets yet</p>
  <p className="text-sm text-muted-foreground">
    Add a budget to track your {group.label.toLowerCase()} spending.
  </p>
  <Button onClick={openCreate} variant="outline" className="min-h-[44px]">
    <Plus className="h-4 w-4 mr-2" />
    Add budget
  </Button>
</div>
```

**Rationale**: Matches empty state pattern from categories-page. The `openCreate` function is already defined — no new state needed.

---

### Decision 8: Month navigation data refresh

**Decision**: Month navigation remains client-side state only (`useState`). The `budgets` prop is passed from the server component and reflects the initial month. Month changes trigger a `router.refresh()` call (or the data is re-fetched via a client-side call to `getBudgetsWithSpending`).

**Rationale**: The current implementation uses `useState(initialMonth)` but does NOT refetch when month changes — the displayed data never actually updates on month change in the current code. The redesign should maintain this behavior (client-side month label change only) and leave data-fetching behavior unchanged to avoid scope creep. This is an existing limitation, not introduced by this redesign.

**Note**: Fixing the month-navigation data refresh is explicitly out of scope for this redesign task.

---

### Decision 9: `calculatePercentage` utility

**Decision**: Use the existing `calculatePercentage(value, total)` utility from `lib/finance-utils.ts` instead of inline division. It already handles the `total === 0` guard.

**Source**: `web/lib/finance-utils.ts` — `export function calculatePercentage(value, total)`.

---

### Decision 10: Skeleton structure

**Decision**: Update `BudgetsSkeleton` to match new layout:
```tsx
<div className="space-y-6">
  {/* PageHeader area */}
  <div className="flex items-center justify-between pb-4">
    <div className="space-y-1.5">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-56" />
    </div>
    <Skeleton className="h-11 w-28 rounded-md" />
  </div>
  {/* Month + summary card */}
  <Skeleton className="h-36 w-full rounded-xl" />
  {/* Three bucket sections */}
  {[0, 1, 2].map((i) => (
    <div key={i} className="space-y-3">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  ))}
</div>
```

**Source**: `web/components/skeletons/categories-skeleton.tsx` — reference for skeleton structure depth and proportions.
