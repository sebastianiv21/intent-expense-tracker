# Architecture: Date Picker Layout Bug

**Analysis Date:** 2026-04-23
**Scope:** "New Awareness" transaction sheet — calendar overflow fix

---

## Summary

The "New Awareness" sheet (`transaction-sheet.tsx`) renders a bottom-anchored Radix Dialog panel capped at `max-h-[90vh]`. Its scrollable body is a `flex-1 overflow-y-auto` div. The date field is a `<Popover>` that opens a `<PopoverContent>` via `PopoverPrimitive.Portal` — meaning the calendar is **teleported to the document body**, completely outside the sheet's scroll container. On small screens the calendar's natural height (roughly 300–320 px for a 6-row month) plus the portal positioning logic causes it to either clip against the viewport bottom or overflow the visible sheet area. Additionally, the shadcn Calendar component renders cells sized by a `--cell-size` CSS custom property (default `2rem` in `calendar.tsx`, overridden to `2.25rem` in the call site), and each week row adds `mt-2` spacing — the cumulative vertical footprint is too tall for the available space inside the already-constrained sheet.

There is a secondary issue: the `PopoverContent` carries `w-[var(--radix-popover-trigger-width)]` which matches the trigger button's width (full sheet width minus padding), but no max-height or overflow guard is set on the popover itself. When Radix positions the popover below its trigger, the bottom of the calendar can exceed `90vh` with no scroll or clip applied.

---

## Key Files

| File | Role |
|------|------|
| `web/components/transaction-sheet.tsx` | The "New Awareness" sheet. Owns all form state, renders the date `<Popover>` + `<Calendar>`. **Primary fix target.** |
| `web/components/ui/calendar.tsx` | shadcn/ui wrapper around `react-day-picker` v9 (`DayPicker`). Defines `--cell-size` default (`2rem`), all classNames, and the `CalendarDayButton` component. |
| `web/components/ui/sheet.tsx` | Radix Dialog-based bottom sheet. `SheetContent` applies the variant classes; the `bottom` variant gives `inset-x-0 bottom-0 border-t` with no height constraint of its own — height is controlled by the className passed at the call site. |
| `web/components/ui/popover.tsx` | Thin Radix Popover wrapper. `PopoverContent` always renders inside `PopoverPrimitive.Portal` (body-level), not inside the sheet DOM tree. |

---

## Current Layout Structure

```
<Sheet>                                            (Radix Dialog root)
  <SheetContent side="bottom"
    className="max-h-[90vh] rounded-t-3xl ...
               lg:rounded-3xl lg:w-[min(100%-2rem,58rem)]">
    <div className="flex max-h-[90vh] flex-col">   ← outer flex column, same cap
      <!-- HEADER (fixed) -->
      <div className="border-b px-6 pb-4 pt-6">    ← ~80 px tall
        SheetTitle + close button
      </div>

      <!-- SCROLLABLE BODY -->
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        Amount input block                          ← ~90 px
        Expense/Income toggle                       ← ~52 px
        Bucket selector (expense only)             ← ~100 px
        Category horizontal scroll                 ← ~56 px
        [DATE TRIGGER BUTTON]                       ← ~48 px (h-12)
          <Popover>
            <PopoverContent                         ← rendered via Portal → <body>
              className="w-[var(--radix-popover-trigger-width)] p-0">
              <Calendar                             ← react-day-picker, cell-size 2.25rem
                className="w-full [--cell-size:2.25rem]" />
            </PopoverContent>
          </Popover>
        Textarea (notes)                            ← h-20 = 80 px
        Error message (conditional)
      </div>

      <!-- FOOTER (fixed) -->
      <div className="border-t px-6 pb-8 pt-4">    ← ~88 px tall
        Add / Update button
      </div>
    </div>
  </SheetContent>
</Sheet>

<!-- Portal target (appended to <body>) -->
<PopoverContent>
  <Calendar />                                     ← ~300–330 px tall
</PopoverContent>
```

**Critical measurement — Calendar natural height at `--cell-size: 2.25rem`:**

- Header row (month + nav): `2.25rem` (~36 px)
- Weekday label row: `~20 px`
- Up to 6 week rows × (`2.25rem` cell + `mt-2` gap): 6 × (~36 + 8) = ~264 px
- Internal padding (`p-3` on DayPicker root): 24 px
- **Total: ~344 px**

On a 375 px-wide / 667 px-tall mobile viewport at `max-h-[90vh]` = 600 px, the sheet body available after header (~80 px) and footer (~88 px) is ~432 px. The scrollable body contains ~426 px of form elements before the date row. Once the popover opens **below** the trigger button (which may already be near the 432 px boundary), the calendar's 344 px overflows the viewport bottom. Radix Popover's collision avoidance flips it above the trigger if there is insufficient room below, but if the trigger itself is scrolled inside the sheet it may not correctly detect the remaining space — because the portal is positioned relative to the viewport, not the scroll container.

