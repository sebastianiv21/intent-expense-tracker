# Technology Stack: Multi-Currency Support

**Project:** Intent Expense Tracker — Multi-Currency Milestone
**Researched:** 2026-04-19
**Overall confidence:** HIGH (all critical claims verified against official sources)

---

## Exchange Rate API: Recommended Choice

**Use ExchangeRate-API (api-key plan, free tier)**

- **Base URL:** `https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{BASE}`
- **Historical URL:** `https://v6.exchangerate-api.com/v6/{API_KEY}/history/{BASE}/{YEAR}/{MONTH}/{DAY}`
- **Free tier:** 1,500 requests/month, updates once per 24 hours (HIGH confidence — confirmed via official pricing)
- **Historical data:** Requires a paid plan — historical endpoint is locked to Pro, Business, or Volume plans only (HIGH confidence — confirmed on the historical-data-requests docs page)
- **Response fields:** `result`, `base_code`, `conversion_rates` (object of ISO 4217 code → rate), `time_last_update_utc`, `time_next_update_utc`
- **COP supported:** Yes

**Critical finding on historical rates:** The free tier (1,500 req/month) does NOT include the historical endpoint. However, this is not actually a blocker — see the caching strategy below. The solution is to fetch today's live rate and cache it in the DB keyed by date. When a user backdates a transaction to yesterday or last week, the system looks up the cached rate for that date. Rates that were never fetched (very old backdated transactions) fall back to the current rate. This is acceptable per the project's scope ("historical accuracy — rate shouldn't change retroactively" is the goal, not perfect retroactive correction).

**New env var to add:** `EXCHANGE_RATE_API_KEY`

---

## Alternatives Evaluated

### Frankfurter (frankfurter.dev) — DO NOT USE

- Free, no API key, no rate limits
- Backed by ECB (European Central Bank) data
- Supports historical rates back to 1999 via `GET https://api.frankfurter.dev/v2/rates?date={YYYY-MM-DD}`
- **DISQUALIFIED:** COP (Colombian Peso) is not supported. ECB does not publish rates for COP. Verified by direct API call to `https://api.frankfurter.dev/v2/currencies` — COP is absent from the 33-currency ECB set. This is a hard blocker for this project.

### Open Exchange Rates (openexchangerates.org) — VIABLE FALLBACK

- Free tier: 1,000 requests/month, requires API key signup
- Historical data IS included on the free tier (unlike ExchangeRate-API)
- Base currency locked to USD on the free tier (not flexible)
- COP and USD are both supported
- Slightly fewer monthly requests than ExchangeRate-API (1,000 vs 1,500)
- Verdict: Acceptable fallback, but ExchangeRate-API's 1,500 req/month allowance and clean v6 API make it the better choice. If historical endpoint access becomes critical, Open Exchange Rates free tier has it; ExchangeRate-API does not.

### Fixer.io — DO NOT USE

- Historical rates only on paid plans ($14+/month)
- Base currency locked to EUR on free tier
- Inferior free tier to both alternatives above

### ExchangeRate-API Open Access (no API key) — DO NOT USE

- No API key required endpoint at `https://open.er-api.com/v6/latest/{base}`
- No historical endpoint whatsoever
- Rate-limited aggressively (HTTP 429 for any request within 24h of previous)
- Caching headers not guaranteed; Terms require attribution
- Fine for prototyping, unacceptable for production use

---

## Drizzle Schema: Exchange Rate Cache Table

Add a new `exchange_rate_cache` table. Do NOT store the rate inline on the transaction at schema level — store it separately and reference it. The transaction row stores a snapshot of the rate at creation time (denormalized for historical accuracy), and the cache table is the lookup/deduplication layer.

### Cache Table

```typescript
// web/lib/schema.ts additions
export const exchangeRateCache = pgTable(
  "exchange_rate_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date").notNull(),            // ISO date string "YYYY-MM-DD"
    fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
    toCurrency: varchar("to_currency", { length: 3 }).notNull(),
    rate: numeric("rate", { precision: 20, scale: 8 }).notNull(), // e.g. "4150.25000000"
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("exchange_rate_cache_unique").on(t.date, t.fromCurrency, t.toCurrency)]
);
```

**Why `numeric(20, 8)` for the rate:** Exchange rates between major and minor currencies can span several orders of magnitude (1 USD = ~4,150 COP; 1 USD = ~0.0002 BTC-class values). 8 decimal places preserves sub-cent accuracy without floating-point drift. Drizzle maps this to `string` in TypeScript by default — use `parseFloat()` only after validation, or add `mode: 'number'` if rates are guaranteed to fit in a JS `number` (they will for fiat).

### Transaction Table Additions

```typescript
// Additions to existing transactions table
currency: varchar("currency", { length: 3 }).notNull().default("USD"),
exchangeRate: numeric("exchange_rate", { precision: 20, scale: 8 }).notNull().default("1"),
```

