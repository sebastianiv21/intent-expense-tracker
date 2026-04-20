# Codebase Structure

**Analysis Date:** 2026-04-19

## Directory Layout

```
project-root/
├── web/                        # Next.js application (only app code lives here)
│   ├── app/                    # Next.js App Router root
│   │   ├── (app)/              # Authenticated app route group
│   │   │   ├── layout.tsx      # Auth guard + AppShell wrapper
│   │   │   ├── page.tsx        # Dashboard (/)
│   │   │   ├── transactions/   # /transactions page
│   │   │   ├── budgets/        # /budgets page
│   │   │   ├── categories/     # /categories page
│   │   │   ├── insights/       # /insights page
│   │   │   ├── profile/        # /profile page
│   │   │   └── recurring/      # /recurring page
│   │   ├── (auth)/             # Unauthenticated route group
│   │   │   ├── login/          # /login page
│   │   │   ├── register/       # /register page
│   │   │   └── onboarding/     # /onboarding page (financial profile setup)
│   │   ├── api/
│   │   │   └── auth/[...all]/  # better-auth HTTP handler
│   │   ├── layout.tsx          # Root layout (fonts, Toaster)
│   │   └── globals.css         # Global Tailwind styles
│   ├── components/             # Shared React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── skeletons/          # Loading skeleton components
│   │   └── *.tsx               # Feature components (app-level)
│   ├── lib/                    # Server-side logic and utilities
│   │   ├── actions/            # Next.js Server Actions (mutations)
│   │   ├── queries/            # DB read functions (used by server components)
│   │   ├── validations/        # Zod schemas for action input validation
│   │   ├── schema.ts           # Drizzle ORM table/relation definitions
│   │   ├── db.ts               # Neon DB pool + Drizzle client
│   │   ├── auth.ts             # better-auth server config
│   │   ├── auth-client.ts      # better-auth React client (client component use)
│   │   ├── finance-utils.ts    # 50/30/20 bucket logic, amount formatting
│   │   ├── currencies.ts       # Supported currencies list and helpers
│   │   ├── seed-data.ts        # Default categories seeded on user creation
│   │   └── utils.ts            # General utility (cn helper, etc.)
│   ├── types/
│   │   └── index.ts            # All shared TypeScript types
│   ├── drizzle/                # Database migrations
│   │   ├── meta/               # Drizzle migration metadata
│   │   └── *.sql               # Numbered SQL migration files
│   └── public/                 # Static assets (icons, favicon)
├── specs/                      # Product specs and checklists by feature
├── docs/                       # Project documentation
├── .planning/                  # GSD planning documents
│   └── codebase/               # Auto-generated codebase maps
└── .factory/                   # GSD command definitions
```

## Directory Purposes

**`web/app/(app)/`:**
- Purpose: All authenticated pages of the application
- Contains: Async server components (pages) and a shared layout
- Key files: `layout.tsx` (auth guard + AppShell), `page.tsx` (dashboard)
- Pattern: Each subdirectory is a route with its own `page.tsx`; some have `loading.tsx`

**`web/app/(auth)/`:**
- Purpose: Unauthenticated flows (login, register, onboarding)
- Contains: Client component pages for auth forms
- Key files: `login/page.tsx`, `register/page.tsx`, `onboarding/page.tsx`

**`web/app/api/auth/[...all]/`:**
- Purpose: Catch-all route that delegates all `/api/auth/*` requests to better-auth
- Key files: `route.ts` — exports `GET` and `POST` via `toNextJsHandler(auth)`

**`web/components/`:**
- Purpose: All React components shared across pages
- Contains: Feature components (one per concept), shadcn/ui primitives, skeleton loaders
- Pattern: Flat file structure — one file per component, named in kebab-case (e.g., `transaction-sheet.tsx`)
- Sub-directories: `ui/` for shadcn primitives, `skeletons/` for loading states

**`web/lib/actions/`:**
- Purpose: All database mutations — one file per domain entity
- Files: `transactions.ts`, `categories.ts`, `budgets.ts`, `recurring.ts`, `financial-profile.ts`
- Pattern: Every function is `"use server"`, validates with Zod, returns `ActionResult<T>`, calls `revalidatePath`

**`web/lib/queries/`:**
- Purpose: All database reads — one file per domain entity
- Files: `dashboard.ts`, `transactions.ts`, `categories.ts`, `budgets.ts`, `recurring.ts`, `financial-profile.ts`, `insights.ts`, `auth.ts`
- Pattern: Async functions called directly from server components; always call `getAuthenticatedUser()` first

