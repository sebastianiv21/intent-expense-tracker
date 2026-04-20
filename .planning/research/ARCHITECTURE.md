# Architecture Patterns: Multi-Currency Transactions

**Domain:** Personal expense tracker — adding multi-currency to an existing Next.js + Drizzle + Neon app
**Researched:** 2026-04-19
**Overall confidence:** HIGH (schema design and SQL patterns) / MEDIUM (ExchangeRate-API historical tier finding)

---

## Critical Pre-Build Finding: ExchangeRate-API Historical Rates Are Paid-Only

The PROJECT.md states the plan is ExchangeRate-API free tier (1,500 req/month) with 24h DB cache.
**Historical rate fetching (rates by past date) is NOT available on the free tier.** It requires Pro, Business, or Volume plans.

The free open-access endpoint (`https://open.er-api.com/v6/latest/USD`) provides only current/today rates.

**Recommended alternative:** Frankfurter API (`https://api.frankfurter.dev`)
- No API key required
- No monthly/daily quotas
- Historical rates from 1948, endpoint: `GET https://api.frankfurter.dev/v2/rates?date=YYYY-MM-DD`
- Built on ECB (European Central Bank) data — reliable, no vendor lock-in
- Supports COP (verify at `/v2/currencies` before committing)
- Request format for a pair: `https://api.frankfurter.dev/v2/rates?date=2025-01-15&from=USD&to=COP`

**Fallback if Frankfurter lacks COP:** `fawazahmed0/exchange-api` via jsDelivr CDN — 200+ currencies, no rate limits, historical by date. URL: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@YYYY-MM-DD/v1/currencies/usd.json`

This finding must drive Phase 1 — validate currency provider before schema work.

---

## Recommended Data Model

### 1. New table: `exchange_rate_cache`

```sql
exchange_rate_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency  varchar(3) NOT NULL,
  to_currency    varchar(3) NOT NULL,
  date           date NOT NULL,          -- the calendar date this rate applies to
  rate           numeric(20, 10) NOT NULL, -- see precision section below
  fetched_at     timestamp NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency, date)
)
```

**Why a separate table instead of embedding only on the transaction:**
- Transactions on the same day with the same currency pair share one cached rate — no redundant API calls.
- The 24h cache check is a simple `SELECT WHERE from_currency = $1 AND to_currency = $2 AND date = $3` — single indexed lookup.
- If the API response needs to be invalidated or refreshed, you update one row, not scan all transactions.
- Rate provenance is auditable separately from the transaction record.

**Why NOT a Redis/in-memory cache:** Neon is serverless; function instances have no shared memory. DB is the only durable cross-request store available within the existing infrastructure constraint.

**Index:** Composite index on `(from_currency, to_currency, date)` — already enforced by the UNIQUE constraint above. No extra index needed.

### 2. Modified table: `transactions` — add three columns

```sql
ALTER TABLE transactions
  ADD COLUMN currency        varchar(3)      NOT NULL DEFAULT 'USD',
  ADD COLUMN original_amount numeric(12, 2),   -- amount in the transaction's own currency
  ADD COLUMN exchange_rate   numeric(20, 10);  -- rate: 1 unit of `currency` = X units of base currency
```

**Column semantics:**

| Column | Meaning | Example (COP transaction, USD base) |
|--------|---------|-------------------------------------|
| `original_amount` | What the user entered, in `currency` | `50000.00` |
| `currency` | ISO 4217 code for what was entered | `COP` |
| `exchange_rate` | 1 COP = X USD at transaction date | `0.0002500000` |
| `amount` | Converted value in base currency (existing) | `12.50` |

**Why store both original_amount and converted amount:**
- `amount` (existing column, base currency) is needed for all existing queries — dashboard totals, bucket summaries, insights — to continue working without modification. No query rewrite required at migration time.
- `original_amount` is needed for the transaction detail view ("COL$50.000 → $12.50 USD @ 4,000") and any future per-currency breakdowns.
- `exchange_rate` is stored so the display math is reproducible — you can always show "@ 4,000" without re-fetching anything.

**Why NOT only store original + rate and compute amount at query time:**
The existing SQL aggregations in `dashboard.ts` (`coalesce(sum(...))`) and `queries/dashboard.ts` bucket totals would all need to be rewritten to multiply by the rate in the SQL. That is a larger blast radius for a single migration. Storing the converted amount as `amount` preserves backward compatibility with zero query changes.

**Migration for existing rows:**
```sql
UPDATE transactions
SET currency = 'USD',
    original_amount = amount,
    exchange_rate = 1.0000000000
