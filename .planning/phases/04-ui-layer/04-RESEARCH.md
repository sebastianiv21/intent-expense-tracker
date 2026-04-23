# Phase 4: UI Layer — Research

**Researched:** 2026-04-22
**Domain:** React client component modification — multi-currency display, Intl.NumberFormat formatter fix, inline expand/collapse interaction
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Transaction List Display (DISP-01)**
- D-01: For transactions where `transaction.currency !== baseCurrency`, the amount shown in the list item switches from the base-currency `amount` to `transaction.originalAmount` formatted in `transaction.currency`.
- D-02: For same-currency transactions (`currency === baseCurrency`), the existing display is unchanged — `formatCurrency(transaction.amount)` in the base currency.
- D-03: Sign convention is unchanged: expense → negative prefix (`-`), income → positive prefix (`+`).
- D-04: `baseCurrency` is read from `useCurrency()` hook — `const { currency: baseCurrency } = useCurrency()`. No new props needed.
- D-05: Dashboard "Recent transactions" section renders the same `TransactionItem` — the fix applies automatically.

**Inline Expansion (DISP-02)**
- D-06: Foreign-currency transactions are inline-expandable via chevron icon. Same-currency (USD) transactions are NOT expandable — no chevron.
- D-07: Expand/collapse state is local `useState` inside `TransactionItem`. No context, no URL param, no lifting.
- D-08: Expanded detail row shows: `→ {formattedBaseAmount} {baseCurrency}  @  {invertedRate} {txCurrency}/{baseCurrency}  ·  {date}`. `invertedRate` = `Math.round(1 / parseFloat(transaction.exchangeRate))` formatted with `toLocaleString("en-US")`.
- D-09: The chevron and card-body click area must not conflict with the `DropdownMenu` trigger.

**Rate Display Format (DISP-02)**
- D-10: Rate is shown inverted: `Math.round(1 / exchangeRate)` — reads as "how many COP per 1 USD".
- D-11: Use `Math.round` for the inverted rate (no decimal places).

**COP Decimal Formatter Fix (DISP-03)**
- D-12: Update `getCurrencyFormatter` in `lib/finance-utils.ts` to use `getCurrencyDecimals(currency)` for both `minimumFractionDigits` and `maximumFractionDigits`.
- D-13: The compact formatter (`getCompactCurrencyFormatter`) is NOT changed.
- D-14: For USD, `getCurrencyDecimals("USD")` = 2 — zero behavioral change.

### Claude's Discretion

None specified — all implementation decisions are locked in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

- **ADV-01 (Dual display in list for all transactions):** Not v1; inline expansion covers the need.
- **ADV-02 (Per-currency subtotals in dashboard):** Out of scope.
- **Compact rate display in list:** Declined — expansion is cleaner.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISP-01 | Transaction list shows the original-currency amount for transactions where `currency ≠ base_currency` (e.g., COL$50.000 instead of $12.50) | D-01/D-02 implemented via `isForeign` branch in `TransactionItem`; `originalAmount` field confirmed present on `TransactionWithCategory` type |
| DISP-02 | Transaction detail (inline expansion) shows: original amount, converted base-currency amount, exchange rate, and rate date | D-06 through D-11 fully specified; `expandedDetail` row pattern confirmed viable with existing `useState` in `"use client"` component |
| DISP-03 | Currency formatters respect each currency's conventions: COP = 0 decimal places, USD = 2 decimal places | D-12 fix confirmed: `getCurrencyDecimals` already exists at line 113 of `finance-utils.ts`, currently below `getCurrencyFormatter` (lines 53–65) — must be moved up or hoisted |
</phase_requirements>

---

## Summary

Phase 4 is a focused UI-only change: two files, no schema work, no action work, no new dependencies. The data layer (Phase 3) already exposes `currency`, `originalAmount`, and `exchangeRate` on every `TransactionWithCategory` object — confirmed by direct codebase inspection of `web/types/index.ts`.

