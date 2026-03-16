# Intent - API Specification

## Overview

All API endpoints are served under `/api/v1/` using Next.js App Router route handlers. Authentication is session-based via Better Auth. The auth endpoints are served at `/api/auth/*` and managed entirely by Better Auth.

---

## Authentication

All `/api/v1/*` endpoints require an authenticated session. Unauthenticated requests receive:

```json
{ "error": "Unauthorized" }
```
**Status**: `401`

Session is obtained via `auth.api.getSession({ headers })` from Better Auth.

---

## Response Format

All successful responses follow this structure:

```json
{ "data": <entity or entity[]> }
```

Error responses:

```json
{ "error": "<message>" }
```

Validation errors (Zod):

```json
{ "error": "Validation failed", "issues": [...] }
```
**Status**: `400`

---

## Endpoints

### Transactions

#### `GET /api/v1/transactions`

List transactions for the authenticated user.

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `"expense" \| "income"` | — | Filter by transaction type |
| `categoryId` | `uuid` | — | Filter by category |
| `limit` | `number` | `50` | Pagination limit |
| `offset` | `number` | `0` | Pagination offset |
| `orderBy` | `"date_desc" \| "date_asc" \| "amount_desc" \| "amount_asc"` | `"date_desc"` | Sort order |

**Response**: `200 { data: Transaction[] }` (includes `category` relation)

---

#### `POST /api/v1/transactions`

Create a new transaction.

**Request Body**:

```json
{
  "amount": "string | number",
  "type": "expense | income",
  "description": "string (optional)",
  "date": "string (YYYY-MM-DD)",
  "categoryId": "uuid (optional)"
}
```

**Response**: `201 { data: Transaction }`

---

#### `GET /api/v1/transactions/:id`

Get a single transaction by ID.

**Response**: `200 { data: Transaction }` or `404`

---

#### `PATCH /api/v1/transactions/:id`

Update a transaction.

**Request Body** (all fields optional):

```json
{
  "amount": "string | number",
  "type": "expense | income",
  "description": "string",
  "date": "string",
  "categoryId": "string | null"
}
```

**Response**: `200 { data: Transaction }` or `404`

---

#### `DELETE /api/v1/transactions/:id`

Delete a transaction.

**Response**: `200 { data: Transaction }` (deleted record) or `404`

---

### Categories

#### `GET /api/v1/categories`

List categories for the authenticated user, ordered by name.

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `type` | `"expense" \| "income"` | Filter by category type |

**Response**: `200 { data: Category[] }`

---

#### `POST /api/v1/categories`

Create a new category.

**Request Body**:

```json
{
  "name": "string (1-100 chars)",
  "type": "expense | income",
  "icon": "string (max 50, optional)",
  "color": "string (max 7, optional)"
}
```

**Response**: `201 { data: Category }`

---

#### `GET /api/v1/categories/:id`

Get a single category by ID.

**Response**: `200 { data: Category }` or `404`

---

#### `PATCH /api/v1/categories/:id`

Update a category. All fields optional.

**Response**: `200 { data: Category }` or `404`

---

#### `DELETE /api/v1/categories/:id`

Delete a category. Associated transactions will have `categoryId` set to `null`. Associated budgets will be cascade-deleted.

**Response**: `200 { data: Category }` or `404`

---

### Budgets

#### `GET /api/v1/budgets`

List all budgets for the authenticated user (includes `category` relation).

**Response**: `200 { data: Budget[] }`

---

#### `POST /api/v1/budgets`

Create a new budget.

**Request Body**:

```json
{
  "categoryId": "uuid",
  "amount": "string | number",
  "period": "monthly | weekly",
  "startDate": "string (YYYY-MM-DD)"
}
```

**Response**: `201 { data: Budget }`

---

#### `GET /api/v1/budgets/:id`

Get a single budget by ID (includes `category` relation).

**Response**: `200 { data: Budget }` or `404`

---

#### `PATCH /api/v1/budgets/:id`

Update a budget. All fields optional.

**Response**: `200 { data: Budget }` or `404`

---

#### `DELETE /api/v1/budgets/:id`

Delete a budget.

**Response**: `200 { data: Budget }` or `404`

---

### Recurring Transactions

#### `GET /api/v1/recurring`

List all recurring transactions (includes `category` relation, ordered by `createdAt`).

**Response**: `200 { data: RecurringTransaction[] }`

---

#### `POST /api/v1/recurring`

Create a new recurring transaction. Sets `nextDueDate` to `startDate`.

**Request Body**:

