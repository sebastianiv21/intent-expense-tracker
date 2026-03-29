# Tasks: Fix UI Consistency and Color Bugs

**Input**: Design documents from `/specs/014-fix-ui-bugs/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No tests requested in specification. Verification via manual testing per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/` at repository root
- Components: `web/components/`
- Pages: `web/app/(app)/`
- Actions: `web/lib/actions/`
- Utilities: `web/lib/`

---

## Phase 1: Setup (Verification)

**Purpose**: Verify development environment and understand existing code

- [x] T001 Verify dev server starts with `cd web && pnpm dev`
- [x] T002 [P] Review existing `getBucketColor` function in `web/lib/finance-utils.ts`
- [x] T003 [P] Review existing `getTransactionColor` function in `web/lib/finance-utils.ts`
- [x] T004 [P] Review `BUCKET_ICONS` definition in `web/components/insights-page.tsx`

---

## Phase 2: User Story 1 - Charts Display Meaningful Colors (Priority: P1) 🎯 MVP

**Goal**: Pie chart and bar chart on Insights page display bucket colors or transaction type fallback colors instead of gray for uncategorized items.

**Independent Test**: View Insights page with categorized and uncategorized transactions; verify all chart segments display appropriate colors (no gray #888888).

### Implementation for User Story 1

- [x] T005 [US1] Import `getTransactionColor` in `web/components/insights-page.tsx` (add to existing imports from finance-utils)
- [x] T006 [US1] Update bar chart Cell fill logic to use `getTransactionColor('expense')` fallback when `entry.bucket` is null in `web/components/insights-page.tsx`
- [x] T007 [US1] Verify pie chart (compliance chart) already uses bucket colors correctly - no changes needed if data is bucket-aggregated

**Checkpoint**: Insights page charts display meaningful colors for all data points

---

## Phase 3: User Story 2 - Editing Recurring Transaction Updates Existing Record (Priority: P1) 🎯 MVP

**Goal**: Editing a recurring transaction updates the existing record instead of creating a duplicate.

**Independent Test**: Create a recurring transaction, edit it, and verify the same record is updated (no duplicate created).

**Note**: Per research.md, the edit flow code appears correct. T008-T010 are verification tasks to confirm this. If code is confirmed correct, skip T011 and proceed directly to T012 (manual test).

### Implementation for User Story 2

- [x] T008 [US2] Review `handleSave` function logic in `web/components/recurring-page.tsx` - verify `editing` state check routes to `updateRecurring`
- [x] T009 [US2] Review `openEdit` function in `web/components/recurring-page.tsx` - verify `setEditing(item)` is called correctly
- [x] T010 [US2] Review `updateRecurring` action in `web/lib/actions/recurring.ts` - verify it uses `.update()` with correct `where` clause
- [x] T011 [US2] CONTINGENCY: Only if bug confirmed after T008-T010, add debug logging to `handleSave` in `web/components/recurring-page.tsx` to trace `editing` state (SKIPPED - code verified correct)
- [ ] T012 [US2] Test edit flow manually: create recurring → edit → save → verify no duplicate created

**Checkpoint**: Editing recurring transactions works correctly with no duplicates

---

## Phase 4: User Story 3 - Consistent "Wants" Bucket Icon (Priority: P2)

**Goal**: Wants bucket displays Coffee icon consistently across all pages (Insights, Transactions, Categories, Budgets, Recurring).

**Independent Test**: View each page that displays bucket icons; verify wants bucket consistently shows Coffee icon.

### Implementation for User Story 3

- [x] T013 [US3] Update import in `web/components/insights-page.tsx`: replace `Heart` with `Coffee` from lucide-react
- [x] T014 [US3] Update `BUCKET_ICONS.wants` from `Heart` to `Coffee` in `web/components/insights-page.tsx`
- [x] T015 [P] [US3] Verify `web/components/transaction-sheet.tsx` already uses Coffee for wants (reference check only)
- [x] T016 [P] [US3] Verify `web/components/categories-page.tsx` already uses Coffee for wants (reference check only)
- [x] T017 [P] [US3] Verify `web/components/budgets-page.tsx` already uses Coffee for wants (reference check only)
- [x] T018 [P] [US3] Verify `web/components/recurring-page.tsx` already uses Coffee for wants (reference check only)

**Checkpoint**: Wants bucket shows Coffee icon on all pages

---

## Phase 5: User Story 4 - Upcoming Recurring Items Display Correct Colors (Priority: P2)

**Goal**: Dashboard upcoming recurring section shows amounts colored by transaction type or bucket, never gray when type is known.

**Independent Test**: View dashboard with upcoming recurring items of different types; verify colors match transaction type (income: green, expense: red/bucket color).

### Implementation for User Story 4

- [x] T019 [US4] Import `getTransactionColor` in `web/app/(app)/page.tsx` (add to existing imports from finance-utils)
- [x] T020 [US4] Update upcoming recurring amount color logic: use `getTransactionColor(recurring.type)` fallback when `allocationBucket` is null in `web/app/(app)/page.tsx`

**Checkpoint**: Upcoming recurring amounts display correct colors

---

## Phase 6: Polish & Verification

**Purpose**: Final validation and cleanup

- [x] T021 Run `pnpm lint` in `web/` directory - must pass
- [x] T022 Run `pnpm build` in `web/` directory - must succeed
- [x] T023 Complete manual testing checklist from `specs/014-fix-ui-bugs/quickstart.md`
- [x] T024 Commit changes with conventional commit message: `fix: resolve UI consistency and color bugs`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Stories (Phases 2-5)**: Can proceed in parallel after Setup
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - independently testable
- **User Story 2 (P1)**: No dependencies on other stories - independently testable
- **User Story 3 (P2)**: No dependencies on other stories - independently testable
- **User Story 4 (P2)**: No dependencies on other stories - independently testable

### Parallel Opportunities

All user stories can be worked on in parallel since they touch different files:
- US1: `web/components/insights-page.tsx`
- US2: `web/components/recurring-page.tsx`, `web/lib/actions/recurring.ts`
- US3: `web/components/insights-page.tsx` (can combine with US1)
- US4: `web/app/(app)/page.tsx`

---

## Parallel Example: All User Stories

```bash
# These can all run in parallel (different files):
Task: "Fix chart colors in web/components/insights-page.tsx (US1)"
Task: "Verify recurring edit flow in web/components/recurring-page.tsx (US2)"
Task: "Fix wants icon in web/components/insights-page.tsx (US3 - combine with US1)"
Task: "Fix upcoming colors in web/app/(app)/page.tsx (US4)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (verification)
2. Complete Phase 2: User Story 1 (chart colors)
3. Complete Phase 3: User Story 2 (recurring edit)
4. **STOP and VALIDATE**: Test both P1 stories independently
5. Deploy if ready

### Incremental Delivery

1. Setup → Foundation verified
2. US1 (Charts) → Test → Charts work correctly
3. US2 (Recurring Edit) → Test → Edit works correctly
4. US3 (Wants Icon) → Test → Icons consistent
5. US4 (Upcoming Colors) → Test → Colors correct
6. Polish → Final validation → Ready to commit

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable
- US1 and US3 both modify `insights-page.tsx` - combine for efficiency
- Commit after all fixes complete with single conventional commit
