# Quickstart: Budgets Page Redesign

**Feature**: `010-budgets-page-redesign`

## Files to Edit

| File | Change Type |
|------|-------------|
| `web/components/budgets-page.tsx` | Full redesign |
| `web/components/skeletons/budgets-skeleton.tsx` | Update to match new layout |

## Dev Workflow

```bash
cd web
pnpm dev
# navigate to /budgets in the browser
```

## Verification Steps

```bash
cd web
pnpm lint      # must pass with zero errors
pnpm build     # must succeed
```

## Key Imports (no new installs needed)

```ts
// Existing — already in budgets-page.tsx
import { useMemo, useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Check, X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getBucketColor, formatCurrencyCompact, calculatePercentage } from "@/lib/finance-utils";
import { PageHeader } from "@/components/page-header";
import type { AllocationBucket, BudgetWithSpending, Category } from "@/types";
```

## Design Token Reference

```css
/* Bucket accent colors */
--bucket-needs:  #8b9a7e;
--bucket-wants:  #c97a5a;
--bucket-future: #a89562;

/* Surface colors */
--card:   #211916;
--border: #3a2820;
--muted:  #2c2018;
```

## Accent Tint Formula

```ts
// 15% opacity tint (card icon circle background)
const tintBg = getBucketColor(bucket) + "26"; // e.g. "#8b9a7e26"

// 13% opacity tint (progress bar track)
const trackBg = getBucketColor(bucket) + "22"; // e.g. "#8b9a7e22"
```

## Card Left Border Pattern

```tsx
<div
  className="rounded-xl border border-border bg-card p-4"
  style={{ borderLeftWidth: "3px", borderLeftColor: getBucketColor(bucket) }}
>
```

## Progress Bar Coloring Pattern

```tsx
{/* Per-card: bucket-colored track + indicator */}
<Progress
  value={progress}
  className="h-2"
  style={{ backgroundColor: getBucketColor(bucket) + "22" }}
  indicatorStyle={{ backgroundColor: getBucketColor(bucket) }}
/>

{/* Overall summary: primary or destructive indicator */}
<Progress
  value={overallProgress}
  className="h-2"
  indicatorClassName={overallProgress >= 100 ? "bg-destructive" : "bg-primary"}
/>
```

## Inline Delete State Pattern

```ts
const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
const [deletingId, setDeletingId] = useState<string | null>(null);
const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

const confirmButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
const deleteButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
const prevConfirmingIdRef = useRef<string | null>(null);

useEffect(() => {
  if (confirmingDeleteId !== null) {
    confirmButtonRefs.current[confirmingDeleteId]?.focus();
  } else if (prevConfirmingIdRef.current !== null) {
    deleteButtonRefs.current[prevConfirmingIdRef.current]?.focus();
  }
  prevConfirmingIdRef.current = confirmingDeleteId;
}, [confirmingDeleteId]);

async function confirmDelete(budget: BudgetWithSpending) {
  setConfirmingDeleteId(null);
  setDeletingId(budget.id);
  setDeleteError(null);
  const result = await deleteBudget(budget.id);
  setDeletingId(null);
  if (!result.success) {
    setDeleteError({ id: budget.id, message: result.error });
  }
}
```

## Sheet Structure Pattern

```tsx
<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
  <SheetContent
    side="bottom"
    className="max-h-[90vh] rounded-t-3xl border border-border bg-card p-0 [&>button]:hidden"
  >
    <div className="flex max-h-[90vh] flex-col">
      {/* Sticky header */}
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <SheetTitle className="text-2xl font-bold">
            {editing ? "Edit Budget" : "New Budget"}
          </SheetTitle>
          <SheetDescription className="sr-only">...</SheetDescription>
          <button onClick={() => setSheetOpen(false)} aria-label="Close" className="...">
            <X className="h-5 w-5" />
          </button>
        </div>
      </SheetHeader>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* form fields */}
      </div>

      {/* Pinned footer */}
      <div className="border-t border-border bg-card px-6 pb-8 pt-4">
        <Button
          style={{ background: "linear-gradient(to right, #c97a5a, #a36248)" }}
          className="w-full rounded-3xl py-6 text-lg font-bold text-white"
          onClick={handleSave}
          disabled={!canSave || loading}
        >
          {loading ? "Saving…" : editing ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>
```

## No Database Migrations Required

This feature has no schema changes. `pnpm db:generate` and `pnpm db:push` are not needed.
