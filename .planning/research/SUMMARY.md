# Project Research Summary

**Project:** Intent Expense Tracker — Multi-Currency Milestone
**Domain:** Personal expense tracker — adding per-transaction multi-currency support with automatic historical rate conversion
**Researched:** 2026-04-19
**Confidence:** HIGH

## Executive Summary

This milestone adds multi-currency transaction recording to an existing single-currency Next.js / Drizzle / Neon expense tracker. The user transacts in both COP and USD, wants to record the original currency and amount, have the exchange rate fetched automatically for the transaction date, and see everything converted to their configured base currency in dashboards and budget views. The established pattern across apps like Toshl, Lunch Money, and PocketSmith is clear: store original amount + currency + rate snapshot at creation time, persist a converted base-currency amount alongside it for zero-query-rewrite aggregation, and never recompute historical amounts from live rates.

The recommended approach is to use the Frankfurter API (frankfurter.dev) for exchange rate fetching — free, no API key, no quota, with true historical rates by date. ExchangeRate-API (the original plan) disqualifies itself: the free tier does not include the historical endpoint (HTTP 403 on the /history route for free keys). Frankfurter is backed by ECB data but critically may NOT support COP — this must be validated with a single API call before any schema work begins. If COP is absent from Frankfurter, the confirmed fallback is fawazahmed0/exchange-api (200+ currencies, no quota, CDN-hosted). Rates are cached in a dedicated exchange_rate_cache Postgres table keyed by (from_currency, to_currency, date) — no new infrastructure, serverless-safe, 24-hour TTL.

The main risks are all avoidable with disciplined schema design: using the wrong numeric precision for rates (numeric(12,2) silently truncates COP/USD rates to zero), adding NOT NULL columns without defaults (fails on existing rows in Neon), and inverting the conversion direction (multiplying instead of dividing by a "1 USD = 4100 COP" rate produces $205M coffee purchases). The build order is strictly sequential — validate provider, then schema, then rate service, then server action, then UI. The existing dashboard and query layer require zero changes because the pre-existing amount column holds the converted base-currency value.

---

## Key Findings

### Recommended Stack

The project already has the right stack (Next.js App Router, Drizzle ORM, Neon Postgres, Vercel). No new libraries are needed — Frankfurter and fawazahmed0 both return plain JSON, native fetch() with a Zod validator is sufficient. No new infrastructure is needed — the Neon Postgres database already in use is the right cache store for exchange rates in a serverless environment.

The only new external dependency is the exchange rate API provider. ExchangeRate-API's free tier is disqualified for historical date support (confirmed via official docs — historical endpoint returns plan-upgrade-required error on free keys). Frankfurter is the recommended first choice but requires COP support verification before adoption. fawazahmed0/exchange-api is the confirmed fallback if Frankfurter lacks COP.

**Core technologies:**
- **Frankfurter API (primary) or fawazahmed0 (fallback):** exchange rate source — free, no quota, true historical rates by date; provider choice gated on COP support verification
- **Neon Postgres exchange_rate_cache table:** 24h rate cache — serverless-safe, no Redis needed, deduplication via UNIQUE constraint on (from_currency, to_currency, date)
- **Drizzle numeric(20, 10):** rate column type — avoids float drift, handles COP/USD sub-cent rates (0.00025) without truncation; numeric(12,2) would round to 0.00
- **Server Actions:** rate fetch integration point — inside createTransaction, consistent with existing mutation pattern, no new API routes

### Expected Features

**Must have (table stakes):**
- Per-transaction currency selector defaulting to user's base currency
- Exchange rate auto-fetched for the transaction's actual date (historical accuracy — not today's rate applied retroactively)
- Original amount + currency stored alongside converted base-currency amount on the transaction row
- Transaction list shows converted base-currency amount as primary; original foreign amount as secondary muted label when currency differs from base
- Transaction detail shows: original amount, arrow, converted amount, rate, and rate date (e.g., COL$50,000 → $12.50 USD @ 4,000 — rate from Apr 15, 2026)
- All dashboard and budget totals collapse to base currency only — never mix raw foreign amounts in aggregates

**Should have (differentiators, include if capacity allows):**
- Rate freshness indicator in transaction detail ("rate from [date]") — low cost, high trust value for backdated entries
- "Last used currency" memory in the transaction form — reduces friction when batching COP entries

