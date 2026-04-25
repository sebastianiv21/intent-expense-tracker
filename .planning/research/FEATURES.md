# Feature Landscape: Compact Inline Calendar in a Constrained Sheet

**Domain:** Single-date picker inside a mobile bottom sheet / desktop centered sheet
**Researched:** 2026-04-23
**Confidence:** HIGH — based on direct inspection of installed react-day-picker v9.14.0 CSS source,
the shadcn/ui `Calendar` component source, and the `TransactionSheet` implementation in this codebase.

---

## Summary

The "New Awareness" sheet uses a `<Popover>` to host the `<Calendar>`. The popover floats inside
the sheet's scrollable area; when the sheet is near its `max-h-[90vh]` ceiling, the popover content
overflows the sheet's bottom, pushing past the "Add" button. The project goal (DATE-01/02/03) is to
make the calendar fit inline — no popover, no scroll — inside the fixed vertical space of the sheet.

Two layers of sizing control are available:

1. **shadcn-level:** The `Calendar` component introduces a `--cell-size` CSS custom property
   (default `2rem` / 32 px). Every cell is `aspect-square h-full w-full min-w-[--cell-size]`.
   The nav buttons are `h-[--cell-size] w-[--cell-size]`. Reducing this single variable shrinks
   every cell and nav button proportionally.

2. **react-day-picker CSS-variable level:** The underlying `rdp-root` exposes `--rdp-day-height`,
   `--rdp-day-width`, `--rdp-day_button-height`, `--rdp-day_button-width`, `--rdp-nav-height`,
   `--rdp-nav_button-height/width`, and `--rdp-weekday-padding`. These are the fallback layer when
   the shadcn classNames system does not override a value.

The total calendar height at `--cell-size: 2rem` is approximately:

  - Nav/caption row: 2rem (32 px)
  - `gap-4` below caption: 1rem (16 px)
  - Weekday header: ~1.5rem (24 px, driven by `--rdp-weekday-padding: 0.5rem 0`)
  - 6 week rows × (2rem cell + `mt-2` gap): 6 × (32 + 8) = 240 px
  - Root padding `p-3`: 2 × 12 = 24 px
  - **Total worst-case (6-row month): ~336 px**

At `--cell-size: 1.75rem` the same calculation yields ~295 px. At `1.5rem` ~255 px.

The current implementation renders the calendar inside a `<PopoverContent>` that appears **below**
the date trigger button. Since the sheet itself scrolls (`overflow-y-auto`), the popover does not
scroll with the container — it escapes the sheet boundary and overlaps fixed UI below it. Switching
to an inline (non-popover) pattern eliminates this class of bug entirely.

---

## Table Stakes (must fix)

These are the minimum changes needed to satisfy DATE-01/02/03.

| # | Requirement | Why It Is Broken Today | Fix Direction |
|---|-------------|------------------------|---------------|
| 1 | Calendar fits inside sheet without overflow | Popover floats outside the sheet's stacking context; at 90 vh the popover bottom overlaps the footer "Add" button | Replace `<Popover>` + trigger button with a conditionally-rendered inline `<Calendar>` block |
| 2 | Selected-date label does not render inside the grid | The current date button shows `"MMMM d, yyyy"` text in the trigger; no separate row exists today — the issue is a stray element rendering mid-grid when the popover opens in a position that visually traps the trigger label | Inline calendar makes the trigger label a permanent display row above the grid, cleanly separated |
| 3 | "Add" button is never obscured | Overlapping caused by popover escaping the scroll container | Inline calendar stays in document flow; footer with "Add" stays pinned at bottom via `border-t bg-card` |
| 4 | Cells are touch-comfortable on mobile (min 44 px tap target) | At `--cell-size: 2rem` (32 px) the visual cell is under the 44 px WCAG touch target | Keep `--cell-size: 2rem` or use `2.5rem` for cells; rely on `min-w-[--cell-size]` sizing. Note: the button is `aspect-square w-full` so actual rendered size depends on column distribution across the full calendar width, which on a 375 px phone at 7 columns is ~48 px per cell — adequate. |
| 5 | Calendar collapses when a date is chosen | Without a popover, the calendar stays visible permanently; UX degrades | Add a local `showCalendar` boolean state; toggle it when the trigger row is tapped and collapse it `onSelect` |

