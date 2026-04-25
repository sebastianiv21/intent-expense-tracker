---
phase: 01-calendar-fix
plan: "02"
subsystem: ui
tags: [react, shadcn, calendar, tailwind, date-picker, radix-ui]

# Dependency graph
requires: []
provides:
  - Inline toggled Calendar for start date in budgets-page.tsx replacing Popover portal
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
    - web/components/budgets-page.tsx

key-decisions:
  - "Popover portal removed in favor of inline div+conditional Calendar"
  - "formState.startDate setter uses immutable spread: setFormState((prev) => ({ ...prev, startDate: ... }))"

patterns-established:
  - "Toggle pattern: onClick={() => setState((v) => !v)} on Button, {state && <Calendar .../>} below"

requirements-completed: [DATE-01, DATE-02, DATE-03, SIZE-01, SIZE-02, SIZE-03]

# Metrics
duration: 5min
completed: 2026-04-24
---

# Phase 01 Plan 02: Budget Start Date Picker Summary

**Replaced Radix Popover portal date picker in budgets-page.tsx with toggled inline Calendar using compact sizing ([--cell-size:1.75rem])**

## Performance

- **Duration:** 5 min
- **Completed:** 2026-04-24
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Removed Popover/PopoverContent/PopoverTrigger imports (no other usage in file)
- Budget start date picker now renders Calendar inline below trigger button
- Toggle uses `setDatePickerOpen((v) => !v)` lambda pattern
- Calendar uses compact sizing: `[--cell-size:1.75rem]`, `gap-2`, `mt-1`, `p-2`, `showOutsideDays={false}`
- `formState.startDate` setter uses immutable spread pattern

## Files Created/Modified

- `web/components/budgets-page.tsx` — Popover date picker block replaced with inline toggled Calendar; Popover imports removed

## Decisions Made

- Placeholder text "Start date" matches budget context (per plan)
- Icon color `text-primary` (consistent with transaction-sheet pattern)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED

- `web/components/budgets-page.tsx` — exists and modified
- Zero Popover references remaining in file
- One `--cell-size:1.75rem` instance, one `showOutsideDays={false}`
- Toggle lambda `setDatePickerOpen((v) => !v)` present
