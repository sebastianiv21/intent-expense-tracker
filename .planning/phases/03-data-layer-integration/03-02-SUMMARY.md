---
phase: 03-data-layer-integration
plan: 02
subsystem: ui
status: partial — awaiting human-verify checkpoint
tags: [react, currency, ui, transaction-sheet, popover, multi-currency]

# Dependency graph
requires:
  - phase: 03-data-layer-integration
    plan: 01
    provides: getExchangeRateForPreview, getCurrencyDecimals, updated Transaction type with currency/originalAmount
provides:
  - Currency badge + popover replacing hardcoded $ sign in TransactionSheet
  - Conversion preview (≈ $XX.XX USD) below amount field for non-base-currency entries
  - COP decimal stripping and inputMode=numeric / placeholder=0
  - Edit-mode pre-fill using originalAmount (COP value), not converted amount
  - currency + baseCurrency fields in handleSubmit payload
affects: [createTransaction, updateTransaction, server-actions-payload]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "handleCurrencySelect: fetch rate on currency selection, store in previewRate state, surface error in role=alert block"
    - "Preview-only rate: previewRate is display-only; server action independently fetches rate on save"
    - "getCurrencyDecimals gate: zero-decimal currencies strip decimals in onChange and switch inputMode/placeholder"

key-files:
  created: []
  modified:
    - web/components/transaction-sheet.tsx

key-decisions:
  - "Preview uses formatCurrency(amount * previewRate, baseCurrency) — display-only, server always re-fetches on save"
  - "handleCurrencySelect resets previewRate to null on every currency change before fetching fresh rate"
  - "formatCurrency imported from finance-utils (not inline Intl) to match app-wide currency formatting"

requirements-completed: [ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04]

# Metrics
duration: 18min
completed: 2026-04-23
---

# Phase 03 Plan 02: TransactionSheet Currency UI Summary

**STATUS: Partial — Tasks 1 and 2 complete; awaiting human-verify checkpoint approval before Task 3 (continuation)**

**Multi-currency UI wired into TransactionSheet: tappable currency badge (USD/COP popover), live conversion preview, per-currency decimal handling, edit-mode originalAmount pre-fill, and currency+baseCurrency in submit payload**

## Performance

- **Duration:** ~18 min (Tasks 1+2)
- **Started:** 2026-04-23
- **Completed:** Partial — checkpoint pending
- **Tasks:** 2/3 (checkpoint task pending human verification)
- **Files modified:** 1

## Accomplishments

### Task 1: FormState, EditableTransaction, buildInitialState, state vars

- `FormState` interface extended with `currency: string` field
- `EditableTransaction` type extended with `originalAmount: string | null` and `currency: string | null`
- `buildInitialState` now accepts `baseCurrency: string` as 4th parameter; edit path uses `transaction.originalAmount ?? transaction.amount` for amount pre-fill and `transaction.currency ?? baseCurrency` for currency
- `useCurrency()` called in component body to extract `baseCurrency`
- Three new state variables added: `currencyPickerOpen`, `previewRate`, `previewLoading`
- All three reset in the `isOpen` useEffect alongside existing resets

### Task 2: Currency badge, popover, preview, COP formatting, payload

- Hardcoded `<span>$</span>` replaced with a `<Popover>` currency badge showing ISO code (`form.currency`)
- Two-option popover (`USD` / `COP`) with `handleCurrencySelect` async function
- `handleCurrencySelect` calls `getExchangeRateForPreview(newCurrency, baseCurrency, form.date)`, stores rate in `previewRate`, surfaces error via `setError` on failure
- Conversion preview paragraph with `aria-live="polite"` renders below amount area when `form.currency !== baseCurrency` and `parseStoredAmount(form.amount) > 0`
- COP: `inputMode="numeric"`, `placeholder="0"`, decimal stripped in `onChange` via `getCurrencyDecimals` guard
- USD: `inputMode="decimal"`, `placeholder="0.00"`, decimals preserved
- `handleSubmit` payload extended with `currency: form.currency` and `baseCurrency`

## Task Commits

1. **Task 1: Extend FormState, EditableTransaction, buildInitialState, and component state** — `1a609c2`
2. **Task 2: Currency badge, popover, conversion preview, COP formatting, and payload extension** — `ed3af5a`

## Files Created/Modified

- `web/components/transaction-sheet.tsx` — All changes (currency badge, popover, preview, decimal handling, payload)

## Decisions Made

- Preview row uses `formatCurrency(parseStoredAmount(form.amount) * previewRate, baseCurrency)` from `finance-utils` — consistent with app-wide currency formatting rather than inline `Intl.NumberFormat`
- `handleCurrencySelect` resets `previewRate` to `null` before each fetch to avoid showing a stale rate from a previous currency selection
- `formatCurrency` added to the `finance-utils` import block (was not previously imported in this file)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing import] Added formatCurrency import to finance-utils import block**
- **Found during:** Task 2 — preview row needed `formatCurrency(amount * previewRate, baseCurrency)` per plan spec
- **Issue:** `formatCurrency` was not in the existing `finance-utils` import in `transaction-sheet.tsx`; plan's fallback `new Intl.NumberFormat(...).format(value)` would have been inconsistent with app-wide formatting
- **Fix:** Added `formatCurrency` to the `@/lib/finance-utils` import destructure
- **Files modified:** `web/components/transaction-sheet.tsx`
- **Commit:** `ed3af5a`

## Known Stubs

None — all currency fields are wired to real data. `form.currency` defaults to `baseCurrency` from `useCurrency()` (live context). `previewRate` comes from `getExchangeRateForPreview` server action (live exchange rate fetch). Edit pre-fill uses `transaction.originalAmount` from the database.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. `currency` and `baseCurrency` in the payload are validated by the existing Zod `z.enum(SUPPORTED_CURRENCIES)` guard in the server action (Plan 01).

---

## Self-Check

**Files exist:**
- `web/components/transaction-sheet.tsx` — FOUND (modified)

**Commits exist:**
- `1a609c2` — Task 1 commit
- `ed3af5a` — Task 2 commit

## Self-Check: PASSED

*Phase: 03-data-layer-integration*
*Status: Partial — awaiting checkpoint*
