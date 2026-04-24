# Stack Research: shadcn/ui Calendar Compact Sizing

**Project:** Intent Expense Tracker — Date Picker Layout Fix
**Researched:** 2026-04-23
**Scope:** What controls calendar size in the installed stack (react-day-picker 9.14.0 + shadcn/ui Calendar + Tailwind 4.x)
**Sources:** Installed package source (`node_modules/react-day-picker/src/style.css`, `dist/esm/UI.js`, `dist/esm/types/props.d.ts`), `web/components/ui/calendar.tsx` (shadcn scaffold), `web/components/transaction-sheet.tsx`

---

## Summary

The shadcn/ui Calendar component wraps react-day-picker v9 and introduces a **single custom CSS variable** — `--cell-size` — that drives both button dimensions and nav button dimensions. React-day-picker v9 itself defines a separate, parallel set of `--rdp-*` CSS variables scoped to `.rdp-root`. In this codebase the shadcn scaffold **does not import react-day-picker's stylesheet** and instead replaces every class with Tailwind utilities, so the `--rdp-*` variables are irrelevant in practice.

The minimum change to make the calendar compact is: lower `--cell-size` (shadcn controls cell and nav button height/width), tighten the outer `p-3` padding on the root, reduce `gap-4` on month/months containers, and reduce `mt-2` row spacing. For font size, the weekday header uses `text-[0.8rem]` (hardcoded in the component), and the day buttons inherit from shadcn's `Button size="icon"` which can be overridden via `classNames.day_button`.

The current sheet renders the calendar inside a `<PopoverContent>` — it is **not inline** today. The bug reports describe it as overflowing, which is consistent with the popover expanding beyond the sheet's viewport. The fix path is either: (a) size down `--cell-size` and padding so the popover fits, or (b) move to an inline calendar and use `flex-1 / overflow-hidden` containment in the sheet body. Both are achievable without replacing the component.

---

## Key APIs

### shadcn/ui Calendar props (from `web/components/ui/calendar.tsx`)

The scaffold accepts the full `DayPickerProps` union plus one extra prop:

| Prop | Type | Purpose |
|------|------|---------|
| `className` | `string` | Applied to the root `<DayPicker>` element. **This is where `[--cell-size:…]` lives.** |
| `classNames` | `Partial<ClassNames>` | Per-element class overrides. Keys are the react-day-picker `UI` enum string values. |
| `showOutsideDays` | `boolean` | Default `true`. Set `false` to reduce rows when a month has fewer than 6 weeks visible. |
| `captionLayout` | `"label" \| "dropdown" \| "dropdown-months" \| "dropdown-years"` | Default `"label"`. `"label"` is the most compact (no dropdowns). |
| `buttonVariant` | shadcn Button variant | Passed to nav buttons; does not affect sizing. |

### react-day-picker v9 ClassNames keys

All keys accepted by `classNames` prop (from `UI` enum, `DayFlag`, `SelectionState`):

```
root, chevron, day, day_button, caption_label, dropdowns, dropdown, dropdown_root,
footer, month_grid, month_caption, months_dropdown, month, months, nav,
button_next, button_previous, week, weeks, weekday, weekdays, week_number,
week_number_header, years_dropdown,
disabled, hidden, outside, focused, today,
range_end, range_middle, range_start, selected
```

The shadcn scaffold pre-populates the following keys with Tailwind classes:
`root`, `months`, `month`, `nav`, `button_previous`, `button_next`, `month_caption`,
`dropdowns`, `dropdown_root`, `dropdown`, `caption_label`, `table` (via `classNames`),
`weekdays`, `weekday`, `week`, `week_number_header`, `week_number`, `day`,
`range_start`, `range_middle`, `range_end`, `today`, `outside`, `disabled`, `hidden`.

Any key passed in the consumer's `classNames` prop is **spread last** via:
```ts
classNames={{ ...shadcnDefaults, ...props.classNames }}
```
So consumer-supplied classes **win** and fully replace the default for that key.

---

## Sizing Props

### 1. `--cell-size` (shadcn custom variable) — primary lever

Defined in the root `className` of `<DayPicker>`:
```
[--cell-size:2rem]   ← default in scaffold
```

It controls:
- `h-[--cell-size] w-[--cell-size]` on `button_previous` and `button_next`
- `h-[--cell-size]` on `month_caption` (the "April 2026" header row height)
- `size-[--cell-size]` on the `WeekNumber` custom component
- `min-w-[--cell-size]` on the `CalendarDayButton` (the individual day buttons)

The `CalendarDayButton` is `aspect-square h-auto w-full min-w-[--cell-size]`, meaning it will fill the available cell width from the `day` td element and not go below `--cell-size`. Reducing `--cell-size` therefore reduces the **minimum** button size.

Compact value: `[--cell-size:1.75rem]` or `[--cell-size:1.625rem]`. Going below `1.5rem` will clip tap targets unacceptably on mobile.

### 2. `className` on `<Calendar>` — outer container padding and width

Current popover usage:
```tsx
className="w-full [--cell-size:2.25rem]"
```

The scaffold default adds `p-3` to the root. To remove/reduce outer padding pass:
```tsx
className="w-full p-2 [--cell-size:1.75rem]"
```

Or pass `p-0` and add padding only around what you need.

### 3. `classNames.month` — gap between header and grid

Default: `"flex w-full flex-col gap-4"` — the `gap-4` (1rem) between the caption and the day grid is significant vertical space.

Override:
```tsx
classNames={{ month: "flex w-full flex-col gap-2" }}
```

### 4. `classNames.months` — gap in multi-month view

