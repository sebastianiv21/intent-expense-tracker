# Tasks: Core MVP

**Input**: Design documents from `/specs/001-core-mvp/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/actions-contracts.md, research.md, quickstart.md

**Tests**: Not explicitly requested in the specification. Test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and base configuration

- [ ] T001 Initialize Next.js 16 project with pnpm, install all dependencies (next, react, drizzle-orm, @neondatabase/serverless, better-auth, zod, tailwindcss, recharts, date-fns, lucide-react, class-variance-authority, clsx, tailwind-merge) in `package.json`
- [ ] T002 [P] Configure TypeScript strict mode in `tsconfig.json`
- [ ] T003 [P] Configure ESLint with eslint-config-next in `eslint.config.mjs`
- [ ] T004 [P] Configure Tailwind CSS 4 with dark theme design tokens (colors, typography, spacing) in `app/globals.css`
- [ ] T005 [P] Configure PostCSS in `postcss.config.mjs`
- [ ] T006 [P] Create `lib/utils.ts` with `cn()` utility (clsx + tailwind-merge)
- [ ] T007 [P] Configure shadcn/ui in `components.json` and install base primitives (button, input, label, sheet, dialog, tabs, separator, avatar, dropdown-menu, toggle, skeleton, card, badge, progress, select, popover, calendar) in `components/ui/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, auth, shared types, and app shell that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Define Drizzle ORM schema with all enums (transaction_type, budget_period, allocation_bucket, recurrence_frequency) and all tables (user, session, account, verification, financial_profile, categories, transactions, budgets, recurring_transactions) with relations in `lib/schema.ts`
- [ ] T009 Configure Neon Serverless database connection in `lib/db.ts`
- [ ] T010 Configure Drizzle Kit in `drizzle.config.ts` and add db scripts (db:generate, db:push, db:migrate, db:studio) to `package.json`
- [ ] T011 Generate and push initial database migration via `pnpm db:generate && pnpm db:push`
- [ ] T012 Configure Better Auth server with Drizzle adapter, email/password + Google OAuth providers, account linking, and category seeding database hook in `lib/auth.ts`
- [ ] T013 [P] Create Better Auth client helpers in `lib/auth-client.ts`
- [ ] T014 [P] Create Better Auth catch-all route handler in `app/api/auth/[...all]/route.ts`
- [ ] T015 [P] Define default category seed data (6 Needs, 5 Wants, 4 Future, 3 Income with emoji icons) in `lib/seed-data.ts`
- [ ] T016 [P] Define shared TypeScript interfaces (Transaction, Category, Budget, RecurringTransaction, FinancialProfile, ActionResult, and "with relation" variants) in `types/index.ts`
- [ ] T017 [P] Create `getAuthenticatedUser()` helper that checks session via `auth.api.getSession()` and redirects to `/login` if unauthenticated in `lib/queries/auth.ts`
- [ ] T018 [P] Define finance utility functions (bucket definitions, color mappings, currency formatter, percentage calculator) in `lib/finance-utils.ts`
- [ ] T019 Create root layout with Plus Jakarta Sans + Geist Mono fonts, dark theme `<body>` class, and metadata in `app/layout.tsx`
- [ ] T020 Create `(auth)` route group layout (minimal, no app nav) in `app/(auth)/layout.tsx`
- [ ] T021 Create `(app)` route group layout with auth guard (redirect to `/login` if unauthenticated), onboarding guard (redirect to `/onboarding` if no financial profile), recurring transaction processing on load, and app shell wrapper in `app/(app)/layout.tsx`
- [ ] T022 [P] Create bottom tab navigation component (Home, Activity, FAB, Stats, Profile) with active/inactive states and 44px touch targets in `components/bottom-nav.tsx`
- [ ] T023 [P] Create desktop sidebar navigation component with same routes in `components/side-nav.tsx`
- [ ] T024 Create app shell component that renders bottom-nav on mobile (<1024px) and side-nav on desktop (>=1024px) in `components/app-shell.tsx`
- [ ] T025 [P] Create reusable page header component in `components/page-header.tsx`
- [ ] T026 [P] Create custom icon components in `components/icons.tsx`

