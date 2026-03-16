# Intent - Data Model Specification

## Overview

Intent uses PostgreSQL (Neon Serverless) with Drizzle ORM. All schemas are defined in `lib/schema.ts`. Migrations are managed via Drizzle Kit and stored in `drizzle/`.

---

## Enums

### `transaction_type`
| Value | Description |
|-------|-------------|
| `expense` | Money spent |
| `income` | Money earned |

### `budget_period`
| Value | Description |
|-------|-------------|
| `monthly` | Monthly budget cycle |
| `weekly` | Weekly budget cycle |

### `allocation_bucket`
| Value | Color | Description |
|-------|-------|-------------|
| `needs` | Green (`#8b9a7e`) | Essential expenses (50% default) |
| `wants` | Orange (`#c97a5a`) | Non-essential spending (30% default) |
| `future` | Gold (`#a89562`) | Savings and investments (20% default) |

### `recurrence_frequency`
| Value | Description |
|-------|-------------|
| `daily` | Every day |
| `weekly` | Every week |
| `biweekly` | Every two weeks |
| `monthly` | Every month |
| `quarterly` | Every three months |
| `yearly` | Every year |

---

## Tables

### `user` (Auth - managed by Better Auth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | User identifier |
| `name` | `text` | NOT NULL | Display name |
| `email` | `text` | NOT NULL, UNIQUE | Email address |
| `email_verified` | `boolean` | NOT NULL, default `false` | Email verification status |
| `image` | `text` | nullable | Profile image URL |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Account creation date |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last update timestamp |

**Relations**: Has many `sessions`, has many `accounts`

---

### `session` (Auth - managed by Better Auth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | Session identifier |
| `expires_at` | `timestamp` | NOT NULL | Session expiry |
| `token` | `text` | NOT NULL, UNIQUE | Session token |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Session creation |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last update |
| `ip_address` | `text` | nullable | Client IP |
| `user_agent` | `text` | nullable | Client user agent |
| `user_id` | `text` | NOT NULL, FK → `user.id` (CASCADE) | Session owner |

**Indexes**: `session_userId_idx` on `user_id`

---

### `account` (Auth - managed by Better Auth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | Account identifier |
| `account_id` | `text` | NOT NULL | Provider-specific account ID |
| `provider_id` | `text` | NOT NULL | Auth provider name |
| `user_id` | `text` | NOT NULL, FK → `user.id` (CASCADE) | Account owner |
| `access_token` | `text` | nullable | OAuth access token |
| `refresh_token` | `text` | nullable | OAuth refresh token |
| `id_token` | `text` | nullable | OAuth ID token |
| `access_token_expires_at` | `timestamp` | nullable | Access token expiry |
| `refresh_token_expires_at` | `timestamp` | nullable | Refresh token expiry |
| `scope` | `text` | nullable | OAuth scope |
| `password` | `text` | nullable | Hashed password (email auth) |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Account creation |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last update |

**Indexes**: `account_userId_idx` on `user_id`

---

### `verification` (Auth - managed by Better Auth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PK | Verification identifier |
| `identifier` | `text` | NOT NULL | What is being verified |
| `value` | `text` | NOT NULL | Verification value/token |
| `expires_at` | `timestamp` | NOT NULL | Token expiry |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Creation date |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last update |

**Indexes**: `verification_identifier_idx` on `identifier`

---

### `financial_profile`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | `varchar(255)` | PK | User identifier (1:1 with user) |
| `monthly_income_target` | `numeric(10,2)` | NOT NULL | Target monthly income |
| `needs_percentage` | `numeric(5,2)` | NOT NULL, default `50.00` | % allocated to needs |
| `wants_percentage` | `numeric(5,2)` | NOT NULL, default `30.00` | % allocated to wants |
| `future_percentage` | `numeric(5,2)` | NOT NULL, default `20.00` | % allocated to future |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Creation date |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last update |

**Validation**: `needs_percentage + wants_percentage + future_percentage = 100.00`

---

