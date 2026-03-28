# Research: Categories Page Redesign

**Feature**: `008-categories-page-redesign`  
**Date**: 2026-03-27

## Overview

This feature is a pure UI redesign with no new external dependencies, no schema changes, and no API integrations. Research is therefore focused on interaction patterns and implementation decisions within the existing stack.

---

## Decision 1: Inline Delete Confirmation State Shape

**Decision**: Manage three orthogonal pieces of state for inline delete: `confirmingDeleteId`, `deletingId`, and `deleteError`.

```
confirmingDeleteId: string | null   // which card shows the confirmation prompt
deletingId: string | null           // which card is in-flight (loading)
deleteError: { id: string; message: string } | null  // which card has a server error
```

**Rationale**:
- These three states are mutually exclusive in practice: a card is either (a) normal, (b) awaiting confirmation, (c) deleting, or (d) showing an error after a failed delete. Separating them as three nullable IDs keeps the transitions explicit and avoids a complex enum state machine for two files.
- `confirmingDeleteId` and `deletingId` are never simultaneously set for the same card: clicking Confirm clears `confirmingDeleteId` and sets `deletingId`; on success the card disappears (router refresh); on error `deletingId` is cleared and `deleteError` is set.
- Using a single `deleteError` object (id + message) rather than a `Map` is sufficient because only one error can be active at a time given FR-008 (one confirmation at a time).

**Alternatives considered**:
- **Per-card state object (`Map<string, CardState>`)**: More scalable for many cards but significantly more complex for a feature where only one confirmation is ever active. Rejected per Principle V (Simplicity).
- **Optimistic removal (remove card immediately, restore on error)**: Rejected during clarification (Q2 answered as A) — pessimistic (card stays visible during in-flight) was chosen for consistency with FR-016 (inline error on card).
- **useReducer**: Valid but unnecessary for three simple nullable IDs. `useState` trio is idiomatic React for this scope.

---

## Decision 2: Bucket Color Application on Cards

**Decision**: Apply bucket color as a left border stripe (3–4px solid, using CSS `borderLeftColor` inline style) combined with a color-tinted emoji circle background (`backgroundColor` at ~15% opacity via hex + `1A`/`26` alpha suffix).

**Rationale**:
- A left border stripe is the most compact and unambiguous color signal — it does not compete with card content and is recognizable at a glance without reading text labels (SC-001).
- A full-card background tint risks reducing contrast of text content against the warm dark `--card` background, especially for the sage green bucket which is closest in luminance.
- The emoji circle tint (bucket color at low opacity) reinforces the signal at the focal point users naturally look at first.
- Both techniques use inline `style` props with values sourced from `getBucketColor()` (already in `lib/finance-utils.ts`), requiring zero new CSS.

**Alternatives considered**:
- **Full-card background tint only**: Rejected — insufficient contrast differentiation on the dark theme without raising opacity to levels that clash with the design aesthetic.
- **Top border stripe**: Rejected — less visible in a vertical list; left stripe is conventional for categorization in list UIs.
- **Colored icon/badge overlay**: Rejected — adds visual complexity without improving recognizability over the simpler stripe approach.

---

## Decision 3: Focus Management for Inline Delete Confirmation

**Decision**: When `confirmingDeleteId` is set, use a `useRef` + `useEffect` pattern to move focus to the "Confirm delete" button, and restore focus to the card's Delete button when the confirmation is cancelled or cleared.

**Rationale**:
- Constitution Principle IV (Accessibility) mandates WCAG 2.1 AA compliance, which requires focus to be managed when interactive content changes contextually. Replacing the Delete/Edit buttons with Confirm/Cancel buttons without moving focus would leave keyboard users disoriented.
- `useRef` on the confirm button + `ref.current?.focus()` in a `useEffect` triggered by `confirmingDeleteId` change is the idiomatic React pattern for imperative focus management — no external library needed.
- Focus restoration on cancel (back to Delete button) is achieved by storing a `deleteButtonRef` keyed by category ID, or equivalently by re-rendering the button and relying on the browser's focus restoration heuristics (acceptable here since the button is same-DOM-position).

**Alternatives considered**:
- **No focus management**: Rejected — violates Constitution Principle IV and WCAG 2.1 AA.
- **Focus trap (like a dialog)**: Rejected — inline confirmation is not a modal; a focus trap would prevent scrolling and feel unnatural.

---

## Decision 4: Live Emoji Preview Implementation

**Decision**: Render the emoji preview as a `<div>` or `<span>` above the emoji `<Input>` displaying `formState.icon || '•'` (neutral bullet fallback), styled at `text-4xl` with a color-tinted circle background matching the selected bucket/type.

**Rationale**:
- The preview is already available as a derived value from `formState.icon` — no additional state is needed.
- The circle styling mirrors the category card's emoji display, giving users a true preview of how the category will appear in the list.
- The neutral bullet `•` is already used as the fallback glyph on cards (current code: `category.icon ?? "•"`), making it a consistent placeholder.

**Alternatives considered**:
- **Emoji picker component**: Out of scope per spec assumption ("no emoji picker UI required").
- **Preview as the Input itself (styled large)**: Rejected — Input fields have constraints (cursor, selection behaviour) that make them unsuitable as display elements.

---

## Decision 5: Skeleton Pill Shapes

**Decision**: Add three `<Skeleton>` components in a `flex gap-2` row to `CategoriesSkeleton`, each styled as `h-10 w-24 rounded-full`, matching the approximate dimensions of the real bucket filter pills.

**Rationale**:
- The existing skeleton already renders tab and card placeholders. Adding a pill row between them mirrors the real page layout, minimising layout shift (SC-005).
- `rounded-full` on a `h-10 w-24` `<Skeleton>` produces the correct pill appearance using the existing `<Skeleton>` primitive from shadcn/ui — no new component needed.

**Alternatives considered**:
- **Single wide skeleton bar for the pill row**: Rejected — doesn't approximate the real layout closely enough; individual pills better signal what's loading.

---

## Summary of No-Research-Needed Items

| Item | Reason |
|------|--------|
| New dependencies | None introduced — Principle V compliant |
| Schema / migration | No data model changes |
| Server Actions / queries | Unchanged |
| Authentication / security | Not applicable |
| External API integrations | None |
| Performance benchmarking | No new network calls or compute |
