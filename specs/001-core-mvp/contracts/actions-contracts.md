# Server Actions & Queries Contracts: Core MVP

**Branch**: `001-core-mvp` | **Date**: 2026-03-15
**Pattern**: Server Actions (mutations) + Server Component queries
(reads). No REST API layer.
**Auth**: All actions and queries call `getAuthenticatedUser()` which
uses `auth.api.getSession({ headers: await headers() })`. Throws
redirect to `/login` if unauthenticated.

## Shared Patterns

### Auth Helper (`lib/queries/auth.ts`)

```ts
async function getAuthenticatedUser(): Promise<{ userId: string }>
```

Returns the authenticated user's ID or redirects to `/login`.
Used by every action and query.

### Action Return Type

All Server Actions return a consistent result shape:

```ts
type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; issues?: ZodIssue[] }
```

### Revalidation

After successful mutations, actions call `revalidatePath()` to
refresh the relevant page's server-rendered data.

---

## Transactions

### Queries (`lib/queries/transactions.ts`)

```ts
async function getTransactions(params: {
  type?: "expense" | "income"
  categoryId?: string
  search?: string
  limit?: number    // default 50
  offset?: number   // default 0
  orderBy?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc"
}): Promise<TransactionWithCategory[]>
```

Returns transactions with their category relation. Scoped by
authenticated user. Supports filtering, search (ILIKE on description
+ category name), pagination, and sorting.

### Actions (`lib/actions/transactions.ts`)

```ts
"use server"

async function createTransaction(formData: {
  amount: number          // required, > 0
  type: "expense" | "income"  // required
  description?: string
  date: string            // YYYY-MM-DD, required
  categoryId?: string     // uuid, optional
}): Promise<ActionResult<Transaction>>

async function updateTransaction(
  id: string,
  data: Partial<{
    amount: number
    type: "expense" | "income"
    description: string
    date: string
    categoryId: string | null
  }>
): Promise<ActionResult<Transaction>>

async function deleteTransaction(
  id: string
): Promise<ActionResult>
```

All actions: validate with Zod, check auth, scope by userId,
`revalidatePath("/transactions")` and `revalidatePath("/")`.

---

## Categories

### Queries (`lib/queries/categories.ts`)

```ts
async function getCategories(params?: {
  type?: "expense" | "income"
}): Promise<Category[]>
```

Returns categories ordered by name. Scoped by authenticated user.

### Actions (`lib/actions/categories.ts`)

```ts
"use server"

async function createCategory(formData: {
  name: string                // 1-100 chars, required
  type: "expense" | "income"  // required
  icon?: string               // emoji, optional
  allocationBucket?: "needs" | "wants" | "future"  // required if expense
}): Promise<ActionResult<Category>>

async function updateCategory(
  id: string,
  data: Partial<{
    name: string
    icon: string
    allocationBucket: "needs" | "wants" | "future"
  }>
): Promise<ActionResult<Category>>

async function deleteCategory(
  id: string
): Promise<ActionResult>
```

Delete: SET NULL on transactions' categoryId, CASCADE on budgets.
Revalidates `/categories`, `/transactions`, `/budgets`.

---

## Budgets

### Queries (`lib/queries/budgets.ts`)

```ts
async function getBudgets(): Promise<BudgetWithCategory[]>

async function getBudgetsWithSpending(params: {
  month: string  // YYYY-MM
}): Promise<BudgetWithSpending[]>
```

`getBudgetsWithSpending` joins budgets with sum of transactions for
the given month per category. Returns amount, spent, and category.

### Actions (`lib/actions/budgets.ts`)

```ts
"use server"

async function createBudget(formData: {
  categoryId: string        // uuid, required
  amount: number            // required, > 0
  period: "monthly" | "weekly"  // required
  startDate: string         // YYYY-MM-DD, required
}): Promise<ActionResult<Budget>>

async function updateBudget(
  id: string,
  data: Partial<{
    amount: number
    period: "monthly" | "weekly"
    startDate: string
  }>
): Promise<ActionResult<Budget>>

async function deleteBudget(
  id: string
): Promise<ActionResult>
```

Revalidates `/budgets` and `/`.

---

## Recurring Transactions

### Queries (`lib/queries/recurring.ts`)

```ts
async function getRecurringTransactions(): Promise<
  RecurringTransactionWithCategory[]
>
```

Returns all recurring transactions with category, ordered by
createdAt. Scoped by authenticated user.

### Actions (`lib/actions/recurring.ts`)

```ts
"use server"

async function createRecurring(formData: {
  amount: number
  type: "expense" | "income"
  description?: string
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
    | "quarterly" | "yearly"
  startDate: string         // YYYY-MM-DD
  endDate?: string
  categoryId?: string
}): Promise<ActionResult<RecurringTransaction>>
// Sets nextDueDate = startDate automatically

async function updateRecurring(
  id: string,
  data: Partial<{
    amount: number
    type: "expense" | "income"
    description: string
    frequency: string
    startDate: string
    endDate: string | null
    isActive: boolean
    categoryId: string | null
  }>
): Promise<ActionResult<RecurringTransaction>>

async function deleteRecurring(
  id: string
): Promise<ActionResult>

async function processRecurringTransactions(): Promise<{
  generated: number
}>
```

`processRecurringTransactions` is called from the authenticated
layout on app load. It finds all active recurring items where
`nextDueDate <= today`, generates transactions, and advances dates.

Revalidates `/recurring`, `/transactions`, `/`.

---

## Financial Profile (Singleton)

### Queries (`lib/queries/financial-profile.ts`)

```ts
async function getFinancialProfile(): Promise<
  FinancialProfile | null
>
```

Returns the profile or null (used by onboarding guard).

### Actions (`lib/actions/financial-profile.ts`)

```ts
"use server"

async function createFinancialProfile(formData: {
  monthlyIncomeTarget: number  // required, > 0
  needsPercentage?: number     // default 50
  wantsPercentage?: number     // default 30
  futurePercentage?: number    // default 20
}): Promise<ActionResult<FinancialProfile>>
// Validation: percentages MUST sum to 100
// Returns error if profile already exists

async function updateFinancialProfile(data: {
  monthlyIncomeTarget?: number
  needsPercentage?: number
  wantsPercentage?: number
  futurePercentage?: number
}): Promise<ActionResult<FinancialProfile>>
// If updating percentages, all three MUST be provided and sum to 100
```

Revalidates `/`, `/budgets`, `/insights`.

---

## Insights

### Queries (`lib/queries/insights.ts`)

```ts
async function getInsights(params: {
  period: "week" | "month" | "3months" | "6months" | "year"
}): Promise<{
  totalExpenses: number
  totalIncome: number
  balance: number
  spendingByCategory: Array<{
    name: string
    value: number
    bucket: "needs" | "wants" | "future"
  }>
  transactionCount: number
}>

async function getAllocationSummary(params: {
  month: string  // YYYY-MM
}): Promise<{
  income: number
  targets: { needs: number; wants: number; future: number }
  actual: { needs: number; wants: number; future: number }
}>
```

Both query functions compute aggregates directly from transaction
and financial profile data using Drizzle SQL aggregations.

---

## Auth Endpoints (Better Auth only)

| Path | Description |
|------|-------------|
| `/api/auth/*` | All auth routes (login, register, session, OAuth) |

This is the only API route in the application. Better Auth handles
it via its catch-all route handler at
`app/api/auth/[...all]/route.ts`.
