# Phase 4: UI Layer — Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 2 (both modifications to existing files)
**Analogs found:** 2 / 2 — both files are the analogs themselves

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `web/components/transaction-item.tsx` | component | request-response (read-only display + local UI state) | itself (current 88-line version) | self — incremental modification |
| `web/lib/finance-utils.ts` | utility | transform | itself (current 228-line version) | self — targeted function fix |

Both files are modifications, not new files. The analog for each is the file itself — patterns are
extracted from the current implementation to show what is being extended.

---

## Pattern Assignments

### `web/components/transaction-item.tsx` (component, request-response + local state)

**Type:** Modification to existing `"use client"` component.

**Imports pattern** (lines 1–15, current):

```tsx
"use client";

import { format, parseISO } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTransactionColor } from "@/lib/finance-utils";
import { useCurrency } from "@/components/currency-provider";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import type { TransactionWithCategory } from "@/types";
```

**Required import additions** (splice into existing import block):

```tsx
// Add useState
import { useState } from "react";
// Add chevron icons alongside existing MoreHorizontal
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
// Add formatCurrency aliased to avoid collision with useCurrency().formatCurrency
import { getTransactionColor, formatCurrency as formatCurrencyRaw } from "@/lib/finance-utils";
```

**Context destructure pattern** (line 27, current):

```tsx
// CURRENT — only formatCurrency
const { formatCurrency } = useCurrency();

// AFTER — also pull currency for isForeign comparison; rename to avoid collision
const { formatCurrency: formatBase, currency: baseCurrency } = useCurrency();
```

**Local state pattern** — add immediately after context hooks (after line 27):

```tsx
const [expanded, setExpanded] = useState(false);
```

**Derived value pattern** — add after `parsedDate` line (after line 30):

```tsx
const isForeign = transaction.currency !== baseCurrency;

const sign = transaction.type === "expense" ? "-" : "+";
const displayAmount = isForeign
  ? formatCurrencyRaw(transaction.originalAmount, transaction.currency)
  : formatBase(transaction.amount);

const invertedRate =
  isForeign && transaction.exchangeRate
    ? Math.round(1 / parseFloat(transaction.exchangeRate)).toLocaleString("en-US")
    : null;

const txLabel =
  transaction.description || transaction.category?.name || "transaction";
```

**Amount display pattern** (line 56, current):

```tsx
// CURRENT
{`${transaction.type === "expense" ? "-" : "+"}${formatCurrency(transaction.amount)}`}

// AFTER — use pre-computed sign and displayAmount
{`${sign}${displayAmount}`}
```

**Chevron button pattern** — insert between amount `<div>` and `<DropdownMenu>` (after line 58):

```tsx
{isForeign && (
  <Button
    variant="ghost"
    size="icon"
    className="min-h-11 min-w-11 shrink-0"
    aria-expanded={expanded}
    aria-label={`${expanded ? "Hide" : "Show"} conversion details for ${txLabel}`}
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

Pattern copy from: existing `DropdownMenuTrigger` `Button` at lines 61–68 — same `variant="ghost"
size="icon" className="min-h-11 min-w-11 ... shrink-0"` sizing idiom.

**Existing dropdown button pattern** (lines 60–68) — copy sizing and variant, do NOT change:

```tsx
<DropdownMenuTrigger asChild>
  <Button
    variant="ghost"
    size="icon"
    className="min-h-11 min-w-11 -mr-2 shrink-0"
    aria-label={`Options for ${transaction.description || transaction.category?.name || "transaction"}`}
  >
    <MoreHorizontal className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
```

**Detail row pattern** — insert after the closing `</div>` of `flex items-center justify-between`
(after line 85, before the outer closing `</div>`):

```tsx
{isForeign && expanded && invertedRate !== null && (
  <div className="pt-2 pl-[52px]">
    <p className="text-xs text-muted-foreground">
      {`→ ${formatBase(transaction.amount)} ${baseCurrency}  ·  ${invertedRate} ${transaction.currency}/${baseCurrency}  ·  ${format(parsedDate, "MMM d, yyyy")}`}
    </p>
  </div>
)}
```

Pattern copy from: date line at lines 45–47 — same `text-xs text-muted-foreground` typography.

```tsx
// Existing secondary text pattern (lines 45–47):
<p className="text-xs text-muted-foreground truncate">
  {format(parsedDate, "MMM d, yyyy")}
