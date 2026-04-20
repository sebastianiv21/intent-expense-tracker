# Phase 1: Provider Validation and Schema Foundation - Research

**Researched:** 2026-04-19
**Domain:** Exchange rate API validation + PostgreSQL schema migration (Drizzle ORM)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Run a one-off Node.js/curl script that calls the Frankfurter API for a COP/USD rate. If it returns a valid rate, Frankfurter is confirmed. Document the outcome in STATE.md Key Decisions. The script is disposable after it runs — no permanent script file needed.
- **D-02:** Test Frankfurter only first. If COP works, decision is made and fawazahmed0 is not tested. Only test fawazahmed0 if Frankfurter fails to return a COP rate.
- **D-03:** `original_amount` column is `NOT NULL`. For existing rows (all USD), the migration sets `DEFAULT original_amount = amount` so all rows get a clean, semantically correct value.
- **D-04:** `exchange_rate` column is `numeric(20,10)` — required because COP/USD rate (~0.000244) would truncate to zero at `numeric(12,2)`. Default for existing rows = 1.0.
- **D-05:** `currency` column is `varchar(3) NOT NULL DEFAULT 'USD'` — existing rows are treated as base-currency (USD).
- **D-06:** The existing `amount` column continues to store the base-currency converted value. No renaming, no type change.
- **D-07:** `exchange_rate_cache` columns: `from_currency varchar(3)`, `to_currency varchar(3)`, `rate_date date`, `rate numeric(20,10)`, `fetched_at timestamp`. UNIQUE index on `(from_currency, to_currency, rate_date)`.
- **D-08:** No `userId` column on `exchange_rate_cache` — global cache, single-user app.
- **D-09:** Single migration file for all Phase 1 schema changes.

### Claude's Discretion

- Migration file name (follow existing pattern: `0003_<descriptive-slug>.sql`)
- Whether to use a `.ts` script or a shell `curl` command for provider validation
- Primary key design for `exchange_rate_cache` (UUID vs composite primary key)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Validate Frankfurter supports COP; fallback to fawazahmed0 if not | **RESOLVED during research**: Frankfurter does NOT support COP (verified live). fawazahmed0 supports COP and returns valid rates (verified live). Provider decision is made: use fawazahmed0. |
| INFRA-02 | `exchange_rate_cache` table with `(from_currency, to_currency, rate_date)` unique key | Drizzle `uniqueIndex().on(col1, col2, col3)` pattern confirmed. SQL DDL `CREATE UNIQUE INDEX` verified from existing migration pattern. |
| SCHEMA-01 | `transactions.currency varchar(3) NOT NULL DEFAULT 'USD'` | Exact pattern exists in `financialProfile.currency`. Migration: `ALTER TABLE ... ADD COLUMN ... DEFAULT 'USD' NOT NULL`. |
| SCHEMA-02 | `transactions.original_amount numeric(12,2)` | Note: REQUIREMENTS.md says `numeric(12,2)` but D-03 from CONTEXT.md says NOT NULL with `DEFAULT original_amount = amount`. D-04 specifies `numeric(20,10)` for exchange_rate — original_amount stays `numeric(12,2)` per REQUIREMENTS.md. |
| SCHEMA-03 | `transactions.exchange_rate numeric(20,10)` default 1.0 | Confirmed via Drizzle `numeric({ precision: 20, scale: 10 })`. COP/USD rate ~0.000244 fits. |
| SCHEMA-04 | `exchange_rate_cache` table with all required columns | Full Drizzle schema definition pattern identified. |
| SCHEMA-05 | Migration includes DEFAULT values so existing rows are treated as base-currency 1:1 | ALTER TABLE with DEFAULT on NOT NULL columns verified from existing migration `0002_add-currency-to-financial-profile.sql`. |

</phase_requirements>

---

## Summary

