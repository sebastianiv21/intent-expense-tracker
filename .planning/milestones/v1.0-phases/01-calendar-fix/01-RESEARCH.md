# Phase 01: Calendar Fix - Research

**Researched:** 2026-04-23
**Domain:** shadcn/ui Calendar, react-day-picker v9, Radix UI Popover, Tailwind CSS 4.x inline layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Fix applies to ALL THREE components:
  1. `web/components/transaction-sheet.tsx` — 1 date picker (transaction date)
  2. `web/components/recurring-page.tsx` — 2 date pickers (start date + end date)
  3. `web/components/budgets-page.tsx` — 1 date picker (budget start date)
- **D-02:** Remove `<Popover>`, `<PopoverTrigger>`, `<PopoverContent>` wrapper from each date picker.
- **D-03:** Replace with a plain `<Button variant="outline">` that toggles `datePickerOpen` state; render `<Calendar>` conditionally inline directly below the trigger.
- **D-04:** Calendar opens AND closes by tapping the trigger button (toggle). Selecting a date also closes it.
- **D-05:** Reuse existing `datePickerOpen` boolean state; change `onOpenChange` wiring to `onClick={() => setDatePickerOpen(v => !v)}`.
- **D-06:** Set `--cell-size` to `1.75rem` (down from `2.25rem` currently at call sites).
- **D-07:** Add `showOutsideDays={false}`.
- **D-08:** Reduce inter-row and month gaps:
  - `month: "flex w-full flex-col gap-2"` (was `gap-4`)
  - `week: "mt-1 flex w-full"` (was `mt-2`)
  - Add `p-2` override (was default `p-3`)
- **D-09:** Keep `className="w-full"` and `classNames={{ root: "w-full" }}` on all Calendar instances.
- **D-10:** Notes textarea stays visible below the calendar; no hiding/collapsing adjacent fields.

### Claude's Discretion

- Keep `autoFocus` prop on inline Calendar to preserve keyboard navigation.
- Remove unused `Popover`, `PopoverContent`, `PopoverTrigger` imports after the fix.
- In `recurring-page.tsx`, start/end date pickers use independent state (`datePickerOpen` + `endDatePickerOpen`) — already the case.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATE-01 | Calendar fits compactly inside the "New Awareness" sheet without overflowing or overlapping other elements (mobile and desktop) | Inline rendering eliminates portal overflow; `--cell-size:1.75rem` + spacing reductions save ~52px |
| DATE-02 | Selected date label does not render trapped inside the calendar day grid | Architectural fix: removing Popover/Portal eliminates the Radix z-index stacking conflict that causes the appearance of content being "inside" the grid |
| DATE-03 | "Add" / submit button is never obscured by the calendar's last row of days | Footer is in a pinned `border-t bg-card` div outside the scroll container; `showOutsideDays={false}` prevents 6-row months |
| SIZE-01 | Calendar cell size uses `--cell-size: 1.75rem` | Set via `className="... [--cell-size:1.75rem]"` on the `<Calendar>` call site |
| SIZE-02 | Calendar inter-row gap reduced (`mt-1` on week rows, `gap-2` on month wrapper) | Set via `classNames={{ month: "flex w-full flex-col gap-2", week: "mt-1 flex w-full" }}` |
| SIZE-03 | `showOutsideDays={false}` is set to prevent 6-row months | Passed as a prop to `<Calendar>` at all three call sites |
</phase_requirements>

---

## Summary

This phase is a focused structural fix: replace the Radix Popover portal pattern with a toggled inline Calendar in three components. The root cause is definitively identified — `PopoverPrimitive.Portal` teleports the calendar to `<body>`, escaping the sheet's `overflow-y-auto` scroll container and causing overflow/overlap bugs. The fix requires no new libraries, no changes to shared components, and no state or action modifications.

