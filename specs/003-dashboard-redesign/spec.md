# Feature Specification: Dashboard Visual Redesign

**Feature Branch**: `003-dashboard-redesign`  
**Created**: 2026-03-26  
**Status**: Draft  
**Input**: User description: "Redesign the Dashboard page (app/(app)/page.tsx) to elevate visual hierarchy and personality. The current layout is functional but generic — flat cards with uniform typography and no focal point. Goals: 1. Make the monthly balance a hero element with strong typographic contrast 2. Give the 50/30/20 bucket section a more distinctive visual treatment 3. Consolidate the 3 quick-stat cards into a single inline strip or integrated sub-section under the balance card 4. Add subtle micro-interactions on hover for transaction and recurring items 5. Establish a clear editorial typographic hierarchy. Constraints: keep the existing data model and shadcn/ui component primitives, no new dependencies, mobile-first, preserve the two-column layout (lg:grid-cols-[1.5fr_1fr]) for transactions + recurring."

## Clarifications

### Session 2026-03-26

- Q: Should bucket state signaling (on-track / nearing limit / over-budget) use color alone or color plus an additional visual indicator? → A: Color + a small icon or symbol (e.g., checkmark, warning triangle, exclamation) per state — satisfies WCAG 1.4.1.
- Q: At what progress percentage does a bucket transition from "on-track" to "nearing limit"? → A: 80% — standard budgeting warning threshold.
- Q: Should the balance hero use a distinct color when the monthly balance is negative? → A: Yes — render in a destructive/warning color (e.g., red) when negative; default foreground color when zero or positive.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instantly Grasp Monthly Financial Position (Priority: P1)

A user opens the dashboard and immediately understands how the month is going — their current balance is the first and most prominent thing they see, with income and expense context visible nearby. The supporting quick stats (daily average, safe to spend, days remaining) appear directly under the balance without requiring the user to scroll to separate cards.

**Why this priority**: The primary job of a financial dashboard is to answer "how am I doing?" at a glance. The balance hero and inline stats together deliver this core value with no other changes needed.

**Independent Test**: Can be fully tested by loading the dashboard and verifying the balance is visually dominant and quick stats are immediately adjacent to it, without any other redesign work applied.

**Acceptance Scenarios**:

1. **Given** the dashboard loads with financial data, **When** the user views the page, **Then** the monthly balance figure is the largest, most visually prominent number on the screen.
2. **Given** the balance hero is visible, **When** the user looks below or around the balance, **Then** daily average spend, safe-to-spend amount, and days remaining are visible inline — not in separate scrollable cards.
3. **Given** the dashboard is viewed on a mobile device, **When** the page loads, **Then** the balance hero and inline stats render correctly and readably without horizontal overflow.

---

### User Story 2 - Understand Budget Category Progress at a Glance (Priority: P2)

A user wants to see how their spending aligns with the 50/30/20 framework for the current month. The redesigned section makes it easy to compare all three buckets simultaneously without horizontal scrolling on desktop, using a layout that communicates relative progress and overage clearly.

**Why this priority**: Budget tracking is the core differentiator of this app. A clearer 50/30/20 visualization directly supports the user's intent and reduces the cognitive effort required to assess their spending health.

**Independent Test**: Can be fully tested by verifying the bucket section in isolation: all three buckets are visible simultaneously on tablet and desktop, progress is visually communicated for each, and the section remains usable on mobile. A bucket with a spending ratio **≥ 80%** of its target shows `AlertTriangle`; a bucket **≥ 100%** shows `AlertCircle`.

**Acceptance Scenarios**:

1. **Given** the user has expenses recorded in the current month, **When** they view the 50/30/20 section, **Then** all three budget buckets are visible simultaneously on screens wider than mobile.
2. **Given** a bucket has exceeded its target, **When** the user views that bucket, **Then** the over-budget state is visually distinct from a healthy or under-spent bucket via both color and an icon — not color alone.
3. **Given** no expenses have been recorded yet, **When** the user views the section, **Then** an appropriate empty state is shown (or the section is hidden) rather than displaying zeros in a misleading way.
4. **Given** the user is on a mobile screen, **When** they view the 50/30/20 section, **Then** the layout remains navigable without requiring horizontal scroll (stacking or alternative layout is acceptable).

---

### User Story 3 - Navigate Transactions and Recurring Items Confidently (Priority: P3)

A user browses the recent transactions list and the upcoming recurring items panel. Hovering over (or tapping) any item gives subtle visual feedback that the element is interactive, improving confidence that items can be acted upon.

**Why this priority**: Micro-interactions are a polish concern that reinforces the quality of the product and improves discoverability of interactive elements. They do not block core functionality but elevate the overall experience.

**Independent Test**: Can be fully tested by hovering over transaction and recurring items and confirming hover states appear. Deliverable independently of the layout redesign.

**Acceptance Scenarios**:

1. **Given** the recent transactions list is populated, **When** a user hovers over a transaction item, **Then** a subtle visual change (background shift, elevation, or highlight) indicates the item is interactive.
2. **Given** the upcoming recurring panel is populated, **When** a user hovers over a recurring item, **Then** the same consistent hover treatment is applied.
3. **Given** the user is on a touch device, **When** there is no hover capability, **Then** the page remains fully usable without any broken or stuck hover states.

---

