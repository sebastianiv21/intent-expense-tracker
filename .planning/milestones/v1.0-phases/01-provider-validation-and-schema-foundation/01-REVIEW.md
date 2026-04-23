---
phase: 01-provider-validation-and-schema-foundation
reviewed: 2026-04-20T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - web/lib/schema.ts
  - web/drizzle/0003_multi-currency-schema.sql
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-20
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Phase 01 adds multi-currency support to the `transactions` table and introduces the `exchange_rate_cache` table. The schema design is sound overall — the new columns are correctly typed, the migration handles the backfill of `original_amount` for existing rows, and the unique index on the cache table matches the lookup pattern. However, there are three warnings that will cause silent data integrity bugs or runtime errors if not addressed before the next phase builds on top of this schema.

The most significant issue is a divergence between the Drizzle schema and the `Transaction` type in `web/types/index.ts`: the three new columns (`currency`, `originalAmount`, `exchangeRate`) added to the `transactions` table are not reflected in the `Transaction` type, meaning any code that casts `db.returning()` to `Transaction` (as `createTransaction` does at line 54 of `web/lib/actions/transactions.ts`) will silently drop the new fields. There is also a semantic mismatch in what `amount` is supposed to represent (converted base-currency value vs. raw input), and the migration sets a `DEFAULT '0'` for `original_amount` which conflicts with the column being `NOT NULL` and immediately backfilled — the default is harmless in practice but misleading and a potential footgun for any future `INSERT` that omits the column.

---

## Warnings

### WR-01: `Transaction` type in `web/types/index.ts` is missing the three new currency columns

**File:** `web/types/index.ts:29-39`
**Issue:** The `Transaction` type does not include `currency`, `originalAmount`, or `exchangeRate`. The `createTransaction` action at `web/lib/actions/transactions.ts:54` casts the Drizzle `returning()` result directly to `Transaction`:

```ts
return { success: true, data: result[0] as Transaction };
```

This `as` cast suppresses TypeScript's type checker. Any downstream code that receives a `Transaction` and tries to read `currency` or `originalAmount` will get `undefined` at runtime, even though the values are present in the database row. The same issue affects `updateTransaction` at line 108.

**Fix:** Add the three new fields to `Transaction` in `web/types/index.ts`:

```ts
export type Transaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;           // converted amount in base currency
  currency: string;         // ISO 4217 code, e.g. "USD", "COP"
  originalAmount: string;   // amount in the transaction's own currency
  exchangeRate: string;     // rate applied: originalAmount * exchangeRate = amount
  type: TransactionType;
  description: string | null;
  date: string;
  createdAt: Date;
  updatedAt: Date;
};
```

---

### WR-02: `createTransaction` action does not populate `currency`, `originalAmount`, or `exchangeRate` — new rows will always use schema defaults

**File:** `web/lib/actions/transactions.ts:41-49`
**Issue:** The `db.insert(transactions).values(...)` call only passes `userId`, `amount`, `type`, `description`, `date`, and `categoryId`. The three new required columns rely on their column-level defaults (`'USD'`, `'0'`, `'1.0'`). This means:

1. `currency` will always be `'USD'` regardless of user preference or what currency the transaction was made in — silently wrong for multi-currency users.
2. `originalAmount` will be `'0'` (the migration default), not the actual entered amount. The migration backfill corrects existing rows, but new rows created through this action will have `original_amount = '0'` until the action is updated.

This is a logic error that will persist into production data. The action must be updated in the same phase as the schema change (or this finding logged as a known gap that phase 02 must close before any UI exposes currency selection).

**Fix:** At minimum, populate `originalAmount` with the entered amount and `exchangeRate` with `'1.0'` as a safe default while single-currency behavior is maintained, so no row ever has `original_amount = '0'`:

