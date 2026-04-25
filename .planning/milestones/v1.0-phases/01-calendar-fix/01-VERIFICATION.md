---
phase: 01-calendar-fix
verified: 2026-04-24T20:00:00Z
status: passed
score: 11/11 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 10/11
  gaps_closed:
    - "End date Calendar respects fromDate (cannot select a date before start date)"
  gaps_remaining: []
  regressions: []
---

# Phase 1: Calendar Fix — Verification Report

**Phase Goal:** Fix the date picker visual bug so the calendar renders inline within the sheet without overflow or overlap
**Verified:** 2026-04-24T20:00:00Z
**Status:** passed
**Re-verification:** Yes — gap CR-01 (`fromDate` deprecated prop) closed by commit a1cd5ee

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tapping the date trigger in the New Awareness sheet opens the calendar inline (no overlay, no portal) | VERIFIED | Zero Popover/PopoverContent/PopoverTrigger matches in transaction-sheet.tsx; inline Calendar rendered conditionally via `{datePickerOpen && <Calendar .../>}` at line 453 — no regression |
| 2 | Tapping the trigger again while calendar is open closes it | VERIFIED | Toggle lambda `onClick={() => setDatePickerOpen((v) => !v)}` confirmed at transaction-sheet.tsx:442, budgets-page.tsx:735, recurring-page.tsx:839 and 884 — no regression |
| 3 | Selecting a date closes the calendar and shows the date in the trigger as "Month D, YYYY" | VERIFIED | `setDatePickerOpen(false)` in onSelect confirmed across all four Calendar instances; format string "MMMM d, yyyy" confirmed at transaction-sheet.tsx:447, budgets-page.tsx:740, recurring-page.tsx:844 and 889 — no regression |
| 4 | The full calendar grid is visible without needing to scroll inside the sheet on a 375px viewport | VERIFIED | Human approved 2026-04-24 (01-04-SUMMARY.md). `[--cell-size:1.75rem]` and `showOutsideDays={false}` confirmed across all files — no regression |
| 5 | The "Add" submit button in the pinned footer is never obscured by the calendar | VERIFIED | Human approved 2026-04-24 (01-04-SUMMARY.md) — "Add button never obscured by the calendar on mobile viewport" |
| 6 | No Popover, PopoverTrigger, or PopoverContent wrappers remain in transaction-sheet.tsx | VERIFIED | grep confirms zero matches — no regression |
| 7 | Tapping the date trigger in the budget creation form opens the calendar inline (no overlay) | VERIFIED | Zero Popover matches in budgets-page.tsx; toggle lambda at line 735 confirmed — no regression |
| 8 | No Popover wrappers remain in budgets-page.tsx | VERIFIED | grep confirms zero matches — no regression |
| 9 | Calendar cell size is 1.75rem and outside days are hidden in all three files | VERIFIED | `[--cell-size:1.75rem]`: 1 match transaction-sheet, 1 match budgets-page, 2 matches recurring-page. `showOutsideDays={false}`: same counts — no regression |
| 10 | Both start and end date triggers in recurring-page toggle their independent calendars closed on re-click | VERIFIED | `setDatePickerOpen((v) => !v)` at recurring-page:839; `setEndDatePickerOpen((v) => !v)` at recurring-page:884 — no regression |
| 11 | End date Calendar respects date restriction (cannot select a date before start date) | VERIFIED | GAP CLOSED. Commit a1cd5ee replaced `fromDate={parseISO(formState.startDate)}` with `disabled={ formState.startDate ? { before: parseISO(formState.startDate) } : undefined }` at recurring-page.tsx:905-909. No `fromDate=` prop remains in any file. This is the v9-correct API that disables individual cells before the start date. |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/components/transaction-sheet.tsx` | Inline toggled Calendar; toggle lambda; `[--cell-size:1.75rem]` | VERIFIED | Zero Popover refs, toggle lambda at :442, cell-size at :463, classNames root/month/week, showOutsideDays at :469 — no regression |
| `web/components/budgets-page.tsx` | Inline toggled Calendar; toggle lambda; `[--cell-size:1.75rem]` | VERIFIED | Zero Popover refs, toggle lambda at :735, cell-size at :763, classNames at :764-767, showOutsideDays at :769 — no regression |
| `web/components/recurring-page.tsx` (start date) | Inline toggled Calendar for start date | VERIFIED | Toggle lambda at :839, cell-size at :867, classNames at :868-871, showOutsideDays at :873 — no regression |
| `web/components/recurring-page.tsx` (end date) | Inline toggled Calendar with working end-date restriction | VERIFIED | Toggle lambda at :884; `disabled={ { before: parseISO(formState.startDate) } }` at :905-909 — gap closed, v9 API correctly used |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| trigger Button onClick (transaction-sheet) | setDatePickerOpen | toggle lambda | WIRED | Confirmed at :442 — no regression |
| Calendar onSelect (transaction-sheet) | setDatePickerOpen(false) | onSelect callback | WIRED | Confirmed at :460 — no regression |
| trigger Button onClick (budgets-page) | setDatePickerOpen | toggle lambda | WIRED | Confirmed at :735 — no regression |
| Calendar onSelect (budgets-page) | setDatePickerOpen(false) | onSelect callback | WIRED | Confirmed at :760 — no regression |
| start date trigger Button onClick (recurring-page) | setDatePickerOpen | toggle lambda | WIRED | Confirmed at :839 — no regression |
| end date trigger Button onClick (recurring-page) | setEndDatePickerOpen | toggle lambda | WIRED | Confirmed at :884 — no regression |
| end date Calendar | formState.startDate | disabled prop (before restriction) | WIRED | `disabled={ formState.startDate ? { before: parseISO(formState.startDate) } : undefined }` at :905-909 — correct react-day-picker v9 API, gap closed |

### Data-Flow Trace (Level 4)

Not applicable — this phase modifies UI layout and interaction behavior, not data fetching or rendering pipelines. Date values flow Calendar onSelect → form state → trigger label display, all verified in key links above.

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Zero Popover refs in all three files | grep Popover in transaction-sheet, budgets-page, recurring-page | 0 matches each | PASS |
| Cell-size prop counts | grep --cell-size:1.75rem | 1, 1, 2 | PASS |
| showOutsideDays counts | grep showOutsideDays={false} | 1, 1, 2 | PASS |
| fromDate prop removed (gap closed) | grep fromDate= recurring-page.tsx | 0 matches | PASS — prop removed |
| disabled={{ before: }} applied | grep "disabled=" recurring-page.tsx at line 905 | Match at :905 | PASS — v9 API in place |
| Commit a1cd5ee exists and targets correct file | git show a1cd5ee --stat | recurring-page.tsx 4 ++-- 2 -- | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DATE-01 | 01-01, 01-02, 01-03, 01-04 | Calendar fits compactly inside sheet without overflowing or overlapping (mobile and desktop) | SATISFIED | Inline Calendar pattern applied to all three components; Popover portal removed; human visual approval 2026-04-24 |
| DATE-02 | 01-01, 01-02, 01-03, 01-04 | Selected date label not trapped inside the calendar day grid | SATISFIED | Human approved 2026-04-24; label rendered in Button trigger outside Calendar component |
| DATE-03 | 01-01, 01-02, 01-03, 01-04 | "Add" / submit button never obscured by the calendar's last row | SATISFIED | Human approved 2026-04-24 |
| SIZE-01 | 01-01, 01-02, 01-03 | `--cell-size: 1.75rem` applied | SATISFIED | 1+1+2 confirmed matches across three files |
| SIZE-02 | 01-01, 01-02, 01-03 | `mt-1` on week rows, `gap-2` on month wrapper | SATISFIED | `month: "flex w-full flex-col gap-2"` and `week: "mt-1 flex w-full"` confirmed across all four Calendar instances |
| SIZE-03 | 01-01, 01-02, 01-03 | `showOutsideDays={false}` to prevent 6-row months | SATISFIED | 1+1+2 confirmed matches across three files |

No orphaned requirements. All 6 requirement IDs (DATE-01, DATE-02, DATE-03, SIZE-01, SIZE-02, SIZE-03) are mapped to Phase 1 in REQUIREMENTS.md and claimed by plans 01-01 through 01-04.

### Anti-Patterns Found

None. The previously identified blocker (`fromDate` deprecated prop at recurring-page.tsx:905-909) has been corrected. No new anti-patterns detected in the modified file.

### Human Verification Required

No human verification required. Human visual approval was granted on 2026-04-24 (documented in 01-04-SUMMARY.md), covering all five ROADMAP success criteria. The gap that remained from the initial verification was a programmatic code defect, now confirmed closed by code inspection.

### Gaps Summary

No gaps. The single gap from the previous verification (Truth 11 — end date restriction using deprecated `fromDate` prop) has been resolved.

**Closed gap — CR-01:**

`recurring-page.tsx` previously used `fromDate={formState.startDate ? parseISO(formState.startDate) : undefined}` on the end-date Calendar. In react-day-picker v9.14.0 this prop is present in TypeScript types but has no effect at runtime. Commit a1cd5ee replaced it with `disabled={ formState.startDate ? { before: parseISO(formState.startDate) } : undefined }` — the v9-correct API that disables individual day cells before the start date. No `fromDate=` prop remains anywhere in the file.

---

_Verified: 2026-04-24T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
