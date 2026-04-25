---
phase: 01-calendar-fix
plan: "03"
subsystem: ui
tags: [react, shadcn, calendar, tailwind, date-picker, radix-ui]

# Dependency graph
requires: []
provides:
  - Inline toggled Calendar for start date in recurring-page.tsx replacing Popover portal
  - Inline toggled Calendar for end date in recurring-page.tsx replacing Popover portal
  - fromDate constraint on end date Calendar preventing selection before start date
  - Compact calendar sizing via [--cell-size:1.75rem], gap-2, mt-1, p-2, showOutsideDays=false
affects: [01-calendar-fix]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline calendar toggle: Button onClick sets state, Calendar rendered conditionally below trigger"
    - "Compact Calendar props: [--cell-size:1.75rem] + classNames month/week overrides + showOutsideDays=false"

key-files:
  created: []
  modified:
    - web/components/recurring-page.tsx

key-decisions:
  - "Popover portal removed in favor of inline div+conditional Calendar for both date pickers"
  - "Independent toggle state preserved: datePickerOpen for start date, endDatePickerOpen for end date"
  - "fromDate constraint kept on end date Calendar (T-03-02 threat mitigation)"

patterns-established:
  - "Toggle pattern: onClick={() => setState((v) => !v)} on Button, {state && <Calendar .../>} below"
  - "Compact Calendar className: mt-2 w-full rounded-2xl border border-border bg-background p-2 [--cell-size:1.75rem]"

requirements-completed: [DATE-01, DATE-02, DATE-03, SIZE-01, SIZE-02, SIZE-03]

# Metrics
duration: 8min
completed: 2026-04-24
---

# Phase 01 Plan 03: Recurring Page Date Pickers Summary

**Replaced both Radix Popover portal date pickers in recurring-page.tsx with toggled inline Calendars using compact sizing ([--cell-size:1.75rem]) and independent toggle state per picker**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-24T00:00:00Z
- **Completed:** 2026-04-24T00:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Removed Popover/PopoverContent/PopoverTrigger imports (no longer used in file)
- Start date picker now renders Calendar inline with `datePickerOpen` toggle state
- End date picker now renders Calendar inline with `endDatePickerOpen` toggle state (independent)
- Both calendars use compact sizing: `[--cell-size:1.75rem]`, `gap-2`, `mt-1`, `p-2`, `showOutsideDays={false}`
- End date Calendar retains `fromDate` constraint (prevents selecting a date before start date — T-03-02 mitigation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace both Popover date pickers with inline toggled Calendars in recurring-page.tsx** - `02b60a2` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `web/components/recurring-page.tsx` - Both Popover date picker blocks replaced with inline toggled Calendar pattern; Popover imports removed

## Decisions Made

- Used independent state variables (`datePickerOpen` vs `endDatePickerOpen`) matching the existing pattern — no consolidation into a single enum or shared state
- End date `fromDate` prop preserved as-is (already correct in original code, just moved inside the inline block)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three targeted files now have inline Calendar pickers: transaction-sheet.tsx (plan 02), recurring-page.tsx (this plan), and budgets-page.tsx (plan 04)
- No blockers

---
*Phase: 01-calendar-fix*
*Completed: 2026-04-24*

## Self-Check: PASSED

- `web/components/recurring-page.tsx` — exists and modified
- Commit `02b60a2` — verified in git log
- Zero Popover references remaining in file
- Two `--cell-size:1.75rem` instances, two `showOutsideDays={false}`, one `fromDate={` (end date only)
