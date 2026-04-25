# Intent Expense Tracker — Date Picker Visual Bug Fix

## What This Is

Intent Expense Tracker is a personal finance app (intent.luisibarra.dev) that lets users log expenses and income as "awareness" entries. The app is built with Next.js App Router, shadcn/ui, Radix UI, and Tailwind CSS 4.x. This work fixed a visual bug in the date picker component inside the "New Awareness" transaction sheet — and extended the same fix across all three date-picker surfaces (transaction sheet, budgets, recurring transactions).

## Core Value

The date picker must fit cleanly within the sheet's available vertical space so users can see and interact with the full calendar without layout overlap or truncation.

## Current State

**v1.0 shipped 2026-04-24.** All three date-picker surfaces fixed:
- `transaction-sheet.tsx` — inline Calendar toggle, no Popover portal
- `budgets-page.tsx` — same fix for budget start date
- `recurring-page.tsx` — two independent inline Calendars; end date uses `disabled={{ before }}` (react-day-picker v9 correct API)

Tech: Next.js 16, React 19, shadcn/ui Calendar (react-day-picker v9.14.0), Tailwind CSS 4.x.

## Requirements

### Validated

- ✓ **DATE-01**: Calendar fits compactly inside the sheet without overflowing or overlapping — v1.0
- ✓ **DATE-02**: Selected date label above the grid, not trapped in day cells — v1.0
- ✓ **DATE-03**: "Add" button never obscured by the last calendar row — v1.0
- ✓ **SIZE-01**: `--cell-size: 1.75rem` applied (down from 2.25rem) — v1.0
- ✓ **SIZE-02**: Inter-row gap reduced (`mt-1`, `gap-2`) — v1.0
- ✓ **SIZE-03**: `showOutsideDays={false}` prevents 6-row months — v1.0

### Active

*(None — all v1.0 requirements validated)*

### Out of Scope

- Calendar popover / overlay approach — user wants compact inline calendar
- New calendar library — must use existing shadcn/ui Calendar (react-day-picker v9)
- Layout fixes for other sheet elements — only date picker was broken
- Date range selection — not requested
- Week or month picker view — not requested

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Compact inline calendar (not popover) | User prefers calendar stays inline, just smaller | ✓ Implemented — Popover portal removed from all three surfaces |
| Toggle pattern: `onClick={() => setState((v) => !v)}` | Simplest stateful toggle without Radix dependency | ✓ Consistent across all three files |
| `classNames={{ root: "w-full" }}` + `className="... w-full"` both required | react-day-picker v9 needs both props for full-width layout | ✓ Applied — single prop alone has no effect |
| `disabled={{ before: parseISO(startDate) }}` for end date restriction | `fromDate` removed at runtime in react-day-picker v9 (types still accept it but silently ignored) | ✓ Correct API used — caught by code review |

## Constraints

- **Tech Stack**: Must use existing shadcn/ui Calendar + Tailwind CSS — no new calendar library
- **Design**: Match existing dark-mode design language and brand colors (orange accent)
- **Scope**: Fix only the calendar layout; do not refactor unrelated sheet components

---
*Last updated: 2026-04-24 after v1.0 milestone*
