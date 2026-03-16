# Feature Specification: Core MVP

**Feature Branch**: `001-core-mvp`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Build the MVP of the Intent expense tracker with auth, onboarding, transaction management, dashboard, and 50/30/20 budgeting"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Creation & Onboarding (Priority: P1)

A new user discovers Intent and wants to start tracking expenses using
the 50/30/20 budgeting method. They register with email/password or
Google, then complete a one-time onboarding step where they enter their
monthly income and optionally adjust the default 50/30/20 allocation
percentages. After onboarding, they land on the dashboard ready to
track expenses.

**Why this priority**: Without authentication and onboarding, no other
feature can function. The financial profile (income + allocation
percentages) is the foundation for all budgeting calculations.

**Independent Test**: Can be fully tested by registering a new account,
completing onboarding with a custom income and allocation split, and
verifying the user lands on the dashboard with their profile saved.

**Acceptance Scenarios**:

1. **Given** a visitor on the login page, **When** they click "Create
   account" and submit valid name/email/password, **Then** an account
   is created and they are redirected to the onboarding page.
2. **Given** a visitor on the login page, **When** they click "Sign in
   with Google" and authorize, **Then** an account is created (or
   linked if email exists) and they are redirected to onboarding (if
   no financial profile) or the dashboard (if profile exists).
3. **Given** a new user on the onboarding page, **When** they enter a
   monthly income of $5,000 and keep the default 50/30/20 split,
   **Then** their financial profile is saved and they are redirected
   to the dashboard.
4. **Given** a new user on the onboarding page, **When** they adjust
   allocations to 60/25/15, **Then** the system validates the total
   equals 100% and saves the custom split.
5. **Given** a new user on the onboarding page, **When** they set
   allocations that do not total 100%, **Then** the system displays
   a validation error and prevents submission.
6. **Given** a returning user with a completed profile, **When** they
   log in, **Then** they are taken directly to the dashboard
   (skipping onboarding).
7. **Given** an unauthenticated user, **When** they attempt to access
   any app route, **Then** they are redirected to the login page.

---

### User Story 2 - Transaction Management (Priority: P2)

An authenticated user wants to record daily income and expenses. They
tap the floating action button to open a bottom sheet, enter the
amount, select income or expense, pick a category, choose a date, and
optionally add a description. They can view all transactions in a
searchable, filterable list with infinite scroll, and edit or delete
transactions via swipe actions.

**Why this priority**: Transaction recording is the core value
proposition. Without it, the app has no data to power budgets,
insights, or the dashboard. This is the feature users will interact
with most frequently.

**Independent Test**: Can be fully tested by adding several income and
expense transactions, verifying they appear in the transaction list,
searching/filtering them, editing one, and deleting another.

**Acceptance Scenarios**:

1. **Given** an authenticated user on any page, **When** they tap the
   FAB, **Then** a bottom sheet opens with fields for amount, type,
   category, date, and description.
2. **Given** the add transaction sheet is open, **When** the user
   enters $50 as an expense under "Groceries" for today, **Then**
   the transaction is saved and appears in the transaction list.
3. **Given** the add transaction sheet is open, **When** the user
   submits without an amount, **Then** a validation error is shown
   and the form is not submitted.
4. **Given** the transactions page with 50+ entries, **When** the user
   scrolls down, **Then** additional transactions load automatically
   via infinite scroll.
5. **Given** the transactions page, **When** the user types "groceries"
   in the search bar, **Then** only transactions matching that term
   are displayed.
6. **Given** the transactions page, **When** the user filters by
   "Expense" type, **Then** only expense transactions are shown.
7. **Given** a transaction in the list, **When** the user swipes left,
   **Then** edit and delete action buttons are revealed.
8. **Given** the edit action is tapped, **When** the user changes the
   amount from $50 to $75 and saves, **Then** the updated amount is
   reflected in the list.
9. **Given** the delete action is tapped, **When** the user confirms
   deletion, **Then** the transaction is removed from the list.

