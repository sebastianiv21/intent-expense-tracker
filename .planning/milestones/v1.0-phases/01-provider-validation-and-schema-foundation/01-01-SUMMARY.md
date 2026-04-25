---
phase: 01-provider-validation-and-schema-foundation
plan: "01"
subsystem: schema
tags:
  - schema
  - drizzle
  - multi-currency
  - exchange-rates
dependency_graph:
  requires: []
  provides:
    - exchangeRateCache table definition in schema.ts
    - currency/originalAmount/exchangeRate columns on transactions table
    - fawazahmed0 provider decision documented in STATE.md
  affects:
    - web/lib/schema.ts
    - web/drizzle/ (input for drizzle-kit generate in Plan 02)
tech_stack:
  added: []
  patterns:
    - Drizzle uniqueIndex for composite unique constraint
    - numeric(20,10) for high-precision exchange rate storage
    - varchar(3) for ISO 4217 currency codes
key_files:
  created: []
  modified:
    - web/lib/schema.ts
    - .planning/STATE.md
decisions:
  - fawazahmed0 confirmed as exchange rate provider; Frankfurter excluded — no COP support
  - originalAmount stored as notNull to enforce currency tracking on all new transactions
  - exchangeRate stored as numeric(20,10) — COP/USD (~0.000244) would truncate to zero at numeric(12,2)
  - uniqueIndex on (fromCurrency, toCurrency, rateDate) enforces one cached rate per currency pair per date
metrics:
  duration_seconds: 132
  completed_date: "2026-04-20"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 01 Plan 01: Provider Decision and Schema Foundation Summary

**One-liner:** Drizzle schema extended with three transactions columns and exchangeRateCache table; fawazahmed0 confirmed as exchange rate provider with response shape documented.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Document provider decision in STATE.md | 5052951 | .planning/STATE.md |
| 2 | Add multi-currency columns and exchangeRateCache table | 4f09230 | web/lib/schema.ts |

## What Was Built

### STATE.md — Provider Decision
Added the fawazahmed0 confirmation bullet under `### Decisions`:
- Documents that Frankfurter was tested live and does NOT support COP (30 currencies, COP absent)
- Records fawazahmed0 response shape: `{ "date": "...", "cop": { "usd": 0.000277 } }`
- This shape is the contract for all Phase 2+ service code
- Updated `stopped_at` frontmatter to `Phase 1 plan execution started`

### schema.ts — Three Changes

**1. uniqueIndex import** added to `drizzle-orm/pg-core` import block.

**2. Three new columns on `transactions` table** (inserted after `date`, before `createdAt`):
- `currency: varchar("currency", { length: 3 }).notNull().default("USD")` — ISO 4217 code for the transaction's original currency
- `originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull()` — amount in the original currency
- `exchangeRate: numeric("exchange_rate", { precision: 20, scale: 10 }).notNull().default("1.0")` — rate used at recording time

**3. New `exchangeRateCache` table** with columns: `id` (uuid PK), `fromCurrency`, `toCurrency`, `rateDate`, `rate` (numeric 20/10), `fetchedAt`. Composite unique index `exchange_rate_cache_lookup_idx` on `(fromCurrency, toCurrency, rateDate)` enforces one cached rate per pair per day.

## Deviations from Plan

None — plan executed exactly as written.

## TypeScript Compilation Note

Running `tsc --noEmit` from the worktree reports module-not-found errors because the worktree has no `node_modules/`. When run against the main project where dependencies are installed, exit code is 0. Two downstream TS2769 errors appear in `lib/actions/recurring.ts` and `lib/actions/transactions.ts` because `originalAmount` is now `notNull()` and existing insert calls do not pass it — these are expected and will be resolved in the plan that updates the actions layer (Plan 03 or later).

## Known Stubs

None. This plan adds schema definitions only — no UI, no data fetching, no display logic.

## Threat Flags

None. This plan modifies only schema definitions and planning docs. No new network endpoints, auth paths, file access patterns, or trust-boundary changes introduced.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| web/lib/schema.ts exists | FOUND |
| .planning/STATE.md exists | FOUND |
| 01-01-SUMMARY.md exists | FOUND |
| Commit 5052951 (Task 1) | FOUND |
| Commit 4f09230 (Task 2) | FOUND |
