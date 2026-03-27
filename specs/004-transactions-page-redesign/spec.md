# Feature Specification: Transactions Page Redesign

**Feature Branch**: `004-transactions-page-redesign`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "Redesign the Transactions page for a mobile-first personal finance app. Fix search input wiring to URL params, preserve search query when switching type filters, group transactions by date section headers, replace inline Edit/Delete buttons with overflow menu or swipe actions, add a filtered view totals summary bar, improve empty state with context-aware copy, implement CSV export, and add load-more pagination beyond 50 transactions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search and Filter Transactions (Priority: P1)

A user wants to find specific transactions by typing a keyword or filtering by type (income/expense). Today, typing in the search box does nothing because it is not connected to the URL. Switching between type filters also discards any active search. After this change, search and filter work together: typing a keyword updates the visible list, and switching the type filter preserves the current search term.

**Why this priority**: Search and filtering are the primary navigation tools on this page. Without them working correctly, users cannot reliably find transactions, which undermines the page's core purpose.

**Independent Test**: Navigate to the transactions page, type a keyword in the search box, wait briefly, and verify the list filters automatically without any button press or page reload — then click "Expense" and confirm the keyword remains active and only matching expenses are shown.

**Acceptance Scenarios**:

1. **Given** the transactions page is open with no active filters, **When** the user types a keyword and pauses typing, **Then** only transactions whose description or category name contains that keyword are shown automatically without requiring a submit action.
2. **Given** an active search query is present, **When** the user clicks the "Income" type filter, **Then** the search query is preserved in the URL and the list shows only income transactions matching the query.
3. **Given** an active type filter and search query, **When** the user clicks "All", **Then** the type filter is removed but the search query remains active.
4. **Given** no transactions match the current search/filter combination, **Then** a context-aware empty state message is shown indicating no results match the current criteria (distinct from the zero-transactions empty state).

---

### User Story 2 - Date-Grouped Transaction List (Priority: P2)

A user scanning their transaction history expects entries to be visually grouped by date, similar to messaging apps and banking apps. Currently the list is a flat sequence with no temporal organization. After this change, transactions are grouped under lightweight date section headers (e.g., "Today", "Yesterday", "Mar 24").

**Why this priority**: Date grouping dramatically reduces cognitive load when scrolling through many entries. It is a foundational readability improvement that benefits every visit to this page.

**Independent Test**: With at least two transactions on different dates visible, confirm that date section headers appear between groups and that all transactions under a header share that date.

**Acceptance Scenarios**:

1. **Given** transactions on multiple dates, **When** the page loads, **Then** transactions are visually grouped under date headers in descending chronological order (most recent first).
2. **Given** multiple transactions on the same day, **When** the page loads, **Then** they all appear under a single date header for that day.
3. **Given** a date header for today, **Then** the label reads "Today" rather than the calendar date.
4. **Given** a date header for yesterday, **Then** the label reads "Yesterday".
5. **Given** any other date, **Then** the label shows the abbreviated month and day (e.g., "Mar 24").

---

### User Story 3 - Transaction Totals Summary Bar (Priority: P3)

A user wants a quick summary of their current view without manually totalling amounts. A small summary bar above the list shows the transaction count, total income, and total expenses for whatever transactions are currently visible — whether browsing all transactions or a filtered/searched subset.

**Why this priority**: The summary bar gives users constant financial context regardless of filter state, directly supporting the app's core goal of financial awareness.

**Independent Test**: Load the transactions page with no filter, confirm a summary bar appears showing total count, income, and expense totals. Then apply a filter and confirm the bar updates to reflect only the filtered results.

**Acceptance Scenarios**:

1. **Given** any view with at least one transaction (filtered or unfiltered), **When** the page loads, **Then** a summary bar displays the count of results and the combined income and expense totals.
2. **Given** both income and expense transactions in the result set, **Then** income and expense totals are shown separately (e.g., "+$2,400 · −$870").
3. **Given** zero transactions in the result set, **Then** no summary bar is shown (the context-aware empty state message is shown instead).

---

### User Story 4 - Transaction Actions via Overflow Menu (Priority: P3)

Currently every transaction card shows Edit and Delete buttons inline, creating visual clutter in a long list. After this change, actions are revealed via a "..." overflow menu (or equivalent compact disclosure), keeping the list scannable.

**Why this priority**: Reducing visual noise improves list scannability and makes the page feel less cluttered, especially with many transactions loaded.

**Independent Test**: Load the transactions list, confirm no Edit/Delete buttons are visible inline, tap/click the overflow trigger on one item, and confirm Edit and Delete actions appear.

**Acceptance Scenarios**:

