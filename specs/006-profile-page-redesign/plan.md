# Implementation Plan: Profile Page Redesign

**Branch**: `006-profile-page-redesign` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/006-profile-page-redesign/spec.md`

## Summary

Redesign `web/components/profile-page.tsx` — a client-side React component — to align it visually and structurally with the rest of the Intent app. The redesign adds a `PageHeader`, formats currency values, replaces raw percentage lists with colored `Progress` bars, improves navigation rows with correct icons, groups the logout action with visual separation, and adds staggered fade-in animations on mount. No schema, query, or Server Action changes are required. All changes are confined to a single component file.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2.3, Next.js 16.1.6  
**Primary Dependencies**: shadcn/ui (Radix UI), Tailwind CSS 4, tw-animate-css v1.4.0, lucide-react v0.577.0, date-fns v4, class-variance-authority, clsx  
**Storage**: N/A — no schema changes  
**Testing**: `pnpm lint` (ESLint), `pnpm build` (TypeScript + Next.js build check)  
**Target Platform**: Web, mobile-first (375px base), App Router, authenticated route  
**Performance Goals**: Animations use only `opacity`/`transform` (GPU-composited); no layout shift during staggered reveal  
**Constraints**: No new npm dependencies (CON-001); use existing `Progress`, `getBucketColor`, `formatCurrency`, `BUCKET_DEFINITIONS`, `PageHeader` utilities  
**Scale/Scope**: 1 component file modified (`web/components/profile-page.tsx`); route file (`web/app/(app)/profile/page.tsx`) unchanged

## Constitution Check

*GATE: Must pass before implementation. Re-checked post-design below.*

### Principle I — Mobile-First Design

| Check | Status | Notes |
|-------|--------|-------|
| 375px base layout | ✅ PASS | Stacked single-column layout, no horizontal dependencies |
| 44×44px touch targets | ✅ PASS | Navigation rows use `min-h-[44px]`; buttons retain default shadcn/ui sizing |
| Bottom sheets over dialogs | ✅ PASS | Logout confirmation upgraded from `<Dialog>` to `<Sheet side="bottom">` in this redesign. FinancialProfileSheet already uses bottom sheet. All modal patterns now compliant. |
| Skeleton loading states | ✅ PASS | Route-level `loading.tsx` handles skeleton; out of scope for this redesign |
| Animations: transform/opacity only | ✅ PASS | `tw-animate-css` `animate-in fade-in` animates only opacity/transform |
| Animations: prefers-reduced-motion | ✅ PASS | `motion-safe:` variant on all animation classes + `globals.css` media query fallback |

### Principle II — Type Safety

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript strict | ✅ PASS | No new types introduced; existing `FinancialProfile` and user prop types used |
| No raw SQL | ✅ PASS | No database access in this component |

### Principle III — Security

| Check | Status | Notes |
|-------|--------|-------|
| Auth check | ✅ PASS | Route page.tsx already guards with `auth.api.getSession`; component is downstream |
| No secrets in client code | ✅ PASS | Component renders only display data passed as props |

### Principle IV — Accessibility

| Check | Status | Notes |
|-------|--------|-------|
| WCAG 2.1 AA | ✅ PASS | Radix UI primitives handle ARIA; navigation rows get explicit `aria-label` |
| 4.5:1 contrast | ✅ PASS | Design tokens in globals.css are validated; bucket colors used as decorative/non-text only |
| Focus management | ✅ PASS | FinancialProfileSheet and logout confirmation Sheet (both Radix UI) handle focus trap/restore |

### Principle V — Simplicity

| Check | Status | Notes |
|-------|--------|-------|
| No new dependencies | ✅ PASS | All utilities from existing stack |
| shadcn/ui + CVA + cn() pattern | ✅ PASS | No custom component system introduced |
| No new arch patterns | ✅ PASS | Pure presentational component change |

**Gate result: PASS** (all principles met; logout confirmation upgraded to bottom sheet to resolve prior Dialog violation)

## Project Structure

### Documentation (this feature)

```text
specs/006-profile-page-redesign/
├── plan.md              ✅ this file
├── research.md          ✅ Phase 0 output
├── data-model.md        ✅ Phase 1 output
├── spec.md              ✅ feature specification
├── checklists/
│   └── requirements.md  ✅ quality checklist
└── tasks.md             ⏳ Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
web/
├── components/
│   └── profile-page.tsx        ← PRIMARY CHANGE (full rewrite of component body)
└── app/
    └── (app)/
        └── profile/
            └── page.tsx        ← NO CHANGE NEEDED (already correct)
