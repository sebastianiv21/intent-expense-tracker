# Feature Specification: Recurring Page Redesign

**Feature Branch**: `011-recurring-page-redesign`  
**Created**: 2026-03-28  
**Status**: Draft  
**Input**: User description: "Redesign the Recurring page to match the modern design patterns established in Budgets and Categories pages: Summary Card, Card Design, Delete Flow, Create/Edit Sheet, Empty States"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Recurring Overview (Priority: P1)

As a user, I want to see a monthly overview of my recurring transactions so that I can quickly understand my total recurring income and expenses at a glance.

**Why this priority**: Provides immediate value by giving users a financial summary before diving into details. This is the first thing users see and sets context for all recurring items.

**Independent Test**: Can be fully tested by navigating to the Recurring page and verifying the summary card displays total active income, expenses, and net recurring amount with progress visualization.

**Acceptance Scenarios**:

1. **Given** I have active recurring transactions, **When** I navigate to the Recurring page, **Then** I see a summary card showing total monthly recurring income and expenses
2. **Given** I have no active recurring transactions, **When** I navigate to the Recurring page, **Then** the summary card shows zero values with clear labeling
3. **Given** I have both active and paused recurring items, **When** I view the summary, **Then** only active items are counted in the totals

---

### User Story 2 - Browse Recurring Items (Priority: P1)

As a user, I want to browse my recurring transactions with clear visual distinction between income and expense items so that I can quickly identify and differentiate my recurring financial commitments.

**Why this priority**: Core functionality that users interact with most frequently. The card design directly impacts usability and information clarity.

**Independent Test**: Can be tested by viewing the list of recurring items and verifying the visual design matches the established pattern with colored borders, icons, and type indicators.

**Acceptance Scenarios**:

1. **Given** I have recurring expense items, **When** I view the list, **Then** each card displays a red left border accent and expense-colored icon background
2. **Given** I have recurring income items, **When** I view the list, **Then** each card displays a green left border accent and income-colored icon background
3. **Given** I have a recurring item with a category icon, **When** I view the card, **Then** the icon displays prominently in a colored circle matching the transaction type
4. **Given** I switch between Active and Paused tabs, **When** I select a tab, **Then** only items matching that status are displayed

---

### User Story 3 - Manage Recurring Items (Priority: P2)

As a user, I want to pause, resume, edit, and delete recurring transactions with a modern, consistent interface so that I can manage my recurring financial commitments efficiently.

**Why this priority**: Essential management functionality that users need to keep their recurring items accurate and up-to-date. Builds on core browsing functionality.

**Independent Test**: Can be tested by performing pause/resume actions and verifying the inline delete confirmation pattern works correctly without browser dialogs.

**Acceptance Scenarios**:

1. **Given** I am viewing an active recurring item, **When** I tap the Pause button, **Then** the item moves to the Paused tab and is excluded from summary totals
2. **Given** I am viewing a paused recurring item, **When** I tap the Resume button, **Then** the item moves to the Active tab and is included in summary totals
3. **Given** I want to delete a recurring item, **When** I tap the Delete option, **Then** I see inline confirmation buttons (Check/X) instead of a browser dialog
4. **Given** I confirm deletion, **When** I tap the Check button, **Then** the item is permanently removed from the list
5. **Given** I cancel deletion, **When** I tap the X button, **Then** the confirmation disappears and focus returns to the item

---

### User Story 4 - Create and Edit Recurring Items (Priority: P2)

As a user, I want to create and edit recurring transactions through a modern bottom sheet interface so that I can set up and modify my recurring financial commitments with a consistent, pleasant experience.

**Why this priority**: Critical for adding and maintaining recurring items. The sheet design impacts user satisfaction during these frequent interactions.

**Independent Test**: Can be tested by opening the create/edit sheet and verifying all form elements follow the modern design pattern with proper interactions.

**Acceptance Scenarios**:

