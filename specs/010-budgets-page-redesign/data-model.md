# Data Model: Budgets Page Redesign

No schema changes. No new server actions or queries. This document maps existing types to their UI responsibilities.

## Types in Use

All types are defined in `web/types/index.ts` and are unchanged.

### `BudgetWithSpending`

```ts
type BudgetWithSpending = {
  id: string;
  userId: string;
  categoryId: string;
  amount: string;          // decimal string from DB (cast to Number() for math)
  period: "monthly" | "weekly";
  startDate: string;       // "YYYY-MM-DD"
  createdAt: Date;
  category: Category;      // joined
  spent: number;           // computed by getBudgetsWithSpending query
};
```

**UI usage**: Each budget card renders one `BudgetWithSpending`. `amount` is cast with `Number()`. `spent` is used directly. `category.allocationBucket` determines the bucket grouping and accent color. `category.icon` is the emoji (fallback `"•"`).

---

### `Category`

```ts
type Category = {
  id: string;
  userId: string;
  name: string;
  type: "expense" | "income";
  allocationBucket: AllocationBucket | null;
  icon: string | null;
  createdAt: Date;
};
```

**UI usage**: `expenseCategories` (filtered `type === "expense"`) populates the category `<Select>` in the budget form sheet.

---

### `AllocationBucket`

```ts
type AllocationBucket = "needs" | "wants" | "future";
```

**UI usage**: Drives bucket grouping order, accent colors via `getBucketColor()`, and section headings. Render order is `["needs", "wants", "future"]` (matches `BUCKET_ORDER` from `finance-utils.ts`).

---

### `BudgetFormState` (local component state — unchanged)

```ts
type BudgetFormState = {
  categoryId: string;
  amount: string;
  period: "monthly" | "weekly";
  startDate: string;
};
```

---

## Derived Values (UI computation)

| Value | Formula | Guard |
|-------|---------|-------|
| `progress` (per card) | `calculatePercentage(spent, Number(amount))` | `total === 0 → 0` (handled in utility) |
| `overspent` (per card) | `spent > Number(amount)` | — |
| `totalBudgeted` (summary) | `budgets.reduce((s, b) => s + Number(b.amount), 0)` | — |
| `totalSpent` (summary) | `budgets.reduce((s, b) => s + b.spent, 0)` | — |
| `remaining` (summary) | `totalBudgeted - totalSpent` | Negative → destructive color |
| `overallProgress` | `calculatePercentage(totalSpent, totalBudgeted)` | `totalBudgeted === 0 → 0` |

---

## Utility Functions Used

| Function | Source | Purpose |
|----------|--------|---------|
| `getBucketColor(bucket)` | `lib/finance-utils.ts` | Accent color per bucket |
| `formatCurrencyCompact(n)` | `lib/finance-utils.ts` | Display amounts |
| `calculatePercentage(v, t)` | `lib/finance-utils.ts` | Progress bar value (0–100, capped) |
| `format(date, pattern)` | `date-fns` | Month label display |
| `addMonths` / `subMonths` | `date-fns` | Month navigation |

---

## No Contracts

This feature exposes no new external interfaces (no new API routes, no new Server Actions, no new query functions). The `/contracts/` directory is not created.
