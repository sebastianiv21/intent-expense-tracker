# Phase 1: Calendar Fix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 01-calendar-fix
**Areas discussed:** Scope, Toggle behavior, Notes layout

---

## Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Los 3 componentes | transaction-sheet + recurring-page + budgets-page — mismo bug, mismo fix | ✓ |
| Solo transaction-sheet | Solo el que aparece en las screenshots, los demás después | |

**User's choice:** Fix all 3 components  
**Notes:** User initiated this topic ("hay otros lugares donde también hay datepickers") — surfaced during gray area selection. Recurring-page has 2 date pickers (start + end date), budgets-page has 1.

---

## Toggle Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Al seleccionar fecha + tap en trigger | Tap abre/cierra. Seleccionar fecha también cierra | ✓ |
| Solo al seleccionar fecha | Solo cierra al elegir día | |

**User's choice:** Toggle on trigger tap AND on date selection  
**Notes:** `datePickerOpen` state already exists — just needs `onClick` toggle instead of Popover's `onOpenChange`.

---

## Notes Layout When Calendar Open

| Option | Description | Selected |
|--------|-------------|----------|
| Queda debajo del calendario | Todo apilado, scroll si es necesario | ✓ |
| Se oculta cuando el calendario está abierto | Textarea desaparece mientras calendario visible | |

**User's choice:** Notes textarea stays below calendar, user scrolls  
**Notes:** The form body is already `overflow-y-auto` — no layout change needed for notes.

---

## Claude's Discretion

- `autoFocus` on inline Calendar — keep for keyboard/a11y
- Remove now-unused Popover imports after fix
- `recurring-page.tsx` keeps independent state for start/end date pickers

## Deferred Ideas

None.