---

### User Story 3 - Dashboard Overview (Priority: P3)

An authenticated user opens the app and sees their financial snapshot:
current balance, 50/30/20 harmony cards showing spending progress per
bucket, recent transactions, upcoming recurring items, and quick stats
(daily average, safe to spend, days left in the month).

**Why this priority**: The dashboard is the landing page and provides
the at-a-glance value that keeps users engaged. It depends on
transactions existing (P2) to show meaningful data.

**Acceptance Scenarios**:

1. **Given** a user with income of $5,000 and $1,200 in expenses this
   month, **When** they view the dashboard, **Then** the balance shows
   $3,800.
2. **Given** a user with 50/30/20 allocation, **When** they view the
   harmony cards, **Then** each card shows the spent amount, budget
   target, and a progress bar for that bucket.
3. **Given** a user with recent transactions, **When** they view the
   dashboard, **Then** the last 5 transactions are displayed in the
   recent transactions widget.
4. **Given** a user with active recurring transactions, **When** they
   view the dashboard, **Then** the next 3 upcoming recurring items
   are shown.
5. **Given** a user with transaction data, **When** they view quick
   stats, **Then** daily average spend, safe-to-spend amount, and
   days remaining in the month are calculated and displayed.
6. **Given** a new user with no transactions, **When** they view the
   dashboard, **Then** an empty state is shown with a prompt to add
   their first transaction.

---

### User Story 4 - Category Management (Priority: P4)

A user wants to customize their expense and income categories beyond
the 18 defaults seeded at registration. They can view categories
segmented by type (Income/Expense) with expense categories grouped
by allocation bucket (Needs/Wants/Future). They can create new
categories with a name, icon, type, and bucket assignment, and edit
or delete existing ones.

**Why this priority**: Categories organize transactions and budgets.
The default set covers most users, but customization is important for
personalization. This builds on the transaction foundation (P2).

**Acceptance Scenarios**:

1. **Given** a newly registered user, **When** they navigate to the
   categories page, **Then** they see 18 default categories (6 Needs,
   5 Wants, 4 Future, 3 Income).
2. **Given** the categories page showing expenses, **When** the user
   taps the "Wants" tab, **Then** only categories assigned to the
   Wants bucket are displayed.
3. **Given** the categories page, **When** the user creates a new
   expense category "Coffee" with a coffee emoji and assigns it to
   Wants, **Then** the category appears under the Wants tab.
4. **Given** an existing category, **When** the user edits its name
   and saves, **Then** the updated name is reflected in the list and
   in any transaction using that category.
5. **Given** a category with linked transactions, **When** the user
   deletes the category, **Then** the category is removed and those
   transactions have their category set to none.

---

### User Story 5 - Budget Tracking (Priority: P5)

A user wants to set monthly spending limits per category and track
progress against those limits. They navigate to the budgets page,
see budgets grouped by allocation bucket, and can create or edit
budget amounts. The system shows how much has been spent versus the
budgeted amount for each category.

**Why this priority**: Budgets give users actionable spending limits
per category, building on transactions (P2) and categories (P4).
This is the active planning layer of the 50/30/20 system.

**Acceptance Scenarios**:

1. **Given** the budgets page, **When** the user creates a budget of
   $500/month for Groceries, **Then** the budget appears under the
   Needs group with a $0 spent indicator.
2. **Given** a budget of $500 for Groceries and $200 in grocery
   transactions this month, **When** the user views the budgets page,
   **Then** the Groceries budget shows "$200 of $500" with a 40%
   progress bar.
3. **Given** the budgets page, **When** the user navigates to a
   different month, **Then** budgets and spending totals reflect that
   month's data.
4. **Given** a budget, **When** the user edits the amount from $500
   to $600 and saves, **Then** the updated budget is reflected.
5. **Given** a budget, **When** spending exceeds the budget amount,
   **Then** the progress bar visually indicates the overspend (e.g.,
   red color or exceeding 100%).