### `categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `random()` | Category identifier |
| `user_id` | `varchar(255)` | NOT NULL | Owner user ID |
| `name` | `varchar(100)` | NOT NULL | Category name |
| `type` | `transaction_type` | NOT NULL | `expense` or `income` |
| `allocation_bucket` | `allocation_bucket` | nullable | Bucket for expense categories |
| `icon` | `varchar(10)` | nullable | Emoji icon |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Creation date |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last update |

**Relations**: Has many `transactions`, has many `budgets`

**Business Rules**:
- Expense categories should have an `allocation_bucket`
- Income categories have `allocation_bucket = null`
- 18 default categories are seeded on user registration

---

### `transactions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `random()` | Transaction identifier |
| `user_id` | `varchar(255)` | NOT NULL | Owner user ID |
| `category_id` | `uuid` | FK → `categories.id` (SET NULL) | Associated category |
| `amount` | `numeric(12,2)` | NOT NULL | Transaction amount |
| `type` | `transaction_type` | NOT NULL | `expense` or `income` |
| `description` | `text` | nullable | Transaction description |
| `date` | `date` | NOT NULL | Transaction date |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Creation date |

**Relations**: Belongs to one `category`

**On category delete**: `category_id` is set to `null`

---

### `budgets`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `random()` | Budget identifier |
| `user_id` | `varchar(255)` | NOT NULL | Owner user ID |
| `category_id` | `uuid` | FK → `categories.id` (CASCADE) | Associated category |
| `amount` | `numeric(12,2)` | NOT NULL | Budget amount |
| `period` | `budget_period` | NOT NULL | `monthly` or `weekly` |
| `start_date` | `date` | NOT NULL | Budget period start |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Creation date |

**Relations**: Belongs to one `category`

**On category delete**: Budget is cascaded (deleted)

---

### `recurring_transactions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `random()` | Recurring transaction ID |
| `user_id` | `varchar(255)` | NOT NULL | Owner user ID |
| `category_id` | `uuid` | FK → `categories.id` (SET NULL) | Associated category |
| `amount` | `numeric(10,2)` | NOT NULL | Recurring amount |
| `type` | `transaction_type` | NOT NULL | `expense` or `income` |
| `description` | `varchar(255)` | nullable | Description |
| `frequency` | `recurrence_frequency` | NOT NULL | How often it recurs |
| `start_date` | `date` | NOT NULL | When recurrence starts |
| `end_date` | `date` | nullable | When recurrence ends |
| `next_due_date` | `date` | NOT NULL | Next scheduled date |
| `last_generated_date` | `date` | nullable | Last auto-generated date |
| `is_active` | `boolean` | NOT NULL, default `true` | Active/paused status |
| `created_at` | `timestamp` | NOT NULL, default `now()` | Creation date |
| `updated_at` | `timestamp` | NOT NULL, auto-update | Last update |

**Relations**: Belongs to one `category`

**On category delete**: `category_id` is set to `null`

---

## Entity Relationship Diagram (Text)

```
user (1) ──── (1) financial_profile
  │
  ├──── (N) sessions
  ├──── (N) accounts
  │
  └──── (via user_id on each table)
           │
           ├──── (N) categories
           │          │
           │          ├──── (N) transactions
           │          ├──── (N) budgets
           │          └──── (N) recurring_transactions
           │
           ├──── (N) transactions
           ├──── (N) budgets
           └──── (N) recurring_transactions
```

---

## Default Seed Data

On user registration, 18 categories are seeded:

**Needs (6)**: Rent/Mortgage 🏠, Groceries 🛒, Utilities ⚡, Insurance 🛡️, Transportation 🚗, Healthcare 🏥

**Wants (5)**: Dining Out 🍽️, Entertainment 🎬, Shopping 🛍️, Subscriptions 📺, Hobbies 🎨

**Future (4)**: Savings 💰, Investments 📈, Emergency Fund 🏦, Debt Repayment 💳

**Income (3)**: Salary 💵, Freelance 💼, Other Income 💸

---

_Document Version: 1.0_
_Last Updated: 2026-03-15_
