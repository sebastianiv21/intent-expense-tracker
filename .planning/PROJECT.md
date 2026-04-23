# Intent Expense Tracker — Multi-Currency Milestone

## What This Is

A personal expense tracker that helps one user manage and categorize spending against intentional budget buckets (needs/wants/future). Currently live with full transaction management, categories, and financial profile in a single currency. This milestone adds multi-currency support so transactions can be recorded in their original currency (COP or USD) and automatically converted to the user's preferred base currency for all reporting.

## Core Value

Every transaction is recorded in the currency it was actually made in, with accurate historical conversion, so totals always reflect true spending in the user's preferred currency.

## Requirements

### Validated

- ✓ User can create account and log in (Google OAuth + email) — existing
- ✓ User can configure a financial profile (income target, budget bucket %, preferred currency) — existing
- ✓ User can add expense/income transactions (amount, category, date, description) — existing
- ✓ User can view and filter transaction history — existing
- ✓ User can view budget bucket breakdown (needs/wants/future) — existing
- ✓ User can manage spending categories — existing
- ✓ App stores preferred currency in financial profile (3-char code, 30 currencies supported in UI) — existing
- ✓ All amounts formatted via locale-aware `useCurrency()` hook — existing

### Active

- [x] Each transaction stores its own currency code (the currency the purchase was made in) — Validated in Phase 01: provider-validation-and-schema-foundation
- [x] Each transaction stores the exchange rate used at the time of recording (rate for transaction date) — Validated in Phase 01: provider-validation-and-schema-foundation
- [ ] Transaction creation UI shows a currency selector per transaction (defaults to user's base currency)
- [x] Exchange rates are fetched from fawazahmed0 CDN for the transaction's date and cached 24h in DB — Validated in Phase 02: exchange-rate-service
- [ ] All dashboard totals and reports display amounts converted to the user's profile currency
- [x] Transaction detail shows original amount + converted amount + rate (e.g., COL$50.000 → $12.50 USD @ 4,000) — Validated in Phase 04: ui-layer
- [ ] Existing transactions are treated as base-currency (USD) with exchange rate = 1.0

### Out of Scope

- Manual rate override per transaction — adds complexity; automatic historical rates are sufficient
- Real-time rate updates (sub-24h refresh) — overkill for daily personal tracking use case
- Multi-currency reports/breakdowns by currency — single converted view is sufficient for v1
- Retroactive correction of historical rates on existing transactions — existing data stays as-is
- Support for crypto or non-standard currency codes — standard fiat codes only (ISO 4217)

## Context

**Codebase state:** Next.js 16 / React 19 / TypeScript, Drizzle ORM + Neon (serverless Postgres), Better Auth, Radix UI + Tailwind v4. Single-user app. Transactions table has `amount numeric(12,2)` with no currency field. Financial profile has `currency varchar(3)` (already supports any currency code).

**Usage pattern:** User makes purchases in COP (Colombia) and USD. Wants to enter amounts in the currency they actually spent (e.g., 50,000 COP) and have everything reported in their configured base currency.

**Exchange rate strategy:** ExchangeRate-API free tier (1,500 req/month). With 24h cache in DB, actual API calls will be a handful per day. Historical rates needed — fetch rate for specific past dates when entering backdated transactions.

**No test coverage exists** — new code should not add complexity without value; keep the implementation straightforward.

## Constraints

- **Tech stack**: Next.js App Router + Drizzle + Neon — no new infrastructure
- **API budget**: ExchangeRate-API free tier (1,500 req/month) — 24h cache is mandatory
- **DB migrations**: Drizzle migrations — any schema changes need a migration file
- **Single user**: App is personal, no multi-tenant concerns
- **No tests**: No existing test framework — don't add test infrastructure as part of this milestone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ExchangeRate-API as rate source | Free tier sufficient at 1,500 req/mo with 24h cache | fawazahmed0 confirmed (Phase 01) — Frankfurter rejected, no COP support |
| Store rate at transaction creation time | Historical accuracy — rate shouldn't change retroactively | `getOrFetchExchangeRate(from, to, date)` returns rate for exact transaction date (Phase 02) |
| Cache rates in DB (not in-memory) | Serverless/edge functions have no persistent memory | exchangeRateCache table live in Neon (Phase 01) |
| Existing transactions default to base currency @ rate 1.0 | No migration risk; old data predates multi-currency | Applied via migration backfill (Phase 01) |
| Per-transaction currency selector (defaults to base) | Most transactions will be in base; COP is the exception | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-23 after Phase 04: ui-layer*
