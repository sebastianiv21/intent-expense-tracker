---
phase: 02-exchange-rate-service
plan: "01"
subsystem: infra
tags: [exchange-rates, neon, drizzle, fawazahmed0, cache, currency]

# Dependency graph
requires: []
provides:
  - "Cache-first exchange rate service: getOrFetchExchangeRate(from, to, date) → number"
  - "exchange_rate_cache table integration with onConflictDoNothing race-safe insert"
  - "Same-currency D-06 shortcut returning 1.0 without I/O"
affects:
  - 03-multi-currency-transactions
  - any phase doing currency conversion in server actions

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cache-first pattern: check DB, return hit, fetch CDN on miss, insert with onConflictDoNothing"
    - "Plain lib module (no 'use server') for reusable async utility"
    - "Number() wrap on Drizzle numeric column to convert string-over-wire to JS number"

key-files:
  created:
    - web/lib/exchange-rates.ts
  modified: []

key-decisions:
  - "fawazahmed0 CDN chosen as free, no-API-key exchange rate source; daily snapshots match 24h cache strategy"
  - "onConflictDoNothing used on cache insert to handle concurrent callers inserting same (from, to, date) triple"
  - "Throw (not null/undefined) on HTTP non-2xx and missing rate key — fail fast, let caller handle"
  - "No 'use server' directive — exchange-rates.ts is a plain async utility, not a Next.js Server Action"
  - "D-06 same-currency shortcut returns 1.0 immediately with no DB or API I/O"

patterns-established:
  - "Rate lookup: always normalize currency codes to uppercase on entry, lowercase only at CDN URL construction"
  - "Numeric DB column: always wrap Drizzle result with Number() before returning"
  - "Cache insert: use .onConflictDoNothing() — never .returning() for cache writes"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: ~45min
completed: 2026-04-22
---

# Phase 02 Plan 01: Exchange Rate Service Summary

**Cache-first exchange rate lookup against Neon's exchange_rate_cache table, falling back to fawazahmed0 CDN on miss, with same-currency shortcut and race-safe insert**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-22T00:00:00Z
- **Completed:** 2026-04-22
- **Tasks:** 2 (1 implementation + 1 human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- Implemented `web/lib/exchange-rates.ts` with single named export `getOrFetchExchangeRate(from, to, date)`
- All four Phase 2 roadmap success criteria confirmed PASS via manual REPL verification against live Neon DB
- Zero new dependencies added — uses only existing Drizzle/Neon stack

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement exchange-rates.ts service** - `5cf40e4` (feat)
2. **Task 2: Verify all four Phase 2 success criteria via REPL** - checkpoint approved by user

**Plan metadata:** (this commit)

## Files Created/Modified
- `web/lib/exchange-rates.ts` - Cache-first exchange rate service; exports `getOrFetchExchangeRate`

## Decisions Made
- Used fawazahmed0 CDN (cdn.jsdelivr.net/npm/@fawazahmed0/currency-api) — free, no API key, daily date-stamped snapshots align with 24h cache policy
- `onConflictDoNothing()` on cache insert avoids duplicate-key errors from concurrent callers hitting the same `(from, to, date)` unique index
- Throws `Error` on HTTP non-2xx or missing rate key — no silent null returns; Phase 3 server actions will catch and return `ActionResult { success: false }`
- No `"use server"` directive — this is a plain reusable lib function, not a mutation action

## Human-Verify Checkpoint Results

All four Phase 2 success criteria confirmed PASS:

| Criterion | Test | Result |
|-----------|------|--------|
| SC-1 | `getOrFetchExchangeRate('COP', 'USD', '2026-04-15')` returns value < 0.001 | PASS (approved by user) |
| SC-2 | Second call for same triple returns from cache (no duplicate DB row) | PASS (approved by user) |
| SC-3 | New date `'2026-04-10'` fetches, inserts row, returns positive rate | PASS (approved by user) |
| SC-4 | `getOrFetchExchangeRate('USD', 'USD', any_date)` returns exactly 1.0 | PASS (approved by user) |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation matched plan spec exactly. TypeScript type-check passed with zero errors in exchange-rates.ts.

## User Setup Required

None - no external service configuration required. fawazahmed0 CDN is a public endpoint requiring no API key.

## Next Phase Readiness

- `getOrFetchExchangeRate` is ready for Phase 3 server actions to call during transaction create/update
- The function is independently verified against live Neon DB — Phase 3 can import and use immediately
- No blockers

## Known Stubs

None.

## Threat Flags

No new security surface introduced beyond what was modeled in the plan's `<threat_model>`. All five STRIDE threats addressed (T-02-01 through T-02-05).

## Self-Check: PASSED

- `web/lib/exchange-rates.ts`: FOUND
- Commit `5cf40e4`: FOUND (feat(02-01): implement cache-first exchange rate service)

---
*Phase: 02-exchange-rate-service*
*Completed: 2026-04-22*