1. **Given** I tap "Add recurring", **When** the sheet opens, **Then** I see a modern header with large title and close button
2. **Given** I am creating a new recurring item, **When** I enter the amount, **Then** it displays centered with $ prefix and radial gradient background
3. **Given** I want to set the transaction type, **When** I tap the toggle, **Then** the animated indicator slides to the selected option (Expense/Income)
4. **Given** I need to select a frequency, **When** I view the frequency selector, **Then** I see pill chips for Daily, Weekly, Biweekly, Monthly, Quarterly, Yearly
5. **Given** I select Expense type, **When** I view category selection, **Then** I see horizontal scrolling chips filtered to expense categories
6. **Given** I select Income type, **When** I view category selection, **Then** I see horizontal scrolling chips filtered to income categories
7. **Given** I need to set dates, **When** I tap a date field, **Then** a calendar popover appears for selection
8. **Given** I have filled all required fields, **When** I tap the save button, **Then** the item is created and the sheet closes

---

### User Story 5 - Empty State Guidance (Priority: P3)

As a user with no recurring transactions, I want to see an engaging empty state that encourages me to add my first recurring item so that I understand the feature's purpose and know how to proceed.

**Why this priority**: Important for new users but less critical than core functionality. Improves onboarding experience.

**Independent Test**: Can be tested by viewing the page with no recurring items and verifying the empty state displays with emoji, title, description, and action button.

**Acceptance Scenarios**:

1. **Given** I have no recurring items in the Active tab, **When** I view the page, **Then** I see an empty state with an emoji icon, bold title, helpful description, and "Add recurring" button
2. **Given** I have no recurring items in the Paused tab, **When** I switch to that tab, **Then** I see an appropriate empty state for paused items

---

### Edge Cases

- What happens when a recurring item's next due date is in the past? The frequency label continues to display correctly, and the item remains in the appropriate status tab.
- How does the system handle category selection when a user switches type mid-form? The category selection resets to empty, filtered to the new type's categories.
- What happens if a user tries to save with missing required fields? The save button remains disabled until all required fields are complete.
- How does the system handle very long amounts? The amount input font size scales down to maintain layout integrity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a summary card at the top of the Recurring page showing total monthly recurring income, expenses, and net amount
- **FR-002**: System MUST include progress visualization in the summary card showing the ratio of recurring expenses to recurring income (similar to budgets page month header)
- **FR-003**: System MUST display recurring item cards with a 3px left border accent colored by transaction type (green for income, red for expense)
- **FR-004**: System MUST display category icons in circular backgrounds with colors matching the transaction type
- **FR-005**: System MUST show amounts prominently with appropriate currency formatting
- **FR-006**: System MUST replace browser confirm dialogs with inline confirmation pattern (Check/X buttons) for delete actions
- **FR-007**: System MUST provide a bottom sheet for create/edit with a modern header containing large title and close button
- **FR-008**: System MUST display amount input centered with $ prefix and radial gradient background
- **FR-009**: System MUST provide an animated type toggle (Expense/Income) with sliding indicator
- **FR-010**: System MUST present frequency selection as pill chips or segmented control
- **FR-011**: System MUST provide category selection as horizontal scrolling chips filtered by transaction type
- **FR-012**: System MUST include date pickers with calendar popovers for start and end dates
- **FR-013**: System MUST display a large gradient save button at the bottom of the sheet
- **FR-014**: System MUST display empty states with emoji icon, bold title, description, and action button
- **FR-015**: System MUST maintain Active/Paused tabs functionality
- **FR-016**: System MUST preserve pause/resume functionality for recurring items
- **FR-017**: System MUST maintain all existing business logic for recurring transactions

### Key Entities

- **Recurring Transaction**: A scheduled financial transaction that repeats at a defined frequency (daily, weekly, biweekly, monthly, quarterly, yearly). Attributes include amount, type (income/expense), description, frequency, start date, optional end date, category association, and active/paused status.

- **Category**: A classification for transactions that determines icon display and allocation grouping. Categories are type-specific (expense or income) and may have associated icons.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify transaction type (income vs expense) within 2 seconds of viewing any recurring item card
- **SC-002**: Users can create a new recurring transaction in under 45 seconds on first attempt
- **SC-003**: Users can delete a recurring item with 2 taps (no browser dialogs)
- **SC-004**: The summary card accurately reflects totals within 1 second of page load
- **SC-005**: All recurring page interactions match the visual and behavioral patterns of Budgets and Categories pages
- **SC-006**: Zero browser confirm dialogs are used in the recurring item management flow
- **SC-007**: Users understand the purpose of recurring transactions from the empty state without external guidance
