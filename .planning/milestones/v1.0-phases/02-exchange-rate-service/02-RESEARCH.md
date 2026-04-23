# Phase 02: Exchange Rate Service - Research

**Researched:** 2026-04-20
**Domain:** HTTP fetch + Drizzle ORM cache-first service
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** If fawazahmed0 is unreachable or returns an error, `getOrFetchExchangeRate` **throws**. The error propagates to the caller (Phase 3 server actions), which surface a user-facing message. No silent degradation, no stale fallback, no null return.
- **D-02:** **No retries.** Fail immediately on the first error. fawazahmed0 CDN is highly available and this is a personal app — retry logic adds complexity with minimal benefit.
- **D-03:** Provider is **fawazahmed0** — Frankfurter tested live and rejected (no COP support). All service code targets fawazahmed0 only.
- **D-04:** Response shape: `{ "date": "...", "cop": { "usd": 0.000277 } }` — lowercase from-currency as top-level key, with nested to-currency key containing the rate.
- **D-05:** Rate direction: the service fetches the native from→to direction only. fawazahmed0 URL pattern: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{from}.json` where `{from}` is lowercase.
- **D-06:** `getOrFetchExchangeRate("USD", "USD", any_date)` returns `1.0` immediately without any DB lookup or external API call.

### Claude's Discretion

- Whether to use a named `Error` subclass or a plain `Error` for API failures — keep it simple
- Whether to normalize currency codes to uppercase before lookup (safe default: yes)
- Function signature details (async, return type as `number` or `Promise<number>`)

### Deferred Ideas (OUT OF SCOPE)

- CDN fallback strategy (try jsDelivr then Cloudflare on failure) — explicitly deferred by D-02
- Return null option — rejected in favor of throwing
- Stale cache fallback — rejected to prevent silent bad data
- Reverse direction (USD→COP via 1/rate) — out of scope for Phase 2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-03 | Exchange rate service fetches from fawazahmed0 API for the exact date of the transaction and stores result in cache | fawazahmed0 API verified live; URL pattern and response shape confirmed; Drizzle insert pattern documented |
| INFRA-04 | Rate cache lookup returns cached rate if it exists for that `(from, to, date)` triple; only calls external API on miss | `exchange_rate_cache` UNIQUE index on `(from_currency, to_currency, rate_date)` confirmed in schema; Drizzle select+where pattern documented |
</phase_requirements>

---

## Summary

Phase 2 builds a single file: `web/lib/exchange-rates.ts` — a pure TypeScript service module with no UI, no Server Actions, and no route changes. The entire deliverable is one exported async function, `getOrFetchExchangeRate(from, to, date)`, that implements cache-first lookup against the `exchange_rate_cache` Neon table and falls back to fetching from the fawazahmed0 CDN.

All architectural decisions are locked from Phase 1 discussion. The API provider (fawazahmed0), response shape, error behavior (throw, no retry), same-currency shortcut, and URL pattern are all specified. The Drizzle schema for `exchange_rate_cache` was deployed in migration `0003_multi-currency-schema.sql` and is live. The `db` export from `web/lib/db.ts` is the only external dependency from the project codebase.

The key technical facts needed to implement correctly are: (1) fawazahmed0 returns a flat JSON object with the from-currency as the single lowercase key wrapping a map of all target rates; (2) the UNIQUE index on the cache table means a duplicate insert for the same `(from, to, date)` triple will throw a PostgreSQL unique constraint error unless guarded; (3) Drizzle `numeric` columns return `string` in TypeScript — the service must parse the stored `rate` to `number` before returning. Verification of the four success-criteria outcomes should be done via a manual `node -e` REPL script, since the project has no test framework.

**Primary recommendation:** Implement `getOrFetchExchangeRate` as a straightforward sequential: guard same-currency → select cache → if hit return parsed rate → else fetch API → insert row → return rate. Use `onConflictDoNothing` on the insert to safely handle any race where two calls insert the same triple concurrently. Return type is `Promise<number>`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Exchange rate caching | Database / Storage | — | Serverless functions have no shared in-memory state; Neon is the only persistence layer |
| External rate fetch | API / Backend (server module) | — | Network calls must not run in the browser; this is a server-only `lib/` module |
| Rate lookup | API / Backend (server module) | — | Called by Phase 3 server actions, runs in Node.js / edge context |
| Same-currency shortcut | API / Backend (server module) | — | Pure logic, no I/O; lives in the service function before any DB or network call |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.2 [VERIFIED: npm registry] | DB reads/writes against Neon | Already the project ORM; no new dependency |
| @neondatabase/serverless | 1.0.2 [VERIFIED: package.json] | Neon PostgreSQL serverless driver | Already configured in `web/lib/db.ts` |
| Native `fetch` | Node 18+ built-in | HTTP call to fawazahmed0 CDN | No dependency needed; Next.js 16 targets Node 20+ |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | No new packages required for this phase |

**Installation:**

No new packages. The service file imports only from existing project dependencies.

---

## Architecture Patterns

### System Architecture Diagram

```
Caller (Phase 3 server action)
         |
         v