```json
{
  "amount": "string | number",
  "type": "expense | income",
  "description": "string (optional)",
  "frequency": "daily | weekly | biweekly | monthly | quarterly | yearly",
  "startDate": "string (YYYY-MM-DD)",
  "endDate": "string (optional)",
  "categoryId": "uuid (optional)"
}
```

**Response**: `201 { data: RecurringTransaction }`

---

#### `GET /api/v1/recurring/:id`

Get a single recurring transaction (includes `category` relation).

**Response**: `200 { data: RecurringTransaction }` or `404`

---

#### `PATCH /api/v1/recurring/:id`

Update a recurring transaction.

**Request Body** (all fields optional):

```json
{
  "amount": "string | number",
  "type": "expense | income",
  "description": "string",
  "frequency": "daily | weekly | biweekly | monthly | quarterly | yearly",
  "startDate": "string",
  "endDate": "string | null",
  "nextDueDate": "string",
  "isActive": "boolean",
  "categoryId": "string | null"
}
```

**Response**: `200 { data: RecurringTransaction }` or `404`

---

#### `DELETE /api/v1/recurring/:id`

Delete a recurring transaction.

**Response**: `200 { data: RecurringTransaction }` or `404`

---

### Financial Profile

The financial profile is a singleton per user (keyed by `userId`).

#### `GET /api/v1/financial-profile`

Get the authenticated user's financial profile.

**Response**: `200 { data: FinancialProfile }` or `404`

---

#### `POST /api/v1/financial-profile`

Create the financial profile (used during onboarding).

**Request Body**:

```json
{
  "monthlyIncomeTarget": "number (> 0, <= 1,000,000,000)",
  "needsPercentage": "number (0-100, default 50)",
  "wantsPercentage": "number (0-100, default 30)",
  "futurePercentage": "number (0-100, default 20)"
}
```

**Validation**: `needsPercentage + wantsPercentage + futurePercentage === 100`

**Response**: `201 { data: FinancialProfile }` or `409 { error: "Profile already exists" }`

---

#### `PATCH /api/v1/financial-profile`

Update the financial profile.

**Request Body** (all fields optional, but if updating percentages, all three must be provided):

```json
{
  "monthlyIncomeTarget": "number",
  "needsPercentage": "number",
  "wantsPercentage": "number",
  "futurePercentage": "number"
}
```

**Validation**: When updating percentages, all three must sum to 100.

**Response**: `200 { data: FinancialProfile }` or `404`

---

### Insights

#### `GET /api/v1/insights`

Get spending insights for the authenticated user.

**Query Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | `"week" \| "month" \| "year"` | `"month"` | Time period for analysis |

**Response**:

```json
{
  "data": {
    "totalExpenses": 1250.00,
    "totalIncome": 3000.00,
    "balance": 1750.00,
    "spendingByCategory": [
      { "name": "Groceries", "value": 450.00 },
      { "name": "Dining Out", "value": 200.00 }
    ],
    "transactionCount": 42
  }
}
```

---

#### `GET /api/v1/insights/allocation-summary`

Get 50/30/20 allocation performance for a specific month.

**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `month` | `string (YYYY-MM)` | Yes | Target month |

**Response**:

```json
{
  "data": {
    "income": 3000.00,
    "targets": {
      "needs": 1500.00,
      "wants": 900.00,
      "future": 600.00
    },
    "actual": {
      "needs": 1200.00,
      "wants": 750.00,
      "future": 400.00
    }
  }
}
```

**Errors**: `400` if `month` is missing, `404` if no financial profile exists

---

## Client API Layer

The `lib/api-client.ts` module provides a typed client (`api`) for all endpoints:

```ts
api.transactions.list({ type?, categoryId?, limit?, offset?, orderBy? })
api.transactions.get(id)
api.transactions.create(data)
api.transactions.update(id, data)
api.transactions.delete(id)

api.categories.list(type?)
api.categories.get(id)
api.categories.create(data)
api.categories.update(id, data)
api.categories.delete(id)

api.budgets.list()
api.budgets.get(id)
api.budgets.create(data)
api.budgets.update(id, data)
api.budgets.delete(id)

api.recurring.list()
api.recurring.get(id)
api.recurring.create(data)
api.recurring.update(id, data)
api.recurring.delete(id)

api.financialProfile.get()
api.financialProfile.create(data)
api.financialProfile.update(data)

api.insights.get(period?)
api.insights.allocationSummary(month)
```

---

_Document Version: 1.0_
_Last Updated: 2026-03-15_
