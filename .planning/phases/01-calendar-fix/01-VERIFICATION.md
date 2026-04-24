---
phase: 01-calendar-fix
verified: 2026-04-24T15:00:00Z
status: gaps_found
score: 10/11 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 10/11
  gaps_closed: []
  gaps_remaining:
    - "End date Calendar respects fromDate (cannot select a date before start date)"
  regressions: []
gaps:
  - truth: "End date Calendar respects fromDate (cannot select a date before start date)"
    status: failed
    reason: "fromDate prop is deprecated and removed from react-day-picker v9 JS runtime. The prop is declared in DayPicker.d.ts (TypeScript types) but has zero matches in dist/cjs/*.js — it is silently ignored at runtime. Any end date can be selected regardless of start date. Confirmed unchanged from initial verification: fromDate= still present at recurring-page.tsx lines 905-909; not replaced with disabled={{ before: ... }}."
    artifacts:
      - path: "web/components/recurring-page.tsx"
        issue: "fromDate={formState.startDate ? parseISO(formState.startDate) : undefined} at lines 905-909 has no runtime effect in react-day-picker v9.14.0. The correct API is disabled={{ before: parseISO(formState.startDate) }}."
    missing:
      - "Replace fromDate prop with disabled={{ before: parseISO(formState.startDate) }} on the end-date Calendar in recurring-page.tsx (lines 905-909)"
      - "Consider adding endDate >= startDate refinement to updateRecurringSchema for defense-in-depth (createRecurringSchema already enforces this at lib/validations/recurring.ts:26)"
---

# Phase 1: Calendar Fix — Verification Report

**Phase Goal:** Fix the date picker visual bug so the calendar renders inline within the sheet without overflow or overlap
**Verified:** 2026-04-24T15:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — gap from initial verification remains open (no code changes detected for the failing item)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Tapping the date trigger in the New Awareness sheet opens the calendar inline (no overlay, no portal) | VERIFIED | Zero Popover/PopoverContent/PopoverTrigger matches in transaction-sheet.tsx; inline Calendar rendered conditionally via `{datePickerOpen && <Calendar .../>}` at line 453 |
| 2 | Tapping the trigger again while calendar is open closes it | VERIFIED | Toggle lambda `onClick={() => setDatePickerOpen((v) => !v)}` confirmed at transaction-sheet.tsx:442, budgets-page.tsx:735, recurring-page.tsx:839 and 884 |
| 3 | Selecting a date closes the calendar and shows the date in the trigger as "Month D, YYYY" | VERIFIED | `setDatePickerOpen(false)` in onSelect confirmed across all four Calendar instances; format string "MMMM d, yyyy" confirmed at transaction-sheet.tsx:447, budgets-page.tsx:740, recurring-page.tsx:844 and 889 |
| 4 | The full calendar grid is visible without needing to scroll inside the sheet on a 375px viewport | VERIFIED | Human approved 2026-04-24 (01-04-SUMMARY.md). Supported by: `[--cell-size:1.75rem]` (1+1+2 matches) and `showOutsideDays={false}` (1+1+2 matches) — no regression detected |
| 5 | The "Add" submit button in the pinned footer is never obscured by the calendar | VERIFIED | Human approved 2026-04-24 (01-04-SUMMARY.md) — "Add button never obscured by the calendar on mobile viewport" |
| 6 | No Popover, PopoverTrigger, or PopoverContent wrappers remain in transaction-sheet.tsx | VERIFIED | grep confirms zero matches — no regression |
| 7 | Tapping the date trigger in the budget creation form opens the calendar inline (no overlay) | VERIFIED | Zero Popover matches in budgets-page.tsx; toggle lambda at line 735 confirmed — no regression |
| 8 | No Popover wrappers remain in budgets-page.tsx | VERIFIED | grep confirms zero matches — no regression |
| 9 | Calendar cell size is 1.75rem and outside days are hidden in all three files | VERIFIED | `[--cell-size:1.75rem]`: 1 match transaction-sheet, 1 match budgets-page, 2 matches recurring-page. `showOutsideDays={false}`: same counts. No regression. |
| 10 | Both start and end date triggers in recurring-page toggle their independent calendars closed on re-click | VERIFIED | `setDatePickerOpen((v) => !v)` at recurring-page:839; `setEndDatePickerOpen((v) => !v)` at recurring-page:884 — no regression |
| 11 | End date Calendar respects fromDate (cannot select a date before start date) | FAILED | `fromDate=` prop still present at recurring-page.tsx:905-909 — unchanged from initial verification. This prop is silently ignored by react-day-picker v9.14.0 at runtime; no date restriction is applied in the UI. Server-side Zod guard (createRecurringSchema:26) prevents persisting invalid data but the UI provides no visual feedback. |