The primary change surface is `web/components/transaction-item.tsx` (currently 88 lines). It is already a `"use client"` component, already imports `MoreHorizontal` from `lucide-react`, and already uses `useCurrency()`. The three required changes are: (1) destructure `currency` from `useCurrency()` for the foreign-currency branch, (2) import `formatCurrency` directly from `@/lib/finance-utils` to format `originalAmount` in the transaction currency, and (3) add `useState`-backed expand/collapse with a chevron button and detail row.

The secondary change is in `web/lib/finance-utils.ts`: move `getCurrencyDecimals` (currently line 113) above `getCurrencyFormatter` (lines 53–65), then call `getCurrencyDecimals(currency)` for both `minimumFractionDigits` and `maximumFractionDigits`. The `formatterCache` Map ensures the corrected formatters are built once per currency code and reused — no performance regression.

**Primary recommendation:** Implement in two discrete tasks: (1) formatter fix in `finance-utils.ts`, (2) multi-currency display + inline expansion in `transaction-item.tsx`. The formatter fix is a prerequisite because `formatCurrencyRaw(transaction.originalAmount, "COP")` must produce `COL$50.000` (0 decimals) for the list display to satisfy DISP-01 and DISP-03 simultaneously.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| COP 0-decimal formatting (DISP-03) | Client utility (`finance-utils.ts`) | — | Intl.NumberFormat configuration lives in the formatter factory; no server involvement |
| Foreign-currency amount display in list (DISP-01) | Client component (`TransactionItem`) | Context (`CurrencyProvider`) | Display logic is client-side; base currency flows from context already wired to the component |
| Inline expand/collapse interaction (DISP-02) | Client component (`TransactionItem`) | — | Local UI state; no server round-trip, no shared state needed |
| Rate inversion computation (DISP-02) | Client component (`TransactionItem`) | — | Pure math on already-fetched data; no new fetch or server call |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | `useState` for expand/collapse | Already in use; `"use client"` component |
| lucide-react | (existing dep) | `ChevronDown` / `ChevronUp` icons | Already a project dependency; `MoreHorizontal` already imported in `transaction-item.tsx` |
| date-fns | ^4.1.0 | `format(parsedDate, "MMM d, yyyy")` for rate date in detail row | Already imported in `transaction-item.tsx` (`format`, `parseISO`) |
| Intl.NumberFormat | Browser/Node built-in | Currency formatting with locale | Used in `getCurrencyFormatter` today; no new import |

[VERIFIED: direct codebase inspection of `web/components/transaction-item.tsx`, `web/lib/finance-utils.ts`, `web/package.json`]

### Supporting

No new packages are required for this phase.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useState` for expand/collapse | URL search param | URL param adds routing complexity; local state is correct (D-07) |
| `ChevronDown`/`ChevronUp` from lucide-react | Custom SVG | lucide-react already in dep tree — no reason to add custom SVG |
| `Math.round` for inverted rate | `toFixed(2)` with decimal display | D-11 locks `Math.round` — no decimals on rate |

**Installation:** No new packages required. All dependencies are already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
TransactionWithCategory (from Phase 3 data layer)
  { amount, currency, originalAmount, exchangeRate, date, ... }
           │
           ▼
  TransactionItem (web/components/transaction-item.tsx)
  "use client" — useState(expanded)
           │
    ┌──────┴──────────────────────────────────┐
    │                                          │
    ▼ isForeign = currency !== baseCurrency    ▼ !isForeign (USD)
    │                                          │
formatCurrencyRaw(originalAmount, currency)   formatBase(amount)
[from lib/finance-utils directly]             [from useCurrency() context]
    │                                          │
    ▼                                          ▼
  Amount line: -COL$50.000                  Amount line: -$12.50
  + ChevronDown (accent)                    [no chevron]
    │
  user clicks chevron
    │
    ▼ expanded=true
  Detail row:
  → formatBase(amount) baseCurrency  ·  Math.round(1/exchangeRate).toLocaleString()  txCurrency/baseCurrency  ·  date
  [text-xs text-muted-foreground, pl-[52px]]
```

