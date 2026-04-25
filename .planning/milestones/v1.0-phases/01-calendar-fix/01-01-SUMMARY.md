---
phase: 01-calendar-fix
plan: 01
subsystem: ui
tags: [react-day-picker, tailwind, shadcn, calendar, date-picker, transaction-sheet]

# Dependency graph
requires: []
provides:
  - "Inline toggled Calendar replacing Radix Popover/Portal date picker in transaction-sheet.tsx"
  - "Compact calendar sizing: --cell-size:1.75rem, p-2, gap-2, mt-1, showOutsideDays=false"
affects: [02-calendar-fix, verifier]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline toggle pattern: onClick={() => setDatePickerOpen((v) => !v)} with conditional render"
    - "react-day-picker classNames: both className prop and classNames.root needed for w-full to apply"

key-files:
  created: []
  modified:
    - web/components/transaction-sheet.tsx

key-decisions:
  - "Replaced Popover/Portal with inline toggle — portal teleports to <body> escaping sheet scroll container"
  - "Used showOutsideDays={false} to prevent 6-row months (April 2026 test case)"
  - "Applied both className w-full and classNames.root w-full — one alone has no effect (react-day-picker v9 pitfall)"

patterns-established:
  - "Inline Calendar toggle: wrap in <div>, Button with onClick toggle, conditional Calendar render"
  - "Compact sizing: [--cell-size:1.75rem] + classNames month/week for gap/margin reduction"

requirements-completed: [DATE-01, DATE-02, DATE-03, SIZE-01, SIZE-02, SIZE-03]

# Metrics
duration: 5min
completed: 2026-04-24
---

# Phase 1 Plan 01: Replace Popover Date Picker with Inline Toggle Calendar Summary

**Radix Popover/Portal date picker replaced with inline toggled shadcn Calendar using compact sizing ([--cell-size:1.75rem], showOutsideDays=false) to fix calendar overflow/overlap bug in the New Awareness transaction sheet**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-24T14:38:00Z
- **Completed:** 2026-04-24T14:39:53Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Removed all Popover/PopoverContent/PopoverTrigger imports and JSX wrappers from transaction-sheet.tsx
- Calendar now renders inline via `onClick={() => setDatePickerOpen((v) => !v)}` toggle — no portal escape
- Compact sizing applied: `[--cell-size:1.75rem]`, `p-2`, `gap-2` (month), `mt-1` (week), `showOutsideDays={false}`
- Zero new TypeScript or ESLint errors introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Popover date picker with inline toggled Calendar** - `2d223ce` (fix)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `web/components/transaction-sheet.tsx` - Removed Popover block (lines 24-28, 443-477); replaced with inline div/Button/Calendar toggle

## Decisions Made

- Used inline toggle instead of Popover: the existing `PopoverPrimitive.Portal` teleports the calendar to `<body>`, bypassing the sheet's scroll container and causing overflow/overlap at the bottom of the sheet.
- Applied `showOutsideDays={false}` to prevent 6-row calendar months (e.g., April 2026) which would overflow the available space.
- Applied both `className="... w-full"` and `classNames={{ root: "w-full" }}` — react-day-picker v9 requires both; the `className` prop targets the wrapper element while `classNames.root` targets the internal root node.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- transaction-sheet.tsx is ready for visual/functional verification
- Calendar renders inline within the sheet scroll container — no portal escape
- Compact sizing reduces total calendar height by ~52px vs. the old 2.25rem cell size

---
*Phase: 01-calendar-fix*
*Completed: 2026-04-24*

## Self-Check: PASSED

- FOUND: web/components/transaction-sheet.tsx
- FOUND: .planning/phases/01-calendar-fix/01-01-SUMMARY.md
- FOUND: commit 2d223ce
- Popover count: 0 (expected 0)
- Toggle lambda count: 1 (expected 1)
- --cell-size:1.75rem count: 1 (expected 1)
- showOutsideDays={false} count: 1 (expected 1)
- --cell-size:2.25rem count: 0 (expected 0)
