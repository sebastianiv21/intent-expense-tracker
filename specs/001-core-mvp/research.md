# Research: Core MVP

**Branch**: `001-core-mvp` | **Date**: 2026-03-15

## Overview

No NEEDS CLARIFICATION items were identified in the Technical Context.
The tech stack is fully defined in the project documentation. This
research document consolidates key technical decisions and best
practices for the established stack.

## Decisions

### 1. Authentication Strategy

**Decision**: Better Auth 1.4.18 with Drizzle adapter, email/password
+ Google OAuth, account linking enabled for trusted providers.

**Rationale**: Better Auth is already configured in the project with
database tables (user, session, account, verification) managed by the
library. It provides session-based auth with CSRF protection
out-of-the-box. Account linking allows users who register with email
to later connect Google and vice versa.

**Alternatives considered**:
- NextAuth/Auth.js: More popular but Better Auth is already integrated
  and configured in the project.
- Custom JWT auth: Prohibited by constitution (Security by Default
  principle requires Better Auth).

### 2. Database & ORM Pattern

**Decision**: Drizzle ORM 0.45.1 with schema-first approach. All
tables defined in `lib/schema.ts`. Migrations via `drizzle-kit
generate` and applied via `drizzle-kit push`.

**Rationale**: Drizzle provides full type inference from schema to
query results, eliminating manual type definitions for database
entities. The schema-first approach ensures the database is the
source of truth. Neon Serverless driver provides connection pooling
suitable for serverless environments.

**Alternatives considered**:
- Prisma: Heavier runtime, less control over queries. Drizzle is
  already configured.
- Raw SQL: Prohibited by constitution (Type Safety principle).

### 3. API Layer Pattern

**Decision**: REST API under `/api/v1/` using Next.js App Router
route handlers. `withAuth()` middleware for session validation.
`withAuthAndValidation()` for routes needing Zod body validation.
Typed API client in `lib/api-client.ts` for frontend consumption.

**Rationale**: Route handlers co-locate API logic with the Next.js
app. The middleware pattern centralizes auth and validation, reducing
boilerplate. The typed client provides autocompletion and type safety
for frontend API calls.

**Alternatives considered**:
- tRPC: Out of scope per constitution (API Pattern constraint).
- Server Actions: Could be used for mutations but REST provides a
  clearer contract boundary and is already documented in
  API_SPECIFICATION.md.

### 4. UI Component Strategy

**Decision**: shadcn/ui 3.8.4 as component foundation (Radix UI
primitives + Tailwind CSS). CVA for variant-based styling. `cn()`
utility (clsx + tailwind-merge) for conditional classes.

**Rationale**: shadcn/ui components are copied into the project
(not imported from node_modules), allowing full customization.
Radix UI provides accessible primitives (focus trapping, ARIA
attributes, keyboard navigation). This pattern is already
established in the project.

**Alternatives considered**:
- Material UI, Chakra UI: Prohibited by constitution (Components
  constraint requires shadcn/ui).
- Headless UI: Radix UI (via shadcn/ui) already serves this role.

### 5. Charting Library

**Decision**: Recharts 3.7.0 for data visualization (donut charts,
bar charts on insights page).

**Rationale**: Already installed in the project. Recharts is
React-native, supports responsive containers, and provides the chart
types needed (PieChart for donut, BarChart for category spending).
Lazy loading via `next/dynamic` to avoid impacting initial bundle.

**Alternatives considered**:
- Chart.js / react-chartjs-2: Would add a new dependency; Recharts
  is already present.
- D3 directly: Over-engineered for the chart types needed.

### 6. Recurring Transaction Processing

**Decision**: Client-triggered check on app load. When the user
visits the app, the system checks for recurring transactions with
`nextDueDate <= today` and `isActive = true`, generates the
corresponding transactions, and advances `nextDueDate`.

**Rationale**: Avoids the need for a cron job or background worker
infrastructure in v1. The trade-off is that transactions are only
generated when the user opens the app, but for a personal finance
tool this is acceptable — the user sees their recurring items
reflected as soon as they check.

**Alternatives considered**:
- Server-side cron (Vercel Cron): Adds infrastructure complexity;
  deferred to post-MVP.
- Database triggers: Non-portable and harder to test.

### 7. Infinite Scroll Implementation

**Decision**: Offset-based pagination with `limit` and `offset`
query parameters on `GET /api/v1/transactions`. Frontend uses
Intersection Observer to trigger loading the next page when the user
scrolls near the bottom.

**Rationale**: Offset pagination is simple to implement and
sufficient for the expected data volume (personal finance, hundreds
to low thousands of transactions). Cursor-based pagination would be
needed at higher scale but adds complexity.

**Alternatives considered**:
- Cursor-based pagination: Deferred to post-MVP unless performance
  issues arise.
- Load-all: Not viable for users with many transactions.

### 8. Search Implementation

**Decision**: Server-side search via SQL `ILIKE` on transaction
description and category name. Search query passed as a query
parameter to the transactions list endpoint.

**Rationale**: Simple and effective for the expected data volume.
Full-text search (tsvector) or external search services are
unnecessary for personal transaction data.

**Alternatives considered**:
- Client-side filtering: Won't work with paginated data.
- PostgreSQL full-text search: Over-engineered for v1 scale.
