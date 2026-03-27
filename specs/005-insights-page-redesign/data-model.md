# Data Model: Insights Page Visual Redesign

> **Note**: This is a frontend-only redesign. No database schema changes, no new entities, and no API contracts. This document describes the existing data shapes consumed by the Insights page components.

## Existing Data Structures

### AllocationBucket

```typescript
type AllocationBucket = "needs" | "wants" | "future";
```

- One of three budget categories in the 50/30/20 model
- Each bucket has an associated color (defined in `globals.css`)
- Mapped from expense categories via `categories.allocationBucket`

### InsightsData

Returned by `getInsights()` in `lib/queries/insights.ts`:

```typescript
interface InsightsData {
  totalExpenses: number;        // Sum of all expense transactions for period
  totalIncome: number;          // Sum of all income transactions for period
  balance: number;              // totalIncome - totalExpenses
  transactionCount: number;     // Count of all transactions for period
  spendingByCategory: Array<{
    name: string;               // Category name (e.g., "Groceries")
    value: number;              // Total spending in this category
    bucket: AllocationBucket;   // Which bucket this category belongs to
  }>;
}
```

### AllocationSummary

Returned by `getAllocationSummary()` in `lib/queries/insights.ts`:

```typescript
interface AllocationSummary {
  income: number;                    // User's monthly income target from profile
  targets: Record<AllocationBucket, number>;  // Target amounts per bucket
  actual: Record<AllocationBucket, number>;   // Actual spending per bucket
}
```

### BucketData (Derived)

Computed client-side in `insights-page.tsx` for the donut chart:

```typescript
interface BucketData {
  name: AllocationBucket;    // "needs" | "wants" | "future"
  value: number;             // Actual spending in this bucket
  color: string;             // CSS color value from getBucketColor()
  target: number;            // Target amount for this bucket
}
```

## Color Mapping

Defined in `lib/finance-utils.ts` and `globals.css`:

```typescript
// From getBucketColor() in finance-utils.ts
const BUCKET_COLORS: Record<AllocationBucket, string> = {
  needs: "var(--bucket-needs)",   // #8b9a7e (sage green)
  wants: "var(--bucket-wants)",   // #c4714a (terracotta)
  future: "var(--bucket-future)", // #a89562 (olive gold)
};
```

## Calculated Values

### Compliance Score

Computed in `insights-page.tsx`:

```typescript
// Formula: 100 - (totalVariance / targetTotal) * 100
// Where variance = |actual - target| for each bucket
const complianceScore = Math.max(0, Math.round(
  100 - (totalVariance / targetTotal) * 100
));
```

### Variance

Computed per bucket in `insights-page.tsx`:

```typescript
// Positive = under budget, Negative = over budget
const variance = actual - target;
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Server Component                         │
│  app/(app)/insights/page.tsx                                 │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │ getInsights()       │    │ getAllocationSummary()      │ │
│  │ lib/queries/        │    │ lib/queries/                │ │
│  │ insights.ts         │    │ insights.ts                 │ │
│  └──────────┬──────────┘    └──────────────┬──────────────┘ │
│             │                               │                │
│             └───────────────┬───────────────┘                │
│                             ▼                                │
│                <InsightsPage insights={} allocation={} />    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Client Component                         │
│  components/insights-page.tsx                                │
│                                                              │
│  - useMemo: derive bucketData from allocation                │
│  - useMemo: calculate complianceScore                        │
│  - Render: PieChart, BarChart, Cards                        │
└─────────────────────────────────────────────────────────────┘
```

## No Changes Required

All data structures remain unchanged. The redesign focuses solely on:
- Visual presentation of existing data
- Layout and typography improvements
- Animation and interaction enhancements
- Loading state refinements
