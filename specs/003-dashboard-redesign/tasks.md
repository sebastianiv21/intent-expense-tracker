# Tasks: Dashboard Visual Redesign

**Input**: Design documents from `/specs/003-dashboard-redesign/`  
**Branch**: `003-dashboard-redesign`  
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/ ✓ quickstart.md ✓

**Tests**: Not included (no TDD requirement in spec). Verification via `pnpm lint`, `pnpm build`, and manual checklist in `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete task dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Foundational (Blocking Prerequisite)

**Purpose**: Add the `--warning` design token required by the bucket state icons in US2. Must complete before US2 tasks begin.

**⚠️ CRITICAL**: US2 bucket icon coloring (`text-warning`) depends on this token.

- [ ] T001 Add `--warning: #f59e0b` to `:root` block and `--color-warning: var(--warning)` to `@theme inline` block in `web/app/globals.css`

**Checkpoint**: Token available — US1 and US2 implementation can now begin

---

## Phase 2: User Story 1 — Balance Hero + Inline Quick Stats (Priority: P1) 🎯 MVP

**Goal**: The monthly balance is the visually dominant element on the page; the three quick stats (daily avg, safe to spend, days remaining) appear inline within the balance card instead of as three separate peer-level cards.

**Independent Test**: Load the dashboard. Confirm the balance number is `text-4xl font-bold tracking-tight`, renders in `text-destructive` when negative, and the quick stats appear below the income/expenses line inside the same card — not as separate cards below.

- [ ] T002 [US1] Increase balance figure typography from `text-3xl font-semibold` to `text-4xl font-bold tracking-tight` and apply `text-destructive` conditionally when `data.balance < 0` using `cn()` in `web/app/(app)/page.tsx`
- [ ] T003 [US1] Add a `flex items-center divide-x divide-border mt-4 pt-4 border-t border-border` quick stats strip inside the balance `CardContent`, after the income/expenses line, with three inline stat groups (label `text-xs text-muted-foreground` + value `text-sm font-semibold`) in `web/app/(app)/page.tsx`
- [ ] T004 [US1] Remove the three standalone quick-stat `<Card>` components (daily avg spend, safe to spend, days remaining) that currently render as a `grid gap-4 sm:grid-cols-3` section in `web/app/(app)/page.tsx`

**Checkpoint**: US1 complete — balance hero is prominent, quick stats inline, three peer stat cards gone

---

## Phase 3: User Story 2 — 50/30/20 Budget Grid (Priority: P2)

**Goal**: All three budget buckets are visible simultaneously on viewports ≥ 640px without horizontal scrolling. Each bucket communicates its state (on-track / nearing limit / over-budget) via both color and a lucide-react icon.

**Independent Test**: With the bucket section visible on a ≥640px viewport, confirm: (1) no horizontal scroll bar, (2) each card shows an icon alongside the percentage, (3) a bucket with >80% spend shows `AlertTriangle`, a bucket with >100% spend shows `AlertCircle`, and an on-track bucket shows `CheckCircle2`.

- [ ] T005 [P] [US2] Create `web/components/bucket-card.tsx` as a Server Component with props `{ bucket, label, color, spent, target, progress }` matching `BucketSummary`; derive state from `spent`/`target` thresholds (on-track < 80%, nearing limit 80–99%, over-budget ≥ 100%); render `CheckCircle2` / `AlertTriangle` / `AlertCircle` from lucide-react with appropriate color classes (`text-warning`, `text-destructive`, or inline bucket color); use shadcn `Progress` for the bar and `formatCurrencyCompact` for amounts
- [ ] T006 [US2] Replace bucket container `flex gap-4 overflow-x-auto pb-2` with `grid grid-cols-1 sm:grid-cols-3 gap-3` and remove `min-w-[220px] flex-1` from inner cards in `web/app/(app)/page.tsx` (depends on T005)
- [ ] T007 [US2] Replace inline bucket card JSX with `<BucketCard key={bucket.bucket} {...bucket} />` inside the new grid in `web/app/(app)/page.tsx` (depends on T006)

**Checkpoint**: US2 complete — 3-column grid with icon+color state indicators, no horizontal scroll

---

## Phase 4: User Story 3 — Hover Micro-Interactions (Priority: P3)

**Goal**: Transaction items and upcoming recurring items show a subtle background shift on hover, signaling interactivity.

**Independent Test**: Hover over a `TransactionItem` — background visibly shifts. Hover over an upcoming recurring item row — same treatment applies. On touch devices, no stuck or broken hover state.