getOrFetchExchangeRate(from, to, date)
         |
         +-- [from === to] --> return 1.0 (no I/O)
         |
         v
Neon DB: SELECT from exchange_rate_cache
WHERE from_currency = $from AND to_currency = $to AND rate_date = $date
         |
         +-- [row found] --> parse rate string to number --> return
         |
         v
fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{from_lower}.json")
         |
         +-- [non-2xx or network error] --> throw Error
         |
         v
Parse JSON: data[from_lower][to_lower] --> rate (number)
         |
         +-- [key missing] --> throw Error
         |
         v
Neon DB: INSERT INTO exchange_rate_cache (from_currency, to_currency, rate_date, rate)
         VALUES ($from, $to, $date, $rate)
         ON CONFLICT DO NOTHING
         |
         v
return rate (number)
```

### Recommended Project Structure

```
web/lib/
├── exchange-rates.ts    # NEW — the entire Phase 2 deliverable
├── db.ts                # existing Drizzle client (imported, not modified)
├── schema.ts            # existing — exchangeRateCache table (imported, not modified)
└── currencies.ts        # existing — SUPPORTED_CURRENCIES (not needed in Phase 2)
```

### Pattern 1: Cache-First DB Lookup (Drizzle)

**What:** Select a single row by composite key; return early if found.
**When to use:** Any read before an expensive external call.

```typescript
// Source: observed pattern in web/lib/actions/financial-profile.ts + drizzle.team/docs/insert
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exchangeRateCache } from "@/lib/schema";

const cached = await db
  .select()
  .from(exchangeRateCache)
  .where(
    and(
      eq(exchangeRateCache.fromCurrency, from),
      eq(exchangeRateCache.toCurrency, to),
      eq(exchangeRateCache.rateDate, date),
    ),
  )
  .limit(1);

if (cached[0]) {
  return Number(cached[0].rate); // numeric column returns string — must parse
}
```

### Pattern 2: Insert with Conflict Guard (Drizzle)

**What:** Insert a new cache row; ignore if another caller already inserted the same triple.
**When to use:** Whenever a UNIQUE constraint exists and concurrent calls are plausible.

```typescript
// Source: https://orm.drizzle.team/docs/insert
await db
  .insert(exchangeRateCache)
  .values({
    fromCurrency: from,
    toCurrency: to,
    rateDate: date,
    rate: rate.toString(),
  })
  .onConflictDoNothing();
```

### Pattern 3: Native Fetch with Non-2xx Error Guard

**What:** Call fawazahmed0 CDN and throw on any failure (D-01, D-02).
**When to use:** All external HTTP calls in this service.

```typescript
// Source: [VERIFIED: fawazahmed0 API live test 2026-04-20]
const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${from.toLowerCase()}.json`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(
    `Exchange rate fetch failed: ${res.status} for ${from}/${to} on ${date}`,
  );
}
const data = await res.json() as Record<string, unknown>;
const fromKey = from.toLowerCase();
const toKey = to.toLowerCase();
const ratesForFrom = data[fromKey] as Record<string, number> | undefined;
if (!ratesForFrom || typeof ratesForFrom[toKey] !== "number") {
  throw new Error(`Rate not found in response for ${from}/${to}`);
}
const rate = ratesForFrom[toKey];
```

### Anti-Patterns to Avoid

