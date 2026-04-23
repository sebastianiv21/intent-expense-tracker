# Phase 4: UI Layer - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Display multi-currency data correctly in the transaction list and wherever `TransactionItem` is rendered (transaction list page + dashboard recent transactions). No new routes, no schema changes, no action changes. The data layer (Phase 3) is complete — `currency`, `originalAmount`, and `exchangeRate` are fully persisted and available on every `TransactionWithCategory` object.

**What Phase 4 owns:**
- Fix `formatCurrency` to respect per-currency decimal conventions (COP = 0, USD = 2)
- Show original-currency amounts in the transaction list for foreign-currency transactions (DISP-01)
- Inline expansion on `TransactionItem` that shows the full dual-currency detail (DISP-02)
- COP 0-decimal display throughout the app (DISP-03)

**What Phase 4 does NOT touch:**
- Server actions, Zod schemas, DB queries, or exchange rate logic (Phase 3 owns these)
- The edit form `TransactionSheet` — currency entry UI was built in Phase 3
- Budget cards, hero balance card, or dashboard aggregates (they read `amount` in base currency — no change needed)

</domain>

<decisions>
## Implementation Decisions

### Transaction List Display (DISP-01)

- **D-01:** For transactions where `transaction.currency !== baseCurrency`, the amount shown in
  the list item switches from the base-currency `amount` to `transaction.originalAmount`
  formatted in `transaction.currency` (e.g., `-COL$50.000` instead of `-$12.50`).
- **D-02:** For same-currency transactions (`currency === baseCurrency`, typically all USD
  transactions), the existing display is unchanged — `formatCurrency(transaction.amount)` in
  the base currency.
- **D-03:** Sign convention is unchanged: expense → negative prefix (`-`), income → positive
  prefix (`+`), same as today.
- **D-04:** `baseCurrency` is read from the existing `useCurrency()` hook already wired into
  `TransactionItem` — add `const { currency: baseCurrency } = useCurrency()`. No new props
  needed. The `CurrencyProvider` in `(app)/layout.tsx` propagates the user's base currency
  automatically.
- **D-05:** The dashboard's "Recent transactions" section renders the same `TransactionItem`
  component — the fix applies automatically at no extra cost.

### Inline Expansion (DISP-02)

- **D-06:** Foreign-currency transactions (`currency !== baseCurrency`) are **inline-expandable**.
  Tapping/clicking the card body toggles a detail row below the main transaction info. A
  chevron icon (down/up) is shown on the trailing side of the amount to signal interactivity.
  Same-currency (USD) transactions are NOT expandable — no chevron, card body is not interactive.
- **D-07:** The expand/collapse state is local `useState` inside `TransactionItem`. No context,
  no URL param, no lifting needed.
- **D-08:** The expanded detail row shows (on a single line or two compact lines):
  ```
  → {formattedBaseAmount} {baseCurrency}  @  {invertedRate} {txCurrency}/{baseCurrency}  ·  {date}
  ```
  Example: `→ $12.50 USD  @  4,098 COP/USD  ·  Apr 19, 2026`
  - `formattedBaseAmount` = `formatCurrency(transaction.amount)` in base currency
  - `invertedRate` = `Math.round(1 / parseFloat(transaction.exchangeRate))` formatted with
    `toLocaleString("en-US")` for thousands separator (e.g., 4,098)
  - `txCurrency` = `transaction.currency`
  - `baseCurrency` = user's base currency from context
  - `date` = `transaction.date` formatted as "MMM d, yyyy" (same `date-fns` pattern used
    elsewhere in the component)
- **D-09:** The chevron and card-body click area must not conflict with the `DropdownMenu`
  trigger (Edit/Delete). The click handler is placed on the left/center section of the card,
  not on the trailing button area.

### Rate Display Format (DISP-02)

- **D-10:** Rate is shown **inverted**: `Math.round(1 / exchangeRate)` so it reads as "how
  many units of the transaction currency per 1 unit of base currency" — e.g., 4,098 COP/USD.
  This matches the roadmap example and is more intuitive for someone spending COP.
  The stored rate is COP→USD (0.000244); the display flips it to USD→COP (4,098).
- **D-11:** Use `Math.round` for the inverted rate (no decimal places). For COP/USD this
  gives "4,098" — acceptable precision for a display label.

### COP Decimal Formatter Fix (DISP-03)

- **D-12:** Update `getCurrencyFormatter` in `lib/finance-utils.ts` to use
  `getCurrencyDecimals(currency)` for both `minimumFractionDigits` and `maximumFractionDigits`
  instead of the current hardcoded `2`. The `getCurrencyDecimals` helper already exists and
  returns `0` for COP, `2` for all others.
- **D-13:** The compact formatter (`getCompactCurrencyFormatter`) is NOT changed — it already
  uses `maximumFractionDigits: 1` and `notation: "compact"`, and compact COP display (e.g.,
  "COL$50K") reads correctly without further changes.
