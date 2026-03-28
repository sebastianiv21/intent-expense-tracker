# Tasks: Mobile Navigation Access

**Input**: Design documents from `/specs/012-mobile-nav-access/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, quickstart.md ✓

**Tests**: No tests explicitly requested - validation via `pnpm lint` and `pnpm build`

**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)
- All paths relative to `web/` directory

---

## Phase 1: Setup

**Purpose**: No setup required - working within existing Next.js project

No tasks - project already initialized with all required dependencies.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the overflow sheet component that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create OverflowSheet component in components/overflow-sheet.tsx with bottom sheet pattern using existing Sheet component from shadcn/ui

**Checkpoint**: Overflow sheet ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Budgets in Bottom Bar (Priority: P1) 🎯 MVP

**Goal**: Add Budgets as a directly accessible item in the mobile bottom navigation bar

**Independent Test**: Tap Budgets icon in bottom nav → verify Budgets page loads with all data visible → verify Budgets icon shows active state

### Implementation for User Story 1

- [x] T002 [US1] Add Budgets to RIGHT_ITEMS array in components/bottom-nav.tsx with PieChart icon and "/budgets" href
- [x] T003 [US1] Add "More" trigger button to right section of components/bottom-nav.tsx (replacing Stats and Profile)

**Checkpoint**: Budgets accessible from bottom bar with 1 tap - MVP complete

---

## Phase 4: User Stories 2 & 3 - Overflow Menu Access (Priority: P2)

**Goal**: Provide access to Categories and Recurring via the overflow menu

**Independent Test**: Open "More" sheet → tap Categories → verify Categories page loads → open "More" again → tap Recurring → verify Recurring page loads

### Implementation for User Stories 2 & 3

- [x] T004 [US2] [US3] Define OVERFLOW_ITEMS constant in components/overflow-sheet.tsx with Stats, Categories, Recurring, Profile items (use icons: BarChart2, Tag, RefreshCw, User)
- [x] T005 [US2] [US3] Implement overflow menu list in components/overflow-sheet.tsx with active state highlighting using usePathname() hook
- [x] T006 [US2] [US3] Add sheet state management to components/bottom-nav.tsx (useState for open/close)
- [x] T007 [US2] [US3] Import and render OverflowSheet in components/bottom-nav.tsx with open/onOpenChange props
- [x] T008 [US2] [US3] Remove Stats and Profile from RIGHT_ITEMS in components/bottom-nav.tsx

**Checkpoint**: Categories and Recurring accessible via overflow menu within 2 taps

---

## Phase 5: User Story 4 - Discover Overflow Navigation (Priority: P3)

**Goal**: Ensure the overflow menu trigger is clearly identifiable and the menu contents are discoverable

**Independent Test**: View bottom nav → identify "More" button within 5 seconds → open sheet → verify all 4 overflow items visible with icons and labels

### Implementation for User Story 4

- [x] T010 [US4] Style "More" button with consistent sizing (min-h-[44px], min-w-[44px]) and visual treatment matching other nav items
- [x] T011 [US4] Add aria-label to "More" button for accessibility: "Open navigation menu"
- [x] T012 [US4] Ensure overflow sheet items in components/overflow-sheet.tsx have clear visual hierarchy with icons and text labels

**Checkpoint**: Overflow navigation is discoverable and accessible

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup

- [x] T013 Run pnpm lint in web/ directory to verify no linting errors
- [x] T014 Run pnpm build in web/ directory to verify TypeScript compilation succeeds
- [x] T015 Verify active state indication works for all nav items (bottom bar and overflow); verify FAB position unchanged (FR-003); verify overflow only shows on mobile breakpoint (FR-009)
- [x] T016 Verify sheet closes automatically after navigation selection (FR-007)
- [x] T017 Verify Profile page is focused on account settings (Categories removed from Profile, accessible only via overflow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - already complete
- **Foundational (Phase 2)**: Creates OverflowSheet - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - Can start immediately after
- **User Stories 2 & 3 (Phase 4)**: Depends on Phase 2 - Can run in parallel with Phase 3
- **User Story 4 (Phase 5)**: Depends on Phase 4 (needs More button in place)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent - Budgets in bottom bar
- **US2/US3 (P2)**: Depend on OverflowSheet existing - work together in Phase 4
- **US4 (P3)**: Depends on More button being in place from US2/US3

### Parallel Opportunities

- T002 and T004 can run in parallel (different files)
- T010, T011, T012 can run in parallel within Phase 5
- T013, T014 can run in parallel in Phase 6

---

## Parallel Example: Phase 3 & 4

```bash
# Launch implementation tasks that modify different files:
Task: "Add Budgets to RIGHT_ITEMS array in components/bottom-nav.tsx"
Task: "Define OVERFLOW_ITEMS constant in components/overflow-sheet.tsx"

# After constants defined, launch sheet implementation:
Task: "Implement overflow menu list in components/overflow-sheet.tsx"
Task: "Add sheet state management to components/bottom-nav.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (create OverflowSheet component)
2. Complete Phase 3: User Story 1 (Budgets in bottom bar)
3. **STOP and VALIDATE**: Test Budgets access on mobile
4. Deploy/demo if ready

### Full Feature Delivery

1. Complete Phase 2: Foundational → OverflowSheet created
2. Complete Phase 3: User Story 1 → Budgets in bottom bar (MVP!)
3. Complete Phase 4: User Stories 2 & 3 → Overflow menu functional
4. Complete Phase 5: User Story 4 → Discoverability ensured
5. Complete Phase 6: Polish → All validation passing

---

## File Changes Summary

| File | Action | Tasks |
|------|--------|-------|
| `components/overflow-sheet.tsx` | CREATE | T001, T004, T005, T012 |
| `components/bottom-nav.tsx` | MODIFY | T002, T003, T006, T007, T008, T010, T011 |

---

## Notes

- No new dependencies required (using existing shadcn/ui Sheet, lucide-react icons)
- No database or type changes
- All interactive elements must meet 44x44px minimum touch target
- Sheet must close on navigation selection (FR-007)
- Active state uses accent color for consistency with existing bottom-nav pattern
