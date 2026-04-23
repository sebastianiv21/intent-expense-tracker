# Domain Pitfalls: Multi-Currency Support

**Domain:** Adding multi-currency to an existing single-currency expense tracker
**Researched:** 2026-04-19
**Stack context:** Next.js 16 App Router, Drizzle ORM, Neon serverless Postgres, Vercel serverless functions

---

## Critical Pitfalls

Mistakes that cause data corruption, silent wrong totals, or require a rewrite.

---

### Pitfall 1: ExchangeRate-API Free Plan Does Not Support Historical Dates

**What goes wrong:** The project plan assumes ExchangeRate-API will be used to fetch exchange rates for specific past dates (backdated transactions). The historical endpoint (`/history`) is **not available on the free plan** — it requires a Pro, Business, or Volume subscription. The free open endpoint (`open.er-api.com/v6/latest/{base}`) only returns today's rates.

**Why it happens:** The ExchangeRate-API marketing page emphasizes historical data availability without prominently disclosing that free-tier users are locked out of it. Developers assume all endpoints are available under the free key.

**Consequences:** When a user enters a backdated transaction (e.g., a purchase made three days ago), the app will either crash on a 403 response, silently fall back to today's rate, or error in a way that blocks transaction creation entirely. The PROJECT.md requirement "fetch rate for specific past dates when entering backdated transactions" is **not achievable on the free tier** as stated.

**Prevention:**
- Use Frankfurter (frankfurter.dev) — a fully free, key-free API backed by the European Central Bank that supports historical date lookups (`/YYYY-MM-DD?from=USD&to=COP`). No rate limits documented for normal usage.
- Alternatively: use ExchangeRate-API free tier for today's rate only, and apply today's rate to backdated transactions (acceptable tradeoff for personal use — document it clearly in the UI).
- Do not attempt to use the paid historical endpoint on a free API key — it returns HTTP 403, which will surface as a broken transaction form.

**Detection:** `curl "https://v6.exchangerate-api.com/v6/{YOUR_KEY}/history/USD/2024-01-15"` returns `{"result":"error","error-type":"plan-upgrade-required"}` on free keys.

**Phase:** Must be resolved before any API integration work begins (Phase 1 / DB + API layer).

---

### Pitfall 2: Storing Exchange Rates as `numeric(12,2)` — Truncation Destroys Accuracy

**What goes wrong:** The existing `amount` column uses `numeric(12,2)`. If exchange rates are stored in the same type (2 decimal places), a COP/USD rate of `0.000245` gets rounded to `0.00` — effectively zero — making every converted total $0.

**Why it happens:** Developers reuse the existing `numeric` column type for rate storage without considering that exchange rates are not monetary amounts. A rate like COP→USD is approximately 0.00024 (4 significant figures after the decimal).

**Consequences:** Every `converted_amount = amount * exchange_rate` calculation silently produces $0 for COP→USD conversions. The dashboard shows zero spending even though amounts were recorded. This is not caught until UI testing.

**Prevention:**
- Store exchange rates as `numeric(18, 6)` — six decimal places is the industry standard for FX rates (ISO 20022 convention).
- In Drizzle: `exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 })`
- Six decimal places correctly represents 0.000245 as `0.000245` without truncation.

**Detection:** Run `SELECT exchange_rate FROM exchange_rate_cache LIMIT 5` after inserting test data. Any value that should be sub-cent (COP→USD) showing as `0.00` is this bug.

**Phase:** Schema design phase — must be correct before any migration is written.

---

### Pitfall 3: JavaScript Float Arithmetic on Converted Amounts

**What goes wrong:** Reading `amount` from Postgres returns a string in Drizzle (Postgres `numeric` → JS `string` to avoid float loss). Converting to a number with `parseFloat` then multiplying by an exchange rate reintroduces IEEE 754 float errors. Example: `parseFloat("50000") * parseFloat("0.000245")` = `12.250000000000002` rather than `12.25`.

**Why it happens:** JavaScript has no decimal type. All arithmetic uses IEEE 754 double-precision floats. The existing `parseStoredAmount` utility in `finance-utils.ts` uses `Number.parseFloat`, which is correct for display but not for multiply-and-store.

**Consequences:** Converted amounts stored back to the DB accumulate fractional cent errors. Over many transactions, totals drift visibly (e.g., dashboard shows $1,234.560000003 instead of $1,234.56). Minor for a personal app, but alarming to the user.

