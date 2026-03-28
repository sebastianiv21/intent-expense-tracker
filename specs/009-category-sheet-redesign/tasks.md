# Tasks: Category Sheet Redesign

**Input**: Design documents from `/specs/009-category-sheet-redesign/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅  
**Sole modified file**: `web/components/categories-page.tsx`  
**Tests**: Not requested — verification is manual via `pnpm lint`, `pnpm build`, and quickstart.md checklist.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (independent sections, no completion dependency)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Imports & Constants)

**Purpose**: Add the new lucide-react icons and curated data constants that all sheet sections depend on. These must be in place before any sheet UI task begins.

- [x] T001 Add lucide-react icon imports (`Home`, `Coffee`, `PiggyBank`, `CheckCircle`, `Grid3X3`) to the import line in `web/components/categories-page.tsx`
- [x] T002 [P] Add `BUCKET_PILLS` constant (array of `{ key, label, Icon }` for needs/wants/future) after `BUCKET_OPTIONS` in `web/components/categories-page.tsx`
- [x] T003 [P] Add `CATEGORY_EMOJIS` constant (30-item string array of curated emojis) after `BUCKET_PILLS` in `web/components/categories-page.tsx`

**Checkpoint**: All icons import cleanly and constants are typed correctly — `npx tsc --noEmit` passes.

---

## Phase 2: Foundational (Sheet Container Structure)

**Purpose**: Replace the existing `SheetContent` opening and wrapper with the new flex-column layout. This is the structural skeleton all story-specific sections slot into. No user story work can begin until this is in place.

**⚠️ CRITICAL**: This changes the sheet's root layout. Complete before any section tasks.

- [x] T004 Replace `SheetContent` className — add `max-h-[90vh] rounded-t-3xl border border-border bg-card p-0 [&>button]:hidden` to suppress the Radix default close button (FR-012) in `web/components/categories-page.tsx`
- [x] T005 Add the outer `<div className="flex max-h-[90vh] flex-col">` wrapper inside `SheetContent` to create the fixed-header / scrollable-body / fixed-footer layout (FR-009) in `web/components/categories-page.tsx`

**Checkpoint**: Sheet opens with the new rounded-top styling and no Radix X button visible in the top-right corner.

---

## Phase 3: User Story 1 — Create a Category with Icon Picker (Priority: P1) 🎯 MVP

**Goal**: A user can open the "Add category" sheet, pick an emoji from the grid, type a name, choose a bucket pill, and save. A live preview card reflects all selections in real time.

**Independent Test**: Open sheet via "Add category" → fill name + emoji + bucket → tap "Create" → category appears in list. Verify with quickstart.md steps 1–6.

### Implementation for User Story 1

- [x] T006 [US1] Implement the sheet header section: `SheetHeader` with bold title ("New Category"), `SheetDescription` as `sr-only`, and custom X `<button>` with `aria-label="Close"` (FR-001, FR-012) in `web/components/categories-page.tsx`
- [x] T007 [US1] Implement the scrollable content wrapper `<div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">` around all form sections (FR-009) in `web/components/categories-page.tsx`
- [x] T008 [US1] Implement the live preview card section: bucket-colored icon background using `getEmojiPreviewColor()`, live name display, bucket/income label (FR-002, SC-002) in `web/components/categories-page.tsx`
- [x] T009 [US1] Implement the name input section: uppercase label, `h-14 rounded-2xl` styled `Input` with placeholder text in `web/components/categories-page.tsx`
- [x] T010 [US1] Implement the 5-column emoji grid picker: 30-emoji scrollable grid (`max-h-[180px]`), ring highlight on selected emoji, toggle-deselect on re-tap (FR-003, FR-004) in `web/components/categories-page.tsx`
- [x] T011 [US1] Implement the type tabs (Expense / Income) within the sheet scrollable content, wiring `onValueChange` to reset `allocationBucket` when switching to income; verify that switching from Expense → Income hides the bucket pills section and updates the preview label to "Income" in `web/components/categories-page.tsx`
- [x] T012 [US1] Implement the allocation bucket pills section: 3-column grid of `BUCKET_PILLS` with icon, label, color-tinted border and background when selected, hidden when `formState.type === "income"` (FR-005, FR-006) in `web/components/categories-page.tsx`
- [x] T013 [US1] Implement the inline error display: `role="alert"` paragraph with `bg-destructive/10` styling inside the scrollable area, above the footer (FR-010) in `web/components/categories-page.tsx`
- [x] T014 [US1] Implement the fixed footer: full-width gradient button (`#c97a5a → #a36248`) labeled "Create", disabled when `!canSave || loading`, `CheckCircle` icon, `rounded-3xl py-6` (FR-007, FR-008, SC-005) in `web/components/categories-page.tsx`
- [x] T015 [US1] Verify `canSave` logic: button must be disabled when name is empty OR (type is expense AND `allocationBucket` is `""`). Test by clearing name field and confirming button becomes disabled (FR-008, SC-005) in `web/components/categories-page.tsx`

**Checkpoint**: All US1 acceptance scenarios pass. User can create an expense category end-to-end. Preview updates live. Emoji toggles. Bucket pills highlight. Save closes sheet and list refreshes.

---

## Phase 4: User Story 2 — Edit an Existing Category (Priority: P2)

**Goal**: Tapping "Edit" on an existing category opens the same sheet pre-populated with the saved name, icon, type, and bucket. The preview card reflects the saved state immediately. Saving updates the category.

**Independent Test**: Trigger edit on an existing category → verify pre-population → change name → tap "Update" → confirm list reflects change. Verify with quickstart.md step 7.