1. **Given** a transaction item in the list, **When** the page loads, **Then** no Edit or Delete buttons are visible inline on the card.
2. **Given** a transaction item, **When** the user activates the overflow menu (tap or click "..."), **Then** Edit and Delete actions are revealed.
3. **Given** the overflow menu is open and the user selects Edit, **Then** the transaction edit sheet opens pre-populated with the transaction data (existing behavior preserved).
4. **Given** the overflow menu is open and the user selects Delete, **Then** the transaction is removed from the list immediately and a toast notification appears offering an "Undo" action for approximately 5 seconds.
5. **Given** all actions, **Then** touch targets for overflow trigger and action items must be at least 44px in height.

---

### User Story 5 - Load More Pagination (Priority: P4)

The page currently loads a hard maximum of 50 transactions with no way to see older entries. A "Load more" button at the bottom of the list allows users to retrieve additional transactions in batches.

**Why this priority**: Users with more than 50 transactions cannot currently access their older history, which is a functional gap. However, this is lower priority than correct search/filter behavior.

**Independent Test**: With more than 50 transactions in the account, load the page, scroll to the bottom, confirm a "Load more" button is visible, click it, and verify additional transactions are appended to the list.

**Acceptance Scenarios**:

1. **Given** the user has more than 50 transactions, **When** the page loads, **Then** a "Load more" button is visible below the initial 50 results.
2. **Given** the "Load more" button is clicked, **Then** the button is disabled and shows a loading indicator while fetching, and the next batch of transactions (up to 50) is appended to the existing list without clearing the current results once loaded.
3. **Given** all transactions are loaded, **Then** the "Load more" button is no longer shown.
4. **Given** fewer than or exactly 50 transactions exist, **Then** no "Load more" button is shown.
5. **Given** an active search or type filter, **When** "Load more" is clicked, **Then** the same filter/search parameters apply to the additional batch.

---

### User Story 6 - CSV Export (Priority: P5)

A user wants to export their transaction history to a spreadsheet for external analysis. An Export button triggers a download of the current filtered transaction list as a CSV file.

**Why this priority**: Export is a convenience feature for power users. It does not affect daily use of the app and is therefore lowest priority.

**Independent Test**: Click the Export button and confirm a CSV file is downloaded containing the transactions visible in the current filtered view, with columns for date, description, category, type, and amount.

**Acceptance Scenarios**:

1. **Given** the transactions page with any active filter or search, **When** the user clicks Export, **Then** a CSV file is downloaded.
2. **Given** the downloaded CSV, **Then** it contains all transactions matching the current filter/search (not just the first 50 visible), with columns: date, description, category, type, amount.
3. **Given** no transactions match the current filter, **Then** the Export button is disabled or produces an empty CSV with only headers.
4. **Given** a mobile viewport, **Then** the Export button is visible and accessible (currently hidden on small screens).

---

### Edge Cases

- What happens when a search query returns zero results but the user has transactions? Show "No results for '[query]'" message, not the first-time-user empty state.
- What happens when the user has zero transactions at all? Show a first-time-user empty state with a prompt to add the first entry.
- What happens if more transactions fail to load when "Load more" is clicked? Show an inline error with a retry option; do not remove already-loaded transactions.
- What happens if a transaction's date is invalid or missing? Group it under an "Unknown date" section or skip the header gracefully.
- What happens when the search query includes special characters? The search must handle them without errors and show appropriate results or empty state.
- What happens if the CSV export fails? Show an inline error message; do not navigate away from the page.
- What happens if the user navigates away before the undo window expires? The delete is committed; undo is no longer available after leaving the page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The search input MUST update the visible transaction list automatically as the user types, with a short debounce delay to avoid filtering on every individual keystroke. No explicit submit action (button press or Enter key) should be required.
- **FR-001b**: The search query MUST be committed to the page URL after the debounce delay so that the filtered state is bookmarkable and shareable.
- **FR-002**: The search query MUST be preserved in the page URL so that refreshing the page or sharing the URL restores the same filtered view.
- **FR-003**: The active search query MUST be preserved when the user switches between type filter tabs (All, Income, Expense).
- **FR-004**: The type filter MUST be preserved when the user updates the search query.
- **FR-005**: Transactions MUST be grouped under date section headers in descending chronological order.
- **FR-006**: Date headers MUST use relative labels ("Today", "Yesterday") for the current and previous day, and abbreviated month-day format for all other dates.
- **FR-007**: Whenever transactions are shown (including the default unfiltered "All" view), a summary bar MUST display the total count of all matching transactions in the current filter (not limited to the loaded batch), plus the total income and total expense amounts for the full filtered result set. This count may exceed the number of rows currently rendered when pagination is in use.
- **FR-008**: Edit and Delete actions on transaction items MUST NOT be shown inline by default; they MUST be accessible via a compact overflow disclosure (e.g., "..." menu or equivalent).
- **FR-008b**: Selecting Delete MUST remove the transaction from the list immediately and display a toast notification with an "Undo" action available for approximately 5 seconds. If the user taps "Undo" within that window, the transaction MUST be restored. If the window expires without undo, the deletion is committed permanently.
- **FR-009**: All interactive targets (overflow trigger, menu actions) MUST have a minimum touch target size of 44×44px.
- **FR-010**: The page MUST load an initial batch of transactions and display a "Load more" control when additional transactions exist beyond the initial batch.
- **FR-011**: Activating "Load more" MUST disable the button and display a loading indicator for the duration of the fetch. Once the fetch completes, results MUST be appended to the existing list without clearing it, and the button MUST re-enable (or be hidden if no further results exist). The active search query and type filter MUST apply to the fetched batch.
- **FR-012**: The Export button MUST be visible on all viewport sizes (including mobile) and MUST trigger a download of the currently filtered transaction set as a CSV file.
- **FR-013**: The exported CSV MUST include columns for date (ISO 8601 format: YYYY-MM-DD), description, category, type, and amount. The amount MUST be a raw signed decimal number with no currency symbol (negative for expenses, positive for income), suitable for direct use in spreadsheet arithmetic. The CSV MUST include all transactions matching the current filter, not limited to the loaded batch.
- **FR-014**: The empty state MUST display different messages depending on context: first-time user (no transactions exist) vs. no results for a filter/search.

