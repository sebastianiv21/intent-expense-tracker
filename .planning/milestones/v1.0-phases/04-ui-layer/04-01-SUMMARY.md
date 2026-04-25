---
phase: 04-ui-layer
plan: "01"
subsystem: ui
tags: [finance-utils, intl, currency, formatting, cop, usd]

# Dependency graph
requires: []
provides:
  - getCurrencyDecimals hoisted above getCurrencyFormatter in finance-utils.ts
  - getCurrencyFormatter delegates decimal places to getCurrencyDecimals(currency)
  - COP amounts now format with 0 decimal places; USD unchanged at 2
affects: [ui-components, transaction-sheet, hero-balance-card]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Currency decimal logic centralized in getCurrencyDecimals; formatters delegate to it rather than hardcoding"

key-files:
  created: []
  modified:
    - web/lib/finance-utils.ts

key-decisions:
  - "No JSDoc retained at new getCurrencyDecimals location — self-evident from the function body"
  - "pnpm build DATABASE_URL error treated as environment gate, not a code error (TypeScript compiled successfully)"

patterns-established:
  - "getCurrencyDecimals(currency) is the single source of truth for decimal places — no other formatter should hardcode digit counts"

requirements-completed:
  - DISP-03

# Metrics
duration: 8min
completed: 2026-04-23
---

# Phase 4 Plan 01: Hoist getCurrencyDecimals and Fix getCurrencyFormatter Summary

**`getCurrencyFormatter` now delegates decimal places to `getCurrencyDecimals(currency)`, making COP format as `COL$50,000` (0 decimals) while USD remains `$1.00` (2 decimals)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-23T00:00:00Z
- **Completed:** 2026-04-23T00:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Moved `getCurrencyDecimals` from the Amount Input Helpers section to the Currency Formatter section, above `getCurrencyFormatter`
- Added `const decimals = getCurrencyDecimals(currency)` inside the `if (!formatter)` block of `getCurrencyFormatter`
- Replaced both hardcoded `minimumFractionDigits: 2` and `maximumFractionDigits: 2` with `decimals`
- `getCompactCurrencyFormatter` left entirely unchanged (locked per plan)
- TypeScript strict-mode check passes with zero errors; ESLint shows zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Hoist getCurrencyDecimals and fix getCurrencyFormatter decimal params** - `c8dd2cd` (fix)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `web/lib/finance-utils.ts` - Hoisted `getCurrencyDecimals` above `getCurrencyFormatter`; formatter now uses per-currency decimal count

## Decisions Made

- No JSDoc comment retained at the new `getCurrencyDecimals` location — the function body is self-explanatory; JSDoc was originally placed in the input-helpers section for discoverability there, which no longer applies.
- `pnpm build` exited non-zero due to a missing `DATABASE_URL` env var (runtime environment issue, not a code error). TypeScript compiled successfully ("Compiled successfully in 3.3s") and `pnpm exec tsc --noEmit` exited 0 with no output. Treated as environment gate per project context (Neon DB not accessible in worktree CI).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `pnpm build` failed with `DATABASE_URL environment variable is required` during page data collection. This is an environment-only issue; TypeScript compilation succeeded and `tsc --noEmit` confirmed zero type errors. Lint also passed with zero errors (1 pre-existing warning in an unrelated file `hero-balance-card.tsx`).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `getCurrencyDecimals` is now the single source of truth for decimal places, ready for any subsequent UI plans that format currency amounts
- All callers of `formatCurrency` and `formatCurrencyCompact` automatically benefit from the fix — no further changes needed in consuming components

---
*Phase: 04-ui-layer*
*Completed: 2026-04-23*
