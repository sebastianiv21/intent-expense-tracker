# Quickstart: Fix UI Consistency and Color Bugs

**Feature**: 014-fix-ui-bugs
**Date**: 2026-03-28

## Prerequisites

- Checkout branch: `git checkout 014-fix-ui-bugs`
- Install dependencies: `pnpm install` (in `web/` directory)
- Ensure dev server works: `pnpm dev`

## Implementation Order

Follow this order for minimal conflicts:

### 1. Fix Wants Bucket Icon (Simplest)

**File**: `web/components/insights-page.tsx`

1. Update import (line ~7):
   ```typescript
   // Before
   import { Home, Heart, PiggyBank, type LucideIcon } from "lucide-react";
   
   // After
   import { Home, Coffee, PiggyBank, type LucideIcon } from "lucide-react";
   ```

2. Update BUCKET_ICONS (line ~44):
   ```typescript
   // Before
   const BUCKET_ICONS: Record<AllocationBucket, LucideIcon> = {
     needs: Home,
     wants: Heart,
     future: PiggyBank,
   };
   
   // After
   const BUCKET_ICONS: Record<AllocationBucket, LucideIcon> = {
     needs: Home,
     wants: Coffee,
     future: PiggyBank,
   };
   ```

### 2. Fix Upcoming Recurring Colors

**File**: `web/app/(app)/page.tsx`

1. Import `getTransactionColor` from finance-utils (add to existing import):
   ```typescript
   import { getBucketColor, formatCurrencyCompact, getTransactionColor } from "@/lib/finance-utils";
   ```

2. Update upcoming recurring amount color (in the upcoming recurring map):
   ```typescript
   // Before
   <div className="text-right text-sm font-semibold" 
        style={{ color: getBucketColor(recurring.category?.allocationBucket ?? null) }}>
   
   // After
   <div 
     className="text-right text-sm font-semibold" 
     style={{ 
       color: recurring.category?.allocationBucket 
         ? getBucketColor(recurring.category.allocationBucket) 
         : getTransactionColor(recurring.type) 
     }}
   >
   ```

### 3. Fix Chart Colors

**File**: `web/components/insights-page.tsx`

For the spending by category bar chart:

1. The bar chart cells need a fallback color. Update the Cell rendering:
   ```typescript
   // Before
   {insights.spendingByCategory.map((entry, index) => (
     <Cell key={`cell-${index}`} fill={getBucketColor(entry.bucket)} />
   ))}
   
   // After
   {insights.spendingByCategory.map((entry, index) => (
     <Cell 
       key={`cell-${index}`} 
       fill={entry.bucket ? getBucketColor(entry.bucket) : getTransactionColor('expense')} 
     />
   ))}
   ```

2. Import `getTransactionColor` if not already imported.

### 4. Verify Recurring Edit Flow

**Files**: `web/components/recurring-page.tsx`, `web/lib/actions/recurring.ts`

The code appears correct. Verify by testing:

1. Create a recurring transaction
2. Click "Edit" on the transaction
3. Modify amount or frequency
4. Save
5. Verify no duplicate was created

If bug persists, debug by:
1. Adding console.log in `handleSave` to verify `editing` state
2. Checking if `editing.id` is populated
3. Verifying `updateRecurring` is called (not `createRecurring`)

## Verification

After all fixes, run:

```bash
pnpm lint
pnpm build
```

Both must pass before committing.

## Manual Testing Checklist

- [ ] Insights page pie chart shows bucket colors (not gray)
- [ ] Insights page bar chart shows bucket colors or expense red (not gray)
- [ ] Insights page wants bucket shows Coffee icon (not Heart)
- [ ] Dashboard upcoming recurring shows green for income, red/orange for expenses
- [ ] Editing a recurring transaction updates existing record (no duplicate)
- [ ] Transaction sheet, categories, budgets, recurring pages show Coffee for wants (already correct)
- [ ] No gray (#888888) appears for any financial data with known transaction type or bucket (FR-009)
