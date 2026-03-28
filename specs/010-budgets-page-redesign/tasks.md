# Tasks: Budgets Page Redesign

**Input**: Design documents from `/specs/010-budgets-page-redesign/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story. All tasks touch `web/components/budgets-page.tsx` (sequential by nature) except the skeleton and verification tasks which are independent.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Update imports and component state shape so all user story phases can build on a clean foundation. MUST complete before any user story work begins.

**⚠️ CRITICAL**: All Phase 2+ tasks depend on this phase being complete.

- [x] T001 Update imports in `web/components/budgets-page.tsx`: add `useRef`, `useEffect`, `MoreHorizontal`, `Check`, `X` from their respective packages; add `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu`; add `PageHeader` from `@/components/page-header`; add `calculatePercentage` to the `@/lib/finance-utils` import; remove `Trash2` and `Card`, `CardContent` imports (no longer used at component level after redesign)
- [x] T002 Replace the existing inline delete state (`error` string) with the three-part inline delete state in `web/components/budgets-page.tsx`: `confirmingDeleteId: string | null`, `deletingId: string | null`, `deleteError: { id: string; message: string } | null`; add `confirmButtonRefs`, `deleteButtonRefs`, `prevConfirmingIdRef` using `useRef`; add the `useEffect` that manages focus on `confirmingDeleteId` change (mirror pattern from `web/components/categories-page.tsx`)
- [x] T003 Replace `handleDelete` with `triggerDelete` + `confirmDelete` functions in `web/components/budgets-page.tsx`, removing the `window.confirm()` call; `triggerDelete` sets `confirmingDeleteId`; `confirmDelete` clears it, sets `deletingId`, calls `deleteBudget`, clears `deletingId`, and on failure sets `deleteError`

**Checkpoint**: Component compiles (TypeScript errors may remain from removed Card/JSX references — that is expected until Phase 2 tasks replace the render output).

---

## Phase 2: User Story 1 + 2 — Monthly budget health overview (Priority: P1) 🎯 MVP

**Goal**: Users see the month name, a full-width overall progress bar, three summary stats, and grouped budget cards with bucket-color left borders, tinted icon circles, per-card progress bars, and a MoreHorizontal action menu.

**Independent Test**: Navigate to `/budgets`. Verify month label, overall progress bar, Budgeted/Spent/Remaining stats, and budget cards grouped by bucket all render correctly. Verify Remaining turns red when negative and a card shows "Over budget" when spent > amount.

- [x] T004 [US1] Replace the inline page header JSX with `<PageHeader title="Budgets" description="Plan spending by category for the month ahead." action={<Button onClick={openCreate} className="min-h-[44px]"><Plus className="h-4 w-4" />New budget</Button>} />` in `web/components/budgets-page.tsx`
- [x] T005 [US1] Redesign the month navigation + summary card in `web/components/budgets-page.tsx`: replace the existing `<Card>` with a plain `<div className="rounded-xl border border-border bg-card p-4 space-y-4">`; keep the chevron nav row (confirm `subMonths`/`addMonths` calls and `aria-label` attributes are intact); add an `overallProgress` derived value using `calculatePercentage(summary.totalSpent, summary.totalBudgeted)`; add a full-width `<Progress>` below the month row with `value={overallProgress}` and `indicatorClassName` set to `"bg-destructive"` when `overallProgress >= 100`, otherwise `"bg-primary"`; keep the three-stat grid below (Budgeted / Spent / Remaining) with Remaining in destructive color when negative
- [x] T006 [US1] Redesign each budget card in the grouped list in `web/components/budgets-page.tsx`: replace `<Card><CardContent>` wrapper with `<div className="rounded-xl border border-border bg-card p-4 space-y-3" style={{ borderLeftWidth: "3px", borderLeftColor: getBucketColor(group.bucket) }}>` ; add an emoji icon circle (`<div style={{ backgroundColor: getBucketColor(group.bucket) + "26" }}>`) showing `budget.category.icon ?? "•"`; update the `<Progress>` to use `indicatorStyle={{ backgroundColor: getBucketColor(group.bucket) }}` and `style={{ backgroundColor: getBucketColor(group.bucket) + "22" }}` for the track; preserve the bucket label row at the card bottom (`<span style={{ color: getBucketColor(group.bucket) }}>{group.label}</span>` on the left, `<span className="text-destructive">Over budget</span>` on the right when overspent)
- [x] T007 [US1] Replace the existing Edit + Trash button pair on each budget card in `web/components/budgets-page.tsx` with a `<DropdownMenu>` containing a `MoreHorizontal` trigger (``aria-label={`Options for ${budget.category.name}`}``, `min-h-[44px] min-w-[44px]`, `ref` callback to `deleteButtonRefs.current[budget.id]`, disabled when `deletingId === budget.id`) and two `<DropdownMenuItem>` entries: "Edit" (calls `openEdit(budget)`) and "Delete" (styled with `className="text-destructive focus:text-destructive"`, calls `triggerDelete(budget)`); leave the inline confirm conditional and error display for T013–T014
**Checkpoint**: Budget cards display with bucket-color accents, icon circles, bucket label rows, updated progress bars, and a MoreHorizontal dropdown. Overall progress bar visible in the summary card. Month chevron navigation confirmed intact (verified as part of T005).

---

## Phase 3: User Story 3 — Bottom sheet redesign (Priority: P1)

**Goal**: The create/edit bottom sheet has a sticky header with title + X close button, a scrollable form body, and a gradient Save/Update button pinned to the footer.

**Independent Test**: Tap "New budget". Verify the sheet has a bold title, X button in the top-right, all form fields are reachable by scrolling, and the gradient Save button is always visible at the bottom. Tap X — sheet closes with no save. Fill all fields and tap Save — sheet closes and budget appears.

- [x] T009 [US3] Restructure the `<SheetContent>` in `web/components/budgets-page.tsx` to: add `className="max-h-[90vh] rounded-t-3xl border border-border bg-card p-0 [&>button]:hidden"`; wrap internals in `<div className="flex max-h-[90vh] flex-col">`
- [x] T010 [US3] Replace `<SheetHeader>` content in `web/components/budgets-page.tsx` with a sticky header row: `className="px-6 pt-6 pb-4 border-b border-border"` containing a flex row with `<SheetTitle className="text-2xl font-bold">` on the left and a manual close `<button>` (`aria-label="Close"`, `onClick={() => setSheetOpen(false)}`, `className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-border text-muted-foreground transition-colors hover:text-foreground"`) with `<X className="h-5 w-5" />` on the right; move `<SheetDescription className="sr-only">` inside the header
- [x] T011 [US3] Wrap all form fields in `web/components/budgets-page.tsx` in `<div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">` (replaces current `space-y-4 mt-4` wrapper); ensure Category select, Amount input, Period toggle buttons, and Start date input are all inside this scrollable container
- [x] T012 [US3] Replace the Cancel + Save button row at the bottom of the sheet in `web/components/budgets-page.tsx` with a pinned footer `<div className="border-t border-border bg-card px-6 pb-8 pt-4">`; render a single full-width `<Button>` with `style={{ background: "linear-gradient(to right, #c97a5a, #a36248)" }}` and `className="w-full rounded-3xl py-6 text-lg font-bold text-white shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"` showing "Saving…" / "Update" / "Save" based on state; remove the separate Cancel button (X close button in header serves that purpose)

