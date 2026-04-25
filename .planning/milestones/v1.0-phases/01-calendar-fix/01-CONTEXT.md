# Phase 1: Calendar Fix - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the date picker visual bug in all three components that use `<Popover> + <Calendar>`. Replace the Popover portal pattern with a toggled inline Calendar rendered directly in the scroll container. Apply compact sizing props. This phase covers layout/behavior fixes only — no new date picker features.

</domain>

<decisions>
## Implementation Decisions

### Scope
- **D-01:** Fix applies to ALL THREE components with the same bug:
  1. `web/components/transaction-sheet.tsx` — 1 date picker (transaction date)
  2. `web/components/recurring-page.tsx` — 2 date pickers (start date + end date)
  3. `web/components/budgets-page.tsx` — 1 date picker (budget start date)

### Structural Fix (Root Cause)
- **D-02:** Remove `<Popover>`, `<PopoverTrigger>`, `<PopoverContent>` wrapper from each date picker. The Popover uses `Portal` which teleports the calendar to `<body>`, escaping the sheet's scroll container and causing the overflow/overlap bug.
- **D-03:** Replace with a plain `<button>` (or keep `<Button variant="outline">`) that toggles `datePickerOpen` state on click. Render `<Calendar>` conditionally inline directly below the trigger button.

### Calendar Toggle Behavior
- **D-04:** Calendar opens AND closes by tapping the trigger button (toggle behavior). Selecting a date also closes it. Both dismiss paths are supported.
- **D-05:** The `datePickerOpen` boolean state already exists in all three components — reuse it. Change `onOpenChange` wiring to `onClick={() => setDatePickerOpen(v => !v)}`.

### Calendar Sizing
- **D-06:** Set `--cell-size` to `1.75rem` (down from `2.25rem` currently in transaction-sheet). This saves ~40px of vertical height.
- **D-07:** Add `showOutsideDays={false}` to prevent 6-row months (e.g. April 2026 at default sizing).
- **D-08:** Reduce inter-row and month gaps via `classNames`:
  - `month: "flex w-full flex-col gap-2"` (was `gap-4`)
  - `week: "mt-1 flex w-full"` (was `mt-2`)
  - Add `p-2` override (was default `p-3`)
- **D-09:** Keep `className="w-full"` and `classNames={{ root: "w-full" }}` on all Calendar instances — both are required for full-width inline rendering.

### Layout When Calendar Open
- **D-10:** Notes textarea (in `transaction-sheet.tsx`) stays visible below the calendar. No hiding or collapsing. The scrollable form body handles vertical overflow naturally — users scroll to reach notes if needed.

### Claude's Discretion
- Exact `autoFocus` behavior on the inline calendar — keep `autoFocus` prop to preserve keyboard navigation
- Whether to keep or remove unused `Popover`, `PopoverContent`, `PopoverTrigger` imports after the fix (remove them to keep the codebase clean)
- In `recurring-page.tsx`, the two date pickers (start + end) should each get independent toggle state — already the case (`datePickerOpen` + `endDatePickerOpen`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary Fix Targets
- `web/components/transaction-sheet.tsx` lines 443–477 — current Popover + Calendar block to replace
- `web/components/recurring-page.tsx` lines 840–935 — two Popover + Calendar blocks (start + end date)
- `web/components/budgets-page.tsx` lines 736–780 — Popover + Calendar block

### Shared Calendar Component
- `web/components/ui/calendar.tsx` — shadcn/ui Calendar wrapper; defines `--cell-size: 2rem` default and all classNames. Read before modifying sizing props.
- `web/components/ui/popover.tsx` — Radix Popover wrapper (uses Portal — root cause of the bug). Imports can be removed from fix targets.

### Research Findings
- `.planning/research/ARCHITECTURE.md` — root cause analysis and recommended fix approach
- `.planning/research/STACK.md` — shadcn Calendar sizing API (`--cell-size`, classNames keys)
- `.planning/research/PITFALLS.md` — 9 specific pitfalls to avoid during implementation
- `.planning/research/SUMMARY.md` — synthesized fix approach with exact code snippet

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `datePickerOpen` / `endDatePickerOpen` boolean state — already exists in all 3 components, just needs `onOpenChange` → `onClick` rewiring
- `<Button variant="outline">` — trigger button keeps same visual style, just loses `asChild` prop
- `web/components/ui/calendar.tsx` — Calendar component is unchanged; only call-site props change

### Established Patterns
- All three components use identical Popover + Calendar pattern — one fix template applies to all
- `format(parseISO(date), "MMMM d, yyyy")` — date display pattern used consistently, keep as-is
- Scrollable sheet body uses `flex-1 overflow-y-auto` — calendar in this flow will scroll naturally
- Footer "Add" button is in a separate pinned `div` with `border-t border-border bg-card` — stays fixed

### Integration Points
- The inline Calendar renders between the trigger button and whatever comes below (textarea in transaction-sheet, more fields in recurring-page)
- No state, action, or query changes required — this is purely a layout/structural fix

</code_context>

<specifics>
## Specific Ideas

- User confirmed: all 3 components with Popover date pickers should be fixed in this phase
- Portal removal is the architectural root cause fix — sizing changes are companions, not the fix itself

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-calendar-fix*
*Context gathered: 2026-04-23*
