# Implementation Plan: Categories Page Redesign

**Branch**: `008-categories-page-redesign` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/008-categories-page-redesign/spec.md`

## Summary

Redesign `web/components/categories-page.tsx` and `web/components/skeletons/categories-skeleton.tsx` to improve visual hierarchy, communicate bucket identity through color, and replace the disruptive `window.confirm` delete pattern with an inline confirmation flow. No schema changes, server actions, validation schemas, or routing changes are required — this is a pure UI component redesign within the established design system.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)  
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, shadcn/ui (Radix UI), Lucide React  
**Storage**: N/A — no data model changes  
**Testing**: `pnpm lint`, `pnpm build`  
**Target Platform**: Mobile-first web (375px base), progressively enhanced for desktop  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: No new bundle weight; no new dependencies introduced  
**Constraints**: No new libraries; use existing design tokens from `globals.css`; maintain all existing prop interfaces and server action integrations unchanged  
**Scale/Scope**: Two component files; existing `categories-page.tsx` (~260 lines) + `categories-skeleton.tsx` (~20 lines)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Mobile-First | 44×44px touch targets on all interactive elements | PASS | FR-014 mandated; existing `min-h-[44px]` pattern preserved |
| I. Mobile-First | Skeleton screens for loading states — no spinners | PASS | FR-013 updates `CategoriesSkeleton` to include pill placeholders |
| I. Mobile-First | Animations via `transform`/`opacity`; respect `prefers-reduced-motion` | PASS | Already enforced by `globals.css`; no new animations beyond existing patterns |
| II. Type Safety | No new Server Actions or Zod schemas | PASS | UI-only; existing actions and types unchanged |
| III. Security | No server-side changes | PASS | Not applicable to this feature |
| IV. Accessibility | WCAG 2.1 AA; icon-only buttons need `aria-label`; focus managed on sheet/confirmation | PASS | FR-015 mandates aria-labels; focus management required on inline confirmation reveal; errors use `role="alert"` |
| V. Simplicity | No new dependencies; use existing Tailwind + `cn()` + shadcn/ui patterns | PASS | All visual changes use existing design tokens and utility classes |

**No violations. No complexity tracking required.**

## Project Structure

### Documentation (this feature)

```text
specs/008-categories-page-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (UI state model)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (affected files only)

```text
web/
├── components/
│   ├── categories-page.tsx          # PRIMARY — full redesign
│   └── skeletons/
│       └── categories-skeleton.tsx  # SECONDARY — add pill skeletons
└── app/
    └── (app)/
        └── categories/
            ├── page.tsx             # NO CHANGE
            └── loading.tsx          # NO CHANGE
```

**Structure Decision**: Single web application. All changes are confined to two component files. No new files are created in `components/` — the redesign is a direct replacement of the existing component implementations.