### Implementation for User Story 2

- [x] T016 [US2] Verify `openEdit()` correctly pre-populates `formState` (name, icon, type, allocationBucket) and sets `editingCategory` state in `web/components/categories-page.tsx`
- [x] T017 [US2] Verify the sheet title reads "Edit Category" and the footer button reads "Update" when `editingCategory` is non-null (FR-007) in `web/components/categories-page.tsx`
- [x] T018 [US2] Verify the emoji grid highlights the pre-populated icon on open — confirm `formState.icon === emoji` comparison drives the `isSelected` ring state in `web/components/categories-page.tsx`
- [x] T019 [US2] Verify the bucket pill matching pre-selected bucket highlights correctly on sheet open in `web/components/categories-page.tsx`

**Checkpoint**: All US2 acceptance scenarios pass. Edit sheet opens pre-filled. Changes persist after "Update". No regressions on create flow.

---

## Phase 5: User Story 3 — Dismiss Without Saving (Priority: P3)

**Goal**: The header X button closes the sheet without persisting any form state changes. The footer contains no Cancel button.

**Independent Test**: Open sheet, partially fill the form, tap X → sheet closes, no new/changed category in list. Verify with quickstart.md step 5.

### Implementation for User Story 3

- [x] T020 [US3] Verify the header X button `onClick` calls `setSheetOpen(false)` and that no `Cancel` button exists anywhere in the sheet footer in `web/components/categories-page.tsx`
- [x] T021 [US3] Verify `openCreate()` resets `formState` to empty defaults each time it is called — partial fills from a previous dismissed session must not persist in `web/components/categories-page.tsx`
- [x] T022 [US3] Verify `openEdit()` resets `error` state to `""` on each open — stale error messages must not appear when re-opening the sheet in `web/components/categories-page.tsx`

**Checkpoint**: All US3 acceptance scenarios pass. X button is the sole dismiss path. No stale state survives dismissal.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify constitution compliance, run automated checks, and validate the full quickstart checklist.

- [x] T023 [P] Run `pnpm lint` in `web/` — fix any ESLint errors or warnings introduced by the changes
- [x] T024 [P] Run `npx tsc --noEmit` in `web/` — confirm zero TypeScript errors (strict mode)
- [x] T025 Run `pnpm build` in `web/` — confirm clean Next.js production build with no errors
- [x] T026 Manually verify all 7 steps in `specs/009-category-sheet-redesign/quickstart.md` against the running dev server — time the full create flow (open → icon → name → bucket → save) and confirm it completes within 45 seconds (SC-001); confirm the preview card updates immediately as you type and tap (SC-002)
- [x] T027 Confirm the inline delete flow (confirm/cancel buttons on category cards) is unaffected by the sheet changes — no regressions on the list UI in `web/components/categories-page.tsx`
- [x] T028 Verify server-error inline display: force a save failure (e.g., temporarily break the network or stub an error response) and confirm the error message appears inside the scrollable area with `role="alert"` and the sheet remains open (FR-010, EC-002) in `web/components/categories-page.tsx`

**Checkpoint**: Lint, typecheck, and build all exit with code 0. All quickstart verification steps pass. Inline delete flow unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — blocks all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 — core MVP increment
- **Phase 4 (US2)**: Depends on Phase 2 only — tests the `openEdit` code path independently; Phase 3 completion is not required
- **Phase 5 (US3)**: Depends on Phase 2 (independent of US1 and US2)
- **Phase 6 (Polish)**: Depends on Phases 3, 4, and 5 completion

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3 — fully independent after Phase 2
- **US2 (P2)**: No dependency on US1 — shares the same sheet component but tests a different code path (`openEdit` vs `openCreate`)
- **US3 (P3)**: No dependency on US1 or US2 — tests the dismiss path only

### Within Each Phase

- T002 and T003 (constants) can be written in parallel
- T006 through T014 (US1 sheet sections) are sequential within the same file — implement top-to-bottom (header → body → footer)
- T023 and T024 (lint + typecheck) can run in parallel

---

## Parallel Opportunities

```bash
# Phase 1 — constants can be added in parallel (different declarations):
Task T002: Add BUCKET_PILLS constant
Task T003: Add CATEGORY_EMOJIS constant

# Phase 6 — verification can run in parallel:
Task T023: pnpm lint
Task T024: npx tsc --noEmit
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1**: Add icon imports and constants
2. Complete **Phase 2**: Replace sheet container structure
3. Complete **Phase 3**: Implement all US1 sheet sections
4. **STOP and VALIDATE**: Test create flow end-to-end per quickstart.md steps 1–6
5. If MVP is verified, continue to US2 and US3

### Incremental Delivery

1. Phase 1 + Phase 2 → Sheet container ready
2. Phase 3 (US1) → Create flow works → **MVP delivered**
3. Phase 4 (US2) → Edit flow verified
4. Phase 5 (US3) → Dismiss path verified
5. Phase 6 → Polish and sign-off

### Single-Developer Strategy

Since all tasks touch one file, sequential execution is recommended:

1. Phase 1 → Phase 2 → Phase 3 (T006–T015 top-to-bottom)
2. Phase 4 verification → Phase 5 verification
3. Phase 6 automated checks → manual quickstart walkthrough

---

## Notes

- All tasks modify or verify `web/components/categories-page.tsx` only — no other files
- [P] tasks = independent additions with no sequential dependency
- Story labels enable traceability back to spec.md acceptance scenarios
- `canSave` logic at the component level serves as the primary guard for FR-008 and SC-005
- No database migrations, no new dependencies, no new files