### User Story 4 - Experience Clear Information Hierarchy Across the Page (Priority: P4)

A user scanning the dashboard can immediately identify section boundaries and the relative importance of each piece of information. Section headings, data labels, and supporting text use visually distinct sizes and weights so the hierarchy is obvious without requiring the user to read every word.

**Why this priority**: Typographic hierarchy is a foundational UX concern. Without it, all sections compete equally for attention and the dashboard feels generic. This enhances all other stories but can also be assessed independently.

**Independent Test**: Can be fully tested by reviewing the dashboard and confirming that section headings, primary values, secondary labels, and supporting text are distinguishable from each other purely by visual weight and size.

**Acceptance Scenarios**:

1. **Given** the full dashboard is visible, **When** a user scans the page, **Then** at least three distinct visual levels of text hierarchy are present (e.g., hero/primary, section heading, label/supporting text).
2. **Given** the section headings are present, **When** compared to one another, **Then** they are visually consistent but clearly subordinate to the balance hero.
3. **Given** the dashboard is in dark mode (if supported), **When** the user views it, **Then** the typographic hierarchy remains legible and intentional.

---

### Edge Cases

- What happens when the monthly balance is negative? The hero element must handle negative values legibly and without layout breakage, and the balance figure renders in the destructive/warning color.
- What happens when the bucket summaries list is empty? The 50/30/20 section should either hide gracefully or show a meaningful empty state.
- What happens when recent transactions or upcoming recurring lists are empty? Existing empty state placeholders must remain functional and styled consistently with the redesign.
- What happens when a bucket's progress value exceeds 100%? The visual treatment must not clip or distort — the over-budget state (progress ≥ 100%) must be handled gracefully with its designated color and icon.
- What happens when a bucket is exactly at 80%? It transitions into the "nearing limit" state (80% ≤ progress < 100%).
- What happens on very narrow screens (< 360px)? The balance hero typography must scale down without overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The monthly balance figure MUST be the visually dominant element on the dashboard, clearly larger and heavier in weight than any other numeric value on the page. When the balance is negative, the figure MUST render in the app's destructive/warning color (e.g., red); when zero or positive it uses the default foreground color.
- **FR-002**: The three quick stats (daily average spend, safe to spend, days remaining) MUST be displayed inline with or directly beneath the balance — not as separate peer-level cards.
- **FR-003**: The 50/30/20 bucket section MUST display all three buckets simultaneously on viewports wider than mobile without requiring horizontal scrolling.
- **FR-004**: Each bucket MUST communicate its progress state using both a distinct color AND a small icon or symbol per state (e.g., checkmark, warning triangle, exclamation mark), so the state is distinguishable without relying on color alone (WCAG 1.4.1). States are defined by the spending ratio (spent ÷ target): on-track (ratio < 80%), nearing limit (80% ≤ ratio < 100%), over-budget (ratio ≥ 100%).
- **FR-005**: Transaction items in the recent transactions list MUST have a visible hover interaction state.
- **FR-006**: Recurring items in the upcoming recurring panel MUST have a visible hover interaction state consistent with transaction items.
- **FR-007**: The dashboard MUST maintain a two-column layout (recent transactions left, upcoming recurring right) on large screens.
- **FR-008**: The redesign MUST NOT introduce new third-party dependencies beyond what is already installed.
- **FR-009**: The redesign MUST NOT alter the data fetching logic or data shape consumed by the dashboard.
- **FR-010**: All existing empty states (no transactions, no recurring, no buckets) MUST remain functional and visually coherent with the redesign.
- **FR-011**: The page MUST be fully usable on mobile screen widths as the primary layout target (mobile-first).
- **FR-012**: The typographic hierarchy MUST produce at least three visually distinct levels: hero/primary data, section headings, and supporting labels.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can identify the monthly balance within 2 seconds of the page loading, without any scrolling, on both mobile and desktop.
- **SC-002**: A user can compare all three 50/30/20 bucket progress values simultaneously on a tablet or desktop screen without scrolling horizontally.
- **SC-003**: A user can distinguish between at least three levels of typographic hierarchy on the dashboard when asked to identify heading, data, and label text — with no prompting.
- **SC-004**: All hover interaction states on transaction and recurring items are perceptible within a single hover event, with no delay longer than 200ms.
- **SC-005**: The dashboard renders without visual overflow or layout breakage at screen widths of 360px, 768px, and 1280px.
- **SC-006**: All data previously visible on the dashboard (balance, income, expenses, quick stats, bucket summaries, recent transactions, upcoming recurring) remains visible after the redesign — nothing is removed.
- **SC-007**: When the monthly balance is negative, the balance hero renders in a visually distinct destructive color (red) perceptible to a user without any additional context or tooltip.

## Assumptions

- The app currently uses a dark/light theme system compatible with the existing design tokens; the redesign should respect and leverage existing CSS variables rather than introducing hardcoded values.
- Hover states are desktop-only enhancements; the product does not currently require touch-specific interaction feedback beyond what the OS provides.
- "No new dependencies" means no new npm packages; using existing installed libraries (shadcn/ui, Tailwind, date-fns, etc.) is permitted.
- Bucket progress values can legitimately exceed 100%; the over-budget visual state should be handled but is not required to be a blocking error state.
- The redesign is a visual and layout change only; no new routes, API endpoints, or server-side logic is introduced.
