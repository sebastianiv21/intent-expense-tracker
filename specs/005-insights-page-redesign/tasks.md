# Tasks: Insights Page Visual Redesign

**Input**: Design documents from `/specs/005-insights-page-redesign/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No test tasks requested in specification. Testing via build verification and manual review.

**Organization**: Tasks are grouped by user story to enable incremental implementation. Each story adds a section to the Insights page.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `web/app/`, `web/components/`
- All paths relative to repository root

---

## Phase 1: Setup

**Purpose**: Prepare typography and animation utilities for the redesign

- [ ] T001 Add `tabular-nums` utility class to Tailwind configuration in `web/app/globals.css` for consistent number alignment
- [ ] T002 Define animation timing constants (delays, durations, easing) in `web/components/insights-page.tsx` for staggered chart reveals

---

## Phase 2: Foundational (Design System Updates)

**Purpose**: Establish visual foundation that all user stories will use

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Update grid layout patterns in `web/components/insights-page.tsx` from symmetric `lg:grid-cols-2` to asymmetric `lg:grid-cols-[1.5fr_1fr]`
- [ ] T004 Add responsive height classes to chart containers in `web/components/insights-page.tsx` (`h-48 sm:h-56 md:h-64 lg:h-72`)
- [ ] T005 Update typography hierarchy in `web/components/insights-page.tsx` - use weight contrast (Medium → Semibold → Bold) for visual hierarchy
- [ ] T006 Add bucket icons (using Lucide React) to bucket labels for non-color distinction in `web/components/insights-page.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Allocation Compliance at a Glance (Priority: P1) 🎯 MVP

**Goal**: Users see a prominent compliance score with donut chart for immediate budget awareness

**Independent Test**: Navigate to `/insights`, verify compliance score and donut chart display within 3 seconds

### Implementation for User Story 1

- [ ] T007 [US1] Redesign compliance score display in `web/components/insights-page.tsx` - make score larger and more prominent with refined typography
- [ ] T008 [US1] Add animation props to Pie component in `web/components/insights-page.tsx` (`animationBegin={100}`, `animationDuration={800}`, `animationEasing="ease-out"`)
- [ ] T009 [US1] Implement active shape hover effect for donut chart in `web/components/insights-page.tsx` - expand slice on hover with drop shadow
- [ ] T010 [US1] Add empty state for compliance section when no expenses recorded OR zero income in `web/components/insights-page.tsx` - show N/A or guidance message per spec edge case
- [ ] T011 [US1] Add bucket legend below donut chart with icons and amounts in `web/components/insights-page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional - users can see compliance status immediately

---

## Phase 4: User Story 2 - Compare Actual Spending Against Targets (Priority: P2)

**Goal**: Users see bucket cards with actual vs target amounts, variance, and progress indicators

**Independent Test**: View bucket cards section, verify each shows actual, target, variance, and progress bar

### Implementation for User Story 2

- [ ] T012 [US2] Redesign bucket cards layout in `web/components/insights-page.tsx` - use responsive grid `grid gap-4 sm:grid-cols-3`
- [ ] T013 [US2] Add variance visual emphasis for overspending in `web/components/insights-page.tsx` - distinct color/styling when variance is negative
- [ ] T014 [US2] Update progress bars to show overage beyond 100% in `web/components/insights-page.tsx` - extend bar visually past target threshold
- [ ] T015 [US2] Add bucket icons to each card header for non-color distinction in `web/components/insights-page.tsx`
- [ ] T016 [US2] Add `tabular-nums` class to all currency values in bucket cards in `web/components/insights-page.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Explore Spending by Category (Priority: P3)

**Goal**: Users see bar chart showing spending totals by category, colored by allocation bucket

**Independent Test**: View spending by category section, verify bar chart displays with tooltips

### Implementation for User Story 3

- [ ] T017 [US3] Redesign spending by category chart container in `web/components/insights-page.tsx` - asymmetric layout with generous negative space
- [ ] T018 [US3] Add animation props to Bar component in `web/components/insights-page.tsx` (`animationBegin={300}`, `animationDuration={800}`)
- [ ] T019 [US3] Update chart dimensions for mobile in `web/components/insights-page.tsx` - dynamic `barSize` based on viewport
- [ ] T020 [US3] Improve tooltip styling in `web/components/insights-page.tsx` - match refined aesthetic with proper shadows
- [ ] T021 [US3] Update empty state for spending section in `web/components/insights-page.tsx` - encourage categorization

**Checkpoint**: All three chart sections (compliance, bucket cards, spending) should now be functional

---

## Phase 6: User Story 4 - Review Financial Summary Metrics (Priority: P4)