The three affected files (`transaction-sheet.tsx`, `recurring-page.tsx`, `budgets-page.tsx`) all use an identical Popover + Calendar pattern, so a single fix template applies to all four date picker instances (1 + 2 + 1). Existing `datePickerOpen` / `endDatePickerOpen` boolean state is already present in all three files and simply needs its wiring changed from `onOpenChange` to `onClick`.

Companion sizing changes (`--cell-size: 1.75rem`, reduced gap classNames, `showOutsideDays={false}`, `p-2` padding override) reduce total calendar height by approximately 52px, ensuring the calendar fits comfortably on 375×667 viewports without scroll confusion. The calendar component itself (`web/components/ui/calendar.tsx`) is not modified — all changes are at the call sites.

**Primary recommendation:** Remove the three-file Popover wrappers, render Calendar inline with toggle, apply compact sizing props. Four date picker instances, one fix template.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Date picker toggle state | Browser / Client | — | Local UI state (`useState` boolean) in client components |
| Calendar rendering | Browser / Client | — | React client component; in-flow DOM element within the sheet scroll container |
| Calendar sizing (CSS) | Browser / Client | — | Tailwind utility classes and CSS custom property `--cell-size` applied at render time |
| Sheet scroll containment | Browser / Client | — | `flex-1 overflow-y-auto` div in each sheet component; inline calendar participates naturally |
| Footer button visibility | Browser / Client | — | Pinned `border-t bg-card` div outside the scroll container; always in viewport |
| Import cleanup | — | — | Build-time only; no runtime tier |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-day-picker | 9.14.0 | Date picker primitive underlying shadcn Calendar | Already installed; shadcn Calendar wraps it |
| shadcn/ui Calendar | (scaffold) | Component at `web/components/ui/calendar.tsx` | Already installed; project constraint requires no replacement |
| Tailwind CSS | 4.x | Utility classes for sizing, spacing, layout | Project standard; all classNames overrides use Tailwind utilities |
| date-fns | 4.1.0 | `format`, `parseISO` for date display and serialization | Already used in all three fix targets |

[VERIFIED: codebase grep — `web/components/ui/calendar.tsx`, `web/package.json` / CLAUDE.md stack section]

### Removed

| Import | From File | Why Removed |
|--------|-----------|-------------|
| `Popover`, `PopoverContent`, `PopoverTrigger` | `transaction-sheet.tsx` lines 24–28 | No longer used after fix |
| `Popover`, `PopoverContent`, `PopoverTrigger` | `recurring-page.tsx` lines 34–38 | No longer used after fix |
| `Popover`, `PopoverContent`, `PopoverTrigger` | `budgets-page.tsx` lines 23–27 | No longer used after fix |

[VERIFIED: Read of all three files — imports confirmed at those lines]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline inline toggle | Keep Popover + max-h + overflow-auto on PopoverContent | Popover portal is the root cause; clamping its height is a workaround that doesn't fix z-index stacking conflicts (DATE-02) — rejected by ARCHITECTURE.md |
| `--cell-size: 1.75rem` | `--cell-size: 1.625rem` | 1.75rem keeps 28px tap targets; below 1.5rem fails mobile accessibility minimums |

---

## Architecture Patterns

### System Architecture Diagram

```
User taps trigger button
        │
        ▼
onClick → setDatePickerOpen(v => !v)
        │
        ├─ open=false → Calendar hidden (conditional render)
        │
        └─ open=true
                │
                ▼
        <Calendar> rendered inline
        in sheet's flex-1 overflow-y-auto div
                │
                ├─ User scrolls within sheet body to reach
                │  content below calendar (natural overflow-y-auto)
                │
                └─ User selects a date
                        │
                        ▼
                onSelect → updateField(date) → setDatePickerOpen(false)
                        │
                        ▼
                Calendar hidden; form field updated
                Footer "Add" button remains pinned outside scroll container
```

### Recommended Component Structure (no file changes — fix is in-place)

