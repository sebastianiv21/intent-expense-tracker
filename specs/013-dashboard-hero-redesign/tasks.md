# Tasks: Dashboard Hero Card and List Pattern Consistency

**Input**: Design documents from `/specs/013-dashboard-hero-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No tests requested in specification. Manual verification via `pnpm lint` and `pnpm build`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/app/`, `web/components/`, `web/lib/`

---

## Phase 1: User Story 1 - Monthly Balance Hero Card (Priority: P1) 🎯 MVP

**Goal**: Create a visually prominent hero card with primary color background displaying monthly balance, income/expenses, and quick stats.

**Independent Test**: View dashboard and verify hero card displays with primary color styling, balance amount, income/expenses, and quick stats row.

### Implementation for User Story 1

- [ ] T001 [US1] Create HeroBalanceCard component in web/components/hero-balance-card.tsx
- [ ] T002 [US1] Update dashboard page to use HeroBalanceCard and preserve "View all" link in web/app/(app)/page.tsx

**Checkpoint**: User Story 1 complete - hero card displays prominently on dashboard with all required elements

---

## Phase 2: User Story 2 - Recent Transactions with Date Grouping (Priority: P2)

**Goal**: Display recent transactions grouped by date labels ("Today", "Yesterday", "MMM d") with the same rounded card styling as the transactions page.

**Independent Test**: Add transactions on different dates and verify they appear grouped with appropriate date labels and consistent card styling.

### Implementation for User Story 2

- [ ] T003 [US2] Extract date grouping logic and add date-grouped transaction list to dashboard in web/app/(app)/page.tsx

**Checkpoint**: User Story 2 complete - transactions display in date groups matching transactions page pattern

---

## Phase 3: User Story 3 - Upcoming Recurring Items with Consistent Styling (Priority: P3)

**Goal**: Display upcoming recurring items with rounded-xl card styling and hover states matching transaction items.

**Independent Test**: Create recurring items and verify they appear with consistent rounded card styling, hover states, and bucket color coding.

### Implementation for User Story 3

- [ ] T004 [US3] Update recurring items section styling to use rounded-xl cards in web/app/(app)/page.tsx

**Checkpoint**: User Story 3 complete - recurring items display with consistent styling across all list sections

---

## Phase 4: Polish & Verification

**Purpose**: Final verification and cleanup

- [ ] T005 Run pnpm lint and fix any issues in web/
- [ ] T006 Run pnpm build and verify success
- [ ] T007 Visual verification: hero card prominence (vs previous), "View all" link presence, space utilization, mobile (375px) and desktop viewports

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies - can start immediately
- **User Story 2 (Phase 2)**: Depends on US1 (same file modification)
- **User Story 3 (Phase 3)**: Depends on US2 (same file modification)
- **Polish (Phase 4)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - creates new component and integrates it
- **User Story 2 (P2)**: Modifies same file as US1 - best done after US1
- **User Story 3 (P3)**: Modifies same file as US1/US2 - best done after US2

### Parallel Opportunities

Limited parallelism due to single file modification pattern. Tasks within each user story are sequential.

---

## Parallel Example: User Story 1

No parallel tasks - single component creation followed by integration.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: User Story 1 (Hero Card)
2. **STOP and VALIDATE**: Test hero card independently
3. Deploy/demo if ready - hero card provides immediate visual impact

### Incremental Delivery

1. User Story 1 → Hero card complete → Test independently → Deploy (MVP!)
2. User Story 2 → Transaction grouping added → Test independently → Deploy
3. User Story 3 → Recurring styling added → Test independently → Deploy
4. Polish → Verification complete → Final deploy

---

## Notes

- All tasks modify the same page file sequentially
- Each user story adds value without breaking previous work
- Commit after each user story phase
- No tests requested - manual verification via lint/build
- Stop at any checkpoint to validate independently
