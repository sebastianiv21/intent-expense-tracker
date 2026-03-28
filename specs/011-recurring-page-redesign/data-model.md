# Data Model: Recurring Page Redesign

**Feature**: 011-recurring-page-redesign
**Date**: 2026-03-28

## Overview

This feature requires **no database schema changes**. The redesign is purely frontend, leveraging existing data structures.

## Existing Entities

### RecurringTransaction

A scheduled financial transaction that repeats at a defined frequency.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| userId | varchar(255) | Owner reference |
| categoryId | uuid (nullable) | Category association |
| amount | numeric(10,2) | Transaction amount |
| type | enum | "expense" or "income" |
| description | varchar(255) | Optional description |
| frequency | enum | "daily", "weekly", "biweekly", "monthly", "quarterly", "yearly" |
| startDate | date | When the recurrence begins |
| endDate | date (nullable) | Optional end date |
| nextDueDate | date | Next scheduled occurrence |
| lastGeneratedDate | date (nullable) | Last processed date |
| isActive | boolean | Active/paused status |
| createdAt | timestamp | Creation timestamp |
| updatedAt | timestamp | Last update timestamp |

**Relationships**:
- `category`: Many-to-one with Category (optional, can be null)

### Category

Classification for transactions.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| userId | varchar(255) | Owner reference |
| name | varchar(100) | Display name |
| icon | varchar(10) | Emoji icon |
| type | enum | "expense" or "income" |
| allocationBucket | enum | "needs", "wants", "future" (expense only) |

## Computed Data

### Summary Totals (derived client-side)

Computed from filtered recurring items in the component:

```typescript
interface RecurringSummary {
  totalIncome: number;      // Sum of active income items
  totalExpenses: number;    // Sum of active expense items
  netRecurring: number;     // totalIncome - totalExpenses
  activeCount: number;      // Count of active items
  pausedCount: number;      // Count of paused items
}
```

**Calculation**:
- Filter items by `isActive === true`
- Group by `type`
- Sum `amount` per group
- Derive net from difference

### RecurringTransactionWithCategory

Existing type from `types/index.ts`:
```typescript
type RecurringTransactionWithCategory = RecurringTransaction & {
  category: Category | null;
};
```

## State Transitions

### Active/Paused Toggle

```
┌─────────┐   toggle    ┌─────────┐
│ Active  │ ──────────> │ Paused  │
│ (true)  │ <────────── │ (false) │
└─────────┘   toggle    └─────────┘
```

- Toggle via `updateRecurring(id, { isActive: !currentValue })`
- Summary card only counts `isActive === true` items
- Paused items excluded from processing by `processRecurringTransactions()`

## Validation

Existing Zod schemas in `lib/validations/recurring.ts`:
- `createRecurringSchema`: Validates new recurring item
- `updateRecurringSchema`: Validates partial updates

No changes required.

## Query Functions

Existing in `lib/queries/recurring.ts`:
- `getRecurringTransactions()`: Fetches all recurring items with category relation

**Potential Addition**: If summary requires server-side computation, add:
```typescript
export async function getRecurringSummary() {
  const items = await getRecurringTransactions();
  // ... compute summary
}
```

However, current design computes client-side from existing data.
