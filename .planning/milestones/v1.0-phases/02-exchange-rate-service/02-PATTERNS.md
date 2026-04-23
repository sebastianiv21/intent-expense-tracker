# Phase 2: Exchange Rate Service - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 1 (single new file)
**Analogs found:** 1 / 1

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `web/lib/exchange-rates.ts` | service | request-response + CRUD (cache-first) | `web/lib/queries/financial-profile.ts` (DB read) + `web/lib/actions/transactions.ts` (DB insert) | role-match (composite) |

## Pattern Assignments

### `web/lib/exchange-rates.ts` (service, cache-first request-response)

This file has no single exact analog — it combines a DB select pattern (like queries) with a DB insert pattern (like actions) and adds an outbound HTTP fetch. The closest analogs per concern are documented separately below.

**Analog A (DB select pattern):** `web/lib/queries/financial-profile.ts`
**Analog B (DB insert pattern):** `web/lib/actions/transactions.ts`
**Analog C (utility module style):** `web/lib/finance-utils.ts`
**Analog D (currency constants):** `web/lib/currencies.ts`

---

#### Imports pattern

Source: `web/lib/queries/financial-profile.ts` lines 1-5 and `web/lib/actions/transactions.ts` lines 4-6.

The new file is a plain server-side `lib/` module — no `"use server"` directive (that is for Next.js Server Actions only). It imports Drizzle operators and the project's `db` and `schema` via `@/` alias paths.

```typescript
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exchangeRateCache } from "@/lib/schema";
```

Note: no `getAuthenticatedUser` import — this service is called from authenticated server actions (Phase 3), not from a user-facing surface directly. No `"use server"` directive.

---

#### DB read pattern — select with composite where + limit(1)

Source: `web/lib/queries/financial-profile.ts` lines 8-17 and `web/lib/queries/transactions.ts` lines 33-72.

The project's established select style is `db.select().from(table).where(and(...conditions)).limit(1)`, with the result accessed via `result[0]` and a null/undefined guard immediately after.

```typescript
// web/lib/queries/financial-profile.ts lines 8-17
const result = await db
  .select()
  .from(financialProfile)
  .where(eq(financialProfile.userId, userId))
  .limit(1);

return (result[0] as FinancialProfile) ?? null;
```

For `exchange-rates.ts`, the composite `and()` form (from `web/lib/queries/transactions.ts` lines 38-69) applies:

```typescript
// web/lib/queries/transactions.ts lines 36-46 (adapted)
const conditions = [eq(transactions.userId, userId)];
// ...
const result = await db
  .select(...)
  .from(transactions)
  .where(and(...conditions))
  ...
```

**Applied to exchange-rates.ts:**

```typescript
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
  return Number(cached[0].rate); // numeric column returns string at runtime — must parse
}
```

---

#### DB insert pattern — insert with conflict guard

Source: `web/lib/actions/transactions.ts` lines 38-58 and `web/lib/actions/financial-profile.ts` lines 47-58.

The existing insert style is `db.insert(table).values({...}).returning()`. For the cache table, `onConflictDoNothing()` replaces `.returning()` since a concurrent caller may have already inserted the same triple (UNIQUE index on `exchange_rate_cache_lookup_idx`).

```typescript
// web/lib/actions/transactions.ts lines 38-57 (base insert pattern)
const result = await db
  .insert(transactions)
  .values({
    userId,
    amount: amount.toFixed(2),
    type,
    description: description ?? null,
    date,
    categoryId: categoryId ?? null,
  })
  .returning();
```

**Applied to exchange-rates.ts (with conflict guard instead of returning):**

```typescript
await db
  .insert(exchangeRateCache)
  .values({
    fromCurrency: normalizedFrom,
    toCurrency: normalizedTo,
    rateDate: date,
    rate: rate.toString(),
  })
  .onConflictDoNothing();
```

---

#### Error handling pattern — throw on failure (not ActionResult)

Source: `web/lib/actions/transactions.ts` lines 55-58 and `web/lib/actions/financial-profile.ts` lines 64-67.

Server Actions return `ActionResult` discriminated union — but `exchange-rates.ts` is NOT a Server Action, it is a plain async service function. It does not return `ActionResult`; it throws on any failure. The caller (Phase 3 server action) catches the thrown error and maps it to an `ActionResult`.

```typescript
// web/lib/actions/transactions.ts lines 55-58 (catch → return pattern for actions)
} catch (err) {
  console.error("Failed to create transaction:", err);
  return { success: false, error: "Failed to create transaction" };
}
```

**Applied to exchange-rates.ts (throw instead of return, per D-01):**

