# UI Contracts: Dashboard Visual Redesign

**Branch**: `003-dashboard-redesign` | **Date**: 2026-03-26

## Contract: `BucketCard` Component

A new Server Component extracted from `page.tsx` to encapsulate the per-bucket display card.

**File**: `web/components/bucket-card.tsx`

### Props Interface

```
BucketCardProps {
  bucket: AllocationBucket        — "needs" | "wants" | "future"
  label:  string                  — Display name ("Needs", "Wants", "Future")
  color:  string                  — Hex color from BUCKET_DEFINITIONS
  spent:  number                  — Raw spend amount
  target: number                  — Monthly target
  progress: number                — Capped 0–100 (used for Progress bar only)
}
```

### Visual Behavior Contract

| State | Condition | Icon | Icon Color | Text Color |
|-------|-----------|------|-----------|------------|
| On-track | `spent < target * 0.8` | `CheckCircle2` | bucket `color` | bucket `color` |
| Nearing limit | `spent >= target * 0.8 && spent < target` | `AlertTriangle` | `text-warning` | `text-warning` |
| Over-budget | `spent >= target` | `AlertCircle` | `text-destructive` | `text-destructive` |

- `Progress` bar fill: use existing `style={{ backgroundColor: \`\${color}22\` }}` pattern (bucket color at 13% opacity as track).
- Progress bar value: `progress` prop (capped at 100 — visual bar never overflows).
- Spent and target amounts: `formatCurrencyCompact()` from `lib/finance-utils`.

### Rendering Rules

- Must render within a `Card` / `CardContent` (shadcn).
- Must be responsive: full-width on mobile, 1/3-width within the `sm:grid-cols-3` parent.
- Icon and percentage MUST both be visible — not icon OR percentage (satisfies WCAG 1.4.1).

---

## Contract: `page.tsx` Layout Sections

Documents the expected rendered structure of the redesigned dashboard page as a UI contract.

### Balance Hero Section

```
<Card>
  <CardContent>
    [Balance amount]           — text-4xl font-bold tracking-tight
                               — text-destructive when balance < 0
                               — text-foreground when balance >= 0
    [Income · Expenses line]   — text-xs text-muted-foreground
    [Divider]
    [Quick stats strip]        — flex, divide-x divide-border
      [Daily avg spend]
      [Safe to spend]
      [Days remaining]         — each: label (text-xs muted) + value (text-sm font-semibold)
  </CardContent>
</Card>
```

### 50/30/20 Section

```
<section>
  [Section label]              — text-xs font-semibold uppercase tracking-wider text-muted-foreground
  [This month label]           — text-xs text-muted-foreground
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <BucketCard /> × 3
  </div>
</section>
```

### Transactions + Recurring Two-Column Section

```
<div class="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
  [Recent transactions card]
    [TransactionItem] × n     — existing component + hover classes
  [Upcoming recurring card]
    [recurring item div] × n  — hover:bg-muted/50 transition-colors duration-150
</div>
```

### Hover State Contract

All hoverable items (TransactionItem wrapper, recurring item div) MUST implement:
- `transition-colors duration-150` — smooth 150ms color transition
- `hover:bg-muted/50` — muted background at 50% opacity on hover
- `cursor-pointer` — pointer cursor to signal interactivity

---

## Contract: `globals.css` Token Addition

The following design tokens MUST be added to support the warning (nearing-limit) state:

```css
/* :root */
--warning: #f59e0b;

/* @theme inline */
--color-warning: var(--warning);
```

Enables: `text-warning`, `bg-warning`, `border-warning` Tailwind utilities.
