# Tasks: Categories Page Redesign

**Input**: Design documents from `/specs/008-categories-page-redesign/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | quickstart.md ✅

**Organization**: Tasks grouped by user story. US1 and US2 (P1) may proceed before US3–US6. US6 (skeleton) can always run in parallel — it lives in a separate file.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel with other [P] tasks (different files or no shared state)
- **[Story]**: Maps to user story from spec.md

---

## Phase 1: Setup

**Purpose**: Verify imports and confirm no new dependencies are required before touching component code.

- [x] T001 Update import statements in `web/components/categories-page.tsx`: (1) confirm `getBucketColor` is imported from `@/lib/finance-utils`; add `getTransactionColor` to the same import (needed for income accent color in T002 and T010); (2) add `Check` and `X` to the `lucide-react` import (needed for inline delete confirmation buttons in US3); (3) add `useRef` and `useEffect` to the `react` import alongside the existing `useMemo` and `useState` (needed for focus management in T009)

**Checkpoint**: Imports ready — all subsequent phases can proceed.

---

## Phase 2: User Story 1 — Scan Categories by Bucket at a Glance (Priority: P1) 🎯 MVP

**Goal**: Each category card visually communicates its allocation bucket through color — a left border stripe and a tinted emoji circle — without relying on text alone. The edit button becomes icon-only for compactness.

**Independent Test**: Load `/categories` with at least one expense category per bucket. Verify each card has a distinct colored left stripe and a tinted emoji circle matching its bucket (sage green for Needs, terracotta for Wants, gold for Future). Income cards show a green treatment. The Edit button shows only the pencil icon with no text label.

- [x] T002 [US1] In the category card container div in `web/components/categories-page.tsx`, derive `accentColor` per card — `getBucketColor(category.allocationBucket)` for expense categories, `getTransactionColor("income")` for income categories — and apply a left border stripe via inline style: `{ borderLeftWidth: "3px", borderLeftStyle: "solid", borderLeftColor: accentColor }`. Remove the static `border-border` left border so the colored stripe shows through.
- [x] T003 [US1] Replace the `bg-muted` class on the emoji circle div in `web/components/categories-page.tsx` with an inline `style={{ backgroundColor: accentColor + "26" }}` (15% opacity hex alpha tint), so the emoji circle reflects the card's bucket color.
- [x] T004 [US1] Remove the "Edit" text label from the edit `<Button>` in the category card in `web/components/categories-page.tsx`, keeping only `<Pencil className="h-4 w-4" />`. Ensure `aria-label={`Edit ${category.name}`}` is present on the button.

**Checkpoint**: US1 complete — bucket identity is visible at a glance on every card.

---

## Phase 3: User Story 2 — Filter by Bucket with Clear Active State (Priority: P1)

**Goal**: The active bucket filter pill displays prominently in its bucket's own color (not the generic accent). Inactive pills are visibly dimmed.

**Independent Test**: Toggle between Needs, Wants, and Future filter pills. The active pill shows its bucket color as text, border, and a tinted background. Inactive pills appear muted/dimmed.

- [x] T005 [US2] In the bucket filter pill buttons in `web/components/categories-page.tsx`, replace the static `"border-accent text-accent bg-accent/10"` active class string with inline styles using `getBucketColor(option.value)` for text color, border color, and a tinted background (`getBucketColor(option.value) + "33"` — 20% opacity). For inactive pills, add `opacity-50` to dim them. Remove the static active/inactive `cn()` class strings for these properties.

**Checkpoint**: US2 complete — active bucket filter is unmistakably distinct from inactive filters.

---

## Phase 4: User Story 3 — Inline Delete Confirmation (Priority: P2)

**Goal**: Deleting a category uses an in-card confirmation flow. The card stays visible in a disabled state while the server processes. On failure, an inline error appears on the card. No browser dialog (`window.confirm`) is used.

**Independent Test**: Tap Delete on a category card. Verify the action area transforms to show "Confirm delete?" with confirm and cancel buttons — no browser popup appears. Tap Confirm and verify the card becomes disabled while processing, then disappears on success. Trigger delete on two cards rapidly and verify only the second shows the confirmation. Test error path by verifying the card restores with an error message on simulated failure.

- [x] T006 [US3] Add three new state variables to `CategoriesPage` in `web/components/categories-page.tsx`: `const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)`, `const [deletingId, setDeletingId] = useState<string | null>(null)`, and `const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null)`.
- [x] T007 [US3] Replace the `handleDelete` function in `web/components/categories-page.tsx` with the new implementation: (1) on trigger — `setConfirmingDeleteId(category.id); setDeleteError(null)`; (2) on confirm — `setConfirmingDeleteId(null); setDeletingId(category.id); setDeleteError(null)`; call `deleteCategory(category.id)`; on success — `setDeletingId(null); router.refresh()`; on failure — `setDeletingId(null); setDeleteError({ id: category.id, message: result.error })`. Remove the `window.confirm` call entirely.
- [x] T008 [US3] Replace the card action area in `web/components/categories-page.tsx`: when `confirmingDeleteId === category.id`, render a "Confirm delete?" text label + a confirm `<Button>` with `<Check className="h-4 w-4" />` and `aria-label="Confirm delete"` + a cancel `<Button>` with `<X className="h-4 w-4" />` and `aria-label="Cancel delete"` (cancel calls `setConfirmingDeleteId(null); setDeleteError(null)`). When `deletingId === category.id`, render the normal Edit/Delete buttons but with `disabled` prop on both. Below the action area, when `deleteError?.id === category.id`, render an inline `<p className="text-xs text-destructive" role="alert">{deleteError.message}</p>`.
- [x] T009 [US3] Add full focus management for the inline confirmation in `web/components/categories-page.tsx` (Constitution Principle IV — WCAG 2.1 AA): (1) create `confirmButtonRefs` using `useRef<Record<string, HTMLButtonElement | null>>({})` and attach `ref={(el) => { confirmButtonRefs.current[category.id] = el }}` to each confirm button; (2) create `deleteButtonRefs` using `useRef<Record<string, HTMLButtonElement | null>>({})` and attach `ref={(el) => { deleteButtonRefs.current[category.id] = el }}` to each delete trigger button; (3) add a `useEffect` on `confirmingDeleteId`: when it changes to a non-null value, call `confirmButtonRefs.current[confirmingDeleteId]?.focus()` to move focus to the confirm button; when it changes to `null` (cancel, dismiss, or error), restore focus via `deleteButtonRefs.current[prev]?.focus()` where `prev` is the previous `confirmingDeleteId` captured in the effect cleanup or a `useRef`.

**Checkpoint**: US3 complete — delete flow is fully inline; no `window.confirm` remains.

---

## Phase 5: User Story 4 — Live Emoji Preview in Sheet (Priority: P2)

**Goal**: The create/edit sheet shows a large live emoji preview above the emoji input that updates as the user types. The allocation bucket selector uses bucket colors for the selected state.

**Independent Test**: Open the create category sheet. Type any emoji into the emoji field and verify a large preview updates instantly above it. When the field is empty, a `•` placeholder is shown. Select each allocation bucket and verify the button highlights in its own bucket color.

- [x] T010 [US4] Above the emoji `<Input>` in the Sheet form in `web/components/categories-page.tsx`, add a centered preview element: a `<div>` with a 64×64 circle styled with `style={{ backgroundColor: (formState.type === "income" ? getTransactionColor("income") : getBucketColor((formState.allocationBucket || "needs") as AllocationBucket)) + "26" }}` containing a `<span className="text-4xl">` that renders `formState.icon || "•"`. This is a pure derived render — no additional state needed.
- [x] T011 [US4] In the allocation bucket selector grid in the Sheet form in `web/components/categories-page.tsx`, update each bucket button's selected state: replace the static `"border-accent text-accent bg-accent/10"` active class with inline styles using `getBucketColor(option.value)` for border color, text color, and background tint (`getBucketColor(option.value) + "33"` — 20% opacity, matching the pill active style from T005 per FR-011).

**Checkpoint**: US4 complete — the sheet provides live feedback on emoji and bucket color before saving.

---

## Phase 6: User Story 5 — Atmospheric Empty State (Priority: P3)

**Goal**: When a bucket or type tab has no categories, the empty state is visually intentional with an icon, heading, description, and a clear call-to-action button.

**Independent Test**: Navigate to any bucket with zero categories. Verify the empty state shows a `📂` icon, a heading ("No categories here"), supporting text describing the action to take, and a "+ Add category" button that opens the create sheet.

- [x] T012 [US5] Replace the dashed-border empty state `<div>` in `web/components/categories-page.tsx` with an atmospheric layout: `<div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">` containing (1) `<div className="text-4xl">📂</div>`, (2) `<p className="font-semibold text-foreground">No categories here</p>`, (3) `<p className="text-sm text-muted-foreground">Add your first one to organize your spending.</p>`, and (4) `<Button onClick={openCreate} variant="outline" className="min-h-[44px]"><Plus className="h-4 w-4 mr-2" />Add category</Button>`.