**Score:** 10/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `web/components/transaction-sheet.tsx` | Inline toggled Calendar; toggle lambda; `[--cell-size:1.75rem]` | VERIFIED | Zero Popover refs, toggle lambda at :442, cell-size at :463, classNames root/month/week at :464-467, showOutsideDays at :469 — no regression |
| `web/components/budgets-page.tsx` | Inline toggled Calendar; toggle lambda; `[--cell-size:1.75rem]` | VERIFIED | Zero Popover refs, toggle lambda at :735, cell-size at :763, classNames at :764-767, showOutsideDays at :769 — no regression |
| `web/components/recurring-page.tsx` (start date) | Inline toggled Calendar for start date | VERIFIED | Toggle lambda at :839, cell-size at :867, classNames at :868-871, showOutsideDays at :873 — no regression |
| `web/components/recurring-page.tsx` (end date) | Inline toggled Calendar with working end-date restriction | PARTIAL | Toggle lambda at :884 confirmed; `fromDate` prop at :905-909 still present and still silently ignored at runtime — gap not closed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| trigger Button onClick (transaction-sheet) | setDatePickerOpen | toggle lambda | WIRED | Confirmed at :442 — no regression |
| Calendar onSelect (transaction-sheet) | setDatePickerOpen(false) | onSelect callback | WIRED | Confirmed at :460 — no regression |
| trigger Button onClick (budgets-page) | setDatePickerOpen | toggle lambda | WIRED | Confirmed at :735 — no regression |
| Calendar onSelect (budgets-page) | setDatePickerOpen(false) | onSelect callback | WIRED | Confirmed at :760 — no regression |
| start date trigger Button onClick (recurring-page) | setDatePickerOpen | toggle lambda | WIRED | Confirmed at :839 — no regression |
| end date trigger Button onClick (recurring-page) | setEndDatePickerOpen | toggle lambda | WIRED | Confirmed at :884 — no regression |
| end date Calendar | formState.startDate | fromDate prop (intended restriction) | NOT_WIRED | `fromDate=` at :905 accepted by TypeScript types but has zero effect in react-day-picker v9.14.0 JS runtime — unchanged, gap not closed |

### Data-Flow Trace (Level 4)

Not applicable — this phase modifies UI layout and interaction behavior, not data fetching or rendering pipelines. Date values flow Calendar onSelect → form state → trigger label display, all verified in key links above.

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Zero Popover refs in all three files | grep Popover in transaction-sheet, budgets-page, recurring-page | 0 matches | PASS |
| Cell-size prop counts | grep --cell-size:1.75rem | 1, 1, 2 | PASS |
| showOutsideDays counts | grep showOutsideDays={false} | 1, 1, 2 | PASS |
| fromDate prop still present (not fixed) | grep fromDate= recurring-page.tsx | 1 match at line 905 | FAIL — gap confirmed open |
| disabled={{ before: }} not yet applied | grep "disabled=.*before" recurring-page.tsx | 0 matches | FAIL — fix not applied |

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

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `web/components/recurring-page.tsx` | 905-909 | `fromDate` prop — deprecated and silently removed from react-day-picker v9 JS runtime | Blocker | End date restriction has no runtime effect; any date can be selected before start date. Server-side Zod validation (createRecurringSchema:26) prevents persisting invalid data, but UI shows no visual restriction. |

### Human Verification Required

No additional human verification is required. Human visual approval was granted on 2026-04-24 (documented in 01-04-SUMMARY.md), covering all five ROADMAP success criteria. The remaining gap (CR-01) is a programmatic code defect with a known fix, not a visual verification item.

### Gaps Summary

**1 gap blocking complete goal achievement — unchanged from initial verification (gap not closed):**

**Truth 11 — End date Calendar restriction (fromDate prop silently broken)**

`recurring-page.tsx` still uses `fromDate={formState.startDate ? parseISO(formState.startDate) : undefined}` at lines 905-909 on the end-date Calendar. In react-day-picker v9.14.0, this prop is declared in `DayPicker.d.ts` (TypeScript types) but is not referenced in any JavaScript in `dist/cjs/` — it is silently ignored. No code changes were made to this file since the initial verification identified this gap.

The practical consequence: a user creating a recurring transaction can set an end date before the start date in the calendar UI with no visual indication the selection is invalid. The server-side Zod schema (`lib/validations/recurring.ts:26`) rejects `endDate < startDate`, so invalid data cannot be persisted, but the user receives no calendar-level visual feedback.

**Fix required:** Replace `fromDate={...}` with `disabled={{ before: parseISO(formState.startDate) }}` on the end-date Calendar in `recurring-page.tsx` (lines 905-909). This is the v9-correct API for disabling date cells.

**If the team decides the server-side Zod guard is sufficient and wishes to close this phase without the UI fix**, add an override to this file's frontmatter:

```yaml
overrides:
  - must_have: "End date Calendar respects fromDate (cannot select a date before start date)"
    reason: "fromDate prop silently ignored in react-day-picker v9 runtime; server-side Zod validation in createRecurringSchema enforces endDate >= startDate as defense-in-depth. UI-level date restriction deferred to follow-up."
    accepted_by: "{your name}"
    accepted_at: "2026-04-24T15:00:00Z"
```

---

_Verified: 2026-04-24T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
