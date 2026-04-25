# Milestones

## v1.0 Date Picker Fix (Shipped: 2026-04-25)

**Phases completed:** 1 phases, 4 plans, 5 tasks

**Key accomplishments:**

- Radix Popover/Portal date picker replaced with inline toggled shadcn Calendar using compact sizing ([--cell-size:1.75rem], showOutsideDays=false) to fix calendar overflow/overlap bug in the New Awareness transaction sheet
- Replaced Radix Popover portal date picker in budgets-page.tsx with toggled inline Calendar using compact sizing ([--cell-size:1.75rem])
- Replaced both Radix Popover portal date pickers in recurring-page.tsx with toggled inline Calendars using compact sizing ([--cell-size:1.75rem]) and independent toggle state per picker
- Human confirmed inline calendar renders correctly on all three surfaces (mobile + desktop)

---
