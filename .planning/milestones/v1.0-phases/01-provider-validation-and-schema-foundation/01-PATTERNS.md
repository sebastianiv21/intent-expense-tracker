# Phase 1: Provider Validation and Schema Foundation - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 3 (1 modified, 1 new, 1 documentation update)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `web/lib/schema.ts` | model | CRUD | `web/lib/schema.ts` (itself — additive change) | exact |
| `web/drizzle/0003_multi-currency-schema.sql` | migration | batch | `web/drizzle/0002_add-currency-to-financial-profile.sql` + `web/drizzle/0001_add-transactions-updated-at.sql` | exact |
| `.planning/STATE.md` | config | — | `.planning/STATE.md` (itself — documentation update) | exact |

---

## Pattern Assignments

### `web/lib/schema.ts` (model, additive schema change)

**Analog:** `web/lib/schema.ts` — the file itself, specifically:
- `financialProfile.currency` for the varchar(3) NOT NULL DEFAULT pattern
- `transactions` table for where to insert new columns
- `session` table for the `uniqueIndex` callback pattern

**Imports pattern** (lines 1-12):
```typescript
import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  varchar,
  uuid,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
```

The new `exchangeRateCache` table requires `uniqueIndex` added to this import list. No other new imports are needed — `uuid`, `varchar`, `date`, `numeric`, `timestamp` are already imported.

**Currency column pattern** (line 138 — exact pattern to copy for `transactions.currency`):
```typescript
currency: varchar("currency", { length: 3 }).notNull().default("USD"),
```

**Numeric column pattern** (lines 116-120 — exact pattern to copy for `transactions.originalAmount` and `transactions.exchangeRate`):
```typescript
monthlyIncomeTarget: numeric("monthly_income_target", {
  precision: 10,
  scale: 2,
}).notNull(),
```
Note: `exchangeRate` uses `precision: 20, scale: 10` and `.default("1.0")` (string literal, not number — Drizzle numeric columns return strings in JS). `originalAmount` uses `precision: 12, scale: 2` matching the existing `amount` column.

**Index callback pattern** (lines 182-185 — exact pattern for `exchangeRateCache` table second argument):
```typescript
(table) => [
  index("transactions_userId_idx").on(table.userId),
  index("transactions_date_idx").on(table.date),
],
```
For `exchangeRateCache`, replace `index` with `uniqueIndex` and use three columns.

**UUID primary key pattern** (line 167 — exact pattern for `exchangeRateCache.id`):
```typescript
id: uuid("id").primaryKey().defaultRandom(),
```

**Timestamp defaultNow pattern** (lines 178-180 — for `exchangeRateCache.fetchedAt`):
```typescript
createdAt: timestamp("created_at").notNull().defaultNow(),
```

**Where to insert new `transactions` columns:** After line 175 (`date: date("date").notNull(),`) and before line 176 (`createdAt: timestamp("created_at").notNull().defaultNow(),`).

**Where to add `exchangeRateCache` table:** After the `recurringTransactions` table definition (line 228), before the Relations section (line 230 banner comment).

**Complete `exchangeRateCache` definition to write:**
```typescript
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
      table.rateDate,
    ),
  ],
);
```

Note: trailing comma inside `.on()` follows the project's trailing-comma style. No relations needed — `exchangeRateCache` has no FK references.

---

### `web/drizzle/0003_multi-currency-schema.sql` (migration, batch)

**Analog 1:** `web/drizzle/0002_add-currency-to-financial-profile.sql` (ADD COLUMN NOT NULL DEFAULT pattern, line 1):
```sql
ALTER TABLE "financial_profile" ADD COLUMN "currency" varchar(3) DEFAULT 'USD' NOT NULL;
```

**Analog 2:** `web/drizzle/0001_add-transactions-updated-at.sql` (breakpoint syntax + CREATE INDEX + multi-statement, lines 1-8):
```sql
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "budgets_userId_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_userId_idx" ON "categories" USING btree ("user_id");
```

**Analog 3:** `web/drizzle/0000_lyrical_demogoblin.sql` (CREATE TABLE full DDL + UUID PK pattern, lines 81-90):
```sql
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"category_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
```