- **D-14:** This change is safe: for USD (the base currency), `getCurrencyDecimals("USD")` = 2
  so existing behavior is unchanged. The only new behavior is COP amounts showing 0 decimals.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` §DISP-01, DISP-02, DISP-03

### Files to Modify

- `web/components/transaction-item.tsx` — primary change surface:
  - Add `useCurrency().currency` for baseCurrency
  - Conditional amount display (original vs. base currency)
  - Add inline expand/collapse state and UI
  - Import `formatCurrency` from `@/lib/finance-utils` directly for original-currency formatting
- `web/lib/finance-utils.ts` — fix `getCurrencyFormatter`:
  - Change hardcoded `minimumFractionDigits: 2, maximumFractionDigits: 2` to
    `getCurrencyDecimals(currency)` for both fields

### Files to Read (no changes expected)

- `web/types/index.ts` — `Transaction` type has `currency`, `originalAmount`, `exchangeRate`
- `web/components/currency-provider.tsx` — `useCurrency()` returns `{ currency, formatCurrency, formatCurrencyCompact }`
- `web/components/transaction-list.tsx` — renders `TransactionItem`; no changes needed
- `web/app/(app)/page.tsx` — dashboard uses `TransactionItem` too; benefits automatically
- `web/app/(app)/transactions/page.tsx` — transactions page; no changes needed

### Prior Phase Context

- Phase 3 CONTEXT.md — D-01, D-05: baseCurrency is `financialProfile.currency`; CurrencyProvider is in `(app)/layout.tsx`
- Phase 1 CONTEXT.md — D-06: `amount` column is always the base-currency value

</canonical_refs>

<code_context>
## Existing Code Insights

### Current `TransactionItem` amount display (line ~56)

```tsx
{`${transaction.type === "expense" ? "-" : "+"}${formatCurrency(transaction.amount)}`}
```

This always formats `transaction.amount` (base currency). For DISP-01, branch on `currency !== baseCurrency`:
- Foreign: format `transaction.originalAmount` in `transaction.currency`
- Same: keep existing behavior

### `useCurrency()` in `TransactionItem` (line 27)

Already imported and used:
```tsx
const { formatCurrency } = useCurrency();
```

Extend to also destructure `currency` for baseCurrency comparison:
```tsx
const { formatCurrency, currency: baseCurrency } = useCurrency();
```

But `useCurrency().formatCurrency` is bound to base currency. To format in `transaction.currency`,
import `formatCurrency` directly from `@/lib/finance-utils` with an explicit second arg:
```tsx
import { formatCurrency as formatCurrencyRaw } from "@/lib/finance-utils";
// ...
formatCurrencyRaw(transaction.originalAmount, transaction.currency)
```

Alternatively, rename the context's `formatCurrency` to avoid collision:
```tsx
const { formatCurrency: formatBase, currency: baseCurrency } = useCurrency();
```

### `getCurrencyFormatter` (finance-utils.ts lines ~53-65)

Current:
```ts
formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
```

Fixed:
```ts
const decimals = getCurrencyDecimals(currency);
formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency,
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});
```

`getCurrencyDecimals` is already defined in the same file (line ~113). Move it above
`getCurrencyFormatter` or forward-reference it.

### Chevron component

Use `ChevronDown` / `ChevronUp` from `lucide-react` — already a dep; `MoreHorizontal` is
already imported from there in `transaction-item.tsx`. No new dependency needed.

### `transaction-item.tsx` is a `"use client"` component

`useState` for expand/collapse is straightforward — no server component concerns.

</code_context>

<specifics>
## Specific Interaction Notes

- The expand chevron should only appear on foreign-currency items. USD transactions look exactly
  as they do today — no visual change.
- The card-body click target should cover the left/center section (emoji, description, date area)
  to create a large touch target. The trailing area (amount + dropdown button) should only
  respond to the dropdown trigger — not trigger the expansion.
- The expanded detail row is visually secondary (smaller text, muted color) — it's metadata,
  not primary content. Follow the existing `text-xs text-muted-foreground` pattern.
- Accessibility: the chevron button (or the clickable area) should have `aria-expanded` and
  an `aria-label` like "Show conversion details for {description}".

</specifics>

<deferred>
## Deferred Ideas

- **Dual display in list for all transactions** (ADV-01 in v2) — show both original and
  base amount side by side for every item. Not v1; inline expansion covers the need.
- **Per-currency subtotals in dashboard** (ADV-02) — out of scope.
- **Compact rate display in list** — showing rate inline next to amount without expanding.
  Declined: adds clutter; expansion achieves the same goal more cleanly.

</deferred>

---

*Phase: 04-ui-layer*
*Context gathered: 2026-04-23*
