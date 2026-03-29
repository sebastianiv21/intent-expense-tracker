# Data Model: Dashboard Hero Card and List Pattern Consistency

**Feature**: 013-dashboard-hero-redesign
**Date**: 2026-03-28

## Summary

No new entities or database schema changes required. This feature is a pure UI redesign that reuses existing data structures from the dashboard query.

## Existing Entities (Unchanged)

### Monthly Balance
- **Source**: Computed from `getDashboardData()` query
- **Fields Used**: `balance`, `monthIncome`, `monthExpenses`, `quickStats`
- **No Changes**: Data already available in correct shape

### Transaction
- **Source**: `data.recentTransactions` from `getDashboardData()`
- **Fields Used**: `id`, `date`, `description`, `category.name`, `category.icon`, `amount`, `type`
- **No Changes**: Existing `TransactionItem` component handles all rendering

### Recurring Item
- **Source**: `data.upcomingRecurring` from `getDashboardData()`
- **Fields Used**: `id`, `description`, `category.name`, `category.icon`, `category.allocationBucket`, `amount`, `nextDueDate`
- **No Changes**: Only styling updates; data shape unchanged

## Data Flow

```text
getDashboardData() query
    ├── balance, monthIncome, monthExpenses → Hero Balance Card
    ├── quickStats (dailyAverage, safeToSpend, daysRemaining) → Hero Balance Card (secondary tier)
    ├── recentTransactions[] → Date-grouped Transaction List
    └── upcomingRecurring[] → Recurring Items List
```

## Validation

No new validation required. Existing query already scopes data by authenticated user via `getAuthenticatedUser()` check.