---

## Patterns

Standard techniques for compact inline calendars in constrained spaces (sheets, drawers, sidebars),
ordered by implementation effort.

### Pattern 1 — Reduce `--cell-size` (lowest effort, biggest impact)

**What:** Override `--cell-size` on the `<Calendar>` via `className`.

```tsx
<Calendar
  className="[--cell-size:1.75rem]"   // down from default 2rem
  classNames={{ root: "w-full" }}
  ...
/>
```

**Height saved:** ~40 px on a 6-row month (reduces from ~336 px to ~295 px).

**When to use:** When the calendar is in a popover and you just need it slightly shorter.
Not sufficient alone to eliminate the overflow when the calendar is inline in a full sheet.

**Tradeoff:** Below 1.75 rem the tap-target shrinks below 28 px visual; since the rendered column
width on a 375 px phone is ~(375 − 24 px padding) / 7 ≈ 50 px, `--cell-size` only sets a minimum —
actual hit area is fine down to 1.5 rem.

---

### Pattern 2 — Remove `p-3` padding and `gap-4` on the month wrapper (low effort)

**What:** The `Calendar` component sets `p-3` on the root and `gap-4` on the `.month` element
(via the shadcn `classNames.month = "flex w-full flex-col gap-4"`). These two together contribute
~40 px (24 px padding + 16 px gap) of non-data vertical space.

```tsx
<Calendar
  className="p-0"                        // remove root padding
  classNames={{
    root: "w-full",
    month: "flex w-full flex-col gap-2", // reduce gap-4 → gap-2
  }}
  ...
/>
```

**Height saved:** ~24 px.

---

### Pattern 3 — Tighten week-row gap (low effort)

**What:** The `week` classNames entry is `"mt-2 flex w-full"` (8 px between each row × 6 rows = 48 px
of inter-row spacing). Reducing to `mt-1` saves 24 px.

```tsx
classNames={{
  week: "mt-1 flex w-full",
}}
```

**Height saved:** ~24 px.

---

### Pattern 4 — Reduce weekday padding via CSS variable (low effort)

**What:** react-day-picker's `.rdp-weekday` has `padding: var(--rdp-weekday-padding)` which defaults
to `0.5rem 0` (8 px top and bottom = 16 px total on the header row). Setting it to `0.25rem 0` saves
8 px.

In Tailwind 4 you can inject arbitrary CSS variables on an element with `[--rdp-weekday-padding:...]`:

```tsx
<Calendar
  className="[--rdp-weekday-padding:0.25rem_0]"
  ...
/>
```

**Height saved:** ~8 px.

---

### Pattern 5 — Toggle-reveal inline calendar (recommended implementation pattern)

**What:** Replace the `<Popover>` with a collapsible inline block. The trigger row is a permanent
display element (shows current date). Tapping it toggles `showCalendar`. The calendar renders inline
in document flow, pushing content downward within the sheet's `overflow-y-auto` scroll area. The
footer "Add" button stays pinned by being outside the scroll container.

```tsx
// State
const [showCalendar, setShowCalendar] = useState(false);

// Trigger row (always visible)
<button
  type="button"
  onClick={() => setShowCalendar((v) => !v)}
  className="flex h-12 w-full items-center justify-start rounded-2xl border border-border bg-background px-4"
>
  <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
  <span>{format(parseISO(form.date), "MMMM d, yyyy")}</span>
  <ChevronDownIcon className={cn("ml-auto h-4 w-4 transition-transform", showCalendar && "rotate-180")} />
</button>

// Inline calendar (conditionally shown)
{showCalendar && (
  <Calendar
    mode="single"
    selected={parseISO(form.date)}
    onSelect={(day) => {
      if (day) {
        updateField("date", format(day, "yyyy-MM-dd"));
        setShowCalendar(false);   // auto-collapse on selection
      }
    }}
    className="p-0 [--cell-size:1.75rem]"
    classNames={{
      root: "w-full",
      month: "flex w-full flex-col gap-2",
      week: "mt-1 flex w-full",
    }}
    autoFocus
  />
)}
```

