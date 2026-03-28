# Research: Financial Profile Sheet Redesign

**Phase**: 0 — Resolve all NEEDS CLARIFICATION and technical unknowns  
**Date**: 2026-03-27

---

## 1. Segmented Allocation Bar

**Decision**: Render the bar as three inline `div` elements inside a `flex` container, identical to the existing pattern in `profile-page.tsx`.

**Rationale**: The profile page already renders a working allocation bar using this exact approach:
```tsx
<div className="flex rounded-full overflow-hidden h-2 gap-px">
  {BUCKET_ORDER.map((bucket) => (
    <div key={bucket} style={{ width: `${pct}%`, backgroundColor: color }} />
  ))}
</div>
```
Reusing this pattern is zero-risk. The unfilled remainder segment is an additional `div` appended when `total < 100`, styled with `bg-muted/50` or `bg-destructive/20` (transitioning based on how far from 100%).

**Remainder segment behaviour**:
- When `total < 100`: render `<div style={{ width: `${100 - total}%` }} className="bg-muted/40 motion-safe:transition-all motion-safe:duration-200" />`
- When `total > 100`: no remainder div; bar overflows are hidden by `overflow-hidden` on the container; counter text signals the error.

**Alternatives considered**:
- Radix UI `Progress` component: only supports a single indicator; extending it for three segments adds complexity without benefit.
- `recharts`: already in the project but is heavyweight for a simple bar; rejected.

---

## 2. Custom Range Slider Styling

**Decision**: Style native `<input type="range">` elements using Tailwind CSS 4 arbitrary variant utilities targeting browser pseudo-elements (`[&::-webkit-slider-thumb]`, `[&::-webkit-slider-runnable-track]`, `[&::-moz-range-thumb]`).

**Rationale**: 
- The native element is preserved, so keyboard navigation, ARIA roles, and touch behaviour are unchanged — satisfying Constitution §IV (Accessibility) and the spec's FR-010 requirement to preserve accessibility attributes.
- Tailwind CSS 4 fully supports arbitrary variants including vendor pseudo-elements.
- No new library dependency — satisfies Constitution §V (Simplicity).

**Implementation pattern**:
```tsx
<input
  type="range"
  className={cn(
    "w-full h-1.5 rounded-full appearance-none cursor-pointer",
    "bg-muted",                          // track background
    "[&::-webkit-slider-thumb]:appearance-none",
    "[&::-webkit-slider-thumb]:w-5",
    "[&::-webkit-slider-thumb]:h-5",
    "[&::-webkit-slider-thumb]:rounded-full",
    "[&::-webkit-slider-thumb]:cursor-grab",
    "[&::-webkit-slider-thumb]:active:cursor-grabbing",
    "[&::-moz-range-thumb]:border-0",
    "[&::-moz-range-thumb]:w-5",
    "[&::-moz-range-thumb]:h-5",
    "[&::-moz-range-thumb]:rounded-full",
  )}
  style={{
    accentColor: color,                  // fills track up to thumb in the bucket color
    // webkit filled-lower not available without JS; use accentColor for cross-browser fill
  }}
/>
```

**Note on filled track**: CSS `accent-color` fills the track to the thumb in Chromium and Firefox without any JS. For Safari (WebKit), `accent-color` on range inputs is supported from Safari 15.4+. Since the app targets mobile-first (iOS Safari), this is verified to work. The thumb color is also controlled by `accent-color`.

**Touch target**: The thumb is rendered at `w-5 h-5` (20×20px). The overall `<input>` has an implicit height that browsers extend for touch — combined with `min-h-[44px]` on the wrapping `div`, the 44×44px constitution requirement is met.

**Alternatives considered**:
- `@radix-ui/react-slider`: Not installed; adding it would be a new dependency.
- Completely custom div/pointer-event slider: Significantly more code; no accessibility without ARIA re-implementation.

---

## 3. Bucket Amount Chip

**Decision**: Render a small `<span>` pill per bucket using a translucent background tint of the bucket color (`backgroundColor: ${color}18` — ~10% opacity hex) with the bucket color as text.

**Rationale**: 
- The `Badge` component from shadcn/ui uses a fixed `primary` colour variant system that doesn't accept arbitrary hex colours. A plain styled `<span>` is simpler.
- The `18` hex suffix (~10% opacity) provides a subtle tint without clashing with the dark background (`--card: #211916`).
- Chips are `aria-hidden="true"` because the same information (formatted amount) is communicated by the screen reader through the visible text node; the chip is decorative styling.

**Pattern**:
```tsx
{incomeNum > 0 && (
  <span
    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums"
    style={{ color, backgroundColor: `${color}18` }}
    aria-hidden="true"
  >
    {formatCurrency((incomeNum * buckets[key]) / 100)} / mo
  </span>
)}
```

