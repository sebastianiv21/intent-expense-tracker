# Feature Specification: Budgets Page Redesign

**Feature Branch**: `010-budgets-page-redesign`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Redesign the Budgets page to match the visual polish and interaction patterns from the Categories page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse and understand monthly budget health (Priority: P1)

A user opens the Budgets page and immediately sees which month they're viewing, how much of their total budget has been spent, and how individual category budgets are tracking — all without scrolling or tapping anything.

**Why this priority**: The primary job of the page is to communicate budget status at a glance. Everything else depends on this working well.

**Independent Test**: Navigate to /budgets. The month name, a full-width progress bar (spent vs. budgeted), three summary stats (Budgeted / Spent / Remaining), and grouped budget cards with per-card progress bars are all visible.

**Acceptance Scenarios**:

1. **Given** budgets exist for the current month, **When** the page loads, **Then** the month header, a progress bar showing overall spend, and all budget cards grouped by bucket are visible without scrolling.
2. **Given** total spending exceeds total budget, **When** the page loads, **Then** the overall progress bar and the Remaining stat are shown in a destructive (red) color.
3. **Given** a budget is over its individual limit, **When** the page loads, **Then** that card shows an "Over budget" label in destructive color.

---

### User Story 2 — Navigate between months (Priority: P2)

A user taps the left or right chevron to move between months and sees the budget cards and summary refresh to reflect the selected month.

**Why this priority**: Historical review is a core use case; users need to compare months easily.

**Independent Test**: Tap the left chevron. The month label changes to the previous month and all cards update.

**Acceptance Scenarios**:

1. **Given** the current month is displayed, **When** the user taps the left chevron, **Then** the month label updates to the previous month.
2. **Given** any month is displayed, **When** the user taps the right chevron, **Then** the month label advances by one month.

> **Note**: Budget data does not re-fetch on month change (client-side label navigation only). Fixing the data-refresh behavior is a known limitation deferred to a future feature.

---

### User Story 3 — Create and edit a budget via the bottom sheet (Priority: P1)

A user taps "New budget" or "Edit" on a card to open a polished bottom sheet with a sticky header (title + X close button), a scrollable form body (category, amount, period, start date), and a gradient Save button pinned to the footer.

**Why this priority**: Budget creation/editing is the primary write action on this page and must feel as polished as the category sheet.

**Independent Test**: Tap "New budget". A bottom sheet slides up with a bold title, X close button, form fields, and a gradient Save button. Fill all fields and tap Save — the sheet closes and the new budget appears.

**Acceptance Scenarios**:

1. **Given** the sheet is open, **When** the user taps X, **Then** the sheet closes with no changes saved.
2. **Given** the form is incomplete (no category or invalid amount), **When** the user views the Save button, **Then** the Save button is disabled.
3. **Given** all fields are valid, **When** the user taps Save, **Then** the sheet closes and the budget list updates.
4. **Given** the user taps Edit on an existing budget, **When** the sheet opens, **Then** all fields are pre-populated with the current budget values and the button reads "Update".

---

### User Story 4 — Delete a budget with inline confirmation (Priority: P2)

A user opens the action menu on a budget card, taps Delete, and sees an inline "Delete?" prompt with Confirm and Cancel buttons — without a browser dialog interrupting the experience.

**Why this priority**: `window.confirm()` is inconsistent with the app's design system and blocks the UI thread. Inline confirmation matches the categories page pattern.

**Independent Test**: Tap the action menu on any budget card, tap Delete. The card row transforms to show "Delete?" text + a red confirm button + a cancel X button. Tapping confirm removes the card; tapping cancel restores the normal row.

**Acceptance Scenarios**:

1. **Given** a budget card is showing, **When** the user taps Delete in the action menu, **Then** the card inline shows "Delete?" with confirm and cancel buttons (no browser dialog).
2. **Given** the inline confirm is showing, **When** the user taps Confirm, **Then** the budget is deleted and the card is removed.
3. **Given** the inline confirm is showing, **When** the user taps Cancel, **Then** the card returns to its normal state with no deletion.
4. **Given** deletion fails, **When** the user taps Confirm, **Then** an error message appears below the card row.