**Checkpoint**: US5 complete — empty state guides users clearly to the next action.

---

## Phase 7: User Story 6 — Accurate Loading Skeleton (Priority: P3)

**Goal**: The loading skeleton includes pill-shaped placeholders for the bucket filter row, reducing layout shift when content loads.

**Independent Test**: Observe the loading skeleton at `/categories`. Confirm it includes three pill-shaped placeholders between the tab skeleton row and the card list skeletons.

- [x] T013 [P] [US6] In `web/components/skeletons/categories-skeleton.tsx`, add a `<div className="flex gap-2">` row containing three `<Skeleton className="h-10 w-24 rounded-full" />` elements, placed between the existing tab skeleton (`h-12 w-full`) and the card list skeletons. This is parallelizable — separate file from all other tasks.

**Checkpoint**: US6 complete — skeleton layout closely matches the real page layout.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility audit, lint, and build verification across all redesigned elements.

- [x] T014 Audit all new and modified interactive elements in `web/components/categories-page.tsx` (confirm/cancel delete buttons, empty-state CTA button) for `min-h-[44px]` compliance per Constitution Principle I; add the class where missing.
- [x] T015 [P] Run `pnpm lint` from `web/` and resolve any TypeScript or ESLint errors introduced by the redesign in `web/components/categories-page.tsx` and `web/components/skeletons/categories-skeleton.tsx`.
- [x] T016 Run `pnpm build` from `web/` and confirm the production build succeeds with zero errors.

