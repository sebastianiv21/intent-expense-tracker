# Intent Expense Tracker — Date Picker Visual Bug Fix

## What This Is

Intent Expense Tracker is a personal finance app (intent.luisibarra.dev) that lets users log expenses and income as "awareness" entries. The app is built with Next.js App Router, shadcn/ui, Radix UI, and Tailwind CSS 4.x. This work targets a visual bug in the date picker component inside the "New Awareness" transaction sheet.

## Core Value

The date picker must fit cleanly within the sheet's available vertical space so users can see and interact with the full calendar without layout overlap or truncation.

## Requirements

### Validated

- ✓ Expense/income entry via "New Awareness" sheet — existing
- ✓ Date selection with calendar inline in sheet — existing
- ✓ Expense/Income toggle, category selection — existing
- ✓ Currency + amount input — existing
- ✓ Mobile-first responsive layout — existing

### Active

- [ ] **DATE-01**: Date picker calendar fits compactly in the sheet without overflowing or overlapping other elements (mobile and desktop)
- [ ] **DATE-02**: Selected date row does not render inside the calendar grid rows
- [ ] **DATE-03**: "Add" / submit button is never obscured by the calendar's last row of days

### Out of Scope

- New features for the date picker (e.g., range selection, week picker) — not requested
- Layout fixes for other form elements in the sheet — only date picker is broken
- Calendar popover/overlay approach — user wants compact inline calendar

## Context

- The "New Awareness" sheet renders inline on both mobile and desktop
- On mobile (screenshots), the calendar grid takes too much vertical space, causing:
  1. The "April 23, 2026" selected-date row to appear trapped mid-grid
  2. The last calendar row to overlap the "Add" button
- On desktop the same overflow/overlap issue occurs
- Stack: Next.js 16 + React 19, shadcn/ui Calendar (Radix UI DayPicker), Tailwind CSS 4.x
- Codebase map: `.planning/codebase/`

## Constraints

- **Tech Stack**: Must use existing shadcn/ui Calendar + Tailwind CSS — no new calendar library
- **Design**: Match existing dark-mode design language and brand colors (orange accent)
- **Scope**: Fix only the calendar layout; do not refactor unrelated sheet components

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Compact inline calendar (not popover) | User prefers calendar stays inline, just smaller | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-23 after initialization*