**Prevention:**
- Do the final conversion multiply in Postgres directly: `SELECT (amount::numeric * exchange_rate::numeric)` — Postgres `numeric` multiplication is exact.
- When computing converted totals for display (not storage), round at the last step: `Math.round(converted * 100) / 100`.
- Never store a float-computed value back to a `numeric` column without rounding first.

**Detection:** `console.log(parseFloat("50000") * parseFloat("0.000245"))` — if the result has more than 2 decimal digits, float drift is occurring.

**Phase:** Conversion logic implementation phase.

---

### Pitfall 4: Converting in the Wrong Direction (COP→USD vs. USD→COP)

**What goes wrong:** Exchange rate APIs return a rate relative to a base currency. If the base is USD, `rates.COP` = `4100` means "1 USD buys 4100 COP". Converting a COP amount to USD requires **dividing** by this rate (`50000 / 4100 = $12.20`), not multiplying (`50000 * 4100 = $205,000,000`). Developers frequently flip the operation.

**Why it happens:** The phrase "exchange rate" is ambiguous. Rate `4100` feels like a multiplier. Nothing at runtime prevents the wrong direction — both produce valid-looking numbers in very different magnitude ranges.

**Consequences:** A 50,000 COP coffee purchase appears as a $205 million transaction in the dashboard. With COP amounts in the tens of thousands, multiplying instead of dividing produces values that visually overflow the UI and corrupt budget bucket totals.

**Prevention:**
- Establish a naming convention immediately and enforce it in code: `rateToBase` = "how many transaction-currency units equal 1 base-currency unit". Converting to base = `transactionAmount / rateToBase`.
- Alternative convention: store `rateFromBase` (base→transaction, e.g., 4100 for USD→COP). Then: `transactionAmount / rateFromBase`. Same formula, explicit naming prevents confusion.
- Add a sanity check before storing: if base is USD and transaction currency is COP, a converted amount above $10,000 for a single transaction is almost certainly a direction bug.

**Detection:** After conversion logic is written, manually verify: 50,000 COP → ~$12 USD (not ~$205 million). If the converted value has more digits than the original, the direction is wrong.

**Phase:** Rate fetch + conversion utility implementation. Must have an explicit review step.

---

### Pitfall 5: DB Migration — Adding NOT NULL Currency Columns Without Defaults Locks or Fails

**What goes wrong:** Adding `currency varchar(3) NOT NULL` and `exchange_rate numeric(18,6) NOT NULL` to the existing `transactions` table without a `DEFAULT` clause will cause the migration to fail immediately on Neon (Postgres rejects adding a `NOT NULL` column to a table with existing rows if no default is provided). Even with a default, Postgres rewrites the entire table, acquiring an `ACCESS EXCLUSIVE` lock.

**Why it happens:** Developers familiar with small local dev databases don't feel the lock impact. Drizzle's generated `ALTER TABLE` for a new `NOT NULL` column without a default will error on any table with existing rows: `ERROR: column "currency" of relation "transactions" contains null values`.

**Consequences:** Migration fails mid-deployment, leaving the schema in a partially migrated state. With Neon's serverless Postgres, a failed migration during a Vercel deployment can leave the deployed code expecting new columns that don't exist.

**Prevention:**
- Always add new columns as nullable first, then backfill, then add `NOT NULL` constraint in a separate migration.
- For this milestone: add `currency varchar(3) DEFAULT 'USD'` and `exchange_rate numeric(18,6) DEFAULT 1.000000` in the initial migration. This gives all existing transactions the correct semantic values (existing transactions are USD at 1:1). Then a second migration can tighten the constraint if needed.
- Verify with `drizzle-kit generate` and review the generated SQL before running `drizzle-kit migrate` — never run a migration on production without reading the generated SQL.

**Detection:** Run `drizzle-kit generate` after schema changes and inspect the `.sql` file. Look for `ALTER TABLE transactions ADD COLUMN currency varchar(3) NOT NULL` — if no `DEFAULT` clause follows, the migration will fail on any non-empty table.

**Phase:** DB schema + migration phase. Must use the two-step (nullable → backfill → constrain) pattern.

---

### Pitfall 6: Historical Rate on the Free Plan — "Today's Rate" Applied to Old Transactions

**What goes wrong:** Even if the historical date problem (Pitfall 1) is resolved by switching to Frankfurter, there is still a conceptual trap: if the app caches rates by `(base, target, date)` and a backdated transaction references a date for which no cache entry exists, the code may fall through to "fetch today's rate and cache it as today, but use it for the past date." The transaction then stores a wrong historical rate without any visible error.