```typescript
// HTTP failure — throw with status + context in message
if (!res.ok) {
  throw new Error(
    `Exchange rate fetch failed: HTTP ${res.status} for ${normalizedFrom}/${normalizedTo} on ${date}`,
  );
}

// Missing key in response — throw with context
if (!ratesForFrom || typeof ratesForFrom[toKey] !== "number") {
  throw new Error(
    `Rate not found in API response for ${normalizedFrom}/${normalizedTo} on ${date}`,
  );
}
```

Plain `Error` — no named subclass (per Claude's Discretion: keep it simple).

---

#### Numeric string → number parse pattern

Source: `web/lib/queries/transactions.ts` lines 106-108 and `web/lib/finance-utils.ts` lines 88-92.

Drizzle `numeric` columns return `string` at runtime. The project already handles this pattern in `getTransactionTotals` (explicit `Number()` cast) and `parseStoredAmount` in `finance-utils.ts`.

```typescript
// web/lib/queries/transactions.ts lines 114-118
return {
  count: result[0]?.count ?? 0,
  totalIncome: Number(result[0]?.totalIncome ?? 0),
  totalExpenses: Number(result[0]?.totalExpenses ?? 0),
};
```

```typescript
// web/lib/finance-utils.ts lines 197-200
export function parseStoredAmount(raw: string): number {
  const amount = Number.parseFloat(raw);
  return Number.isFinite(amount) ? amount : Number.NaN;
}
```

**Applied to exchange-rates.ts:**

```typescript
return Number(cached[0].rate); // always wrap — numeric column is string at runtime
```

---

#### Module-level utility style

Source: `web/lib/currencies.ts` lines 1-57 and `web/lib/finance-utils.ts` lines 1-4.

Plain `lib/` modules use ASCII banner section comments (optional for short files), named exports only, and `type` keyword for internal shapes (never `interface`).

```typescript
// web/lib/currencies.ts lines 1-3 (module style — no "use server", no default export)
// ─── Supported Currencies ─────────────────────────────────────────────────────

export type CurrencyCode = ...
```

**Applied to exchange-rates.ts:**

- No `"use server"` directive — this is a plain async utility, not a Next.js Server Action
- Single named export: `export async function getOrFetchExchangeRate(...)`
- No default export
- Internal type annotation uses `type`, not `interface`

---

## Shared Patterns

### Drizzle import style
**Source:** `web/lib/queries/financial-profile.ts` line 1, `web/lib/actions/transactions.ts` line 4
**Apply to:** `web/lib/exchange-rates.ts`

```typescript
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exchangeRateCache } from "@/lib/schema";
```

All non-relative imports use `@/` alias. Import only the Drizzle operators actually used. Schema tables imported by name from `@/lib/schema` (not the `* as schema` barrel from `db.ts`).

### `numeric` column string-to-number conversion
**Source:** `web/lib/queries/transactions.ts` lines 114-118, `web/lib/finance-utils.ts` lines 197-200
**Apply to:** Every place `cached[0].rate` is accessed in `exchange-rates.ts`

```typescript
Number(cached[0].rate)
```

Always wrap `numeric` column values in `Number()` before arithmetic or returning. The TypeScript type may say `string`; the JS runtime always delivers a string for Drizzle numeric columns.

### `rate.toString()` before insert
**Source:** `web/lib/actions/transactions.ts` line 43 (`amount.toFixed(2)`)
**Apply to:** `exchange-rates.ts` insert step

```typescript
rate: rate.toString(),
```

Drizzle `numeric` columns accept strings for insert. Store the full precision string — do not round with `toFixed()` for exchange rates (unlike monetary amounts where `toFixed(2)` is used).

---

## No Analog Found

No files have zero match — the composite of analogs A+B+C covers all patterns needed. The only truly novel element is the outbound `fetch()` call, for which no existing project analog exists. The RESEARCH.md `Pattern 3: Native Fetch with Non-2xx Error Guard` section provides the reference pattern for this.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | All patterns have analogs in the codebase |

The `fetch` call pattern (Pattern 3 in RESEARCH.md) has no codebase analog — use the RESEARCH.md `Code Examples` complete function skeleton directly.

---

## Metadata

**Analog search scope:** `web/lib/queries/`, `web/lib/actions/`, `web/lib/`
**Files scanned:** `financial-profile.ts` (queries), `transactions.ts` (queries + actions), `financial-profile.ts` (actions), `finance-utils.ts`, `currencies.ts`, `db.ts`, `schema.ts`
**Pattern extraction date:** 2026-04-20
