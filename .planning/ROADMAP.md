# Roadmap: Date Picker Visual Bug Fix

## Overview

One focused phase: apply compact sizing props and structural corrections to the Calendar inside `transaction-sheet.tsx` so the date picker fits cleanly within the sheet on both mobile and desktop without overflowing or obscuring other elements.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Calendar Fix** - Compact the inline calendar so it fits within the sheet without overflow or overlap

## Phase Details

### Phase 1: Calendar Fix
**Goal**: The date picker calendar renders compactly and correctly inside the "New Awareness" sheet on mobile and desktop
**Depends on**: Nothing (first phase)
**Requirements**: DATE-01, DATE-02, DATE-03, SIZE-01, SIZE-02, SIZE-03
**Success Criteria** (what must be TRUE):
  1. The full calendar grid is visible inside the sheet on a mobile viewport without requiring scroll
  2. The selected date label ("April 23, 2026") appears above the calendar grid, not trapped within the day cells
  3. The "Add" submit button is fully visible and not obscured by the last row of calendar days
  4. Calendar cell size is reduced to `--cell-size: 1.75rem` and outside days are hidden (`showOutsideDays={false}`)
  5. The fix is visually verified on both mobile and desktop viewports
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Replace Popover date picker with inline toggled Calendar in transaction-sheet.tsx
- [ ] 01-02-PLAN.md — Replace Popover date picker with inline toggled Calendar in budgets-page.tsx
- [ ] 01-03-PLAN.md — Replace both Popover date pickers with inline toggled Calendars in recurring-page.tsx
- [ ] 01-04-PLAN.md — Build check and visual verification across all three surfaces

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Calendar Fix | 0/4 | Not started | - |