```
getCurrencyFormatter (web/lib/finance-utils.ts)
  [BEFORE]  minimumFractionDigits: 2, maximumFractionDigits: 2
  [AFTER]   const decimals = getCurrencyDecimals(currency)
            minimumFractionDigits: decimals, maximumFractionDigits: decimals
  Cached in formatterCache Map<string, Intl.NumberFormat>
```

### Recommended Project Structure

No new directories or files. Changes are confined to:

```
web/
├── lib/
│   └── finance-utils.ts      ← Move getCurrencyDecimals above getCurrencyFormatter; fix digit params
└── components/
    └── transaction-item.tsx  ← Add useState, isForeign branch, chevron, detail row
```

### Pattern 1: Foreign-Currency Branch in TransactionItem

**What:** Conditional render based on `transaction.currency !== baseCurrency`
**When to use:** Any display component that needs to show original vs. converted amounts

```tsx
// Source: CONTEXT.md <code_context>, verified against transaction-item.tsx line 56
const { formatCurrency: formatBase, currency: baseCurrency } = useCurrency();
// Import at top of file:
// import { formatCurrency as formatCurrencyRaw } from "@/lib/finance-utils";

const isForeign = transaction.currency !== baseCurrency;
const displayAmount = isForeign
  ? formatCurrencyRaw(transaction.originalAmount, transaction.currency)
  : formatBase(transaction.amount);

const sign = transaction.type === "expense" ? "-" : "+";
// Render: {sign}{displayAmount}
```

[VERIFIED: codebase — `useCurrency()` returns `{ currency, formatCurrency, formatCurrencyCompact }`; `formatCurrency` in `finance-utils.ts` accepts `(amount, currency)` with `currency` defaulting to `DEFAULT_CURRENCY`]

### Pattern 2: Inverted Rate Computation

**What:** Flip stored COP→USD rate (e.g., 0.000244) to USD→COP (e.g., 4,098) for human-readable display
**When to use:** Any rate display where the stored rate direction is foreign→base

```tsx
// Source: CONTEXT.md D-10, D-11
const invertedRate = Math.round(1 / parseFloat(transaction.exchangeRate)).toLocaleString("en-US");
// Result: "4,098"
```

Edge case: `parseFloat` on Drizzle `numeric` columns returns a string at runtime. Both `parseFloat("0.000244")` and `Math.round(1 / 0.000244)` behave correctly. Guard against division by zero is not needed in practice (exchangeRate is always > 0 for real transactions) but worth noting.

[VERIFIED: `web/types/index.ts` line 39 — `exchangeRate: string` confirms Drizzle numeric→string coercion]

### Pattern 3: getCurrencyDecimals Hoist Fix

**What:** Move `getCurrencyDecimals` above `getCurrencyFormatter` so it can be called inside the factory
**When to use:** Required whenever a function declared below another needs to be called by it