- **Returning `null` on error:** Rejected by D-01 — callers must get a number or an exception, never null.
- **Trusting the date from the API response:** The API response includes a `"date"` top-level key. Do NOT use this as the cache key — always use the requested `date` parameter. The response date may differ for `@latest`.
- **Skipping the `Number()` parse on cache hit:** Drizzle `numeric` columns are typed as `string` at runtime. Returning `cached[0].rate` directly will silently return a string where a number is expected.
- **Using relative imports from `../` for schema/db:** Project convention requires `@/lib/schema` and `@/lib/db` alias paths.
- **Using `interface` for internal types:** Project convention uses `type` for internal shapes; `interface` only for component props that extend HTML attributes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unique constraint on insert | Try/catch + check-then-insert | `onConflictDoNothing()` | Race condition: two concurrent callers can both pass the check and both try to insert |
| Date string formatting | Custom date serializer | Pass ISO `YYYY-MM-DD` string directly | Drizzle `date` column accepts string; no transform needed |
| Rate precision storage | `parseFloat` + `toFixed` before insert | Store as `rate.toString()` | Drizzle numeric column accepts string; preserves full precision |

**Key insight:** The UNIQUE index on `exchange_rate_cache` makes `onConflictDoNothing` the correct insert pattern — it handles the race case that a check-then-insert cannot.

---

## Common Pitfalls

### Pitfall 1: Drizzle numeric returns string, not number

**What goes wrong:** `cached[0].rate` is typed as `string` at runtime even though the column is `numeric`. Returning it directly causes downstream math to silently produce `NaN` or string concatenation.
**Why it happens:** PostgreSQL numeric comes back as a string over the wire; Drizzle preserves this to avoid floating-point loss.
**How to avoid:** Always wrap with `Number(cached[0].rate)` before returning from the service.
**Warning signs:** Type checker may not catch this if the return type annotation is loose.

### Pitfall 2: Invalid date (future or pre-2021) returns HTTP 404

**What goes wrong:** fawazahmed0 returns a `404` for dates outside its dataset (e.g., far future, pre-2021). The `res.ok` check catches this — but the error message should include the date to aid debugging.
**Why it happens:** The CDN only has data from the date the project started publishing. [VERIFIED: curl test on 2099-01-01 returned HTTP 404; curl on 2000-01-01 returned HTTP 404]
**How to avoid:** The `!res.ok` guard handles this. Include the date in the error message.
**Warning signs:** In testing, using a future date silently fails if `res.ok` guard is missing.

### Pitfall 3: Currency code case mismatch

**What goes wrong:** The fawazahmed0 URL and JSON keys are all lowercase (`cop`, `usd`). The DB stores uppercase (`COP`, `USD`). If the caller passes mixed-case and no normalization is applied, the cache lookup misses and the API URL is malformed.
**Why it happens:** Two different conventions: REST API uses lowercase, ISO 4217 / DB convention uses uppercase.
**How to avoid:** Normalize to uppercase on entry to the function for the DB key, and `.toLowerCase()` at the point of building the API URL. This is in Claude's Discretion — recommend always normalizing.
**Warning signs:** Cache miss rate of 100% for valid pairs that were previously cached.

### Pitfall 4: Using `@latest` date in cache key

**What goes wrong:** If the service is called for today's date, one might be tempted to use `@latest` in the CDN URL. The response has `"date": "2026-04-20"` but the cache key would be stored as `"latest"`, causing a permanent cache miss.
**Why it happens:** The `@latest` tag resolves to today's date on the CDN, but the JSON `date` field reflects the actual date. Using the caller-supplied `date` parameter as the cache key prevents this.
**How to avoid:** Always use the caller-supplied `date` parameter (e.g., `"2026-04-20"`) in both the CDN URL and the cache key. Never use `@latest` or the response's `date` field for caching.
**Warning signs:** Cache table grows with `@latest` rows and real date rows for the same actual date.

---

## Code Examples

### Complete function skeleton (verified patterns)

