# Phase 2: Exchange Rate Service - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `web/lib/exchange-rates.ts` — a single exported function `getOrFetchExchangeRate(from, to, date)` that is cache-first against `exchange_rate_cache` and calls fawazahmed0 on a cache miss. This is a pure service module with no UI and no form or action changes — those belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### API Failure Behavior

- **D-01:** If fawazahmed0 is unreachable or returns an error, `getOrFetchExchangeRate` **throws**. The error propagates to the caller (Phase 3 server actions), which surface a user-facing message. No silent degradation, no stale fallback, no null return.
- **D-02:** **No retries.** Fail immediately on the first error. fawazahmed0 CDN is highly available and this is a personal app — retry logic adds complexity with minimal benefit.

### Provider & Response Shape (locked from Phase 1)

- **D-03:** Provider is **fawazahmed0** — Frankfurter tested live and rejected (no COP support). All service code targets fawazahmed0 only.
- **D-04:** Response shape: `{ "date": "...", "cop": { "usd": 0.000277 } }` — lowercase from-currency as top-level key, with nested to-currency key containing the rate.
- **D-05:** Rate direction: the service fetches the native from→to direction only. fawazahmed0 URL pattern: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{from}.json` where `{from}` is lowercase.

### Same-Currency Shortcut

- **D-06:** `getOrFetchExchangeRate("USD", "USD", any_date)` returns `1.0` immediately without any DB lookup or external API call. This is required by success criteria 4.

### Claude's Discretion

- Whether to use a named `Error` subclass or a plain `Error` for API failures — keep it simple
- Whether to normalize currency codes to uppercase before lookup (safe default: yes)
- Function signature details (async, return type as `number` or `Promise<number>`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements

- `.planning/REQUIREMENTS.md` §INFRA-03, INFRA-04 — defines exact cache-first behavior and success criteria for this service
- `.planning/ROADMAP.md` §Phase 2 — success criteria (all four must be TRUE after this phase)

### Project Context

- `.planning/STATE.md` §Accumulated Context — fawazahmed0 confirmed decision with response shape and both CDN URLs documented
- `.planning/PROJECT.md` §Key Decisions — provider decision rationale and API budget constraint (1,500 req/month, 24h cache mandatory)

### Existing Schema (integration points)

- `web/lib/schema.ts` — `exchangeRateCache` table definition: `fromCurrency`, `toCurrency`, `rateDate`, `rate`, `fetchedAt`, UNIQUE index on `(from_currency, to_currency, rate_date)`
- `web/lib/db.ts` — Drizzle client (Neon serverless pool) — the service reads/writes through this

### No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `web/lib/schema.ts` `exchangeRateCache` — table is live in Neon, fully defined. Service reads for cache hit, inserts on miss.
- `web/lib/db.ts` — existing Drizzle client (`db` export). Service imports this directly, no new DB setup needed.
- `web/lib/schema.ts` `transactions.exchangeRate` — `numeric(20,10)` confirms the precision contract the service must satisfy.

### Established Patterns

- All server-side modules in `web/lib/` are plain TypeScript files with named exports (kebab-case filename, e.g. `exchange-rates.ts`).
- Drizzle query style: `db.select().from(table).where(...)` for reads, `db.insert(table).values(...)` for writes.
- No in-memory caching — all persistence goes to Neon (serverless functions have no shared memory).

### Integration Points

- `web/lib/exchange-rates.ts` (new file) — the deliverable of this phase. Phase 3 actions import and call `getOrFetchExchangeRate` from here.
- No routes, no components, no actions touched in this phase.

</code_context>

<specifics>
## Specific Ideas

- fawazahmed0 CDN URL pattern: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{from_lowercase}.json` (jsDelivr primary). Cloudflare fallback: `https://currency-api.pages.dev/v1/currencies/{from_lowercase}.json` — but D-02 says we do NOT retry, so only the primary URL is used.
- Success criteria verification: the roadmap specifies four observable outcomes; the planner should include a short verification step (manual `node -e` or REPL call) to confirm each criterion after implementation.

</specifics>

<deferred>
## Deferred Ideas

- **CDN fallback strategy** — trying jsDelivr then Cloudflare on failure was considered and explicitly deferred. D-02 settles this: fail immediately, no retry. If CDN reliability becomes an issue in production, add retry then.
- **Return null option** — considered; rejected in favor of throwing to avoid null-handling complexity in Phase 3.
- **Stale cache fallback** — considered; rejected to prevent silent bad data.
- **Reverse direction (USD→COP via 1/rate)** — not discussed; Phase 3 will clarify if needed. Assume native direction only for now.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-exchange-rate-service*
*Context gathered: 2026-04-20*
