# Implementation Plan: Budgets Page Redesign

**Branch**: `010-budgets-page-redesign` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-budgets-page-redesign/spec.md`

## Summary

Redesign `web/components/budgets-page.tsx` and `web/components/skeletons/budgets-skeleton.tsx` to match the visual and interaction patterns established in specs 008–009. No schema changes, no new dependencies, no new server actions or queries — this is a pure client component redesign.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 16 App Router, shadcn/ui (Radix UI + Tailwind CSS 4), lucide-react, date-fns
**Storage**: N/A — no schema changes
**Testing**: `pnpm lint`, `pnpm build`
**Target Platform**: Web (mobile-first, 375px base)
**Project Type**: Web application (Next.js)
**Performance Goals**: No new perf requirements — component renders synchronously from server-passed props
**Constraints**: No new npm packages; all UI primitives already installed; Touch targets ≥ 44×44px (≥ 40×40px for dense grids with ≥ 4px gaps per constitution v1.2.0)
**Scale/Scope**: 2 files modified (`budgets-page.tsx`, `budgets-skeleton.tsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Mobile-First | `min-h-[44px]` on all interactive elements; bottom sheet modal pattern; `BudgetsSkeleton` used for loading; no spinners | **PASS** — sheet, buttons, and DropdownMenu trigger all use `min-h-[44px]`; skeleton file updated |
| II. Type Safety | No new Server Actions or queries → no new Zod schemas needed; existing `BudgetWithSpending`, `Category`, `AllocationBucket` types from `types/index.ts` used | **PASS** |
| III. Security | No new queries or actions introduced; `getAuthenticatedUser()` already called in existing queries | **PASS** |
| IV. Accessibility | `DropdownMenuTrigger` must have `aria-label`; inline confirm buttons must have `aria-label`; focus management mirrors categories-page pattern (useRef + useEffect) | **PASS** — apply same ref/focus pattern from categories-page |
| V. Simplicity | No new libraries; follows shadcn/ui + CVA + `cn()` pattern; inline delete pattern directly ported from categories-page | **PASS** |

## Project Structure

### Documentation (this feature)

```text
specs/010-budgets-page-redesign/
├── plan.md              ✅ this file
├── research.md          ✅ Phase 0
├── data-model.md        ✅ Phase 1
├── quickstart.md        ✅ Phase 1
└── tasks.md             ⬜ Phase 2 (/speckit.tasks)
```

### Source Code

```text
web/
└── components/
    ├── budgets-page.tsx              # full redesign
    └── skeletons/
        └── budgets-skeleton.tsx      # update to match new layout
```

No route files, server actions, queries, or schema files are modified.
