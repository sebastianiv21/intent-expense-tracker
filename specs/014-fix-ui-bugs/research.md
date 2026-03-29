# Research: Fix UI Consistency and Color Bugs

**Feature**: 014-fix-ui-bugs
**Date**: 2026-03-28

## Bug 1: Chart Colors Display Gray Instead of Bucket Colors

### Root Cause Analysis

**File**: `web/components/insights-page.tsx`

The pie chart (compliance chart) and bar chart (spending by category) use `getBucketColor()` from `finance-utils.ts`. The function returns `#888888` (gray) when `bucket` is `null`:

```typescript
export function getBucketColor(bucket: AllocationBucket | null): string {
  if (!bucket) return "#888888";
  return BUCKET_DEFINITIONS[bucket].color;
}
```

In `insights-page.tsx`, the bar chart calls:
```typescript
<Cell key={`cell-${index}`} fill={getBucketColor(entry.bucket)} />
```

When `entry.bucket` is null (category has no bucket assignment), the chart renders gray.

### Solution

**Decision**: Use transaction type color as fallback when bucket is null.

For the spending by category bar chart, derive fallback from transaction type. Since spending data is expenses, use the expense color (`#e05252`) or derive from the category's type if available.

**Implementation**:
- Modify chart rendering to check for null bucket and apply `getTransactionColor('expense')` as fallback
- Alternatively, pass a `fallbackColor` prop to chart cells

**Rationale**: The spending chart shows expenses only. Using expense red as fallback is semantically correct. Pie chart already uses bucket colors correctly for the compliance chart since data is aggregated by bucket.

---

## Bug 2: Editing Recurring Transaction Creates New Record

### Root Cause Analysis

**File**: `web/components/recurring-page.tsx`

The `handleSave` function correctly checks `editing` state:
```typescript
const result = editing
  ? await updateRecurring(editing.id, payload)
  : await createRecurring(payload);
```

**File**: `web/lib/actions/recurring.ts`

The `updateRecurring` action exists and updates the record:
```typescript
const result = await db
  .update(recurringTransactions)
  .set(updateValues)
  .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
  .returning();
```

### Investigation Needed

The logic appears correct. Need to verify:
1. Is `editing` state being set correctly when "Edit" is clicked?
2. Is `editing.id` populated correctly?

**File**: `web/components/recurring-page.tsx`, function `openEdit`:
```typescript
function openEdit(item: RecurringTransactionWithCategory) {
  setConfirmingDeleteId(null);
  setEditing(item);
  // ... sets form state
}
```

`editing` is set to the full `item` object. `editing.id` should be available.

### Solution

**Decision**: Verify the actual bug behavior through testing. If bug exists, check if:
1. `editing` state is being reset before `handleSave` is called
2. Form submission is triggering a re-render that clears `editing`

**Rationale**: The code path appears correct. Need to trace the actual execution flow during edit-save operation.

---

## Bug 3: Inconsistent Wants Bucket Icon (Heart vs Coffee)

### Root Cause Analysis

**Files with Coffee (correct)**:
- `web/components/transaction-sheet.tsx`: `Icon: Coffee`
- `web/components/categories-page.tsx`: `Icon: Coffee`
- `web/components/budgets-page.tsx`: `Icon: Coffee`
- `web/components/recurring-page.tsx`: `Icon: Coffee`

**Files with Heart (incorrect)**:
- `web/components/insights-page.tsx`:
  ```typescript
  import { Home, Heart, PiggyBank, type LucideIcon } from "lucide-react";
  const BUCKET_ICONS: Record<AllocationBucket, LucideIcon> = {
    needs: Home,
    wants: Heart,  // Should be Coffee
    future: PiggyBank,
  };
  ```

### Solution

**Decision**: Replace `Heart` with `Coffee` in `insights-page.tsx`.

**Implementation**:
1. Update import: `import { Home, Coffee, PiggyBank, ... } from "lucide-react"`
2. Update `BUCKET_ICONS.wants = Coffee`

**Rationale**: The project uses Coffee for wants bucket across all other components. Heart is an inconsistency. Coffee represents discretionary spending (coffee, treats) which aligns with the wants category concept.

---

## Bug 4: Upcoming Recurring Colors Show Gray

### Root Cause Analysis

**File**: `web/app/(app)/page.tsx` (dashboard)

The upcoming recurring section:
```typescript
<div className="text-right text-sm font-semibold" 
     style={{ color: getBucketColor(recurring.category?.allocationBucket ?? null) }}>
  {formatCurrencyCompact(recurring.amount)}
</div>
```

When `recurring.category` is null or `allocationBucket` is null, `getBucketColor(null)` returns `#888888`.

### Solution

**Decision**: Use transaction type color as fallback when bucket unavailable.

**Implementation**:
```typescript
const color = recurring.category?.allocationBucket
  ? getBucketColor(recurring.category.allocationBucket)
  : getTransactionColor(recurring.type);
```

**Rationale**: The `recurring` object has a `type` field ("income" or "expense"). Using transaction type color provides meaningful visual distinction (green for income, red for expense) when bucket is unavailable.

---

## Summary of Findings

| Bug | Root Cause | Solution |
|-----|------------|----------|
| Chart colors | `getBucketColor(null)` returns gray | Use transaction type color as fallback |
| Recurring edit | Code appears correct, needs verification | Trace execution flow during edit |
| Wants icon | `Heart` used in insights-page.tsx | Replace with `Coffee` |
| Upcoming colors | `getBucketColor(null)` returns gray | Use `getTransactionColor(type)` as fallback |

## Alternatives Considered

1. **Add default bucket to uncategorized categories**: Rejected - requires data migration and forces categorization decisions that users may not want to make.

2. **Use random colors for uncategorized**: Rejected - inconsistent and confusing UX.

3. **Hide uncategorized items from charts**: Rejected - hides data that users may want to see.

4. **Keep Heart icon**: Rejected - inconsistent with 4 other components that use Coffee.
