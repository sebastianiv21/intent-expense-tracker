# Coding Conventions

**Analysis Date:** 2026-04-23

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` (e.g., `transaction-sheet.tsx`, `currency-provider.tsx`)
- Server actions: `kebab-case.ts` under `lib/actions/` (e.g., `lib/actions/transactions.ts`)
- Query functions: `kebab-case.ts` under `lib/queries/` (e.g., `lib/queries/transactions.ts`)
- Validation schemas: `kebab-case.ts` under `lib/validations/` (e.g., `lib/validations/budgets.ts`)
- Skeleton components: `{entity}-skeleton.tsx` under `components/skeletons/` (e.g., `components/skeletons/transactions-skeleton.tsx`)
- UI primitives: `kebab-case.tsx` under `components/ui/`

**Functions and Hooks:**
- Exported functions: `camelCase` (e.g., `createTransaction`, `getTransactions`, `formatCurrency`)
- React components: `PascalCase` named exports (e.g., `export function TransactionSheet(...)`)
- Custom hooks: `use` prefix, `camelCase` (e.g., `useCurrency`, `useTransactionSheet`)
- Context providers: `PascalCase` + `Provider` suffix (e.g., `CurrencyProvider`, `TransactionSheetProvider`)
- Context hook: `use` + context name (e.g., `useTransactionSheet`, `useCurrency`)

**Variables and Constants:**
- Variables: `camelCase`
- Module-level constants: `SCREAMING_SNAKE_CASE` (e.g., `BUCKET_DEFINITIONS`, `BUCKET_ORDER`, `DEFAULT_CURRENCY`)
- Config objects: `SCREAMING_SNAKE_CASE` for static lookups (e.g., `BUCKET_META`, `FILTERS`)

**Types and Interfaces:**
- Type aliases and interfaces: `PascalCase`
- Props types: `{ComponentName}Props` (e.g., `TransactionSheetProps`, `PageHeaderProps`)
- Action result type: generic `ActionResult<T>` defined in `types/index.ts`
- Schema-inferred types: `z.infer<typeof schema>` exported as `PascalCase` + `Input` (e.g., `CreateTransactionInput`)

**Database Schema:**
- Table names: `camelCase` for exports (e.g., `transactions`, `financialProfile`, `recurringTransactions`)
- Column names: `camelCase` in TypeScript, `snake_case` in the database string argument (e.g., `createdAt: timestamp("created_at")`)
- Enum exports: `camelCase` + `Enum` suffix (e.g., `transactionTypeEnum`, `budgetPeriodEnum`)
- Index names: `{table}_{column}_idx` pattern (e.g., `"transactions_userId_idx"`)

## Code Style

**Formatting:**
- No Prettier config detected — formatting is enforced only by ESLint (Next.js core web vitals + TypeScript rules)
- Semicolons: used consistently throughout
- Quotes: double quotes for JSX attributes, double quotes in TypeScript imports
- Trailing commas: used in multi-line arrays and objects

**Linting:**
- Config: `web/eslint.config.mjs` using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- `eslint-disable-next-line` used sparingly (one known instance: `react-hooks/exhaustive-deps` in `transaction-sheet.tsx`)

## Import Organization

**Order (observed pattern):**
1. React and Next.js imports (`react`, `next/navigation`, `next/cache`, etc.)
2. Third-party library imports (`date-fns`, `lucide-react`, `sonner`, Radix primitives)
3. Internal path-alias imports (`@/components/...`, `@/lib/...`, `@/types`)

**Path Aliases:**
- `@/` maps to the `web/` root (configured in `tsconfig.json`)
- All internal imports use `@/` — no relative imports observed

**Type-only imports:**
- `import type { ... }` used consistently for types that are not used as values
- Example: `import type { ActionResult, Transaction } from "@/types";`

## React / Next.js Directives

**`"use client"`:**
- All interactive components declare `"use client"` at the top of the file
- Page-level components in `app/` are server components by default (no directive)
- UI primitives with Radix interactivity all declare `"use client"` (e.g., `components/ui/sheet.tsx`)

**`"use server"`:**
- All server action files declare `"use server"` as the first line (e.g., `lib/actions/transactions.ts`)
- Never mixed in the same file as client-side code

## Error Handling

**Server actions pattern:**
- Validate input via Zod `safeParse` before any DB call; return early if validation fails
- Wrap DB operations in `try/catch`
- Return discriminated union `ActionResult<T>`:
  - Success: `{ success: true, data: result }`
  - Validation failure: `{ success: false, error: "Validation failed", issues: parsed.error.issues }`
  - DB failure: `{ success: false, error: "Failed to ..." }`
- Log errors with `console.error("Failed to ...", err)` — no error monitoring service

**Query functions:**
- No try/catch — errors propagate to callers (React Server Components let Next.js handle them)

**Client components:**
- Action results checked: `if (result.success)` branch; error surfaced via `sonner` toast or local `error` state

**Auth guard:**
- `getAuthenticatedUser()` in `lib/queries/auth.ts` calls `redirect("/login")` if no session — used at the top of every server action and query

## Logging

**Framework:** `console.error` — no structured logging library
**Pattern:** Used only inside `catch` blocks in server actions with a descriptive prefix message

## Comments

**Section delimiters:**
- Visual separators used for distinct logical sections within a file:
  ```typescript
  // ─── Section Name ────────────────────────────────────────────────────────────
  ```
- Applied in: `lib/schema.ts`, `lib/finance-utils.ts`, `types/index.ts`, `components/transaction-sheet.tsx`

**JSDoc:**
- Used for complex utility functions with non-obvious behavior — includes `@example` blocks
- Example: `formatAmountDisplay` and `parseAmountInput` in `lib/finance-utils.ts` have multi-line JSDoc with examples

**Inline comments:**
- Used to document intentional hacks: `// eslint-disable-next-line react-hooks/exhaustive-deps`
- Used to document intent: `// Clamp limit to prevent abuse`, `// don't let failures block the page`

## Function Design

**Size:** Functions are small and single-purpose; complex components extract helpers above the component definition

**Parameters:**
- Server actions accept `formData: unknown` as the first argument when consuming form data (validated via Zod inside)
- Query functions accept a single `params` object for multiple optional filters
- Pure utilities accept explicit typed primitives

**Return Values:**
- Server actions: always `Promise<ActionResult<T>>`
- Query functions: always `Promise<Entity | Entity[]>`
- Utility functions: synchronous, return typed primitives

## Module Design

**Exports:**
- Named exports only — no default exports for utilities, actions, or queries
- Page components (`page.tsx`, `layout.tsx`) use `export default function`
- UI primitives (`components/ui/`) use named exports only

**Barrel Files:**
- Single barrel: `types/index.ts` — all shared types exported from one file
- No barrel for `lib/actions/`, `lib/queries/`, or `lib/validations/` — import directly by path

## Tailwind CSS

**Pattern:** `cn()` helper from `lib/utils.ts` (wraps `clsx` + `tailwind-merge`) used for all conditional class composition
**Semantic tokens:** Custom CSS variables defined in `app/globals.css` for brand colors (`--bucket-needs`, `--income`, `--expense`, etc.)
**Dark mode:** Hard-coded to dark theme — `dark` class applied on `<body>` in `app/layout.tsx`

## Component Structure Pattern (large components)

File organization for complex feature components (e.g., `components/transaction-sheet.tsx`):
1. Module-level constants/config objects
2. Pure helper functions (non-React)
3. Local type definitions (`interface FormState`, `type EditableTransaction`)
4. Main exported component function

---

*Convention analysis: 2026-04-23*