**Checkpoint**: Foundation ready — auth, database, shared types, app shell all functional. User story implementation can begin.

---

## Phase 3: User Story 1 — Account Creation & Onboarding (Priority: P1) 🎯 MVP

**Goal**: Users can register (email/password or Google), complete onboarding (income + allocation %), and access the app.

**Independent Test**: Register a new account, complete onboarding with custom income and 60/25/15 split, verify redirect to dashboard with profile saved.

### Implementation for User Story 1

- [ ] T027 [P] [US1] Create Zod validation schemas for financial profile (create: monthlyIncomeTarget required, percentages default 50/30/20, sum=100 check; update: partial with conditional sum check) in `lib/validations/financial-profile.ts`
- [ ] T028 [P] [US1] Implement `getFinancialProfile()` query (returns profile or null, scoped by userId) in `lib/queries/financial-profile.ts`
- [ ] T029 [US1] Implement `createFinancialProfile()` and `updateFinancialProfile()` Server Actions with Zod validation, auth check, 409 if exists, revalidation of `/`, `/budgets`, `/insights` in `lib/actions/financial-profile.ts`
- [ ] T030 [US1] Build login page with email/password form, Google OAuth button, "Create account" link, keyboard handling, error states, and loading states in `app/(auth)/login/page.tsx`
- [ ] T031 [US1] Build registration page with name/email/password form, Google OAuth button, "Already have an account?" link, password visibility toggle in `app/(auth)/register/page.tsx`
- [ ] T032 [US1] Build onboarding page with monthly income input (large numeric, currency prefix), allocation percentage sliders (Needs/Wants/Future with real-time validation that sum=100), pie chart preview, and "Complete Setup" button that calls `createFinancialProfile()` action in `app/(auth)/onboarding/page.tsx`
- [ ] T033 [US1] Create placeholder dashboard page at `app/(app)/page.tsx` that displays "Welcome" message (full dashboard built in US3)

**Checkpoint**: Users can register, complete onboarding, and land on a placeholder dashboard. Auth guard and onboarding guard work correctly.

---

## Phase 4: User Story 2 — Transaction Management (Priority: P2)

**Goal**: Users can create, view, search, filter, edit, and delete transactions via a bottom sheet and swipeable list.

**Independent Test**: Add income and expense transactions, verify they appear in the list, search by description, filter by type, edit an amount, delete a transaction.

### Implementation for User Story 2

- [X] T034 [P] [US2] Create Zod validation schemas for transactions (create: amount>0 required, type required, date required, categoryId optional; update: all optional) in `lib/validations/transactions.ts`
- [X] T035 [P] [US2] Create Zod validation schemas for categories (create: name 1-100 required, type required, icon optional, allocationBucket required if expense; update: partial) in `lib/validations/categories.ts`
- [X] T036 [P] [US2] Implement `getTransactions()` query with filtering (type, categoryId, search via ILIKE), pagination (limit/offset), sorting (date/amount asc/desc), and category relation join in `lib/queries/transactions.ts`
- [X] T037 [P] [US2] Implement `getCategories()` query with optional type filter, ordered by name, scoped by userId in `lib/queries/categories.ts`
- [X] T038 [US2] Implement `createTransaction()`, `updateTransaction()`, `deleteTransaction()` Server Actions with Zod validation, auth check, userId scoping, revalidation of `/transactions` and `/` in `lib/actions/transactions.ts`
- [X] T039 [US2] Create transaction sheet context provider (open/close state, edit mode with transaction data) in `components/transaction-sheet-context.tsx`
- [X] T040 [US2] Build add/edit transaction bottom sheet with amount input (numeric keyboard), type toggle (Income/Expense segmented control), category picker (as nested sheet), date picker, description field, save/cancel actions in `components/transaction-sheet.tsx`
- [X] T041 [US2] Build swipeable transaction list item component with category icon, description, amount (colored by type), date, and swipe-left to reveal Edit/Delete actions in `components/transaction-item.tsx`
- [X] T042 [US2] Create floating action button component (56px circle, accent color, centered above tab bar, triggers transaction sheet) in `components/floating-action-button.tsx`
- [X] T043 [US2] Build transactions page with sticky search bar, horizontal filter chips (All/Income/Expense), grouped-by-date transaction list with infinite scroll (Intersection Observer), empty state, and skeleton loading in `app/(app)/transactions/page.tsx`