**Defer to post-launch:**
- Manual rate override per transaction (explicitly out of scope per PROJECT.md)
- Inline rate preview during entry (requires extra fetch on-change; revisit post-launch)
- Per-currency spending reports (intent tracker, not currency-geography tracker)
- Retroactive rate correction of historical transactions
- Crypto or non-ISO-4217 currencies
- Real-time sub-24h rate refresh

### Architecture Approach

The architecture adds one new table (exchange_rate_cache), two new columns on transactions (currency varchar(3), exchange_rate numeric(20,10)), and one new service module (lib/exchange-rates.ts). The existing amount column continues to hold the converted base-currency value, preserving all existing aggregation queries without modification. The rate service is a pure function called inside the createTransaction server action — no new API routes, no middleware changes, no client-side rate fetching.

**Major components:**
1. `CurrencySelector` (new React component) — per-transaction currency picker, defaults to user base currency from profile prop (not cached at mount)
2. `lib/exchange-rates.ts` (new service module) — `getOrFetchExchangeRate(from, to, date): Promise<number>` — DB cache check first, external API call on miss, INSERT with ON CONFLICT DO NOTHING
3. `exchange_rate_cache` table (new) — UNIQUE index on (from_currency, to_currency, date); rate stored as numeric(20, 10)
4. `createTransaction` / `updateTransaction` server actions (modified) — call rate service before INSERT, compute convertedAmount = originalAmount * rate, write all 5 currency fields
5. Transaction detail view (modified) — reads original_amount, currency, exchange_rate, amount; renders dual display with rate line and rate date
6. Dashboard / budget totals (unchanged) — continue summing the existing amount column; no query modifications needed

**Conversion math:** Store rate as "1 unit of transaction currency = N units of base currency." Frankfurter returns {USD: {COP: 4100}} meaning 1 USD = 4100 COP — invert for storage: rate = 1/4100 = 0.000244. Formula: original_amount * exchange_rate = converted_amount. For base-currency transactions, skip the rate service and set exchange_rate = 1.0.

### Critical Pitfalls

1. **Frankfurter may not support COP** — ECB data excludes Colombian Peso (confirmed via GitHub issue and live currency list). Run `curl https://api.frankfurter.dev/v2/currencies | grep COP` before writing any code. If absent, adopt fawazahmed0 immediately. This is the gate for all subsequent work.

2. **ExchangeRate-API free tier lacks historical endpoint** — Returns `{"error-type":"plan-upgrade-required"}` on free keys for any /history request. Do not use ExchangeRate-API free plan for this milestone. Frankfurter or fawazahmed0 are the replacements.

3. **numeric(12,2) truncates COP/USD rates to zero** — A COP→USD rate of 0.000245 stored as numeric(12,2) rounds to 0.00. Every converted amount becomes $0. Use numeric(20, 10) for all rate columns. Schema-level decision, cannot be corrected without a migration.

4. **Conversion direction inversion** — If the API returns "1 USD = 4100 COP," converting 50,000 COP to USD requires dividing (50000 / 4100 = $12.20), not multiplying (50000 * 4100 = $205M). Store the inverted rate so the formula is always original_amount * stored_rate = converted_amount. Add a sanity check: if a single COP transaction converts to more than $10,000 USD, the direction is wrong.

5. **NOT NULL migration columns fail on existing rows** — Adding currency varchar(3) NOT NULL without a DEFAULT causes Neon to reject the migration. Always add new columns with DEFAULT 'USD' and DEFAULT 1.0000000000. Inspect the generated SQL from drizzle-kit generate before running against production.

6. **Float arithmetic drift on stored converted amounts** — parseFloat("50000") * parseFloat("0.000245") = 12.250000000000002. Round to 2 decimal places before storing, or compute the multiply server-side in Postgres using numeric arithmetic.

---

## Implications for Roadmap

Based on the research, the architecture has strict sequential dependencies. Four phases cover the full milestone cleanly.

### Phase 1: Provider Validation and Schema Foundation

**Rationale:** Everything downstream depends on confirming which API provider works for COP and on having the correct schema in place. This is the highest-risk phase — a wrong provider decision or schema mistake invalidates all subsequent work.