```ts
// Source: CONTEXT.md D-12, UI-SPEC "Modified: web/lib/finance-utils.ts"
// BEFORE: getCurrencyDecimals at line 113, getCurrencyFormatter at lines 53-65
// AFTER: getCurrencyDecimals moved to ~line 53, getCurrencyFormatter follows

export function getCurrencyDecimals(currency: string): number {
  return currency === "COP" ? 0 : 2;
}

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

[VERIFIED: `finance-utils.ts` lines 53–65 (getCurrencyFormatter) and 113–115 (getCurrencyDecimals)]

### Pattern 4: Chevron Button Meeting Touch Target

**What:** Ghost-variant icon button with 44px minimum touch target, conditional render
**When to use:** Expandable list items requiring accessible toggle control

```tsx
// Source: UI-SPEC "Chevron placement" + existing DropdownMenuTrigger pattern in transaction-item.tsx line 64
{isForeign && (
  <Button
    variant="ghost"
    size="icon"
    className="min-h-11 min-w-11 shrink-0"
    aria-expanded={expanded}
    aria-label={`${expanded ? "Hide" : "Show"} conversion details for ${transaction.description || transaction.category?.name || "transaction"}`}
    onClick={() => setExpanded((prev) => !prev)}
  >
    {expanded ? (
      <ChevronUp className="h-4 w-4" style={{ color: "var(--accent)" }} />
    ) : (
      <ChevronDown className="h-4 w-4" style={{ color: "var(--accent)" }} />
    )}
  </Button>
)}
```

[VERIFIED: UI-SPEC color contract — ChevronDown/Up uses `--accent` (`#c4714a`); UI-SPEC accessibility contract — `aria-expanded`, `aria-label`, `min-h-11 min-w-11`]

### Pattern 5: Expanded Detail Row

**What:** Secondary information row, visually indented to align with description text
**When to use:** Inline expansion of metadata below a list item's main content

```tsx
// Source: UI-SPEC "Expanded detail row" + CONTEXT.md D-08
// pl-[52px] = 40px icon + 12px gap (gap-3 = 12px) — aligns with description text
{isForeign && expanded && (
  <div className="pt-2 pl-[52px]">
    <p className="text-xs text-muted-foreground">
      {`→ ${formatBase(transaction.amount)} ${baseCurrency}  ·  ${invertedRate} ${transaction.currency}/${baseCurrency}  ·  ${format(parsedDate, "MMM d, yyyy")}`}
    </p>
  </div>
)}
```

[VERIFIED: UI-SPEC spacing — `pt-2 pl-[52px]`; typography — `text-xs text-muted-foreground`; UI-SPEC note allows `·` or `@` as rate separator — either conforms]

### Anti-Patterns to Avoid

- **Whole-card click handler for expansion:** The outer `div` must NOT receive an `onClick`. The chevron `Button` handles its own click. This avoids conflict with the `DropdownMenu` trigger (CONTEXT.md D-09). [VERIFIED: UI-SPEC "Click area" section]
- **Formatting `originalAmount` via `useCurrency().formatCurrency`:** That function is bound to the base currency. For foreign amounts, call `formatCurrencyRaw` imported directly from `@/lib/finance-utils` with explicit currency arg. [VERIFIED: `currency-provider.tsx` lines 28–29 — `formatCurrency: (amount) => formatCurrency(amount, currency)` — binds to provider currency]
- **Importing `formatCurrency` from `@/lib/finance-utils` and naming it the same:** Name collision with the context's `formatCurrency`. Use `import { formatCurrency as formatCurrencyRaw }` (CONTEXT.md code snippet).
- **Changing `getCompactCurrencyFormatter`:** D-13 locks this as unchanged — compact formatter already uses `maximumFractionDigits: 1` with `notation: "compact"` and COP compact display is acceptable.
- **Adding new dependencies:** All required icons and hooks are already available. No `npm install` step.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting with locale | Custom number-to-string formatter | `Intl.NumberFormat` (already via `getCurrencyFormatter`) | Handles locale-specific symbol placement, thousands separators, and sign display automatically |
| Inverted rate formatting with thousands separator | Manual string manipulation | `Number.toLocaleString("en-US")` | Single call handles the thousands separator (e.g., 4,098 not 4098) |
| Icon toggle (expand/collapse) | Custom SVG swap logic | `ChevronDown`/`ChevronUp` from lucide-react | Already in dep tree; consistent with existing `MoreHorizontal` usage |

**Key insight:** The entire phase is UI wiring over already-fetched data. There are no algorithmic problems to solve — only correct composition of existing tools.

---

## Common Pitfalls

