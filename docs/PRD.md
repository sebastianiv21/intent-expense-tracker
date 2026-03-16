# Intent - Product Requirements Document (PRD)

## 1. Product Overview

**Intent** is a mindful expense tracker web application that implements the **50/30/20 budgeting rule** (Needs/Wants/Savings). It helps users gain awareness of their spending habits through a warm, zen-like aesthetic with a dark theme and terracotta accents.

### Vision

Provide a simple, intentional budgeting experience that encourages financial mindfulness rather than anxiety. Users should feel calm and in control of their finances.

### Target Audience

- Individuals seeking a simple, opinionated budgeting approach
- Users who prefer the 50/30/20 framework over complex budgeting tools
- Mobile-first users who track expenses on-the-go

---

## 2. Core Concepts

### 50/30/20 Budgeting Rule

All expenses are categorized into three **allocation buckets**:

| Bucket | Default % | Color | Purpose |
|--------|-----------|-------|---------|
| **Needs** | 50% | Green (`#8b9a7e`) | Essential expenses (rent, groceries, utilities, insurance, transportation, healthcare) |
| **Wants** | 30% | Orange/Terracotta (`#c97a5a`) | Non-essential spending (dining, entertainment, shopping, subscriptions, hobbies) |
| **Future** | 20% | Gold (`#a89562`) | Savings and investments (savings, investments, emergency fund, debt repayment) |

Users set their monthly income target and can customize these percentages during onboarding. The app tracks actual spending against these targets.

### Financial Profile

Each user has a financial profile that stores:
- Monthly income target
- Custom allocation percentages (must total 100%)

---

## 3. User Flows

### 3.1 Authentication

| Flow | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password or Google OAuth sign-in |
| Register | `/register` | Account creation with email/password or Google OAuth |
| Onboarding | `/onboarding` | First-time setup of financial profile (income + allocation percentages) |

**Auth provider**: Better Auth with email/password and Google social login.

**Account linking**: Enabled for trusted providers (Google, email-password). Users who register with email can later link their Google account and vice versa.

**Post-registration hook**: Default categories are automatically seeded for new users (6 Needs, 5 Wants, 4 Future, 3 Income categories).

**Onboarding guard**: Users without a financial profile are redirected to `/onboarding` before accessing the main app.

### 3.2 Main Application

| View | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with balance, 50/30/20 harmony cards, recent transactions, upcoming recurring items |
| Transactions | `/transactions` | Full transaction list with search, filters, infinite scroll, swipe actions |
| Budgets | `/budgets` | Monthly budgets per category, grouped by allocation bucket |
| Categories | `/categories` | Category management segmented by Income/Expense, with bucket tabs for expenses |
| Recurring | `/recurring` | Manage recurring transactions with frequency and active/paused states |
| Insights | `/insights` | Charts and analytics: 50/30/20 compliance, spending by category, allocation performance |
| Profile | `/profile` | User info, navigation to settings, logout |

### 3.3 Transaction Management

