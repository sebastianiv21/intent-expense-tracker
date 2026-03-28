# Implementation Plan: Category Sheet Redesign

**Branch**: `009-category-sheet-redesign` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-category-sheet-redesign/spec.md`

## Summary

Redesign the create/edit category bottom sheet in `web/components/categories-page.tsx` to match the elevated UI pattern already established in `transaction-sheet.tsx`. The change is purely presentational — no schema migrations, no new server actions, and no new dependencies. The existing `createCategory`, `updateCategory`, and `deleteCategory` server actions are preserved unchanged.

Key UI additions: custom header X button (Radix default suppressed), live preview card, 5-column emoji grid picker (30 curated emojis), icon bucket pills (Home/Needs, Coffee/Wants, PiggyBank/Future), and a full-width gradient footer save button replacing the Cancel+Save pair.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)  
**Primary Dependencies**: Next.js 16 (App Router), shadcn/ui (Radix UI + Tailwind CSS 4), lucide-react  
**Storage**: N/A — no schema changes  
**Testing**: `pnpm lint`, `pnpm build` (tsc --noEmit)  
**Target Platform**: Mobile-first web (375px base), progressive enhancement for desktop  
**Project Type**: Web application (Next.js)  
**Performance Goals**: Preview card updates within one interaction cycle with no perceptible delay  
**Constraints**: No new npm dependencies; all icons must come from lucide-react (already installed); component patterns must follow shadcn/ui + CVA + `cn()` convention  
**Scale/Scope**: Single component file (`web/components/categories-page.tsx`), single feature page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ⚠️ Partial | Sheet uses bottom-sheet pattern ✅. Bucket pills and emoji buttons are `h-10 w-10` (40px) — 4px below the 44px minimum. This is consistent with the existing `transaction-sheet.tsx` close button pattern across the app. Must be resolved or accepted as a tracked exception. |
| II. Type Safety & Validation | ✅ Pass | All Zod schemas and TypeScript types are unchanged. New constants (`BUCKET_PILLS`, `CATEGORY_EMOJIS`) are typed. No runtime validation boundary changes. |
| III. Security by Default | ✅ Pass | Server Actions untouched. `getAuthenticatedUser()` calls preserved. No client-side data exposure. |
| IV. Accessibility | ✅ Pass | Radix Sheet primitives handle focus management. Custom X button has `aria-label="Close"`. Bucket pills have `aria-pressed`. Emoji buttons have `title` attributes. Error states use `role="alert"`. |
| V. Simplicity & Intentionality | ✅ Pass | No new dependencies. Uses existing lucide-react icons, shadcn/ui primitives, and `cn()` utility. No new architectural patterns introduced. |

### Constitution Gate Resolution

**I. Mobile-First — Touch Target Violation**: The close button (`h-10 w-10` = 40×40px) and emoji grid buttons (`h-10 w-10`) fall 4px below the 44px minimum.

**Accepted Exception**: This exact pattern (`h-10 w-10` close button) exists in `transaction-sheet.tsx` and is applied consistently across the app. Enforcing 44px strictly only here would create visual inconsistency. **Resolution**: Track as a project-wide debt item; do not block this feature.

## Complexity Tracking

> No constitution violations that block this feature.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Touch targets 40px (X button, emoji buttons) | Consistent with existing transaction-sheet pattern | Changing to 44px only here breaks visual consistency with other sheets |

## Project Structure

### Documentation (this feature)

```text
specs/009-category-sheet-redesign/
├── plan.md              ✅ this file
├── research.md          ✅ Phase 0 output
├── data-model.md        ✅ Phase 1 output
├── quickstart.md        ✅ Phase 1 output
├── checklists/
│   └── requirements.md  ✅ spec quality checklist
└── tasks.md             (Phase 2 — /speckit.tasks)
```

### Source Code (affected files)

```text
web/
└── components/
    └── categories-page.tsx   # Sole modified file — sheet UI redesign
```

**No new files created. No other files modified.**

**Structure Decision**: Single-component change. The `CategoriesPage` component already lives in `web/components/` as a shared page component. All sheet logic (state, handlers, constants) is colocated within the same file, consistent with how `transaction-sheet.tsx` is structured.