**Why it happens:** A missing cache entry for date `2025-01-10` triggers a fallback. If the fallback logic fetches today's rate (`/latest`) and saves it against today's date, the lookup for `2025-01-10` misses again next time, but the transaction was already persisted with today's rate silently applied.

**Consequences:** Historical accuracy is silently broken. A transaction from 6 months ago when COP was 4,200/USD gets recorded at today's rate of 4,100/USD — a ~2.4% error per transaction. Cumulative drift on monthly totals can reach several percent.

**Prevention:**
- Always fetch the rate for the transaction's actual date, never for today, when the transaction date is in the past. The cache key must be `(base_currency, quote_currency, date)` — not just the currency pair.
- If the historical fetch fails (network error, API down), fail the transaction creation with a user-visible error rather than silently applying today's rate.
- Log the rate source in the `exchange_rate_cache` table: add a `fetched_for_date` column that matches the `rate_date` column — any mismatch is a bug.

**Phase:** Rate caching implementation. Cache key design is load-bearing for correctness.

---

## Moderate Pitfalls

---

### Pitfall 7: Serverless Race Condition on Rate Cache Upsert

**What goes wrong:** Two concurrent requests (e.g., user rapidly saves two transactions) both check the `exchange_rate_cache` table, both find a cache miss for the same `(USD, COP, 2026-04-19)` key, both call the external API, and both attempt to insert the result. This produces a duplicate key violation or, with `ON CONFLICT DO UPDATE`, a harmless double write — but it also burns two API quota units for one cache entry.

**Why it happens:** Vercel serverless functions have no shared in-process state. There is no mutex. Two functions executing in parallel will both miss a cold cache.

**Consequences:** On a day with many transactions, the 1,500/month API quota can be partially wasted on duplicate fetches. With 1,500 req/month (~50/day), a brief burst of 5 concurrent saves for the same currency pair could consume 5 quota units instead of 1.

**Prevention:**
- Use Postgres `INSERT ... ON CONFLICT (base, quote, rate_date) DO NOTHING` for cache writes. This is atomic and safe — only one insert wins, duplicates are ignored.
- Design the cache table with a `UNIQUE` constraint on `(base_currency, quote_currency, rate_date)`. This makes the DB enforce deduplication regardless of application logic.
- For a personal single-user app, the practical impact is minimal (concurrent saves are rare), but the schema constraint is cheap insurance.

**Detection:** Check for `UNIQUE` constraint on the cache table in the migration. Run two concurrent save requests in dev and verify the cache has exactly one row for the date.

**Phase:** DB schema for the rate cache table.

---

### Pitfall 8: `Intl.NumberFormat` with COP — Hard-Coded `minimumFractionDigits: 2` Breaks Colombian Peso Display

**What goes wrong:** The existing `getCurrencyFormatter` in `finance-utils.ts` hard-codes `minimumFractionDigits: 2` and `maximumFractionDigits: 2` for all currencies. COP (Colombian peso) has no subunit in practice — amounts are always whole numbers. This causes COP amounts to display as `COL$50,000.00` instead of `COL$50,000`. The `.00` looks wrong to Colombian users and wastes horizontal space in the transaction list.

**Why it happens:** The formatter was written when only USD was supported. `minimumFractionDigits: 2` is correct for USD but wrong for zero-decimal currencies (COP, CLP, KRW, JPY, HUF, etc.).

**Consequences:** Visual regression in transaction list and dashboard when COP is the display currency. The `.00` also appears on converted totals (e.g., $12.00 instead of $12.25 if rounding is aggressive). Minor UX issue but visible immediately after enabling COP.

**Prevention:**
- Look up the currency's `minimumFractionDigits` from the CLDR/Intl data: `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'COP' }).resolvedOptions().minimumFractionDigits` returns `0` in all modern browsers.
- Remove the hard-coded `minimumFractionDigits: 2` override. Let `Intl.NumberFormat` use the CLDR default for the given currency code. For COP it will naturally produce zero decimal places.
- Alternatively: `minimumFractionDigits: 0, maximumFractionDigits: 2` provides a safe universal default — no trailing zeros for whole amounts, up to 2 decimals if present.

**Detection:** `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(50000)` → `"COL$50,000.00"`. Remove the override and verify it renders `"COL$50,000"`.

**Phase:** Currency display / UI layer phase.

---

### Pitfall 9: COP Amounts Exceed `numeric(12,2)` Safe Integer Range in JS

