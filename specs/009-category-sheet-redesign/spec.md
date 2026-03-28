# Feature Specification: Category Sheet Redesign

**Feature Branch**: `009-category-sheet-redesign`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "Redesign the create/edit category sheet in categories-page.tsx to match the elevated UI pattern established in transaction-sheet.tsx."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Category with Icon Picker (Priority: P1)

A user wants to add a new expense category. They tap "Add category", which opens a bottom sheet. They type a name, pick an icon from a visual emoji grid, select an allocation bucket using labeled icon pills, and confirm by tapping the prominent save button. A live preview card at the top of the form reflects their selections in real time before they commit.

**Why this priority**: Creating categories is the primary action on this page and the redesign's core improvement — replacing plain text inputs with visual, tactile controls that reduce cognitive load.

**Independent Test**: Can be fully tested by opening the sheet via "Add category", filling all fields, and verifying the category appears in the list after saving.

**Acceptance Scenarios**:

1. **Given** the Categories page is open, **When** the user taps "Add category", **Then** a bottom sheet slides up with a header, scrollable form, and fixed footer.
2. **Given** the sheet is open, **When** the user types a name, **Then** the preview card at the top of the form updates immediately to reflect the typed name.
3. **Given** the sheet is open, **When** the user taps an emoji in the grid, **Then** the emoji is highlighted as selected and the preview card icon updates.
4. **Given** the user has selected an emoji, **When** they tap the same emoji again, **Then** it is deselected and the preview card reverts to the default icon.
5. **Given** the type is set to "Expense", **When** the user taps a bucket pill (Needs, Wants, or Future), **Then** the pill shows a colored border and tinted background and the preview card label updates.
6. **Given** the name field is non-empty and a bucket is selected (for expenses), **When** the user taps the save button, **Then** the sheet closes and the new category appears in the list.

---

### User Story 2 - Edit an Existing Category (Priority: P2)

A user wants to update an existing category's name, icon, or bucket. They open the category's edit option, which opens the same sheet pre-populated with the current values. The preview card immediately reflects the saved state. They make changes and confirm.

**Why this priority**: Editing reuses the same sheet UI and validates that pre-population and save flow work end-to-end.

**Independent Test**: Can be fully tested by triggering edit on an existing category, verifying pre-populated values, making a change, saving, and confirming the update in the list.

**Acceptance Scenarios**:

1. **Given** an existing category, **When** the user opens its edit action, **Then** the sheet opens with name, icon, type, and bucket pre-filled and the preview card reflects the saved state.
2. **Given** the edit sheet is open, **When** the user changes the name, **Then** the preview updates live.
3. **Given** the user modifies fields, **When** they tap "Update", **Then** the sheet closes and the category list reflects the changes.

---

### User Story 3 - Dismiss the Sheet Without Saving (Priority: P3)

A user opens the create or edit sheet but decides not to proceed. They dismiss it using the X button in the sheet header.

**Why this priority**: Dismissal is a critical escape path. Its placement in the header (replacing the previous Cancel button in the footer) is a UX change that must be explicitly verified.

**Independent Test**: Can be fully tested by opening the sheet and tapping the header X button — no changes should persist and the sheet should close.

**Acceptance Scenarios**:

1. **Given** the sheet is open, **When** the user taps the X button in the header, **Then** the sheet closes and no changes are saved.

---

### Edge Cases

- What happens when the user clears the name field after typing? The save button must become disabled.
- What happens if the save action fails (e.g., server error)? An error message must appear inside the scrollable form area without closing the sheet.
- What happens when the user switches type from "Expense" to "Income"? The allocation bucket section must hide and the preview label must switch to "Income".
- What happens when the emoji grid is scrolled partially and the user submits? The sheet must close cleanly without scroll state issues.
- What happens if no icon is selected? The preview must display a default fallback icon and saving must be allowed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sheet header MUST contain a clearly tappable X button that closes the sheet without saving.
- **FR-002**: The sheet MUST display a live preview card at the top of the scrollable area that reflects the current name, icon, and bucket/type label as the user fills the form.
- **FR-003**: The sheet MUST offer an emoji grid with exactly 30 curated icons arranged in a 5-column scrollable grid for icon selection.
- **FR-004**: Users MUST be able to deselect an icon by tapping the currently selected emoji, reverting the preview to the default icon.
- **FR-005**: For expense categories, the sheet MUST show three allocation bucket options (Needs, Wants, Future), each with a distinct icon and color, presented as selectable pills.
- **FR-006**: The bucket picker MUST be hidden when the category type is set to "Income".
- **FR-007**: The sheet MUST have a fixed footer with a single full-width action button labeled "Create" (new) or "Update" (edit).
- **FR-008**: The action button MUST be disabled when the name field is empty or when an expense category has no bucket selected.
- **FR-009**: The sheet content area MUST scroll independently while the header and footer remain fixed on screen.
- **FR-010**: Save errors — including duplicate name conflicts returned by the server — MUST appear as an inline message within the scrollable content area without dismissing the sheet.
- **FR-011**: All existing category create, edit, and delete functionality MUST remain intact after the visual redesign.
- **FR-012**: The default Radix UI close button MUST be suppressed so only the custom header X button acts as the dismiss control.

### Key Entities

- **Category**: Represents a named grouping for transactions. Has a name, optional icon (emoji), type (income or expense), and optional allocation bucket (needs, wants, future for expenses only).
- **Allocation Bucket**: One of three labels (Needs, Wants, Future) that classifies an expense category by spending priority.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the create sheet, select an icon from the grid, name the category, choose a bucket, and save — all within 45 seconds.
- **SC-002**: The live preview card updates within the same render frame as each triggering input event (keypress or tap) — visually synchronous with no observable lag.
- **SC-003**: 100% of pre-existing create, edit, and delete operations continue to produce correct results after the redesign.
- **SC-004**: The sheet can be dismissed via the header X button without leaving behind any unsaved state.
- **SC-005**: The save button is disabled for every combination of empty-name or missing-bucket (expense), with no cases where an invalid form can be submitted.

## Clarifications

### Session 2026-03-27

- Q: Can two categories of the same type have identical names? → A: Duplicates allowed — server returns an error if violated (surfaced via FR-010 inline error).
- Q: Is swipe-to-dismiss a hard acceptance requirement or incidental platform behaviour? → A: Incidental — native behaviour, not a separately tested acceptance criterion.

## Assumptions

- The emoji grid uses a fixed curated set; free-text emoji entry is removed entirely.
- The "Cancel" button previously in the footer is fully replaced by the header X button — no secondary cancel action is needed.
- Bucket pill colors are derived from the existing project-wide bucket color definitions to maintain consistency with other screens.
- The sheet height cap (90% of viewport) and rounded top corners align with the existing transaction sheet pattern used elsewhere in the app.
- Income categories do not use allocation buckets; this is an existing constraint preserved by the redesign.