Users can create, edit, and delete transactions. Each transaction has:
- **Amount** (required)
- **Type**: Income or Expense (required)
- **Category** (optional, links to user's categories)
- **Date** (required)
- **Description** (optional)

Transactions are added via a **bottom sheet** triggered by the floating action button (FAB).

### 3.4 Budget Management

Users set monthly or weekly budgets per category. The app tracks spending against these budgets and groups them by allocation bucket (Needs/Wants/Future).

### 3.5 Recurring Transactions

Users can define recurring income/expenses with configurable frequency (daily, weekly, biweekly, monthly, quarterly, yearly). Recurring transactions have:
- Active/paused toggle
- Start and optional end dates
- Next due date tracking
- Last generated date tracking

### 3.6 Insights & Analytics

The insights page provides:
- 50/30/20 compliance score and donut chart
- Spending breakdown by category (horizontal bar chart)
- Allocation performance (actual vs. target per bucket)
- Summary stats: total income, total expenses, balance, transaction count

---

## 4. Functional Requirements

### FR-1: Authentication & Authorization
- **FR-1.1**: Users can register with email/password
- **FR-1.2**: Users can sign in with Google OAuth
- **FR-1.3**: Account linking between email and Google providers
- **FR-1.4**: Session-based authentication with secure token management
- **FR-1.5**: Onboarding redirect for users without a financial profile

### FR-2: Financial Profile
- **FR-2.1**: Users set monthly income target during onboarding
- **FR-2.2**: Users customize 50/30/20 allocation percentages (must total 100%)
- **FR-2.3**: Profile can be updated after initial setup

### FR-3: Categories
- **FR-3.1**: Default categories seeded on registration (18 categories)
- **FR-3.2**: Users can create custom categories with name, type, icon, and allocation bucket
- **FR-3.3**: Users can edit and delete categories
- **FR-3.4**: Categories are scoped per user
- **FR-3.5**: Expense categories must have an allocation bucket (needs/wants/future)

### FR-4: Transactions
- **FR-4.1**: CRUD operations on transactions
- **FR-4.2**: Transactions linked to categories (optional)
- **FR-4.3**: Search and filter transactions
- **FR-4.4**: Infinite scroll pagination
- **FR-4.5**: Swipe actions for quick edit/delete on mobile

### FR-5: Budgets
- **FR-5.1**: Create budgets per category with amount and period (monthly/weekly)
- **FR-5.2**: View budgets grouped by allocation bucket
- **FR-5.3**: Track spending against budget amounts
- **FR-5.4**: Month/period navigation

### FR-6: Recurring Transactions
- **FR-6.1**: CRUD operations on recurring transactions
- **FR-6.2**: Configurable frequency (daily to yearly)
- **FR-6.3**: Active/paused toggle
- **FR-6.4**: Auto-generation of transactions based on schedule
- **FR-6.5**: Next due date and last generated date tracking

### FR-7: Insights
- **FR-7.1**: 50/30/20 compliance visualization
- **FR-7.2**: Spending by category breakdown
- **FR-7.3**: Allocation performance (actual vs. target)
- **FR-7.4**: Date range filtering (month, 3 months, 6 months, year)
- **FR-7.5**: Summary statistics (income, expenses, balance)

### FR-8: Dashboard
- **FR-8.1**: Current balance display with trend
- **FR-8.2**: 50/30/20 harmony cards showing progress per bucket
- **FR-8.3**: Recent transactions widget
- **FR-8.4**: Upcoming recurring transactions widget
- **FR-8.5**: Quick stats (daily average, safe to spend, days left)

---

## 5. Non-Functional Requirements

### NFR-1: Performance
- Skeleton screens for loading states (no spinners)
- Code splitting by route
- Lazy loading for charts (Recharts)
- 60fps animations using transform/opacity
- Infinite scroll for large datasets

### NFR-2: Mobile-First Design
- Base viewport: 375px
- Touch targets: minimum 44x44px
- Bottom sheet modals (not centered dialogs)
- Swipe gestures for list actions
- Fixed bottom tab navigation
- Safe area handling for notches/home indicators

### NFR-3: Responsive Breakpoints
- Mobile: < 768px (single column, bottom tabs)
- Tablet: 768-1023px (2-column grid, max-width 720px)
- Desktop: >= 1024px (sidebar navigation + content area)
- Large Desktop: >= 1440px (max-width 1200px)

### NFR-4: Accessibility
- WCAG 2.1 AA compliance
- 4.5:1 contrast ratio for text
- Screen reader support with proper ARIA labels
- Focus management in modals
- Respect `prefers-reduced-motion`

### NFR-5: Security
- Server-side session validation on all API routes
- User data scoped by userId
- No sensitive data exposed in client
- CSRF protection via Better Auth
- Input validation with Zod

---

## 6. Data Model Summary

### Core Entities

| Entity | Description |
|--------|-------------|
| `user` | Auth user (managed by Better Auth) |
| `session` | Auth session |
| `account` | OAuth provider accounts |
| `verification` | Email verification tokens |
| `financial_profile` | User's income target and allocation percentages |
| `categories` | User-scoped expense/income categories with bucket assignment |
| `transactions` | Individual income/expense entries |
| `budgets` | Category-level budget targets per period |
| `recurring_transactions` | Scheduled recurring income/expenses |

See [DATA_MODEL.md](./DATA_MODEL.md) for the full schema specification.

---

## 7. API Summary

All data endpoints follow REST conventions under `/api/v1/`:

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Transactions | `/api/v1/transactions` | GET, POST |
| Transaction | `/api/v1/transactions/[id]` | PUT, DELETE |
| Categories | `/api/v1/categories` | GET, POST |
| Category | `/api/v1/categories/[id]` | PUT, DELETE |
| Budgets | `/api/v1/budgets` | GET, POST |
| Budget | `/api/v1/budgets/[id]` | PUT, DELETE |
| Recurring | `/api/v1/recurring` | GET, POST |
| Recurring | `/api/v1/recurring/[id]` | PUT, DELETE |
| Financial Profile | `/api/v1/financial-profile` | GET, PUT |
| Insights | `/api/v1/insights` | GET |
| Auth | `/api/auth/*` | Managed by Better Auth |

See [API_SPECIFICATION.md](./API_SPECIFICATION.md) for the full API specification.

---

## 8. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Auth | Better Auth (email/password + Google OAuth) |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Validation | Zod 4 |
| Date Handling | date-fns 4 |
| Package Manager | pnpm |

See [TECH_STACK.md](./TECH_STACK.md) for architectural details.

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Onboarding completion rate | > 90% |
| Daily active transaction logging | > 3 transactions/day |
| 50/30/20 compliance score awareness | Users check insights weekly |
| Mobile usage | > 70% of sessions on mobile |
| Page load time (LCP) | < 2.5 seconds |

---

## 10. Future Considerations (Out of Scope for v1)

- Biometric authentication (Face ID / Touch ID)
- Bank account integration / automatic transaction import
- Multi-currency support
- Export to CSV/PDF
- Push notifications for budget alerts
- Collaborative budgets (shared households)
- Custom budgeting rules beyond 50/30/20
- Dark/light theme toggle (currently dark-only)

---

_Document Version: 1.0_
_Last Updated: 2026-03-15_
_Project: Intent Expense Tracker_