**Delivers:**
- Confirmed exchange rate provider: Frankfurter (if COP present) or fawazahmed0 (if absent)
- exchange_rate_cache table created in Drizzle schema and migrated
- transactions table extended with currency varchar(3) DEFAULT 'USD' and exchange_rate numeric(20,10) DEFAULT 1.0
- Existing transactions backfilled: currency = 'USD', exchange_rate = 1.0, original_amount = amount
- Migration SQL reviewed manually before execution
- Verification: SELECT COUNT(*) FROM transactions WHERE exchange_rate IS NULL returns 0

**Avoids:** Pitfall 1 (Frankfurter COP support), Pitfall 2 (ExchangeRate-API historical), Pitfall 3 (numeric precision), Pitfall 5 (NOT NULL migration failure), Pitfall 10 (legacy row exclusion from totals)

### Phase 2: Exchange Rate Service

**Rationale:** The rate service is a pure function with no UI dependency. It can be built and manually tested in isolation before any form or display code is touched. Getting conversion math correct here prevents corrupt data from reaching the database.

**Delivers:**
- lib/exchange-rates.ts implementing getOrFetchExchangeRate(from, to, date): Promise<number>
- DB-first cache lookup; external API call only on miss
- INSERT with ON CONFLICT DO NOTHING for concurrent safety
- Rate stored and returned as 1 unit of transaction currency = N units of base currency (inverted from API response direction)
- Zod validator for API response (no SDK)
- Manual verification: getOrFetchExchangeRate("COP", "USD", "2026-04-15") returns ~0.000244, not ~4100
- Historical date path: backdated transaction fetches rate for transaction.date, not server's current date

**Avoids:** Pitfall 4 (conversion direction), Pitfall 6 (wrong date for backdated transactions), Pitfall 7 (race condition via ON CONFLICT), Pitfall 11 (UTC vs Colombia timezone)

### Phase 3: Server Action and Data Layer Integration

**Rationale:** With schema and rate service proven, the server action update is a focused, bounded change. This phase also gates all UI work — the form cannot submit currency data correctly until the action accepts it.

**Delivers:**
- createTransaction updated: accepts currency, calls getOrFetchExchangeRate, computes convertedAmount = round(originalAmount * rate, 2), writes original_amount + currency + exchange_rate + amount
- updateTransaction updated with same currency/rate logic
- Zod input schema extended with currency field (defaults to user base currency)
- Short-circuit for base-currency transactions: currency === baseCurrency skips rate service, sets exchange_rate = 1.0
- Dashboard totals confirmed correct: pre-migration rows (exchange_rate = 1.0) sum correctly alongside new foreign-currency rows

**Avoids:** Pitfall 3 (float drift — round before storing), Pitfall 4 (direction enforced in service), Pitfall 10 (legacy rows unaffected by aggregation queries)

### Phase 4: UI Layer

**Rationale:** UI changes are purely additive on top of a working data layer. No risk of corrupting stored data at this phase. Changes are: one new form input, expanded transaction detail, and display formatter fixes.

**Delivers:**
- CurrencySelector component in transaction form, defaulting to financialProfile.currency (reactive prop, not cached at mount)
- Transaction list: foreign-currency rows show converted amount primary + original currency secondary; base-currency rows unchanged
- Transaction detail: full dual display — COL$50,000 → $12.50 USD @ 4,000 — rate from Apr 15, 2026
- getCurrencyFormatter in finance-utils.ts: remove hard-coded minimumFractionDigits: 2; let Intl use CLDR default per currency (COP renders COL$50,000 not COL$50,000.00)
- Compact formatter threshold: ensure COL$50,000 does not compact to COL$50K in transaction detail and list contexts

**Avoids:** Pitfall 8 (COP decimal places), Pitfall 9 (compact formatter threshold), Pitfall 13 (stale currency default after profile change)

### Phase Ordering Rationale

- Provider validation precedes schema because the wrong API invalidates the caching strategy (keyless vs keyed, response shape differs between Frankfurter and fawazahmed0)
- Schema migration precedes all application code because new columns must exist before any code writes to them; running server actions against an unmigrated schema produces null constraint errors
- Rate service precedes server action update because the action imports and calls the service
- UI is last because it is purely additive display logic on top of a complete and verified data layer; there is no UI-level correctness risk once the data layer is right

### Research Flags

Phases with standard patterns (no additional research needed during planning):
- **Phase 3 (Server Action):** Extension of existing createTransaction using established Next.js server action patterns
- **Phase 4 (UI Layer):** Standard React form component work; Intl.NumberFormat behavior is fully documented on MDN