**Checkpoint**: Full transaction CRUD works. Users can add/edit/delete transactions, search, filter, and scroll through the list.

---

## Phase 5: User Story 3 — Dashboard Overview (Priority: P3)

**Goal**: Dashboard shows balance, 50/30/20 harmony cards, recent transactions, upcoming recurring items, and quick stats.

**Independent Test**: With transactions and a financial profile, verify balance is correct, harmony cards show per-bucket progress, recent transactions display, and quick stats calculate correctly. Empty state shows for new users.

### Implementation for User Story 3

- [X] T044 [P] [US3] Implement `getDashboardData()` query that returns balance (income - expenses for current month), per-bucket spending vs targets, last 5 transactions with category, next 3 upcoming recurring items, and quick stats (daily avg, safe to spend, days remaining) in `lib/queries/dashboard.ts`
- [X] T045 [US3] Build dashboard page as Server Component with: greeting header with date, balance summary card with month totals, horizontal-scroll 50/30/20 harmony cards (each showing spent/target/progress bar with bucket color), quick stats row (daily avg, safe to spend, days left), recent transactions widget (last 5 with "View all" link), upcoming recurring widget (next 3 items), and empty state for new users in `app/(app)/page.tsx`

**Checkpoint**: Dashboard is the functional landing page showing all financial data at a glance.

---

## Phase 6: User Story 4 — Category Management (Priority: P4)

**Goal**: Users can view, create, edit, and delete categories segmented by type and allocation bucket.

**Independent Test**: View default 18 categories, switch between Income/Expense segments and bucket tabs, create a new expense category under Wants, edit its name, delete it and verify linked transactions lose their category.

### Implementation for User Story 4

- [X] T046 [US4] Implement `createCategory()`, `updateCategory()`, `deleteCategory()` Server Actions with Zod validation, auth check, revalidation of `/categories`, `/transactions`, `/budgets` in `lib/actions/categories.ts`
- [X] T047 [US4] Build categories page with Income/Expense segmented control, bucket tabs for expenses (Needs/Wants/Future with color dots and counts), category list with emoji icon and name, swipe-left for edit/delete, add category bottom sheet (emoji picker, name input, type toggle, bucket radio for expenses), and skeleton loading in `app/(app)/categories/page.tsx`

**Checkpoint**: Full category CRUD. Default categories visible, custom categories addable with bucket assignment.

---

## Phase 7: User Story 5 — Budget Tracking (Priority: P5)

**Goal**: Users can set per-category monthly budgets and see spending progress grouped by allocation bucket.

**Independent Test**: Create a $500 budget for Groceries, add $200 in grocery transactions, verify the budget shows "$200 of $500" with a 40% progress bar under the Needs group.

### Implementation for User Story 5

- [X] T048 [P] [US5] Create Zod validation schemas for budgets (create: categoryId, amount>0, period, startDate required; update: partial) in `lib/validations/budgets.ts`
- [X] T049 [P] [US5] Implement `getBudgetsWithSpending()` query that joins budgets with transaction sum for a given month per category, includes category relation, scoped by userId in `lib/queries/budgets.ts`
- [X] T050 [US5] Implement `createBudget()`, `updateBudget()`, `deleteBudget()` Server Actions with Zod validation, auth check, revalidation of `/budgets` and `/` in `lib/actions/budgets.ts`
- [X] T051 [US5] Build budgets page with month selector (dropdown with left/right arrows), overall summary card (total budgeted/spent/remaining), budget list grouped by allocation bucket (Needs/Wants/Future collapsible sections), budget cards with progress bar and amount text, add/edit budget bottom sheet (category dropdown, amount, period), overspend visual indicator (red), empty state, and skeleton loading in `app/(app)/budgets/page.tsx`