---

### User Story 6 - Recurring Transactions (Priority: P6)

A user wants to define recurring income and expenses (e.g., monthly
salary, weekly subscriptions) so they can track upcoming obligations.
They can create, edit, pause, resume, and delete recurring items with
configurable frequency.

**Why this priority**: Recurring transactions reduce manual entry
effort and enable the "upcoming" widget on the dashboard. They depend
on the transaction and category infrastructure being in place.

**Acceptance Scenarios**:

1. **Given** the recurring page, **When** the user creates a recurring
   expense of $15/month for "Netflix" starting March 1, **Then** the
   item appears in the active list with next due date shown.
2. **Given** an active recurring item, **When** the user toggles it
   to paused, **Then** it moves to the paused tab and no future
   transactions are generated.
3. **Given** a paused recurring item, **When** the user toggles it
   back to active, **Then** it returns to the active list with the
   correct next due date.
4. **Given** a recurring transaction with a next due date of today,
   **When** the system processes it, **Then** a transaction is
   automatically created and the next due date advances per the
   configured frequency.
5. **Given** the recurring page, **When** the user edits the amount
   or frequency and saves, **Then** the changes apply to future
   occurrences only.

---

### User Story 7 - Insights & Analytics (Priority: P7)

A user wants to understand their spending patterns and 50/30/20
compliance over time. They view a donut chart showing actual
allocation versus targets, a bar chart of spending by category, and
summary statistics. They can filter by different time ranges.

**Why this priority**: Insights provide the reflective, mindful
aspect of the app. They require sufficient transaction history to be
meaningful, making this the final layer of the MVP.

**Acceptance Scenarios**:

1. **Given** a user with transactions across all three buckets,
   **When** they view the insights page, **Then** a donut chart shows
   the actual Needs/Wants/Future split alongside a compliance score.
2. **Given** the insights page, **When** the user selects "3 Months"
   as the date range, **Then** all charts and statistics update to
   reflect the last 3 months of data.
3. **Given** a user spending 55% on Needs (target 50%), **When** they
   view the allocation performance section, **Then** Needs shows as
   over-target with the variance displayed.
4. **Given** the insights page, **When** the user views spending by
   category, **Then** a horizontal bar chart shows categories sorted
   by total spend with bucket color coding.
5. **Given** a user with transaction data, **When** they view summary
   stats, **Then** total income, total expenses, net balance, and
   transaction count are displayed for the selected period.

---

### Edge Cases

- What happens when a user registers with an email already linked to
  a Google account? Account linking merges the accounts.
- What happens when a user deletes all categories? Transactions
  retain their data but show no category. The user can still create
  new categories.
- What happens when a budget exists for a deleted category? The
  budget is also deleted (cascade).
- What happens when a recurring transaction's category is deleted?
  The recurring item remains but with no category assigned.
- What happens when allocation percentages are changed after budgets
  exist? Existing budgets remain unchanged; only the harmony cards
  and compliance calculations use the new percentages.
- What happens when the user has no internet connection? The app
  displays an offline banner; cached data (if any) is shown with
  a "last updated" timestamp.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to register with email/password
  or Google OAuth and link accounts between these providers.
- **FR-002**: System MUST redirect newly registered users (without a
  financial profile) to the onboarding page before granting access to
  app features.
- **FR-003**: System MUST allow users to set a monthly income target
  and customize allocation percentages (must total 100%) during
  onboarding, with defaults of 50/30/20.
- **FR-004**: System MUST seed 18 default categories (6 Needs,
  5 Wants, 4 Future, 3 Income) upon user registration.
- **FR-005**: System MUST support full CRUD operations on transactions
  with amount (required), type (required), category (optional), date
  (required), and description (optional).
- **FR-006**: System MUST display transactions in a searchable,
  filterable list with infinite scroll pagination.
- **FR-007**: System MUST provide swipe-based edit and delete actions
  on transaction list items.
