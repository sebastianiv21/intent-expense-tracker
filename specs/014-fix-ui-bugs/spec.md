# Feature Specification: Fix UI Consistency and Color Bugs

**Feature Branch**: `014-fix-ui-bugs`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Fix 4 bugs: chart colors gray/black, recurring edit creates new transaction, inconsistent wants bucket icon Heart vs Coffee, upcoming recurring colors off"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Charts Display Meaningful Colors (Priority: P1)

A user views the Insights page and sees pie charts and bar charts with colors that correspond to their spending categories and allocation buckets. When a category belongs to the "needs" bucket, it appears in green; "wants" in orange; "future" in gold. Uncategorized items use a sensible fallback color based on transaction type rather than appearing as gray or black.

**Why this priority**: Charts are a primary visual feature of the Insights page. Gray/black colors make the data visualization confusing and undermine the entire purpose of visual spending analysis.

**Independent Test**: Can be fully tested by viewing the Insights page with categorized and uncategorized transactions, verifying all chart segments display appropriate colors.

**Acceptance Scenarios**:

1. **Given** a user has transactions categorized into needs, wants, and future buckets, **When** they view the Insights page compliance chart, **Then** each bucket segment displays with its corresponding bucket color (needs: green, wants: orange, future: gold).
2. **Given** a user has transactions in categories without bucket assignments, **When** they view the spending by category chart, **Then** those categories display with a fallback color derived from transaction type (expense: red/orange tone) rather than gray.
3. **Given** a user has no transactions, **When** they view the Insights page, **Then** empty state messaging displays without rendering empty chart segments.

---

### User Story 2 - Editing Recurring Transaction Updates Existing Record (Priority: P1)

A user edits an existing recurring transaction (e.g., changes the amount from $50 to $75 for Netflix) and expects the existing record to be updated. After saving, they see the updated values on the same record, not a new duplicate entry.

**Why this priority**: Data integrity is critical. Creating duplicates when editing confuses users and corrupts their financial tracking data.

**Independent Test**: Can be fully tested by creating a recurring transaction, editing it, and verifying the same record is updated without creating a duplicate.

**Acceptance Scenarios**:

1. **Given** a user has an existing recurring transaction, **When** they click "Edit", modify the amount, and save, **Then** the existing record is updated with the new amount.
2. **Given** a user is editing a recurring transaction, **When** they save their changes, **Then** no new recurring transaction record is created.
3. **Given** a user edits a recurring transaction's frequency from "monthly" to "weekly", **When** they save, **Then** the same record reflects the updated frequency.

---

### User Story 3 - Consistent "Wants" Bucket Icon (Priority: P2)

A user navigates through different pages (Insights, Transactions, Categories, Budgets, Recurring) and sees consistent iconography for the "wants" bucket. Whether viewing bucket cards, category chips, or allocation summaries, the "wants" bucket always displays the same Coffee icon, creating visual consistency.

**Why this priority**: Visual consistency builds user trust and reduces cognitive load. Mixed iconography (Heart in some places, Coffee in others) creates confusion about whether these represent different concepts.

**Independent Test**: Can be fully tested by viewing each page that displays bucket icons and verifying the wants bucket consistently shows the Coffee icon.

**Acceptance Scenarios**:

1. **Given** a user views the Insights page allocation cards, **When** they look at the wants bucket, **Then** it displays the Coffee icon.
2. **Given** a user views the Transaction sheet bucket selector, **When** they look at the wants option, **Then** it displays the Coffee icon.
3. **Given** a user views the Categories page bucket filter, **When** they look at the wants option, **Then** it displays the Coffee icon.
4. **Given** a user views the Budgets page bucket section, **When** they look at the wants bucket, **Then** it displays the Coffee icon.
5. **Given** a user views the Recurring page bucket selector, **When** they look at the wants option, **Then** it displays the Coffee icon.

---

### User Story 4 - Upcoming Recurring Items Display Correct Colors (Priority: P2)

A user views the dashboard's "Upcoming recurring" section and sees amounts colored according to their transaction type or bucket. Income items appear in green, expense items appear in red or their bucket color, not gray when category information is missing.

**Why this priority**: Color coding helps users quickly identify income vs. expense items. Gray amounts lose this visual distinction and make the section harder to scan.

**Independent Test**: Can be fully tested by viewing the dashboard with upcoming recurring items of different types, verifying colors match transaction type or bucket.

**Acceptance Scenarios**:

1. **Given** a user has upcoming recurring income items, **When** they view the dashboard upcoming section, **Then** amounts display in green (income color).
2. **Given** a user has upcoming recurring expense items with categories, **When** they view the dashboard upcoming section, **Then** amounts display in their bucket color.
3. **Given** a user has upcoming recurring expense items without categories, **When** they view the dashboard upcoming section, **Then** amounts display in expense color (red) rather than gray.

---

### Edge Cases

- What happens when a transaction has a category but the category has no allocation bucket? Use transaction type color as fallback.
- What happens when a recurring transaction has no category assigned? Use transaction type color (income: green, expense: red).
- What happens when a pie chart has only one bucket with data? Display that bucket's color, no need for multi-color rendering.
- What happens when all transactions in a chart are uncategorized? Display with transaction type colors, not all gray.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display pie chart segments with bucket colors for categorized transactions.
- **FR-002**: System MUST display bar chart bars with bucket colors when categories have bucket assignments.
- **FR-003**: System MUST use transaction type colors (income: green, expense: red/orange) as fallback when category or bucket is unassigned.
- **FR-004**: System MUST update existing recurring transaction records when users edit them, not create new records.
- **FR-005**: System MUST route edit operations through the update action when an existing record is being edited.
- **FR-006**: System MUST display the Coffee icon for the wants bucket across all pages and components.
- **FR-007**: System MUST replace Heart icon usage for wants bucket with Coffee icon.
- **FR-008**: System MUST color upcoming recurring amounts by transaction type when bucket is unavailable.
- **FR-009**: System MUST never display gray (#888888) for financial data that has meaningful type/bucket context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All chart segments on Insights page display colors derived from bucket or transaction type with no gray segments for categorized transactions.
- **SC-002**: Editing a recurring transaction results in exactly one updated record with zero duplicate creations.
- **SC-003**: Users see identical Coffee icon for wants bucket on 100% of pages (Insights, Transactions, Categories, Budgets, Recurring).
- **SC-004**: Upcoming recurring amounts on dashboard display correct colors with no gray amounts for items with known transaction type.

## Assumptions

- The Coffee icon is the intended design for wants bucket based on BUCKET_META definitions in transaction-sheet.tsx, recurring-page.tsx, budgets-page.tsx, and categories-page.tsx.
- The Heart icon in insights-page.tsx is an inconsistency that should be corrected to match other components.
- Transaction type colors are acceptable fallback when bucket information is unavailable.
