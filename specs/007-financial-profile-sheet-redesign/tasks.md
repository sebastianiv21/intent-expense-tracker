# Tasks: Financial Profile Sheet Redesign

**Input**: Design documents from `/specs/007-financial-profile-sheet-redesign/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Scope**: All tasks modify a single file — `web/components/financial-profile-sheet.tsx` — unless otherwise stated. Tasks must be completed sequentially within each phase.

## Format: `[ID] [Story] Description`

- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- No [P] markers: all tasks touch the same file; parallel execution is not applicable

---

## Phase 1: Setup (Shared Foundation)

**Purpose**: Refactor the bucket data source so all subsequent phases build on the canonical `BUCKET_DEFINITIONS` from `finance-utils` instead of a local duplicate array.

- [x] T001 Replace the local `BUCKETS` constant in `web/components/financial-profile-sheet.tsx` with `BUCKET_DEFINITIONS` and `BUCKET_ORDER` imported from `@/lib/finance-utils`; update the `.map()` call in the existing slider section to use `BUCKET_ORDER.map((key) => ({ key, ...BUCKET_DEFINITIONS[key] }))` so all colour, label, and key values come from the single source of truth

- [x] T001b Fix cancel/restore state in `web/components/financial-profile-sheet.tsx`: the component is always mounted (never conditionally rendered), so `useState` does not re-initialize on re-open — dirty values from a cancelled edit persist. Add a `resetState` function that calls `setIncome(profile.monthlyIncomeTarget.toString())`, `setBuckets({ needs: Number(profile.needsPercentage), wants: Number(profile.wantsPercentage), future: Number(profile.futurePercentage) })`, and `setError("")`; call `resetState()` inside the Cancel button's `onClick` handler before `onOpenChange(false)`, and also at the start of `handleSave`'s error path if needed; this fixes spec edge case 5 ("original saved values must be restored on next open")

**Checkpoint**: The sheet renders identically to before — no visual change. Cancel after editing restores original saved values on re-open. `pnpm lint` passes.

---

## Phase 2: User Story 1 — Visualise Allocation at a Glance (Priority: P1) 🎯 MVP

**Goal**: Display a live segmented allocation bar and an informative validation counter that together communicate the budget split at a glance without requiring the user to read any numbers.

**Independent Test**: Open the financial profile sheet. A coloured horizontal bar appears immediately below the "Allocation split" label, sized proportionally to saved bucket percentages. Drag any slider — the bar updates in real time. With a total below 100%, a neutral remainder segment and a "−X% remaining" counter appear. At exactly 100%, the counter text turns green.

- [x] T002 [US1] Add the segmented allocation bar to `web/components/financial-profile-sheet.tsx`: insert a `div` with `className="flex rounded-full overflow-hidden h-2"` directly below the `<Label>Allocation split</Label>` line; render one child `div` per bucket using `BUCKET_ORDER` with `style={{ width: \`${buckets[key]}%\`, backgroundColor: color }}` and `className="motion-safe:transition-all motion-safe:duration-200"`; append a remainder `div` with `style={{ width: \`${Math.max(0, 100 - total)}%\` }}` and `className="bg-muted/40 motion-safe:transition-all motion-safe:duration-200"` when `total < 100`; add `aria-label={\`Allocation: Needs ${buckets.needs}%, Wants ${buckets.wants}%, Future ${buckets.future}%\`}` to the outer container

- [x] T003 [US1] Update the validation counter in `web/components/financial-profile-sheet.tsx`: replace the static `{total}% / 100%` text with a derived string — `total === 100 ? "100%" : total < 100 ? \`−${100 - total}% remaining\` : \`+${total - 100}% over\``; keep the existing conditional `className` logic (`text-income` when valid, `text-destructive` otherwise); this replaces only the text content, no structural change

**Checkpoint**: US1 is fully functional. The bar renders on open, updates on drag, shows remainder when unbalanced, and shows green "100%" when balanced. `pnpm lint` passes.

---

## Phase 3: User Story 2 — Adjust Sliders with Rich Per-Bucket Feedback (Priority: P2)

**Goal**: Give each slider a styled thumb/track in its bucket colour and show a currency chip below each slider that reflects the exact dollar allocation — hidden entirely when no income is set.

**Independent Test**: Enter any positive income value. Each slider displays a pill below it showing the correctly calculated dollar amount in the bucket's colour on a matching tint background. Change the income value — all three chips update. Clear the income field — all chips disappear.

- [x] T004 [US2] Style the `<input type="range">` elements in `web/components/financial-profile-sheet.tsx`: replace the bare native input with one that has `className={cn("w-full appearance-none cursor-pointer rounded-full", "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing", "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full")}` and keep `style={{ accentColor: color }}`; wrap each slider's parent `div` with `className` that includes `min-h-[44px]` to meet the 44×44px touch target requirement

- [x] T005 [US2] Add bucket amount chips to `web/components/financial-profile-sheet.tsx`: below each range input, conditionally render (only when `incomeNum > 0`) a `<span>` with `className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums"`, `style={{ color, backgroundColor: \`${color}18\` }}`, `aria-hidden="true"`, containing `{formatCurrency((incomeNum * buckets[key]) / 100)} / month`; remove the existing `{incomeNum > 0 && (<p className="text-xs text-muted-foreground">...` paragraph that was serving this purpose

**Checkpoint**: US2 is fully functional (builds on US1). Sliders are visually styled, chips show correct amounts, and chips are absent when income is zero. `pnpm lint` passes.

---

## Phase 4: User Story 3 — Understand Income Input with Annual Preview (Priority: P3)

**Goal**: Make the income input the dominant visual element in the sheet and add a one-line annual equivalent preview that updates as the user types.

**Independent Test**: Open the sheet. The income input is visually larger than the slider labels. Type any positive number — a line reading "= $X,XXX / year" (correctly calculated) appears immediately below. Clear the field — the line disappears.

- [x] T006 [US3] Update the income `<Input>` in `web/components/financial-profile-sheet.tsx`: change `className="pl-7 text-lg font-semibold"` to `className="pl-9 text-2xl font-bold"`; update the `$` prefix `<span>` left padding to match (e.g. `left-3` → keep or adjust so the dollar sign aligns with the larger text baseline); no other structural changes

- [x] T007 [US3] Add the annual income preview to `web/components/financial-profile-sheet.tsx`: immediately after the closing `</div>` of the income input wrapper, render `{incomeNum > 0 && (<p className="text-xs text-muted-foreground tabular-nums">= {formatCurrency(incomeNum * 12)} / year</p>)}`; this must be hidden when `incomeNum <= 0` (the `|| 0` fallback in the existing `incomeNum` derivation already handles NaN/empty)

**Checkpoint**: US3 is fully functional. Income input is visually prominent, annual preview appears and updates correctly, and disappears when income is absent. `pnpm lint` passes.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify edge cases defined in the spec and validate the full component with tooling.

- [ ] T008 Manually verify all edge cases and success criteria in `web/components/financial-profile-sheet.tsx`: (a) all sliders at 0% → bar empty, save disabled; (b) one slider at 100%, others at 0% → bar shows one full-width segment, counter shows "100%" in green, save enabled if income > 0; (c) sliders sum to > 100% → counter shows "+X% over" in destructive, save disabled; (d) income set to a very large value (e.g., 999999999) → chip and annual preview display without horizontal overflow; (e) cancel after changes → re-open sheet shows original saved values unchanged (verifies T001b fix); (f) SC-003: open sheet, set valid income and balanced allocation, tap Save — total elapsed time must be comfortably under 60 seconds on a real or emulated mobile device at 375px width

- [x] T009 Run `pnpm lint` and `pnpm build` from the `web/` directory; fix any TypeScript type errors, ESLint violations, or build failures introduced by the changes to `web/components/financial-profile-sheet.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start here
- **Phase 2 (US1)**: Depends on Phase 1 (T001 + T001b must complete first)
- **Phase 3 (US2)**: Depends on Phase 1; independent of Phase 2 but logically builds on it visually
- **Phase 4 (US3)**: Depends on Phase 1; fully independent of US1 and US2
- **Phase 5 (Polish)**: Depends on all prior phases complete

### User Story Dependencies

- **US1 (P1)**: Requires T001 + T001b. No dependency on US2 or US3.
- **US2 (P2)**: Requires T001 + T001b. No dependency on US1 or US3.
- **US3 (P3)**: Requires T001 + T001b. No dependency on US1 or US2.

All three user stories can begin after T001 completes and proceed independently. Single-developer recommendation: complete in priority order (US1 → US2 → US3).

### Within Each Phase

- T002 before T003 (bar renders before counter text is updated — easier to verify visually)
- T004 before T005 (style the slider container first, then add chip below it)
- T006 before T007 (resize the input before adding the line beneath it)
- T008 before T009 (manual verification before final lint/build gate)

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: T001
2. Complete Phase 2: T002 → T003
3. **STOP and VALIDATE**: The allocation bar and counter are fully functional — this is independently shippable.

### Full Feature

1. Phase 1: T001
2. Phase 2: T002 → T003 (US1 complete)
3. Phase 3: T004 → T005 (US2 complete)
4. Phase 4: T006 → T007 (US3 complete)
5. Phase 5: T008 → T009 (polish and gate)

---

## Notes

- All tasks are in `web/components/financial-profile-sheet.tsx` — avoid editing the same file concurrently
- Use `cn()` from `@/lib/utils` for all className merging
- Use `BUCKET_DEFINITIONS[key].color` (not hardcoded hex) for all colour references after T001
- `formatCurrency` is already imported in the existing component — do not re-import
- `pnpm lint` must pass after every phase before proceeding
- Commit after each phase with a conventional commit message (e.g., `feat: add segmented allocation bar`)
