# Phase 3: Data Layer Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 03-data-layer-integration
**Areas discussed:** Currency selector placement

---

## Currency selector placement

| Option | Description | Selected |
|--------|-------------|----------|
| Tappable prefix replaces $ | Hardcoded `$` becomes a tappable badge showing currency code; tap opens popover | ✓ |
| Separate row below amount | Dedicated selector row between amount and expense/income toggle | |
| Small badge overlaid on amount area | Currency chip floats in top-right corner of amount card | |

**User's choice:** Tappable prefix replaces $

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown/popover | Small popover below badge, matches date picker pattern | ✓ |
| Inline expand | Badge expands into pill group showing all currencies | |

**User's choice:** Dropdown/popover

---

| Option | Description | Selected |
|--------|-------------|----------|
| Only USD + COP | Hardcoded two currencies the app is used in | ✓ |
| Full list from financial profile | Reuse 30-currency list from profile settings | |
| User-configurable subset | User pins preferred currencies in settings | |

**User's choice:** Only USD + COP

---

| Option | Description | Selected |
|--------|-------------|----------|
| Currency code (COP / USD) | Badge shows code — consistent, unambiguous | ✓ |
| Currency symbol (COL$ / $) | Shows localized symbol | |

**User's choice:** Currency code (COP / USD)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Always user's base currency (USD) | Simple and predictable default | ✓ |
| Remember last-used currency | Opens with last transaction's currency pre-selected | |

**User's choice:** Always user's base currency (USD)

---

## Claude's Discretion

- Conversion preview (ENTRY-03) timing and implementation approach
- Edit form pre-fill: original_amount vs. base amount (defaulting to original_amount)
- Rate fetch failure UX (blocking error, not silent fallback)
- COP amount formatting (no decimals)
- Zod schema currency field type (`z.string().length(3)` vs `z.enum(["USD","COP"])`)

## Deferred Ideas

- Remember last-used currency across sessions
- Full 30-currency list expansion
- User-configurable pinned currencies in settings
