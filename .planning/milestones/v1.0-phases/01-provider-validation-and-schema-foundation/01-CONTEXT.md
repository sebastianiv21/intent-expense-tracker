# Phase 1: Provider Validation and Schema Foundation - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that the chosen exchange rate provider (Frankfurter, fallback fawazahmed0) supports COP rates, document the decision, then migrate the DB schema: add `currency`, `original_amount`, and `exchange_rate` columns to `transactions`, and create the `exchange_rate_cache` table with a UNIQUE index on `(from_currency, to_currency, rate_date)`.

This phase produces no application logic — it is the foundation gate. All downstream phases depend on it.

</domain>

<decisions>
## Implementation Decisions

### Provider Validation

- **D-01:** Run a one-off Node.js/curl script that calls the Frankfurter API for a COP/USD rate. If it returns a valid rate, Frankfurter is confirmed. Document the outcome in STATE.md Key Decisions. The script is disposable after it runs — no permanent script file needed.
- **D-02:** Test Frankfurter only first. If COP works, decision is made and fawazahmed0 is not tested. Only test fawazahmed0 if Frankfurter fails to return a COP rate.

### Schema — transactions table

- **D-03:** `original_amount` column is `NOT NULL`. For existing rows (all USD), the migration sets `DEFAULT original_amount = amount` so all rows get a clean, semantically correct value (original amount = converted amount for same-currency transactions).
- **D-04:** `exchange_rate` column is `numeric(20,10)` — required because COP/USD rate (~0.000244) would truncate to zero at `numeric(12,2)`. Default for existing rows = 1.0.
- **D-05:** `currency` column is `varchar(3) NOT NULL DEFAULT 'USD'` — existing rows are treated as base-currency (USD).
- **D-06:** The existing `amount` column continues to store the base-currency converted value. No renaming, no type change — all existing dashboard and aggregation queries remain untouched.

### Schema — exchange_rate_cache table

- **D-07:** Columns: `from_currency varchar(3)`, `to_currency varchar(3)`, `rate_date date`, `rate numeric(20,10)`, `fetched_at timestamp`. UNIQUE index on `(from_currency, to_currency, rate_date)` for cache lookup.
- **D-08:** No `userId` column — this is a global cache (single-user app, rates are not user-specific).

### Migration

- **D-09:** Single migration file for all Phase 1 schema changes (transactions new columns + exchange_rate_cache table creation). This was not explicitly discussed but is the natural default — the planner may split if there's a strong reason.

### Claude's Discretion

- Migration file name (follow existing pattern: `0003_<descriptive-slug>.sql`)
- Whether to use a `.ts` script or a shell `curl` command for provider validation — either works, use whatever is simplest
- Primary key design for `exchange_rate_cache` (UUID vs composite primary key on the unique columns)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements

- `.planning/REQUIREMENTS.md` — v1 requirements INFRA-01, INFRA-02, SCHEMA-01 through SCHEMA-05 define the exact columns, types, and success criteria for this phase. Read this before writing any schema code.
- `.planning/PROJECT.md` — Key Decisions table documents pre-planning decisions (numeric precision, DEFAULT strategy, amount column reuse). Confirms constraints.
- `.planning/STATE.md` — Accumulated context section has the COP provider note and numeric precision rationale.

### Existing Schema

- `web/lib/schema.ts` — Current Drizzle schema. `transactions` table definition is the primary integration point. `financialProfile` has the existing `currency varchar(3)` pattern to follow.
- `web/drizzle/` — Existing migration files (0000–0002). New migration must be numbered 0003.
- `web/drizzle.config.ts` — Drizzle Kit config (used to generate and push migrations).

### No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `web/lib/schema.ts` `financialProfile.currency`: `varchar("currency", { length: 3 }).notNull().default("USD")` — exact same pattern for the new `transactions.currency` column.
- `web/lib/schema.ts` `transactions.amount`: `numeric("amount", { precision: 12, scale: 2 })` — existing column stays unchanged; new `original_amount` follows the same `numeric` pattern.
- `web/drizzle/` existing migrations — follow the naming convention `XXXX_kebab-case-description.sql`.

### Established Patterns

- Drizzle ORM schema-first: define columns in `web/lib/schema.ts`, generate migration with `drizzle-kit generate`, apply with `drizzle-kit push` or migration runner.
- `numeric(precision, scale)` for all financial values — `precision: 20, scale: 10` needed for exchange rates.
- `index()` from `drizzle-orm/pg-core` is the pattern for adding indexes (see `transactions_userId_idx`, `transactions_date_idx`).

### Integration Points

- `web/lib/schema.ts` — add three columns to `transactions` table definition and add `exchangeRateCache` table.
- `web/drizzle/` — new 0003 migration file.
- `web/lib/db.ts` — no changes needed; Drizzle client is already set up.

</code_context>

<specifics>
## Specific Ideas

- The Frankfurter API endpoint to test: `https://api.frankfurter.app/latest?from=COP&to=USD` (or `https://api.frankfurter.app/2026-04-15?from=COP&to=USD` for a specific date). A 200 with a non-zero rate = confirmed.
- For the script: a one-liner like `node -e "fetch('https://api.frankfurter.app/latest?from=COP&to=USD').then(r=>r.json()).then(console.log)"` is sufficient — no file needed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-provider-validation-and-schema-foundation*
*Context gathered: 2026-04-19*
