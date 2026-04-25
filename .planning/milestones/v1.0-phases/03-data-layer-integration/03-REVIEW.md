---
phase: 03-data-layer-integration
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - web/components/transaction-sheet.tsx
  - web/lib/actions/recurring.ts
  - web/lib/actions/transactions.ts
  - web/lib/finance-utils.ts
  - web/lib/validations/transactions.ts
  - web/types/index.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

This milestone adds multi-currency support to the transaction layer: a new `currency`, `originalAmount`, and `exchangeRate` column set on the `transactions` table, an exchange-rate cache backed by the fawazahmed0 CDN, a currency badge + conversion preview in the transaction sheet, and Zod schemas extended to carry `currency` / `baseCurrency`. The design is sound overall — the data model is correct, the cache-first fetch pattern respects the 1 500 req/month budget, and the same-currency short-circuit (D-06) is consistently applied.

Three issues require attention before this phase is considered complete. The most serious is a hardcoded `"USD"` string in `recurring.ts` that silently assigns the wrong currency to every recurring-generated transaction for users whose base currency is COP. Two further warnings address a silent loss of the exchange-rate preview when the user changes the transaction date after already selecting a foreign currency, and a missing authorization check in `exportTransactions`. The remaining findings are quality/maintainability items.

---

## Critical Issues

### CR-01: Recurring transactions hardcode `currency: "USD"` — wrong for COP users

**File:** `web/lib/actions/recurring.ts:219`
**Issue:** `processRecurringTransactions` inserts every generated transaction with `currency: "USD"` regardless of the user's actual base currency. The comment acknowledges this as a "base currency default for legacy/recurring entries," but the recurring schema never stores a `currency` field and `baseCurrency` is never read from the financial profile. A COP user's recurring salary would be stored with `currency: "USD"`, making the `originalAmount` and `exchangeRate` columns meaningless and producing incorrect dashboard totals if any code ever filters or re-converts on `currency`.

**Fix:** Either (a) add a `currency` column to `recurringTransactions` (preferred, keeps the data self-describing) and populate it at insert time, or (b) look up the user's `financialProfile.currency` before the loop and use it as the default. Minimal safe fix:

```typescript
// Top of processRecurringTransactions, after getAuthenticatedUser()
import { financialProfile } from "@/lib/schema";

const profile = await db
  .select({ currency: financialProfile.currency })
  .from(financialProfile)
  .where(eq(financialProfile.userId, userId))
  .limit(1);

const baseCur = profile[0]?.currency ?? "USD";

// Then in the insert:
await tx.insert(transactions).values({
  // ...
  currency: baseCur,
  exchangeRate: "1.0",
  // ...
});
```

---

## Warnings

### WR-01: Conversion preview goes stale when date changes after currency selection

**File:** `web/components/transaction-sheet.tsx:235-249`
**Issue:** `handleCurrencySelect` fetches the preview rate using `form.date` at the moment of currency selection. If the user later changes the date via the date picker (line 554), `previewRate` is not re-fetched. The displayed conversion (`≈ $X.XX USD`) will be based on the wrong date's rate for the remainder of the session. This is a silent data quality issue: the preview misleads the user but the server-side rate is re-fetched on submit, so no incorrect value is persisted — however the mismatch between the shown preview and the actually-stored rate is confusing.

**Fix:** After the date field update in the `onSelect` calendar handler, re-trigger the preview fetch if a foreign currency is already selected:

```typescript
onSelect={(day) => {
  if (day) {
    const newDate = format(day, "yyyy-MM-dd");
    updateField("date", newDate);
    setDatePickerOpen(false);
    // Re-fetch preview if a foreign currency is already chosen
    if (form.currency !== baseCurrency) {
      setPreviewRate(null);
      setPreviewLoading(true);
      getExchangeRateForPreview(form.currency, baseCurrency, newDate).then((result) => {
        setPreviewLoading(false);
        if ("rate" in result) setPreviewRate(result.rate);
      });
    }
  }
}}
```

### WR-02: `exportTransactions` action calls `getTransactions` without an auth guard

**File:** `web/lib/actions/transactions.ts:231-238`
**Issue:** `exportTransactions` is a `"use server"` action that delegates to `getTransactions`. Unlike every other action in this file and in `recurring.ts`, it never calls `getAuthenticatedUser()`. `getTransactions` itself calls `getAuthenticatedUser` internally (as inferred from the established pattern), but the action layer should be the authoritative auth boundary — if `getTransactions` is ever refactored or the query is replaced, the protection disappears silently.

**Fix:** Add the guard at the top of the action, consistent with all other actions in the codebase:

```typescript
export async function exportTransactions(
  params: FilterState,
): Promise<TransactionWithCategory[]> {
  await getAuthenticatedUser(); // auth boundary — consistent with all other actions
  return getTransactions({
    ...params,
    limit: 10_000,
    orderBy: "date_desc",
  });
}
```

### WR-03: `updateTransaction` falls back to `existing[0].currency` as `baseCurrency` when none is supplied