Default: `"relative flex flex-col gap-4 md:flex-row"`. Not relevant for single-month but `gap-4` on flex column adds bottom space.

Override:
```tsx
classNames={{ months: "relative flex flex-col gap-2 md:flex-row" }}
```

### 5. `classNames.week` — spacing between week rows

Default: `"mt-2 flex w-full"`. Each week row gets `mt-2` (0.5rem top margin). A full 6-row month contributes 5 × 0.5rem = 2.5rem of extra height just from margins.

Override:
```tsx
classNames={{ week: "mt-1 flex w-full" }}
// or
classNames={{ week: "flex w-full" }}  // remove margin entirely, rely on cell height
```

### 6. `classNames.weekday` — weekday header font

Default: `"text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal"`. Already small. Can drop to `text-[0.7rem]` if needed.

### 7. `showOutsideDays={false}` — reduce rows

When `false`, months with fewer weeks render fewer rows. Saves ~one full row (~2rem + button height) in short months but is variable. Not reliable for consistent compactness.

### 8. `fixedWeeks={false}` (default) — do not force 6 rows

The scaffold does not set `fixedWeeks`. Leaving it unset means months render their natural number of rows (4–6). Do NOT add `fixedWeeks={true}` — it would always force 6 rows and make overflow worse.

---

## CSS Variables

### react-day-picker's own `--rdp-*` variables

Defined on `.rdp-root` in `node_modules/react-day-picker/src/style.css`. **These are NOT used** by this codebase because the shadcn scaffold does not import the rdp stylesheet and replaces every rdp class with Tailwind utilities.

Listed here only for completeness — do not set them expecting any effect:

| Variable | Default | Meaning |
|----------|---------|---------|
| `--rdp-day-height` | `44px` | Day cell height |
| `--rdp-day-width` | `44px` | Day cell width |
| `--rdp-day_button-height` | `42px` | Inner button height |
| `--rdp-day_button-width` | `42px` | Inner button width |
| `--rdp-nav-height` | `2.75rem` | Nav bar height |
| `--rdp-nav_button-height` | `2.25rem` | Nav button height/width |
| `--rdp-weekday-padding` | `0.5rem 0` | Weekday header padding |

**None of these have any effect** in this project. Ignore them.

### shadcn's `--cell-size` variable — the only CSS variable that matters

Defined on the root element via the `className` prop. Consumed by Tailwind arbitrary-value utilities inside `calendar.tsx`. This is the **only CSS variable** in the sizing chain.

To set it globally for all Calendar instances add to `globals.css`:
```css
/* inside your :root or a scoped selector */
[data-slot="calendar"] {
  --cell-size: 1.75rem;
}
```

Or set it per-instance via the `className` prop (preferred — no global side effects):
```tsx
<Calendar className="[--cell-size:1.75rem]" ... />
```

---

## What NOT to Do

### Do not set `--rdp-day-height` / `--rdp-day-width` / any `--rdp-*` variable

These rdp variables are only consumed by `.rdp-*` CSS classes from the rdp stylesheet. The shadcn scaffold never imports that stylesheet and overwrites every class with Tailwind utilities. Setting `--rdp-*` variables has zero effect in this project.

### Do not replace individual `classNames` keys with empty strings to "remove" them

Passing an empty string for a key (e.g., `classNames={{ week: "" }}`) removes all spacing from that element but also removes functional classes like `flex w-full` that control layout. Override by providing a full replacement class string, not an empty one.

### Do not use `style={{ height: "Npx" }}` on the Calendar root to clip it

Clipping with a fixed height and `overflow: hidden` will visually truncate the last row of days without removing them from the layout — users can't see or tap the last few days of the month.

### Do not add `fixedWeeks={true}`

This forces exactly 6 week rows regardless of the actual month, making every month as tall as the worst case. It will worsen the overflow on short months and guarantee overflow on long ones.

### Do not nest the Calendar in a Popover to solve an inline overflow problem

The current implementation already uses a Popover. If the requirement is a compact inline calendar (PROJECT.md: "user wants compact inline calendar"), the Popover wrapper must be removed and the calendar rendered directly in the sheet scroll container. A Popover adds z-index stacking, its own padding (`PopoverContent`), and does not participate in the sheet's flex flow — it cannot be constrained by `max-h`.

### Do not pass `className` overrides to `classNames.root` to add padding

The `root` class in `classNames` applies to the inner `data-slot="calendar"` div, which is separate from the outer `p-3` padding that lives on the `<DayPicker>` element via `className`. Padding changes must go in `className` (outer), not `classNames.root`.

---

## Recommended Compact Configuration

```tsx
<Calendar
  mode="single"
  selected={...}
  onSelect={...}
  className="w-full p-2 [--cell-size:1.75rem]"
  classNames={{
    root: "w-full",
    months: "relative flex flex-col gap-2 md:flex-row",
    month: "flex w-full flex-col gap-2",
    week: "mt-1 flex w-full",
  }}
/>
```

This reduces total calendar height by approximately:
- `p-3 → p-2`: saves 0.5rem top + 0.5rem bottom = 1rem
- `--cell-size: 2rem → 1.75rem`: saves 0.25rem per cell row × 7 columns (day buttons are `min-w-[--cell-size]` but width is proportional so column width shrinks) — primary saving is nav row height
- `gap-4 → gap-2` on `month` and `months`: saves 0.5rem × 2 = 1rem
- `mt-2 → mt-1` on `week`: saves 0.25rem × 5 rows = 1.25rem

Total approximate saving: ~3.25rem (52px) off calendar height without any visual degradation.
