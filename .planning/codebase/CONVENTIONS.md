# Coding Conventions

**Analysis Date:** 2026-04-19

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` (e.g., `transaction-sheet.tsx`, `page-header.tsx`, `currency-provider.tsx`)
- Server actions: `kebab-case.ts` inside `lib/actions/` (e.g., `lib/actions/transactions.ts`)
- Queries: `kebab-case.ts` inside `lib/queries/` (e.g., `lib/queries/transactions.ts`)
- Validations: `kebab-case.ts` inside `lib/validations/` (e.g., `lib/validations/transactions.ts`)
- Next.js route files: Next.js conventions (`page.tsx`, `loading.tsx`)
- Utility files: `kebab-case.ts` (e.g., `finance-utils.ts`, `auth-client.ts`)

**Components:**
- Named exports using PascalCase (e.g., `export function TransactionSheet`, `export function PageHeader`)
- No default exports for components — only for Next.js route pages (`export default async function TransactionsPage`)
- Context providers: `[Feature]Provider` (e.g., `TransactionSheetProvider`, `CurrencyProvider`)
- Custom hooks: `use[Feature]` (e.g., `useTransactionSheet`, `useCurrency`)

**Variables and Constants:**
- camelCase for local variables and function parameters
- SCREAMING_SNAKE_CASE for module-level constants and lookup objects (e.g., `BUCKET_META`, `BUCKET_ORDER`, `BUCKET_DEFINITIONS`, `FILTERS`)
- camelCase for exported utility functions (e.g., `formatCurrency`, `parseAmountInput`)

**Types:**
- PascalCase for type aliases and interfaces (e.g., `TransactionType`, `ActionResult`, `FormState`)
- Inline `type` keyword preferred over `interface` for object shapes
- `interface` used for component prop types that extend HTML attributes (e.g., `ButtonProps`)
- Suffix `Props` for component prop types (e.g., `TransactionSheetProps`, `PageHeaderProps`)
- Suffix `State` for state shape types (e.g., `FormState`, `TransactionSheetState`)
- Suffix `ContextValue` for React context value types (e.g., `TransactionSheetContextValue`, `CurrencyContextValue`)

## Import Style

**Path Aliases:**
- `@/*` maps to `web/` root (configured in `tsconfig.json`)
- All non-relative imports use the `@/` alias (e.g., `import { cn } from "@/lib/utils"`)
- No relative imports observed between feature modules

**Import Grouping Order (observed pattern):**
1. React and Next.js framework imports (`react`, `next/navigation`, `next/cache`)
2. Third-party library imports (`date-fns`, `lucide-react`, `drizzle-orm`)
3. Internal imports using `@/` alias, ordered by layer:
   - `@/components/...`
   - `@/lib/...`
   - `@/types`
4. `type`-only imports using `import type` for TypeScript types

**Barrel Files:**
- `web/types/index.ts` is the single barrel for all domain types — always import types from `@/types`
- No barrel files for components or lib — each file imported directly by path

## Component Patterns

**Server vs Client Components:**
- Route pages (`page.tsx`) are async server components by default — no `"use client"` directive
- Interactive or stateful components use `"use client"` at the top of the file (e.g., `transaction-sheet.tsx`, `transaction-sheet-context.tsx`, `currency-provider.tsx`)
- Server components fetch data directly using async query functions from `@/lib/queries/`
- Client components receive data as props from their parent server component (data-down pattern)

**Props Typing:**
- Props typed with a local `type [Name]Props = { ... }` declaration above the component function
- Optional props marked with `?` (e.g., `description?: string`, `action?: React.ReactNode`)
- `React.ReactNode` used for `children` and renderable slot props
- Props destructured inline in the function signature

**Pattern — Page Route delegates to a Client Page Component:**
```tsx
// app/(app)/budgets/page.tsx  ← server, fetches data
export default async function BudgetsRoute({ searchParams }: BudgetsRouteProps) {
  const [budgets, categories] = await Promise.all([...]);
  return <BudgetsPage budgets={budgets} categories={categories} />;
}

// components/budgets-page.tsx  ← "use client", owns UI state
"use client";
export function BudgetsPage({ budgets, categories }: BudgetsPageProps) { ... }
```

## State Management Approach

- No global state library (no Redux, Zustand, Jotai)
- UI state owned by `useState` within client components
- Shared interactive state hoisted into React Context providers (e.g., `TransactionSheetContext` for open/close + mode)
- Context defined with `createContext` + `null` default, guarded by a custom hook that throws if used outside provider
- `useMemo` used inside providers to stabilize context value objects
- URL search params (`searchParams`) used as lightweight server-side filter state (e.g., `?type=expense&query=...`)
- `router.refresh()` used to re-fetch server component data after a mutation

## Error Handling Patterns

**Server Actions (`lib/actions/*.ts`):**
- All actions return `ActionResult<T>` discriminated union: `{ success: true, data?: T }` or `{ success: false, error: string, issues?: ZodIssue[] }`
- Input validated with Zod `safeParse` before any DB operation
- DB operations wrapped in `try/catch`; errors logged with `console.error` and a user-safe message returned
- Auth checked at the top of every action with `getAuthenticatedUser()` which throws/redirects on failure

**Client-Side Error Display:**
- `error` state (`useState<string | null>`) held within the form component
- Error shown inline via a styled `<p role="alert">` paragraph inside the form
- `setError(null)` called before each submission attempt
- Generic fallback: `"Something went wrong. Please try again."` for unexpected exceptions

## Linting and TypeScript Config

**ESLint:**
- Config: `web/eslint.config.mjs` using flat config format (`defineConfig`)
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Custom ignores: `.next/**`, `out/**`, `build/**`, `node_modules/**`, `dist/**`, `coverage/**`, `*.min.js`
- Linting run with: `pnpm lint` (calls `eslint`)

**TypeScript:**
- Config: `web/tsconfig.json`
- `strict: true` enabled
- Target: `ES2017`
- `moduleResolution: "bundler"` (modern, Next.js compatible)
- `noEmit: true` (type-checking only, Next.js handles compilation)

## Code Style

**Formatting:**
- No Prettier config file detected — likely relies on editor defaults or ESLint formatting rules
- Consistent use of 2-space indentation and double quotes observed throughout source files
- Trailing commas present in multi-line arrays and objects

**Section Separators:**
- Long files use ASCII banner comments to separate logical sections:
  ```ts
  // ─── Section Name ────────────────────────────────────────────────────────────
  ```
  Seen in `transaction-sheet.tsx`, `finance-utils.ts`, `types/index.ts`

**JSDoc / Comments:**
- JSDoc-style block comments used for non-obvious utility functions (e.g., `formatAmountDisplay`, `parseAmountInput` in `lib/finance-utils.ts`)
- Inline comments used sparingly for non-obvious logic (e.g., suppressing Radix close button, eslint-disable-next-line)

## Validation Pattern

- Zod schemas defined in `lib/validations/[feature].ts`
- Schema names follow `[action][Entity]Schema` (e.g., `createTransactionSchema`, `updateTransactionSchema`)
- Inferred TypeScript types exported alongside schemas: `export type CreateTransactionInput = z.infer<typeof createTransactionSchema>`

---

*Convention analysis: 2026-04-19*