**`web/lib/validations/`:**
- Purpose: Zod schemas for validating Server Action inputs
- Files: `transactions.ts`, `categories.ts`, `budgets.ts`, `recurring.ts`, `financial-profile.ts`
- Pattern: Schemas are imported by the corresponding action file and called with `.safeParse()`

**`web/drizzle/`:**
- Purpose: Database migration history
- Contains: Numbered `.sql` files and a `meta/` directory with Drizzle snapshot metadata
- Generated: Yes (via `drizzle-kit`)
- Committed: Yes

**`web/types/`:**
- Purpose: All shared TypeScript types used across server and client code
- Key file: `index.ts` — defines entity types (`Transaction`, `Category`, etc.), relation types (`TransactionWithCategory`), `ActionResult<T>`, `FilterState`

## Key File Locations

**Entry Points:**
- `web/app/layout.tsx` — root HTML shell, fonts, global Toaster
- `web/app/(app)/layout.tsx` — auth guard, financial profile check, AppShell, CurrencyProvider
- `web/app/(app)/page.tsx` — dashboard page (default route after login)

**Configuration:**
- `web/lib/db.ts` — Neon pool configuration, reads `DATABASE_URL`
- `web/lib/auth.ts` — better-auth config (providers, DB adapter, hooks)
- `web/lib/auth-client.ts` — client-side auth, reads `NEXT_PUBLIC_BETTER_AUTH_URL`

**Core Logic:**
- `web/lib/schema.ts` — single source of truth for DB schema and Drizzle relations
- `web/lib/finance-utils.ts` — 50/30/20 allocation logic and amount formatting/parsing
- `web/types/index.ts` — all domain types

**Database:**
- `web/lib/schema.ts` — table definitions
- `web/drizzle/*.sql` — migration files

## Naming Conventions

**Files:**
- Components: kebab-case, e.g., `transaction-sheet.tsx`, `hero-balance-card.tsx`
- Server actions: domain-noun, e.g., `lib/actions/transactions.ts`
- Queries: domain-noun, e.g., `lib/queries/dashboard.ts`
- Pages: always `page.tsx` inside a route directory

**Directories:**
- Route groups: parenthesized, e.g., `(app)`, `(auth)`
- Dynamic segments: bracketed, e.g., `[...all]`

**Exports:**
- Actions: named exports, verb-first, e.g., `createTransaction`, `updateBudget`
- Queries: named exports, verb-first, e.g., `getTransactions`, `getDashboardData`
- Components: named exports for most; default exports for pages and layouts

## Where to Add New Code

**New authenticated page (e.g., `/reports`):**
- Create: `web/app/(app)/reports/page.tsx` (async server component)
- Add loading state: `web/app/(app)/reports/loading.tsx`
- Add nav link to: `web/components/side-nav.tsx` and `web/components/bottom-nav.tsx`

**New feature component:**
- Implementation: `web/components/{feature-name}.tsx`
- If interactive (client): add `"use client"` at top; call actions directly
- If purely presentational with server data: keep as server component, pass data as props

**New domain entity (mutations):**
- Action file: `web/lib/actions/{entity}.ts` — add `"use server"` functions
- Query file: `web/lib/queries/{entity}.ts` — add read functions
- Validation: `web/lib/validations/{entity}.ts` — add Zod schemas
- Types: add to `web/types/index.ts`

**New DB table:**
1. Add table definition to `web/lib/schema.ts`
2. Run `drizzle-kit generate` to produce a migration in `web/drizzle/`
3. Run `drizzle-kit migrate` to apply
4. Add corresponding TypeScript type to `web/types/index.ts`

**Shared UI primitive:**
- Add to: `web/components/ui/{component}.tsx` (shadcn/ui pattern)

## Special Directories

**`web/drizzle/`:**
- Purpose: Migration SQL files and snapshot metadata
- Generated: Yes, by `drizzle-kit generate`
- Committed: Yes — migration files are versioned

**`web/components/ui/`:**
- Purpose: shadcn/ui base primitives (Button, Input, Sheet, etc.)
- Generated: Partially (scaffolded by shadcn CLI, then customized)
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: Auto-generated codebase map documents for GSD tooling
- Generated: Yes, by `/gsd-map-codebase`

**`specs/`:**
- Purpose: Human-authored feature specs with contracts and checklists
- Organized by: numbered spec folders (`001-core-mvp`, `002-transaction-sheet-redesign`, etc.)

---

*Structure analysis: 2026-04-19*
