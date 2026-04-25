# Requirements: Date Picker Visual Bug Fix

**Defined:** 2026-04-23
**Core Value:** The date picker must fit cleanly within the sheet's available vertical space so users can see and interact with the full calendar without layout overlap or truncation.

## v1 Requirements

### Date Picker Layout

- [x] **DATE-01**: Calendar fits compactly inside the "New Awareness" sheet without overflowing or overlapping other elements (mobile and desktop)
- [x] **DATE-02**: Selected date label does not render trapped inside the calendar day grid
- [x] **DATE-03**: "Add" / submit button is never obscured by the calendar's last row of days

### Calendar Sizing

- [x] **SIZE-01**: Calendar cell size uses `--cell-size: 1.75rem` (down from 2.25rem) so the grid fits within the sheet's available height
- [x] **SIZE-02**: Calendar inter-row gap is reduced (`mt-1` on week rows, `gap-2` on month wrapper) to reclaim ~52px of vertical space
- [x] **SIZE-03**: `showOutsideDays={false}` is set to prevent 6-row months on calendars like April 2026

## v2 Requirements

*(None — this is a scoped bug fix)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Calendar popover / overlay approach | User explicitly wants compact inline calendar |
| New calendar library | Must use existing shadcn/ui Calendar (react-day-picker v9) |
| Layout fixes for other sheet elements | Only the date picker is broken |
| Date range selection | Not requested |
| Week or month picker view | Not requested |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATE-01 | Phase 1 | Complete ✓ |
| DATE-02 | Phase 1 | Complete ✓ |
| DATE-03 | Phase 1 | Complete ✓ |
| SIZE-01 | Phase 1 | Complete ✓ |
| SIZE-02 | Phase 1 | Complete ✓ |
| SIZE-03 | Phase 1 | Complete ✓ |

**Coverage:**
- v1 requirements: 6 total
- Completed: 6 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-24 — all v1 requirements completed in Phase 1*