### Pitfall 1: Name Collision on `formatCurrency` Import

**What goes wrong:** `import { formatCurrency } from "@/lib/finance-utils"` added alongside `const { formatCurrency } = useCurrency()` causes a TypeScript name collision; one silently shadows the other depending on order.
**Why it happens:** The context exposes a method with the same name as the utility function.
**How to avoid:** Always import the raw utility under an alias: `import { formatCurrency as formatCurrencyRaw } from "@/lib/finance-utils"`. Then destructure from context as `const { formatCurrency: formatBase, currency: baseCurrency } = useCurrency()`.
**Warning signs:** TypeScript may report a duplicate identifier, or the wrong formatter is used silently (e.g., COP amounts show in USD format).

[VERIFIED: codebase — `finance-utils.ts` exports `formatCurrency`; `currency-provider.tsx` also exposes `formatCurrency` in context value]

### Pitfall 2: `getCurrencyDecimals` Forward Reference

**What goes wrong:** `getCurrencyFormatter` calls `getCurrencyDecimals(currency)` before `getCurrencyDecimals` is declared in the file → runtime `ReferenceError` (or TypeScript error depending on declaration style).
**Why it happens:** `getCurrencyDecimals` is currently at line 113; `getCurrencyFormatter` is at lines 53–65. Function declarations are hoisted in JS, but `export function` declarations in ES modules are block-scoped and hoisted — this is actually fine for named function declarations. However, to be safe and for readability clarity, move `getCurrencyDecimals` above `getCurrencyFormatter`.
**How to avoid:** Physically move `getCurrencyDecimals` to above `getCurrencyFormatter` in the file. This eliminates any ambiguity and makes the dependency order explicit.
**Warning signs:** TypeScript error "Block-scoped variable used before declaration" (if ever refactored to `const`).

[VERIFIED: `finance-utils.ts` line 53 (`getCurrencyFormatter`) vs line 113 (`getCurrencyDecimals`) — confirmed ordering issue]

### Pitfall 3: formatterCache Stale Entry After Fix

**What goes wrong:** The `formatterCache` Map stores formatters by currency code string. If a formatter was cached before the `getCurrencyDecimals` fix (e.g., during hot-reload in dev), the old 2-decimal COP formatter might persist in the cache within the same module lifetime.
**Why it happens:** `formatterCache` is a module-level `Map` — it persists for the lifetime of the module instance.
**How to avoid:** This is not a production concern (module is loaded fresh on each server start / client hydration). In dev, a full refresh (not HMR) clears it. No code change needed beyond the formatter fix itself.
**Warning signs:** In dev with HMR, COP amounts might still show 2 decimals. Fix: hard-refresh the browser tab.

[VERIFIED: `finance-utils.ts` line 50 — `const formatterCache = new Map<string, Intl.NumberFormat>()`]

### Pitfall 4: Chevron Click Triggering DropdownMenu

**What goes wrong:** If the chevron button is placed outside or overlapping the trailing div, click events may propagate to the `DropdownMenuTrigger` or the card's hover state may conflict with the button focus state.
**Why it happens:** Radix `DropdownMenu` uses portals but the trigger button is in the DOM at the same level.
**How to avoid:** Place the chevron button inside the same `flex items-center gap-2 shrink-0` trailing div, between the amount text and the `DropdownMenu`. The chevron's `onClick` is self-contained — no `stopPropagation` needed since the outer card div has no `onClick`.
**Warning signs:** Clicking the chevron also opens the dropdown, or clicking anywhere on the card triggers expansion.

[VERIFIED: `transaction-item.tsx` lines 50–84 — trailing div structure confirmed; UI-SPEC "Click area" section]

### Pitfall 5: `exchangeRate` Edge Cases in Inversion

