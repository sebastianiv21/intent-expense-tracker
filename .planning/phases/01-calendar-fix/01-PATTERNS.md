# Phase 01: Calendar Fix - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 3 modified files (4 date picker instances total)
**Analogs found:** 3 / 3 (all files are each other's analogs — identical pattern repeated)

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `web/components/transaction-sheet.tsx` | component | request-response (local UI state toggle) | `web/components/recurring-page.tsx` | exact |
| `web/components/recurring-page.tsx` | component | request-response (local UI state toggle) | `web/components/transaction-sheet.tsx` | exact |
| `web/components/budgets-page.tsx` | component | request-response (local UI state toggle) | `web/components/transaction-sheet.tsx` | exact |

All three files share the identical Popover + Calendar pattern. The fix template is the same for all four date picker instances (1 in `transaction-sheet.tsx`, 2 in `recurring-page.tsx`, 1 in `budgets-page.tsx`).

---

## Pattern Assignments

### `web/components/transaction-sheet.tsx` — date picker block (lines 443–477)

**Analog:** `web/components/recurring-page.tsx` lines 840–881 (same pattern, same Button classes, same Calendar props)

**Current imports to REMOVE** (lines 24–28):
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```
`Calendar` is already imported at line 23 — no new import needed.

**Current Popover + Calendar block** (lines 443–477) — REPLACE in full:
```tsx
<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    >
      <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
      {form.date ? (
        <span className="text-foreground">
          {format(parseISO(form.date), "MMMM d, yyyy")}
        </span>
      ) : (
        <span className="text-muted-foreground">Pick a date</span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent
    className="w-[var(--radix-popover-trigger-width)] p-0"
    align="start"
  >
    <Calendar
      mode="single"
      selected={form.date ? parseISO(form.date) : undefined}
      onSelect={(day) => {
        if (day) {
          updateField("date", format(day, "yyyy-MM-dd"));
          setDatePickerOpen(false);
        }
      }}
      className="w-full [--cell-size:2.25rem]"
      classNames={{ root: "w-full" }}
      autoFocus
    />
  </PopoverContent>
</Popover>
```

**Replacement inline toggle pattern:**
```tsx
<div>
  <Button
    variant="outline"
    className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    onClick={() => setDatePickerOpen((v) => !v)}
  >
    <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
    {form.date ? (
      <span className="text-foreground">
        {format(parseISO(form.date), "MMMM d, yyyy")}
      </span>
    ) : (
      <span className="text-muted-foreground">Pick a date</span>
    )}
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
      className="mt-2 w-full rounded-2xl border border-border bg-background p-2 [--cell-size:1.75rem]"
      classNames={{
        root: "w-full",
        month: "flex w-full flex-col gap-2",
        week: "mt-1 flex w-full",
      }}
      showOutsideDays={false}
      autoFocus
    />
  )}
</div>
```

**Key changes from current to replacement:**
- Remove `<Popover>`, `<PopoverTrigger asChild>`, `<PopoverContent>` wrappers
- Remove `asChild` from `<Button>` (it was implicit via `PopoverTrigger asChild` — the Button itself had no `asChild` prop, but `PopoverContent` with its Portal is gone)
- Add `onClick={() => setDatePickerOpen((v) => !v)}` directly on `<Button>`
- Wrap entire block in `<div>`
- Change `{datePickerOpen && <Calendar ...>}` conditional from inside `PopoverContent` to inline
- Change `className="w-full [--cell-size:2.25rem]"` to `className="mt-2 w-full rounded-2xl border border-border bg-background p-2 [--cell-size:1.75rem]"`
- Add `classNames={{ root: "w-full", month: "flex w-full flex-col gap-2", week: "mt-1 flex w-full" }}`
- Add `showOutsideDays={false}`
- Keep `autoFocus`

---

### `web/components/recurring-page.tsx` — start date picker (lines 840–881)

**Analog:** `web/components/transaction-sheet.tsx` lines 443–477

**Current imports to REMOVE** (lines 35–38):
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```
`Calendar` is already imported at line 39 — no new import needed.

**Current start date Popover + Calendar block** (lines 840–881) — REPLACE in full:
```tsx
<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    >
      <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
      {formState.startDate ? (
        <span className="text-foreground">
          {format(parseISO(formState.startDate), "MMMM d, yyyy")}
        </span>
      ) : (
        <span className="text-muted-foreground">Start date</span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent
    className="w-[var(--radix-popover-trigger-width)] p-0"
    align="start"
  >
    <Calendar
      mode="single"
      selected={formState.startDate ? parseISO(formState.startDate) : undefined}
      onSelect={(day) => {
        if (day) {
          setFormState((prev) => ({
            ...prev,
            startDate: format(day, "yyyy-MM-dd"),
          }));
          setDatePickerOpen(false);
        }
      }}
      className="w-full [--cell-size:2.25rem]"
      classNames={{ root: "w-full" }}
      autoFocus
    />
  </PopoverContent>
</Popover>
```

**Replacement inline toggle pattern (start date):**
```tsx
<div>
  <Button
    variant="outline"
    className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    onClick={() => setDatePickerOpen((v) => !v)}
  >
    <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
    {formState.startDate ? (
      <span className="text-foreground">
        {format(parseISO(formState.startDate), "MMMM d, yyyy")}
      </span>
    ) : (
      <span className="text-muted-foreground">Start date</span>
    )}
  </Button>
  {datePickerOpen && (
    <Calendar
      mode="single"
      selected={formState.startDate ? parseISO(formState.startDate) : undefined}
      onSelect={(day) => {
        if (day) {
          setFormState((prev) => ({
            ...prev,
            startDate: format(day, "yyyy-MM-dd"),
          }));
          setDatePickerOpen(false);
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
  )}
</div>
```

**Current end date Popover + Calendar block** (lines 883–935) — REPLACE in full:
```tsx
<Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    >
      <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
      {formState.endDate ? (
        <span className="text-foreground">
          {format(parseISO(formState.endDate), "MMMM d, yyyy")}
        </span>
      ) : (
        <span className="text-muted-foreground">End date (optional)</span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent
    className="w-[var(--radix-popover-trigger-width)] p-0"
    align="start"
  >
    <Calendar
      mode="single"
      selected={formState.endDate ? parseISO(formState.endDate) : undefined}
      fromDate={formState.startDate ? parseISO(formState.startDate) : undefined}
      onSelect={(day) => {
        if (day) {
          setFormState((prev) => ({
            ...prev,
            endDate: format(day, "yyyy-MM-dd"),
          }));
          setEndDatePickerOpen(false);
        }
      }}
      className="w-full [--cell-size:2.25rem]"
      classNames={{ root: "w-full" }}
      autoFocus
    />
  </PopoverContent>
</Popover>
```

**Replacement inline toggle pattern (end date):**
```tsx
<div>
  <Button
    variant="outline"
    className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    onClick={() => setEndDatePickerOpen((v) => !v)}
  >
    <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
    {formState.endDate ? (
      <span className="text-foreground">
        {format(parseISO(formState.endDate), "MMMM d, yyyy")}
      </span>
    ) : (
      <span className="text-muted-foreground">End date (optional)</span>
    )}
  </Button>
  {endDatePickerOpen && (
    <Calendar
      mode="single"
      selected={formState.endDate ? parseISO(formState.endDate) : undefined}
      fromDate={formState.startDate ? parseISO(formState.startDate) : undefined}
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
  )}
</div>
```

**End-date-only note:** Keep `fromDate` prop (line 916–918 in current code). Icon color is `text-muted-foreground` (not `text-primary`). State variable is `endDatePickerOpen` / `setEndDatePickerOpen` (not `datePickerOpen`).

---

### `web/components/budgets-page.tsx` — date picker block (lines 736–777)

**Analog:** `web/components/transaction-sheet.tsx` lines 443–477 (identical pattern)

**Current imports to REMOVE** (lines 23–27):
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```
`Calendar` is already imported at line 20 — no new import needed.

**Current Popover + Calendar block** (lines 736–777) — REPLACE in full:
```tsx
<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    >
      <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
      {formState.startDate ? (
        <span className="text-foreground">
          {format(parseISO(formState.startDate), "MMMM d, yyyy")}
        </span>
      ) : (
        <span className="text-muted-foreground">Start date</span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent
    className="w-[var(--radix-popover-trigger-width)] p-0"
    align="start"
  >
    <Calendar
      mode="single"
      selected={formState.startDate ? parseISO(formState.startDate) : undefined}
      onSelect={(day) => {
        if (day) {
          setFormState((prev) => ({
            ...prev,
            startDate: format(day, "yyyy-MM-dd"),
          }));
          setDatePickerOpen(false);
        }
      }}
      className="w-full [--cell-size:2.25rem]"
      classNames={{ root: "w-full" }}
      autoFocus
    />
  </PopoverContent>
</Popover>
```

**Replacement inline toggle pattern:**
```tsx
<div>
  <Button
    variant="outline"
    className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
    onClick={() => setDatePickerOpen((v) => !v)}
  >
    <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
    {formState.startDate ? (
      <span className="text-foreground">
        {format(parseISO(formState.startDate), "MMMM d, yyyy")}
      </span>
    ) : (
      <span className="text-muted-foreground">Start date</span>
    )}
  </Button>
  {datePickerOpen && (
    <Calendar
      mode="single"
      selected={formState.startDate ? parseISO(formState.startDate) : undefined}
      onSelect={(day) => {
        if (day) {
          setFormState((prev) => ({
            ...prev,
            startDate: format(day, "yyyy-MM-dd"),
          }));
          setDatePickerOpen(false);
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
  )}
</div>
```

---

## Shared Patterns

### Calendar Component Default Behavior (read-only reference)
**Source:** `web/components/ui/calendar.tsx` lines 14–44
- Default `showOutsideDays = true` (line 17) — must be overridden to `false` at all call sites
- Default `className` includes `[--cell-size:2rem]` (line 32) — call-site override to `[--cell-size:1.75rem]` wins via Tailwind merge
- Default `root` classNames: `cn("w-fit", defaultClassNames.root)` (line 44) — call-site `classNames={{ root: "w-full" }}` overrides this
- Default `week` classNames: `cn("mt-2 flex w-full", ...)` (line 93) — call-site `week: "mt-1 flex w-full"` reduces the top margin
- Default `month` classNames: `cn("flex w-full flex-col gap-4", ...)` (line 49) — call-site `month: "flex w-full flex-col gap-2"` reduces the gap
- The component is NOT modified — all changes are at call sites only

### Toggle State Pattern
**Source:** All three fix targets — existing `useState` booleans
- `datePickerOpen` / `setDatePickerOpen` — exists in all three files
- `endDatePickerOpen` / `setEndDatePickerOpen` — exists in `recurring-page.tsx` only
- Wiring change: `onOpenChange={setDatePickerOpen}` on `<Popover>` → `onClick={() => setDatePickerOpen((v) => !v)}` on `<Button>`

### Trigger Button Visual Pattern
**Source:** All three files — identical `<Button>` className across all instances
```tsx
variant="outline"
className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
```
Icon: `<CalendarIcon className="mr-3 h-4 w-4 text-primary" />` (all instances except end date in recurring-page which uses `text-muted-foreground`)

### Date Display Pattern
**Source:** All three files — consistent `date-fns` usage
```tsx
{format(parseISO(field.date), "MMMM d, yyyy")}
```
Storage format (written on select): `format(day, "yyyy-MM-dd")`

### Compact Calendar Props (universal template)
**Source:** RESEARCH.md + verified against all three files
```tsx
className="mt-2 w-full rounded-2xl border border-border bg-background p-2 [--cell-size:1.75rem]"
classNames={{
  root: "w-full",
  month: "flex w-full flex-col gap-2",
  week: "mt-1 flex w-full",
}}
showOutsideDays={false}
autoFocus
```
Both `className` with `w-full` AND `classNames={{ root: "w-full" }}` are required — one alone has no effect (Pitfall 1).

---

## No Analog Found

None — all four date picker instances follow an identical pattern. The fix template applies uniformly.

---

## Per-Instance Variation Summary

| Instance | File | Lines | State var | Field ref | Setter call | Icon color | Placeholder | Extra prop |
|----------|------|-------|-----------|-----------|-------------|------------|-------------|------------|
| Transaction date | `transaction-sheet.tsx` | 443–477 | `datePickerOpen` | `form.date` | `updateField("date", ...)` | `text-primary` | "Pick a date" | — |
| Recurring start | `recurring-page.tsx` | 840–881 | `datePickerOpen` | `formState.startDate` | `setFormState(prev => ({ ...prev, startDate: ... }))` | `text-primary` | "Start date" | — |
| Recurring end | `recurring-page.tsx` | 883–935 | `endDatePickerOpen` | `formState.endDate` | `setFormState(prev => ({ ...prev, endDate: ... }))` | `text-muted-foreground` | "End date (optional)" | `fromDate={formState.startDate ? parseISO(formState.startDate) : undefined}` |
| Budget start | `budgets-page.tsx` | 736–777 | `datePickerOpen` | `formState.startDate` | `setFormState(prev => ({ ...prev, startDate: ... }))` | `text-primary` | "Start date" | — |

---

## Metadata

**Analog search scope:** `web/components/` — all three fix targets read directly
**Files scanned:** 4 (transaction-sheet.tsx, recurring-page.tsx, budgets-page.tsx, ui/calendar.tsx)
**Pattern extraction date:** 2026-04-23
