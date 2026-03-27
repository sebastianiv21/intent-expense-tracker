# Quickstart: Insights Page Visual Redesign

## Overview

This redesign focuses purely on visual presentation - no backend changes, no new dependencies, no data structure modifications. The goal is to transform the Insights page from a generic card-based layout to a refined, asymmetric design with distinctive typography and purposeful animations.

## Files to Modify

| File | Purpose |
|------|---------|
| `web/components/insights-page.tsx` | Main client component with charts and metrics |
| `web/components/skeletons/insights-skeleton.tsx` | Loading state skeleton |

## Prerequisites

- Node.js 24
- pnpm
- Existing dev server running (`pnpm dev`)

## Quick Implementation Steps

### 1. Typography Enhancement

Add `tabular-nums` class to all currency/number displays:

```tsx
// Before
<span className="text-2xl font-semibold">{formatCurrency(value)}</span>

// After  
<span className="text-2xl font-semibold tabular-nums">{formatCurrency(value)}</span>
```

### 2. Asymmetric Layout

Update grid patterns for weighted layouts:

```tsx
// Current (symmetric)
<div className="grid gap-4 lg:grid-cols-2">

// Refined/Minimal asymmetric
<div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
```

### 3. Chart Animations

Add animation props to Recharts components:

```tsx
<Pie
  animationBegin={100}
  animationDuration={800}
  animationEasing="ease-out"
/>
```

### 4. Chart-Specific Skeletons

Replace generic rectangles with chart-shaped skeletons:

```tsx
// Donut skeleton
<div className="relative h-48 flex items-center justify-center">
  <Skeleton className="absolute w-36 h-36 rounded-full" />
  <Skeleton className="absolute w-20 h-20 rounded-full bg-background" />
</div>
```

## Verification Commands

```bash
# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build

# Run dev
pnpm dev
# Navigate to /insights
```

## Key Design Decisions (from Research)

1. **Keep Plus Jakarta Sans** - Use weight contrast for hierarchy
2. **Weighted grids** - `lg:grid-cols-[1.5fr_1fr]` for 60/40 split
3. **Animation timing** - 800ms duration, `ease-out`, staggered delays
4. **Mobile-first** - 375px base, scale up with breakpoints
5. **Chart-specific skeletons** - Match shapes to actual content

## Success Criteria Validation

| Criteria | How to Verify |
|----------|---------------|
| SC-001: Compliance visible in 3s | Visual inspection on page load |
| SC-002: Distinctive aesthetic | Compare before/after screenshots |
| SC-003: 100ms chart interactions | Browser DevTools performance tab |
| SC-004: CLS < 0.1 | Chrome Lighthouse audit |
| SC-005: Data accuracy | Compare displayed values to database |
| SC-007: Buckets distinguishable | Check labels/icons present with colors |
