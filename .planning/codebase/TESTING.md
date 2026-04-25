# Testing Patterns

**Analysis Date:** 2026-04-23

## Test Framework

**Runner:** None detected
**Assertion Library:** None detected
**Test files found:** 0

No test framework is installed. The `package.json` at `web/package.json` contains no test runner (`jest`, `vitest`, `playwright`, `cypress`, etc.) in either `dependencies` or `devDependencies`. No test configuration files (`jest.config.*`, `vitest.config.*`, `playwright.config.*`) exist. No `*.test.*` or `*.spec.*` files exist anywhere in the project.

**Run Commands:**
```bash
# No test commands configured
# package.json scripts: dev, build, start, lint, db:generate, db:push, db:migrate, db:studio
```

## Test File Organization

**Location:** Not applicable — no tests exist
**Naming:** Not applicable
**Structure:** Not applicable

## Test Structure

No tests exist in this codebase. There are no patterns to document.

## Mocking

**Framework:** None
**Patterns:** None established

## Fixtures and Factories

**Test Data:** None
**Location:** Not applicable

Seed data for development exists at `web/lib/seed-data.ts` (exports `DEFAULT_CATEGORIES`) but this is for database seeding, not test fixtures.

## Coverage

**Requirements:** None enforced — no coverage tooling configured
**View Coverage:** Not available

## Test Types

**Unit Tests:** Not present
**Integration Tests:** Not present
**E2E Tests:** Not present

## What Would Need Testing (priority areas)

The following areas have the highest value for future test coverage based on business logic complexity:

**Pure utility functions (easiest to test, highest ROI):**
- `lib/finance-utils.ts` — `parseAmountInput`, `formatAmountDisplay`, `inferDecimalSeparator`, `calculatePercentage`, `calculateBucketTarget`, `parseStoredAmount`
- `lib/currencies.ts` — `getCurrencyInfo`, `getCurrencySymbol`

**Server actions (integration tests):**
- `lib/actions/transactions.ts` — `createTransaction`, `updateTransaction`, `deleteTransaction`
- `lib/actions/budgets.ts` — `createBudget`, `updateBudget`, `deleteBudget`
- `lib/actions/categories.ts`
- `lib/actions/recurring.ts` — `processRecurringTransactions` (date-sensitive scheduling logic)

**Zod validation schemas (unit tests):**
- `lib/validations/transactions.ts`
- `lib/validations/budgets.ts`
- `lib/validations/categories.ts`
- `lib/validations/recurring.ts`
- `lib/validations/financial-profile.ts`

**Query functions (integration tests with test DB):**
- `lib/queries/transactions.ts` — `getTransactions` (filter/search/ordering), `getTransactionTotals`
- `lib/queries/dashboard.ts` — complex aggregation logic
- `lib/queries/insights.ts`

**React components (component tests):**
- `components/transaction-sheet.tsx` — complex form state, create/edit mode switching
- `components/currency-provider.tsx` — context value propagation
- `components/transaction-sheet-context.tsx` — context state transitions

## Recommended Setup (if tests are added)

Given the stack (Next.js 16, React 19, TypeScript 5), recommended choices:

```bash
# Unit + integration tests
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event

# E2E
npm install -D playwright
```

Vitest is preferred over Jest for this stack because it natively understands ESM, TypeScript, and Vite-compatible configurations without additional transforms.

---

*Testing analysis: 2026-04-23*
