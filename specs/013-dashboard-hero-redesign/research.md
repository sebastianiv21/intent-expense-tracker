# Research: Dashboard Hero Card and List Pattern Consistency

**Feature**: 013-dashboard-hero-redesign
**Date**: 2026-03-28

## Research Summary

This feature is a pure UI redesign with no new dependencies, APIs, or data access patterns. Research focused on establishing design decisions for the hero card visual treatment and confirming existing component patterns to follow.

## Decisions

### 1. Hero Card Visual Treatment

**Decision**: Use primary color (`--primary: #c4714a`) as the hero card background with a gradient overlay for visual depth. The balance amount remains in a large, bold typeface. Supporting metrics (income/expenses) use a lighter text treatment on the colored background.

**Rationale**:
- Primary color creates visual prominence and brand consistency
- Gradient adds subtle visual interest without introducing new colors
- Existing design token avoids need for new color definitions
- Dark primary color (#c4714a) works well with light foreground text on dark mode background

**Alternatives Considered**:
- Solid primary color (flat): Rejected as lacking visual interest
- Box shadow/glow effect: Rejected as potentially too heavy for dark theme
- Border-only accent: Rejected as not meeting "prominent hero card" requirement

### 2. Transaction List Date Grouping on Dashboard

**Decision**: Extract and reuse the date grouping logic from `transaction-list.tsx` (the `groupByDate` function) to create consistent date sections ("Today", "Yesterday", "MMM d") in the dashboard's recent transactions section.

**Rationale**:
- Maintains exact consistency with transactions page
- Reduces cognitive load for users navigating between pages
- Existing code can be extracted to a shared utility if needed

**Alternatives Considered**:
- Simpler list without grouping: Rejected as inconsistent with spec requirement FR-006
- Different date format: Rejected to maintain consistency

### 3. Number of Recent Transactions

**Decision**: Show 5 transactions maximum in the recent transactions section, maintaining the current limit from the existing dashboard implementation.

**Rationale**:
- Matches current implementation
- Avoids excessive vertical scrolling on mobile
- "View all" link provides access to full list
- Spec assumption: "limited to avoid excessive scrolling"

**Alternatives Considered**:
- 10 transactions: Rejected as potentially too long for mobile viewport
- 3 transactions: Rejected as potentially too few to be useful

### 4. Recurring Item Card Styling

**Decision**: Replace the current simple border card with the same `rounded-xl` card styling used by `TransactionItem`, including hover state (`hover:bg-muted/30`) and proper rounded corners.

**Rationale**:
- Creates visual harmony across all list sections
- Follows spec requirement FR-009
- Existing pattern proven in transactions page

**Alternatives Considered**:
- Keep current styling: Rejected as inconsistent with spec FR-009
- Create new card variant: Rejected as unnecessary duplication

### 5. Quick Stats Row Treatment

**Decision**: Move quick stats (daily average, safe to spend, days remaining) inside the hero card as a secondary tier with a subtle border-top separator, maintaining their current layout but on the primary color background.

**Rationale**:
- Keeps all balance-related information in one prominent card
- Visual hierarchy: balance > income/expenses > quick stats
- Spec requirement FR-004: "secondary row within the hero card area"

**Alternatives Considered**:
- Separate card for quick stats: Rejected as fragmenting the hero concept
- Remove quick stats: Rejected as losing valuable information

## No New Technologies Required

This feature uses only existing stack capabilities:
- Tailwind CSS 4 for styling
- shadcn/ui Card component as base
- Existing `cn()` utility for conditional classes
- date-fns for date formatting (already imported)
- Existing design tokens from `globals.css`
