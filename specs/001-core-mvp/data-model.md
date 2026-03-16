# Data Model: Core MVP

**Branch**: `001-core-mvp` | **Date**: 2026-03-15
**Source**: `lib/schema.ts` (Drizzle ORM), `docs/DATA_MODEL.md`

## Enums

### transaction_type
- `expense` — Money spent
- `income` — Money earned

### budget_period
- `monthly` — Monthly budget cycle
- `weekly` — Weekly budget cycle

### allocation_bucket
- `needs` — Essential expenses (50% default, color: `#8b9a7e`)
- `wants` — Non-essential spending (30% default, color: `#c97a5a`)
- `future` — Savings/investments (20% default, color: `#a89562`)

### recurrence_frequency
- `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`

## Entities

### user (managed by Better Auth)

| Field | Type | Constraints |
|-------|------|-------------|
| id | text | PK |
| name | text | NOT NULL |
| email | text | NOT NULL, UNIQUE |
| email_verified | boolean | NOT NULL, default false |
| image | text | nullable |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, auto-update |

**Relations**: 1:N sessions, 1:N accounts, 1:1 financial_profile,
1:N categories, 1:N transactions, 1:N budgets,
1:N recurring_transactions

### session (managed by Better Auth)

| Field | Type | Constraints |
|-------|------|-------------|
| id | text | PK |
| expires_at | timestamp | NOT NULL |
| token | text | NOT NULL, UNIQUE |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, auto-update |
| ip_address | text | nullable |
| user_agent | text | nullable |
| user_id | text | NOT NULL, FK → user.id (CASCADE) |

### account (managed by Better Auth)

| Field | Type | Constraints |
|-------|------|-------------|
| id | text | PK |
| account_id | text | NOT NULL |
| provider_id | text | NOT NULL |
| user_id | text | NOT NULL, FK → user.id (CASCADE) |
| access_token | text | nullable |
| refresh_token | text | nullable |
| id_token | text | nullable |
| access_token_expires_at | timestamp | nullable |
| refresh_token_expires_at | timestamp | nullable |
| scope | text | nullable |
| password | text | nullable (hashed) |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, auto-update |

### verification (managed by Better Auth)

| Field | Type | Constraints |
|-------|------|-------------|
| id | text | PK |
| identifier | text | NOT NULL |
| value | text | NOT NULL |
| expires_at | timestamp | NOT NULL |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, auto-update |

### financial_profile

| Field | Type | Constraints |
|-------|------|-------------|
| user_id | varchar(255) | PK (1:1 with user) |
| monthly_income_target | numeric(10,2) | NOT NULL |
| needs_percentage | numeric(5,2) | NOT NULL, default 50.00 |
| wants_percentage | numeric(5,2) | NOT NULL, default 30.00 |
| future_percentage | numeric(5,2) | NOT NULL, default 20.00 |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, auto-update |

**Validation**: needs + wants + future = 100.00

### categories

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK, default random() |
| user_id | varchar(255) | NOT NULL |
| name | varchar(100) | NOT NULL |
| type | transaction_type | NOT NULL |
| allocation_bucket | allocation_bucket | nullable |
| icon | varchar(10) | nullable (emoji) |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, auto-update |

**Rules**: Expense categories MUST have allocation_bucket. Income
categories have allocation_bucket = null. 18 default categories
seeded on registration via Better Auth database hook.

**Relations**: 1:N transactions, 1:N budgets,
1:N recurring_transactions

### transactions

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK, default random() |
| user_id | varchar(255) | NOT NULL |
| category_id | uuid | FK → categories.id (SET NULL) |
| amount | numeric(12,2) | NOT NULL |
| type | transaction_type | NOT NULL |
| description | text | nullable |
| date | date | NOT NULL |
| created_at | timestamp | NOT NULL, default now() |

**On category delete**: category_id set to NULL

### budgets

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK, default random() |
| user_id | varchar(255) | NOT NULL |
| category_id | uuid | FK → categories.id (CASCADE) |
| amount | numeric(12,2) | NOT NULL |
| period | budget_period | NOT NULL |
| start_date | date | NOT NULL |
| created_at | timestamp | NOT NULL, default now() |

**On category delete**: budget is CASCADE deleted

### recurring_transactions

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK, default random() |
| user_id | varchar(255) | NOT NULL |
| category_id | uuid | FK → categories.id (SET NULL) |
| amount | numeric(10,2) | NOT NULL |
| type | transaction_type | NOT NULL |
| description | varchar(255) | nullable |
| frequency | recurrence_frequency | NOT NULL |
| start_date | date | NOT NULL |
| end_date | date | nullable |
| next_due_date | date | NOT NULL |
| last_generated_date | date | nullable |
| is_active | boolean | NOT NULL, default true |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, auto-update |

**On category delete**: category_id set to NULL

## Entity Relationships

```
user (1) ──── (1) financial_profile
  │
  ├──── (N) sessions
  ├──── (N) accounts
  │
  └──── (via user_id)
           ├──── (N) categories
           │          ├──── (N) transactions [SET NULL on delete]
           │          ├──── (N) budgets [CASCADE on delete]
           │          └──── (N) recurring_transactions [SET NULL]
           ├──── (N) transactions
           ├──── (N) budgets
           └──── (N) recurring_transactions
```

## Default Seed Data (on registration)

**Needs (6)**: Rent/Mortgage, Groceries, Utilities, Insurance,
Transportation, Healthcare

**Wants (5)**: Dining Out, Entertainment, Shopping, Subscriptions,
Hobbies

**Future (4)**: Savings, Investments, Emergency Fund, Debt Repayment

**Income (3)**: Salary, Freelance, Other Income

Each category includes an emoji icon. Seeded via Better Auth
`databaseHooks.user.create.after` hook in `lib/auth.ts`.

## State Transitions

### Recurring Transaction Lifecycle

```
Created (isActive=true, nextDueDate=startDate)
  │
  ├─ Process → Generate transaction, advance nextDueDate
  │            (repeat while nextDueDate <= today && isActive)
  │
  ├─ Pause → isActive=false (no generation)
  │
  ├─ Resume → isActive=true (nextDueDate recalculated)
  │
  ├─ End date reached → isActive=false automatically
  │
  └─ Delete → removed permanently
```
