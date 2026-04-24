# Pitfalls: Calendar Layout Bug Fix

**Project:** Intent Expense Tracker — Date Picker Visual Bug Fix
**Researched:** 2026-04-23
**Scope:** Making shadcn/ui Calendar compact and inline inside a bottom Sheet

---

## Summary

The current implementation renders `<Calendar>` inside a `<PopoverContent>`, which uses `<PopoverPrimitive.Portal>` to teleport the calendar outside the Sheet's DOM subtree. The fix goal (PROJECT.md DATE-01/02/03) is a compact inline calendar that lives directly in the Sheet's scrollable `flex-col` container.

Three categories of mistakes are common in this migration:

1. **Structural traps** — fixing visual symptoms (overflow, overlap) with layout hacks instead of addressing root causes (the popover portal escaping the scroll context, `--cell-size` driving all dimensions).
2. **CSS specificity traps** — Tailwind CSS 4.x's `@theme inline` + CSS custom property system means component-level overrides need to come via the same variable mechanism; arbitrary value workarounds break in unexpected ways.
3. **react-day-picker v9 classNames traps** — the shadcn Calendar wrapper merges `defaultClassNames` with custom `classNames` using `cn()`. Adding styles without understanding merge order produces silent wins that get overwritten by the base.

---

## Pitfalls

---

### Pitfall 1: Replacing Popover with inline Calendar but forgetting `w-full` on the root

**What goes wrong:** When the `<Popover>` is removed and `<Calendar>` is placed directly in the sheet body, the calendar renders at `w-fit` (the default `root` className in `calendar.tsx` line 44: `cn("w-fit", defaultClassNames.root)`). It appears narrow and misaligned, but the real width is working — the calendar just isn't filling the available space. Developers chase the wrong problem and start adding outer wrappers with explicit widths.

**Why it happens:** The `Calendar` component's `root` classNames key defaults to `w-fit`. This is intentional for popover use (it should hug content) but wrong for inline use. The fix needs to pass `classNames={{ root: "w-full" }}` to the `Calendar` prop.

**Warning signs:**
- Calendar appears narrowly centered or left-aligned within a wider sheet
- Adding `className="w-full"` to the `Calendar` tag has no effect (because `className` goes on the outermost `DayPicker` wrapper, not the `Root` slot)

**Prevention:** Always pass both `className="w-full"` (for the `DayPicker` element) and `classNames={{ root: "w-full" }}` (for the inner `Root` component slot) when using the calendar inline. The existing `transaction-sheet.tsx` popover already does this at line 473 — carry it forward.

**Phase:** Address in Phase 1 (structural migration from Popover to inline).

---

### Pitfall 2: Changing `--cell-size` via `className` prop instead of the CSS variable

**What goes wrong:** `--cell-size` is the single source of truth for button height, button width, nav height, caption height, and the `min-w` of day buttons (see `calendar.tsx` lines 32, 56–57, 65, 163, 204). Developers try to shrink the calendar by adding Tailwind classes like `[&_.rdp-day]:h-7` or setting hardcoded sizes on the `day` classNames key, but the cells don't shrink uniformly. The navigation height and caption row stay at the old size, creating misaligned rows.

**Why it happens:** All sizing in this component flows from `--cell-size`. Overriding one element class breaks the proportional relationship. The correct approach is to lower the CSS variable: `[--cell-size:1.75rem]` or smaller.

**Warning signs:**
- Day buttons shrink but nav arrows and month caption stay tall
- Rows have inconsistent heights (some cells square, some not)
- `aspect-square` on the `day` class fights an explicit `h-*` override and produces rectangular cells

**Prevention:** Only adjust size via the `--cell-size` CSS variable. Set it in the `className` prop on `<Calendar>`: `className="w-full [--cell-size:1.75rem]"`. The current popover instance uses `[--cell-size:2.25rem]` (line 472) — the default is `2rem`. For compact inline use, `1.75rem` or `1.6rem` is appropriate without making tap targets too small on mobile.