**Provider decision is already resolved by research.** Frankfurter API was tested live and confirmed it does NOT support COP — the `/currencies` endpoint lists 30 currencies with no COP present, and a direct `?from=COP&to=USD` query returns `{"message": "not found"}`. Per D-02, fawazahmed0 (exchange-api) is the confirmed fallback and has been verified live: COP/USD rate returns 0.000277 for both latest and historical dates, from both the jsDelivr CDN and the Cloudflare fallback.

**Schema changes are straightforward Drizzle migrations.** This project has three existing migration files (0000–0002) that establish the exact patterns to follow: `ALTER TABLE ... ADD COLUMN ... DEFAULT ... NOT NULL` for adding columns to existing tables, and `CREATE INDEX` / `CREATE UNIQUE INDEX` for indexes. The new migration will be `0003_multi-currency-schema.sql` with all Phase 1 changes in one file.

**No test infrastructure exists and none should be added** (CLAUDE.md constraint). The Validation Architecture section uses manual verification commands as the "test" — SQL queries against the live Neon database. The nyquist_validation is enabled in config but maps to manual DB query checks for this schema-only phase.

**Primary recommendation:** Skip Frankfurter validation script — the research already confirmed it fails. Document the provider decision directly in STATE.md and proceed to writing `schema.ts` changes and the 0003 migration.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Provider validation (INFRA-01) | Script/manual | — | One-off check, not application logic |
| exchange_rate_cache table (INFRA-02) | Database / Storage | — | Pure schema DDL |
| transactions schema columns (SCHEMA-01–05) | Database / Storage | API / Backend (Drizzle schema.ts) | Schema defined in Drizzle, applied to DB via migration |
| Drizzle schema.ts updates | API / Backend | — | Type definitions consumed by all query/action layers |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 (latest: 0.45.2) | ORM, schema definition, query builder | Already installed; project's only ORM layer |
| drizzle-kit | ^0.31.9 (latest: 0.31.10) | Migration generation and push | Already installed; existing migration workflow |
| @neondatabase/serverless | ^1.0.2 | Neon PostgreSQL serverless driver | Already installed; no change needed |

[VERIFIED: npm registry — `npm view drizzle-orm version` → 0.45.2, `npm view drizzle-kit version` → 0.31.10]

### No New Dependencies

This phase introduces no new npm packages. All changes are:
1. A one-time API probe (curl or `node -e fetch(...)`)
2. Schema.ts edits
3. A SQL migration file
4. STATE.md documentation update

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fawazahmed0/exchange-api | Frankfurter | Frankfurter doesn't support COP — not a valid alternative for this project |
| Single migration file (D-09) | Two migration files | Two files is cleaner but adds no value; single file matches all prior multi-change migrations |

---

## Architecture Patterns

### System Architecture Diagram

```
[Provider Validation]
  node -e fetch("api.frankfurter.app") 
        |-- RESULT: "not found" (COP unsupported)
        v
  Decision: fawazahmed0 confirmed as provider
        |
        v
  Document in STATE.md Key Decisions

[Schema Changes]
  web/lib/schema.ts
        |-- ADD: transactions.currency, transactions.original_amount, transactions.exchange_rate
        |-- ADD: exchangeRateCache table definition
        |-- ADD: uniqueIndex on (from_currency, to_currency, rate_date)
        v
  drizzle-kit generate
        v
  web/drizzle/0003_multi-currency-schema.sql  (generated, then reviewed)
        v
  drizzle-kit push  (applies to Neon DB)
        v
  Manual DB verification queries (success criteria checks)
```

### Recommended File Changes

```
web/
├── lib/schema.ts              # ADD 3 columns to transactions + new exchangeRateCache table
├── drizzle/
│   └── 0003_multi-currency-schema.sql    # Generated migration
└── (no new files needed)
.planning/
└── STATE.md                   # Document provider decision
```

### Pattern 1: ADD COLUMN with DEFAULT on NOT NULL (existing rows)

**What:** PostgreSQL allows adding a NOT NULL column with a DEFAULT in a single statement. The default is applied to existing rows immediately.

