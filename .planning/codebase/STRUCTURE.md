# Codebase Structure

**Analysis Date:** 2026-04-23

## Directory Layout

```
intent-expense-tracker/          # Monorepo root
├── web/                         # Next.js application (the only app)
│   ├── app/                     # Next.js App Router routes
│   │   ├── (app)/               # Authenticated route group
│   │   │   ├── layout.tsx       # Auth guard + CurrencyProvider + AppShell
│   │   │   ├── page.tsx         # Dashboard (/)
│   │   │   ├── loading.tsx      # Dashboard skeleton
│   │   │   ├── budgets/         # /budgets route
│   │   │   ├── categories/      # /categories route
│   │   │   ├── insights/        # /insights route
│   │   │   ├── profile/         # /profile route
│   │   │   ├── recurring/       # /recurring route
│   │   │   └── transactions/    # /transactions route
│   │   ├── (auth)/              # Unauthenticated route group
│   │   │   ├── layout.tsx       # Centered auth layout
│   │   │   ├── login/           # /login route
│   │   │   ├── register/        # /register route
│   │   │   └── onboarding/      # /onboarding route (first-time setup)
│   │   ├── api/
│   │   │   └── auth/[...all]/   # better-auth catch-all handler
│   │   ├── globals.css          # Global Tailwind CSS + CSS variables
│   │   └── layout.tsx           # Root layout (fonts, Toaster)
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── skeletons/           # Loading skeleton components
│   │   └── *.tsx                # Feature and shared components
│   ├── lib/                     # Business logic and data access
│   │   ├── actions/             # Next.js Server Actions (mutations)
│   │   ├── queries/             # Read-only DB query functions
│   │   ├── validations/         # Zod schemas for mutations
│   │   ├── schema.ts            # Drizzle ORM schema (single source of truth)
│   │   ├── db.ts                # Neon Postgres DB client
│   │   ├── auth.ts              # better-auth configuration
│   │   ├── auth-client.ts       # better-auth browser client
│   │   ├── finance-utils.ts     # 50/30/20 logic, currency formatting
│   │   ├── currencies.ts        # Supported currency list + DEFAULT_CURRENCY
│   │   ├── seed-data.ts         # Default category definitions seeded on signup
│   │   └── utils.ts             # General utilities (cn helper etc.)
│   ├── types/
│   │   └── index.ts             # All shared TypeScript domain types
│   ├── drizzle/                 # Drizzle migration files
│   │   └── *.sql                # SQL migration files
│   ├── public/                  # Static assets
│   ├── drizzle.config.ts        # Drizzle Kit config (migrations)
│   ├── next.config.ts           # Next.js config
│   ├── tsconfig.json            # TypeScript config (@/* path alias)
│   └── package.json
├── docs/                        # Project documentation
├── specs/                       # Feature specs / planning docs
└── terraform/                   # Infrastructure as code
```

## Directory Purposes

**`web/app/(app)/`:**
- Purpose: All authenticated feature routes
- Contains: `page.tsx` (Server Component), `loading.tsx` (Suspense skeleton), no `layout.tsx` per feature
- Key files: `web/app/(app)/layout.tsx` — the single auth + profile guard for all app routes

**`web/app/(auth)/`:**
- Purpose: Login, registration, and onboarding flows
- Contains: One `page.tsx` per route; shared centered layout

**`web/components/`:**
- Purpose: All React components. Feature page components live here, not in `app/`
- Pattern: Pages in `app/` are thin — they import a matching `*-page.tsx` component from `components/` for anything complex
- Key files: `app-shell.tsx`, `transaction-sheet.tsx`, `transaction-sheet-context.tsx`, `currency-provider.tsx`

**`web/components/ui/`:**
- Purpose: shadcn/ui primitives (Button, Sheet, Input, Card, etc.)
- Generated: Yes (via shadcn CLI), but committed and editable
- Do not add custom business logic here

**`web/components/skeletons/`:**
- Purpose: Skeleton loading states for each major page, used by `loading.tsx` files
- Naming: `<feature>-skeleton.tsx`

**`web/lib/actions/`:**
- Purpose: All write operations (create, update, delete) as Next.js Server Actions
- Pattern: Every file starts with `"use server"`. Returns `ActionResult<T>`.
- One file per domain entity: `transactions.ts`, `budgets.ts`, `categories.ts`, `recurring.ts`, `financial-profile.ts`

**`web/lib/queries/`:**
- Purpose: All read operations. Called from Server Components (pages/layouts).
- Pattern: No `"use server"` directive — plain async functions. Always call `getAuthenticatedUser()` first.
- One file per domain entity plus `auth.ts` and `dashboard.ts`

**`web/lib/validations/`:**
- Purpose: Zod schemas for each entity's create/update inputs
- Pattern: Export `createXSchema`, `updateXSchema`, and inferred types `CreateXInput`, `UpdateXInput`
- One file per domain entity

**`web/types/index.ts`:**
- Purpose: Central type registry — all domain entity types and shared utility types
- All types are manually maintained (not auto-generated from schema)

