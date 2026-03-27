# Implementation Plan: Dashboard Visual Redesign

**Branch**: `003-dashboard-redesign` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-dashboard-redesign/spec.md`

## Summary

Redesign the dashboard page (`web/app/(app)/page.tsx`) to establish a clear visual hierarchy: a large balance hero with inline quick stats, a 3-column grid bucket section replacing the horizontal-scroll layout, CSS hover transitions on interactive items, and a 3-level typographic scale. No data model or server-side changes. No new dependencies — all tooling (lucide-react icons, Tailwind CSS 4 utilities, existing design tokens) is already installed.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)  
**Primary Dependencies**: Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui (Radix UI), lucide-react 0.577, tw-animate-css 1.4, Plus Jakarta Sans  
**Storage**: N/A — read-only visual redesign, no schema changes  
**Testing**: `pnpm lint` (ESLint 9 + eslint-config-next), `pnpm build` (type-check + build verification)  
**Target Platform**: Web — mobile-first (375px base), progressive enhancement to desktop  
**Project Type**: Web application (Next.js App Router, Server Components)  
**Performance Goals**: No new client bundles; page remains a Server Component. CSS transitions ≤ 150ms.  
**Constraints**: No new npm packages; no new routes or Server Actions; no changes to `lib/queries/` or `lib/actions/`; shadcn/ui primitives only  
**Scale/Scope**: Single page file + one shared component (`transaction-item.tsx`) + one optional extracted component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | **PASS** | Layout uses `grid-cols-1 sm:grid-cols-3`; 44px touch targets preserved on existing buttons; hover transitions are CSS-only and don't require touch targets |
| II. Type Safety & Validation | **PASS** | No new Server Actions or data mutations; all types inferred from existing `BucketSummary` shape |
| III. Security by Default | **PASS** | No changes to queries or actions; `getAuthenticatedUser()` call untouched |
| IV. Accessibility | **PASS** | Bucket state communicated via color + icon (WCAG 1.4.1); existing Radix primitives (shadcn Progress) provide a11y attributes; `prefers-reduced-motion` respected via Tailwind's `motion-safe:` prefix on all hover transitions (`motion-safe:transition-colors motion-safe:duration-150`) — transition is suppressed when the OS-level preference is set |
| V. Simplicity & Intentionality | **PASS** | No new dependencies; bucket grid is a layout class change; all patterns follow existing shadcn/ui + `cn()` conventions |

No gate violations. No Complexity Tracking entry required.

## Project Structure

### Documentation (this feature)

```text
specs/003-dashboard-redesign/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ui-contracts.md  ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
web/
├── app/
│   └── (app)/
│       └── page.tsx                    # Primary redesign target
└── components/
    ├── transaction-item.tsx            # Add hover state classes
    └── bucket-card.tsx                 # NEW: extracted bucket card component
```

**Structure Decision**: Single web application. The dashboard page is a Server Component and remains so. `BucketCard` is extracted as a new Server Component (pure presentational, no client state needed) to keep `page.tsx` clean. `TransactionItem` already exists as a client component and receives hover classes. Recurring items in `page.tsx` get CSS-only hover via Tailwind — no client extraction needed.
