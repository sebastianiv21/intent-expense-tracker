# Implementation Plan: Redesign Transaction Entry Sheet UI

**Branch**: `002-transaction-sheet-redesign` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-transaction-sheet-redesign/spec.md`

## Summary

Redesign `components/transaction-sheet.tsx` from a two-step flow (main form → separate category picker step) into a single-step bottom sheet matching the reference design. The new layout presents all fields inline: a large amount input, Expense/Income toggle, intent bucket selector (Needs/Wants/Future with icons), a horizontally scrollable category pill row scoped to the active bucket, a date picker, and a notes field. No schema changes or new dependencies are required — all needed primitives already exist in the stack.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16 (App Router) / React 19  
**Primary Dependencies**: shadcn/ui (Radix UI), Tailwind CSS 4, date-fns 4, lucide-react ^0.577.0, Zod 4, Drizzle ORM  
**Storage**: PostgreSQL via Neon Serverless — no schema changes required  
**Testing**: `pnpm lint` + `pnpm build` (no unit test framework in project)  
**Target Platform**: Mobile-first web, 375px base viewport  
**Project Type**: Web application — Next.js App Router  
**Performance Goals**: Full transaction entry completable in under 30 seconds (SC-001)  
**Constraints**: 44px minimum touch targets, bottom sheet modal pattern, no spinner (skeleton only), Tailwind CSS 4 styling only, pnpm exclusively  
**Scale/Scope**: Single-user personal finance app; category list supports 10+ items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Mobile-First Design | PASS | Bottom sheet pattern; 44px touch targets required on bucket buttons and category pills; animations use `transform`/`opacity`; skeleton already in place |
| II. Type Safety & Validation | PASS | TypeScript strict enabled; existing Zod schemas in `lib/validations/transactions.ts` unchanged; types inferred from Drizzle schema |
| III. Security by Default | PASS | No new Server Actions; existing `createTransaction` / `updateTransaction` already call `getAuthenticatedUser()` and scope by `userId` |
| IV. Accessibility | PASS | Bucket buttons and category pills need `aria-label` and `aria-pressed`; focus managed by Radix Sheet primitive; error states use `role="alert"` |
| V. Simplicity & Intentionality | PASS | No new dependencies; pure component refactor of one file; no new architectural patterns introduced |

**No violations. Proceeding.**

## Project Structure

### Documentation (this feature)

```text
specs/002-transaction-sheet-redesign/
├── plan.md              ✅ this file
├── research.md          ✅ Phase 0 output
├── data-model.md        ✅ Phase 1 output
├── quickstart.md        ✅ Phase 1 output
├── contracts/           ✅ Phase 1 output
│   └── transaction-sheet-component.md
└── tasks.md             (Phase 2 — /speckit.tasks command)
```

### Source Code (repository root)

```text
web/
└── components/
    └── transaction-sheet.tsx     ← sole file modified
```

**Structure Decision**: This is a pure UI component refactor. Only `components/transaction-sheet.tsx` changes. All supporting infrastructure (Server Actions, Zod schemas, Drizzle schema, types, context) is reused without modification. No new files are created in `components/` or `lib/`.