</p>
```

**`pl-[52px]` spacing rationale:** 40px icon (`h-10 w-10`) + 12px gap (`gap-3` = 12px) = 52px.
This aligns the detail row text with the description text column — documented exception in UI-SPEC.

---

### `web/lib/finance-utils.ts` (utility, transform)

**Type:** Targeted fix to `getCurrencyFormatter` — move `getCurrencyDecimals` above it, then call
`getCurrencyDecimals(currency)` for both digit params.

**Current `getCurrencyFormatter`** (lines 53–65):

```ts
function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,  // ← hardcoded
      maximumFractionDigits: 2,  // ← hardcoded
    });
    formatterCache.set(currency, formatter);
  }
  return formatter;
}
```

**Current `getCurrencyDecimals`** (lines 113–115):

```ts
export function getCurrencyDecimals(currency: string): number {
  return currency === "COP" ? 0 : 2;
}
```

**After fix** — move `getCurrencyDecimals` to above `getCurrencyFormatter` (becomes the new lines
~53–55), then update `getCurrencyFormatter`:

```ts
// Moved to above getCurrencyFormatter:
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

**Compact formatter** (lines 67–79) — DO NOT touch:

```ts
function getCompactCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = compactFormatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,  // intentional — not changed per D-13
    });
    compactFormatterCache.set(currency, formatter);
  }
  return formatter;
}
```

**Cache pattern** (lines 50–51) — unchanged:

```ts
const formatterCache = new Map<string, Intl.NumberFormat>();
const compactFormatterCache = new Map<string, Intl.NumberFormat>();
```

---

## Shared Patterns

### "use client" + useState

**Source:** `web/components/transaction-item.tsx` line 1, extended with `useState`
**Apply to:** `transaction-item.tsx` (already a client component — just add `useState` import)

```tsx
"use client";
import { useState } from "react";
```

### Context consumption pattern

**Source:** `web/components/currency-provider.tsx` lines 41–43 + `transaction-item.tsx` line 27

```tsx
// Provider exports a simple hook — no null guard needed (context has safe defaults)
export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}

// Consumption — rename destructured keys to avoid collision:
const { formatCurrency: formatBase, currency: baseCurrency } = useCurrency();
```

`useCurrency()` always returns a valid object (context default at lines 13–18 of `currency-provider.tsx`
uses `DEFAULT_CURRENCY`). No null-check or throw guard is required.

### `formatCurrency` dual-import pattern

**Source:** `web/components/currency-provider.tsx` lines 5, 29 + `web/lib/finance-utils.ts` lines 85–92
**Apply to:** `transaction-item.tsx`

The context's `formatCurrency` is bound to the user's base currency:
```tsx
// currency-provider.tsx line 29 — bound to provider currency
formatCurrency: (amount) => formatCurrency(amount, currency),
```

To format in an arbitrary currency (e.g., COP for `originalAmount`), import the raw utility under
an alias:
```tsx
import { formatCurrency as formatCurrencyRaw } from "@/lib/finance-utils";
// Usage:
formatCurrencyRaw(transaction.originalAmount, transaction.currency)
```

### Ghost icon button sizing

**Source:** `web/components/transaction-item.tsx` lines 61–68 (DropdownMenuTrigger Button)
**Apply to:** Chevron button in `transaction-item.tsx`

```tsx
<Button
  variant="ghost"
  size="icon"
  className="min-h-11 min-w-11 ... shrink-0"
>
```

44px minimum touch target (`min-h-11 min-w-11`) is the established pattern for all icon buttons
in this component. Copy exactly — only omit `-mr-2` (negative margin is specific to the trailing
dropdown button).

### Secondary typography

**Source:** `web/components/transaction-item.tsx` lines 45–47
**Apply to:** Expanded detail row in `transaction-item.tsx`

```tsx
<p className="text-xs text-muted-foreground truncate">
```

Drop `truncate` from the detail row (the detail row should be allowed to wrap on very small
screens); keep `text-xs text-muted-foreground`.

---

## No Analog Found

None. Both change surfaces are well-established files with clear existing patterns. No file in
this phase requires a pattern from outside the codebase.

---

## Critical Pitfalls (from RESEARCH.md)

| Pitfall | Guard |
|---------|-------|
| `formatCurrency` name collision | Import raw util as `formatCurrencyRaw`; destructure context as `formatBase` |
| `getCurrencyDecimals` forward reference | Physically move definition above `getCurrencyFormatter` in the file |
| Chevron click conflicts with DropdownMenu | Chevron `Button` handles its own `onClick`; outer `div` has no `onClick` |
| `exchangeRate` edge case (`"0"` or `""`) | Guard: `invertedRate !== null` check before rendering detail row |
| Stale `formatterCache` in dev HMR | No code fix needed — hard-refresh clears it |

---

## Metadata

**Analog search scope:** `web/components/`, `web/lib/`
**Files scanned:** 4 (`transaction-item.tsx`, `finance-utils.ts`, `currency-provider.tsx`, `types/index.ts`)
**Pattern extraction date:** 2026-04-22
