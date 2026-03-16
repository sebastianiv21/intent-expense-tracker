# API Contracts: Core MVP

**Branch**: `001-core-mvp` | **Date**: 2026-03-15
**Base URL**: `/api/v1`
**Auth**: All endpoints require authenticated session via Better Auth.
Unauthenticated requests return `401 { "error": "Unauthorized" }`.

## Response Format

**Success**: `{ "data": <entity | entity[]> }`
**Error**: `{ "error": "<message>" }`
**Validation Error**: `400 { "error": "Validation failed", "issues": [...] }`

## Endpoints

### Transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/transactions` | List (paginated, filterable) |
| POST | `/transactions` | Create |
| GET | `/transactions/:id` | Get by ID |
| PATCH | `/transactions/:id` | Update (partial) |
| DELETE | `/transactions/:id` | Delete |

**GET /transactions query params**:
- `type`: `"expense" | "income"` (optional filter)
- `categoryId`: uuid (optional filter)
- `search`: string (optional, ILIKE on description + category name)
- `limit`: number (default 50)
- `offset`: number (default 0)
- `orderBy`: `"date_desc" | "date_asc" | "amount_desc" | "amount_asc"` (default `"date_desc"`)

**POST /transactions body**:
```json
{
  "amount": "number (required, > 0)",
  "type": "expense | income (required)",
  "description": "string (optional)",
  "date": "YYYY-MM-DD (required)",
  "categoryId": "uuid (optional)"
}
```
Response: `201`

**PATCH /transactions/:id body** (all optional):
```json
{
  "amount": "number",
  "type": "expense | income",
  "description": "string",
  "date": "YYYY-MM-DD",
  "categoryId": "uuid | null"
}
```
Response: `200` or `404`

### Categories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | List (filterable by type) |
| POST | `/categories` | Create |
| GET | `/categories/:id` | Get by ID |
| PATCH | `/categories/:id` | Update (partial) |
| DELETE | `/categories/:id` | Delete (SET NULL on transactions, CASCADE budgets) |

**GET /categories query params**:
- `type`: `"expense" | "income"` (optional filter)

**POST /categories body**:
```json
{
  "name": "string (1-100 chars, required)",
  "type": "expense | income (required)",
  "icon": "string (max 50, optional)",
  "allocationBucket": "needs | wants | future (required if type=expense)"
}
```
Response: `201`

### Budgets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/budgets` | List all (includes category relation) |
| POST | `/budgets` | Create |
| GET | `/budgets/:id` | Get by ID |
| PATCH | `/budgets/:id` | Update (partial) |
| DELETE | `/budgets/:id` | Delete |

**POST /budgets body**:
```json
{
  "categoryId": "uuid (required)",
  "amount": "number (required, > 0)",
  "period": "monthly | weekly (required)",
  "startDate": "YYYY-MM-DD (required)"
}
```
Response: `201`

### Recurring Transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recurring` | List all (includes category) |
| POST | `/recurring` | Create |
| GET | `/recurring/:id` | Get by ID |
| PATCH | `/recurring/:id` | Update (partial, includes isActive toggle) |
| DELETE | `/recurring/:id` | Delete |

**POST /recurring body**:
```json
{
  "amount": "number (required, > 0)",
  "type": "expense | income (required)",
  "description": "string (optional)",
  "frequency": "daily | weekly | biweekly | monthly | quarterly | yearly (required)",
  "startDate": "YYYY-MM-DD (required)",
  "endDate": "YYYY-MM-DD (optional)",
  "categoryId": "uuid (optional)"
}
```
Response: `201` (nextDueDate auto-set to startDate)

**PATCH /recurring/:id body** (all optional):
```json
{
  "amount": "number",
  "type": "expense | income",
  "description": "string",
  "frequency": "daily | weekly | biweekly | monthly | quarterly | yearly",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD | null",
  "nextDueDate": "YYYY-MM-DD",
  "isActive": "boolean",
  "categoryId": "uuid | null"
}
```

### Financial Profile (Singleton)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/financial-profile` | Get profile |
| POST | `/financial-profile` | Create (onboarding) |
| PATCH | `/financial-profile` | Update |

**POST /financial-profile body**:
```json
{
  "monthlyIncomeTarget": "number (required, > 0, <= 1,000,000,000)",
  "needsPercentage": "number (0-100, default 50)",
  "wantsPercentage": "number (0-100, default 30)",
  "futurePercentage": "number (0-100, default 20)"
}
```
**Validation**: percentages MUST sum to 100.
Response: `201` or `409` if profile exists.

**PATCH /financial-profile body** (all optional, but if updating
percentages all three MUST be provided):
```json
{
  "monthlyIncomeTarget": "number",
  "needsPercentage": "number",
  "wantsPercentage": "number",
  "futurePercentage": "number"
}
```

### Insights

| Method | Path | Description |
|--------|------|-------------|
| GET | `/insights` | Spending summary |
| GET | `/insights/allocation-summary` | 50/30/20 performance |

**GET /insights query params**:
- `period`: `"week" | "month" | "year"` (default `"month"`)

**Response**:
```json
{
  "data": {
    "totalExpenses": 1250.00,
    "totalIncome": 3000.00,
    "balance": 1750.00,
    "spendingByCategory": [
      { "name": "Groceries", "value": 450.00 }
    ],
    "transactionCount": 42
  }
}
```

**GET /insights/allocation-summary query params**:
- `month`: `"YYYY-MM"` (required)

**Response**:
```json
{
  "data": {
    "income": 3000.00,
    "targets": { "needs": 1500, "wants": 900, "future": 600 },
    "actual": { "needs": 1200, "wants": 750, "future": 400 }
  }
}
```

## Auth Endpoints (managed by Better Auth)

| Path | Description |
|------|-------------|
| `/api/auth/*` | All auth routes (login, register, session, OAuth) |

These are not custom-built; Better Auth handles them via its
catch-all route handler at `app/api/auth/[...all]/route.ts`.

## Client API Layer

Typed client at `lib/api-client.ts` exposes all endpoints:

```
api.transactions.{list, get, create, update, delete}
api.categories.{list, get, create, update, delete}
api.budgets.{list, get, create, update, delete}
api.recurring.{list, get, create, update, delete}
api.financialProfile.{get, create, update}
api.insights.{get, allocationSummary}
```
