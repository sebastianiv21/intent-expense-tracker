# Data Model: Dashboard Visual Redesign

**Branch**: `003-dashboard-redesign` | **Date**: 2026-03-26

## Summary

This feature introduces **no changes to the database schema, Drizzle ORM models, or data fetching logic**. The redesign is purely presentational — all data consumed by the dashboard page remains unchanged.

## Existing Data Shapes (Reference Only)

The following types from `lib/queries/dashboard.ts` and `types/index.ts` are consumed as-is by the redesigned components. No modifications are needed.

### `DashboardData`

```
balance          number   — Monthly income minus expenses
monthIncome      number   — Total income this month
monthExpenses    number   — Total expenses this month
bucketSummaries  BucketSummary[]
recentTransactions  TransactionWithCategory[]
upcomingRecurring   RecurringTransactionWithCategory[]
quickStats
  dailyAverage   number
  safeToSpend    number
  daysRemaining  number
```

### `BucketSummary`

```
bucket    AllocationBucket  — "needs" | "wants" | "future"
label     string
color     string            — hex color from BUCKET_DEFINITIONS
spent     number            — raw spend amount (used for state thresholds)
target    number            — calculated monthly target
progress  number            — capped at 100 via calculatePercentage()
```

**Important**: Bucket state (on-track / nearing limit / over-budget) is derived in the component from `spent` and `target` directly, not from `progress`. See `research.md` R-002.

## Design Token Addition

One addition to `globals.css` is required to support the "nearing limit" amber state without hardcoding hex values:

```css
/* In :root block */
--warning: #f59e0b;

/* In @theme inline block */
--color-warning: var(--warning);
```

This is a CSS design token addition, not a dependency or schema change. It enables `text-warning` and `bg-warning` Tailwind classes.