**Chip visibility**: Hidden entirely when `incomeNum <= 0` (per Clarification Q1: hide chips, no placeholder).

**Alternatives considered**:
- shadcn/ui `Badge`: Fixed colour variants; does not support per-bucket hex colours without class overrides. Rejected.
- Inline text without pill shape: Less visually distinct from surrounding labels. Rejected.

---

## 4. Annual Income Preview

**Decision**: Render a `<p>` tag below the income `<Input>` showing `= {formatCurrency(incomeNum * 12)} / year`, hidden when `incomeNum <= 0`.

**Rationale**: Straightforward derivation — `monthlyIncome × 12`. Uses existing `formatCurrency` from `lib/finance-utils`. No state addition required.

**Pattern**:
```tsx
{incomeNum > 0 && (
  <p className="text-xs text-muted-foreground tabular-nums">
    = {formatCurrency(incomeNum * 12)} / year
  </p>
)}
```

**Alternatives considered**: None — this is a pure display computation.

---

## 5. Validation Counter Text

**Decision**: Replace the static `{total}% / 100%` label with a contextual message:
- When `total === 100`: show `"100%"` in `text-income` colour (already the existing behaviour for the valid state, verified in component source).
- When `total < 100`: show `"−${100 - total}% remaining"` in `text-destructive`.
- When `total > 100`: show `"+${total - 100}% over"` in `text-destructive`.

**Rationale**: More informative than a raw fraction. Matches Clarification Q2: success state uses `text-income` colour change only (no icon or extra label). The `text-income` Tailwind token maps to `--income: #7aaa7a` (green), which is already used in the existing component.

**Alternatives considered**: Checkmark icon (rejected per Clarification Q2); label text "Balanced ✓" (rejected per Clarification Q2).

---

## 6. Animation & Motion

**Decision**: Use `motion-safe:transition-all motion-safe:duration-200` on the allocation bar segments (applied via inline `style` + className). For chips, no explicit transition is added — React re-render is instant and adding CSS transitions to inline `style` values requires additional wrapper elements.

**Rationale**: Constitution §I requires `transform`/`opacity` for animations where possible. However, the segmented bar width change is inherently a `width` CSS transition — this is an acceptable exception because the alternative (animating `transform: scaleX()`) would require `transform-origin` management that complicates the flex layout. The existing `profile-page.tsx` bar uses no animation, so adding `motion-safe:transition-all duration-200` is already an improvement.

The existing `@media (prefers-reduced-motion: reduce)` rule in `globals.css` collapses all transitions to `0.01ms`, so reduced-motion users are fully covered without any extra code.

**Alternatives considered**: JS-driven spring animation (e.g., Framer Motion): Not installed; new dependency. Rejected.

---

## 7. Income Input Visual Prominence

**Decision**: Increase the income `<Input>` font size by adding `text-2xl font-bold` classes. Add a `text-3xl font-bold` dollar prefix inline (replacing the current `<span>` absolutely positioned).

**Rationale**: FR-009 requires the income input to be "visually more prominent" than bucket slider labels. Increasing the `font-size` class from `text-lg font-semibold` (current) to `text-2xl font-bold` achieves this without changing the component structure. The wrapping `div relative` approach for the `$` prefix is preserved.

---

## 8. Design Token Discrepancy (Resolved)

**Finding**: The CSS variable `--bucket-wants` in `globals.css` is `#c4714a` (same as `--primary`), but `BUCKET_DEFINITIONS` in `finance-utils.ts` defines wants as `#c97a5a`. The `financial-profile-sheet.tsx` component sources its colours from the `BUCKET_DEFINITIONS` constant, not the CSS variable.

**Decision**: Continue using `BUCKET_DEFINITIONS` for all colour values in this component, consistent with the existing implementation. Aligning the CSS variable is out of scope for this feature.

---

## Summary of Resolved Decisions

| Unknown | Decision |
|---------|----------|
| Segmented bar implementation | Three `div` elements in a `flex` container (mirrors `profile-page.tsx`) |
| Custom slider styling | Native `<input type="range">` + Tailwind arbitrary pseudo-element variants + `accentColor` |
| Bucket chip visual | `<span>` pill with `${color}18` tint background |
| Chip when income = 0 | Hidden entirely (Clarification Q1) |
| Annual preview | `<p>` with `formatCurrency(incomeNum * 12) / year` |
| Validation counter | Contextual text ("−X% remaining" / "+X% over") in `text-destructive`; `text-income` when balanced (Clarification Q2) |
| Motion | `motion-safe:transition-all duration-200` on bar segments; global reduced-motion rule covers all |
| Income prominence | `text-2xl font-bold` on `<Input>` |