**When to use:** Any time you need to add a required column to a table that already has data.

**Example (from existing migration `0002_add-currency-to-financial-profile.sql`):**

```sql
-- Source: web/drizzle/0002_add-currency-to-financial-profile.sql [VERIFIED: file read]
ALTER TABLE "financial_profile" ADD COLUMN "currency" varchar(3) DEFAULT 'USD' NOT NULL;
```

**For this phase, the equivalent pattern for `original_amount`:**

```sql
-- original_amount: NOT NULL, default to existing amount value for historical rows
ALTER TABLE "transactions" ADD COLUMN "original_amount" numeric(12, 2) NOT NULL DEFAULT 0;
UPDATE "transactions" SET "original_amount" = "amount";
-- Note: Two-step because DEFAULT must be a constant, not a column reference.
-- After UPDATE, all existing rows have original_amount = amount (correct semantic).
```

**Important pitfall:** PostgreSQL `DEFAULT` on ADD COLUMN must be a constant expression. You cannot write `DEFAULT amount` (column reference). The correct pattern is: add with a safe numeric default (0 or same as amount), then UPDATE to set the correct value.

### Pattern 2: Drizzle Schema Definition for New Columns

**What:** Drizzle ORM schema definitions for the new columns, following existing project patterns.

**Example (based on existing `financialProfile.currency` pattern):**

```typescript
// Source: web/lib/schema.ts [VERIFIED: file read]
// Existing pattern to follow:
currency: varchar("currency", { length: 3 }).notNull().default("USD"),

// New columns to add to transactions table:
currency: varchar("currency", { length: 3 }).notNull().default("USD"),
originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
exchangeRate: numeric("exchange_rate", { precision: 20, scale: 10 }).notNull().default("1.0"),
```

### Pattern 3: Composite UNIQUE INDEX in Drizzle

**What:** `uniqueIndex()` with `.on(col1, col2, col3)` creates a composite unique constraint.

**Example:**

```typescript
// Source: Drizzle ORM official docs [CITED: https://orm.drizzle.team/docs/indexes-constraints]
import { uniqueIndex, pgTable } from "drizzle-orm/pg-core";

export const exchangeRateCache = pgTable(
  "exchange_rate_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
    toCurrency: varchar("to_currency", { length: 3 }).notNull(),
    rateDate: date("rate_date").notNull(),
    rate: numeric("rate", { precision: 20, scale: 10 }).notNull(),
    fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("exchange_rate_cache_lookup_idx").on(
      table.fromCurrency,
      table.toCurrency,
      table.rateDate
    ),
  ]
);
```

### Pattern 4: Migration File Format (breakpoint syntax)

**What:** Drizzle-kit generates migrations with `--> statement-breakpoint` between statements. This is required for multi-statement migrations.

**Example (from `0001_add-transactions-updated-at.sql`):**

```sql
-- Source: web/drizzle/0001_add-transactions-updated-at.sql [VERIFIED: file read]
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "transactions_userId_idx" ON "transactions" USING btree ("user_id");
```

### Anti-Patterns to Avoid

