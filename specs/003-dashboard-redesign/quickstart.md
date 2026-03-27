# Quickstart: Dashboard Visual Redesign

**Branch**: `003-dashboard-redesign` | **Date**: 2026-03-26

## What This Feature Changes

A visual and layout redesign of the dashboard page. No database migrations, no new routes, no new npm packages.

## Files to Modify or Create

| Action | File | What Changes |
|--------|------|-------------|
| MODIFY | `web/app/globals.css` | Add `--warning` design token to `:root` and `@theme inline` |
| CREATE | `web/components/bucket-card.tsx` | New Server Component for per-bucket card |
| MODIFY | `web/app/(app)/page.tsx` | Balance hero, inline stats, grid bucket layout, typography |
| MODIFY | `web/components/transaction-item.tsx` | Add hover state classes to item wrapper |

## Implementation Order

### Step 1 — Add warning design token (`globals.css`)

In the `:root` block, after `--bucket-future`:
```css
--warning: #f59e0b;
```

In the `@theme inline` block, after `--color-bucket-future`:
```css
--color-warning: var(--warning);
```

### Step 2 — Create `BucketCard` component

New file: `web/components/bucket-card.tsx`

- Server Component (no `"use client"`)
- Props: `{ bucket, label, color, spent, target, progress }` (from `BucketSummary`)
- Derive state from `spent` vs `target`:
  - `spent >= target` → over-budget → `AlertCircle` + `text-destructive`
  - `spent >= target * 0.8` → nearing limit → `AlertTriangle` + `text-warning`
  - otherwise → on-track → `CheckCircle2` + icon colored via `style={{ color }}`
- Use shadcn `Progress` for the bar (value = `progress` prop, capped 0–100)
- Display `formatCurrencyCompact(spent)` and `formatCurrencyCompact(target)`

See `contracts/ui-contracts.md` for full rendering spec.

### Step 3 — Redesign `page.tsx`

Changes to `web/app/(app)/page.tsx`:

1. **Balance hero**: Increase balance text from `text-3xl font-semibold` → `text-4xl font-bold tracking-tight`. Apply `text-destructive` when `data.balance < 0`.

2. **Inline quick stats**: Remove the three separate `<Card>` components (daily avg, safe to spend, days remaining). Add a `flex divide-x divide-border` strip inside the balance `CardContent`, below the income/expenses line. Each stat: label (`text-xs text-muted-foreground`) + value (`text-sm font-semibold`).

3. **Section headings**: Change from `text-lg font-semibold` → `text-xs font-semibold uppercase tracking-wider text-muted-foreground` for section labels outside of Cards ("50/30/20 harmony", "This month").

4. **Bucket grid**: Change bucket container from `flex gap-4 overflow-x-auto pb-2` → `grid grid-cols-1 sm:grid-cols-3 gap-3`. Remove `min-w-[220px]` from each card. Replace inline bucket card markup with `<BucketCard {...bucket} key={bucket.bucket} />`.

5. **Recurring hover**: Add `motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30 cursor-default` to the recurring item `<div>` — `cursor-default` (not `cursor-pointer`) because recurring items have no click action; `motion-safe:` prefix ensures the transition respects `prefers-reduced-motion`.

### Step 4 — Add hover state to `TransactionItem`

In `web/components/transaction-item.tsx`, on the root `<div>`:
```
className="rounded-xl border border-border bg-card p-4 motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30"
```

## Verification Steps

```bash
cd web
pnpm lint          # Must pass with zero errors
pnpm build         # Must succeed (type-check + build)
```

Manual checks:
- [ ] Balance figure is visually the largest number on the page
- [ ] Balance renders in `text-destructive` when negative (test with mock or a negative balance month)
- [ ] All 3 bucket cards visible simultaneously on viewport ≥ 640px without horizontal scroll
- [ ] Each bucket card shows an icon alongside the percentage (color + icon, not color only)
- [ ] Nearing-limit bucket (80–99%) shows amber `AlertTriangle`
- [ ] Over-budget bucket (≥100%) shows red `AlertCircle`
- [ ] On-track bucket (<80%) shows bucket-colored `CheckCircle2`
- [ ] Hovering a `TransactionItem` shows a subtle background shift
- [ ] Hovering a recurring item shows the same subtle background shift at the same opacity
- [ ] Quick stats appear inline within the balance card (no separate peer cards)
- [ ] Two-column layout (`lg:grid-cols-[1.5fr_1fr]`) for recent transactions and upcoming recurring is intact at 1280px viewport width
- [ ] Empty state placeholders for transactions, recurring items, and buckets render without visual regression (test by temporarily clearing data or checking with empty arrays)
- [ ] Page renders without overflow at 360px, 768px, and 1280px viewport widths

## No Migration Required

This feature has no database schema changes. `pnpm db:generate` and `pnpm db:push` are not needed.