**What goes wrong:** `1 / parseFloat("0")` = `Infinity`; `Math.round(Infinity)` = `Infinity`. Would display "Infinity COP/USD" in the detail row.
**Why it happens:** Drizzle returns `exchangeRate` as a string; if for any reason it's "0" or empty, `parseFloat` gives 0 or NaN.
**How to avoid:** Guard the computation: only render the detail row when `transaction.exchangeRate` parses to a finite, non-zero value. For this app, all real COP transactions created via Phase 3 will have a valid rate — but a null/0 guard is cheap insurance.
**Warning signs:** "Infinity" or "NaN" appears in the rate field.

[ASSUMED — no evidence of bad data in production, but the type allows any string]

---

## Code Examples

Verified patterns from codebase inspection:

### Complete Modified `TransactionItem` Structure

```tsx
// Source: transaction-item.tsx (current) + CONTEXT.md <code_context> + UI-SPEC
"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTransactionColor, formatCurrency as formatCurrencyRaw } from "@/lib/finance-utils";
import { useCurrency } from "@/components/currency-provider";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import type { TransactionWithCategory } from "@/types";

// ... (props type unchanged)

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const { openEdit } = useTransactionSheet();
  const { formatCurrency: formatBase, currency: baseCurrency } = useCurrency();
  const [expanded, setExpanded] = useState(false);

  const amountColor = getTransactionColor(transaction.type);
  const parsedDate = parseISO(transaction.date);
  const isForeign = transaction.currency !== baseCurrency;

  const sign = transaction.type === "expense" ? "-" : "+";
  const displayAmount = isForeign
    ? formatCurrencyRaw(transaction.originalAmount, transaction.currency)
    : formatBase(transaction.amount);

  const invertedRate = isForeign
    ? Math.round(1 / parseFloat(transaction.exchangeRate)).toLocaleString("en-US")
    : null;

  const txLabel = transaction.description || transaction.category?.name || "transaction";

  return (
    <div className="rounded-xl border border-border bg-card p-4 motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30">
      <div className="flex items-center justify-between gap-4">
        {/* Left: icon + description + date */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* ... unchanged */}
        </div>
        {/* Right: amount + chevron (conditional) + dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold whitespace-nowrap" style={{ color: amountColor }}>
              {sign}{displayAmount}
            </p>
          </div>
          {isForeign && (
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 shrink-0"
              aria-expanded={expanded}
              aria-label={`${expanded ? "Hide" : "Show"} conversion details for ${txLabel}`}
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded
                ? <ChevronUp className="h-4 w-4" style={{ color: "var(--accent)" }} />
                : <ChevronDown className="h-4 w-4" style={{ color: "var(--accent)" }} />
              }
            </Button>
          )}
          <DropdownMenu>
            {/* ... unchanged */}
          </DropdownMenu>
        </div>
      </div>
      {/* Detail row — only for foreign-currency when expanded */}
      {isForeign && expanded && (
        <div className="pt-2 pl-[52px]">
          <p className="text-xs text-muted-foreground">
            {`→ ${formatBase(transaction.amount)} ${baseCurrency}  ·  ${invertedRate} ${transaction.currency}/${baseCurrency}  ·  ${format(parsedDate, "MMM d, yyyy")}`}
          </p>
        </div>
      )}
    </div>
  );
}
```

### `getCurrencyFormatter` Fix

