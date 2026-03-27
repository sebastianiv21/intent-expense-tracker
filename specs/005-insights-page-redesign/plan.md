# Implementation Plan: Insights Page Visual Redesign

**Branch**: `005-insights-page-redesign` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-insights-page-redesign/spec.md`

## Summary

Redesign the Insights page with a refined/minimal aesthetic featuring distinctive typography, restrained asymmetric layout, and mobile-first progressive enhancement. The page displays 50/30/20 allocation compliance, bucket comparisons, spending by category, and financial summary metrics using existing Recharts integration and data query interfaces.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 16 with App Router
**Primary Dependencies**: Next.js 16, React 19, Recharts 3.8, Tailwind CSS 4, shadcn/ui (Radix primitives), Lucide React icons, date-fns
**Storage**: PostgreSQL via Neon Serverless with Drizzle ORM (existing - no schema changes)
**Testing**: ESLint, TypeScript strict mode, Next.js build verification
**Target Platform**: Web (mobile-first responsive, progressive enhancement for desktop)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Chart interactions respond within 100ms, page compliance status identifiable within 3 seconds, CLS < 0.1
**Constraints**: No backend changes, maintain existing data query interfaces, preserve Recharts, client-side rendering for charts
**Scale/Scope**: Single page redesign affecting 2 component files (insights-page.tsx, insights-skeleton.tsx)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Spec explicitly requires mobile-first progressive enhancement (FR-012), 44px touch targets, skeleton loading states |
| II. Type Safety & Validation | ✅ PASS | No new Server Actions or queries; using existing typed interfaces from `lib/queries/insights.ts` |
| III. Security by Default | ✅ PASS | No changes to auth or data access; existing queries already call `getAuthenticatedUser()` |
| IV. Accessibility | ✅ PASS | WCAG 2.1 AA compliance required, buckets must be distinguishable without color alone (SC-007) |
| V. Simplicity & Intentionality | ✅ PASS | No new dependencies, using existing Recharts and shadcn/ui patterns |

**Technology Constraints Compliance**:
- Framework: Next.js 16 App Router ✅
- Styling: Tailwind CSS 4 with design tokens ✅
- Components: shadcn/ui pattern ✅
- No new dependencies ✅

## Project Structure

### Documentation (this feature)

```text
specs/005-insights-page-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - no new interfaces
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/
├── app/
│   └── (app)/
│       └── insights/
│           ├── page.tsx           # Server component (unchanged)
│           └── loading.tsx        # Loading state (unchanged)
├── components/
│   ├── insights-page.tsx         # Client component (REDESIGN)
│   └── skeletons/
│       └── insights-skeleton.tsx  # Loading skeleton (REDESIGN)
├── lib/
│   ├── queries/
│   │   └── insights.ts            # Data queries (unchanged)
│   ├── finance-utils.ts           # Utility functions (unchanged)
│   └── utils.ts                   # cn() utility (unchanged)
└── types/
    └── index.ts                   # Types (unchanged)
```

**Structure Decision**: Single web application in `web/` directory. This is a pure frontend redesign with no backend, database, or API changes. Only 2 component files require modification.

## Complexity Tracking

> No Constitution violations. Table not needed.
