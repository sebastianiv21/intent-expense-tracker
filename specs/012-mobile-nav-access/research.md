# Research: Mobile Navigation Access

**Feature**: 012-mobile-nav-access
**Date**: 2026-03-28

## Research Tasks

### 1. Existing Bottom Sheet Pattern

**Decision**: Use existing shadcn/ui Sheet component with `side="bottom"` configuration.

**Rationale**:
- Sheet component already exists in `components/ui/sheet.tsx`
- Already used throughout the app (transaction-sheet.tsx, recurring-page.tsx, financial-profile-sheet.tsx)
- Matches the established design language
- Radix UI Dialog primitive provides accessibility (focus trap, ARIA attributes)

**Alternatives Considered**:
- Custom drawer implementation: Rejected - adds unnecessary complexity, shadcn/ui Sheet already available
- Radix UI NavigationMenu: Rejected - designed for horizontal dropdowns, not mobile bottom sheets

---

### 2. Navigation Icon Selection

**Decision**: Use `MoreHorizontal` (ellipsis) icon from lucide-react for the "More" trigger.

**Rationale**:
- Lucide-react is already a project dependency
- `MoreHorizontal` is the standard overflow/ellipsis icon pattern
- Consistent with mobile UI conventions (iOS, Android, most mobile web apps)
- Fits within the existing icon usage pattern in bottom-nav.tsx

**Alternatives Considered**:
- "More" text label: Rejected - takes more horizontal space, icons are more universally understood
- `Menu` (hamburger) icon: Rejected - typically indicates a full navigation drawer, not overflow items
- `Grid` icon: Rejected - typically indicates app switcher, not overflow navigation

---

### 3. Active State Indication for Overflow Items

**Decision**: Highlight the active item in the overflow sheet with the same accent styling used in bottom-nav.

**Rationale**:
- Consistency with existing active state pattern in bottom-nav.tsx (`isActive ? "text-accent" : "text-muted-foreground"`)
- Users need visual confirmation of their current location
- Simple implementation using existing `usePathname()` hook

**Implementation Pattern**:
```tsx
// In overflow sheet item
const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
className={cn(
  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
  isActive ? "bg-accent/10 text-accent" : "text-muted-foreground"
)}
```

---

### 4. Sheet Interaction Behavior

**Decision**: Sheet closes automatically after navigation selection.

**Rationale**:
- Matches behavior spec requirement (FR-007)
- Standard mobile UX pattern for navigation selections
- Implemented via `onOpenChange(false)` on navigation click

**Edge Cases Addressed**:
- User opens sheet but clicks outside: Sheet closes normally (Radix default)
- User presses Escape: Sheet closes normally (Radix default)
- Deep link to overflow page: User lands directly on page, no sheet interaction needed

---

### 5. Bottom Navigation Layout

**Decision**: Symmetric 2+2 layout with FAB in center.

**Investigation of existing bottom-nav.tsx**:
- Current layout: 2 items on left (Home, Activity), FAB in center, 2 items on right (Stats, Profile)
- FAB is elevated (`-mt-6`) above the bar
- Layout uses `flex items-center justify-around`

**New Layout**:
- Left side: Home, Activity (2 items)
- Center: FAB (elevated)
- Right side: Budgets, More (2 items)

This creates a symmetric 2+2 layout around the FAB, maintaining visual balance while prioritizing high-frequency items with direct access.

---

## Summary of Decisions

| Item | Decision | Rationale |
|------|----------|-----------|
| Overflow UI | shadcn/ui Sheet (side="bottom") | Existing pattern, accessible, matches design language |
| More icon | MoreHorizontal (lucide-react) | Standard overflow pattern, existing dependency |
| Active state | Accent color highlight | Consistency with existing bottom-nav pattern |
| Sheet behavior | Auto-close on selection | Standard mobile UX, matches FR-007 |
| Layout | Home, Activity (left), FAB (center), Budgets, More (right) | Symmetric 2+2 layout, prioritizes high-frequency items |

## No NEEDS CLARIFICATION Items

All technical decisions resolved through research of existing codebase patterns and dependencies.