```

**Structure Decision**: Single project, frontend-only. All changes are confined to one component file in `web/components/`. No new files are added to the source tree.

## Phase 0 Research Summary

See [research.md](./research.md) for full findings. Key decisions:

| Unknown | Resolution |
|---------|-----------|
| Staggered animation without new deps | `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 fill-mode-both` + `motion-safe:delay-100/200/300` from tw-animate-css |
| Allocation bars component | Existing `Progress` (`@radix-ui/react-progress` wrapper) with `indicatorStyle={{ backgroundColor: getBucketColor(bucket) }}` |
| Bucket colors | Use `getBucketColor()` from `lib/finance-utils.ts` — consistent with BucketCard and InsightsPage |
| Insights icon | `TrendingUp` from lucide-react (more semantically appropriate than `BarChart2` for personal finance) |
| Identity visual distinction | Larger avatar (h-16 w-16) + `ring-2 ring-primary/30` using existing Tailwind ring utilities |
| Navigation row pattern | Full-width rows with `min-h-[44px]`, leading icon, label, trailing `ChevronRight` |

## Phase 1 Design

### Component Architecture

`ProfilePage` remains a single client component (`"use client"`). No sub-components are extracted — the file is small enough that splitting would add indirection without benefit.

**Import additions** (all from existing installed packages):

```ts
// Add to existing imports:
import { TrendingUp, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, getBucketColor, BUCKET_DEFINITIONS, BUCKET_ORDER } from "@/lib/finance-utils";
```

**Import removals**:
```ts
// Remove (Settings icon was used for Insights link — replaced by TrendingUp):
// Settings is still needed for nothing after this change; remove it
// LogOut stays; Tag stays
```

### Page Layout Structure (section order)

```
<div className="space-y-6">
  [0] <PageHeader title="Profile" description="Account & preferences" />        — immediate
  [1] <Card> identity section (avatar, name, email, member since) </Card>       — delay-100
  [2] <Card> financial profile (income + bucket bars + edit) </Card>            — delay-200
  [3] <Card> navigation rows (Categories, Insights) </Card>                    — delay-200
  [4] <div> separator + logout button </div>                                    — delay-300
  [5] <p> app version </p>
</div>
```

Sections [1]–[4] are each wrapped in a `div` with the stagger animation classes.

### Stagger Animation Wrapper Pattern

```tsx
const STAGGER = [
  "motion-safe:delay-0",
  "motion-safe:delay-100",
  "motion-safe:delay-200",
  "motion-safe:delay-300",
] as const;

function AnimatedSection({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className={cn(
      "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 fill-mode-both",
      STAGGER[index]
    )}>
      {children}
    </div>
  );
}
```

> Note: This is an internal helper defined at the top of the file (not exported). Avoids inline class repetition.

### Financial Profile Section

```tsx
{BUCKET_ORDER.map((bucket) => {
  const { label } = BUCKET_DEFINITIONS[bucket];
  const percentage = Number(profile[`${bucket}Percentage` as keyof FinancialProfile]);
  const color = getBucketColor(bucket);
  return (
    <div key={bucket} className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground tabular-nums">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className="h-1.5"
        style={{ backgroundColor: `${color}22` }}
        indicatorStyle={{ backgroundColor: color }}
      />
    </div>
  );
})}
```

### Navigation Row Pattern

```tsx
function NavRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Go to ${label}`}
      className="flex w-full items-center justify-between min-h-[44px] px-1 py-2 rounded-lg text-sm text-foreground hover:bg-muted/50 motion-safe:transition-colors motion-safe:duration-150"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
```

### Logout Section (unlabeled, visually separated)

```tsx
<div className="pt-4 border-t border-border">
  <Button
    variant="ghost"
    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px]"
    onClick={() => setLogoutOpen(true)}
  >
    <LogOut className="h-4 w-4" aria-hidden="true" />
    Log out
  </Button>
</div>

{/* Logout confirmation — bottom sheet (Constitution Principle I compliant) */}
<Sheet open={logoutOpen} onOpenChange={setLogoutOpen}>
  <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
    <SheetHeader className="text-left">
      <SheetTitle>Log out?</SheetTitle>
      <SheetDescription>
        You will need to sign in again to access your data.
      </SheetDescription>
    </SheetHeader>
    <div className="flex gap-3 mt-4">
      <Button variant="outline" className="flex-1" onClick={() => setLogoutOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" className="flex-1" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

The full-width destructive solid button is replaced with a ghost variant styled in destructive colors. The confirmation is upgraded from a centered `<Dialog>` to a `<Sheet side="bottom">` — consistent with `FinancialProfileSheet` and Constitution Principle I. The `border-t` provides visual separation per spec clarification Q2 (Option B).

**Import change**: Replace `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` imports with `Sheet`, `SheetContent`, `SheetDescription`, `SheetHeader`, `SheetTitle` (already available via shadcn/ui). Remove `logoutOpen`/`setLogoutOpen` state — retain as-is (Sheet uses the same boolean state pattern).

## Post-Design Constitution Re-check

All gates PASS. The AnimatedSection helper and NavRow helper are defined in the same file as the component — no new files, no new dependencies, no new patterns. The `fill-mode-both` usage is consistent with `tw-animate-css`'s intended API. The logout confirmation Sheet resolves the pre-existing Dialog violation — all modal patterns are now bottom-sheet based on mobile.

## Artifacts Generated

| Artifact | Path | Status |
|----------|------|--------|
| Spec | `specs/006-profile-page-redesign/spec.md` | ✅ |
| Research | `specs/006-profile-page-redesign/research.md` | ✅ |
| Data Model | `specs/006-profile-page-redesign/data-model.md` | ✅ |
| Plan (this file) | `specs/006-profile-page-redesign/plan.md` | ✅ |
| Contracts | N/A — pure UI, no API surface | — |
| Tasks | `specs/006-profile-page-redesign/tasks.md` | ⏳ `/speckit.tasks` |