```ts
const { amount, type, description, date, categoryId } = parsed.data;

await db.insert(transactions).values({
  userId,
  amount: amount.toFixed(2),
  originalAmount: amount.toFixed(2),  // same as amount until currency UI ships
  exchangeRate: "1.0",
  currency: "USD",                     // will become user.financialProfile.currency
  type,
  description: description ?? null,
  date,
  categoryId: categoryId ?? null,
});
```

---

### WR-03: Migration default `'0'` for `original_amount` creates misleading rows if any direct `INSERT` omits the column in the future

**File:** `web/drizzle/0003_multi-currency-schema.sql:11`
**Issue:** The migration adds `original_amount` as `NOT NULL DEFAULT '0'`, then immediately backfills it from `amount`. The `DEFAULT '0'` exists only to satisfy the `NOT NULL` constraint during the `ALTER TABLE`. After the backfill, the intent is for `original_amount` to always equal the real amount. But the `'0'` default remains in the table definition, so any future `INSERT` that omits `original_amount` (or any ORM usage that doesn't set it) will silently store `0` — which is an invalid amount.

The Drizzle schema at `web/lib/schema.ts:178` correctly marks `originalAmount` as `.notNull()` with `.default("0")`, mirroring this. The default should only have been a migration convenience, not a permanent column default.

**Fix:** After the backfill, drop the column default so the DB enforces that every insert explicitly provides the value:

```sql
ALTER TABLE "transactions" ADD COLUMN "original_amount" numeric(12, 2) NOT NULL DEFAULT '0';
--> statement-breakpoint
UPDATE "transactions" SET "original_amount" = "amount";
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "original_amount" DROP DEFAULT;
```

And in `web/lib/schema.ts`, remove the `.default("0")` from `originalAmount`:

```ts
originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
```

Note: This is a migration that has likely already been applied. If so, issue a follow-up migration (`0004_...`) to drop the default, and update the schema definition accordingly.

---

## Info

### IN-01: The semantic role of `amount` vs `originalAmount` is not documented in the schema

**File:** `web/lib/schema.ts:173-181`
**Issue:** The schema has `amount`, `originalAmount`, and `exchangeRate` without any comments. For a reader (or future developer), it is not immediately clear which column holds the converted base-currency value and which holds the raw input. The `CLAUDE.md` project context describes the intended semantics but there is nothing at the code level.

**Fix:** Add inline comments to the column definitions:

```ts
// Converted amount in the user's base currency (originalAmount * exchangeRate)
amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
// Amount as entered, in the transaction's own currency
originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
// Exchange rate applied: 1 unit of `currency` = exchangeRate units of base currency
exchangeRate: numeric("exchange_rate", { precision: 20, scale: 10 }).notNull().default("1.0"),
```

---

### IN-02: `exchangeRateCache` has no `updatedAt` column — stale-cache detection relies solely on `fetchedAt` compared to wall clock

**File:** `web/lib/schema.ts:236-253`
**Issue:** The cache table stores `fetchedAt` but has no `updatedAt`. The 24-hour TTL check will compare `fetchedAt` to `now()`. This is intentional and fine, but there is no mechanism to force-refresh a specific entry without deleting and re-inserting the row. Consider this a design note rather than a bug, but worth flagging so the cache-service implementation (phase 02) is aware.

**Fix:** No immediate action required. When implementing the cache service, use an `ON CONFLICT DO UPDATE SET rate = ..., fetched_at = now()` upsert pattern so refreshes update in place rather than requiring a delete.

---

### IN-03: `financialProfile.currency` column exists in the schema but the `FinancialProfile` type already reflects it — no gap here, but `Transaction` type does not mirror the new columns (see WR-01)

**File:** `web/types/index.ts:68-77`
**Issue:** This is a positive observation. `FinancialProfile` at line 68 correctly includes `currency: string`, meaning the base-currency preference is already exposed to the application layer. This confirms the design intent is sound; the gap is only in the `Transaction` type (covered in WR-01).

**Fix:** No action needed on `FinancialProfile`. Resolve WR-01 for `Transaction`.

---

_Reviewed: 2026-04-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
