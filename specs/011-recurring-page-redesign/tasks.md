# Tasks: Recurring Page Redesign

**Input**: Design documents from `/specs/011-recurring-page-redesign/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Tests are NOT included - feature specification does not request TDD approach. Manual verification via `pnpm lint` and `pnpm build` as specified in plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Web application (Next.js App Router)
- **Base path**: `web/`
- **Components**: `web/components/`
- **Utilities**: `web/lib/`

---

## Phase 1: Setup

**Purpose**: Reference existing patterns and prepare workspace

- [x] T001 Review budgets-page.tsx design patterns in web/components/budgets-page.tsx
- [x] T002 Review categories-page.tsx design patterns in web/components/categories-page.tsx
- [x] T003 Review finance-utils.ts color utilities in web/lib/finance-utils.ts

**Checkpoint**: Familiar with existing patterns - ready to implement

---

## Phase 2: User Story 1 - View Recurring Overview (Priority: P1) 🎯 MVP

**Goal**: Display a monthly overview card showing total active recurring income, expenses, and net amount with progress visualization

**Independent Test**: Navigate to Recurring page and verify summary card displays totals for active items only

### Implementation for User Story 1

- [x] T004 [US1] Add computed summary calculation in web/components/recurring-page.tsx (totalIncome, totalExpenses, netRecurring, activeCount, pausedCount)
- [x] T005 [US1] Add summary card UI component at top of page in web/components/recurring-page.tsx with grid layout (Budgeted/Spent/Remaining pattern from budgets page)
- [x] T006 [US1] Add progress bar to summary card using Progress component from web/components/ui/progress.tsx
- [x] T007 [US1] Style summary card with rounded-xl border and bg-card matching budgets page month header

**Checkpoint**: User Story 1 complete - summary card displays correctly with accurate totals

---

## Phase 3: User Story 2 - Browse Recurring Items (Priority: P1)

**Goal**: Display recurring item cards with clear visual distinction between income and expense types using colored borders and icon backgrounds

**Independent Test**: View recurring items list and verify each card has type-colored left border, icon in colored circle, and prominent amount

### Implementation for User Story 2

- [x] T008 [US2] Update card container to add 3px left border with borderLeftWidth/borderLeftColor inline styles in web/components/recurring-page.tsx
- [x] T009 [US2] Import getTransactionColor from web/lib/finance-utils.ts for type-based coloring
- [x] T010 [US2] Update icon circle background to use type color with 26 opacity suffix (e.g., backgroundColor: color + "26")
- [x] T011 [US2] Increase amount font size and add font-semibold for prominence
- [x] T012 [US2] Add DropdownMenu for Edit/Delete actions using web/components/ui/dropdown-menu.tsx (replacing inline buttons)
- [x] T013 [US2] Update card layout to match budgets/categories pattern with icon, name/description, and amount sections

**Checkpoint**: User Story 2 complete - all cards display with type-colored design

---

## Phase 4: User Story 3 - Manage Recurring Items (Priority: P2)

**Goal**: Implement inline delete confirmation (Check/X buttons) replacing browser confirm dialogs, plus maintain pause/resume functionality

**Independent Test**: Trigger delete on a recurring item and verify inline confirmation appears instead of browser dialog; verify pause/resume moves items between tabs

### Implementation for User Story 3

- [x] T014 [US3] Add confirmingDeleteId state with useState in web/components/recurring-page.tsx
- [x] T015 [US3] Add confirmButtonRefs and deleteButtonRefs using useRef for focus management in web/components/recurring-page.tsx
- [x] T016 [US3] Add useEffect for focus management when confirmingDeleteId changes in web/components/recurring-page.tsx
- [x] T017 [US3] Replace window.confirm with triggerDelete and confirmDelete functions in web/components/recurring-page.tsx
- [x] T018 [US3] Add inline Check/X button UI when confirmingDeleteId matches item id in web/components/recurring-page.tsx
- [x] T019 [US3] Add deleteError state for displaying deletion errors in web/components/recurring-page.tsx
- [x] T020 [US3] Ensure pause/resume buttons remain functional with existing handleToggle in web/components/recurring-page.tsx

**Checkpoint**: User Story 3 complete - delete uses inline confirmation, pause/resume works

---

## Phase 5: User Story 4 - Create and Edit Recurring Items (Priority: P2)

**Goal**: Redesign create/edit bottom sheet with modern header, centered amount input, animated type toggle, frequency chips, and horizontal scrolling category selection

**Independent Test**: Open create sheet and verify modern header, centered amount with gradient, animated type toggle, frequency chips, and category chips filtered by type

### Implementation for User Story 4

- [x] T021 [US4] Update SheetContent to use rounded-t-3xl, border, bg-card, and hide default close button ([&>button]:hidden) in web/components/recurring-page.tsx
- [x] T022 [US4] Add modern SheetHeader with text-2xl font-bold title and custom X close button in web/components/recurring-page.tsx
- [x] T023 [US4] Create centered amount input section with $ prefix and radial gradient background in web/components/recurring-page.tsx
- [x] T024 [US4] Add font size scaling function for long amounts (getAmountFontSize) in web/components/recurring-page.tsx
- [x] T025 [US4] Create animated type toggle (Expense/Income) with sliding indicator using inline left position transition in web/components/recurring-page.tsx
- [x] T026 [US4] Convert frequency Select to pill chips/segmented control with grid layout in web/components/recurring-page.tsx
- [x] T027 [US4] Convert category Select to horizontal scrolling chips with overflow-x-auto and gradient fade edge in web/components/recurring-page.tsx
- [x] T028 [US4] Filter category chips by formState.type (expense vs income) in web/components/recurring-page.tsx
- [x] T029 [US4] Update date inputs to use Calendar popover from web/components/ui/calendar.tsx via Popover component in web/components/recurring-page.tsx
- [x] T030 [US4] Update save button to large gradient style (linear-gradient to right #c97a5a, #a36248) with rounded-3xl and py-6 in web/components/recurring-page.tsx
- [x] T031 [US4] Wrap sheet content in flex column with overflow-y-auto for scrolling form in web/components/recurring-page.tsx

**Checkpoint**: User Story 4 complete - create/edit sheet matches budgets/categories design pattern

---

## Phase 6: User Story 5 - Empty State Guidance (Priority: P3)

**Goal**: Display engaging empty states for Active and Paused tabs with emoji, title, description, and action button

**Independent Test**: View Recurring page with no items and verify empty state displays with emoji, title, description, and "Add recurring" button

### Implementation for User Story 5

- [x] T032 [US5] Create empty state component with emoji icon (text-4xl), bold title, description, and action button in web/components/recurring-page.tsx
- [x] T033 [US5] Add different emoji/message for Active tab empty state vs Paused tab empty state in web/components/recurring-page.tsx
- [x] T034 [US5] Style empty state with rounded-2xl border, bg-card, centered text, and p-10 in web/components/recurring-page.tsx

**Checkpoint**: User Story 5 complete - empty states guide users appropriately

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and refinements

- [x] T035 Verify all touch targets meet 44px minimum (min-h-[44px] on buttons) in web/components/recurring-page.tsx
- [x] T036 [P] Update recurring skeleton in web/components/skeletons/recurring-skeleton.tsx to match new card design if needed
- [x] T037 Test keyboard navigation and focus management for delete confirmation flow
- [x] T038 Run pnpm lint and fix any issues
- [x] T039 Run pnpm build and verify no errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Stories (Phase 2-6)**: Can proceed sequentially or in parallel after setup
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies - MVP target
- **User Story 2 (P1)**: Can proceed in parallel with US1 (same file but different sections)
- **User Story 3 (P2)**: Builds on US2 card design (uses dropdown menu placement)
- **User Story 4 (P2)**: Independent - redesigns sheet component
- **User Story 5 (P3)**: Independent - adds empty state rendering

### Within Each User Story

- Summary card computation before UI
- Card styling before delete confirmation (needs dropdown menu placement)
- Sheet structure before individual form elements
- All elements before save button styling

### Parallel Opportunities

- T001, T002, T003 can run in parallel (review tasks)
- T004-T007 can run sequentially within US1
- T008-T013 can run sequentially within US2 (same file)
- T036 (skeleton) can run in parallel with other polish tasks

---

## Parallel Example: Setup Phase

```bash
# Launch all review tasks together:
Task: "Review budgets-page.tsx design patterns in web/components/budgets-page.tsx"
Task: "Review categories-page.tsx design patterns in web/components/categories-page.tsx"
Task: "Review finance-utils.ts color utilities in web/lib/finance-utils.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (review patterns)
2. Complete Phase 2: User Story 1 (Summary Card)
3. Complete Phase 3: User Story 2 (Card Design)
4. **STOP and VALIDATE**: Test US1+US2 independently - verify summary shows correct totals and cards have type-colored design
5. Deploy/demo if ready - users can now see improved overview and card design

### Incremental Delivery

1. Complete Setup → Ready to implement
2. Add User Story 1+2 → Test independently → Deploy/Demo (MVP - visual redesign complete!)
3. Add User Story 3 → Test independently → Deploy/Demo (Delete UX improved)
4. Add User Story 4 → Test independently → Deploy/Demo (Create/Edit UX improved)
5. Add User Story 5 → Test independently → Deploy/Demo (Onboarding improved)
6. Polish → Final verification → Full release

---

## Notes

- All implementation in single file: web/components/recurring-page.tsx
- No backend changes required
- Existing Server Actions unchanged
- Pattern reference: budgets-page.tsx and categories-page.tsx
- Color utility: getTransactionColor from finance-utils.ts
- Commit after each user story completion

### Preserved by Design (No Tasks Required)

The following requirements are maintained by the redesign approach without explicit implementation tasks:

- **FR-015** (Active/Paused tabs): Tab filtering logic unchanged; only UI styling updated within existing tab structure
- **FR-017** (Business logic): All Server Actions in `lib/actions/recurring.ts` remain unchanged; data model and queries preserved