- **Using `DEFAULT amount` in ADD COLUMN:** PostgreSQL does not allow column references as DEFAULT values. Must add with a constant default, then UPDATE.
- **Writing migration SQL manually without drizzle-kit generate:** Risk of Drizzle snapshot drift — the `meta/` snapshots will no longer match the actual schema, breaking future `generate` runs. Always generate first, then edit if needed.
- **Forgetting `NOT NULL` on `original_amount`:** D-03 requires NOT NULL. Without it, the column accepts nulls and Phase 3 actions must handle null cases.
- **Using `numeric(12,2)` for `exchange_rate`:** COP/USD is ~0.000244. At scale=2, this rounds to 0.00 — data loss. Must use `numeric(20,10)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema change tracking | Manual SQL scripts | drizzle-kit generate | Keeps meta/ snapshots in sync; drift causes future generate to fail |
| UNIQUE constraint enforcement | Application-level dedup | PostgreSQL UNIQUE INDEX | DB enforces atomically; application logic has race conditions |
| Numeric precision for financial values | float / double | `numeric(precision, scale)` | IEEE float has rounding errors; numeric is exact |

---

## Runtime State Inventory

This is a schema migration phase — no renames, no refactors. However, existing DB rows are affected.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing `transactions` rows (all USD, all have `amount`) | Migration sets `original_amount = amount`, `exchange_rate = 1.0`, `currency = 'USD'` via ALTER + UPDATE |
| Live service config | Neon DB connection via `DATABASE_URL` env var | No change — same DB, same connection |
| OS-registered state | None | None |
| Secrets/env vars | `DATABASE_URL` used by drizzle-kit push | No change needed |
| Build artifacts | Drizzle meta snapshots (0000–0002) | `drizzle-kit generate` will create 0003_snapshot.json automatically |

---

## Common Pitfalls

### Pitfall 1: DEFAULT column reference in ALTER TABLE

**What goes wrong:** Developer writes `ALTER TABLE transactions ADD COLUMN original_amount numeric(12,2) NOT NULL DEFAULT amount` — PostgreSQL rejects it with syntax error.

**Why it happens:** PostgreSQL DEFAULT expressions must be constant at the time of the ALTER statement. Column references are dynamic and not allowed.

**How to avoid:** Two-step approach: (1) ADD COLUMN with a numeric constant default (e.g., `DEFAULT 0`), (2) `UPDATE transactions SET original_amount = amount`. If you want it truly NOT NULL without a permanent 0 default, add as nullable first, UPDATE, then add NOT NULL constraint.

**Warning signs:** If drizzle-kit generate creates `DEFAULT amount` in the SQL — it won't. Drizzle generates correct SQL. The risk is only if you write the migration SQL by hand.

### Pitfall 2: Drizzle snapshot drift from hand-editing migrations

**What goes wrong:** Developer hand-edits the generated `.sql` file without updating the corresponding `meta/XXXX_snapshot.json`. Next `drizzle-kit generate` compares actual schema against the outdated snapshot, generating spurious ALTER statements.

**Why it happens:** Drizzle-kit tracks state via JSON snapshots in `web/drizzle/meta/`. The snapshot and the SQL file must be consistent.

**How to avoid:** After `drizzle-kit generate`, if you need to modify the SQL (e.g., adding the UPDATE step for original_amount backfill), edit the `.sql` file only and leave the snapshot alone. The snapshot reflects Drizzle's view of the schema structure (column types), not the data migration step. Data-only UPDATE statements don't affect the snapshot.

**Warning signs:** Running `drizzle-kit generate` after applying shows unexpected changes for columns you already added.

### Pitfall 3: numeric(20,10) default value as string vs number

**What goes wrong:** Drizzle `numeric` columns return strings in JavaScript by default (not numbers). A `.default("1.0")` is correct syntax; `.default(1.0)` may cause a type mismatch warning.

**Why it happens:** PostgreSQL `numeric`/`decimal` precision can exceed JS number precision, so Drizzle defaults to string representation.

**How to avoid:** Use string literals for numeric defaults in schema: `.default("1.0")`.

**Warning signs:** TypeScript type is `string | null` for numeric columns, not `number | null`.

### Pitfall 4: Frankfurter assumed to support COP

**What goes wrong:** Developer skips validation and writes exchange rate service code targeting Frankfurter API response shape (`{ rates: { USD: 0.000244 } }`). At runtime, Frankfurter returns `{ message: "not found" }`.

**Why it happens:** Frankfurter is well-documented and popular, but only covers 30 major currencies — COP is not among them.

**How to avoid:** [ALREADY RESOLVED in research] — Confirmed Frankfurter does not support COP. Use fawazahmed0. Document this in STATE.md Key Decisions immediately in Wave 0.

**Warning signs:** Frankfurter `/currencies` endpoint returns 30 currencies, none is COP.

### Pitfall 5: Missing breakpoints in multi-statement migration

**What goes wrong:** A hand-written migration without `--> statement-breakpoint` between statements fails silently or partially applies.

**Why it happens:** Drizzle's migration runner uses breakpoints to split and execute statements individually. Without them, the entire migration is executed as one block.

**How to avoid:** Always use `--> statement-breakpoint` between SQL statements. Use `drizzle-kit generate` to produce this automatically.

---

## Code Examples

### fawazahmed0 API — live rate (verified)

```javascript
// Source: Live API test [VERIFIED: executed during research]
// Primary CDN (jsDelivr):
// GET https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{base}.json
// date: "latest" or "YYYY-MM-DD"
// Response: { "date": "2026-04-19", "cop": { "usd": 0.00027729791, ... } }

