# Feature Specification: Redesign Transaction Entry Sheet UI

**Feature Branch**: `002-transaction-sheet-redesign`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "i want the transaction sheet to look like this"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a New Expense with Amount, Intent, and Category (Priority: P1)

A user opens the transaction entry sheet and records a new expense by entering the spending amount, selecting whether it is an expense or income, choosing the appropriate intent bucket (Needs, Wants, or Future), picking a category, confirming the date, and optionally adding a note before submitting.

**Why this priority**: This is the core action the sheet exists to support. Every other improvement adds polish to this primary flow.

**Independent Test**: Can be fully tested by opening the sheet, filling in all fields, and tapping "Add" to confirm the transaction is saved with correct values.

**Acceptance Scenarios**:

1. **Given** the sheet is open, **When** the user taps the amount area and types a value, **Then** the amount is displayed prominently with a currency symbol prefix.
2. **Given** the sheet is open, **When** the user taps "Expense", **Then** it becomes visually active (filled/highlighted) and the amount input reflects expense mode.
3. **Given** the user has selected an intent bucket (Needs, Wants, or Future), **When** they tap a different bucket, **Then** the selected bucket becomes visually highlighted, the previous selection is deselected, the category list refreshes to show only that bucket's categories, and any previously selected category is cleared.
4. **Given** the user selects a category from the horizontally scrollable pill list, **When** they tap a category, **Then** it becomes visually selected.
5. **Given** the sheet is open with the current date pre-filled, **When** the user taps the date field, **Then** a date picker opens allowing them to change the date.
6. **Given** all required fields are filled, **When** the user taps "Add", **Then** the transaction is saved and the sheet closes.

---

### User Story 2 - Switch Between Expense and Income (Priority: P2)

A user wants to record income rather than an expense. They tap "Income" in the toggle to switch the transaction type, and the form updates to reflect the income context.

**Why this priority**: Both transaction types are core to financial tracking, but expense entry is most frequent; income switching is a secondary but essential flow.

**Independent Test**: Can be tested by toggling to "Income" and verifying the active state changes visually and the saved transaction is recorded as income.

**Acceptance Scenarios**:

1. **Given** the sheet defaults to "Expense", **When** the user taps "Income", **Then** the "Income" tab becomes active, "Expense" becomes inactive, and the intent bucket selector is hidden.
2. **Given** "Income" is active, **When** the user submits the form, **Then** the transaction is saved with type "income" and no intent bucket association.
3. **Given** "Income" is active, **When** the user taps "Expense", **Then** the intent bucket selector reappears with the default bucket (Needs) selected.

---

### User Story 3 - Add an Optional Note to a Transaction (Priority: P3)

A user wants to add context to a transaction by typing a short note in the notes field before submitting.

**Why this priority**: Notes enrich transaction data for later review but are not required to complete an entry.

**Independent Test**: Can be tested by entering text in the notes field and confirming the note is saved with the transaction.

**Acceptance Scenarios**:

1. **Given** the notes field shows placeholder text, **When** the user taps the field and types a note, **Then** the placeholder disappears and the typed text is shown.
2. **Given** a note is entered, **When** the user submits, **Then** the note is saved with the transaction record.

---

### Edge Cases

- What happens when the user submits without entering an amount? The form should prevent submission and indicate the amount field is required.
- What happens if a bucket has no categories defined? The category list shows empty and submission is blocked until the data issue is resolved.
- What happens if saving the transaction fails (e.g., network error)? The sheet stays open, the user's entered data is preserved, and an inline error message is displayed so the user can retry.
- What happens if the user dismisses the sheet without submitting? No transaction is saved and any entered data is discarded.
- What happens if the category list has many items? The category row scrolls horizontally without wrapping.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sheet MUST display a large, prominent spending amount input at the top with a currency symbol prefix and "0.00" as the default placeholder.
- **FR-002**: The sheet MUST include a segmented toggle with two options: "Expense" and "Income", defaulting to "Expense" as the active selection.
- **FR-003**: The sheet MUST display three intent bucket options — Needs, Wants, and Future — each with a distinct icon, allowing only one to be selected at a time. The first bucket (Needs) MUST be pre-selected when the sheet opens. The intent bucket selector MUST be hidden when the transaction type is "Income".
- **FR-004**: When the transaction type is "Expense", the sheet MUST display a horizontally scrollable list of category pills scoped to the selected intent bucket. The first category MUST be pre-selected when the sheet opens. Selecting a different intent bucket resets the category selection to the first category of the new bucket. When the transaction type is "Income", the category list MUST show all income categories (not filtered by intent bucket). The user may select exactly one category.
- **FR-005**: The sheet MUST include a date field that defaults to the current date and allows the user to change it via a date picker.
- **FR-006**: The sheet MUST include an optional multi-line notes field (rendered as a `<textarea>`) with the placeholder text "Add a note about this transaction...".
- **FR-007**: The sheet MUST include a full-width "Add" submit button at the bottom. If submission fails, the sheet MUST remain open with all entered data intact and display an inline error message indicating the failure and prompting the user to try again.
- **FR-008**: The sheet MUST prevent submission if the amount is zero or empty. Intent bucket and category are always pre-selected, so they do not block submission independently.
- **FR-009**: The sheet MUST be dismissible via a close button (X) in the top-right corner without saving any data.
- **FR-010**: The sheet MUST visually distinguish the active/selected state for the type toggle, intent bucket, and category pill.

### Key Entities

- **Transaction**: Represents a single financial entry with amount, type (expense/income), intent bucket, category, date, and optional note.
- **Intent Bucket**: One of three classification tiers — Needs, Wants, Future — representing the financial priority of a transaction.
- **Category**: A labeled sub-classification scoped to a specific intent bucket (e.g., Groceries and Healthcare belong to Needs). Each category belongs to exactly one intent bucket.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full transaction entry — amount, type, intent, category, date, and optional note — in under 30 seconds.
- **SC-002**: All five primary input areas (amount, type, intent, category, date) are visible without scrolling when the sheet first opens.
- **SC-003**: The amount field prevents form submission when empty or zero, providing visible feedback to the user. Intent bucket and category are always pre-selected and never block submission.
- **SC-004**: The selected state for type toggle, intent bucket, and category pill is distinguishable from unselected states at a glance.
- **SC-005**: The category list supports at least 10 items and remains navigable via horizontal scroll without layout breakage.

## Clarifications

### Session 2026-03-25

- Q: When the user selects a different intent bucket, should the category list filter to show only categories belonging to that bucket, or does the same full category list always appear? → A: Categories filter based on the selected intent bucket.
- Q: When the sheet first opens, should the first intent bucket (Needs) and its first category be pre-selected by default, or should both start unselected? → A: Pre-select first bucket (Needs) and its first category on open.
- Q: What should happen when the transaction fails to save after the user taps "Add"? → A: Show inline error message, keep sheet open so user can retry.
- Q: Should the intent bucket selector (Needs, Wants, Future) be shown and required when the transaction type is "Income"? → A: Hide intent buckets when Income is selected.

## Assumptions

- The sheet slides up from the bottom as a modal overlay (bottom sheet pattern), consistent with the provided design reference.
- The dark-themed color palette shown in the reference image matches the app's existing visual identity.
- Intent buckets (Needs, Wants, Future) and category items are pre-defined and loaded from the existing data model; this feature does not include managing or editing them.
- The currency symbol displayed is determined by the user's existing app settings and does not need to be changed within this sheet.
- The date field defaults to the current calendar date at the time the sheet is opened.
