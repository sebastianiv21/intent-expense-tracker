# Roadmap: Intent Expense Tracker — Multi-Currency Milestone

## Overview

This milestone adds multi-currency transaction recording to an existing single-currency expense tracker. The work proceeds in four strictly sequential phases: first validate the exchange rate provider and migrate the schema (the gate for everything), then build the isolated rate service, then integrate the data layer, and finally add the UI layer on top of a proven foundation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Provider Validation and Schema Foundation** - Confirm COP-capable rate provider and migrate DB schema with correct numeric precision
- [ ] **Phase 2: Exchange Rate Service** - Build the `lib/exchange-rates.ts` cache-first service as a pure, independently verifiable module
- [ ] **Phase 3: Data Layer Integration** - Extend server actions and Zod schemas to accept currency and write all multi-currency fields
- [ ] **Phase 4: UI Layer** - Add currency selector, live preview, dual-display in list and detail, and COP formatter fixes

## Phase Details

### Phase 1: Provider Validation and Schema Foundation
**Goal**: The database schema is correct and the exchange rate provider is confirmed to support COP — all downstream work can proceed on a validated foundation
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05
**Success Criteria** (what must be TRUE):
  1. A live API call confirms which provider (Frankfurter or fawazahmed0) supports COP, and the choice is documented before any code is written
  2. `SELECT * FROM exchange_rate_cache LIMIT 1` succeeds — the table exists with the correct columns and a UNIQUE index on `(from_currency, to_currency, rate_date)`
  3. `SELECT currency, original_amount, exchange_rate FROM transactions LIMIT 1` succeeds — all three new columns exist on the transactions table
  4. `SELECT COUNT(*) FROM transactions WHERE exchange_rate IS NULL` returns 0 — existing rows have defaults applied (currency = 'USD', exchange_rate = 1.0, original_amount = amount)
  5. The `exchange_rate` column is typed `numeric(20,10)` — a value of 0.000244 can be stored and retrieved without truncation
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Document provider decision in STATE.md and update schema.ts with new columns and exchangeRateCache table
- [x] 01-02-PLAN.md — Generate Drizzle migration, add backfill UPDATE, push to Neon database and verify all five success criteria

### Phase 2: Exchange Rate Service
**Goal**: A single service function `getOrFetchExchangeRate(from, to, date)` is working correctly — it returns the right rate from cache or API, stores it, and the conversion math is verified before any form or action code touches it
**Depends on**: Phase 1
**Requirements**: INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Calling `getOrFetchExchangeRate("COP", "USD", "2026-04-15")` returns a value close to 0.000244 (not ~4100, confirming direction is correct)
  2. A second call for the same `(from, to, date)` triple reads from the `exchange_rate_cache` table without making an external API request
  3. A call for a date that is not in cache inserts a new row into `exchange_rate_cache` and returns the fetched rate
  4. Calling `getOrFetchExchangeRate("USD", "USD", any_date)` returns 1.0 without hitting the external API
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Implement getOrFetchExchangeRate service and verify all four success criteria

### Phase 3: Data Layer Integration
**Goal**: Transaction creation and editing fully support multi-currency — the server actions accept a currency field, fetch the correct historical rate, and persist all five currency-related fields correctly, while existing dashboard queries remain unmodified
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-02, DATA-03, ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04
**Success Criteria** (what must be TRUE):
  1. Submitting a new COP transaction (e.g., 50,000 COP) writes `original_amount = 50000`, `currency = 'COP'`, a non-null `exchange_rate`, and `amount` = the correct USD equivalent
  2. Editing a transaction's currency or date re-fetches the rate and updates `amount` and `exchange_rate` — the stored converted amount reflects the new values
  3. Submitting a transaction in the user's base currency (USD) sets `exchange_rate = 1.0` and skips the external API call entirely
  4. The transaction form shows a currency selector defaulting to the user's configured base currency, a live conversion preview while the user types, and amount input that formats per currency (no decimals for COP, 2 for USD)
  5. Dashboard bucket totals and spending aggregates return the same values as before this milestone for all pre-existing transactions
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Extend Transaction type, Zod schemas, finance-utils, and server actions with full multi-currency persistence
- [x] 03-02-PLAN.md — Add currency badge, popover, conversion preview, COP decimal handling, and edit pre-fill to TransactionSheet

### Phase 4: UI Layer
**Goal**: The transaction list and detail views correctly display multi-currency transactions — foreign-currency amounts are shown in their original currency, detail shows the full dual display, and COP formats without unwanted decimal places
**Depends on**: Phase 3
**Requirements**: DISP-01, DISP-02, DISP-03
**Success Criteria** (what must be TRUE):
  1. A COP transaction in the transaction list shows its original COP amount (e.g., COL$50.000) rather than the converted USD amount
  2. Opening a COP transaction's detail view shows: original amount, arrow, converted base-currency amount, exchange rate, and the rate date (e.g., COL$50.000 → $12.50 USD @ 4,000 COP/USD · 2026-04-19)
  3. COP amounts display with 0 decimal places throughout the app (COL$50.000, not COL$50.000,00)
  4. USD amounts continue to display with 2 decimal places — no regression in existing currency formatting
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Fix getCurrencyFormatter to use per-currency decimal places (DISP-03)
- [x] 04-02-PLAN.md — Add multi-currency amount display and inline expansion to TransactionItem (DISP-01, DISP-02)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Provider Validation and Schema Foundation | 0/2 | Not started | - |
| 2. Exchange Rate Service | 0/? | Not started | - |
| 3. Data Layer Integration | 0/2 | Not started | - |
| 4. UI Layer | 0/? | Not started | - |