**What goes wrong:** The existing `amount` column is `numeric(12,2)`, which supports up to 9,999,999,999.99. A single large COP transaction (e.g., rent at 3,000,000 COP = 3 million) is fine. However, when these are read as strings by Drizzle and converted with `parseFloat` for arithmetic, amounts above `Number.MAX_SAFE_INTEGER / 100` (~90 trillion) would lose precision. Realistically, COP amounts up to tens of millions are safe with `parseFloat`.

**The actual risk:** The compact formatter has a threshold of `Math.abs(num) >= 1000`. For COP, virtually every transaction exceeds 1,000 (even a coffee at 5,000 COP). This means the compact formatter will be used pervasively for COP amounts, potentially truncating meaningful digits. `50,000 COP` compacted as `COL$50K` loses the exact figure needed when reviewing transactions.

**Prevention:**
- Review the compact formatter logic: for zero-decimal currencies with large face values, compact notation may lose useful precision. Consider only applying compact formatting for amounts above 1,000,000 in the transaction currency, or adjusting the threshold per currency.
- The `numeric(12,2)` column is fine for COP amounts up to ~9.9 billion — no schema change needed for amount precision.

**Detection:** Enter a 50,000 COP transaction and verify the transaction list displays `COL$50,000` not `COL$50K` in a context where the exact amount matters.

**Phase:** Currency display / UI layer.

---

### Pitfall 10: Existing Transaction `amount` Values Treated as Wrong Currency After Migration

**What goes wrong:** After adding `currency` and `exchange_rate` columns to `transactions`, any code that sums all transaction amounts for a date range will now mix pre-migration rows (no explicit currency, defaulted to USD/1.0) with post-migration rows (COP at real rates). If conversion logic only applies when `currency != base_currency`, pre-migration rows will be summed as-is (correct). But if conversion logic checks `exchange_rate IS NULL` and skips or errors, old rows without explicit rates will be excluded from totals silently.

**Why it happens:** The migration defaults `currency = 'USD'` and `exchange_rate = 1.0` for existing rows, but application-layer query logic may not trust those defaults and try to re-fetch or re-validate them.

**Prevention:**
- The application must treat `exchange_rate = 1.0` as a valid stored rate, not as a sentinel meaning "rate not yet fetched." Ensure all query code that computes converted amounts handles this case: `converted = amount * exchange_rate` where `exchange_rate` defaults to 1.0 for USD→USD is mathematically correct.
- Never add `WHERE exchange_rate IS NOT NULL` filters to total queries — this silently excludes old transactions.
- Add the `NOT NULL DEFAULT` in the migration so the column can never be null after migration.

**Detection:** After migration, run `SELECT COUNT(*) FROM transactions WHERE exchange_rate IS NULL` — should be 0. Also verify the dashboard total before and after migration matches for existing data.

**Phase:** Migration execution + query layer.

---

### Pitfall 11: Rate Cache Expiry Logic in a Timezone-Naive Environment

**What goes wrong:** The cache stores a `rate_date` (date of the rate) and a `fetched_at` timestamp. A "24-hour cache" is ambiguous: does it expire 24 hours after fetching, or at the end of the calendar day the rate is for? If the app checks `fetched_at < NOW() - INTERVAL '24 hours'`, a rate fetched at 11:30pm will be considered stale at 11:31pm the next day — a 1-minute window where today's rate is uncached, causing an unnecessary API call.

**Why it happens:** Serverless functions run in UTC. The user is in Colombia (UTC-5). "Today" for the user is different from "today" in UTC during evenings. A transaction entered at 8pm Colombia time is entered at 1am UTC (next calendar day). The rate date selected should match the transaction date, not the server's UTC date.

