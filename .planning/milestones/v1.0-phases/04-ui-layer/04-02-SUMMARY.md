---
phase: 04-ui-layer
plan: "02"
subsystem: ui
tags: [transaction-item, multi-currency, cop, usd, expand-collapse, intl, lucide-react]

# Dependency graph
requires:
  - phase: 04-01-PLAN.md
    provides: getCurrencyDecimals hoisted above getCurrencyFormatter; COP formats with 0 decimals
provides:
  - TransactionItem shows originalAmount in transaction.currency for foreign-currency rows (DISP-01)
  - Inline expand/collapse chevron reveals base-amount + inverted rate + date for COP transactions (DISP-02)
affects: [transaction-list, dashboard-recent-transactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isForeign = transaction.currency !== baseCurrency drives conditional display and chevron visibility"
    - "invertedRate guard (invertedRate !== null) prevents Infinity display if exchangeRate is 0 or empty"
    - "formatCurrencyRaw alias pattern: import { formatCurrency as formatCurrencyRaw } to avoid collision with useCurrency().formatCurrency"

key-files:
  created: []
  modified:
    - web/components/transaction-item.tsx

key-decisions:
  - "Chevron click-only expand — outer card div has no onClick to avoid conflicting with DropdownMenu trigger (per D-09)"
  - "pl-[52px] detail-row indent is a documented layout exception: 40px icon + 12px gap = 52px"
  - "Middle dot separator (·) used in detail row for visual consistency with existing date sub-label pattern"

patterns-established:
  - "Foreign-currency display: show originalAmount in txCurrency; expand to reveal base conversion math"
  - "Chevron Button uses min-h-11 min-w-11 (44px touch target) matching existing DropdownMenu trigger"

requirements-completed:
  - DISP-01
  - DISP-02

# Metrics
duration: 12min
completed: 2026-04-23
---

# Phase 4 Plan 02: Multi-Currency TransactionItem Display Summary

**TransactionItem now shows COP transactions in original pesos (e.g., -COL$50,000) with an accent-colored chevron that expands to reveal base-amount, inverted rate, and date; USD transactions are visually unchanged**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-04-23T00:08:00Z
- **Completed:** 2026-04-23T00:20:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `isForeign` detection and conditional `displayAmount` so COP rows show `formatCurrencyRaw(originalAmount, "COP")` (0 decimals) while USD rows remain unchanged
- Added `invertedRate` computation (`Math.round(1 / parseFloat(exchangeRate)).toLocaleString("en-US")`) with null-guard against division-by-zero
- Inserted accent-colored chevron Button (`min-h-11 min-w-11`) between amount div and DropdownMenu — renders only on foreign-currency rows
- Inserted expanded detail row (`pt-2 pl-[52px]`, `text-xs text-muted-foreground`) below inner flex row, guarded by `isForeign && expanded && invertedRate !== null`
- Dashboard "Recent transactions" section benefits automatically (same `TransactionItem` component)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add imports, state, and derived values for multi-currency display** - `2836e6e` (feat)
2. **Task 2: Add chevron button and expanded detail row to TransactionItem JSX** - `31e3b5d` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `web/components/transaction-item.tsx` - Added useState, ChevronDown/Up imports, formatCurrencyRaw alias, isForeign/displayAmount/invertedRate derived values, chevron toggle button, and expanded detail row

## Decisions Made

- Chevron click-only expand (no whole-card click) — avoids conflict with the DropdownMenu trigger per D-09 in CONTEXT.md. No `stopPropagation` needed since click handler is scoped to the Button.
- `pl-[52px]` for detail row left-indent is a documented exception to the 8-point spacing scale: 40px category icon + 12px `gap-3` = 52px, aligning detail text with description column.
- Middle dot `·` separator in detail row matches the existing date sub-label visual pattern rather than the `@` character from CONTEXT.md D-08 example. Both are conformant per UI-SPEC note.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DISP-01 and DISP-02 requirements are complete; COP transactions display their original amounts and expand to show conversion math
- Combined with Plan 01's formatter fix (DISP-03), all Phase 4 multi-currency display requirements are satisfied
- No further changes needed in `transaction-list.tsx` or dashboard pages — they consume `TransactionItem` unchanged

## Self-Check

- `web/components/transaction-item.tsx` — file exists and contains all required patterns
- Task 1 commit `2836e6e` — verified via git log
- Task 2 commit `31e3b5d` — verified via git log
- `pnpm lint` exits 0 (verified during execution)
- Outer card div has no onClick (verified via acceptance criteria grep)

## Self-Check: PASSED

---
*Phase: 04-ui-layer*
*Completed: 2026-04-23*