**Why this pattern wins:**
- Calendar is in document flow — it never escapes the sheet boundary.
- The sheet's `overflow-y-auto` on the scroll area handles any remaining height pressure gracefully.
- Auto-collapse on selection matches native mobile date pickers (iOS, Android).
- The trigger row is always visible, so the selected date is always readable (fixes DATE-02).
- The "Add" button lives in a separate pinned footer div, always visible (fixes DATE-03).

---

### Pattern 6 — `showOutsideDays={false}` to reduce 6-row months (low effort, optional)

**What:** Months that start on Saturday/Sunday require a 6th partial row. Setting
`showOutsideDays={false}` hides outside-month days, but does NOT reduce the row count — react-day-picker
still renders the empty row structure. This pattern does NOT save height.

**Verdict:** Do not use for height reduction. Only use if the design intentionally hides grey
outside-month dates.

---

### Pattern 7 — `captionLayout="dropdown"` for faster navigation (medium effort, optional)

**What:** Replace the prev/next chevrons with month/year dropdowns. This does not reduce calendar
height, but on mobile it eliminates repeated tapping to reach past months.

**When to use:** If user testing shows navigation friction. Not needed for the layout overflow bug.

---

## Anti-patterns

### Anti-pattern 1 — Keeping the Popover and clamping with max-height

**What goes wrong:** Adding `max-h-[280px] overflow-hidden` to `<PopoverContent>` clips the calendar
grid. The last row of days is cut off. Users cannot see or click days in week 5 or 6.

**Why it happens:** Engineers reach for `overflow-hidden` or `max-height` to stop overflow without
rethinking the containment model.

**Instead:** Use Pattern 5 (toggle-reveal inline). The calendar is in normal flow and the sheet
container scrolls.

---

### Anti-pattern 2 — Setting `overflow-hidden` on the sheet scroll container

**What goes wrong:** `overflow-hidden` on the `div.flex-1.overflow-y-auto` container kills the
scroll entirely. All form content below the calendar fold becomes unreachable.

**Instead:** Keep `overflow-y-auto` on the scroll region. Let the calendar push other content down
and let the user scroll.

---

### Anti-pattern 3 — Using `transform: scale()` to shrink the calendar

**What goes wrong:** Scaling the calendar DOM element down visually makes it fit, but the hit areas
(click/touch targets) remain at the original size, causing misaligned interactions. Text becomes blurry
on low-DPI displays.

**Instead:** Reduce `--cell-size` (Pattern 1) or reduce gaps (Patterns 2–3), which resize the actual
layout boxes.

---

### Anti-pattern 4 — Switching to a different calendar library

**What goes wrong:** Replacing react-day-picker with a different library (e.g., react-calendar,
flatpickr) requires re-implementing all accessibility, keyboard navigation, and DayPicker v9 props
that the rest of the app relies on. The PROJECT.md explicitly constraints to "existing shadcn/ui
Calendar + Tailwind CSS — no new calendar library."

**Instead:** Use the CSS variable and classNames APIs that react-day-picker v9 and the shadcn Calendar
wrapper already expose.

---

### Anti-pattern 5 — Removing `autoFocus` from the inline calendar

**What goes wrong:** Without `autoFocus`, keyboard users cannot navigate the calendar after it opens.
Screen readers also lose the focus context.

**Instead:** Keep `autoFocus` on the inline `<Calendar>` so that when it mounts, focus moves into
the grid.

---

## Sources

- react-day-picker v9.14.0 CSS variable definitions: installed at
  `web/node_modules/.pnpm/react-day-picker@9.14.0_react@19.2.3/node_modules/react-day-picker/src/style.css`
  (verified directly — HIGH confidence)
- shadcn/ui Calendar component: `web/components/ui/calendar.tsx` (project source — HIGH confidence)
- TransactionSheet component: `web/components/transaction-sheet.tsx` (project source — HIGH confidence)
- Sheet layout constraints: `SheetContent` `max-h-[90vh]`, scroll wrapper `flex-1 overflow-y-auto`,
  pinned footer `border-t bg-card` — all visible in the component source (HIGH confidence)
