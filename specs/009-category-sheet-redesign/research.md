# Research: Category Sheet Redesign

**Branch**: `009-category-sheet-redesign` | **Date**: 2026-03-27

## Summary

This is a pure UI redesign with no new external dependencies or integrations. All NEEDS CLARIFICATION items from the spec were resolved during `/speckit.clarify`. No blocking unknowns remain.

---

## Decision Log

### D-001: Suppress Radix Default Close Button

**Decision**: Use `[&>button]:hidden` Tailwind selector on `SheetContent` className to suppress the default Radix close button, then render a custom `<button>` in the header.

**Rationale**: The `SheetContent` component in `components/ui/sheet.tsx` always renders a `SheetPrimitive.Close` button as its last child. The `showCloseButton` prop does not exist in the current implementation. The `[&>button]:hidden` pattern is already in production use in `transaction-sheet.tsx` — adopting the same approach ensures parity and avoids modifying the shared `sheet.tsx` primitive.

**Alternatives considered**:
- Modify `sheet.tsx` to accept a `showCloseButton` prop — rejected because it modifies a shared UI primitive for a single use case.
- Overlay the default button with CSS `display: none` via a wrapper — equivalent to the chosen approach but less explicit.

---

### D-002: Emoji Selection via Grid Picker (Not Free-Text Input)

**Decision**: Replace the free-text emoji `<Input>` with a curated 30-emoji 5-column scrollable grid. Clicking a selected emoji deselects it (icon cleared to empty string).

**Rationale**: A curated grid eliminates input errors (e.g., multi-codepoint emoji sequences that exceed the `max(10)` Zod validation), provides a tactile touch-first interaction, and removes the need for users to know or type emoji shortcodes. The fixed set of 30 emojis covers the most common household/personal finance categories.

**Alternatives considered**:
- Keep free-text input alongside the grid — rejected (adds clutter; grid alone is sufficient).
- Use a third-party emoji picker library — rejected (violates Constitution Principle V; no new dependencies).

---

### D-003: Bucket Selection via Icon Pills (Not Tab or Plain Button Row)

**Decision**: Render allocation bucket selection as three icon pills (Home → Needs, Coffee → Wants, PiggyBank → Future) in a 3-column grid, using color-tinted border and background on selection.

**Rationale**: Icon pills are visually richer than plain text buttons and match the visual language of the `transaction-sheet.tsx` bucket selector. The icons (Home, Coffee, PiggyBank) carry semantic meaning that reinforces the 50/30/20 budget model. Colors are sourced from `BUCKET_DEFINITIONS` in `lib/finance-utils.ts` for consistency.

**Alternatives considered**:
- Tabs (shadcn/ui `<Tabs>`) — rejected; tabs imply switching between views, not selecting a single option.
- Radio buttons — rejected; too form-like and inconsistent with mobile-first tactile design.

---

### D-004: Footer Replace Cancel+Save with Single Gradient Button

**Decision**: Replace the two-button footer (Cancel + Save) with a single full-width gradient button. Dismissal is handled exclusively by the header X button.

**Rationale**: Reduces footer visual weight, creates a stronger primary action hierarchy, and matches the `transaction-sheet.tsx` pattern. Having two dismiss paths (Cancel in footer + X in header) is redundant. The header X button is immediately visible and accessible without scrolling.

**Alternatives considered**:
- Keep Cancel button in footer — rejected; redundant with header X, adds clutter.
- Use shadcn/ui default `<Button>` styling — rejected; the gradient treatment provides stronger visual hierarchy for a primary destructive-adjacent action on a dark-themed app.

---

### D-005: Duplicate Category Name Handling

**Decision**: No client-side uniqueness check. If a duplicate name exists, the server action returns an error that surfaces via the inline error message (FR-010).

**Rationale**: Resolved in `/speckit.clarify` session (2026-03-27). Client-side duplicate detection requires an additional lookup on every keystroke and introduces state synchronization risk. The existing `createCategory` and `updateCategory` server actions already propagate errors through the `ActionResult` type — the sheet's error state correctly surfaces these.

**Alternatives considered**:
- Client-side name uniqueness warning — rejected per clarification session.

---

### D-006: Swipe-to-Dismiss Behaviour

**Decision**: Swipe-to-dismiss is treated as incidental native Radix behaviour, not a separately tested acceptance criterion.

**Rationale**: Resolved in `/speckit.clarify` session (2026-03-27). Radix `Sheet` handles swipe-down via its `onOpenChange` callback, which the component already wires to close the sheet. No additional implementation work is needed; no separate test case is required.

---

## No Outstanding Unknowns

All items that could have been marked NEEDS CLARIFICATION were resolved either during spec authoring (emoji grid scope, bucket pill colors, Cancel button removal) or during the clarification session (name uniqueness, swipe-to-dismiss). No further research tasks are required before implementation.