**Phase:** Address in Phase 1 alongside structural migration.

---

### Pitfall 3: Using `overflow-hidden` on the Sheet scroll container to "clip" calendar overflow

**What goes wrong:** The Sheet's scrollable div (`flex-1 overflow-y-auto`, line 292 of `transaction-sheet.tsx`) clips overflow along both axes when `overflow-hidden` is applied. Developers add `overflow-hidden` to the inner container or to the Calendar's wrapper div thinking it will contain the calendar, but it breaks the horizontal category chip scroll row (`-mx-6` negative margin / `overflow-x-auto` at lines 405–407). Those chips start clipping, and focus rings on day buttons become invisible.

**Why it happens:** `overflow-hidden` on a flex child creates a new stacking context and clips all overflow including the intentional horizontal scroll and any `ring` decorations that extend outside the element boundary.

**Warning signs:**
- Category chips row loses its fade-out gradient or stops scrolling
- Focus ring on selected date or today's date is clipped at the left/right edge
- Console shows no errors but the layout looks broken on mobile

**Prevention:** Do not add `overflow-hidden` to the sheet scroll container or any ancestor of the calendar. Size the calendar to fit naturally. The correct fix is reducing `--cell-size` and removing `showOutsideDays` (pass `showOutsideDays={false}`) to drop the row count from 6 to 4–5 rows in most months.

**Phase:** Phase 1 (avoid during structural migration). Flag as a code-review check.

---

### Pitfall 4: Removing the Popover causes the calendar to push the "Add" button out of view on short viewports

**What goes wrong:** When the calendar is inline, it adds roughly `(header 2rem) + (weekday row 2rem) + (5–6 week rows × 2rem each) + (padding) ≈ 18–20rem` of height to the sheet body. On devices with short viewports (iPhone SE, ~568px), this combined with the amount input, type toggle, bucket selector, and category chips means the textarea and "Add" button are pushed below the viewport even though the container has `overflow-y-auto`. The user has to scroll but doesn't know to scroll, so the button appears missing.

**Why it happens:** The sheet uses `max-h-[90vh]` with `flex-1 overflow-y-auto` on the body, so content is theoretically scrollable. But the "Add" button lives in the sticky footer (`border-t bg-card px-6 pb-8 pt-4`), which is correctly outside the scroll container. The actual problem is visual: when the calendar is inline, the total scrollable content height makes the button invisible on first render — it exists but is below the fold inside the scroll area, which the user doesn't see.

**Warning signs:**
- On a 375×667 device (iPhone SE) the "Add" button is not in the initial viewport
- User has to scroll down to see the button, but nothing indicates scrolling is needed

**Prevention:**
- Use `showOutsideDays={false}` to prevent a 6-row calendar month (saves ~2rem)
- Reduce `--cell-size` to `1.75rem` (saves ~2.5rem total grid height)
- Keep the "Add" button in its fixed footer outside the scroll container (it already is — do not move it inside)
- Consider reducing the textarea from `h-20` to `h-16` when the calendar is expanded
- Do NOT try to fix this with `max-h` on the calendar itself and `overflow-y-scroll` — that creates a scroll-within-scroll on mobile which feels broken

**Phase:** Phase 1 critical path. Affects DATE-03 directly.

---

### Pitfall 5: Tailwind CSS 4.x arbitrary variants failing to override react-day-picker default styles

**What goes wrong:** react-day-picker v9 ships with its own CSS file (`react-day-picker/dist/style.css`). If that CSS is imported anywhere (many tutorials include `import 'react-day-picker/dist/style.css'`), it injects base styles that conflict with the shadcn classNames approach. Tailwind 4.x's cascade handles specificity differently from Tailwind 3.x — utility classes no longer automatically win over component styles because Tailwind 4 generates CSS in `@layer utilities`, and an un-layered external stylesheet (like react-day-picker's) can outrank utilities.

