# Data Model: Mobile Navigation Access

**Feature**: 012-mobile-nav-access
**Date**: 2026-03-28

## Summary

This feature requires no data model changes. The navigation structure is hardcoded in components and does not persist any user data.

## Entities

### Navigation Item (UI-only, not persisted)

| Field | Type | Description |
|-------|------|-------------|
| href | string | Route path (e.g., "/budgets") |
| label | string | Display label (e.g., "Budgets") |
| icon | LucideIcon | Icon component from lucide-react |
| category | "primary" \| "overflow" | Whether shown in bottom nav or overflow sheet |

## No Database Changes Required

All navigation items are defined in component code. The existing `side-nav.tsx` already defines navigation items; these will inform the `overflow-sheet.tsx` and modified `bottom-nav.tsx`.

## Relationships

None. Navigation items are independent UI elements.