Phases requiring a validation step at the start of planning:
- **Phase 1 (Provider Validation):** Run the COP check against Frankfurter's live API before writing any planning tasks. One curl command resolves which provider is used throughout the entire milestone. The fawazahmed0 JSON response shape also needs to be confirmed if it becomes the provider — it differs structurally from Frankfurter.
- **Phase 2 (Rate Service):** If fawazahmed0 is adopted, confirm the exact URL pattern and JSON structure from the GitHub README before writing the Zod validator.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | ExchangeRate-API historical tier restriction confirmed via official docs. Frankfurter COP absence confirmed via live API call and GitHub issue. Drizzle numeric types confirmed via official ORM docs. |
| Features | HIGH | Multi-currency UX patterns verified across 6+ production personal finance apps. Consensus on base-currency-only aggregates and dual display in transaction detail is unambiguous. |
| Architecture | HIGH | Schema design follows standard Postgres patterns for multi-currency systems. Component boundaries follow existing codebase patterns. Conversion math is verified and consistent. |
| Pitfalls | HIGH | All 6 critical pitfalls independently verified: API tier (official docs), numeric precision (Postgres docs), migration safety (Shopify eng post), float arithmetic (IEEE 754 standard), conversion direction (basic arithmetic), legacy row handling (standard SQL). |

**Overall confidence:** HIGH

### Gaps to Address

- **Frankfurter COP support (must resolve in Phase 1):** Research confirmed COP is absent from ECB data based on a GitHub issue and the currency list endpoint. Confirm with `curl https://api.frankfurter.dev/v2/currencies | grep COP` at the very start of Phase 1. If absent, fawazahmed0 is the fallback — its JSON structure needs a Zod schema written to its specific format.

- **fawazahmed0 response shape (conditional on Frankfurter COP absence):** fawazahmed0 returns `{ date: "...", usd: { cop: 0.000244, ... } }` from `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@YYYY-MM-DD/v1/currencies/usd.json`. Verify the exact shape in Phase 2 before writing the Zod validator.

- **User's configured base currency:** Architecture assumes a single base currency stored in the financial profile. Confirm whether the user's base is USD or COP before Phase 3, as the createTransaction short-circuit logic (currency === baseCurrency skips rate fetch) depends on this value being correct.

---

## Sources

### Primary (HIGH confidence)
- ExchangeRate-API historical endpoint docs (paid-only confirmed): https://www.exchangerate-api.com/docs/historical-data-requests
- ExchangeRate-API free plan overview: https://www.exchangerate-api.com/docs/free
- Frankfurter API (live currency list, COP absence confirmed): https://api.frankfurter.dev/v2/currencies
- Frankfurter COP not in ECB dataset: https://github.com/lineofflight/frankfurter/issues/144
- PostgreSQL numeric type docs: https://www.postgresql.org/docs/current/datatype-numeric.html
- Drizzle ORM numeric column types: https://orm.drizzle.team/docs/column-types/pg
- fawazahmed0/exchange-api (confirmed fallback, 200+ currencies): https://github.com/fawazahmed0/exchange-api
- Next.js server actions vs API routes: https://github.com/vercel/next.js/discussions/72919

### Secondary (MEDIUM confidence)
- Toshl Finance multi-currency: https://toshl.com/currencies/
- Lunch Money multi-currency: https://lunchmoney.app/features/multicurrency/
- Expenses.cash multi-currency FAQ: https://expenses.cash/faq/multi-currency
- PocketSmith multi-currency: https://www.pocketsmith.com/tour/multi-currency/
- Shopify: safely adding NOT NULL columns: https://shopify.engineering/add-not-null-colums-to-database
- Crunchy Data — money in Postgres: https://www.crunchydata.com/blog/working-with-money-in-postgres
- MDN Intl.NumberFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- Postgres concurrently-safe upsert: https://devandchill.com/posts/2020/02/postgres-building-concurrently-safe-upsert-queries/

### Tertiary (LOW confidence)
- Open Exchange Rates free tier with historical: https://support.openexchangerates.org/article/69-plans-pricing-guide (viable fallback, not primary recommendation)
- ExchangeRate-API free tier request limits (cross-referenced): https://currencyfreaks.com/blog/ExchangeRate-Api-Pricing-Alternative

---
*Research completed: 2026-04-19*
*Ready for roadmap: yes*
