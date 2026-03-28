# Research: Recurring Page Redesign

**Feature**: 011-recurring-page-redesign
**Date**: 2026-03-28

## Overview

This feature is a frontend UI redesign with no technical unknowns. The design patterns are explicitly defined by referencing existing pages (Budgets and Categories) in the specification. All implementation decisions are derived from established patterns in the codebase.

## Design Pattern Reference

### Summary Card
**Source**: `web/components/budgets-page.tsx` - Month header section
- Rounded border card with totals grid (3 columns on desktop)
- Progress bar with percentage-based fill
- Previous/Next month navigation (adapted to summary context)

**Decision**: Adapt the month header pattern for recurring summary. Show total income, total expenses, and net recurring amount. Use progress bar to show ratio of income to expenses or spending against recurring budget.

### Card Design with Border Accent
**Source**: `web/components/budgets-page.tsx` and `web/components/categories-page.tsx`
- `borderLeftWidth: "3px"` with `borderLeftColor` set to accent color
- Icon in circular background: `backgroundColor: color + "26"` (26 = 15% opacity in hex)
- Color derived from `getBucketColor()` for budgets/categories

**Decision**: Use `getTransactionColor()` from `finance-utils.ts` to get income (green #7aaa7a) or expense (red #e05252) colors for the border accent and icon backgrounds.

### Inline Delete Confirmation
**Source**: `web/components/budgets-page.tsx` - Delete flow with `confirmingDeleteId` state
- Dropdown menu triggers delete with `triggerDelete()` function
- Inline Check/X buttons appear with confirmation message
- Focus management via `useRef` and `useEffect`

**Decision**: Replicate exact pattern from budgets-page.tsx:
- `confirmingDeleteId` state for tracking which item is confirming
- `confirmButtonRefs` and `deleteButtonRefs` for focus management
- Check button calls `confirmDelete()`, X button calls `setConfirmingDeleteId(null)`

### Bottom Sheet Design
**Source**: `web/components/budgets-page.tsx` and `web/components/categories-page.tsx`
- `SheetContent` with `side="bottom"`, `rounded-t-3xl`, no default close button
- Header with large title (`text-2xl font-bold`) and custom close button
- Amount input with `$` prefix, radial gradient background, font scaling
- Animated toggle with sliding indicator (`transition-all duration-200`)
- Horizontal scrolling chips with gradient fade edge
- Large gradient save button at bottom

**Decision**: Follow exact structure from budgets/categories sheets:
- Amount section with radial gradient: `background: "radial-gradient(ellipse at 50% 100%, #c97a5a18 0%, transparent 70%)"`
- Type toggle with sliding indicator: `left` position calculated based on selection
- Category chips filtered by type with horizontal scroll
- Save button with gradient: `background: "linear-gradient(to right, #c97a5a, #a36248)"`

### Empty States
**Source**: `web/components/budgets-page.tsx` and `web/components/categories-page.tsx`
- Centered content with emoji icon (`text-4xl`)
- Bold title (`font-semibold text-foreground`)
- Description (`text-sm text-muted-foreground`)
- Action button with icon

**Decision**: Create empty state for Active tab (encourage adding first recurring) and Paused tab (indicate no paused items).

## Color References

From `web/app/globals.css`:
- `--income: #7aaa7a` (green)
- `--expense: #e05252` (red)
- `--primary: #c4714a` (terracotta - for accents)
- `--bucket-needs: #8b9a7e`, `--bucket-wants: #c4714a`, `--bucket-future: #a89562`

From `web/lib/finance-utils.ts`:
- `getTransactionColor(type)`: returns income or expense color

## No NEEDS CLARIFICATION Items

All technical decisions are resolved by referencing existing code. The spec is complete and actionable.