**Core migration pattern — full expected file content:**
```sql
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

**Critical note on `original_amount` backfill:** The `UPDATE ... SET original_amount = amount` line is a data migration step, not generated by `drizzle-kit generate`. It MUST be manually added to the generated `.sql` file after running `pnpm drizzle-kit generate`. Do not add it to the Drizzle schema definition — the snapshot will not reflect it and future generates will not drift.

**File naming pattern:** Follows `web/drizzle/meta/_journal.json` — next idx is 3, so file is `0003_<descriptive-slug>.sql`. The slug follows the kebab-case convention of prior files (`add-transactions-updated-at`, `add-currency-to-financial-profile`). Use `0003_multi-currency-schema.sql`.

**Important:** This migration file should be generated via `pnpm drizzle-kit generate` (run from `web/`), then the `UPDATE` backfill line added manually. Do NOT write the file from scratch to avoid snapshot drift.

---

### `.planning/STATE.md` (documentation, provider decision record)

**Analog:** `.planning/STATE.md` itself — the `## Accumulated Context > ### Decisions` section is the write target.

**Current Decisions section** (lines 61-66):
```markdown
- Pre-roadmap: Frankfurter is the preferred provider but COP support must be validated first — fawazahmed0 is the confirmed fallback
- Pre-roadmap: Store converted amount in existing `amount` column so all dashboard queries remain unchanged
- Pre-roadmap: `exchange_rate` must be `numeric(20,10)` — COP/USD rate (~0.000244) would truncate to zero at `numeric(12,2)`
- Pre-roadmap: New schema columns need DEFAULT values to avoid NOT NULL migration failure on existing rows
```

**Pattern to add (append a new bullet under Decisions):**
```markdown
- Phase 1 (2026-04-20): fawazahmed0 confirmed as exchange rate provider — Frankfurter tested live and does not support COP (`/currencies` returns 30 currencies, COP absent; direct query returns `{"message":"not found"}`). fawazahmed0 returns COP/USD = 0.000277 from both jsDelivr CDN and Cloudflare fallback.
```

Also update `stopped_at` in the YAML front matter from `Phase 1 context gathered` to reflect phase completion after migration is applied.

---

## Shared Patterns

### Drizzle numeric default as string literal
**Source:** `web/lib/schema.ts` lines 124-127
**Apply to:** `transactions.exchangeRate`, `transactions.originalAmount` (if a default is needed), `exchangeRateCache.rate`
```typescript
needsPercentage: numeric("needs_percentage", {
  precision: 5,
  scale: 2,
})
  .notNull()
  .default("50.00"),
```
Always pass numeric defaults as string literals (e.g., `"1.0"`, `"0"`) not numbers. Drizzle numeric columns are typed as `string` in JS, and passing a JS number may cause a type warning.

### Trailing comma in multi-line array/object
**Source:** `web/lib/schema.ts` line 185 (index array)
**Apply to:** All new table definitions
```typescript
  (table) => [
    index("transactions_userId_idx").on(table.userId),
    index("transactions_date_idx").on(table.date),
  ],
```
Trailing comma after the last array element and after the closing `]` in the second `pgTable` argument.

### Statement breakpoint in multi-statement migrations
**Source:** `web/drizzle/0001_add-transactions-updated-at.sql` line 1
**Apply to:** Every statement boundary in `0003_multi-currency-schema.sql`
```sql
<statement>;--> statement-breakpoint
<next statement>;
```
Every statement except the last ends with `;--> statement-breakpoint`. No trailing breakpoint on the final statement.

### `USING btree` in CREATE INDEX
**Source:** `web/drizzle/0001_add-transactions-updated-at.sql` line 7
**Apply to:** `CREATE UNIQUE INDEX` for `exchange_rate_cache_lookup_idx`
```sql
CREATE INDEX "transactions_userId_idx" ON "transactions" USING btree ("user_id");
```
Always include `USING btree` — this is what drizzle-kit generates and what the existing migrations use.

---

## No Analog Found

All files in this phase have direct analogs in the codebase. No files require falling back to RESEARCH.md patterns only.

---

## Metadata

**Analog search scope:** `web/lib/`, `web/drizzle/`, `.planning/`
**Files scanned:** 7 (`schema.ts`, `drizzle.config.ts`, `0000_lyrical_demogoblin.sql`, `0001_add-transactions-updated-at.sql`, `0002_add-currency-to-financial-profile.sql`, `meta/_journal.json`, `STATE.md`)
**Pattern extraction date:** 2026-04-20
