# Implementation Plan: Dashboard Hero Card and List Pattern Consistency

**Branch**: `013-dashboard-hero-redesign` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-dashboard-hero-redesign/spec.md`

## Summary

Redesign the dashboard page with a visually prominent hero card for monthly balance using the app's primary color theme, and apply consistent list styling (date-grouped transactions, rounded cards with hover states) to the recent transactions and upcoming recurring sections to match the patterns established on the transactions page.

## Technical Context

**Language/Version**: TypeScript 5.x with React 19.2.3
**Primary Dependencies**: Next.js 16.1.6 (App Router), Tailwind CSS 4, shadcn/ui (Radix UI primitives), class-variance-authority (CVA), date-fns 4.1.0
**Storage**: PostgreSQL via Neon Serverless with Drizzle ORM (no schema changes required)
**Testing**: Manual verification via `pnpm build` and `pnpm lint`
**Target Platform**: Responsive web application (mobile-first, 375px base)
**Project Type**: web-app
**Performance Goals**: Standard Next.js RSC performance; hero card renders as part of initial page load
**Constraints**: Mobile-first design with 44x44px touch targets; WCAG 2.1 AA contrast compliance
**Scale/Scope**: Single dashboard page redesign affecting 3 UI sections

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✓ PASS | Hero card and list sections will target 375px viewport first; existing touch targets preserved |
| II. Type Safety & Validation | ✓ PASS | No new Server Actions or inputs; existing data types reused |
| III. Security by Default | ✓ PASS | No new data access; existing auth-scoped queries reused |
| IV. Accessibility | ✓ PASS | Will maintain 4.5:1 contrast ratio on primary color background; existing ARIA patterns preserved |
| V. Simplicity & Intentionality | ✓ PASS | No new dependencies; uses existing shadcn/ui components and Tailwind patterns |

**Re-check after Phase 1**: N/A - no new architectural patterns introduced

## Project Structure

### Documentation (this feature)

```text
specs/013-dashboard-hero-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
web/
├── app/(app)/
│   └── page.tsx                 # Dashboard page (modified)
├── components/
│   ├── hero-balance-card.tsx    # New component (created)
│   ├── transaction-item.tsx     # Existing (reused)
│   ├── transaction-list.tsx     # Existing pattern reference
│   └── ui/card.tsx              # Existing shadcn/ui base
├── lib/
│   └── queries/dashboard.ts     # Existing query (unchanged)
└── app/globals.css              # Design tokens (existing primary color)
```

**Structure Decision**: Single Next.js app with colocated components. New `hero-balance-card.tsx` component created for the hero card. Dashboard page modified to use date-grouped transaction list and consistent recurring item styling.

## Complexity Tracking

No constitution violations to justify. This is a UI-only change with no new dependencies or architectural patterns.
