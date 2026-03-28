# Implementation Plan: Financial Profile Sheet Redesign

**Branch**: `007-financial-profile-sheet-redesign` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/007-financial-profile-sheet-redesign/spec.md`

## Summary

Redesign `web/components/financial-profile-sheet.tsx` to add a segmented allocation bar, custom-styled bucket sliders, per-bucket dollar amount chips, an annual income preview, and improved validation feedback — all within the existing shadcn/ui `Sheet` wrapper with zero new dependencies.

## Technical Context

**Language/Version**: TypeScript 5 / React 19  
**Primary Dependencies**: Next.js 16 (App Router), Tailwind CSS 4, shadcn/ui (Radix UI), `tw-animate-css`, `lucide-react`  
**Storage**: N/A — no schema changes; component is client-side state only  
**Testing**: `pnpm lint` + `pnpm build` (no unit test framework configured)  
**Target Platform**: Mobile web (375px base), progressive enhancement to desktop  
**Project Type**: Web application — Next.js client component  
**Performance Goals**: All visual updates (bar segments, chips) within the same paint frame as slider drag events; CSS transitions ≤ 200ms  
**Constraints**: Touch targets ≥ 44×44px; `prefers-reduced-motion` respected via existing `@media` rule in `globals.css`; no new npm packages; Tailwind CSS 4 only (no CSS modules, no CSS-in-JS)  
**Scale/Scope**: Single component file (`financial-profile-sheet.tsx`); no route, API, or schema changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Mobile-First | 44×44px touch targets; `transform`/`opacity` for animations; `prefers-reduced-motion` support | **PASS (EXCEPTION)** | Sliders remain native `<input type="range">` (inherently touch-friendly); touch targets met via `min-h-[44px]` wrapper; `@media (prefers-reduced-motion)` rule in `globals.css` collapses all transitions. **Exception**: allocation bar uses CSS `width` transitions (not `transform`/`opacity`) — see Complexity Tracking table. |
| II. Type Safety | No new runtime validation needed (no data persisted); existing Zod schema unchanged | **PASS** | No new server action inputs; component is display-only additions |
| III. Security | No new data access paths; existing `updateFinancialProfile` action unchanged | **PASS** | N/A for UI-only changes |
| IV. Accessibility | New visual elements (allocation bar, chips) must not break ARIA; custom slider styling must preserve native keyboard behavior | **PASS** | Native `<input type="range">` styled via CSS only — keyboard/ARIA untouched; allocation bar gets `aria-label`; chips are `aria-hidden` (amounts are readable in text) |
| V. Simplicity | No new libraries; reuse existing patterns (`BUCKET_DEFINITIONS`, `formatCurrency`, segmented bar pattern from `profile-page.tsx`) | **PASS** | All patterns already exist in codebase; `Progress` component not used (multi-segment bar needs plain `div` approach same as profile page) |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| CSS `width` transition on allocation bar segments (violates §I `transform`/`opacity` MUST) | The bar's visual meaning depends on each segment's proportional width. Animating width directly is the only way to communicate the change intuitively. | `transform: scaleX()` requires `transform-origin: left` per segment inside a flex container — the scaling origin shifts when adjacent segments resize, producing incorrect visual artefacts. `opacity` alone would not communicate proportional change. |

## Project Structure

### Documentation (this feature)

```text
specs/007-financial-profile-sheet-redesign/
├── plan.md              ✅ This file
├── research.md          ✅ Phase 0 output
├── data-model.md        ✅ Phase 1 output
├── quickstart.md        ✅ Phase 1 output
├── checklists/
│   └── requirements.md  ✅ Created by /speckit.clarify
└── tasks.md             🔜 Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
web/
├── components/
│   └── financial-profile-sheet.tsx   ← sole file modified
└── app/
    └── globals.css                   ← read-only reference (no changes needed)
```

**Structure Decision**: Single-file change. All new UI logic (allocation bar, chip, annual preview, custom slider CSS) is co-located inside `financial-profile-sheet.tsx`. No new component files are needed because all additions are tightly coupled to this sheet's local state and are not reused elsewhere.
