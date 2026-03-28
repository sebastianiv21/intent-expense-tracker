# Feature Specification: Categories Page Redesign

**Feature Branch**: `008-categories-page-redesign`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "Redesign the Categories page UI for the intent-expense-tracker app — a personal finance tracker with a warm dark theme, deep brown background, terracotta accent. Category cards need bucket color accents, emoji circles with color-tinted backgrounds, inline delete confirmation. Bucket filter pills need color-coded active states. Empty state needs atmosphere. Create/edit sheet needs live emoji preview and color-coded bucket selector. Loading skeleton needs pill skeletons."

## Overview

The Categories page allows users to view, create, edit, and delete their spending and income categories. Categories are organized into three allocation buckets (Needs, Wants, Future) for expenses, and a separate Income type. The current design is functionally complete but visually flat — cards lack differentiation, delete confirmation is disruptive, and the form sheet lacks visual polish. This redesign improves the visual hierarchy, communicates bucket identity through color, and streamlines destructive actions — all within the app's established warm dark aesthetic.

## Clarifications

### Session 2026-03-27

- Q: When the delete server action returns an error after inline confirmation, what should the user experience be? → A: Show an inline error message on the card and restore it to its normal (non-confirmation) state.
- Q: Should the card be removed immediately on confirmation (optimistic), or stay visible in a loading/disabled state while the server processes? → A: Card stays visible in a disabled/loading state until the server responds; removed on success, restored with error on failure.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Scan Categories by Bucket at a Glance (Priority: P1)

As a user reviewing my spending structure, I want to see at a glance which bucket each category belongs to, so I can quickly understand how my spending is organized without reading labels.

**Why this priority**: The core value of the categories list is recognizability. If bucket identity is not immediately apparent, users must read every label — this is the most fundamental usability improvement.

**Independent Test**: Can be fully tested by loading the categories page with at least one expense category per bucket and verifying that each category card is visually distinguished by its bucket without the user needing to read the bucket text label.

**Acceptance Scenarios**:

1. **Given** I am on the Categories page viewing expenses, **When** I look at the category list, **Then** each card visually signals its bucket (Needs / Wants / Future) through color — without relying solely on text.
2. **Given** I switch to the Income tab, **When** I look at the category list, **Then** Income categories are styled with a distinct visual treatment separate from the three expense buckets.
3. **Given** the list contains multiple categories in the same bucket, **When** I scan the list, **Then** all cards in that bucket share a consistent color identity.

---

### User Story 2 — Filter by Bucket with Clear Active State (Priority: P1)

As a user browsing expense categories, I want the active bucket filter to be immediately obvious, so I always know which bucket I am currently viewing.

**Why this priority**: The bucket filter is the primary navigation mechanism for expense categories. An unclear active state causes orientation errors and erodes trust.

**Independent Test**: Can be fully tested by toggling between Needs, Wants, and Future filters and confirming the active pill is unmistakably distinct from the inactive ones.

**Acceptance Scenarios**:

1. **Given** I am viewing expenses, **When** I tap a bucket filter pill, **Then** the active pill displays in the bucket's color with a stronger background tint, clearly distinct from inactive pills.
2. **Given** an active filter is selected, **When** I look at inactive pills, **Then** they appear visibly dimmed compared to the active selection.

---

### User Story 3 — Delete a Category Without a Disruptive Popup (Priority: P2)

As a user who wants to remove an outdated category, I want to confirm the deletion within the list without a browser dialog interrupting my flow, so the experience feels native and controlled.

**Why this priority**: `window.confirm` is jarring on mobile and breaks the design language. An inline confirmation improves the interaction quality meaningfully, but it does not block basic functionality.

**Independent Test**: Can be fully tested by initiating a delete on a category, confirming the inline confirmation appears, then verifying the category is removed after confirmation — and that cancelling leaves it intact.

**Acceptance Scenarios**:

1. **Given** I am viewing a category card, **When** I tap the Delete button, **Then** the card's action area transforms inline to show a "Confirm delete?" prompt with confirm and cancel options — no browser dialog appears.
2. **Given** the inline confirmation is visible, **When** I tap Confirm, **Then** the category is deleted and the card is removed from the list.
3. **Given** the inline confirmation is visible, **When** I tap Cancel, **Then** the card returns to its normal state and the category remains.
4. **Given** I trigger delete on one category and then interact with a different card, **Then** the first card's confirmation state is dismissed.

---

### User Story 4 — Create or Edit a Category with Live Emoji Preview (Priority: P2)

As a user adding a new category, I want to see a large live preview of the emoji I type, so I can quickly confirm my choice looks right before saving.

**Why this priority**: The emoji is the most visually prominent element of each card. A live preview reduces save-and-check iteration and improves confidence during creation.

**Independent Test**: Can be fully tested by opening the create sheet, typing an emoji character in the emoji field, and verifying a large preview updates in real time above the input.

**Acceptance Scenarios**:

1. **Given** I open the create or edit category sheet, **When** I type an emoji in the emoji field, **Then** a large preview of that emoji updates in real time above the input.
2. **Given** the emoji field is empty, **When** the sheet is open, **Then** a neutral placeholder glyph occupies the preview area.
3. **Given** I select an allocation bucket in the form, **When** I look at the bucket selector, **Then** the selected bucket button is highlighted using its own color — consistent with how filters appear on the main list.

---

### User Story 5 — Experience an Informative Empty State (Priority: P3)

As a new user with no categories yet, I want the empty state to feel intentional and guide me to take action, rather than showing a generic dashed box.

**Why this priority**: First-run experience quality matters, but an empty state is only seen once per bucket. It is lower priority than core list and form improvements.

**Independent Test**: Can be fully tested by viewing a bucket or type tab that has no categories and confirming the empty state communicates purpose and provides a clear action path.

**Acceptance Scenarios**:

1. **Given** I navigate to a bucket with no categories, **When** the page loads, **Then** I see an atmospheric empty state with a descriptive icon, heading, supporting text, and a visible action to add a category.
2. **Given** the empty state is shown, **When** I tap the add action within it, **Then** the create category sheet opens.

---

### User Story 6 — See an Accurate Loading Skeleton (Priority: P3)

As a user on a slow connection, I want the loading state to approximate the real page layout — including the bucket filter pills — so the page feels stable when content loads in.

**Why this priority**: Skeleton accuracy reduces layout shift perception, but is a polish concern secondary to the core redesign items.

**Independent Test**: Can be fully tested by observing the loading skeleton and confirming it includes placeholder shapes for the bucket filter pills in addition to the card skeletons.

**Acceptance Scenarios**:

1. **Given** the categories page is loading, **When** the skeleton is displayed, **Then** it includes placeholder shapes that approximate the bucket filter pill row.
2. **Given** the skeleton is visible, **When** content loads, **Then** the layout shift is minimal because skeleton shapes match the real layout.

---

### Edge Cases

