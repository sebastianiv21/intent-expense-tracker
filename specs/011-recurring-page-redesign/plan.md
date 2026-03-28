# Implementation Plan: Recurring Page Redesign

**Branch**: `011-recurring-page-redesign` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-recurring-page-redesign/spec.md`

## Summary

Redesign the Recurring page to match the modern design patterns established in Budgets and Categories pages. Key changes include: adding a summary card with monthly recurring totals and progress visualization, updating card design with type-colored 3px left borders and larger icon circles, replacing browser confirm dialogs with inline delete confirmation, redesigning the create/edit bottom sheet with modern header, large centered amount input, animated type toggle, and horizontal scrolling category chips.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 24
**Primary Dependencies**: Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, shadcn/ui (Radix UI), Drizzle ORM, Zod 4, date-fns 4
**Storage**: PostgreSQL via Neon Serverless (existing schema - no changes required)
**Testing**: Manual verification via `pnpm lint` and `pnpm build`
**Target Platform**: Mobile-first web application (375px base), progressively enhanced for desktop
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Page load < 1s, interactions match existing pages
**Constraints**: Must follow existing patterns from budgets-page.tsx and categories-page.tsx
**Scale/Scope**: Single page component redesign, no backend changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | All UI elements follow 44px touch targets; dense grid exception applies to emoji picker (40px + 4px gap); bottom sheet pattern used; skeleton loading exists |
| II. Type Safety & Validation | ✅ PASS | Existing Server Actions use Zod validation; no new types required; form uses existing validation schemas |
| III. Security by Default | ✅ PASS | All actions already call `getAuthenticatedUser()`; no new data access patterns |
| IV. Accessibility | ✅ PASS | shadcn/ui primitives provide WCAG 2.1 AA compliance; focus management handled by Radix |
| V. Simplicity & Intentionality | ✅ PASS | No new dependencies; follows existing component patterns; inline delete confirmation matches budgets/categories |

**Technology Constraints Compliance:**
- Next.js 16 App Router ✅
- Tailwind CSS 4 with design tokens ✅
- shadcn/ui components ✅
- Server Actions for mutations ✅ (existing)
- pnpm ✅

**No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/011-recurring-page-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # N/A - no new contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
web/
├── app/(app)/recurring/
│   ├── page.tsx         # Route entry (unchanged)
│   └── loading.tsx      # Loading state (minor update if needed)
├── components/
│   ├── recurring-page.tsx        # MAIN TARGET - complete redesign
│   ├── skeletons/
│   │   └── recurring-skeleton.tsx # May need update to match new design
│   └── ui/                       # Existing shadcn primitives
├── lib/
│   ├── actions/recurring.ts       # Unchanged - existing Server Actions
│   ├── queries/recurring.ts      # May need query for summary totals
│   └── finance-utils.ts          # May add helpers if needed
└── types/index.ts                # Unchanged - existing types sufficient
```

**Structure Decision**: Single web application. This is a frontend-only change to the Recurring page component and potentially the skeleton loader. No backend, API, or database changes required.

## Implementation Approach

### Phase 1: Summary Card (P1)
1. Create computed summary from filtered recurring items
2. Add summary card component with totals and progress bar
3. Style to match budgets page month header

### Phase 2: Card Design (P1)
1. Update card layout with 3px left border accent
2. Add type-colored icon backgrounds (green/red)
3. Increase amount prominence
4. Add overflow menu for Edit/Delete actions

### Phase 3: Delete Flow (P2)
1. Replace `window.confirm` with inline confirmation state
2. Add Check/X button pattern from budgets/categories
3. Manage focus on confirmation state change

### Phase 4: Create/Edit Sheet (P2)
1. Redesign sheet header with large title and close button
2. Implement centered amount input with $ prefix and gradient background
3. Add animated type toggle (Expense/Income) with sliding indicator
4. Convert frequency select to pill chips/segmented control
5. Implement horizontal scrolling category chips filtered by type
6. Add calendar popovers for date selection
7. Update save button to gradient style

### Phase 5: Empty States (P3)
1. Update empty state components with emoji, title, description, action button
2. Differentiate Active vs Paused tab empty states

### Phase 6: Polish & Testing
1. Verify all touch targets meet 44px minimum
2. Test keyboard navigation and focus management
3. Verify loading skeleton matches new design
4. Run `pnpm lint` and `pnpm build`

## Complexity Tracking

> No violations to justify - design follows established patterns.

| Aspect | Approach |
|--------|----------|
| State management | React useState (existing pattern) |
| Data fetching | Server Component with async queries (existing) |
| Mutations | Server Actions (existing) |
| Styling | Tailwind + cn() utility (existing) |