**Checkpoint**: Sheet opens with sticky header and X button. All fields are reachable. Gradient button is always pinned to the bottom. Closing via X works.

---

## Phase 4: User Story 4 — Inline delete confirmation (Priority: P2)

**Goal**: Deleting a budget shows an inline "Delete?" prompt with confirm/cancel buttons — no browser dialog.

**Independent Test**: Open the MoreHorizontal menu on any budget card and tap "Delete". Verify the dropdown is replaced inline with "Delete?" text, a red confirm button, and a cancel X button. Confirm → budget removed. Cancel → card returns to normal.

- [x] T013 [US4] Add the inline confirm render branch to each budget card in `web/components/budgets-page.tsx`: wrap the card's action area in a conditional — when `confirmingDeleteId === budget.id`, replace the `<DropdownMenu>` with `<span className="text-sm text-muted-foreground">Delete?</span>` + a destructive `<Button size="sm" className="min-h-[44px]" aria-label="Confirm delete" ref={(el) => { confirmButtonRefs.current[budget.id] = el; }} onClick={() => confirmDelete(budget)}>` containing `<Check className="h-4 w-4" />` + an outline cancel `<Button size="sm" className="min-h-[44px]" aria-label="Cancel delete" onClick={() => setConfirmingDeleteId(null)}>` containing `<X className="h-4 w-4" />`; otherwise render the `<DropdownMenu>` from T007
- [x] T014 [US4] Add inline deletion error display and deletion-in-progress guard in `web/components/budgets-page.tsx`: below each budget card's content div, render `{deleteError?.id === budget.id && (<p className="text-xs text-destructive mt-2" role="alert">{deleteError.message}</p>)}`; ensure the `<DropdownMenu>` trigger from T007 is `disabled` when `deletingId === budget.id`

**Checkpoint**: No `window.confirm` calls remain. Inline confirm UI appears and disappears correctly. Deletion errors surface inline.

---

## Phase 5: User Story 5 — Per-bucket empty states (Priority: P3)

**Goal**: When a bucket has no budgets, a rich empty state with emoji, heading, description, and an "Add budget" button is shown instead of a plain dashed border.

