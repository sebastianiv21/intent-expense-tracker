# Feature Specification: Insights Page Visual Redesign

**Feature Branch**: `005-insights-page-redesign`  
**Created**: 2026-03-26  
**Status**: Draft  
**Input**: User description: "Redesign the Insights page /web/app/(app)/insights/ with a distinctive, production-grade frontend aesthetic."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Allocation Compliance at a Glance (Priority: P1)

A user opens the Insights page to quickly understand how well they're adhering to their 50/30/20 budget allocation. They see a visually striking compliance score with a donut chart that immediately communicates their financial discipline for the current period.

**Why this priority**: This is the core value proposition of the Insights page - helping users understand their budget adherence in seconds. Without this, the page has no primary purpose.

**Independent Test**: Can be fully tested by navigating to the Insights page and verifying that a compliance score and visual chart are displayed with the correct data visualization, delivering immediate budget awareness.

**Acceptance Scenarios**:

1. **Given** the user has expenses recorded for the current month, **When** they open the Insights page, **Then** they see a compliance percentage score prominently displayed alongside a visual representation of their allocation breakdown
2. **Given** the user has no expenses recorded, **When** they open the Insights page, **Then** they see an appropriate empty state with guidance on how to start tracking
3. **Given** the user has expenses across all three buckets (Needs, Wants, Future), **When** they view the allocation chart, **Then** each bucket is visually distinct with its own color and the proportions accurately reflect spending distribution

---

### User Story 2 - Compare Actual Spending Against Targets (Priority: P2)

A user wants to understand exactly how much they've spent in each budget bucket compared to their targets. They see bucket cards showing actual amounts, target amounts, and variance indicators that clearly communicate over/under spending.

**Why this priority**: This provides actionable detail that helps users make specific budget adjustments. It builds on P1 by providing the granular data needed for decision-making.

**Independent Test**: Can be fully tested by viewing the bucket cards section and verifying that each bucket shows actual spending, target amount, variance calculation, and a progress indicator, delivering specific budget comparison data.

**Acceptance Scenarios**:

1. **Given** the user has a target of $2000 for Needs and has spent $1800, **When** they view the Needs bucket card, **Then** they see actual ($1800), target ($2000), and a positive variance indicator (+$200 under budget)
2. **Given** the user has exceeded their Wants budget, **When** they view the Wants bucket card, **Then** the variance is visually emphasized (e.g., distinct color or styling) to draw attention to overspending
3. **Given** the user views the bucket progress bars, **When** spending exceeds 100% of target, **Then** the progress indicator clearly shows overage beyond the target threshold

---

### User Story 3 - Explore Spending by Category (Priority: P3)

A user wants to drill down into their spending patterns by category to identify which expense categories are driving their spending. They see a bar chart showing expense totals grouped by category.

**Why this priority**: This provides analytical depth for users who want to optimize specific spending categories. It's valuable but not essential for the core budget adherence use case.

**Independent Test**: Can be fully tested by viewing the spending by category section and verifying that a bar chart displays categories with accurate totals, delivering spending breakdown insights.

**Acceptance Scenarios**:

1. **Given** the user has expenses across multiple categories, **When** they view the spending by category chart, **Then** each category is represented as a bar with height proportional to total spending, colored by its allocation bucket
2. **Given** the user has no categorized expenses, **When** they view the spending section, **Then** they see an empty state message encouraging them to categorize transactions
3. **Given** the user hovers over a category bar, **When** the tooltip appears, **Then** they see the category name and formatted dollar amount

---

### User Story 4 - Review Financial Summary Metrics (Priority: P4)

A user wants to see their overall financial picture including total income, expenses, balance, and transaction count for the period. This summary provides context for the allocation data.

**Why this priority**: This provides helpful context but is supplementary to the primary budget adherence insight. Users can understand budget performance without this summary.

**Independent Test**: Can be fully tested by viewing the summary section and verifying that four key metrics (income, expenses, balance, transaction count) are displayed with accurate values.

**Acceptance Scenarios**:

1. **Given** the user has income and expenses for the period, **When** they view the summary section, **Then** they see total income, total expenses, calculated balance, and transaction count
2. **Given** the user has more expenses than income, **When** they view the balance, **Then** it is displayed as a negative value with appropriate visual treatment
3. **Given** the user has high transaction volume, **When** they view the transaction count, **Then** it is formatted appropriately (e.g., "147 transactions")

---

### User Story 5 - Experience Smooth Page Load with Skeleton (Priority: P5)

