# Quickstart: Mobile Navigation Access

**Feature**: 012-mobile-nav-access
**Date**: 2026-03-28

## Overview

This feature modifies the mobile bottom navigation to include Budgets as a primary item and adds a "More" overflow sheet for accessing Stats, Categories, Recurring, and Profile.

## Changes Summary

| File | Change |
|------|--------|
| `components/bottom-nav.tsx` | Modify nav items: add Budgets, replace Stats/Profile with "More" trigger |
| `components/overflow-sheet.tsx` | New component: bottom sheet with Stats, Categories, Recurring, Profile links |

## Implementation Steps

1. **Create `overflow-sheet.tsx`**:
   - Use existing Sheet component from shadcn/ui
   - List overflow navigation items: Stats, Categories, Recurring, Profile
   - Highlight active item using `usePathname()`
   - Close sheet on item selection

2. **Modify `bottom-nav.tsx`**:
   - Add Budgets to `RIGHT_ITEMS` array (left side unchanged: Home, Activity)
   - Replace Stats and Profile in `RIGHT_ITEMS` with Budgets and More trigger
   - Add state for overflow sheet open/close
   - Import and render `OverflowSheet`

## Final Layout

```
[Home] [Activity]    [FAB]    [Budgets] [More]
   L       L        CENTER       R         R
```

## Testing

```bash
# From web directory
pnpm lint
pnpm build

# Manual testing
pnpm dev
# Open on mobile viewport (375px)
# Verify bottom nav shows: Home, Activity, Budgets, FAB, More
# Tap More → verify sheet shows: Stats, Categories, Recurring, Profile
# Navigate to each item → verify active state and sheet closes
```

## No Migration Required

No database schema changes, no environment variables, no new dependencies.