**Independent Test**: Delete all budgets from one bucket (or test with an account that has an empty bucket). Verify the bucket section shows a centered card with emoji, heading, and an Add button that opens the creation sheet.

- [x] T015 [US5] Replace the dashed-border empty state paragraph in `web/components/budgets-page.tsx` with a rich empty state: `<div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">` containing `<div className="text-4xl">💸</div>`, `<p className="font-semibold text-foreground">No {group.label} budgets yet</p>`, `<p className="text-sm text-muted-foreground">Add a budget to track your {group.label.toLowerCase()} spending.</p>`, and `<Button onClick={openCreate} variant="outline" className="min-h-[44px]"><Plus className="h-4 w-4 mr-2" />Add budget</Button>`

**Checkpoint**: Empty bucket sections render rich empty states with working Add button.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Update the loading skeleton to match the new layout, then verify the full redesign passes lint and build.

- [x] T016 [P] Update `web/components/skeletons/budgets-skeleton.tsx` to reflect the new page layout: header row skeleton (title + action button placeholder), month+summary card skeleton (`h-36 w-full rounded-xl`), and three bucket sections each with a section label skeleton and two card skeletons (`h-28 w-full rounded-xl`) — mirror structure from `web/components/skeletons/categories-skeleton.tsx`
- [x] T017 Run `pnpm lint` from `web/` and fix any reported errors in `web/components/budgets-page.tsx` and `web/components/skeletons/budgets-skeleton.tsx`; manually verify layout at 320px, 768px, and 1280px viewport widths using browser devtools to confirm no regressions (SC-005)
- [x] T018 Run `pnpm build` from `web/` and fix any TypeScript or build errors in the modified files

**Checkpoint**: `pnpm lint` and `pnpm build` both exit with code 0. Redesign is complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (US1+US2)**: Depends on Phase 1 — BLOCKS completion of US1 goal (US2 navigation verified inline as part of T005)
- **Phase 3 (US3)**: Depends on Phase 1 — can start after T003 in Phase 1; independent of Phase 2
- **Phase 4 (US4)**: Depends on Phase 1 (T002, T003 must be complete) and Phase 2 (T007 introduces the DropdownMenu that triggers delete)
- **Phase 5 (US5)**: Depends only on Phase 2 (T006 introduces the card structure empty state replaces)
- **Phase 6 (Polish)**: T016 is independent; T017/T018 depend on all implementation phases being complete

### User Story Dependencies

- **US1+US2 (Phase 2)**: Depends on Phase 1 only — US2 verification folded into T005
- **US3 (Phase 3)**: Depends on Phase 1 only — can run in parallel with Phase 2
- **US4 (Phase 4)**: Depends on Phase 1 + Phase 2 (needs DropdownMenu from T007 before T013 adds the confirm branch)
- **US5 (Phase 5)**: Depends on Phase 1 + Phase 2 (needs grouped card structure from T006)

### Parallel Opportunities

- **Phase 2 + Phase 3** can proceed in parallel after Phase 1 is committed — requires separate git branches targeting different JSX sections of the same file, with a merge step before Phase 4. This is team/branch-level parallelism only; simultaneous edits to the same file in one session are not possible.
- **T016** (skeleton update — separate file) can proceed in parallel with any implementation phase
- **T017** and **T018** must run sequentially after all implementation is complete

---

## Parallel Example: Phase 2 + Phase 3

> **Note**: Parallelism here means separate git branches — both target `budgets-page.tsx` and require a merge before Phase 4 can begin.

```text
# After Phase 1 is committed:

Branch A: Implement T004–T007 (month card + budget cards + dropdown)
Branch B: Implement T009–T012 (sheet redesign)

# Merge both branches → resolve any conflicts → continue with Phase 4 → Phase 5 → Phase 6
```

---

## Implementation Strategy

### MVP First (US1 + US2 only — Phase 1 + Phase 2)

1. Complete Phase 1 (Foundational imports + state)
2. Complete Phase 2 (Month card + budget cards visual overhaul)
3. **STOP and VALIDATE**: Navigate to `/budgets`, confirm bucket-colored cards, overall progress bar, and MoreHorizontal dropdown render correctly
4. Continue to Phase 3–6 for full spec compliance

### Full Delivery Order

1. Phase 1 → Phase 2 + Phase 3 (parallel) → Phase 4 → Phase 5 → Phase 6
2. Each phase delivers an independently verifiable improvement
3. Commit after each phase using `feat:` conventional commit format

---

## Notes

- All tasks touch `web/components/budgets-page.tsx` (sequential) except T016 (skeleton, independent)
- No schema migrations, server actions, or query changes required
- `window.confirm` must be completely absent after T013–T014
- Verify `min-h-[44px]` on all interactive elements (constitution I gate)
- Verify `aria-label` on DropdownMenu trigger and confirm/cancel buttons (constitution IV gate)
