# Implementation Plan: Mobile Navigation Access

**Branch**: `012-mobile-nav-access` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-mobile-nav-access/spec.md`

## Summary

Redesign the mobile bottom navigation to provide access to Budgets, Categories, Recurring, Stats, and Profile pages. The bottom bar will contain Home, Activity, Budgets, a central FAB, and a "More" overflow trigger. The overflow menu (bottom sheet) will provide access to Stats, Categories, Recurring, and Profile. This is a pure UI change with no backend or data model modifications.

## Technical Context

**Language/Version**: TypeScript 5.x with React 19
**Primary Dependencies**: Next.js 16 (App Router), shadcn/ui (Radix UI), Tailwind CSS 4, lucide-react icons
**Storage**: N/A (no data changes)
**Testing**: ESLint (pnpm lint), TypeScript build (pnpm build)
**Target Platform**: Mobile-first web application (375px base), responsive to desktop
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Navigation interactions < 100ms, bottom sheet animations use transform/opacity
**Constraints**: 44x44px minimum touch targets, WCAG 2.1 AA compliance, respect prefers-reduced-motion
**Scale/Scope**: Single navigation component modification, one new overflow sheet component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Mobile-First Design | PASS | Feature targets mobile viewport (375px), all interactive elements will meet 44x44px minimum touch targets, bottom sheet pattern matches existing design language |
| II. Type Safety & Validation | PASS | No new data inputs; existing TypeScript strict mode applies |
| III. Security by Default | PASS | No data access changes; navigation is purely client-side UI |
| IV. Accessibility | PASS | Will use Radix UI Sheet primitive, maintain ARIA attributes, manage focus on sheet open/close |
| V. Simplicity & Intentionality | PASS | Uses existing shadcn/ui Sheet component, no new dependencies, follows established patterns |

**Technology Constraints Verified**:
- Next.js 16 App Router ✓
- Tailwind CSS 4 ✓
- shadcn/ui components ✓
- No new dependencies required ✓

## Project Structure

### Documentation (this feature)

```text
specs/012-mobile-nav-access/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (N/A for this feature)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── app/
│   └── (app)/
│       ├── layout.tsx       # Contains AppShell wrapper
│       ├── budgets/page.tsx
│       ├── categories/page.tsx
│       ├── recurring/page.tsx
│       ├── insights/page.tsx
│       └── profile/page.tsx
├── components/
│   ├── app-shell.tsx        # Main layout wrapper
│   ├── bottom-nav.tsx       # MODIFIED: Update nav items, add More trigger
│   ├── side-nav.tsx         # Desktop sidebar (unchanged)
│   ├── overflow-sheet.tsx   # NEW: Bottom sheet for overflow menu
│   └── ui/
│       └── sheet.tsx        # shadcn/ui Sheet primitive (exists)
├── lib/
│   └── utils.ts             # cn() utility (exists)
└── types/
    └── index.ts             # Type definitions (exists)
```

**Structure Decision**: This is a single Next.js web application. All changes are confined to the `components/` directory, specifically `bottom-nav.tsx` (modified) and `overflow-sheet.tsx` (new). No backend, database, or type changes required.

## Phase 0: Research Complete

See [research.md](./research.md) for decisions on:
- Bottom sheet pattern (shadcn/ui Sheet)
- Overflow icon (MoreHorizontal from lucide-react)
- Active state indication
- Sheet interaction behavior
- Bottom navigation layout

## Phase 1: Design Complete

- **data-model.md**: No database changes required (navigation is UI-only)
- **quickstart.md**: Implementation steps and testing guidance
- **contracts/**: N/A - no external interfaces for this UI-only feature

## Complexity Tracking

No Constitution violations. This is a straightforward UI modification using existing patterns and components.