**File:** `web/lib/actions/transactions.ts:113`
**Issue:** When `parsed.data.baseCurrency` is undefined (not sent by the client), the code uses `existing[0].currency` as the base currency for the exchange-rate lookup. `existing[0].currency` is the _transaction's_ original currency, not the user's base currency. For a COP transaction being edited without a currency change, `baseCurrency` defaults to `"COP"`, meaning `getOrFetchExchangeRate("COP", "COP", ...)` is called, which returns `1.0` via the same-currency shortcut — silently correct by coincidence. But if currency changes from COP to USD and `baseCurrency` is omitted, `baseCurrency` defaults to `"COP"` (the old `existing[0].currency`), producing `getOrFetchExchangeRate("USD", "COP", ...)` instead of the expected `("USD", "USD", ...)`. The TransactionSheet always sends `baseCurrency`, but any direct caller or future client that omits it will silently persist the wrong converted amount.

**Fix:** Require `baseCurrency` in `updateTransactionSchema` (make it non-optional), or look it up from the financial profile as a safe default:

```typescript
// In updateTransactionSchema — make it required (or default to "USD" with a comment)
baseCurrency: z.enum(SUPPORTED_CURRENCIES), // required for exchange-rate recalculation
```

### WR-04: `parseStoredAmount` returns `NaN` but callers treat it as falsy via `!amountNum`

**File:** `web/components/transaction-sheet.tsx:253-254` and `web/lib/finance-utils.ts:206-209`
**Issue:** `parseStoredAmount` returns `Number.NaN` when parsing fails (documented in the source). At line 253-254 of `transaction-sheet.tsx`:

```typescript
const amountNum = parseStoredAmount(form.amount);
if (!amountNum || amountNum <= 0) return;
```

`!NaN` evaluates to `true` in JavaScript, so the guard happens to work. However `!0` is also `true`, which correctly guards the zero case, but `!""` through `parseStoredAmount("")` also returns `NaN`, so the guard is functioning correctly only by coincidence of JavaScript's falsy coercion. The `canSave` check on line 289 has the same pattern: `parseStoredAmount(form.amount) > 0` — `NaN > 0` is `false`, so it also works by coincidence. This is a latent fragility: if `parseStoredAmount` is ever changed to return `0` on parse failure instead of `NaN`, the `!amountNum` guard silently passes `0` to the action.

**Fix:** Use an explicit `isNaN` check or change `parseStoredAmount` to return `null` on failure:

```typescript
// Option A: explicit check at call site
const amountNum = parseStoredAmount(form.amount);
if (Number.isNaN(amountNum) || amountNum <= 0) return;

// Option B: change parseStoredAmount return type to number | null
export function parseStoredAmount(raw: string): number | null {
  const amount = Number.parseFloat(raw);
  return Number.isFinite(amount) ? amount : null;
}
```

---

## Info

### IN-01: Currency picker is hardcoded to `["USD", "COP"]` in the UI component

**File:** `web/components/transaction-sheet.tsx:351`
**Issue:** The supported currencies array is duplicated inline in the JSX. The canonical list already exists in `web/lib/validations/transactions.ts` as `SUPPORTED_CURRENCIES`. Any future currency addition requires changing two files, and the validation schema and UI can drift.

**Fix:** Export `SUPPORTED_CURRENCIES` from the validations file and import it into the component:

```typescript
// In validations/transactions.ts — already defined, just add export:
export const SUPPORTED_CURRENCIES = ["USD", "COP"] as const;

// In transaction-sheet.tsx:
import { SUPPORTED_CURRENCIES } from "@/lib/validations/transactions";
// ...
{SUPPORTED_CURRENCIES.map((c) => ( ... ))}
```

### IN-02: `getCurrencyFormatter` hardcodes `minimumFractionDigits: 2` for all currencies

**File:** `web/lib/finance-utils.ts:56-65`
**Issue:** The formatter always sets `minimumFractionDigits: 2`, but COP is a zero-decimal currency. `Intl.NumberFormat` with `currency: "COP"` will already produce no decimal places in locales that use `en-US` formatting of COP, but pinning `minimumFractionDigits: 2` overrides that — COP amounts will display with `.00` appended. The `getCurrencyDecimals` helper correctly identifies COP as zero-decimal, but `getCurrencyFormatter` doesn't use it.

**Fix:**

```typescript
function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    const decimals = getCurrencyDecimals(currency);
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatterCache.set(currency, formatter);
  }
  return formatter;
}
```

### IN-03: Commented-out `// CONTEXT.md discretion` notes in `EditableTransaction` type

**File:** `web/components/transaction-sheet.tsx:129-130`
**Issue:** The inline comments `// pre-fill edit form with this value, not amount (CONTEXT.md discretion)` and `// pre-fill edit form currency badge` on the `EditableTransaction` type are planning-artifact annotations, not code documentation. They reference planning docs rather than explaining code intent.

**Fix:** Replace with concise code comments explaining the data-model reason:

```typescript
type EditableTransaction = {
  amount: string;
  originalAmount: string | null; // stored in transaction currency (not base-currency `amount`)
  currency: string | null;       // ISO 4217 code of the transaction
  // ...
};
```

---

_Reviewed: 2026-04-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
