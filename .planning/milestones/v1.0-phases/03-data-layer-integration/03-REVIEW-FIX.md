---
phase: 03-data-layer-integration
fixed_at: 2026-04-22T00:00:00Z
review_path: .planning/phases/03-data-layer-integration/03-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-04-22T00:00:00Z
**Source review:** .planning/phases/03-data-layer-integration/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (CR-01 + WR-01 through WR-04)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: Recurring transactions hardcode `currency: "USD"` — wrong for COP users

**Files modified:** `web/lib/actions/recurring.ts`
**Commit:** b180e43
**Applied fix:** Added `financialProfile` to the schema import and inserted a DB lookup of `financialProfile.currency` for the authenticated user before the processing loop. The resolved value (`baseCur`) replaces the hardcoded `"USD"` literal on the `currency` field of every generated transaction insert. Falls back to `"USD"` only if the user has no profile row.

---

### WR-01: Conversion preview goes stale when date changes after currency selection

**Files modified:** `web/components/transaction-sheet.tsx`
**Commit:** 344f995
**Applied fix:** Expanded the `onSelect` handler of the date picker Calendar. After updating the date field and closing the picker, a conditional block checks whether `form.currency !== baseCurrency`. When true it clears `previewRate`, sets `previewLoading`, calls `getExchangeRateForPreview` with the new date, and updates state when the promise resolves — mirroring the existing `handleCurrencySelect` pattern exactly.

---

### WR-02: `exportTransactions` action calls `getTransactions` without an auth guard

**Files modified:** `web/lib/actions/transactions.ts`
**Commit:** 4970a05
**Applied fix:** Added `await getAuthenticatedUser();` as the first statement in `exportTransactions`, consistent with every other action in the file. The call throws/redirects if the user is not authenticated, making the action boundary explicit and resilient to future refactors of `getTransactions`.

---

### WR-03: `updateTransaction` falls back to `existing[0].currency` as `baseCurrency`

**Files modified:** `web/lib/validations/transactions.ts`, `web/lib/actions/transactions.ts`
**Commit:** 1f8a3f0
**Applied fix:** Changed `baseCurrency` in `updateTransactionSchema` from `.optional()` to required (`z.enum(SUPPORTED_CURRENCIES)` with no optional modifier). The existing UI client (`TransactionSheet`) already always sends `baseCurrency`, so this is a non-breaking change for the live app. Removed the now-unnecessary `?? existing[0].currency` fallback in the action, replacing it with a direct read of `parsed.data.baseCurrency` and a clarifying comment.

**Note:** requires human verification of the logic change — confirm that all callers of `updateTransaction` supply `baseCurrency`.

---

### WR-04: `parseStoredAmount` returns `NaN` but callers treat it as falsy via `!amountNum`

**Files modified:** `web/components/transaction-sheet.tsx`
**Commit:** 6392aee
**Applied fix:** Replaced `if (!amountNum || amountNum <= 0)` with `if (Number.isNaN(amountNum) || amountNum <= 0)` in `handleSubmit`. The `canSave` derived value (`parseStoredAmount(form.amount) > 0`) and the preview display guard already use `> 0` comparisons which are correct with `NaN` and required no change.

---

_Fixed: 2026-04-22T00:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