**Prevention:**
- Cache key should always use the **transaction's `date` field** (a `date` type set by the user), not `CURRENT_DATE` in the server. This is already the right approach given the historical accuracy requirement.
- Expiry logic: a rate for a past date never needs re-fetching (historical rates don't change). Only today's rate needs a TTL. Implement: `WHERE rate_date < CURRENT_DATE OR (rate_date = CURRENT_DATE AND fetched_at > NOW() - INTERVAL '24 hours')`.

**Detection:** Test with a transaction dated yesterday. Verify the cache lookup uses the transaction's date, not today's server date.

**Phase:** Rate caching implementation.

---

## Minor Pitfalls

---

### Pitfall 12: `formatCurrencyCompact` Formatter Cache Is Module-Level (Serverless Safe)

**What goes wrong (non-issue confirmed):** The `formatterCache` and `compactFormatterCache` Maps in `finance-utils.ts` are module-level. In a traditional Node server, this would persist across requests. In Vercel serverless functions, each cold start creates a new module scope, so the cache is ephemeral — it will never grow unboundedly, but it also won't persist warm-start optimizations reliably.

**Actual risk:** None. `Intl.NumberFormat` construction is cheap. The cache provides marginal benefit in serverless but causes no harm. No action needed.

**Phase:** Not a blocker. Document as a non-issue for future contributors.

---

### Pitfall 13: Missing Currency Selector Defaults to Wrong Currency After Profile Change

**What goes wrong:** The transaction form's currency selector defaults to the user's base currency. If the user changes their base currency in the financial profile (e.g., from USD to COP), existing default logic in the form may cache the old default at mount time. A transaction entered immediately after a profile change could default to the old currency.

**Prevention:**
- Read currency default from the live profile value passed as a prop, not from a closure captured at component mount. Ensure the currency default is derived from `financialProfile.currency` reactively.

**Detection:** Change profile currency, immediately open the add transaction sheet, verify the currency selector shows the new base currency.

**Phase:** UI implementation phase.

---

### Pitfall 14: ExchangeRate-API Free Base Currency Limitation

**What goes wrong:** The ExchangeRate-API free open endpoint uses USD as the only supported base. If the user's base currency is EUR, the endpoint `open.er-api.com/v6/latest/EUR` may return an error or an unexpected response depending on how the free tier is configured.

**Why it matters for this project:** The current user uses USD as base (per PROJECT.md). However, the app supports 30 currencies including EUR, GBP, etc. If another user with EUR base is added, rate lookups against a non-USD base could silently return wrong data.

**Prevention:**
- Always fetch rates with USD as base and convert via cross-rates: `COP_in_EUR = (amount_COP / rate_USD_COP) * rate_USD_EUR`.
- Or use Frankfurter (which supports any base currency freely) from the start.

**Phase:** Rate fetch utility implementation.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| API provider selection | ExchangeRate-API free plan has no historical endpoint | Use Frankfurter or accept today's rate for backdated transactions |
| Exchange rate column type | `numeric(12,2)` truncates sub-cent rates to zero | Use `numeric(18,6)` for rate columns |
| DB migration | NOT NULL without DEFAULT fails on existing rows | Add `DEFAULT 'USD'` and `DEFAULT 1.000000` in migration |
| Conversion arithmetic | Float multiply introduces sub-cent drift | Multiply in Postgres or round JS result to 2 places before storing |
| Conversion direction | Multiply vs. divide confusion with COP→USD | Name convention: `rateToBase`; formula: `amount / rateToBase` |
| Rate cache key design | Missing `date` dimension loses historical accuracy | Cache key = `(base, quote, rate_date)` with UNIQUE constraint |
| Concurrent saves | Race condition burns quota on duplicate fetches | Use `INSERT ... ON CONFLICT DO NOTHING` |
| COP display | Hard-coded `minimumFractionDigits: 2` adds wrong `.00` | Remove override; let Intl use CLDR default for COP |
| Compact formatter threshold | `>= 1000` triggers compact for nearly all COP amounts | Raise threshold or make currency-aware |
| Legacy transaction queries | `WHERE exchange_rate IS NOT NULL` silently drops old rows | Never filter on exchange_rate for totals; old rows have `1.000000` |
| Timezone / date handling | Server UTC date != user's Colombia date at night | Always use transaction.date field, not server's CURRENT_DATE |

---

## Sources

- ExchangeRate-API historical data plan restriction: https://www.exchangerate-api.com/docs/historical-data-requests
- ExchangeRate-API free plan overview: https://www.exchangerate-api.com/docs/free
- Frankfurter free historical rates API: https://frankfurter.dev/
- PostgreSQL numeric precision (official docs): https://www.postgresql.org/docs/current/datatype-numeric.html
- Crunchy Data — money in Postgres: https://www.crunchydata.com/blog/working-with-money-in-postgres
- Shopify engineering — safely adding NOT NULL columns: https://shopify.engineering/add-not-null-colums-to-database
- Postgres concurrently-safe upsert: https://devandchill.com/posts/2020/02/postgres-building-concurrently-safe-upsert-queries/
- MDN Intl.NumberFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- Serverless race conditions Next.js: https://www.marc0.dev/en/blog/serverless/serverless-race-conditions-redis-locking-guide-next-js-1767987756289
- Dinero.js (float avoidance): https://www.dinerojs.com/
- Honeybadger — currency calculations in JavaScript: https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/