WHERE currency IS NULL;
```
Then add NOT NULL constraints after the backfill. This satisfies the requirement: "Existing transactions treated as base-currency @ rate 1.0."

### 3. Numeric precision for exchange rates

COP/USD rate is approximately 4,000 COP per 1 USD, which means:
- 1 COP = 0.00025 USD → needs at least 5 decimal places just to represent a round rate
- Frankfurter returns rates with up to 6 significant digits of precision
- `numeric(20, 10)` stores up to 10 decimal places — sufficient for COP, JPY, VND, and any currency with rate < 1e-6 vs USD
- `numeric(20, 10)` stores up to 10 integral digits — supports currencies like IRR (60,000/USD)
- Storage cost: ~9 bytes per value — negligible

**Do not use `float` or `double precision`** for exchange rates. Floating-point cannot exactly represent values like 0.00025, leading to rounding errors that compound across many transactions.

---

## Component Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (React components)                                │
│  - CurrencySelector (new): per-transaction currency picker  │
│  - AmountInput (existing): already locale-aware             │
│  - TransactionDetail (modified): shows original + converted │
│  - Dashboard (existing): no changes — reads `amount` as-is  │
└───────────────────────┬─────────────────────────────────────┘
                        │ form submit
┌───────────────────────▼─────────────────────────────────────┐
│  Server Actions (lib/actions/transactions.ts)               │
│  createTransaction / updateTransaction                      │
│  - Receives: amount (original), currency, date              │
│  - Calls: getOrFetchExchangeRate(currency, baseCurrency, date)│
│  - Computes: convertedAmount = originalAmount * rate         │
│  - Writes: transactions row with all 5 currency fields      │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Exchange Rate Service (lib/exchange-rates.ts) — NEW        │
│  getOrFetchExchangeRate(from, to, date): Promise<number>    │
│  1. SELECT from exchange_rate_cache WHERE from/to/date      │
│  2. Cache hit (< 24h old) → return cached rate              │
│  3. Cache miss → fetch from Frankfurter API                  │
│  4. INSERT/UPDATE cache row                                  │
│  5. Return rate                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  Database (Neon / Postgres via Drizzle)                     │
│  exchange_rate_cache table                                  │
│  transactions table (extended)                              │
└─────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│  External: Frankfurter API (no key, no quota)               │
│  GET https://api.frankfurter.dev/v2/rates?date=YYYY-MM-DD   │
│      &from=COP&to=USD                                       │
└─────────────────────────────────────────────────────────────┘
```

### Component responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `CurrencySelector` | UI for picking transaction currency; defaults to user's base currency from profile | `createTransaction` form |
| `lib/exchange-rates.ts` | All rate fetching and cache logic; single source of truth | Drizzle DB + Frankfurter API |
| `lib/actions/transactions.ts` | Orchestrates create/update; calls exchange rate service before INSERT | exchange-rates.ts, Drizzle |
| `exchange_rate_cache` table | 24h rate cache; keyed on (from, to, date) | exchange-rates.ts |
| `transactions` table | Stores original amount, currency, rate, and converted amount | actions/transactions.ts |
| Dashboard/query layer | Reads `amount` (converted) unchanged — no modifications needed | Existing queries untouched |

---

## Data Flow: Creating a Transaction

```
1. User fills form: amount=50000, currency=COP, date=2026-04-15
2. createTransaction() server action called
3. getOrFetchExchangeRate("COP", "USD", "2026-04-15")
   a. DB lookup: SELECT rate FROM exchange_rate_cache
      WHERE from_currency='COP' AND to_currency='USD' AND date='2026-04-15'
   b. Miss → fetch https://api.frankfurter.dev/v2/rates?date=2026-04-15&from=COP&to=USD
   c. INSERT INTO exchange_rate_cache (rate=0.0002500000, fetched_at=now())
   d. Return 0.0002500000
4. convertedAmount = 50000 * 0.0002500000 = 12.50
5. INSERT INTO transactions:
   original_amount = 50000.00
   currency        = 'COP'
   exchange_rate   = 0.0002500000
   amount          = 12.50        ← existing column, base currency
6. Existing dashboard queries sum `amount` — no changes required
```

### Data Flow: Cache Hit (Same Day, Same Pair)

Steps 3b and 3c are skipped entirely. Cache TTL check: `fetched_at > now() - interval '24 hours'`. This keeps API usage near zero for normal single-user daily use.

### Data Flow: Transaction Detail Display

```
originalAmount = transaction.original_amount  // 50000
currency       = transaction.currency         // COP
rate           = transaction.exchange_rate    // 0.00025
convertedAmount = transaction.amount          // 12.50
baseCurrency   = profile.currency             // USD

Display: "COL$50,000 → $12.50 USD @ 4,000"
```

Rate display: `rateDisplay = currency === baseCurrency ? null : (1 / rate).toFixed(0)` — shows "4,000" for the COP/USD case naturally.

---

## Where to Fetch Rates: Server Action, Not Middleware

**Decision: fetch inside the `createTransaction` server action (synchronous, inline).**

