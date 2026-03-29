# Implementation Plan: Fix UI Consistency and Color Bugs

**Branch**: `014-fix-ui-bugs` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-fix-ui-bugs/spec.md`

## Summary

Fix 4 UI bugs: (1) Chart colors display gray instead of bucket colors, (2) Editing recurring transactions creates new records instead of updating, (3) Wants bucket icon inconsistent (Heart vs Coffee), (4) Upcoming recurring amounts show gray when bucket unavailable. All fixes are minimal code changes to existing components with no new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, Recharts 3.8.0, Lucide React 0.577.0
**Storage**: PostgreSQL (Neon Serverless) with Drizzle ORM 0.45.1
**Testing**: ESLint via `pnpm lint` (no unit test framework)
**Target Platform**: Web application (mobile-first responsive, 375px base)
**Project Type**: web-application
**Performance Goals**: Standard web app performance (no specific targets)
**Constraints**: Mobile-first, 44px touch targets, WCAG 2.1 AA, dark theme
**Scale/Scope**: Personal finance tracker, single-user data scoping

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Bug fixes maintain existing mobile patterns, no layout changes |
| II. Type Safety & Validation | PASS | No new validation needed, fixing existing code paths |
| III. Security by Default | PASS | No changes to auth/security, userId scoping maintained |
| IV. Accessibility | PASS | Color fixes improve accessibility for color-blind users |
| V. Simplicity & Intentionality | PASS | Minimal fixes, no new dependencies, YAGNI respected |

**Gate Result**: All gates PASS. Proceed with Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/014-fix-ui-bugs/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/
├── app/(app)/
│   └── page.tsx                      # Dashboard - upcoming recurring colors fix
├── components/
│   ├── insights-page.tsx             # Chart colors fix, Heart → Coffee icon
│   ├── recurring-page.tsx            # Edit flow fix (already uses Coffee)
│   ├── transaction-sheet.tsx         # Uses Coffee (reference for consistency)
│   ├── categories-page.tsx           # Uses Coffee (reference for consistency)
│   └── budgets-page.tsx              # Uses Coffee (reference for consistency)
├── lib/
│   ├── finance-utils.ts              # Color utility functions
│   └── actions/
│       └── recurring.ts              # updateRecurring action (verify edit flow)
└── types/
    └── index.ts                      # Type definitions
```

**Structure Decision**: Single Next.js application. Bug fixes target existing components in `web/components/` and `web/app/`. No new files needed.

## Complexity Tracking

No constitution violations. All fixes are minimal, localized changes to existing code.