**Why it happens:** The existing `calendar.tsx` is correctly shadcn-style and does NOT import the react-day-picker CSS. However, if a developer follows a react-day-picker v9 migration guide and adds the `import` statement, it breaks all the carefully crafted `classNames` overrides silently — styles appear to apply but get overridden at render.

**Warning signs:**
- Day buttons show a default blue selected color instead of the app's `--primary` orange
- `data-[selected-single=true]` pseudo-class styles have no visible effect
- The month navigation buttons show browser-default focus rings instead of the app's ring

**Prevention:** Do not add `import 'react-day-picker/dist/style.css'` anywhere. The shadcn Calendar approach is CSS-module-free by design. Verify the import is absent in the project root and in any component that renders `<Calendar>`. The current codebase is clean — keep it that way.

**Phase:** Phase 1. Enforce in code review as a must-not-add import check.

---

### Pitfall 6: `classNames` prop merge order — passing `classNames` that get silently overridden

**What goes wrong:** The `Calendar` component in `calendar.tsx` builds its final `classNames` object as a spread: `classNames={{ ...builtClassNames, ...classNames }}` (line 125: `...classNames`). This means caller-supplied `classNames` correctly override the defaults. However, if a developer passes `classNames` at the `DayPicker` level via `...props` (rather than through the named `classNames` prop), the merge does not happen and the default wins. This is especially subtle when the component is wrapped.

**Why it happens:** React-day-picker v9 `classNames` is a flat object, not a recursive merge. If a wrapper component destructures `classNames` from props and passes it separately from `...props`, the final object is last-write-wins. The `defaultClassNames` spread inside `cn()` calls at the leaf level (e.g., line 88: `cn("flex", defaultClassNames.weekdays)`) always appends rdp defaults, so custom classes are present but may be overridden in specificity if they collide with defaults.

**Warning signs:**
- A `classNames` override applied at the call site has no visible effect
- `cn()` receives the right strings but the computed CSS is wrong
- Removing the `defaultClassNames` spread from one of the `cn()` calls "fixes" it (a false signal — the real fix is specificity, not removal)

**Prevention:** When adding compact-mode overrides to the Calendar's call site in `transaction-sheet.tsx`, always use the `classNames` prop (not `className` sub-objects). Test by temporarily setting a bright background on `week` or `weekday` slots to confirm the override is reaching the DOM. Do not remove `defaultClassNames` references from `calendar.tsx` — they are intentional for accessibility state classes.

**Phase:** Phase 1 and Phase 2 (any subsequent style tuning).

---

### Pitfall 7: The "selected date row appears inside the calendar grid" bug — caused by the Popover approach, not a calendar bug

**What goes wrong:** DATE-02 describes the selected-date row appearing "trapped mid-grid." This symptom is specific to how the Popover interacts with the Sheet's stacking context, not a react-day-picker rendering bug. Developers may spend time debugging calendar internals (classNames for `selected`, `today`, `day`) when the actual issue is that the Popover's `PopoverContent` renders inside a `Portal` (line 16 of `popover.tsx`) and the Sheet also uses `SheetPortal`. When two portals are nested in z-index calculation, the Popover can appear clipped or partially behind the Sheet overlay on some browsers, making it look like content is "inside" the grid.

**Why it happens:** Both `<SheetPortal>` and `<PopoverPrimitive.Portal>` append to `document.body`. The visual stacking depends on DOM insertion order, not the z-index of ancestors. Radix UI manages z-index via CSS variables (`--radix-*`), but when a Popover opens inside an open Sheet, both are competing for the same stacking context. The result is browser-dependent.

**Warning signs:**
- The issue is only visible on certain browsers or after the sheet animation completes
- The selected-date display is correct in isolation but wrong when inside the sheet
- Changing z-index on the Popover makes it worse, not better

