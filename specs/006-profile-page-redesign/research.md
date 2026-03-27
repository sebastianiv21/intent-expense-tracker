# Research: Profile Page Redesign

**Feature**: 006-profile-page-redesign  
**Date**: 2026-03-27  
**Phase**: 0 — Pre-design research

---

## 1. Staggered Fade-In Animations

### Decision
Use `tw-animate-css` utility classes (`animate-in`, `fade-in`, `delay-*`) combined with Tailwind's `motion-safe:` variant for staggered section reveals on mount.

### Rationale
- `tw-animate-css` v1.4.0 is already installed and provides both the animation utility (`animate-in fade-in`) and named delay tokens (`delay-100`, `delay-200`, `delay-300`) — no new dependencies required.
- Animates only `opacity` and `transform` properties — fully compliant with Constitution Principle I (Mobile-First Design) which mandates these properties for animations.
- The `motion-safe:` Tailwind variant provides class-level reduced-motion protection. The project's `globals.css` also has a `@media (prefers-reduced-motion: reduce)` block as a CSS-level fallback, giving two layers of protection.

### Implementation Pattern

```tsx
// Stagger delay constants
const STAGGER_DELAYS = [
  "",                       // section 0 — immediate
  "motion-safe:delay-100",  // section 1 — 100ms
  "motion-safe:delay-200",  // section 2 — 200ms
  "motion-safe:delay-300",  // section 3 — 300ms
] as const;

// Per section wrapper
<div
  className={cn(
    "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 fill-mode-both",
    STAGGER_DELAYS[index]
  )}
>
  {/* section content */}
</div>
```

**Important**: `fill-mode-both` must NOT be gated on `motion-safe:`. Without it, sections with a delay briefly flash at full opacity before their animation begins (because the element is visible during the delay period). Since `fill-mode-both` itself produces no perceivable motion, applying it unconditionally is correct.

### Alternatives Considered
- **Framer Motion / Motion library** — Not installed; new dependency prohibited by CON-001.
- **Pure `@keyframes` in globals.css + inline `style={{ animationDelay }}`** — Works, but bypasses the existing `tw-animate-css` infrastructure already used project-wide. Less maintainable.
- **Tailwind CSS 4 native `animation-delay-*` utilities** — Tailwind 4 only provides `delay-*` for `transition-delay`, not animation-delay. `tw-animate-css` fills this gap with its own `delay-*` utilities that set both `animation-delay` and `--tw-animation-delay`.

---

## 2. Allocation Bucket Progress Bars

### Decision
Use the existing `Progress` shadcn/ui component (`components/ui/progress.tsx`) with `getBucketColor()` for the indicator color via `indicatorStyle`.

### Rationale
- `@radix-ui/react-progress` is already installed and the shadcn/ui wrapper (`Progress`) already supports custom `indicatorClassName` and `indicatorStyle` props, as demonstrated by `BucketCard` component.
- `getBucketColor()` from `lib/finance-utils.ts` returns the canonical bucket colors (`#8b9a7e`, `#c97a5a`, `#a89562`) consistent with every other component in the app that renders bucket-colored elements (BucketCard, InsightsPage allocation cards).
- No custom CSS or new component required.

### Color Note
`getBucketColor()` draws from `BUCKET_DEFINITIONS` in `finance-utils.ts`. The `wants` color there is `#c97a5a`, while `globals.css` defines `--bucket-wants: #c4714a`. These differ slightly. The codebase convention is to use `getBucketColor()` (used in BucketCard, InsightsPage) rather than CSS variables — follow this convention for consistency.

### Implementation Pattern

```tsx
import { Progress } from "@/components/ui/progress";
import { getBucketColor, BUCKET_DEFINITIONS, BUCKET_ORDER } from "@/lib/finance-utils";

{BUCKET_ORDER.map((bucket) => {
  const { label } = BUCKET_DEFINITIONS[bucket];
  const percentage = Number(profile[`${bucket}Percentage`]);
  const color = getBucketColor(bucket);
  return (
    <div key={bucket} className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color }}>{label}</span>
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

### Alternatives Considered
- **Inline `<div>` with width percentage** — Simpler but loses the Radix UI accessibility (role="progressbar", aria-valuenow etc.) without adding it manually. The existing `Progress` component is preferred.
- **Badge/pill indicators** — Less effective for communicating relative proportion between three buckets.

---

## 3. Navigation Row Pattern

### Decision
Render navigation links as full-width `<button>` elements styled as tappable rows with `flex items-center justify-between` layout — consistent with existing ghost-button patterns but with a chevron-right affordance and explicit `min-h-[44px]` for touch target compliance.

### Rationale
- Matches the established shadcn/ui + Tailwind pattern in the rest of the app.
- `Tag` (from lucide-react) for Categories and `TrendingUp` for Insights are both valid Lucide icons already in the lucide-react v0.577.0 package. `TrendingUp` is more semantically appropriate than `BarChart2` for insights/analytics in a personal finance context.
- `ChevronRight` from lucide-react provides the standard mobile navigation affordance.

### Alternatives Considered
- **`Button` component with `variant="ghost" className="justify-start"`** — current approach in existing code, works but lacks chevron affordance and section-list feel.
- **Next.js `<Link>` component** — appropriate for SSR link semantics, but since navigation uses `useRouter().push()` throughout the app (consistent with SPA-style navigation in the client component), `onClick` + `router.push()` is preferred for consistency.

---

## 4. Identity Section Visual Treatment

### Decision
Display the user identity inside a `Card` with the avatar rendered at a larger size (h-16 w-16), name in `text-xl font-bold`, and a warm-tinted ring around the avatar (`ring-2 ring-primary/30`) to add visual distinction without introducing gradients or texture (which would require custom CSS).

### Rationale
- The card already uses `--card: #211916` background which provides natural separation from the page background.
- A primary-color ring on the avatar uses existing Tailwind utilities (`ring-*`, `ring-primary`) and creates a distinctive branded detail with zero extra CSS.
- Avoids `style` attributes with gradient strings or additional CSS in `globals.css` for maintainability.

### Alternatives Considered
- **Gradient background on identity card** — Requires either a `style` prop with gradient string or a new CSS utility class. Added complexity for marginal visual gain.
- **Full-bleed header section outside the card** — Requires layout changes to the page container, which could affect mobile scroll behavior.
