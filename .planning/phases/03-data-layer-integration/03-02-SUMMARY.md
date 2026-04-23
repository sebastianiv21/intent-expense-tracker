---
phase: 03-data-layer-integration
plan: 02
subsystem: ui
status: complete
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
    - "inferDecimalSeparator heuristic: treat 3+ trailing digits as thousands separator (not decimal)"

key-files:
  created: []
  modified:
    - web/components/transaction-sheet.tsx

key-decisions:
  - "Preview uses formatCurrency(amount * previewRate, baseCurrency) — display-only, server always re-fetches on save"
  - "handleCurrencySelect resets previewRate to null on every currency change before fetching fresh rate"
  - "formatCurrency imported from finance-utils (not inline Intl) to match app-wide currency formatting"
  - "inferDecimalSeparator bypassed for zero-decimal currencies to prevent 5th-digit-as-decimal misdetection"
  - "USD decimal input clamped to 2 places in onChange to prevent 5,00000000 display artifacts"
  - "Input value bound to formatted display string (not raw form.amount) to preserve thousands comma on re-render"

requirements-completed: [ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04]

# Metrics
duration: 35min
completed: 2026-04-23
---

# Phase 03 Plan 02: TransactionSheet Currency UI Summary

**Multi-currency UI wired into TransactionSheet: tappable currency badge (USD/COP popover), live conversion preview, per-currency decimal handling, edit-mode originalAmount pre-fill, and currency+baseCurrency in submit payload**

## Performance

- **Duration:** ~35 min (Tasks 1+2 + post-checkpoint fixes)
- **Started:** 2026-04-23
- **Completed:** 2026-04-23
- **Tasks:** 3/3 (including checkpoint — human approved)
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
- Conversion preview paragraph with `aria-live="polite"` renders below amount area when `form.currency !== baseCurrency` and `parseStoredAmount(form.amount) > 0`; preview appends the base currency code (e.g., "≈ $13.94 USD")
- COP: `inputMode="numeric"`, `placeholder="0"`, decimal stripped in `onChange` via `getCurrencyDecimals` guard
- USD: `inputMode="decimal"`, `placeholder="0.00"`, decimals preserved and clamped to 2 places
- `handleSubmit` payload extended with `currency: form.currency` and `baseCurrency`

### Task 3: Human-verify checkpoint — APPROVED

All three scenarios verified by user:
1. USD transaction: badge shows USD, decimals accepted, saves correctly
2. COP transaction: badge shows COP, 50000 types freely, conversion preview shows ≈ $13.94 USD, saves
3. Edit COP transaction: badge shows COP, amount shows original COP value (originalAmount), not USD equivalent

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | FormState, EditableTransaction, buildInitialState, state vars | `1a609c2` | `web/components/transaction-sheet.tsx` |
| 2 | Currency badge, popover, conversion preview, COP formatting, payload | `ed3af5a` | `web/components/transaction-sheet.tsx` |
| Fix | Append currency code to conversion preview (≈ $13.94 USD) | `eeb0470` | `web/components/transaction-sheet.tsx` |
| Fix | Bypass separator heuristic for zero-decimal currencies (COP 5th digit bug) | `0093768` | `web/components/transaction-sheet.tsx` |
| Fix | Clamp USD decimal input to 2 places | `84da9db` | `web/components/transaction-sheet.tsx` |
| Fix | Fix inferDecimalSeparator (>=3 trailing digits = thousands), restore formatted display | `b98e430` | `web/components/transaction-sheet.tsx` |
| 3 | Checkpoint: human approved all 3 scenarios | — | — |

## Files Created/Modified

- `web/components/transaction-sheet.tsx` — All changes (currency badge, popover, preview, decimal handling, payload)

## Decisions Made

- Preview row uses `formatCurrency(parseStoredAmount(form.amount) * previewRate, baseCurrency)` from `finance-utils` — consistent with app-wide currency formatting rather than inline `Intl.NumberFormat`
- `handleCurrencySelect` resets `previewRate` to `null` before each fetch to avoid showing a stale rate from a previous currency selection
- `formatCurrency` added to the `finance-utils` import block (was not previously imported in this file)
- Preview appends the base currency ISO code ("≈ $13.94 USD") for clarity when the transaction currency differs from base
- `inferDecimalSeparator` heuristic bypassed for zero-decimal currencies: a 5th digit entered in COP was incorrectly classified as a decimal separator; bypass ensures COP input never activates the decimal path
- USD decimal input clamped to 2 places in `onChange` (after `parseAmountInput`) to prevent display artifacts like "5,00000000"
- Input `value` bound to formatted display string (thousands comma) rather than raw `form.amount` to maintain consistent display on re-render

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing import] Added formatCurrency import to finance-utils import block**
- **Found during:** Task 2 — preview row needed `formatCurrency(amount * previewRate, baseCurrency)` per plan spec
- **Issue:** `formatCurrency` was not in the existing `finance-utils` import in `transaction-sheet.tsx`; plan's fallback `new Intl.NumberFormat(...).format(value)` would have been inconsistent with app-wide formatting
- **Fix:** Added `formatCurrency` to the `@/lib/finance-utils` import destructure
- **Files modified:** `web/components/transaction-sheet.tsx`
- **Commit:** `ed3af5a`