**Goal**: Users see summary section with income, expenses, balance, and transaction count

**Independent Test**: View summary section, verify four metrics display correctly

### Implementation for User Story 4

- [ ] T022 [US4] Redesign summary section layout in `web/components/insights-page.tsx` - refine spacing and visual hierarchy
- [ ] T023 [US4] Add visual treatment for negative balance in `web/components/insights-page.tsx` - distinct styling when expenses exceed income
- [ ] T024 [US4] Add `tabular-nums` class to all summary metrics in `web/components/insights-page.tsx`
- [ ] T025 [US4] Format transaction count with proper pluralization in `web/components/insights-page.tsx`

**Checkpoint**: Summary section complete, full page content now available

---

## Phase 7: User Story 5 - Experience Smooth Page Load with Skeleton (Priority: P5)

**Goal**: Users see polished loading skeleton matching final content structure

**Independent Test**: Simulate slow network, verify skeleton matches final layout with no CLS on transition

### Implementation for User Story 5

- [ ] T026 [US5] Create donut chart skeleton shape in `web/components/skeletons/insights-skeleton.tsx` - ring shape with center hole
- [ ] T027 [US5] Create bar chart skeleton shape in `web/components/skeletons/insights-skeleton.tsx` - varying height bars
- [ ] T028 [US5] Update bucket card skeletons in `web/components/skeletons/insights-skeleton.tsx` - match new card structure
- [ ] T029 [US5] Update skeleton layout to match asymmetric grid in `web/components/skeletons/insights-skeleton.tsx`
- [ ] T030 [US5] Ensure skeleton dimensions match final content to prevent layout shift in `web/components/skeletons/insights-skeleton.tsx`

**Checkpoint**: All user stories complete, page fully redesigned

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and verification

- [ ] T031 Verify mobile-first responsive behavior at 375px, 640px, 768px, 1024px breakpoints in `web/components/insights-page.tsx`
- [ ] T032 Verify WCAG 2.1 AA compliance - check contrast ratios and bucket distinguishability without color in `web/components/insights-page.tsx`
- [ ] T033 Verify `prefers-reduced-motion` is respected - animations disabled when user prefers in `web/components/insights-page.tsx`
- [ ] T033a Verify period selector and disabled state handling still function correctly in `web/components/insights-page.tsx` (FR-011 preservation)
- [ ] T034 Run `pnpm lint` and fix any issues
- [ ] T035 Run `pnpm build` and verify successful build
- [ ] T036 Manual validation against quickstart.md success criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories should proceed sequentially (same file, avoid conflicts)
  - US1 → US2 → US3 → US4 → US5 recommended order
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core compliance section
- **User Story 2 (P2)**: Can start after US1 - Bucket cards section
- **User Story 3 (P3)**: Can start after US2 - Spending chart section
- **User Story 4 (P4)**: Can start after US3 - Summary section
- **User Story 5 (P5)**: Can start after US4 - Loading skeleton (matches final layout)

### Within Each User Story

- Core redesign before animations
- Layout before styling refinements
- Empty states after happy path
- Story complete before moving to next

### Parallel Opportunities

- Setup tasks (T001, T002) can run in parallel - different concerns
- Within US5, skeleton shapes (T026, T027, T028) can be created in parallel then assembled

---

## Parallel Example: Setup Phase

```bash
# Launch both setup tasks together:
Task: "Add tabular-nums utility class to Tailwind configuration in web/app/globals.css"
Task: "Define animation timing constants in web/components/insights-page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Compliance Score)
4. **STOP and VALIDATE**: Test compliance visibility independently
5. Deploy/demo if ready - core value delivered

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Bucket cards functional → Deploy/Demo
4. Add User Story 3 → Spending chart functional → Deploy/Demo
5. Add User Story 4 → Summary complete → Deploy/Demo
6. Add User Story 5 → Skeleton polished → Deploy/Demo
7. Polish phase → Final refinements

### Files Modified Summary

| File | Phases Touching |
|------|-----------------|
| `web/app/globals.css` | Phase 1 |
| `web/components/insights-page.tsx` | Phase 1, 2, 3, 4, 5, 6, 8 |
| `web/components/skeletons/insights-skeleton.tsx` | Phase 7 |

---

## Notes

- [P] tasks = different files or concerns, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story adds a section to the page incrementally
- All US1-US4 tasks modify the same file - proceed sequentially to avoid conflicts
- US5 modifies a different file (skeleton) - could potentially parallelize
- Commit after each user story completion
- Stop at any checkpoint to validate independently
- Verify build success after each phase