**`web/drizzle/`:**
- Purpose: SQL migration files generated by Drizzle Kit
- Generated: Yes — run `pnpm drizzle-kit generate` then `pnpm drizzle-kit migrate`
- Committed: Yes

## Key File Locations

**Entry Points:**
- `web/app/layout.tsx`: Root HTML shell, fonts, Toaster
- `web/app/(app)/layout.tsx`: Auth guard + app chrome
- `web/app/(auth)/layout.tsx`: Auth page wrapper
- `web/app/api/auth/[...all]/route.ts`: better-auth handler

**Configuration:**
- `web/lib/schema.ts`: Database schema (edit here to add/change tables)
- `web/drizzle.config.ts`: Drizzle Kit migration config
- `web/tsconfig.json`: TypeScript config with `@/*` path alias
- `web/next.config.ts`: Next.js config

**Core Logic:**
- `web/lib/db.ts`: Neon Postgres pool + Drizzle client singleton
- `web/lib/auth.ts`: better-auth setup (providers, hooks, DB adapter)
- `web/lib/auth-client.ts`: Browser-side better-auth client
- `web/lib/finance-utils.ts`: 50/30/20 budget math, currency formatting, amount input parsing
- `web/lib/currencies.ts`: Currency list and `DEFAULT_CURRENCY` constant

**Domain Actions:**
- `web/lib/actions/transactions.ts`
- `web/lib/actions/budgets.ts`
- `web/lib/actions/categories.ts`
- `web/lib/actions/recurring.ts`
- `web/lib/actions/financial-profile.ts`

**Domain Queries:**
- `web/lib/queries/transactions.ts`
- `web/lib/queries/budgets.ts`
- `web/lib/queries/categories.ts`
- `web/lib/queries/dashboard.ts`
- `web/lib/queries/insights.ts`
- `web/lib/queries/recurring.ts`
- `web/lib/queries/financial-profile.ts`
- `web/lib/queries/auth.ts`

## Naming Conventions

**Files:**
- All source files: `kebab-case.tsx` / `kebab-case.ts`
- Page components: `page.tsx` (Next.js convention)
- Layout components: `layout.tsx`
- Loading skeletons: `loading.tsx` (Next.js Suspense) and `<feature>-skeleton.tsx` in `components/skeletons/`
- Feature page components: `<feature>-page.tsx` in `components/`

**Directories:**
- Route groups: `(group-name)` — parentheses excluded from URL
- Dynamic segments: `[param]` e.g. `[...all]`
- All directories: lowercase kebab-case

**Variables / Functions:**
- Components: PascalCase (`TransactionSheet`, `BucketCard`)
- Functions: camelCase (`createTransaction`, `getAuthenticatedUser`)
- Constants: UPPER_SNAKE_CASE (`BUCKET_DEFINITIONS`, `DEFAULT_CURRENCY`)
- Types: PascalCase (`ActionResult`, `TransactionWithCategory`)
- Zod schemas: camelCase with `Schema` suffix (`createTransactionSchema`)

## Where to Add New Code

**New Feature Route:**
1. Create `web/app/(app)/<feature>/page.tsx` — Server Component that fetches via a query
2. Create `web/app/(app)/<feature>/loading.tsx` — imports skeleton from `components/skeletons/`
3. Create `web/components/skeletons/<feature>-skeleton.tsx`
4. Create `web/components/<feature>-page.tsx` for complex client-side UI

**New DB Entity:**
1. Add table to `web/lib/schema.ts`
2. Run `pnpm drizzle-kit generate` to create migration SQL in `web/drizzle/`
3. Add TypeScript type to `web/types/index.ts`
4. Create `web/lib/queries/<entity>.ts`
5. Create `web/lib/actions/<entity>.ts` (with `"use server"`)
6. Create `web/lib/validations/<entity>.ts`

**New Server Action (mutation):**
- Place in `web/lib/actions/<entity>.ts`
- Start file with `"use server"`
- Call `getAuthenticatedUser()` first
- Validate input with Zod `safeParse`
- Return `ActionResult<T>` from `@/types`
- Call `revalidatePath()` after successful writes

**New Query (read):**
- Place in `web/lib/queries/<entity>.ts`
- Call `getAuthenticatedUser()` first to get `userId`
- Always scope queries with `eq(table.userId, userId)`

**New shadcn/ui Component:**
- Run `pnpm dlx shadcn@latest add <component>`
- Output goes to `web/components/ui/`

**Shared Utility:**
- Finance math or currency formatting: `web/lib/finance-utils.ts`
- General React/DOM utils: `web/lib/utils.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents (codebase maps, phase plans)
- Generated: Manually by GSD tooling
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code configuration and worktrees
- Generated: Yes
- Committed: Partially (commands directory)

**`web/.next/`:**
- Purpose: Next.js build output and dev cache
- Generated: Yes
- Committed: No (`.gitignore`)

**`web/drizzle/meta/`:**
- Purpose: Drizzle Kit migration metadata (snapshot JSON)
- Generated: Yes by `drizzle-kit generate`
- Committed: Yes

---

*Structure analysis: 2026-04-23*