### Key Entities

- **Transaction**: A single financial event with a date, description, category, type (income/expense), and amount. Transactions are owned by a user.
- **Category**: A label assigned to a transaction (e.g., "Groceries", "Salary") with an icon and optional allocation bucket.
- **FilterState**: The combination of active type filter and search query that determines which transactions are visible. Represented as URL search parameters.
- **DateGroup**: A logical grouping of transactions sharing the same calendar date, rendered with a section header.
- **TransactionBatch**: A page of transaction results returned by the data layer, with metadata indicating whether more results exist.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users see filtered results automatically within 300ms of pausing their typing, without pressing any button or reloading the page, and without losing their filter context.
- **SC-002**: 100% of type filter tab changes preserve the active search query in the URL and the visible input field.
- **SC-003**: All transaction lists with entries across more than one calendar day display date section headers with correct relative or formatted labels.
- **SC-004**: Zero inline Edit/Delete buttons are visible on transaction cards in the default list view.
- **SC-005**: Users with more than 50 transactions can access entries beyond the initial batch via the "Load more" control without losing their active search or filter.
- **SC-006**: Any view with at least one transaction (filtered or unfiltered) always shows a summary bar with the correct total matching count and income/expense totals for the full filtered dataset, even when only a partial batch is loaded.
- **SC-007**: The Export button is accessible and functional on mobile viewports (width ≤ 390px) and produces a valid CSV download.
- **SC-008**: The empty state message correctly distinguishes between a user with no transactions and a user whose search/filter returns zero results.

## Clarifications

### Session 2026-03-26

- Q: Should search filter on each keystroke (debounced/real-time) or only on explicit submit (Enter/button)? → A: Real-time keystroke filtering with a short debounce delay; no submit action required. URL updated after the debounce fires.
- Q: How should transaction delete be confirmed? → A: Immediate delete with undo toast — transaction is removed instantly and a toast offers "Undo" for ~5 seconds.
- Q: Should the summary bar appear only when a filter/search is active, or always when results are present? → A: Always visible whenever transactions are shown, including the default unfiltered "All" view.
- Q: What format should the `amount` column use in the CSV export? → A: Raw signed number with no currency symbol (e.g., `-12.50` for expenses, `12.50` for income), making the file directly usable in spreadsheet arithmetic.
- Q: What visual feedback should the "Load more" button show while fetching the next batch? → A: Disable the button and show a spinner or loading label inside it while the fetch is in progress.

## Assumptions

- The initial batch size for pagination is 50 transactions, consistent with the current limit.
- "Load more" is preferred over infinite scroll to avoid complexity and give users explicit control.
- The overflow menu pattern is preferred over swipe-to-reveal for cross-platform consistency (the app runs in a browser, not a native app).
- CSV export operates on the full filtered dataset from the server (not just the currently loaded batch), so it may require a separate data fetch.
- The Export button will be visible on all viewports; the `hidden sm:inline-flex` constraint in the current implementation will be removed.
- Date grouping is based on the transaction's recorded date field, not the creation timestamp.
- The "Load more" batch size matches the initial load size (50).
