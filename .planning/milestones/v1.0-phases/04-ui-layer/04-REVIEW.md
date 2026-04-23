---
phase: 04-ui-layer
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - web/lib/finance-utils.ts
  - web/components/transaction-item.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two files were reviewed: the currency/finance utility library (`finance-utils.ts`) and the transaction list item component (`transaction-item.tsx`). The code is generally well-structured and consistent with project conventions. Three warning-level issues were found — the most impactful is a division-by-zero in the exchange rate display calculation that produces a visible `∞` in the UI. A secondary concern is that `getCurrencyDecimals` only special-cases COP, leaving several other zero-decimal currencies (JPY, KRW, CLP, HUF) formatted with unwanted decimal places.

---

## Warnings

### WR-01: Division by zero in `invertedRate` produces `∞` in UI

**File:** `web/components/transaction-item.tsx:42-45`
**Issue:** The inverted exchange rate is computed as `Math.round(1 / parseFloat(transaction.exchangeRate))`. If a transaction is stored with `exchangeRate = "0"` (which is a valid DB state — a rate may be missing or zeroed), `parseFloat("0")` is `0`, and `1 / 0` is `Infinity`. `Math.round(Infinity)` is `Infinity`, and `Infinity.toLocaleString("en-US")` returns `"∞"`. The guard on line 120 (`invertedRate !== null`) does not catch this case because `invertedRate` would be the string `"∞"` (non-null). The conversion details row then renders: `→ $X USD  ·  ∞ COP/USD  ·  Jan 1, 2025`.

**Fix:**
```tsx
const rawRate = parseFloat(transaction.exchangeRate ?? "0");
const invertedRate =
  isForeign && rawRate > 0
    ? Math.round(1 / rawRate).toLocaleString("en-US")
    : null;
```
Change the render guard on line 120 to remain as-is (`invertedRate !== null`) — the fix is in the calculation, not the render condition.

---

### WR-02: `getCurrencyDecimals` only handles COP — other zero-decimal currencies display incorrect decimals

**File:** `web/lib/finance-utils.ts:53-55`
**Issue:** `getCurrencyDecimals` returns `0` for COP and `2` for everything else. The supported currency list includes other zero-decimal currencies: JPY, KRW, CLP, HUF, and TWD (which uses 2 in practice but JPY/KRW/CLP are standard zero-decimal). A Japanese Yen amount formatted via `getCurrencyFormatter("JPY")` will produce `¥1,234.00` instead of `¥1,234`. Beyond being incorrect, some `Intl.NumberFormat` implementations throw a `RangeError` when `minimumFractionDigits` exceeds the ISO 4217 maximum for a currency (e.g., JPY max is 0).

**Fix:**
```ts
const ZERO_DECIMAL_CURRENCIES = new Set(["COP", "JPY", "KRW", "CLP", "HUF", "TWD"]);

export function getCurrencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}
```

---

### WR-03: `formatCurrencyCompact` compact formatter ignores zero-decimal currencies

**File:** `web/lib/finance-utils.ts:72-84`
**Issue:** `getCompactCurrencyFormatter` creates the formatter with only `maximumFractionDigits: 1` and no `minimumFractionDigits`. For zero-decimal currencies like COP, the compact formatter may show a decimal place (e.g., `COL$1.2M`) while the regular formatter correctly shows none (e.g., `COL$1,234,567`). This is inconsistent with the intent of `getCurrencyDecimals`.

**Fix:**
```ts
function getCompactCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = compactFormatterCache.get(currency);
  if (!formatter) {
    const decimals = getCurrencyDecimals(currency);
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals === 0 ? 0 : 1,
    });
    compactFormatterCache.set(currency, formatter);
  }
  return formatter;
}
```

---

## Info

### IN-01: Redundant condition in `inferDecimalSeparator`

**File:** `web/lib/finance-utils.ts:128`
**Issue:** The condition `digitsAfter === 0 || digitsAfter <= 2` is logically equivalent to `digitsAfter <= 2` because `0 <= 2` is always true. The `digitsAfter === 0` branch is dead code. This does not affect behavior but obscures intent.

**Fix:**
```ts
if (digitsAfter <= 2) {
  return lastMatch[0] as "." | ",";
}
```

---

### IN-02: `parseISO` result not validated before `format` — unhandled `RangeError` possible

**File:** `web/components/transaction-item.tsx:31`
**Issue:** `parseISO(transaction.date)` returns an `Invalid Date` object if `transaction.date` is not a valid ISO 8601 string. Passing an `Invalid Date` to `format()` from `date-fns` throws a `RangeError: Invalid time value`, which would crash the component and propagate up without an error boundary. In practice the DB schema always stores valid ISO dates, but there is no defensive check.

**Fix:**
```tsx
import { format, parseISO, isValid } from "date-fns";

const parsedDate = parseISO(transaction.date);
const formattedDate = isValid(parsedDate) ? format(parsedDate, "MMM d, yyyy") : "—";
```
Then replace both `format(parsedDate, "MMM d, yyyy")` usages (lines 65 and 123) with `formattedDate`.

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