**Checkpoint**: Budget tracking works. Users see spending vs. budget per category grouped by bucket.

---

## Phase 8: User Story 6 — Recurring Transactions (Priority: P6)

**Goal**: Users can define, pause/resume, edit, and delete recurring income/expenses with configurable frequency.

**Independent Test**: Create a monthly recurring expense of $15 for "Netflix", verify next due date, pause it, resume it, verify it auto-generates a transaction when due.

### Implementation for User Story 6

- [X] T052 [P] [US6] Create Zod validation schemas for recurring transactions (create: amount>0, type, frequency, startDate required; update: partial including isActive toggle) in `lib/validations/recurring.ts`
- [X] T053 [P] [US6] Implement `getRecurringTransactions()` query with category relation, ordered by createdAt, scoped by userId in `lib/queries/recurring.ts`
- [X] T054 [US6] Implement `createRecurring()`, `updateRecurring()`, `deleteRecurring()`, and `processRecurringTransactions()` Server Actions. Process action: find active items where nextDueDate<=today, generate transactions, advance nextDueDate per frequency, handle end dates. Revalidate `/recurring`, `/transactions`, `/` in `lib/actions/recurring.ts`
- [X] T055 [US6] Build recurring transactions page with Active/Paused segmented control with count badges, list grouped by type (Income/Expense), recurring item component (icon, description, amount, frequency + next due date, active/paused toggle), swipe-left for edit/delete, add/edit recurring bottom sheet (description, amount, type, category, frequency picker, start/end date), and skeleton loading in `app/(app)/recurring/page.tsx`

**Checkpoint**: Recurring transactions fully functional. Auto-generation triggered on app load via layout.

---

## Phase 9: User Story 7 — Insights & Analytics (Priority: P7)

**Goal**: Users can view 50/30/20 compliance, spending by category, allocation performance, and summary stats with date range filtering.

**Independent Test**: With transactions across all buckets, verify donut chart shows actual allocation, bar chart shows spending by category, compliance score reflects over/under targets, and date range filter updates all charts.

### Implementation for User Story 7

- [ ] T056 [P] [US7] Implement `getInsights()` query (totalExpenses, totalIncome, balance, spendingByCategory with bucket, transactionCount for a given period) and `getAllocationSummary()` query (income, targets, actual per bucket for a given month) in `lib/queries/insights.ts`
- [ ] T057 [US7] Build insights page with date range chips (This Month, 3 Months, 6 Months, Year), 50/30/20 compliance donut chart (PieChart from Recharts, lazy loaded via next/dynamic) with compliance score, spending by category horizontal bar chart (BarChart, color-coded by bucket), allocation performance cards (Needs/Wants/Future with progress bars and actual vs target + variance), summary stats (total income, expenses, balance, transaction count), and skeleton loading in `app/(app)/insights/page.tsx`

**Checkpoint**: Full insights page with interactive charts and date range filtering.

---

## Phase 10: Profile & Financial Profile Update (Priority: P8)

**Goal**: Users can view their profile info, update financial profile, and log out.

**Independent Test**: Navigate to profile, verify user info displayed, update income and allocation percentages, verify changes reflected on dashboard harmony cards, log out successfully.

### Implementation

- [ ] T058 [US8] Build financial profile edit bottom sheet with income input, allocation sliders (reuse onboarding pattern), save via `updateFinancialProfile()` action in `components/financial-profile-sheet.tsx`
- [ ] T059 [US8] Build profile page with user info card (avatar, name, email, member since), navigation menu (Categories, Insights), financial profile section with edit button triggering profile sheet, logout button with confirmation dialog, app version footer in `app/(app)/profile/page.tsx`