```typescript
// Source: patterns verified from codebase + live API tests 2026-04-20
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exchangeRateCache } from "@/lib/schema";

export async function getOrFetchExchangeRate(
  from: string,
  to: string,
  date: string, // ISO 8601: "YYYY-MM-DD"
): Promise<number> {
  // D-06: same-currency shortcut — no I/O
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();
  if (normalizedFrom === normalizedTo) return 1.0;

  // Cache lookup
  const cached = await db
    .select()
    .from(exchangeRateCache)
    .where(
      and(
        eq(exchangeRateCache.fromCurrency, normalizedFrom),
        eq(exchangeRateCache.toCurrency, normalizedTo),
        eq(exchangeRateCache.rateDate, date),
      ),
    )
    .limit(1);

  if (cached[0]) {
    return Number(cached[0].rate); // numeric column is a string at runtime
  }

  // Cache miss — fetch from fawazahmed0
  const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${normalizedFrom.toLowerCase()}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Exchange rate fetch failed: HTTP ${res.status} for ${normalizedFrom}/${normalizedTo} on ${date}`,
    );
  }

  const data = (await res.json()) as Record<string, unknown>;
  const fromKey = normalizedFrom.toLowerCase();
  const toKey = normalizedTo.toLowerCase();
  const ratesForFrom = data[fromKey] as Record<string, number> | undefined;

  if (!ratesForFrom || typeof ratesForFrom[toKey] !== "number") {
    throw new Error(
      `Rate not found in API response for ${normalizedFrom}/${normalizedTo} on ${date}`,
    );
  }

  const rate = ratesForFrom[toKey];

  // Insert into cache — ignore if a concurrent caller already inserted this triple
  await db
    .insert(exchangeRateCache)
    .values({
      fromCurrency: normalizedFrom,
      toCurrency: normalizedTo,
      rateDate: date,
      rate: rate.toString(),
    })
    .onConflictDoNothing();

  return rate;
}
```

### Manual verification script for success criteria

```bash
# Run from web/ directory after implementing the service
node -e "
const { getOrFetchExchangeRate } = require('./lib/exchange-rates');
async function verify() {
  // SC-1: COP→USD should be ~0.000244 (not ~4100)
  const copUsd = await getOrFetchExchangeRate('COP', 'USD', '2026-04-15');
  console.log('SC-1 COP/USD:', copUsd, copUsd < 0.001 ? 'PASS' : 'FAIL');

  // SC-4: same-currency returns 1.0 immediately
  const usdUsd = await getOrFetchExchangeRate('USD', 'USD', '2026-04-15');
  console.log('SC-4 USD/USD:', usdUsd, usdUsd === 1.0 ? 'PASS' : 'FAIL');

  // SC-2: second call for same triple should hit cache (no API log)
  const copUsd2 = await getOrFetchExchangeRate('COP', 'USD', '2026-04-15');
  console.log('SC-2 cache hit:', copUsd2, 'values match:', copUsd === copUsd2 ? 'PASS' : 'FAIL');

  // SC-3: new date should insert a row (check DB after)
  const copUsdNew = await getOrFetchExchangeRate('COP', 'USD', '2026-04-10');
  console.log('SC-3 new date fetched:', copUsdNew, copUsdNew > 0 ? 'PASS' : 'FAIL');
}
verify().catch(console.error);
"
```

Note: This requires `DATABASE_URL` in the environment and the schema migration to have been applied (Phase 1 prerequisite). The project has no test framework (per CLAUDE.md constraint), so manual REPL verification is the prescribed approach.

---

## API Reference (fawazahmed0)

### Verified API facts [VERIFIED: live curl tests 2026-04-20]

| Property | Value |
|----------|-------|
| Primary CDN URL | `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{from_lower}.json` |
| Date format in URL | ISO 8601 `YYYY-MM-DD` or literal `latest` |
| Response top-level keys | `"date"` (string) and `"{from_lower}"` (object) |
| Response rates | `data[from_lower][to_lower]` → `number` |
| COP/USD rate (2026-04-15) | `0.00027822299` — confirms direction is from→to, not inverted |
| USD/COP rate (2026-04-15) | `3594.23929256` — confirms inverse is NOT 1/rate (it's a native lookup) |
| USD self-reference | `data["usd"]["usd"] === 1` — API always returns 1 for same-currency; D-06 shortcut bypasses this |
| Invalid date HTTP status | `404` (future dates and very old dates) |
| COP support | Confirmed — 300 target currencies available |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js fetch | HTTP call to fawazahmed0 | ✓ | Node 20+ (built-in) | — |
| DATABASE_URL | Drizzle/Neon connection | ✓ (env var, not committed) | — | — |
| Neon DB (exchange_rate_cache table) | Cache read/write | ✓ (migration 0003 applied) | — | — |
| fawazahmed0 CDN | Rate fetch on cache miss | ✓ | Public CDN, no auth | — |

**Missing dependencies with no fallback:** None — all dependencies verified available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — CLAUDE.md explicitly states "No tests: No existing test framework — don't add test infrastructure as part of this milestone" |
| Config file | none |
| Quick run command | Manual verification via `node -e "..."` REPL script (see Code Examples section) |
| Full suite command | Same — no automated suite |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Verified? |
|--------|----------|-----------|-------------------|-----------|
| INFRA-03 | Service fetches from API and stores in cache on miss | manual | `node -e "..."` (SC-3 scenario) | Manual after implementation |
| INFRA-04 | Cache hit returns stored rate without API call | manual | `node -e "..."` (SC-2 scenario) | Manual after implementation |

### Wave 0 Gaps

None — no test infrastructure to create. CLAUDE.md prohibits adding test infrastructure in this milestone. All verification is manual REPL execution of the four success criteria.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — (service is called only from authenticated server actions; no user-facing surface) |
| V5 Input Validation | yes | Normalize `from`/`to` to uppercase; validate `date` is a string before use in URL |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| URL injection via currency codes | Tampering | Normalize to uppercase then `.toLowerCase()` — only alphabet chars survive; reject codes not matching `[A-Z]{3}` if hardening is wanted |
| URL injection via date parameter | Tampering | Phase 3 callers derive `date` from the transaction's `date` field (validated ISO string); no free-form user input reaches `getOrFetchExchangeRate` directly in Phase 2 |
| Storing malformed rate values | Tampering | Rate is extracted from `typeof ratesForFrom[toKey] !== "number"` guard before storage |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Frankfurter as provider | fawazahmed0 (jsDelivr CDN) | Phase 1 (2026-04-20) | Response shape differs; no auth required; COP supported |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `fetch` is available as a global in the Next.js 16 / Node 20 server environment without importing a polyfill | Standard Stack | Service would throw `ReferenceError: fetch is not defined`; fix: import `node-fetch` or add polyfill |
| A2 | The `exchange_rate_cache` migration (`0003`) has been applied to the production Neon DB (Phase 1 prerequisite) | Environment Availability | INSERT would fail with "relation does not exist"; fix: run `pnpm db:push` or apply migration |

---

## Open Questions

1. **Return type precision**
   - What we know: `rate.toString()` is stored; `Number(rate_string)` is returned. JavaScript `Number` is IEEE 754 double — sufficient for COP/USD at ~0.000278.
   - What's unclear: Whether callers (Phase 3) will need higher precision for multiplication.
   - Recommendation: Return `number`. If precision loss becomes observable (unlikely for display), callers can use `rate.toString()` directly for storage and Drizzle will handle string→numeric cleanly.

2. **Whether `to` key for same-currency exists in fawazahmed0 response**
   - What we know: `data["usd"]["usd"] === 1` (verified live). So the API does return a self-reference.
   - What's unclear: Whether this is true for all 300 currencies or just USD.
   - Recommendation: The D-06 same-currency shortcut fires before any API call, so this is irrelevant for correctness. Document the shortcut for clarity.

---

## Sources

### Primary (HIGH confidence)
- fawazahmed0 CDN live test — `curl` verified response shape, COP/USD rate, USD/COP rate, USD self-reference, HTTP 404 behavior for invalid dates (2026-04-20)
- `web/lib/schema.ts` — `exchangeRateCache` table definition confirmed in codebase
- `web/lib/db.ts` — `db` export confirmed
- `web/drizzle/0003_multi-currency-schema.sql` — confirmed migration applied, `exchange_rate_cache` table structure
- `npm view drizzle-orm version` → `0.45.2` [VERIFIED: npm registry 2026-04-20]

### Secondary (MEDIUM confidence)
- [Drizzle ORM Insert docs](https://orm.drizzle.team/docs/insert) — `onConflictDoNothing`, `onConflictDoUpdate`, and insert patterns
- [Drizzle ORM Upsert guide](https://orm.drizzle.team/docs/guides/upsert) — conflict target specification

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all existing packages verified
- API facts: HIGH — verified via live curl against actual CDN
- DB patterns: HIGH — verified from official Drizzle docs + existing codebase usage
- Architecture: HIGH — all decisions locked from CONTEXT.md

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (fawazahmed0 CDN URL structure is stable; Drizzle 0.45.x API is stable)