**2. [Rule 1 - Bug] Currency code missing from conversion preview label**
- **Found during:** Post-Task 2 verification — preview showed "≈ $13.94" with no currency code, making it ambiguous if base currency is not obvious
- **Issue:** `formatCurrency` outputs a symbol but not the ISO code; plan spec shows "≈ $XX.XX USD"
- **Fix:** Appended ` ${baseCurrency}` to the formatted preview string
- **Files modified:** `web/components/transaction-sheet.tsx`
- **Commit:** `eeb0470`

**3. [Rule 1 - Bug] COP 5th digit misidentified as decimal separator**
- **Found during:** User testing — entering "50000" in COP field caused the 5th digit to be interpreted as a decimal separator by `inferDecimalSeparator`
- **Issue:** `inferDecimalSeparator` heuristic classifies any character at a 3-or-fewer-digit boundary as a decimal separator; COP integers triggered this on the 5th digit
- **Fix:** Added guard in `onChange` to bypass the heuristic entirely for zero-decimal currencies (detected via `getCurrencyDecimals`); COP always uses plain integer parsing
- **Files modified:** `web/components/transaction-sheet.tsx`
- **Commit:** `0093768`

**4. [Rule 1 - Bug] USD decimal input showing excessive trailing digits (5,00000000)**
- **Found during:** User testing — entering "5.00" in USD field showed "5,00000000" due to unclamped raw float multiplication in the display path
- **Issue:** `parseAmountInput` returns the raw decimal string without clamping; for 2-decimal currencies the display should show at most 2 decimal places
- **Fix:** Added clamp in `onChange` after `parseAmountInput`: if `getCurrencyDecimals(form.currency) === 2` and the decimal part has more than 2 digits, truncate to 2
- **Files modified:** `web/components/transaction-sheet.tsx`
- **Commit:** `84da9db`

**5. [Rule 1 - Bug] Input value binding caused cursor jump and stale display on re-render**
- **Found during:** Post-fix testing — after the decimal clamp fix, re-rendering the input with raw `form.amount` stripped the thousands comma, causing display inconsistency
- **Issue:** `form.amount` stores the normalized (comma-free) number string; binding `value={form.amount}` drops the formatted display the user sees
- **Fix:** Bound input `value` to the formatted display string (with thousands comma) rather than raw `form.amount`; `inferDecimalSeparator` updated to treat 3+ trailing digits as a thousands separator (not decimal)
- **Files modified:** `web/components/transaction-sheet.tsx`
- **Commit:** `b98e430`

## Known Stubs

None — all currency fields are wired to real data. `form.currency` defaults to `baseCurrency` from `useCurrency()` (live context). `previewRate` comes from `getExchangeRateForPreview` server action (live exchange rate fetch). Edit pre-fill uses `transaction.originalAmount` from the database.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. `currency` and `baseCurrency` in the payload are validated by the existing Zod `z.enum(SUPPORTED_CURRENCIES)` guard in the server action (Plan 01).

---

## Self-Check

**Files exist:**
- `web/components/transaction-sheet.tsx` — FOUND (modified)

**Commits exist:**
- `1a609c2` — Task 1: extend FormState, EditableTransaction, buildInitialState, and component state
- `ed3af5a` — Task 2: currency badge, popover, conversion preview, COP formatting, payload extension
- `eeb0470` — Fix: append currency code to conversion preview
- `0093768` — Fix: bypass separator heuristic for zero-decimal currencies
- `84da9db` — Fix: clamp USD decimal input to 2 places
- `b98e430` — Fix: fix inferDecimalSeparator, restore formatted input display

**Verification grep checks (run at finalization):**
- `currency: string` in FormState — MATCH
- `originalAmount ?? transaction.amount` in buildInitialState — MATCH
- `currencyPickerOpen` — 3 matches
- `handleCurrencySelect` — 2 matches
- `aria-live="polite"` — MATCH
- `getCurrencyDecimals` — 5 matches
- `currency: form.currency` in payload — MATCH
- `baseCurrency` — 12 matches
- `>$<` in file — 0 (old hardcoded span removed)
- `pnpm build` — exits 0
- `pnpm lint` — exits 0 (1 warning in unrelated file `hero-balance-card.tsx`)

## Self-Check: PASSED

*Phase: 03-data-layer-integration*
*Status: Complete — human-verify checkpoint approved*