// Example:
fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2026-04-15/v1/currencies/cop.json')
  .then(r => r.json())
  .then(d => console.log(d.cop.usd)) // 0.00027822299

// Fallback CDN (Cloudflare):
// GET https://{date}.currency-api.pages.dev/v1/currencies/{base}.json
fetch('https://2026-04-19.currency-api.pages.dev/v1/currencies/cop.json')
  .then(r => r.json())
  .then(d => console.log(d.cop.usd)) // 0.00027729791
```

### Drizzle schema additions for transactions table

```typescript
// Source: web/lib/schema.ts — existing pattern + docs [VERIFIED: file read + CITED: Drizzle docs]
// Add to transactions table definition inside pgTable():
currency: varchar("currency", { length: 3 }).notNull().default("USD"),
originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
exchangeRate: numeric("exchange_rate", { precision: 20, scale: 10 }).notNull().default("1.0"),
```

### Drizzle schema for exchange_rate_cache table

```typescript
// Source: CITED: https://orm.drizzle.team/docs/indexes-constraints
import { pgTable, uuid, varchar, date, numeric, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const exchangeRateCache = pgTable(
  "exchange_rate_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
    toCurrency: varchar("to_currency", { length: 3 }).notNull(),
    rateDate: date("rate_date").notNull(),
    rate: numeric("rate", { precision: 20, scale: 10 }).notNull(),
    fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("exchange_rate_cache_lookup_idx").on(
      table.fromCurrency,
      table.toCurrency,
      table.rateDate
    ),
  ]
);
```

### SQL migration structure (expected output from drizzle-kit generate)

```sql
-- Expected 0003_multi-currency-schema.sql structure
-- Source: existing migration patterns [VERIFIED: file reads 0001, 0002]

