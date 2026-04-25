---
phase: 01-calendar-fix
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - web/components/transaction-sheet.tsx
  - web/components/budgets-page.tsx
  - web/components/recurring-page.tsx
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

This phase replaced Radix Popover portal date pickers with toggled inline Calendar components across three sheets. The toggle pattern is implemented consistently and the state management is correct (functional updater `(v) => !v`, reset to `false` on sheet open/edit). Calendar `classNames` overrides are applied correctly. However, one critical bug exists in `recurring-page.tsx` where a deprecated and removed prop `fromDate` is used with no actual effect, meaning the end-date picker silently accepts any date regardless of the selected start date. There are also accessibility regressions common to all three files introduced by moving away from the Popover's built-in ARIA management.

---

## Critical Issues

### CR-01: `fromDate` is a removed prop in react-day-picker v9 — end date is not restricted

**File:** `web/components/recurring-page.tsx:903-909`

**Issue:** The end-date Calendar passes `fromDate={parseISO(formState.startDate)}` expecting it to prevent the user from selecting a date before the start date. In react-day-picker v9 (the installed version 9.14.0), `fromDate` is marked `@deprecated` and `@private` with the note: _"Use `hidden={{ before: date }}` instead."_ The prop is no longer processed by the component. As a result, the end-date picker silently accepts any date — including dates before `startDate` — and that invalid range is passed to the server.

The `startMonth`/`fromDate` family of props has never controlled which individual days are selectable; it only controls which calendar months can be navigated to. Restricting selectable days requires the `disabled` prop.

**Fix:**

Replace `fromDate` with `disabled` to actually prevent selecting invalid dates:

```tsx
// recurring-page.tsx — end date Calendar (lines ~897-929)
<Calendar
  mode="single"
  selected={formState.endDate ? parseISO(formState.endDate) : undefined}
  disabled={
    formState.startDate
      ? { before: parseISO(formState.startDate) }
      : undefined
  }
  onSelect={(day) => {
    if (day) {
      setFormState((prev) => ({
        ...prev,
        endDate: format(day, "yyyy-MM-dd"),
      }));
      setEndDatePickerOpen(false);
    }
  }}
  className="mt-2 w-full rounded-2xl border border-border bg-background p-2 [--cell-size:1.75rem]"
  classNames={{
    root: "w-full",
    month: "flex w-full flex-col gap-2",
    week: "mt-1 flex w-full",
  }}
  showOutsideDays={false}
  autoFocus
/>
```

Additionally, add server-side or Zod validation to reject `endDate < startDate` as a defense-in-depth measure in `lib/validations/` for the recurring transaction schema.

---

## Warnings

### WR-01: Date toggle buttons missing `aria-expanded` — accessibility regression from Popover

**File:** `web/components/transaction-sheet.tsx:439-452`, `web/components/budgets-page.tsx:732-745`, `web/components/recurring-page.tsx:836-849`, `web/components/recurring-page.tsx:881-895`

**Issue:** The `<Button>` elements that toggle the inline calendars open/closed carry no `aria-expanded` attribute. The previous Popover implementation provided this automatically. Screen readers cannot know whether the calendar is currently visible. This affects all four date-picker trigger buttons across the three files.

**Fix:** Add `aria-expanded` to each toggle button. Example for `transaction-sheet.tsx`:

```tsx
<Button
  variant="outline"
  aria-expanded={datePickerOpen}
  aria-label="Choose date"
  className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
  onClick={() => setDatePickerOpen((v) => !v)}
>
```

Apply the same change to the start-date and end-date buttons in `budgets-page.tsx` and `recurring-page.tsx`.

---

### WR-02: Inline Calendar has no click-outside / Escape-key handler

**File:** `web/components/transaction-sheet.tsx:453-473`, `web/components/budgets-page.tsx:746-773`, `web/components/recurring-page.tsx:850-877`, `web/components/recurring-page.tsx:897-929`

**Issue:** The previous Popover component closed automatically when the user clicked outside it or pressed Escape. The inline toggle calendars have no such behavior. Once open, the calendar stays visible until the user selects a date or clicks the toggle button again. If a user opens the calendar, changes their mind, and presses Escape, the calendar stays open. This is a usability regression and diverges from expected modal/overlay behavior.

**Fix:** Add a `keydown` handler on the calendar wrapper to close on Escape, and optionally a `useEffect`-based click-outside handler. Minimal Escape fix:

```tsx
{datePickerOpen && (
  <div
    onKeyDown={(e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setDatePickerOpen(false);
      }
    }}
  >
    <Calendar ... />
  </div>
)}
```

Note: `e.stopPropagation()` is important inside a Sheet — without it, Escape will also close the sheet itself.

---

### WR-03: `autoFocus` on Calendar inside Sheet may disrupt focus trap

**File:** `web/components/transaction-sheet.tsx:471`, `web/components/budgets-page.tsx:770`, `web/components/recurring-page.tsx:874`, `web/components/recurring-page.tsx:926`

**Issue:** All four Calendar instances pass `autoFocus`. The shadcn/ui Sheet (Radix Dialog) manages a focus trap. When the Calendar mounts with `autoFocus`, focus moves into the calendar grid immediately. Depending on Radix's focus trap timing, this can either conflict with the trap (causing focus to escape the sheet) or produce a jarring jump. The CalendarDayButton's own `useEffect` for `modifiers.focused` already handles programmatic focus; `autoFocus` on the outer component is redundant and potentially problematic.

**Fix:** Remove `autoFocus` from all four Calendar instances. The `CalendarDayButton` component in `ui/calendar.tsx` already uses `ref.current?.focus()` when `modifiers.focused` is true, so the focused cell will still receive focus without the outer `autoFocus` prop.

```tsx
// Remove from all four Calendar instances
- autoFocus
```

---

## Info

### IN-01: `fromDate` deprecation warning will appear in console in development

**File:** `web/components/recurring-page.tsx:905`

**Issue:** Even though `fromDate` is silently ignored at runtime, react-day-picker v9 may log a console deprecation warning during development whenever the end-date Calendar renders. This is noise in the dev console. This is a secondary symptom of CR-01.

**Fix:** Resolved by the CR-01 fix (replacing `fromDate` with `disabled={{ before: ... }}`).

---

### IN-02: `BUCKET_META` and `getAmountFontSize` duplicated across all three files

**File:** `web/components/transaction-sheet.tsx:40-71,75-80`, `web/components/budgets-page.tsx:68-99,101-106`, `web/components/recurring-page.tsx:87-118,120-125`

**Issue:** The `BUCKET_META` constant and `getAmountFontSize` function are copy-pasted identically in all three files. This is not a bug introduced by this phase but is worth flagging for a future refactor.

**Fix:** Extract to a shared module, e.g., `lib/bucket-config.ts`, and import from there. Out of scope for this phase per CLAUDE.md constraints ("fix only the calendar layout; do not refactor unrelated sheet components"), but worth noting for a follow-up.

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