```
web/components/
├── transaction-sheet.tsx    ← lines 443–477: replace Popover block with inline Calendar
├── recurring-page.tsx       ← lines 840–881: replace start date Popover block
│                              lines 883–935: replace end date Popover block
├── budgets-page.tsx         ← lines 736–777: replace Popover block with inline Calendar
└── ui/
    ├── calendar.tsx         ← UNCHANGED — only call-site props change
    └── popover.tsx          ← UNCHANGED — imports removed from fix targets
```

### Pattern: Inline Toggled Calendar

**What:** Replace the Popover/Portal wrapper with a plain toggle and conditional render.

**When to use:** Any context where a calendar must live inside a scroll container (Radix Sheet, Dialog, drawer) rather than floating outside the DOM via a portal.

**Template (applies identically to all 4 date picker instances):**

```tsx
// Source: ARCHITECTURE.md recommended fix + verified against live code in transaction-sheet.tsx lines 443–477
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

**Per-file variations from the template:**

| File | Field ref | `updateField` / setter | Trigger icon color | Placeholder text |
|------|-----------|------------------------|--------------------|-----------------|
| `transaction-sheet.tsx` | `form.date` | `updateField("date", ...)` | `text-primary` | "Pick a date" |
| `recurring-page.tsx` start | `formState.startDate` | `setFormState(prev => ({ ...prev, startDate: ... }))` | `text-primary` | "Start date" |
| `recurring-page.tsx` end | `formState.endDate` | `setFormState(prev => ({ ...prev, endDate: ... }))` | `text-muted-foreground` | "End date (optional)" |
| `budgets-page.tsx` | `formState.startDate` | `setFormState(prev => ({ ...prev, startDate: ... }))` | `text-primary` | "Start date" |

**Extra prop for end date picker only** (keep from existing code):
```tsx
fromDate={formState.startDate ? parseISO(formState.startDate) : undefined}
```
[VERIFIED: Read of `recurring-page.tsx` lines 916–918 — `fromDate` prop is present in the existing end date Calendar]

### Anti-Patterns to Avoid

- **Keeping `asChild` on the trigger Button:** Once `<PopoverTrigger asChild>` is removed, the `asChild` prop must also be removed. A standalone `<Button>` does not accept `asChild` meaningfully.
- **Adding `overflow-hidden` to contain the calendar:** Breaks the horizontal category chip scroll row (`-mx-6 overflow-x-auto`) and clips focus rings. Do not add any `overflow-hidden` ancestor.
- **Adding `fixedWeeks={true}`:** Forces 6 rows every month — makes overflow worse. Do not add it.
- **Setting `--rdp-*` CSS variables:** These have zero effect in this project because the shadcn scaffold does not import react-day-picker's stylesheet. Use only `--cell-size`.
- **Using `style={{ height: "Npx" }}` to clip the calendar:** Truncates last row visually but days remain in the DOM and are inaccessible.
- **Passing `classNames` key with an empty string:** Removes layout classes like `flex w-full` — always provide a full replacement, not an empty string.
- **Adding `import 'react-day-picker/dist/style.css'`:** Breaks all shadcn classNames overrides by injecting un-layered CSS that outranks Tailwind utilities in the CSS 4.x cascade.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar sizing | Custom CSS height calculations | `--cell-size` CSS variable on `className` prop | Single source of truth for all calendar dimensions: nav height, caption height, cell min-width |
| Calendar layout | Flex shrink / min-h-0 on calendar container | `showOutsideDays={false}` + `--cell-size` reduction | Calendar is table-based; flex shrink has no effect on fixed-cell table rows |
| Toggle close on date select | External click-away handler | `onSelect` callback already receives `day` — call `setDatePickerOpen(false)` there | react-day-picker fires `onSelect` on user date selection; no extra listener needed |

**Key insight:** All calendar sizing flows from a single `--cell-size` CSS custom property. Any attempt to resize individual elements independently (day buttons, nav, caption) creates inconsistent row heights. The correct lever is always the CSS variable.

---

## Common Pitfalls

### Pitfall 1: Calendar renders narrow after Popover removal
**What goes wrong:** Calendar defaults to `w-fit` (defined in `calendar.tsx` line 44: `cn("w-fit", defaultClassNames.root)`). After removing the Popover, the calendar appears narrow and left-aligned.
**Why it happens:** `root` classNames key defaults to `w-fit` for popover use cases.
**How to avoid:** Always pass both `className="... w-full"` AND `classNames={{ root: "w-full" }}`. The existing call sites already do this — carry it forward verbatim.
**Warning signs:** Calendar appears narrow; adding `className="w-full"` alone has no effect.

### Pitfall 2: `--cell-size` not propagating uniformly
**What goes wrong:** Day buttons shrink but nav arrows and month caption row stay tall, creating misaligned rows.
**Why it happens:** All sizing flows from `--cell-size`. Overriding individual element classes breaks proportional sizing.
**How to avoid:** Only change `--cell-size` via the `className` prop: `[--cell-size:1.75rem]`. Do not set `h-*` on individual classNames keys.
**Warning signs:** Nav buttons and caption row are taller than day cell rows.

### Pitfall 3: 6-row months overflow on short viewports
**What goes wrong:** April 2026 with `showOutsideDays={true}` (the default) renders 6 rows. At `--cell-size: 1.75rem` that adds ~1.75rem to total height. On iPhone SE (375×667) the calendar plus form content exceeds the scroll container height.
**Why it happens:** `showOutsideDays` defaults to `true` in `calendar.tsx` line 17.
**How to avoid:** Set `showOutsideDays={false}` at every call site in this phase.
**Warning signs:** Bug appears intermittently — reproduces in April, May, July 2026 (6-row months) but not in shorter months.

### Pitfall 4: "Add" button appears missing on short viewports
**What goes wrong:** When the calendar is open and the form is long, users on 375×667 devices don't see the "Add" button.
**Why it happens:** The "Add" button is already in the pinned footer outside the scroll container — it is always visible. The perceived problem is that the calendar + form content fills the scroll area and users don't realize they can scroll to see notes.
**How to avoid:** Keep the footer in its pinned position (it already is — do not move it inside the scroll area). Compact sizing (`--cell-size: 1.75rem` + spacing reductions) keeps the total calendar height manageable. Verify on 375×667 after implementing.
**Warning signs:** D-10 says notes textarea stays visible and that scrolling is the accepted UX.

### Pitfall 5: `asChild` prop left on Button after PopoverTrigger removal
**What goes wrong:** Build error or unexpected behavior from orphaned `asChild` prop.
**How to avoid:** When removing `<PopoverTrigger asChild>`, also remove the `asChild` prop from the inner `<Button>`. The Button should be a standalone element with `onClick`.

### Pitfall 6: Popover imports not removed
**What goes wrong:** Unused imports cause ESLint warnings (TypeScript unused-vars rule). The project uses `eslint-config-next/typescript` which flags unused imports.
**How to avoid:** Remove `Popover`, `PopoverContent`, `PopoverTrigger` from all three files after the fix. Confirm no other Popover usage exists in the file before removing.
**Warning signs:** `pnpm build` or `pnpm lint` produces "X is defined but never used" for Popover imports.

---

## Code Examples

### Complete compact Calendar props (all 4 instances use this shape)

```tsx
// Source: CONTEXT.md D-06, D-07, D-08, D-09; STACK.md recommended compact configuration
<Calendar
  mode="single"
  selected={...}
  onSelect={(day) => {
    if (day) {
      // update field
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
```

### What NOT to carry forward from existing Calendar call sites

```tsx
// REMOVE — the [--cell-size:2.25rem] override that makes the calendar too tall
className="w-full [--cell-size:2.25rem]"

// REPLACE WITH:
className="mt-2 w-full rounded-2xl border border-border bg-background p-2 [--cell-size:1.75rem]"
```

### Import block changes per file

**transaction-sheet.tsx** — remove lines 24–28:
```tsx
// REMOVE:
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```

**recurring-page.tsx** — remove lines 34–38:
```tsx
// REMOVE:
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```

**budgets-page.tsx** — remove lines 23–27:
```tsx
// REMOVE:
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
```

Note: `Calendar` import is already present in all three files — no new import needed.
[VERIFIED: Read of all three files — Calendar already imported; Popover imports confirmed at stated lines]

### Height savings calculation

| Change | Savings |
|--------|---------|
| `p-3` → `p-2` on root | 0.5rem top + 0.5rem bottom = 1rem (~16px) |
| `gap-4` → `gap-2` on `month` | 1rem × 1 occurrence = 1rem (~16px) |
| `mt-2` → `mt-1` on each `week` row (5 rows) | 0.25rem × 5 = 1.25rem (~20px) |
| `--cell-size: 2.25rem` → `1.75rem` (nav + caption height) | ~0.5rem per row = nav savings ~8px |
| **Total** | **~52–60px saved** |

[VERIFIED: STACK.md "Total approximate saving" section; REQUIREMENTS.md SIZE-02]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<Popover open={x} onOpenChange={setX}>` wrapping Calendar | `<Button onClick={() => setX(v => !v)}>` + `{x && <Calendar>}` | This phase | Eliminates portal overflow; Calendar in normal document flow |
| `[--cell-size:2.25rem]` in className | `[--cell-size:1.75rem]` + `p-2` + `gap-2` + `mt-1` | This phase | ~52px height reduction |
| `showOutsideDays={true}` (default) | `showOutsideDays={false}` | This phase | Prevents 6-row months |

**No deprecated APIs touched:** This fix uses only existing props and does not require upgrading react-day-picker or shadcn Calendar. The `fromDate` prop on the end date Calendar in `recurring-page.tsx` is kept unchanged.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**All claims in this research were verified by reading live codebase files.** No assumed claims — every finding is sourced from `ARCHITECTURE.md`, `STACK.md`, `PITFALLS.md`, `CONTEXT.md`, or direct file reads of the three fix targets and `calendar.tsx`.

---

## Open Questions

None — scope is fully defined. All code to change has been read and verified. All sizing decisions are locked in CONTEXT.md.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely in-place code edits with no external dependencies. No new libraries, tools, services, or CLIs are required.

---

## Sources

### Primary (HIGH confidence)
- `web/components/ui/calendar.tsx` — live component source; `--cell-size` default, `classNames` merge order, `root: "w-fit"` default
- `web/components/transaction-sheet.tsx` lines 1–30, 443–485 — current Popover + Calendar block (primary fix target)
- `web/components/recurring-page.tsx` lines 1–60, 839–935 — start + end date Popover blocks
- `web/components/budgets-page.tsx` lines 1–30, 736–785 — date Popover block
- `web/components/ui/popover.tsx` — confirms `PopoverPrimitive.Portal` is unconditionally used (root cause)
- `.planning/research/ARCHITECTURE.md` — root cause analysis and height measurements
- `.planning/research/STACK.md` — shadcn Calendar sizing API; `--cell-size` chain; what NOT to do
- `.planning/research/PITFALLS.md` — 9 specific pitfalls; per-phase warnings table
- `.planning/phases/01-calendar-fix/01-CONTEXT.md` — all locked decisions
- `.planning/phases/01-calendar-fix/01-UI-SPEC.md` — interaction contract, before/after summary

### Secondary (MEDIUM confidence)
- `.planning/requirements.md` — requirement IDs and descriptions
- `CLAUDE.md` — project stack constraints, naming conventions, import conventions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries read from installed codebase; no version uncertainty
- Architecture: HIGH — root cause confirmed by reading `popover.tsx` Portal source directly
- Pitfalls: HIGH — sourced from prior research session (`PITFALLS.md`) which was derived from installed `node_modules/react-day-picker` source code
- Fix template: HIGH — derived from ARCHITECTURE.md recommendation + verified against live call site patterns

**Research date:** 2026-04-23
**Valid until:** Indefinite for this scoped fix — no external dependency versions change
