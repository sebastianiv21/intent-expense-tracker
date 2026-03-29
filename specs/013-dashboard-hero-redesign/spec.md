# Feature Specification: Dashboard Hero Card and List Pattern Consistency

**Feature Branch**: `013-dashboard-hero-redesign`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Redesign dashboard layout with hero balance card and consistent list patterns"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monthly Balance Hero Card (Priority: P1)

A user opens the dashboard and immediately sees their current monthly balance displayed in a visually prominent hero card that uses the app's primary color theme. The hero card draws attention to the most important financial metric while maintaining readability and displaying supporting context (income and expenses).

**Why this priority**: The monthly balance is the primary financial health indicator users check most frequently. Making it visually prominent improves information hierarchy and user engagement.

**Independent Test**: Can be fully tested by viewing the dashboard and verifying the hero card displays balance, income, and expenses with primary color styling and visual prominence.

**Acceptance Scenarios**:

1. **Given** a user has financial activity this month, **When** they view the dashboard, **Then** the monthly balance hero card displays prominently with primary color background, showing the balance amount, monthly income, and monthly expenses.
2. **Given** a user has a negative balance, **When** they view the dashboard, **Then** the balance amount uses a distinct visual treatment (e.g., destructive color) while maintaining the hero card's primary color styling.
3. **Given** a user has no transactions this month, **When** they view the dashboard, **Then** the hero card displays zero values appropriately with the same visual prominence.

---

### User Story 2 - Recent Transactions with Date Grouping (Priority: P2)

A user views the recent transactions section on the dashboard and sees transactions grouped by date with the same visual pattern used on the full transactions page, providing visual consistency and better scannability.

**Why this priority**: Consistent UI patterns reduce cognitive load and improve user experience. Users familiar with the transactions page will instantly understand the dashboard's transaction list.

**Independent Test**: Can be fully tested by adding transactions and verifying they appear in date groups ("Today", "Yesterday", "MMM d") with the same card styling as the transactions page.

**Acceptance Scenarios**:

1. **Given** a user has transactions from multiple dates, **When** they view the dashboard recent transactions section, **Then** transactions are grouped by date with appropriate date labels ("Today", "Yesterday", or formatted date).
2. **Given** a user has recent transactions, **When** they view the dashboard, **Then** each transaction displays with the same rounded card styling, icon circle, description, category, date, and amount as the transactions page.
3. **Given** a user has no transactions, **When** they view the dashboard, **Then** an empty state message displays in the transactions section with consistent styling.

---

### User Story 3 - Upcoming Recurring Items with Consistent Styling (Priority: P3)

A user views the upcoming recurring items section on the dashboard and sees items displayed with the same card-based styling as transactions, creating visual harmony across all list-type sections.

**Why this priority**: Visual consistency across all list sections creates a cohesive, polished interface. Users perceive the app as well-designed when patterns are repeated.

**Independent Test**: Can be fully tested by creating recurring items and verifying they appear in rounded card styling matching transaction items.

**Acceptance Scenarios**:

1. **Given** a user has upcoming recurring items, **When** they view the dashboard upcoming recurring section, **Then** each item displays with rounded card styling, hover states, icon circle, description, next due date, and amount.
2. **Given** a user has recurring items with different allocation buckets, **When** they view the dashboard, **Then** amounts display with appropriate bucket color coding.
3. **Given** a user has no recurring items, **When** they view the dashboard, **Then** an empty state message displays with consistent styling.

---

### Edge Cases

- What happens when the balance is exactly zero? Display zero with neutral styling while maintaining hero card prominence.
- What happens when a user has many recent transactions? Show a limited number (e.g., 5-10) with a "View all" link to the full transactions page.
- What happens when income equals expenses exactly? Display both values clearly, with the balance showing zero.
- What happens on mobile devices with limited screen width? Hero card and list sections should maintain visual prominence and readability at all breakpoints.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a monthly balance hero card on the dashboard with the app's primary color as a prominent visual element.
- **FR-002**: System MUST show the current monthly balance amount as the primary content of the hero card.
- **FR-003**: System MUST display monthly income and expenses as supporting metrics within or below the hero card.
- **FR-004**: System MUST show quick stats (daily average, safe to spend, days remaining) in a secondary row within the hero card area.
- **FR-005**: System MUST use visually distinct treatment for negative balances while maintaining the hero card's primary color theme.
- **FR-006**: System MUST display recent transactions grouped by date labels ("Today", "Yesterday", "MMM d") on the dashboard.
- **FR-007**: System MUST use the same rounded card styling for transaction items on the dashboard as on the full transactions page.
- **FR-008**: System MUST display a "View all" link from the recent transactions section to the full transactions page.
- **FR-009**: System MUST display upcoming recurring items with rounded card styling matching transaction items.
- **FR-010**: System MUST maintain bucket color coding for recurring item amounts.
- **FR-011**: System MUST display empty state messages when no transactions or recurring items exist.
- **FR-012**: System MUST maintain hover states on list items for interactive feedback.

### Key Entities

- **Monthly Balance**: The net financial position for the current month, derived from income minus expenses.
- **Transaction**: A financial entry with date, description, category, amount, and type (income/expense).
- **Recurring Item**: A scheduled financial entry with description, amount, category, and next due date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify their monthly balance within 2 seconds of viewing the dashboard.
- **SC-002**: The hero card occupies at least 30% more visual prominence (via primary color background filling entire card area, larger balance type size, and elevated positioning) compared to the previous plain card design.
- **SC-003**: Users can distinguish between different date groups in the transactions list without additional explanation.
- **SC-004**: Visual consistency between dashboard lists and dedicated pages is validated through design review with zero styling discrepancies.
- **SC-005**: The dashboard layout utilizes available screen space effectively with no excessive empty areas in the main content region (hero card spans full width, transaction and recurring sections use available grid space).

## Assumptions

- The primary color (`#c4714a`) and related design tokens are already defined in the codebase and should be used for the hero card.
- The existing transaction item component and styling patterns should be reused for consistency.
- Quick stats row (daily average, safe to spend, days remaining) should remain part of the hero card area but as a secondary visual tier.
- The number of recent transactions shown should match the current implementation (limited to avoid excessive scrolling).
- Mobile responsiveness is already a project requirement and applies to this redesign.
- Empty state messages (for zero transactions/recurring items) use the existing dashed-border pattern currently in place.