```ts
// Source: finance-utils.ts lines 53-65 + getCurrencyDecimals line 113
// Move getCurrencyDecimals to ABOVE getCurrencyFormatter, then:

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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `minimumFractionDigits: 2` | `getCurrencyDecimals(currency)` per currency | This phase | COP shows 0 decimals; USD unchanged |
| Always display `transaction.amount` (base currency) | Display `originalAmount` for foreign-currency transactions | This phase | Users see what they spent in the actual currency |
| No expansion UI | Inline chevron expansion with detail row | This phase | Conversion metadata accessible on demand |

**Deprecated/outdated:**
- The hardcoded `minimumFractionDigits: 2` in `getCurrencyFormatter`: replaced by `getCurrencyDecimals(currency)` call.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `transaction.exchangeRate` is always a finite, non-zero string for COP transactions created via Phase 3 | Common Pitfalls §5 | "Infinity" would appear in rate display — needs null guard if Phase 3 ever writes `0` or `null` |

---

## Open Questions

1. **Rate separator: `@` vs `·`**
   - What we know: CONTEXT.md D-08 uses `@`; UI-SPEC uses `·` and notes both are acceptable.
   - What's unclear: Which delimiter was actually approved.
   - Recommendation: Use `·` (matches existing date separator pattern in the component) unless the user prefers `@`.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is code-only changes to two existing files with no new packages, CLI tools, or services required).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — CLAUDE.md: "No tests: No existing test framework — don't add test infrastructure as part of this milestone" |
| Config file | N/A |
| Quick run command | N/A |
| Full suite command | N/A |

nyquist_validation is `true` in config, but CLAUDE.md explicitly prohibits adding test infrastructure. Manual verification protocol applies.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| DISP-01 | COP transaction shows `-COL$50.000` in list | manual-only | — | No test framework per CLAUDE.md |
| DISP-02 | Chevron appears on COP items; expanded detail shows rate, base amount, date | manual-only | — | No test framework per CLAUDE.md |
| DISP-03 | COP amounts show 0 decimals; USD amounts show 2 decimals | manual-only | — | No test framework per CLAUDE.md |

### Manual Verification Checklist (substitute for automated tests)

- [ ] Create a COP expense — list shows `-COL$50.000`, not `-$12.50`
- [ ] Same COP transaction — chevron icon visible in accent color
- [ ] Click chevron — detail row appears: `→ $12.50 USD · 4,098 COP/USD · Apr 19, 2026`
- [ ] Click chevron again — detail row collapses
- [ ] USD transaction — no chevron, no detail row, amount unchanged
- [ ] COP compact display in dashboard hero card — still reads correctly (compact formatter unchanged)
- [ ] Keyboard navigation — Tab to chevron, Enter to expand, aria-expanded announced by screen reader

### Wave 0 Gaps

None — no test infrastructure to scaffold. CLAUDE.md prohibits adding test infrastructure.

---

## Security Domain

This phase makes no changes to authentication, data access, input validation, server actions, or any network-facing code. All changes are to client-side display logic within existing authenticated session boundaries.

ASVS categories not applicable: V2 (auth unchanged), V3 (sessions unchanged), V4 (access control unchanged), V5 (no new user inputs), V6 (no cryptography).

No new threat surface is introduced.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `web/components/transaction-item.tsx` (88 lines, full read)
- Direct codebase inspection — `web/lib/finance-utils.ts` (228 lines, full read)
- Direct codebase inspection — `web/types/index.ts` — confirmed `currency`, `originalAmount`, `exchangeRate` fields on `Transaction`
- Direct codebase inspection — `web/components/currency-provider.tsx` — confirmed `useCurrency()` API
- Direct codebase inspection — `web/components/transaction-list.tsx` — confirmed `TransactionItem` usage; no props change needed
- `.planning/phases/04-ui-layer/04-CONTEXT.md` — locked decisions D-01 through D-14
- `.planning/phases/04-ui-layer/04-UI-SPEC.md` — visual and interaction contract

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — DISP-01, DISP-02, DISP-03 requirement text
- `.planning/STATE.md` — project history confirming Phase 3 complete and data layer available

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed by direct file inspection; no new installs
- Architecture: HIGH — two-file scope confirmed; data shape verified in types
- Pitfalls: HIGH (name collision, forward reference, stale cache) / ASSUMED (exchangeRate edge case)

**Research date:** 2026-04-22
**Valid until:** Stable — no external dependencies. Valid until `transaction-item.tsx` or `finance-utils.ts` is structurally refactored.