**Prevention:** This pitfall is eliminated entirely by migrating to an inline calendar (the target state). Do not invest time tuning Popover z-index values — the fix is the architectural change to inline rendering.

**Phase:** Confirms the approach. Do not pursue Popover fixes.

---

### Pitfall 8: `showOutsideDays={true}` (the current default) forces a 6-row calendar in some months

**What goes wrong:** When `showOutsideDays` is `true` (the current default in `calendar.tsx` line 17), react-day-picker always renders enough rows to fill the month including leading/trailing days from adjacent months. Months like October 2023 start on a Sunday and have 31 days, requiring 5 rows. But April 2026 starts on a Wednesday — with outside days visible, this can require 6 rows. Six rows × `--cell-size` height = the calendar grows taller by one full row (~2rem at default size), making the overflow worse on the exact months the user is most likely to encounter.

**Why it happens:** Showing outside days is a UX nicety but has a layout cost. When `showOutsideDays={false}`, react-day-picker renders only the rows needed for the current month's days (typically 4–5 rows). This recovers 2–4rem of vertical space.

**Warning signs:**
- The calendar fits in some months but overflows in others (intermittent overflow report)
- Tests or screenshots taken in a short-row month pass but user reports bug in a 6-row month

**Prevention:** Set `showOutsideDays={false}` on the inline Calendar instance in `transaction-sheet.tsx`. This is a call-site override — the default in `calendar.tsx` can stay `true` for other uses (like the budgets/recurring pages). The inline instance is the only one that needs the compact treatment.

**Phase:** Phase 1. Include in the initial compact-calendar implementation.

---

### Pitfall 9: Applying `flex-shrink` or `min-h-0` to the Calendar expecting the grid to shrink

**What goes wrong:** When the sheet body runs out of space, a common instinct is to add `flex-shrink` or `min-h-0` to the Calendar's container to allow it to compress. This has no effect on the calendar grid because the grid rows are driven by `--cell-size` (a fixed length) and `aspect-square` on the day cells. The calendar does not have `flex` children that can shrink — it is table-based (`<table>`, `<tr>`, `<td>`). Adding `overflow: hidden` + `min-h-0` makes the bottom rows invisible rather than smaller, which looks like a successful fix in a short month but cuts off days in a long month.

**Why it happens:** Developers apply flexbox shrink patterns that work on text/image content but not on fixed-cell table layouts.

**Warning signs:**
- The last row of days is missing but there's no scroll to reach it
- `overflow: hidden` + `min-h-0` appears to fix desktop but breaks mobile
- The calendar "fits" but day 29/30/31 are not reachable

**Prevention:** Never try to clip or shrink the calendar table. Size it correctly via `--cell-size` reduction. The only layout properties to touch are on the outer container (the div wrapping `<Calendar>` in the sheet body), and only to control alignment, not to constrain height.

**Phase:** Phase 1. Anti-pattern to flag in code review.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Remove Popover, render Calendar inline | Pitfall 1 (w-fit default), Pitfall 7 (portal z-index — do not chase) | Pass `classNames={{ root: "w-full" }}` + `className="w-full"` |
| Phase 1 | Reduce calendar height | Pitfall 2 (--cell-size), Pitfall 8 (showOutsideDays), Pitfall 9 (flex shrink) | Use `[--cell-size:1.75rem]` + `showOutsideDays={false}` only |
| Phase 1 | Ensure Add button never obscured | Pitfall 4 (button below fold) | Keep footer outside scroll container; verify on 375×667 viewport |
| Phase 1 | Apply compact styles | Pitfall 3 (overflow-hidden), Pitfall 6 (classNames merge) | No overflow-hidden; verify classNames prop path |
| Phase 1 | Code review gate | Pitfall 5 (react-day-picker CSS import) | Check no `import 'react-day-picker/dist/style.css'` added |
| Phase 2+ | Any style tuning | Pitfall 6 (classNames merge order) | Use `classNames` prop; test with a visible background color |
