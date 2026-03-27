# Research: Dashboard Visual Redesign

**Branch**: `003-dashboard-redesign` | **Date**: 2026-03-26

## R-001: Bucket Section Visualization

**Decision**: Change the bucket container from `flex gap-4 overflow-x-auto pb-2` to `grid grid-cols-1 sm:grid-cols-3 gap-3`. Keep the existing shadcn `Progress` component and card layout per bucket.

**Rationale**: The horizontal scroll behavior (`overflow-x-auto` + `min-w-[220px]`) is the sole cause of the "can't see all three simultaneously" problem. A grid layout resolves it without any recharts dependency or client component. `recharts` being available was evaluated — `RadialBarChart` would require `"use client"` and adds client bundle weight for a feature already served by the Progress primitive. The grid approach is a 2-class change.

**Alternatives considered**:
- `RadialBarChart` (recharts): Rejected — requires client boundary, increases bundle, no meaningful UX advantage over Progress bars.
- Horizontal stacked `BarChart` (recharts): Rejected — shows proportional allocation, not per-bucket spending progress; conflates two different data representations.

---

## R-002: Over-Budget State Detection

**Decision**: Derive bucket state from raw `spent` and `target` values, not from `progress` (which is capped at 100 by `calculatePercentage`).

**Rationale**: `BucketSummary` from `getDashboardData()` exposes both `spent` and `target`. The `progress` field is `Math.min(100, Math.round(spent/target*100))`, which loses signal once a bucket exceeds its target. Computing state inline:
- `spent > target` → over-budget
- `spent / target >= 0.8 && spent <= target` → nearing limit
- otherwise → on-track

**Alternatives considered**: Modifying `getDashboardData()` to return an uncapped `rawProgress` field — rejected because the spec prohibits data layer changes.

---

## R-003: Bucket State Icons

**Decision**: Use `lucide-react` icons (already installed at 0.577) for per-state icons.

| State | Threshold | Icon | Color |
|-------|-----------|------|-------|
| On-track | spent < 80% of target | `CheckCircle2` | bucket color (design token) |
| Nearing limit | 80% ≤ spent < 100% of target | `AlertTriangle` | `#f59e0b` (amber — not in current design tokens; use inline style) |
| Over-budget | spent ≥ target | `AlertCircle` | `var(--destructive)` → `text-destructive` class |

**Note**: Amber (`#f59e0b`) is not currently a design token. To remain within constitution constraints (no hardcoded values), consider using `text-yellow-500` (Tailwind 4 built-in) or adding `--warning` to `globals.css`. **Recommendation**: Add `--warning: #f59e0b` to the `:root` block in `globals.css` and the corresponding `@theme inline` mapping as `--color-warning: var(--warning)`. This is a design token addition (not a new dependency) and is the cleanest approach.

**Alternatives considered**: CSS-only color from bucket color darkened — rejected because amber is semantically distinct and matches standard UI conventions.

---

## R-004: Hover States

**Decision**: CSS-only Tailwind hover utilities. No client component extraction for recurring items.

**Rationale**: `hover:bg-muted/50 transition-colors duration-150` compiles to pure CSS pseudo-class selectors — no JavaScript or React state required. Server Components can render elements with Tailwind hover classes. `TransactionItem` already has `"use client"` for delete/edit state; hover classes can be added there too. Recurring items in `page.tsx` receive hover classes directly on their `<div>`.

**Alternatives considered**: Extracting recurring items to a client component — rejected as unnecessary complexity per Constitution Principle V.

---

## R-005: Negative Balance Color

**Decision**: Apply `text-destructive` conditionally using `cn()` in the Server Component.

**Rationale**: `--destructive: #ef4444` is already a design token, mapped to `text-destructive` via `@theme inline`. The `cn()` utility is a pure function (not a hook) and is safe in Server Components. Example: `cn("text-4xl font-bold tracking-tight", balance < 0 && "text-destructive")`.

---

## R-006: Typography Scale

**Decision**: 3-level hierarchy using Plus Jakarta Sans (already loaded).

| Level | Tailwind Classes | Usage |
|-------|-----------------|-------|
| Hero | `text-4xl font-bold tracking-tight` | Monthly balance figure |
| Section heading | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` | "Monthly balance", "50/30/20 harmony", "Recent transactions", "Upcoming recurring" |
| Data label / supporting | `text-xs text-muted-foreground` | Income · Expenses line, bucket spent/target, stat captions |

**Rationale**: The current `text-lg font-semibold` headings are identical across all sections, creating no hierarchy. Dropping section headings to `text-xs uppercase tracking-wider` (label style) creates strong contrast with the `text-4xl` hero without competing. `CardTitle` inside shadcn Cards retains `text-lg` only where contextually appropriate (inside bounded card regions).

---

## R-007: Quick Stats Layout

**Decision**: Inline the three quick stats as a horizontal flex strip within the balance card, replacing the three separate peer-level `Card` components.

**Rationale**: The three stats (daily avg, safe to spend, days remaining) are supporting context for the balance — they belong within the balance card's `CardContent`. A `flex items-center divide-x divide-border` layout with each stat in a `px-4 first:pl-0 last:pr-0` container creates a clean inline strip on desktop that stacks naturally on mobile.

**Alternatives considered**: Keeping as separate cards but reducing card padding — rejected because it does not resolve the visual hierarchy problem; they still read as peer-level sections competing with the balance hero.

---

## R-008: Hover Transition Approach

**Decision**: Use native Tailwind `transition-colors duration-150` — not tw-animate-css.

**Rationale**: `tw-animate-css` provides only entrance/exit keyframe animations (`animate-in`, `fade-in`, `zoom-in`, etc.). It has no CSS `transition` utilities. Tailwind's built-in `transition-colors` handles hover color transitions natively and is the correct tool.
