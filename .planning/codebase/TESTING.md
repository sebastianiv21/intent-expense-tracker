# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Runner:** None configured.

No test framework is installed or configured. The `web/package.json` contains no test runner (no Jest, Vitest, Playwright, Cypress, or similar) in either `dependencies` or `devDependencies`. There is no `jest.config.*`, `vitest.config.*`, or `playwright.config.*` file present.

**Run Commands:**
```bash
# No test script defined in package.json
# Current scripts available:
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm db:generate
pnpm db:push
pnpm db:migrate
pnpm db:studio
```

## Test File Organization

No test files exist in the codebase. A search for `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`, and `__tests__/` directories returned no results.

## Coverage of Existing Tests

| Area | Coverage |
|------|----------|
| Unit tests (utilities, helpers) | None |
| Component tests | None |
| Integration tests (server actions, queries) | None |
| E2E tests | None |

## Gaps — All Areas Untested

The entire application has zero test coverage. Key areas at risk include:

**Utility Logic (high testability, high value):**
- `web/lib/finance-utils.ts` — `parseAmountInput`, `formatAmountDisplay`, `parseStoredAmount`, `formatCurrency`, `formatCurrencyCompact`, `calculatePercentage` are pure functions well-suited to unit testing
- `web/lib/validations/transactions.ts` — Zod schemas for `createTransactionSchema` and `updateTransactionSchema` could be tested with valid/invalid inputs

**Server Actions (`web/lib/actions/*.ts`):**
- `createTransaction`, `updateTransaction`, `deleteTransaction` in `web/lib/actions/transactions.ts`
- All action files follow the same `ActionResult` pattern — no integration or mocked unit tests exist

**Query Layer (`web/lib/queries/*.ts`):**
- All Drizzle ORM queries in `web/lib/queries/` (transactions, budgets, categories, insights, recurring, dashboard) have no tests

**Component Behavior:**
- `web/components/transaction-sheet.tsx` — form state transitions, validation gating, submit flow
- `web/components/transaction-sheet-context.tsx` — context provider open/close/edit state
- `web/components/currency-provider.tsx` — currency formatting delegation

## Recommendations for Adding Tests

If tests are introduced, the recommended setup for this Next.js 16 + React 19 codebase would be:

**Unit testing (pure functions):**
- Vitest is the idiomatic choice for Next.js/Vite-adjacent projects
- Install: `vitest`, `@vitest/ui` (optional)
- Test files co-located: `lib/finance-utils.test.ts`, `lib/validations/transactions.test.ts`

**Component testing:**
- React Testing Library + Vitest
- Install: `@testing-library/react`, `@testing-library/user-event`, `jsdom`

**E2E testing:**
- Playwright is the recommended pairing for Next.js
- Install: `@playwright/test`
- Config: `playwright.config.ts` at `web/` root

**Suggested first targets (highest ROI):**
1. `web/lib/finance-utils.ts` — pure functions, no mocking needed
2. `web/lib/validations/*.ts` — Zod schemas, no mocking needed
3. `web/components/transaction-sheet-context.tsx` — isolated context logic
4. `web/lib/actions/transactions.ts` — mock `db` and `getAuthenticatedUser`

---

*Testing analysis: 2026-04-19*
