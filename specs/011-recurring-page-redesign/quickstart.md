# Quickstart: Recurring Page Redesign

**Feature**: 011-recurring-page-redesign
**Date**: 2026-03-28

## Prerequisites

- Node.js 24+
- pnpm installed globally
- PostgreSQL database (Neon Serverless)

## Setup

```bash
cd web
pnpm install
pnpm db:push  # Ensure schema is synced
pnpm dev      # Start development server
```

## Key Files

| File | Purpose |
|------|---------|
| `components/recurring-page.tsx` | Main component to redesign |
| `components/skeletons/recurring-skeleton.tsx` | Loading skeleton |
| `lib/finance-utils.ts` | Color utilities (getTransactionColor) |
| `lib/actions/recurring.ts` | Server Actions (no changes needed) |
| `lib/queries/recurring.ts` | Data fetching (no changes needed) |

## Design Pattern Reference

Match these existing components:

1. **Summary Card**: See `components/budgets-page.tsx` month header section
2. **Card Border Accent**: See `components/budgets-page.tsx` budget cards or `components/categories-page.tsx` category cards
3. **Inline Delete**: See `components/budgets-page.tsx` delete flow with `confirmingDeleteId` state
4. **Bottom Sheet**: See `components/budgets-page.tsx` or `components/categories-page.tsx` create/edit sheet
5. **Empty States**: See `components/budgets-page.tsx` empty state sections

## Color Utilities

```typescript
import { getTransactionColor } from "@/lib/finance-utils";

// Usage:
const color = getTransactionColor("income");  // #7aaa7a (green)
const color = getTransactionColor("expense"); // #e05252 (red)
```

## Implementation Order

1. Summary Card (top of page)
2. Card Redesign (3px border, icon backgrounds)
3. Inline Delete Confirmation
4. Create/Edit Sheet Redesign
5. Empty States
6. Polish & Testing

## Verification

```bash
pnpm lint    # Must pass
pnpm build   # Must succeed
```

## Touch Target Requirements

- Interactive elements: Minimum 44x44px
- Dense grid exception: 40x40px with 4px gap (emoji pickers only)