- Middleware runs on every request — wrong place for DB writes and external API calls
- Background jobs require infrastructure (cron, queue) that doesn't exist and is out of scope
- The Frankfurter API responds in ~100-300ms — acceptable inside a form submission for a personal app
- The 24h DB cache means the external fetch only happens once per currency pair per day at most
- Server actions already own the transaction write; rate fetch is a natural pre-step in that same function

**Pattern:**
```typescript
// In createTransaction server action
const rate = await getOrFetchExchangeRate(currency, baseCurrency, date);
const convertedAmount = originalAmount * rate;
// then insert transaction with both values
```

If `currency === baseCurrency`, skip the rate service entirely and set `exchange_rate = 1.0`, `original_amount = amount`.

---

## Conversion Math

**Store: original_amount + exchange_rate + amount (converted)**

Conversion formula: `amount = original_amount * exchange_rate`

Where `exchange_rate` = "1 unit of transaction currency expressed in base currency units."

For COP/USD where base is USD:
- rate from Frankfurter is returned as `{ "USD": { "COP": 4000 } }` (1 USD = 4000 COP)
- Invert for storage: `exchange_rate = 1 / 4000 = 0.00025` (1 COP = 0.00025 USD)
- This way `original_amount * exchange_rate = converted_amount` always holds

**Always store the rate in the direction: 1 unit of transaction currency → N units of base currency.** This keeps the multiplication consistent regardless of which direction the API returns the pair.

---

## Build Order Implications

The architecture has clear sequential dependencies:

1. **Validate provider first** — Confirm Frankfurter supports COP before writing any schema. One `curl https://api.frankfurter.dev/v2/currencies` call resolves this. If COP is absent, switch to fawazahmed0 API before any other work begins.

2. **Schema migration second** — Add columns to `transactions` and create `exchange_rate_cache`. Run the backfill UPDATE for existing rows in the same migration. This is the foundation; all other layers depend on it.

3. **Exchange rate service third** — `lib/exchange-rates.ts` is a pure function (in: from/to/date, out: rate). It can be built and tested manually in isolation before touching any UI.

4. **Server action update fourth** — Extend `createTransaction` and `updateTransaction` to accept `currency`, call the rate service, and write the new columns. Validation schema also updates here.

5. **UI last** — CurrencySelector component added to the transaction form. Transaction detail view updated to show original + converted. Dashboard and list views require no changes (they read `amount` as before).

This ordering means the backend is fully functional before any UI change, and the UI changes are cosmetic additions on top of a working data layer.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching Rate at Display Time

**What it looks like:** Transaction row stores only `original_amount + currency`, then converts at query time by joining `exchange_rate_cache`.

**Why bad:** All existing SQL aggregations break — you cannot `SUM(amount)` without multiplying by rate per row. Dashboard, bucket totals, insights queries all need rewriting. The "store converted amount" approach makes backward compatibility trivial.

### Anti-Pattern 2: Storing Rate as float8 / real

**What it looks like:** `exchange_rate float8` — looks fine for USD/EUR but breaks for COP (~0.00025) and worse currencies. `0.00025` cannot be exactly represented in IEEE 754 binary float. Errors are small but non-zero and accumulate across thousands of transactions over time. Use `numeric(20, 10)` exclusively.

### Anti-Pattern 3: Fetching Rate on the Client

**What it looks like:** A React component calls Frankfurter directly to show the user a live preview while they type.

**Why bad:** CORS may block it; more importantly the rate must be fetched server-side at write time to match what gets stored. A client-side preview rate and the server-side stored rate could diverge if the API response changes between preview and save. Only the rate stored at insert time matters for historical accuracy.

### Anti-Pattern 4: Using `fetched_at` for the Cache Timestamp

**What it looks like:** Cache invalidation checks `fetched_at > now() - interval '24 hours'` and re-fetches daily.

**Why it works:** For this app, 24h staleness is acceptable per requirements. But note: the rate stored on a transaction is permanent — it reflects the rate at the time of insertion, not a cached TTL. The cache table is only for reducing API calls. The transaction row is the permanent record.

---

## Scalability Note

This is a single-user app. The cache table will have at most a handful of rows (one per currency pair per calendar day ever used). No partitioning, no archival, no cleanup strategy needed for the foreseeable lifetime of the app.

---

## Sources

- ExchangeRate-API historical data documentation: https://www.exchangerate-api.com/docs/historical-data-requests (confirmed paid-only)
- ExchangeRate-API free/open endpoint: https://www.exchangerate-api.com/docs/free (confirmed current rates only)
- Frankfurter API: https://frankfurter.dev/ (no key, no quota, historical by date)
- fawazahmed0/exchange-api: https://github.com/fawazahmed0/exchange-api (fallback, 200+ currencies)
- PostgreSQL numeric types: https://www.postgresql.org/docs/current/datatype-numeric.html
- Working with Money in Postgres: https://www.crunchydata.com/blog/working-with-money-in-postgres
