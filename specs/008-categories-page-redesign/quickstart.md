# Quickstart: Categories Page Redesign

**Feature**: `008-categories-page-redesign`

## Files to Edit

| File | Change Type |
|------|-------------|
| `web/components/categories-page.tsx` | Full redesign |
| `web/components/skeletons/categories-skeleton.tsx` | Add pill skeletons |

## Dev Workflow

```bash
cd web
pnpm dev          # start dev server at localhost:3000
# navigate to /categories in the browser
```

## Verification Steps

```bash
cd web
pnpm lint         # must pass with zero errors
pnpm build        # must succeed
```

## Key Imports Available (no new installs needed)

```ts
// Color utilities — already in lib/finance-utils.ts
import { getBucketColor, BUCKET_DEFINITIONS, BUCKET_ORDER } from "@/lib/finance-utils";

// UI primitives — already installed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Icons already in use
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
```

## Design Token Reference

```css
/* Bucket colors (from globals.css) */
--bucket-needs:  #8b9a7e;
--bucket-wants:  #c4714a;
--bucket-future: #a89562;
--income:        #7aaa7a;

/* Card/surface colors */
--card:   #211916;
--border: #3a2820;
--muted:  #2c2018;
```

## Emoji Circle Tint Formula

```ts
// 15% opacity tint: append "26" to 6-digit hex color
const accentColor = getBucketColor(category.allocationBucket); // e.g. "#8b9a7e"
const tintBg = accentColor + "26"; // "#8b9a7e26"
```

## Inline Delete State Pattern

```ts
const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
const [deletingId, setDeletingId] = useState<string | null>(null);
const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

async function handleDelete(category: Category) {
  setConfirmingDeleteId(null);
  setDeletingId(category.id);
  setDeleteError(null);
  const result = await deleteCategory(category.id);
  setDeletingId(null);
  if (!result.success) {
    setDeleteError({ id: category.id, message: result.error });
    return;
  }
  router.refresh();
}
```
