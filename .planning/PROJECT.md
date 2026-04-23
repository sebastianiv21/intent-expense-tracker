# Intent Expense Tracker

## What This Is

A personal expense tracker that helps one user manage and categorize spending against intentional budget buckets (needs/wants/future). Live with full transaction management, categories, financial profile, and multi-currency support — transactions are recorded in their original currency (COP or USD) and automatically converted to the user's preferred base currency for all reporting and totals.

## Core Value

Every transaction is recorded in the currency it was actually made in, with accurate historical conversion, so totals always reflect true spending in the user's preferred currency.

## Current State

**Shipped:** v1.0 Multi-Currency (2026-04-23)
- Schema: `transactions` has `currency`, `original_amount`, `exchange_rate` columns; `exchange_rate_cache` table live in Neon
- Rate service: `getOrFetchExchangeRate(from, to, date)` — cache-first, fawazahmed0 CDN fallback
- Data layer: `createTransaction` / `updateTransaction` fetch live rates and persist all 5 currency fields
- UI: currency selector + live preview in TransactionSheet; original-currency display + chevron expand in TransactionItem
- Codebase: ~10,600 LOC TypeScript/TSX, Next.js 16 / React 19 / Drizzle / Neon / Tailwind v4

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
- ✓ Each transaction stores its own currency code (the currency the purchase was made in) — v1.0
- ✓ Each transaction stores the exchange rate used at the time of recording (rate for transaction date) — v1.0
- ✓ Exchange rates are fetched from fawazahmed0 CDN for the transaction's date and cached 24h in DB — v1.0
- ✓ Transaction creation UI shows a currency selector per transaction (defaults to user's base currency) — v1.0
- ✓ Transaction form shows a real-time preview of the converted amount while the user types — v1.0
- ✓ Amount input formats per currency (COP: no decimals; USD: 2 decimal places) — v1.0
- ✓ createTransaction / updateTransaction persist all multi-currency fields correctly — v1.0
- ✓ Dashboard queries remain unchanged (read the `amount` column which is always base currency) — v1.0
- ✓ Transaction list shows original-currency amount for foreign transactions — v1.0
- ✓ Transaction detail shows original amount + converted amount + rate + date inline — v1.0
- ✓ Currency formatters respect per-currency decimal conventions (COP = 0, USD = 2) — v1.0
- ✓ Existing transactions backfilled as base-currency (USD) with exchange_rate = 1.0 — v1.0

### Active

_(Next milestone requirements go here)_

### Out of Scope

- Manual rate override per transaction — automatic historical rates are sufficient
- Real-time rate updates (sub-24h refresh) — overkill for daily personal tracking
- Multi-currency reports/breakdowns by currency — single converted view is sufficient
- Retroactive correction of historical rates on existing transactions — existing data stays as-is
- Support for crypto or non-standard currency codes — standard fiat only (ISO 4217)

## Context

**Codebase state:** Next.js 16 / React 19 / TypeScript, Drizzle ORM + Neon (serverless Postgres), Better Auth, Radix UI + Tailwind v4. ~10,600 LOC. Single-user personal app.

**Multi-currency architecture:** fawazahmed0 CDN → `exchange_rate_cache` table (24h TTL) → `getOrFetchExchangeRate(from, to, date)` → server actions → transactions table. Display: `isForeign = currency !== baseCurrency` drives conditional rendering in `TransactionItem`.

**No test coverage** — keep implementation straightforward; no test infrastructure.

## Constraints

- **Tech stack**: Next.js App Router + Drizzle + Neon — no new infrastructure
- **API budget**: fawazahmed0 CDN (free, no key) — 24h cache is still good practice
- **DB migrations**: Drizzle migrations — any schema changes need a migration file
- **Single user**: App is personal, no multi-tenant concerns
- **No tests**: No existing test framework

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| fawazahmed0 CDN over Frankfurter | Frankfurter has no COP support | Confirmed live in Phase 01 |
| Store rate at transaction creation time | Historical accuracy — rate shouldn't change retroactively | `getOrFetchExchangeRate(from, to, date)` (Phase 02) |
| Cache rates in DB (not in-memory) | Serverless/edge functions have no persistent memory | `exchange_rate_cache` table in Neon (Phase 01) |
| Existing transactions default to USD @ 1.0 | No migration risk; old data predates multi-currency | Backfill applied in migration (Phase 01) |
| Per-transaction currency selector (defaults to base) | Most transactions in base; COP is the exception | Tappable badge popover in TransactionSheet (Phase 03) |
| Inline expansion over separate detail view | Keeps list compact; chevron is discoverable | Chevron toggle in TransactionItem (Phase 04) |
| ZERO_DECIMAL_CURRENCIES Set (COP, JPY, KRW, CLP, HUF, TWD) | Full ISO 4217 zero-decimal coverage prevents future formatting bugs | Added in code review fix (Phase 04) |

---
*Last updated: 2026-04-23 after v1.0 Multi-Currency milestone*
