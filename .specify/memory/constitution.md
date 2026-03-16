<!--
  === Sync Impact Report ===
  Version change: 1.0.0 → 1.1.0 (MINOR)
  Modified principles:
    - II. Type Safety & Validation: updated "API request and response
      payloads" → "Server Action inputs" to reflect new architecture
    - III. Security by Default: replaced REST middleware language with
      Server Actions + query functions auth pattern
  Added sections: None
  Removed sections: None
  Changed constraints:
    - Technology Constraints > API Pattern: REST → Server Actions + RSC
  Changed workflow:
    - Development Workflow: removed API client sync rule, added Server
      Actions and queries convention
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ aligned
    - .specify/templates/spec-template.md ✅ aligned
    - .specify/templates/tasks-template.md ✅ aligned
    - .specify/templates/commands/*.md — N/A (does not exist)
  Follow-up TODOs: None
  ===========================
-->

# Intent Expense Tracker Constitution

## Core Principles

### I. Mobile-First Design

All UI work MUST target mobile viewports (375px base) first and
progressively enhance for larger screens. Every interactive element
MUST meet a minimum touch target of 44x44px. Navigation MUST use
bottom tabs on mobile and sidebar on desktop. Bottom sheets MUST be
the primary modal pattern on mobile instead of centered dialogs.
Skeleton screens MUST be used for loading states — spinners are
prohibited. Animations MUST use `transform`/`opacity` properties
and respect `prefers-reduced-motion`.

**Rationale**: The target audience primarily tracks expenses on mobile
devices. A mobile-first approach ensures the core experience is
optimized for the most common usage context.

### II. Type Safety & Validation

TypeScript strict mode MUST be enabled across the entire codebase.
All Server Action inputs MUST be validated at runtime using Zod
schemas defined in `lib/validations/`. Database queries MUST use
Drizzle ORM's type-safe query builder — raw SQL is prohibited unless
explicitly justified. Shared types MUST be defined in `types/index.ts`
and inferred from Drizzle schemas or Zod schemas where possible to
avoid duplication.

**Rationale**: Runtime validation at mutation boundaries catches
malformed data before it reaches business logic. End-to-end type
inference from database schema to component props eliminates an
entire class of bugs.

### III. Security by Default

Every Server Action in `lib/actions/` and every query function in
`lib/queries/` MUST call `getAuthenticatedUser()` to verify the
session before accessing data. All database queries MUST scope data
by `userId` to prevent cross-user data access. Sensitive values
(database URLs, OAuth secrets, session tokens) MUST NOT appear in
client-side code, logs, or version control. Environment variables
containing secrets MUST NOT use the `NEXT_PUBLIC_` prefix. CSRF
protection MUST remain enabled via Better Auth configuration.

**Rationale**: A personal finance application handles sensitive
financial data. Security failures erode user trust and may have
legal implications.

### IV. Accessibility

All UI components MUST meet WCAG 2.1 AA compliance. Text elements
MUST maintain a minimum 4.5:1 contrast ratio against their
background. Interactive components MUST use appropriate ARIA
attributes (provided by Radix UI primitives via shadcn/ui). Focus
MUST be managed correctly when opening and closing modals and bottom
sheets. Form inputs MUST have associated labels. Error states MUST
be announced to screen readers.

**Rationale**: Accessibility is a baseline quality requirement, not
an optional enhancement. Radix UI primitives handle much of this
by default, but custom components MUST be held to the same standard.

### V. Simplicity & Intentionality

New dependencies MUST be justified — prefer using existing stack
capabilities before adding libraries. Features MUST align with the
50/30/20 budgeting model; scope creep beyond this core concept
MUST be deferred to future versions. Components MUST follow the
established shadcn/ui + CVA + `cn()` pattern. New architectural
patterns (state management libraries, data fetching layers) MUST
NOT be introduced without documented justification.

**Rationale**: The product philosophy is mindfulness and calm. The
codebase MUST reflect this by staying focused, avoiding unnecessary
complexity, and using the YAGNI principle.

## Technology Constraints

- **Framework**: Next.js 16 with App Router — Pages Router is
  prohibited
- **Runtime**: Node.js 24
- **Styling**: Tailwind CSS 4 with design tokens in `globals.css` —
  CSS modules and CSS-in-JS libraries are prohibited
- **Components**: shadcn/ui (Radix UI + Tailwind) as the component
  foundation — alternative component libraries are prohibited unless
  shadcn/ui lacks the needed primitive
- **Database**: PostgreSQL via Neon Serverless with Drizzle ORM —
  schema changes MUST go through `drizzle-kit generate` migrations
- **Authentication**: Better Auth with Drizzle adapter — custom auth
  implementations are prohibited
- **Validation**: Zod 4 for all runtime schema validation
- **Package Manager**: pnpm exclusively — npm and yarn are prohibited
- **Data Access Pattern**: Server Actions for mutations + Server
  Components with direct Drizzle queries for reads. No REST API
  layer — the only API route is `/api/auth/*` for Better Auth.
  GraphQL and tRPC are out of scope.

## Development Workflow

- **Schema-first**: Database schema changes MUST be defined in
  `lib/schema.ts` first, then migrated via `pnpm db:generate` and
  `pnpm db:push`
- **Linting**: `pnpm lint` MUST pass before any code is committed
- **Build verification**: `pnpm build` MUST succeed before merging
  to `main`
- **Server Actions**: Mutations MUST be implemented as Server Actions
  in `lib/actions/`. Each action MUST validate input with Zod and
  check auth via `getAuthenticatedUser()`
- **Query functions**: Data fetching MUST be implemented as async
  functions in `lib/queries/` and called from Server Components.
  Each query MUST check auth and scope by userId
- **Validation schemas**: Zod schemas MUST be defined in
  `lib/validations/` and shared between actions and client forms
- **Component conventions**: New UI components MUST be placed in
  `components/` (shared) or colocated with their route. shadcn/ui
  primitives go in `components/ui/`
- **Route organization**: Authenticated routes go in `app/(app)/`,
  auth-related routes go in `app/(auth)/`
- **Commit discipline**: Each commit SHOULD represent a single logical
  change. Commit messages MUST follow the conventional commits format
  (e.g., `feat:`, `fix:`, `docs:`, `refactor:`)

## Governance

This constitution is the authoritative source of project principles
and constraints. It supersedes ad-hoc decisions and informal
conventions. All code reviews MUST verify compliance with these
principles.

**Amendment procedure**: Any principle change MUST be documented with
rationale, reflected in this file, and the version incremented per
semantic versioning rules:
- **MAJOR**: Principle removal, redefinition, or backward-incompatible
  governance change
- **MINOR**: New principle or section added, or existing guidance
  materially expanded
- **PATCH**: Wording clarifications, typo fixes, non-semantic
  refinements

**Compliance review**: When creating implementation plans, the
"Constitution Check" section in the plan template MUST reference
applicable principles from this document as gates.

**Version**: 1.1.0 | **Ratified**: 2026-03-15 | **Last Amended**: 2026-03-16