- What happens when a category has no emoji set? The card should display a neutral fallback glyph rather than blank space.
- How does the system handle a user triggering delete on two different cards in rapid succession? Only the most recently triggered inline confirmation should be active; the earlier one should dismiss.
- What happens if the emoji preview field receives non-emoji text? The preview should render whatever character is entered, without filtering.
- What happens if a user opens the edit sheet while an inline delete confirmation is visible? The confirmation should dismiss when the sheet opens.
- What happens when all buckets have zero categories? Each bucket filter pill should still render with its count of zero.
- What happens if the delete server action returns an error after the user confirms inline? The card restores to its normal (non-confirmation) state and displays an inline error message on the card itself.
- What does the card look like while the delete is in-flight? The card remains visible in a disabled/loading state; it is only removed once the server confirms success.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each expense category card MUST visually signal its allocation bucket (Needs, Wants, or Future) through color — using the established bucket color palette — without relying solely on text labels.
- **FR-002**: Income category cards MUST use a distinct color treatment that is visually separate from the three expense bucket colors.
- **FR-003**: Each category card MUST display the emoji in a circle with a color-tinted background derived from its bucket or type color at low opacity.
- **FR-004**: The active bucket filter pill MUST be visually prominent using its bucket color for text, border, and background tint — clearly distinguishable from inactive pills.
- **FR-005**: Inactive bucket filter pills MUST appear visibly dimmed relative to the active pill.
- **FR-006**: Deleting a category MUST use an inline confirmation flow within the card itself — no browser dialog (`window.confirm`) or modal overlay.
- **FR-007**: The inline delete confirmation MUST offer a confirm action and a cancel action; cancelling MUST restore the card to its normal state without any data change.
- **FR-008**: Only one inline delete confirmation MUST be active at a time; triggering delete on a second card MUST dismiss the first.
- **FR-016**: If the delete server action fails after the user confirms inline, the card MUST restore to its normal state and display an inline error message directly on the card — no browser dialog or page-level notification.
- **FR-017**: While the delete request is in-flight after inline confirmation, the card MUST remain visible in a disabled/loading state. The card MUST only be removed from the list after the server confirms success.
- **FR-009**: The create/edit category sheet MUST display a large live emoji preview that updates in real time as the user types in the emoji field.
- **FR-010**: When the emoji field is empty, the preview area MUST display a visible neutral placeholder rather than blank space.
- **FR-011**: Allocation bucket buttons in the create/edit form MUST use bucket color to highlight the selected state, consistent with the bucket filter pills on the main list.
- **FR-012**: The empty state MUST include a descriptive icon or illustration, a heading, supporting text, and an action that opens the create category sheet.
- **FR-013**: The loading skeleton MUST include placeholder shapes approximating the bucket filter pill row.
- **FR-014**: All interactive touch targets MUST meet the minimum touch target size for mobile usability (at minimum 44×44 points).
- **FR-015**: Icon-only buttons (e.g., edit button) MUST include accessible labels readable by assistive technology.

### Key Entities

- **Category**: A named label for grouping transactions. Has a name, optional emoji icon, a type (expense or income), and — for expenses — an allocation bucket (Needs, Wants, or Future).
- **Allocation Bucket**: One of three classifications for expense categories: Needs, Wants, Future. Each has a distinct color identity used consistently across the UI.
- **Transaction Type**: Either "expense" or "income". Determines which buckets are applicable and which color treatment is used.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the allocation bucket of any expense category card without reading the bucket text label — confirmed by visual inspection of color differentiation.
- **SC-002**: Users can complete a delete action (initiate, confirm, and see the category removed) without any browser dialog appearing — zero instances of `window.confirm` used.
- **SC-003**: Users can see a live emoji preview update within the create/edit sheet before the form is submitted.
- **SC-004**: The active bucket filter is visually distinguishable from inactive filters in a way that does not rely on text alone.
- **SC-005**: The loading skeleton layout matches the real page layout closely enough that no significant layout shift occurs when content loads — the filter pill area and card list area are both represented in the skeleton.
- **SC-006**: The empty state provides a clear call to action that opens the create form — users are not left without a next step when no categories exist.
- **SC-007**: All redesigned interactions preserve existing functionality: creating, editing, and deleting categories continue to work correctly after the visual changes.

## Assumptions

- The existing color tokens for bucket colors (Needs: sage green, Wants: terracotta, Future: gold) and Income (green) are already defined in the design system and will be used without modification.
- The redesign is scoped exclusively to the categories list page and its create/edit sheet — no changes are needed to how categories appear in other parts of the app (transaction list, budget view, etc.).
- The emoji field accepts free-text input; no emoji picker UI is required for this redesign.
- The edit button on each card may become icon-only (no text label) to improve row compactness, as long as an accessible label is provided.
- The inline delete confirmation replaces the current `window.confirm` call entirely; no browser dialog fallback is needed.
- The redesign does not change any data model, server actions, validation rules, or routing.