**Checkpoint**: Profile page complete. Users can update financial profile and log out.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Responsive refinement, accessibility, performance, and final validation

- [ ] T060 [P] Add skeleton loading components for all pages (dashboard, transactions, budgets, categories, recurring, insights) in `components/ui/skeleton.tsx` patterns per page
- [ ] T061 [P] Implement responsive breakpoint behavior: bottom tabs on mobile (<1024px), sidebar on desktop (>=1024px), max-width containers for tablet (720px) and large desktop (1200px) across all layouts
- [ ] T062 [P] Audit all interactive elements for 44px minimum touch targets, ARIA labels on icon-only buttons, focus management in bottom sheets, and `prefers-reduced-motion` respect
- [ ] T063 [P] Audit color contrast ratios across all text/background combinations against WCAG 2.1 AA (4.5:1 minimum)
- [ ] T064 Verify all Server Actions check auth via `getAuthenticatedUser()` and all queries scope by userId — security audit pass
- [ ] T065 Run `pnpm lint` and fix all linting errors
- [ ] T066 Run `pnpm build` and fix all type errors and build failures
- [ ] T067 Run quickstart.md validation checklist end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — auth + onboarding
- **US2 (Phase 4)**: Depends on Foundational — can run parallel to US1 but benefits from US1 auth flow being testable
- **US3 (Phase 5)**: Depends on US2 (needs transactions data to display)
- **US4 (Phase 6)**: Depends on Foundational — can start after Phase 2
- **US5 (Phase 7)**: Depends on US2 + US4 (needs transactions + categories)
- **US6 (Phase 8)**: Depends on US2 (needs transaction creation infrastructure)
- **US7 (Phase 9)**: Depends on US2 (needs transaction data for charts)
- **Profile (Phase 10)**: Depends on US1 (needs financial profile actions)
- **Polish (Phase 11)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Auth & Onboarding)**: Independent — first story to implement
- **US2 (Transactions)**: Independent of US1 at code level (shares foundational auth), but best tested after US1
- **US3 (Dashboard)**: Depends on US2 (transaction queries) and US6 (recurring queries for upcoming widget)
- **US4 (Categories)**: Independent — queries/actions already created in US2 foundation, this adds the UI page
- **US5 (Budgets)**: Depends on US2 (transaction sums) and US4 (category picker)
- **US6 (Recurring)**: Depends on US2 (transaction creation for auto-generation)
- **US7 (Insights)**: Depends on US2 (transaction aggregation queries)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (T013-T018, T022-T023, T025-T026)
- Within US2: T034-T037 (validations + queries) can run in parallel
- US4 and US6 can run in parallel after US2 completes
- US5 and US7 can run in parallel after US2 + US4 complete
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all validation schemas + queries in parallel:
Task: "Create Zod schemas for transactions in lib/validations/transactions.ts"
Task: "Create Zod schemas for categories in lib/validations/categories.ts"
Task: "Implement getTransactions() query in lib/queries/transactions.ts"
Task: "Implement getCategories() query in lib/queries/categories.ts"

# Then sequentially: actions → components → page
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 (Auth & Onboarding)
4. **STOP and VALIDATE**: Register, onboard, verify dashboard placeholder
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Auth & Onboarding) → MVP! Users can register and set up profile
3. US2 (Transactions) → Core value! Users can track expenses
4. US3 (Dashboard) → At-a-glance overview
5. US4 (Categories) → Personalization
6. US5 (Budgets) → Active planning
7. US6 (Recurring) → Automation
8. US7 (Insights) → Reflection
9. Profile → Settings
10. Polish → Production ready

### Recommended Execution Order

```
Phase 1 → Phase 2 → US1 → US2 → US4 → US3 → US5 ─┐
                                                     ├→ Polish
                                   US6 → US7 ────────┘
                                   Profile ──────────┘
```

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All Server Actions MUST validate with Zod and check auth
- All queries MUST scope by userId
- All UI MUST target 375px mobile first, then enhance for larger screens