**Checkpoint**: All phases complete — lint clean, build green, redesign ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (US1)**: Depends on Phase 1.
- **Phase 3 (US2)**: Depends on Phase 1. May run after Phase 2 or in the same session.
- **Phase 4 (US3)**: Depends on Phase 1. Independent of US1/US2.
- **Phase 5 (US4)**: Depends on Phase 1. Independent of US1/US2/US3.
- **Phase 6 (US5)**: Depends on Phase 1. Independent of all other stories.
- **Phase 7 (US6)**: No dependencies — different file. Can start any time.
- **Phase 8 (Polish)**: Depends on all prior phases complete.

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (P1) | Phase 1 only | Independent |
| US2 (P1) | Phase 1 only | Independent; shares color pattern with US1 |
| US3 (P2) | Phase 1 only | Independent; adds new state to component |
| US4 (P2) | Phase 1 only | Independent; only touches Sheet section |
| US5 (P3) | Phase 1 only | Independent; only touches empty state block |
| US6 (P3) | None | Separate file — always parallelizable |

### Within Each Phase

- T002 → T003 → T004 (US1 tasks are sequential — related card JSX)
- T006 → T007 → T008 → T009 (US3 tasks are sequential — state then logic then UI then focus)
- T010 → T011 (US4 tasks: preview then form buttons — both in Sheet section)
- T015 → T016 (lint before build)

### Parallel Opportunities

- T013 (US6, skeleton file) is always parallelizable with any categories-page.tsx task
- Once Phase 1 completes, US1/US2/US3/US4/US5 can begin in parallel if multiple developers are working
- T015 (lint) can run in parallel with T016 conceptually, though sequentially is safer

---

## Parallel Example: US6 Alongside US1

```text
# US6 runs independently at any time (separate file):
Task: "T013 [P] [US6] Add pill skeletons to web/components/skeletons/categories-skeleton.tsx"

# Meanwhile, US1 proceeds in categories-page.tsx:
Task: "T002 [US1] Add left border stripe to category cards"
Task: "T003 [US1] Add tinted emoji circle background"
Task: "T004 [US1] Make edit button icon-only with aria-label"
```

---

## Implementation Strategy

### MVP First (US1 + US2 — P1 Stories Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: US1 — bucket color on cards (T002, T003, T004)
3. Complete Phase 3: US2 — active pill state (T005)
4. **STOP and VALIDATE**: Cards show bucket colors; active pill is distinct
5. Run T015 + T016 as a partial verification checkpoint

### Incremental Delivery

1. Setup (T001) → US1 (T002–T004) → validate card colors
2. US2 (T005) → validate active pill
3. US3 (T006–T009) → validate inline delete
4. US4 (T010–T011) → validate emoji preview
5. US5 (T012) → validate empty state
6. US6 (T013) → validate skeleton (can be done any time)
7. Polish (T014–T016) → lint + build clean

### Suggested MVP Scope

**Phases 2 + 3 (US1 + US2)** — The card color identity and filter pill redesign deliver the most visible, immediate improvement with the least risk (read-only rendering changes, no state changes).