ALTER TABLE "transactions" ADD COLUMN "currency" varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "original_amount" numeric(12, 2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "exchange_rate" numeric(20, 10) NOT NULL DEFAULT '1.0';--> statement-breakpoint
UPDATE "transactions" SET "original_amount" = "amount";--> statement-breakpoint
CREATE TABLE "exchange_rate_cache" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "from_currency" varchar(3) NOT NULL,
  "to_currency" varchar(3) NOT NULL,
  "rate_date" date NOT NULL,
  "rate" numeric(20, 10) NOT NULL,
  "fetched_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rate_cache_lookup_idx" ON "exchange_rate_cache" USING btree ("from_currency","to_currency","rate_date");
```

Note: The `UPDATE transactions SET original_amount = amount` line will NOT be auto-generated by drizzle-kit (it's a data migration, not a schema change). It must be manually added to the generated SQL file.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Frankfurter as assumed provider | fawazahmed0 as confirmed provider | 2026-04-19 (this research) | All Phase 2+ service code targets fawazahmed0 response shape |

**Deprecated/outdated:**
- Frankfurter for this project: Not deprecated globally, but not viable — COP is not in their currency list. Do not use for this project.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `original_amount` uses `numeric(12,2)` per REQUIREMENTS.md (not `numeric(20,10)`) | Standard Stack, Code Examples | If original_amount should also be `numeric(20,10)`, the schema and migration need updating. REQUIREMENTS.md says `numeric(12,2)` — this matches the existing `amount` column precision, which is correct for amounts in USD or COP (COP amounts are large integers, no decimals needed). | 
| A2 | The `UPDATE transactions SET original_amount = amount` step should be in the 0003 migration file itself (not a separate script) | Common Pitfalls, Code Examples | If the planner chooses to handle the backfill as a separate one-time script, the migration file structure changes slightly |
| A3 | `fetchedAt` uses `timestamp` without timezone (matching existing schema pattern) | Code Examples | Project uses `timestamp` not `timestamptz` throughout schema.ts — consistent, but if UTC correctness matters for rate lookups, `timestamptz` would be safer |

---

## Open Questions

1. **original_amount precision: numeric(12,2) vs numeric(20,10)?**
   - What we know: REQUIREMENTS.md specifies `numeric(12,2)`. CONTEXT.md D-04 specifies `numeric(20,10)` only for `exchange_rate`. `original_amount` is a user-entered amount (like the existing `amount` column which is `numeric(12,2)`).
   - What's unclear: COP amounts can be large (e.g., 50,000 COP = ~$12 USD). `numeric(12,2)` allows up to 9,999,999,999.99 which is more than sufficient.
   - Recommendation: Use `numeric(12,2)` for `original_amount` (consistent with REQUIREMENTS.md and existing `amount` column). Use `numeric(20,10)` only for `exchange_rate` (as specified in D-04).

2. **Primary key for exchange_rate_cache: UUID vs composite?**
   - What we know: CONTEXT.md leaves this to Claude's discretion.
   - What's unclear: A composite PK on `(from_currency, to_currency, rate_date)` would make the UNIQUE constraint implicit and remove the need for a separate UUID column. However, UUID PKs are the established pattern in this project (all other tables use `uuid("id").primaryKey().defaultRandom()`).
   - Recommendation: Use UUID PK (consistent with all other tables) + separate `uniqueIndex` on the three lookup columns (as specified in D-07).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Provider validation script | ✓ | 20.11.1 | — |
| pnpm | drizzle-kit commands | ✓ | (lockfile present) | — |
| DATABASE_URL env var | drizzle-kit push | Required at push time | — | Must be set in .env |
| Neon PostgreSQL | Migration target | Required | — | — |
| internet access | fawazahmed0 API probe | ✓ | — | Cloudflare CDN fallback also available |

**Missing dependencies with no fallback:**
- `DATABASE_URL` must be present in `.env` for `drizzle-kit push` to apply the migration.

**Missing dependencies with fallback:**
- fawazahmed0 jsDelivr CDN: if unavailable, use `https://{date}.currency-api.pages.dev/v1/currencies/cop.json`.

---

## Validation Architecture

> nyquist_validation is enabled in `.planning/config.json`. CLAUDE.md prohibits adding test infrastructure. Validation for this phase is manual DB verification only.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — CLAUDE.md: "No existing test framework — don't add test infrastructure as part of this milestone" |
| Config file | n/a |
| Quick run command | Manual SQL queries via Neon console or psql |
| Full suite command | All 5 success criteria SQL queries from phase definition |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Frankfurter rejects COP; fawazahmed0 returns valid rate | manual | `node -e "fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/cop.json').then(r=>r.json()).then(d=>console.log('COP/USD:',d.cop.usd))"` | n/a |
| INFRA-02 | exchange_rate_cache table + UNIQUE index exist | manual-SQL | `SELECT * FROM exchange_rate_cache LIMIT 1` | n/a |
| SCHEMA-01 | currency column exists on transactions | manual-SQL | `SELECT currency FROM transactions LIMIT 1` | n/a |
| SCHEMA-02 | original_amount column exists on transactions | manual-SQL | `SELECT original_amount FROM transactions LIMIT 1` | n/a |
| SCHEMA-03 | exchange_rate column exists on transactions | manual-SQL | `SELECT exchange_rate FROM transactions LIMIT 1` | n/a |
| SCHEMA-04 | exchange_rate_cache table has all columns | manual-SQL | `SELECT from_currency, to_currency, rate_date, rate, fetched_at FROM exchange_rate_cache LIMIT 1` | n/a |
| SCHEMA-05 | Existing rows have defaults; no NULLs; rate stores 0.000244 | manual-SQL | `SELECT COUNT(*) FROM transactions WHERE exchange_rate IS NULL` (expect 0) | n/a |

### Sampling Rate

- **Per task commit:** Run the relevant manual SQL check above
- **Per wave merge:** All 5 success-criteria queries from phase definition
- **Phase gate:** All 5 queries pass before `/gsd-verify-work`

### Wave 0 Gaps

No test infrastructure needed or permitted. All validation is manual SQL.

---

## Security Domain

> This phase has no authentication, authorization, input validation, or user-facing endpoints. All changes are schema DDL and a one-time API probe.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | No user input in this phase |
| V6 Cryptography | no | — |

**Threat patterns for this phase:** None — schema migration is a developer operation, not a runtime user-facing surface.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 1 |
|-----------|-------------------|
| Tech stack: Next.js App Router + Drizzle + Neon — no new infrastructure | No new services. fawazahmed0 is an external API used in Phase 2+, not added as infrastructure here. |
| DB migrations: Drizzle migrations — any schema changes need a migration file | Migration file 0003 required. Use `drizzle-kit generate` then `drizzle-kit push`. |
| No tests: No existing test framework — don't add test infrastructure as part of this milestone | Validation is manual SQL queries only. No jest/vitest setup. |
| API budget: ExchangeRate-API free tier — 24h cache is mandatory | Cache table is being created in this phase. No API calls in Phase 1 beyond the one-time provider validation probe. |
| Single user: No multi-tenant concerns | No userId on exchange_rate_cache (D-08). |

---

## Sources

### Primary (HIGH confidence)
- `web/lib/schema.ts` [VERIFIED: file read] — existing schema patterns for varchar, numeric, index, uniqueIndex
- `web/drizzle/0001_add-transactions-updated-at.sql` [VERIFIED: file read] — breakpoint syntax pattern
- `web/drizzle/0002_add-currency-to-financial-profile.sql` [VERIFIED: file read] — ADD COLUMN NOT NULL DEFAULT pattern
- `web/drizzle/meta/_journal.json` [VERIFIED: file read] — next migration index is 0003
- fawazahmed0 live API [VERIFIED: executed] — COP/USD = 0.000277, historical and latest both work
- Frankfurter live API [VERIFIED: executed] — COP not in currency list, returns "not found"
- `npm view drizzle-orm version` [VERIFIED: npm registry] — 0.45.2
- `npm view drizzle-kit version` [VERIFIED: npm registry] — 0.31.10

### Secondary (MEDIUM confidence)
- Drizzle ORM docs — uniqueIndex composite syntax [CITED: https://orm.drizzle.team/docs/indexes-constraints]
- Drizzle ORM docs — numeric column definition [CITED: https://orm.drizzle.team/docs/column-types/pg#numeric]
- Drizzle ORM docs — generate vs push [CITED: https://orm.drizzle.team/docs/migrations]
- fawazahmed0 GitHub README [CITED: https://github.com/fawazahmed0/exchange-api] — CDN URL structure, fallback endpoint

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Provider decision: HIGH — live API calls verified during research
- Standard stack: HIGH — versions verified from npm registry + existing project files
- Architecture: HIGH — patterns verified from existing migration files
- Pitfalls: MEDIUM — DEFAULT column reference pitfall is PostgreSQL-documented behavior [ASSUMED]; others verified from codebase

**Research date:** 2026-04-19
**Valid until:** 2026-05-19 (stable domain; fawazahmed0 API endpoint could change, but unlikely)