A user with a slow connection opens the Insights page and sees a polished loading skeleton that provides visual structure and anticipation before the actual content loads.

**Why this priority**: Loading states improve perceived performance but don't affect the core functionality. This is a polish feature.

**Independent Test**: Can be fully tested by simulating slow network conditions and verifying that a skeleton matching the final layout structure is displayed during data loading.

**Acceptance Scenarios**:

1. **Given** the page is loading data, **When** the user views the page, **Then** they see skeleton placeholders that match the final content structure
2. **Given** the skeleton is displayed, **When** data finishes loading, **Then** the transition from skeleton to content is smooth without layout shift

---

### Edge Cases

- What happens when the user has zero income recorded for the period? The allocation targets will be zero, and the compliance score should handle this gracefully (showing N/A or a guidance message).
- How does the system handle a user with no financial profile configured? Default allocation percentages (50/30/20) should apply with a zero income target.
- What happens when all expenses are uncategorized? The spending by category chart should show an "Uncategorized" category with all expenses grouped there.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST display a compliance score showing how closely actual spending matches the 50/30/20 allocation targets
- **FR-002**: The page MUST display a visual chart (donut/pie) representing the allocation breakdown across the three buckets: Needs, Wants, Future
- **FR-003**: The page MUST display bucket cards for each allocation bucket showing: actual spending, target amount, variance, and a progress indicator
- **FR-004**: The page MUST display a bar chart showing spending totals grouped by expense category, with bars colored by their allocation bucket
- **FR-005**: The page MUST display a summary section with four metrics: total income, total expenses, balance, and transaction count
- **FR-006**: The page MUST display a loading skeleton that matches the final content structure during data fetch
- **FR-007**: The page MUST maintain all existing data query interfaces and return types (no changes to backend data structures)
- **FR-008**: The page MUST use distinctive but subtle typography with precise spacing, avoiding generic system fonts while maintaining a refined, professional appearance
- **FR-009**: The page MUST implement purposeful animations focused on chart hover/click states and staggered content reveal on initial page load, avoiding excessive motion or animated counters
- **FR-010**: The page MUST use restrained asymmetric layout with generous negative space, breaking from standard card grids while maintaining visual hierarchy and readability
- **FR-012**: The page MUST follow a mobile-first progressive enhancement approach, starting with a compact mobile layout that progressively reveals more visual detail and asymmetric elements at larger breakpoints
- **FR-011**: All existing functionality (period selector, disabled state handling) must be preserved

### Key Entities

- **Allocation Bucket**: One of three budget categories (Needs, Wants, Future) with associated color coding and percentage targets
- **Compliance Score**: A percentage calculated by comparing actual spending distribution against target allocation percentages
- **Spending Category**: An expense category (e.g., Groceries, Entertainment) mapped to an allocation bucket, used for granular spending analysis
- **Financial Period**: A time range for which insights are calculated (currently month, with planned support for 3-month, 6-month, and year views)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify their budget compliance status within 3 seconds of page load by viewing the prominent compliance score
- **SC-002**: The visual design achieves a distinctive aesthetic that differs noticeably from the previous generic card-based implementation
- **SC-003**: All chart interactions (hover tooltips, visual feedback) respond within 100 milliseconds
- **SC-004**: The loading skeleton provides visual structure that matches the final content layout with no cumulative layout shift greater than 0.1 CLS units
- **SC-005**: The page maintains existing data accuracy - all displayed values match the backend calculations exactly
- **SC-006**: The redesign receives positive feedback in user testing sessions, with at least 80% of users rating the visual design as "appealing" or "very appealing"
- **SC-007**: All three allocation buckets are visually distinguishable without relying solely on color (e.g., through position, icons, or labels)

## Clarifications

### Session 2026-03-26

- Q: What visual aesthetic direction should guide the redesign? → A: Refined/Minimal - precise spacing, distinctive but subtle typography, restrained asymmetry, focus on negative space
- Q: How should the layout adapt across screen sizes? → A: Mobile-first progressive - starts with mobile layout, progressively enhances for larger screens
- Q: What scope of animations should be implemented? → A: Chart interactions and page load - animations focused on chart hover/click states and staggered content reveal on initial load

## Assumptions

- The existing data queries (`getInsights`, `getAllocationSummary`) will remain unchanged and continue to provide the same data structures
- The Recharts library remains the charting solution (already installed in the project)
- The period selector functionality is preserved but styled to match the new aesthetic
- Color coding for allocation buckets (Needs/Wants/Future) will maintain consistency with the rest of the application
- The page remains a client component due to chart rendering requirements
