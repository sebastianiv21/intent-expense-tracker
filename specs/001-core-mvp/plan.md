# Implementation Plan: Core MVP

**Branch**: `001-core-mvp` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-mvp/spec.md`

## Summary

Build the full MVP of the Intent expense tracker: authentication with
Better Auth (email/password + Google OAuth), financial profile
onboarding with 50/30/20 defaults, transaction CRUD with search and
infinite scroll, a dashboard with balance/harmony cards/quick stats,
category management, budget tracking per category, recurring
transaction scheduling, and insights with compliance visualization.
The app uses Next.js 16 App Router with Server Actions for mutations
and Server Components for data fetching, a mobile-first dark theme,
PostgreSQL via Neon, Drizzle ORM, and shadcn/ui components.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 24
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Better Auth
1.4.18, Drizzle ORM 0.45.1, Zod 4.3.6, shadcn/ui 3.8.4,
Tailwind CSS 4, Recharts 3.7.0, date-fns 4.1.0, Lucide React
**Storage**: PostgreSQL (Neon Serverless) via `@neondatabase/serverless`
**Testing**: ESLint (eslint-config-next) for linting; `pnpm build`
for type checking; no unit test framework configured yet
**Target Platform**: Web (mobile-first PWA-ready, responsive to
desktop)
**Project Type**: Full-stack web application (Next.js App Router)
**Performance Goals**: LCP < 2.5s, 60fps animations, skeleton loading
**Constraints**: Dark theme only, USD only, no offline persistence,
no push notifications
**Scale/Scope**: Single-user personal finance app, 10 routes, 6 core
entities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1
design.*

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Mobile-First Design | All UI targets 375px base, 44px touch targets, bottom tabs on mobile, sidebar on desktop, bottom sheets for modals, skeleton screens for loading, transform/opacity animations | PASS |
| II | Type Safety & Validation | TypeScript strict mode enabled, Zod validation in all Server Actions, Drizzle ORM for type-safe queries, shared types in `types/index.ts` | PASS |
| III | Security by Default | Auth checked in every Server Action and data query via `auth.api.getSession()`, all queries scoped by `userId`, no secrets in client code or `NEXT_PUBLIC_` env vars, CSRF via Better Auth | PASS |
| IV | Accessibility | WCAG 2.1 AA compliance, 4.5:1 contrast ratio, Radix UI ARIA attributes, focus management in modals/sheets, labeled form inputs, screen reader error announcements | PASS |
| V | Simplicity & Intentionality | No new dependencies beyond established stack, 50/30/20 model scope only, shadcn/ui + CVA + `cn()` pattern, Server Actions eliminate REST boilerplate | PASS |

**All gates pass. No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/001-core-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── actions-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (app)/                    # Authenticated routes
│   ├── layout.tsx            # App shell (bottom nav + sidebar)
│   ├── page.tsx              # Dashboard
│   ├── budgets/page.tsx
│   ├── categories/page.tsx
│   ├── insights/page.tsx
│   ├── profile/page.tsx
│   ├── recurring/page.tsx
│   └── transactions/page.tsx
├── (auth)/                   # Auth routes (no app nav)
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── onboarding/page.tsx
├── api/
│   └── auth/[...all]/route.ts  # Better Auth handler (only API route)
├── globals.css
├── layout.tsx
└── favicon.ico
components/
├── ui/                       # shadcn/ui primitives
├── app-shell.tsx
├── bottom-nav.tsx
├── side-nav.tsx
├── floating-action-button.tsx
├── page-header.tsx
├── transaction-sheet.tsx
├── transaction-sheet-context.tsx
├── transaction-item.tsx
├── financial-profile-sheet.tsx
└── icons.tsx
lib/
├── schema.ts                 # Drizzle ORM schema (source of truth)
├── db.ts                     # Neon database connection
├── auth.ts                   # Better Auth server config
├── auth-client.ts            # Client-side auth helpers
├── actions/                  # Server Actions (mutations)
│   ├── transactions.ts
│   ├── categories.ts
│   ├── budgets.ts
│   ├── recurring.ts
│   └── financial-profile.ts
├── queries/                  # Data-fetching functions (for RSC)
│   ├── transactions.ts
│   ├── categories.ts
│   ├── budgets.ts
│   ├── recurring.ts
│   ├── financial-profile.ts
│   └── insights.ts
├── validations/              # Zod schemas (shared by actions)
│   ├── transactions.ts
│   ├── categories.ts
│   ├── budgets.ts
│   ├── recurring.ts
│   └── financial-profile.ts
├── finance-utils.ts          # Bucket definitions, formatters
├── seed-data.ts              # Default categories
└── utils.ts                  # cn() and general utilities
types/
└── index.ts                  # Shared TypeScript interfaces
drizzle/
└── *.sql                     # Migrations
```

**Structure Decision**: Next.js App Router with Server Actions for
mutations and Server Components for data fetching. No REST API layer
(only `/api/auth/*` for Better Auth). Server Actions live in
`lib/actions/`, data queries in `lib/queries/`, and Zod schemas in
`lib/validations/`. This eliminates the API client, route handlers,
and middleware — the frontend talks directly to the database through
server-side code.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.
