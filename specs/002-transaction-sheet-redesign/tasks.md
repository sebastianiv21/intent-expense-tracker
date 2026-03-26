# Tasks: Redesign Transaction Entry Sheet UI

**Input**: Design documents from `/specs/002-transaction-sheet-redesign/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested — no test tasks included.

**Scope**: All changes are confined to a single file: `web/components/transaction-sheet.tsx`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (independent of adjacent tasks in the same phase)
- **[Story]**: Maps to user story (US1, US2, US3)
- All paths relative to the repository root

---

## Phase 1: Setup

**Purpose**: Verify the existing sheet works before any modifications begin.

- [x] T001 Confirm dev environment — run `pnpm dev` in `web/` and open the transaction sheet via the "+" FAB to verify the current two-step flow renders without errors (smoke test baseline before redesign)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Restructure component state and filtering logic that all three user stories depend on.

**⚠️ CRITICAL**: Phases 3–5 cannot begin until T002 and T003 are complete.

- [x] T002 Add `selectedBucket: AllocationBucket` state (default `"needs"`) to `web/components/transaction-sheet.tsx`; update `syncStateFromProps` to derive `selectedBucket` from `transaction.category.allocationBucket` in edit mode and auto-set `categoryId` to the first matching category in the active bucket on open

- [x] T003 Update `filteredCategories` useMemo in `web/components/transaction-sheet.tsx` to filter expense categories by `cat.type === "expense" && cat.allocationBucket === selectedBucket`, and income categories by `cat.type === "income"` only (replacing the current `cat.type === type` filter)

**Checkpoint**: State shape is correct — `filteredCategories` now updates when `selectedBucket` or `type` changes; pre-selection works in both create and edit modes.

---

## Phase 3: User Story 1 - Add Expense with Amount, Intent, and Category (Priority: P1) 🎯 MVP

**Goal**: Deliver the full single-step expense entry layout — large amount input, intent bucket selector, and inline horizontal-scroll category pills — eliminating the two-step flow.

**Independent Test**: Open the sheet, verify all five input areas are visible without scrolling, select a bucket, watch the category list update, tap a pill, enter an amount, and tap "Add" to confirm a transaction is saved.

- [x] T004 [US1] Redesign the amount input section in `web/components/transaction-sheet.tsx` — apply `text-4xl font-bold text-center` to the `<Input>`, keep the absolutely-positioned `$` prefix `<span>`, and use `inputMode="decimal"` for mobile keyboard; render a helper text element below the input (e.g., `<p className="text-xs text-muted-foreground text-center">Enter an amount to continue</p>`) when `amount` is empty or zero to provide visible feedback (FR-008, SC-003)

- [x] T005 [P] [US1] Add the intent bucket selector section in `web/components/transaction-sheet.tsx` — render three `<button>` elements for Needs/Wants/Future using `Home`, `Coffee`, `PiggyBank` icons from `lucide-react` (icon above, text label below); each button MUST have `min-h-[44px] min-w-[44px]` to satisfy the 44px touch target requirement (Constitution §I); apply active state styling (border highlight using `--accent`) on the selected bucket; clicking a button sets `selectedBucket` and resets `categoryId` to the first category in the new bucket; add `aria-pressed={bucket === selectedBucket}` and `aria-label` to each button

- [x] T006 [P] [US1] Replace the "Choose category" `<Button>` trigger with an inline horizontal-scroll pill row in `web/components/transaction-sheet.tsx` — use `<div className="flex overflow-x-auto gap-2 pb-1 [&::-webkit-scrollbar]:hidden">` containing one `<button>` per category showing `cat.icon` and `cat.name`; each pill MUST have `min-h-[44px]` to satisfy the 44px touch target requirement (Constitution §I); apply active state styling when `cat.id === categoryId`; clicking a pill sets `categoryId`; add `aria-pressed` and `aria-label="Select {cat.name}"` to each pill; add a `<Label>` element reading "CATEGORY" above the pill row; when `filteredCategories.length === 0`, render a placeholder message (e.g., "No categories for this bucket") instead of an empty row

- [x] T007 [US1] Remove the two-step flow from `web/components/transaction-sheet.tsx` — delete the `step` state, remove the `step === "category"` JSX branch entirely (search input, vertical scrollable category list, "Done" button), and remove the `setCategorySearch` / `categorySearch` state; consolidate everything into the single-step layout

- [x] T008 [US1] Replace the dual "Cancel"/"Save" footer in `web/components/transaction-sheet.tsx` with a single full-width "Add" button; use text-only loading state ("Saving…") — do NOT use a spinner or `Loader` icon (Constitution §I); the button MUST be disabled when `amount` is empty/zero OR when `filteredCategories.length === 0` (empty bucket edge case); the Radix `SheetContent` X button already handles dismissal so no separate Cancel is needed

**Checkpoint**: User Story 1 is fully functional — single-step expense entry with bucket picker and category pills works end-to-end.

---

## Phase 4: User Story 2 - Switch Between Expense and Income (Priority: P2)

**Goal**: When the user switches to "Income", the intent bucket selector is hidden and the category list shows all income categories instead.

**Independent Test**: Open the sheet, tap "Income", verify the bucket selector disappears and the pill row shows income-type categories. Submit and confirm a transaction is saved with `type = "income"`. Tap "Expense" and confirm the bucket selector reappears.

- [x] T009 [US2] In `web/components/transaction-sheet.tsx`, conditionally render the intent bucket selector only when `type === "expense"` (wrap in `{type === "expense" && (...)}` or apply `hidden`); when the type toggle switches back to `"expense"`, reset `selectedBucket` to `"needs"` and `categoryId` to the first Needs category; when switching to `"income"`, reset `categoryId` to the first income category

**Checkpoint**: User Stories 1 and 2 both work independently — switching between expense and income modes behaves correctly with no bucket row shown for income.

---

## Phase 5: User Story 3 - Optional Notes Field (Priority: P3)

**Goal**: The notes field label and placeholder match the design reference.

**Independent Test**: Open the sheet, verify the label reads "Notes" and the placeholder reads "Add a note about this transaction...". Enter a note, submit, and confirm it is saved with the transaction.

- [x] T010 [US3] In `web/components/transaction-sheet.tsx`, rename the `<Label>` from "Description" to "Notes"; replace the single-line `<Input>` with a plain HTML `<textarea>` styled with `cn("w-full rounded-md border border-input bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none", ...)` (no new shadcn component required); set `rows={3}` and placeholder to `"Add a note about this transaction..."`; update the `description` state setter to use `event.target.value`

**Checkpoint**: All three user stories are fully functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility compliance, linting, build verification, and manual QA.

- [x] T011 [P] Audit `web/components/transaction-sheet.tsx` for WCAG 2.1 AA compliance — confirm every bucket button has `aria-pressed` + `aria-label`, every category pill has `aria-pressed` + `aria-label="Select {name}"`, the error `<p>` has `role="alert"`, and the amount `<Input>` has `id="amount"` linked to its `<label htmlFor="amount">`

- [x] T012 Run `pnpm lint` in `web/` and resolve all ESLint errors before committing

- [x] T013 Run `pnpm build` in `web/` and resolve any TypeScript type errors or Next.js build failures

- [x] T014 Manually validate all test scenarios from `specs/002-transaction-sheet-redesign/quickstart.md`: expense happy path, income mode, amount validation, and edit mode with correct bucket pre-selection

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks Phases 3–5**
- **US1 (Phase 3)**: Depends on Phase 2 — T004 and T005/T006 can start in parallel after T002+T003
- **US2 (Phase 4)**: Depends on Phase 2 (T009 also benefits from T005/T006 being done first)
- **US3 (Phase 5)**: Depends on Phase 2 only — can be done in parallel with Phase 3 or 4
- **Polish (Phase 6)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Requires Foundational (T002, T003) — no dependency on US2 or US3
- **US2 (P2)**: Requires Foundational (T002, T003) — no dependency on US1 or US3
- **US3 (P3)**: Requires only T002 — fully independent of US1 and US2

### Within Phase 3 (US1)

- T004, T005, T006 can run in parallel (different sections of the component)
- T007 depends on T005 and T006 being done (removes the old category step)
- T008 can run in parallel with T004–T006

---

## Parallel Execution Example: Phase 3 (US1)

```text
# After T002 + T003 complete, launch these together:
Task A: T004 — Redesign amount input section
Task B: T005 — Add intent bucket selector
Task C: T006 — Add horizontal-scroll category pill row
Task D: T008 — Replace footer with single "Add" button

# Then, once A–D complete:
Task E: T007 — Remove two-step flow
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 — T001 (smoke test)
2. Phase 2 — T002, T003 (state + filtering)
3. Phase 3 — T004 → T005/T006/T008 (parallel) → T007
4. **Validate**: Expense entry end-to-end with bucket + pill selector
5. Commit and demo

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (T004–T008) → US1: Expense entry works with new UI — **MVP ready**
3. Phase 4 (T009) → US2: Income mode complete
4. Phase 5 (T010) → US3: Notes field updated
5. Phase 6 (T011–T014) → Accessibility, lint, build, QA

### Single-Developer Strategy

Follow tasks sequentially: T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014.

Stop after T008 to validate the MVP expense flow before continuing.
