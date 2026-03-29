# Data Model: Fix UI Consistency and Color Bugs

**Feature**: 014-fix-ui-bugs
**Date**: 2026-03-28

## Overview

This feature requires no database schema changes. All fixes are client-side UI changes using existing data structures.

## Existing Entities Referenced

### RecurringTransaction

Used in: Bug 2 (edit flow), Bug 4 (upcoming colors)

```typescript
interface RecurringTransaction {
  id: string;
  userId: string;
  amount: string;
  type: "income" | "expense";  // Used for color fallback
  description: string | null;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  lastGeneratedDate: string | null;
  categoryId: string | null;
  isActive: boolean;
}
```

**Key fields for this feature**:
- `type`: Used to determine color when category/bucket unavailable
- `categoryId`: Links to Category (may be null)

### Category

Used in: Bug 1 (chart colors), Bug 4 (upcoming colors)

```typescript
interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  type: "income" | "expense";
  allocationBucket: AllocationBucket | null;  // Key field for color
}
```

**Key fields for this feature**:
- `allocationBucket`: "needs" | "wants" | "future" | null - determines color

### AllocationBucket (Type)

```typescript
type AllocationBucket = "needs" | "wants" | "future";
```

**Color mapping** (defined in `lib/finance-utils.ts`):
- `needs`: `#8b9a7e` (green)
- `wants`: `#c97a5a` (orange/copper)
- `future`: `#a89562` (gold)

## Color Resolution Logic

### Current Behavior

```
getBucketColor(bucket: AllocationBucket | null): string
  → if null, return "#888888" (gray)
  → else return bucket color
```

### Desired Behavior

```
For charts with spending data (expenses):
  → if bucket exists, use bucket color
  → else use expense color (#e05252)

For upcoming recurring amounts:
  → if category.bucket exists, use bucket color
  → else if type is "income", use income color (#6aaa6a)
  → else use expense color (#e05252)
```

## No Schema Changes Required

All fixes operate on existing data:
- No new fields
- No migrations
- No data transformations