- **FR-008**: System MUST display a dashboard with current balance,
  50/30/20 harmony cards, recent transactions, upcoming recurring
  items, and quick stats.
- **FR-009**: System MUST support full CRUD operations on categories
  with name, type (income/expense), icon, and allocation bucket
  (for expense categories).
- **FR-010**: System MUST display categories segmented by type with
  expense categories grouped by allocation bucket tabs.
- **FR-011**: System MUST support creating and editing budgets per
  category with amount and period (monthly/weekly).
- **FR-012**: System MUST track and display actual spending against
  budget amounts, grouped by allocation bucket.
- **FR-013**: System MUST support CRUD operations on recurring
  transactions with configurable frequency (daily through yearly),
  active/paused toggle, and start/end dates.
- **FR-014**: System MUST auto-generate transactions from active
  recurring items based on their schedule and track next due dates.
- **FR-015**: System MUST provide insights including 50/30/20
  compliance visualization, spending by category chart, allocation
  performance (actual vs. target), and summary statistics.
- **FR-016**: System MUST support date range filtering on insights
  (current month, 3 months, 6 months, 1 year).
- **FR-017**: System MUST scope all data by authenticated user; no
  user can access another user's data.
- **FR-018**: System MUST use skeleton screens for all loading states
  instead of spinners.
- **FR-019**: System MUST provide a mobile-first responsive layout
  with bottom tab navigation on mobile and sidebar on desktop.
- **FR-020**: System MUST use bottom sheets as the primary modal
  pattern on mobile for all create/edit forms.
- **FR-021**: System MUST allow users to update their financial
  profile (income and allocation percentages) after initial setup.
- **FR-022**: System MUST provide a profile page with user info,
  navigation to settings, and logout functionality.

### Key Entities

- **User**: Account holder with name, email, and authentication
  credentials. Has one financial profile and owns all other entities.
- **Financial Profile**: Stores monthly income target and custom
  allocation percentages (needs/wants/future). One per user.
- **Category**: User-scoped label for organizing transactions and
  budgets. Has a type (income/expense) and allocation bucket
  (needs/wants/future for expenses). 18 seeded by default.
- **Transaction**: A single income or expense entry with amount,
  type, date, optional category, and optional description.
- **Budget**: A spending target for a specific category and period
  (monthly/weekly). Tracks spending against the limit.
- **Recurring Transaction**: A scheduled template that auto-generates
  transactions at a configurable frequency. Can be paused/resumed.

### Assumptions

- The app is dark-theme only for v1 (no light mode toggle).
- Currency is USD only for v1; multi-currency is out of scope.
- Offline support is limited to showing an error state; no offline
  data persistence or sync.
- Push notifications are out of scope for v1.
- Biometric authentication is out of scope for v1.
- Export (CSV/PDF) is out of scope for v1.
- The auto-generation of recurring transactions happens when the user
  visits the app (client-triggered check), not via a background cron
  job.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of new users complete the onboarding flow (income +
  allocation setup) without abandoning.
- **SC-002**: Users can add a new transaction in under 15 seconds from
  tapping the FAB to saving.
- **SC-003**: The transaction list loads the first page of results
  within 2 seconds on a standard mobile connection.
- **SC-004**: Users can find a specific past transaction using search
  or filters within 10 seconds.
- **SC-005**: The dashboard displays all widgets (balance, harmony
  cards, recent transactions, quick stats) within 2.5 seconds of
  page load.
- **SC-006**: All interactive elements meet the 44x44px minimum touch
  target on mobile viewports.
- **SC-007**: All text meets WCAG 2.1 AA contrast requirements
  (4.5:1 ratio minimum).
- **SC-008**: Users can view their 50/30/20 compliance score and
  understand their spending distribution within one tap from the
  main navigation.
- **SC-009**: The app is fully functional across mobile (375px+),
  tablet (768px+), and desktop (1024px+) viewports.
- **SC-010**: Zero cross-user data leakage; every data query is
  scoped by authenticated user ID.