---

## Root Cause Analysis

**Primary cause — Portal escapes the scroll container.**
`PopoverContent` uses `PopoverPrimitive.Portal`, which appends the calendar outside the sheet DOM. Radix positions it via absolute coordinates computed from the trigger's `getBoundingClientRect()`. The trigger button can scroll within the sheet's `overflow-y-auto` body; its viewport Y position changes. When Radix places the popover below the trigger, the bottom of the calendar can fall outside the viewport (or behind the sheet footer) with no clip applied.

**Secondary cause — Calendar cell size is too tall.**
The call site overrides `--cell-size` to `2.25rem` (larger than the `2rem` default). Each week row also carries `mt-2` (8 px). For a 6-row month, this adds ~48 px compared to the default size. Reducing or removing this override shrinks the calendar by ~48 px without any visual regression at the `2rem` default.

**Tertiary cause — No max-height on PopoverContent.**
The `PopoverContent` in `popover.tsx` carries `w-72` as default width, but no `max-h` or `overflow-auto`. The call site in `transaction-sheet.tsx` only overrides width. Without a height constraint the calendar renders at its natural height regardless of remaining viewport space.

**DATE-02 symptom (selected date row inside grid).**
This is likely a `react-day-picker` v9 classNames issue: the `today` class applies `bg-accent rounded-md` but the selected day also carries `data-selected=true` which may conflict with the `week` row's `mt-2` spacing when the selected day lands on the last visible row. No explicit fix has been applied to the `today`/`selected` combination in `calendar.tsx`.

---

## Suggested Fix Location

### Fix 1 — Replace Popover with inline Calendar (recommended, addresses all three requirements)

**File:** `web/components/transaction-sheet.tsx`

Replace the entire `<Popover>` + `<PopoverContent>` + `<Calendar>` block with a toggled inline `<Calendar>` rendered directly in the scrollable body div. This eliminates the portal positioning problem entirely. The calendar becomes a normal in-flow element that the `overflow-y-auto` scroll container handles naturally.

```tsx
// Instead of <Popover><PopoverTrigger>...<PopoverContent><Calendar /></PopoverContent></Popover>

<div>
  <Button
    variant="outline"
    className="h-12 w-full justify-start rounded-2xl ..."
    onClick={() => setDatePickerOpen((v) => !v)}
  >
    <CalendarIcon ... />
    {/* date label */}
  </Button>
  {datePickerOpen && (
    <Calendar
      mode="single"
      selected={form.date ? parseISO(form.date) : undefined}
      onSelect={(day) => {
        if (day) {
          updateField("date", format(day, "yyyy-MM-dd"));
          setDatePickerOpen(false);
        }
      }}
      className="mt-2 w-full rounded-2xl border border-border bg-background"
      autoFocus
    />
  )}
</div>
```

Remove the `Popover`, `PopoverContent`, `PopoverTrigger` imports from `transaction-sheet.tsx` if no longer used elsewhere in the file.

### Fix 2 — Reduce cell size (companion to Fix 1 or standalone improvement)

**File:** `web/components/transaction-sheet.tsx` (the `<Calendar>` call site)

Remove or reduce the `[--cell-size:2.25rem]` override. The default `2rem` defined in `calendar.tsx` is already appropriate for a compact inline context. Drop back to the default or go smaller (`1.75rem`) for mobile:

```tsx
// Before
className="w-full [--cell-size:2.25rem]"

// After (use calendar.tsx default of 2rem, or explicitly set smaller)
className="w-full"
// or
className="w-full [--cell-size:1.875rem]"
```

### Fix 3 — DATE-02: Selected-date label collision

**File:** `web/components/ui/calendar.tsx` or the `<Calendar>` call site in `transaction-sheet.tsx`

The `today` classNames entry applies `bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none`. If today is the selected date, `rounded-none` can cause visual artifacts when it's the last row. This is a classNames tweak in `calendar.tsx`:

```tsx
today: cn(
  "bg-accent text-accent-foreground rounded-md",
  // Remove data-[selected=true]:rounded-none or adjust to match CalendarDayButton selected styles
  defaultClassNames.today
),
```

---

## Notes on `datePickerOpen` State

The `datePickerOpen` state is already present in `transaction-sheet.tsx` (line 170) and is reset to `false` on sheet open (line 180). Fix 1 reuses this state as a plain boolean toggle — no new state is needed. The `<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>` wiring is already in place and simply needs to be restructured into an `onClick` + conditional render.