---

### User Story 5 — Empty state per bucket (Priority: P3)

A user who has no budgets in a given bucket sees a rich empty state with an icon, heading, description, and an "Add budget" button — not just a plain dashed border.

**Why this priority**: Empty states set the tone for first-time users and guide them toward action.

**Independent Test**: Delete all budgets from one bucket. The bucket section shows a centered empty state with an emoji, heading, and a tappable Add button.

**Acceptance Scenarios**:

1. **Given** a bucket has no budgets, **When** the page renders that bucket section, **Then** a centered card with emoji, heading ("No [Bucket] budgets yet"), description, and an Add button is shown.
2. **Given** the Add button in an empty state is tapped, **When** the sheet opens, **Then** it behaves identically to tapping "New budget" in the page header.

---

### Edge Cases

- What happens when total budgeted is $0? The overall progress bar should show 0% with no divide-by-zero error.
- What happens when a category is deleted after a budget references it? The budget card should still render using the stored category name.
- What happens when the sheet form is scrolled and the keyboard is open on mobile? The footer Save button must remain visible (pinned, not scrolled away).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page header MUST use the shared `PageHeader` component with title, description, and "New budget" action button.
- **FR-002**: The month navigation and summary section MUST display a full-width progress bar reflecting total spent vs. total budgeted for the selected month.
- **FR-003**: The Remaining stat MUST render in destructive color when its value is negative.
- **FR-004**: Each budget card MUST display a 3px left border in the bucket's accent color, a tinted emoji icon circle, category name, spent/total sub-label, per-card progress bar, bucket label, and an "Over budget" label when spent exceeds budgeted.
- **FR-005**: Budget card actions MUST be accessible via a `MoreHorizontal` dropdown menu (Edit / Delete) instead of separate visible buttons.
- **FR-006**: The delete flow MUST use an inline two-step confirmation (show "Delete?" + confirm/cancel buttons in place of the dropdown trigger) with no `window.confirm()` calls.
- **FR-007**: Deletion errors MUST surface as an inline error message below the affected card row.
- **FR-008**: The budget form sheet MUST have a sticky header (title + X close button), a scrollable form body, and a gradient CTA button pinned to the footer.
- **FR-009**: Per-bucket empty states MUST display an emoji, a heading, a description, and an "Add budget" button that opens the creation sheet.
- **FR-010**: The loading skeleton MUST reflect the new page structure: header skeleton, month+summary card skeleton, and per-bucket card skeletons.

### Key Entities

- **Budget**: Belongs to a category and a user; has amount, period (monthly/weekly), and start date.
- **BudgetWithSpending**: A budget enriched with the total amount spent against it for a given month.
- **AllocationBucket**: One of `needs`, `wants`, `future` — determines the accent color and grouping of budget cards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All budget cards display bucket-color left borders and icon circles consistently across all three buckets.
- **SC-002**: No `window.confirm()` calls remain in the budgets page component.
- **SC-003**: The delete confirmation flow completes (confirm or cancel) without leaving the page or opening a browser dialog.
- **SC-004**: The budget form sheet opens, scrolls, and saves without the footer CTA button being obscured by form content.
- **SC-005**: The page renders without visible layout regressions on viewports from 320px to 1280px wide.
- **SC-006**: `pnpm lint` and `pnpm build` pass with zero errors after all changes.

## Assumptions

- The bucket accent colors, card border pattern, inline delete pattern, and sheet layout are taken directly from `categories-page.tsx` (spec 008/009) and must not deviate.
- No new dependencies are required; all UI primitives (`Sheet`, `DropdownMenu`, `Progress`, `Button`, `Input`, `Select`, `Label`, `Skeleton`) are already installed.
- The `PageHeader` component already exists at `web/components/page-header.tsx` and accepts `title`, `description`, and `action` props.
- Month navigation state remains client-side; no URL param routing is needed.
- The sheet does not need a live preview card (unlike the category sheet) since budgets have no visual identity beyond their category name and amount.