- [ ] T008 [P] [US3] Add `motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30` to the root `<div>` of `web/components/transaction-item.tsx` (the `rounded-xl border border-border bg-card p-4` div) — `motion-safe:` prefix ensures the transition is suppressed when the user has `prefers-reduced-motion: reduce` set
- [ ] T009 [US3] Add `motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30 cursor-default` to the recurring item `<div>` in the `upcomingRecurring.map()` block in `web/app/(app)/page.tsx` (depends on T007) — use `cursor-default` (not `cursor-pointer`) because recurring items have no click action; use `hover:bg-muted/30` (not `/50`) to match TransactionItem hover opacity per FR-006

**Checkpoint**: US3 complete — hover states consistent across transactions and recurring items

---

## Phase 5: User Story 4 — Editorial Typographic Hierarchy (Priority: P4)

**Goal**: Section labels outside of shadcn Cards use a visually distinct treatment that reads as subordinate to the balance hero but distinct from data values, creating three legible levels of text hierarchy across the page.

**Independent Test**: Scan the dashboard and identify at least three visual text levels without reading content: (1) the `text-4xl` balance hero, (2) `text-xs uppercase tracking-wider` section labels, (3) `text-xs text-muted-foreground` supporting labels.

- [ ] T010 [US4] Update the 50/30/20 section heading from `<h2 className="text-lg font-semibold text-foreground">50/30/20 harmony</h2>` to `text-xs font-semibold uppercase tracking-wider text-muted-foreground` and update the "This month" `<span>` label to match `text-xs text-muted-foreground` in `web/app/(app)/page.tsx` (depends on T009)

**Checkpoint**: US4 complete — three-level typographic hierarchy established

---

## Phase 6: Polish & Verification

**Purpose**: Lint, type-check, build verification, and manual checklist validation.

- [ ] T011 Run `pnpm lint` from `web/` and fix any ESLint errors or warnings introduced by the redesign
- [ ] T012 Run `pnpm build` from `web/` and fix any TypeScript type errors or build failures
- [ ] T013 [P] Manually verify the quickstart.md checklist at `specs/003-dashboard-redesign/quickstart.md` — confirm all 13 visual acceptance criteria pass at 360px, 768px, and 1280px viewport widths

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 completion
- **US2 (Phase 3)**: Depends on Phase 1; T005 can run in parallel with Phase 2 (different file); T006–T007 depend on T004 (same file)
- **US3 (Phase 4)**: T008 [P] can run any time (different file); T009 depends on T007
- **US4 (Phase 5)**: T010 depends on T009 (same file, sequential edits to `page.tsx`)
- **Polish (Phase 6)**: Depends on all story phases complete

### Within-Story Task Order

```
T001 (foundational)
  ├── T002 → T003 → T004   (US1, sequential - same file)
  ├── T005                  (US2, parallel with US1 - different file)
  └── T008                  (US3, parallel with US1/US2 - different file)

T004 + T005 → T006 → T007  (US2 completion, same file)
T007 → T009                 (US3 page.tsx edit)
T009 → T010                 (US4 page.tsx edit)
T010 → T011 → T012 → T013  (Polish, sequential)
```

### Parallel Opportunities

- **T005** (create `bucket-card.tsx`) can run in parallel with T002–T004 — completely different file
- **T008** (hover on `transaction-item.tsx`) can run in parallel with any Phase 2 or 3 task — different file
- **T013** (manual verification) can run in parallel with T011/T012 after T010

---

## Parallel Example: Maximum Parallelism After T001

```
After T001 completes:

Thread A: T002 → T003 → T004 → T006 → T007 → T009 → T010
Thread B: T005 (join Thread A at T006)
Thread C: T008 (join Thread A at T009)

After T010:
T011 → T012 → T013
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001)
2. Complete Phase 2: US1 (T002–T004)
3. **STOP and VALIDATE**: Balance hero is prominent, quick stats are inline, no peer stat cards
4. Ship P1 value — most impactful single change

### Incremental Delivery

1. T001 → (T002+T003+T004) → US1 validated
2. + (T005+T006+T007) → US2 validated
3. + (T008+T009) → US3 validated
4. + T010 → US4 validated
5. + T011+T012+T013 → merged to main

---

## Notes

- **No migrations needed**: `pnpm db:generate` and `pnpm db:push` are not required
- **No new npm packages**: All icons (`lucide-react`), transitions (Tailwind CSS 4), and components (shadcn) are already installed
- **`page.tsx` edits are sequential**: T002–T004, T006–T007, T009, T010 all touch the same file — never edit in parallel
- **`bucket-card.tsx` and `transaction-item.tsx` are independent**: T005 and T008 can be worked on at any time
- Each completed story phase should be individually committable per conventional commits format (`feat:`, `refactor:`)