- `currency` = the currency the transaction was entered in (e.g., "COP")
- `exchangeRate` = rate snapshot at time of entry (fromCurrency → user's base currency)
- Existing rows get `currency = "USD"`, `exchange_rate = 1` via migration default — no data backfill needed

---

## Caching Strategy: Serverless-Safe

Serverless functions (Vercel) have no persistent in-memory state between requests. All caching must go through the DB.

**Pattern: DB-backed 24-hour cache**

1. When a transaction is created, the action calls `getOrFetchRate(date, fromCurrency, toCurrency)`
2. `getOrFetchRate` queries `exchange_rate_cache` for `(date, fromCurrency, toCurrency)`
3. Cache hit (row exists) → return rate immediately, no API call
4. Cache miss → call ExchangeRate-API `latest` endpoint, INSERT into cache, return rate
5. For backdated transactions where no cached rate exists → same flow; the "today" rate is fetched and stored keyed to the transaction's date (acceptable approximation per project scope)

**Why NOT Redis / Vercel KV:** Introduces a new infrastructure dependency. The project constraint says "no new infrastructure" — Neon Postgres is already the persistence layer, and with 24-hour TTL the cache table stays tiny.

**Why NOT `next/cache` (fetch cache):** Vercel's fetch cache is per-deployment and unreliable across serverless function cold starts. It also doesn't help with historical date lookups. DB is the right store here.

**Request volume math:** With one user making ~5 transactions/day across ~2 currency pairs, and 24-hour deduplication, actual API calls will be 1–2/day = ~30–60/month. Well within the 1,500/month free tier.

---

## Next.js Integration Pattern

**Use Server Actions for rate fetching, not API Routes**

The existing codebase uses Server Actions (`"use server"`) for all mutations and direct Drizzle queries in Server Components for reads. Fetching an exchange rate is a side effect of creating a transaction — it belongs inside the `createTransaction` Server Action.

```
createTransaction (Server Action)
  → validate input with Zod
  → call getOrFetchRate(date, fromCurrency, baseCurrency)  // may call ExchangeRate-API
  → INSERT transaction with snapshotted rate
  → revalidatePath(...)
  → return ActionResult
```

**Do NOT add a dedicated `/api/exchange-rates` Route Handler.** There is no client-side component that needs to independently fetch rates — the rate is always resolved server-side at transaction creation time. Adding an API route adds surface area with no benefit.

**Do NOT fetch rates in middleware.** Middleware runs on every request; rate fetching is only needed on transaction creation. Middleware also has constrained execution context (edge runtime) that complicates DB access patterns.

---

## No New Libraries Needed

ExchangeRate-API's v6 endpoint returns plain JSON. Use `fetch()` directly — no SDK wrapper needed. The response is simple enough that a typed `fetch` call with a Zod schema is sufficient and keeps the dependency count flat.

```typescript
// Example typed fetch — no npm install needed
const res = await fetch(
  `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/${fromCurrency}`
);
const data = await res.json();
// data.conversion_rates[toCurrency] → rate number
```

---

## Summary Table

| Area | Choice | Why |
|------|--------|-----|
| Exchange rate API | ExchangeRate-API v6 (free tier, API key) | 1,500 req/mo, COP + USD supported, clean JSON, well-documented |
| Historical rates | DB cache keyed by date (no historical API endpoint) | Free tier lacks history endpoint; cached live rates are sufficient |
| Cache layer | Neon Postgres `exchange_rate_cache` table | No new infra; serverless-safe; 24h TTL fits usage pattern |
| Rate type in DB | `numeric(20, 8)` | Exact decimal, no float drift, handles large cross-rate magnitudes |
| Transaction schema | Add `currency varchar(3)` + `exchange_rate numeric(20, 8)` | Snapshot at creation time for historical accuracy |
| Integration point | Inside `createTransaction` Server Action | Consistent with existing mutation pattern; no new API routes |
| API client | Native `fetch()` + Zod validation | No SDK needed; avoids extra dependency |
| Rejected: Frankfurter | Does not support COP | ECB data source excludes Colombian Peso — hard blocker |
| Rejected: Open Access (keyless ExchangeRate-API) | Aggressive rate limiting, no historical | Unsuitable for production |
| Rejected: Fixer.io | EUR-only base, paid historical | Worse free tier than alternatives |

---

## Environment Variables to Add

```
EXCHANGE_RATE_API_KEY=your_key_from_exchangerate-api.com
```

Register at `https://app.exchangerate-api.com/sign-up` — free tier does not require a credit card.

---

## Sources

- ExchangeRate-API standard endpoint docs: https://www.exchangerate-api.com/docs/standard-requests
- ExchangeRate-API historical endpoint (paid-only confirmed): https://www.exchangerate-api.com/docs/historical-data-requests
- ExchangeRate-API free plan limits (1,500/mo confirmed): https://currencyfreaks.com/blog/ExchangeRate-Api-Pricing-Alternative (cross-referenced with official signup page)
- Frankfurter currency list (COP absence confirmed): https://api.frankfurter.dev/v2/currencies (live API call, April 2026)
- Frankfurter COP not in ECB set: https://github.com/lineofflight/frankfurter/issues/144
- Open Exchange Rates free tier with historical: https://support.openexchangerates.org/article/69-plans-pricing-guide
- Drizzle ORM numeric column types: https://orm.drizzle.team/docs/column-types/pg
- Next.js server actions vs API routes: https://github.com/vercel/next.js/discussions/72919
