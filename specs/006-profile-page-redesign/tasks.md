# Tasks: Profile Page Redesign

**Input**: Design documents from `/specs/006-profile-page-redesign/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅  
**Branch**: `006-profile-page-redesign`  
**Source file**: `web/components/profile-page.tsx` (only file modified)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files or read-only, no shared write conflict)
- **[Story]**: Which user story this task belongs to (US1–US5)
- No tests requested — implementation tasks only

---

## Phase 1: Setup

**Purpose**: Verify the environment is ready before writing any code.

- [x] T001 [P] Confirm exports exist — verify `TrendingUp`, `ChevronRight` in `lucide-react`; `Progress` in `web/components/ui/progress.tsx`; `PageHeader` in `web/components/page-header.tsx`; `BUCKET_DEFINITIONS`, `BUCKET_ORDER`, `formatCurrency`, `getBucketColor` in `web/lib/finance-utils.ts`
- [x] T002 [P] Review current state of `web/components/profile-page.tsx` to confirm baseline imports, state variables (`sheetOpen`, `logoutOpen`), and JSX structure before making changes

**Checkpoint**: All required utilities confirmed present — implementation can begin

---

## Phase 2: Foundational (Component Scaffold)

**Purpose**: Establish the internal helpers and top-level JSX structure that all user story sections depend on. MUST be complete before any story section is implemented.

**⚠️ CRITICAL**: No user story section work can begin until this phase is complete.

- [x] T003 Update imports in `web/components/profile-page.tsx`: add `TrendingUp`, `ChevronRight` from `lucide-react`; add `Progress` from `@/components/ui/progress`; add `PageHeader` from `@/components/page-header`; add `formatCurrency`, `getBucketColor`, `BUCKET_DEFINITIONS`, `BUCKET_ORDER` from `@/lib/finance-utils`; add `Sheet`, `SheetContent`, `SheetDescription`, `SheetHeader`, `SheetTitle` from `@/components/ui/sheet`; remove `Settings` from `lucide-react` (no longer used); remove `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog` (replaced by Sheet)
- [x] T004 Add `AnimatedSection` internal helper above the `ProfilePage` function in `web/components/profile-page.tsx`. The helper accepts `index: number` and `children: React.ReactNode`. It renders a `<div>` with `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 fill-mode-both` plus a stagger delay class from `["motion-safe:delay-0", "motion-safe:delay-100", "motion-safe:delay-200", "motion-safe:delay-300"][index]` via `cn()`
- [x] T005 Add `NavRow` internal helper above the `ProfilePage` function in `web/components/profile-page.tsx`. The helper accepts `icon: React.ElementType`, `label: string`, `onClick: () => void`. It renders a `<button type="button">` with `aria-label={Go to ${label}}`, `min-h-[44px]` touch target, flex row layout with leading icon + label text + trailing `<ChevronRight>`, and `hover:bg-muted/50 motion-safe:transition-colors motion-safe:duration-150` hover state
- [x] T006 Restructure `ProfilePage` return JSX in `web/components/profile-page.tsx`: replace the existing `<div>` + `<h1>` header block with `<PageHeader title="Profile" description="Account & preferences" />`; replace the three `<Card>` blocks and logout `<Button>` with four `<AnimatedSection index={0..3}>` wrapper slots (identity, financial, navigation, logout) — the logout confirmation Sheet and FinancialProfileSheet remain at the bottom of the JSX, outside the animated sections

**Checkpoint**: Component scaffold in place — each story section can now be filled in independently

---

## Phase 3: User Story 1 — View Account Identity at a Glance (Priority: P1) 🎯 MVP

**Goal**: Deliver a visually distinctive identity card at the top of the Profile page showing avatar, name, email, and member-since date.

**Independent Test**: Navigate to `/profile`, verify name, email, avatar (or initials fallback), and "Member since [Mon YYYY]" are all visible in the top card without scrolling.

- [x] T007 [US1] Implement identity card inside `AnimatedSection index={0}` in `web/components/profile-page.tsx`: `<Card>` with `<CardContent className="p-4 flex items-center gap-4">`; `<Avatar className="h-16 w-16 ring-2 ring-primary/30">` with `<AvatarImage>` (when `user.image` is truthy) and `<AvatarFallback>` showing `initials`; name as `text-xl font-bold text-foreground`; email as `text-sm text-muted-foreground`; conditional "Member since" line using `format(new Date(user.createdAt), "MMM yyyy")` from `date-fns` wrapped in `{user.createdAt && (...)}`)
- [x] T008 [US1] Handle identity edge cases in `web/components/profile-page.tsx`: (a) single-word name — `initials` derivation uses `.split(" ").map(p => p[0])` which already handles single-word names (returns first char only); (b) very long name/email — add `truncate` class to name/email `<p>` elements and wrap container in `<div className="min-w-0 flex-1">` so flex doesn't overflow; (c) missing `createdAt` already handled by conditional render from T007 — verify no layout shift when absent

**Checkpoint**: US1 complete — Profile page top section is fully functional and visually polished

---

## Phase 4: User Story 2 — Understand Financial Profile at a Glance (Priority: P2)

**Goal**: Replace the raw percentage list with formatted income and colored allocation progress bars.

**Independent Test**: With a financial profile set (e.g., income $5000, 50/30/20), verify the card shows "$5,000.00" as income and three progress bars in sage green / terracotta / gold colors with correct labels and percentages.

- [x] T009 [US2] Implement financial profile section inside `AnimatedSection index={1}` in `web/components/profile-page.tsx`: `<Card>` with header row (title "Financial profile", subtitle "Income & 50/30/20 split", and `<Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>Edit</Button>`); income row showing `formatCurrency(profile.monthlyIncomeTarget)` with label "Monthly income"; `{BUCKET_ORDER.map(bucket => ...)}` loop rendering for each bucket: label row with `<span style={{ color: getBucketColor(bucket) }}>` for label and `<span className="tabular-nums">{percentage}%</span>` for value, then `<Progress value={percentage} className="h-1.5" style={{ backgroundColor: \`${color}22\` }} indicatorStyle={{ backgroundColor: color }} />` where `percentage = Number(profile[\`${bucket}Percentage\`])`. **TypeScript note**: if strict mode rejects the template literal key, use an explicit lookup: `const PCT_KEYS = { needs: "needsPercentage", wants: "wantsPercentage", future: "futurePercentage" } as const` and access via `profile[PCT_KEYS[bucket]]`
- [x] T010 [US2] Handle zero/unset income edge case in `web/components/profile-page.tsx`: `formatCurrency` already handles `"0"` string correctly (renders "$0.00") — verify by tracing the call. For allocation bars: `Progress value={0}` renders an empty bar without error (Radix clamps to 0) — verify no crash when all percentages are 0 or don't sum to 100

**Checkpoint**: US2 complete — financial profile section shows clear, visually scannable data

---

## Phase 5: User Story 4 — Log Out Safely (Priority: P2)

**Goal**: Replace the dominant full-width red button with a contextually grouped, visually separated ghost-variant destructive logout action.

**Independent Test**: Scroll to bottom of Profile page; verify a "Log out" action is present below a visual separator; tap it, confirm dialog appears with Cancel and Log out options; Cancel dismisses dialog; Log out signs out and redirects to `/login`.

- [x] T011 [US4] Implement logout section inside `AnimatedSection index={3}` in `web/components/profile-page.tsx`: replace existing full-width `<Button variant="destructive">` with `<div className="pt-4 border-t border-border">` containing `<Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px]" onClick={() => setLogoutOpen(true)}>` with `<LogOut className="h-4 w-4" aria-hidden="true" />` and "Log out" text; move app version `<p className="text-center text-xs text-muted-foreground">Intent v1.0</p>` below this section (outside AnimatedSection, always visible); replace the existing `<Dialog open={logoutOpen}>` confirmation block with `<Sheet open={logoutOpen} onOpenChange={setLogoutOpen}><SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">` containing `<SheetHeader className="text-left">` with `<SheetTitle>Log out?</SheetTitle>` and `<SheetDescription>`, followed by a `<div className="flex gap-3 mt-4">` with Cancel (`variant="outline"`) and Log out (`variant="destructive"`) buttons — preserving the existing `handleLogout` async function body unchanged

**Checkpoint**: US4 complete — logout is accessible but no longer visually dominant

---

## Phase 6: User Story 3 — Navigate to App Sections from Profile (Priority: P3)

**Goal**: Replace the generic navigation card (with incorrect Settings icon for Insights) with clean tappable rows using correct icons.

**Independent Test**: Verify Profile page shows two nav rows: "Categories" with a Tag icon and "Insights" with a TrendingUp icon (no gear/settings icon visible); tap each and confirm correct navigation.

- [x] T012 [US3] Implement navigation section inside `AnimatedSection index={2}` in `web/components/profile-page.tsx`: `<Card>` with `<CardContent className="p-2">` containing two `<NavRow>` usages — `<NavRow icon={Tag} label="Categories" onClick={() => router.push("/categories")} />` and `<NavRow icon={TrendingUp} label="Insights" onClick={() => router.push("/insights")} />`; remove the old `<Separator>` and `<div className="grid gap-3">` navigation block entirely

**Checkpoint**: US3 complete — navigation links use correct icons and clean row styling

---

## Phase 7: User Story 5 — Smooth Page Load Animations (Priority: P3)

**Goal**: Confirm stagger animation wrappers are correctly wired and the fill-mode-both behavior prevents flash-of-content during delay periods.

**Independent Test**: Load the Profile page; observe sections fading in sequentially (identity → financial → nav → logout); enable OS "Reduce Motion"; reload and confirm sections appear instantly with no animation.

- [x] T013 [US5] Verify `AnimatedSection` wrappers are applied with correct indices in `web/components/profile-page.tsx`: identity card = index 0 (immediate), financial profile = index 1 (100ms delay), navigation = index 2 (200ms delay), logout section = index 3 (300ms delay); confirm stagger order matches spec US5 acceptance scenario 1 (identity → financial → navigation → account actions)
- [x] T014 [US5] Verify `fill-mode-both` class in `AnimatedSection` helper in `web/components/profile-page.tsx` is applied unconditionally (NOT prefixed with `motion-safe:`) — this prevents elements from briefly flashing at full opacity during their delay period before the animation starts; confirm the `motion-safe:` prefix is present only on `animate-in`, `fade-in`, `duration-500`, and `delay-*` classes

**Checkpoint**: US5 complete — animations are polished and accessible

---

## Phase 8: Polish & Verification

**Purpose**: Validate the complete redesign passes all project quality gates.

- [x] T015 Run `pnpm lint` from `web/` directory; fix any ESLint errors in `web/components/profile-page.tsx` (unused imports, missing types, etc.)
- [x] T016 Run `pnpm build` from `web/` directory; fix any TypeScript type errors or Next.js build failures in `web/components/profile-page.tsx`
- [x] T017 Manually verify the Profile page in a browser at 375px (mobile), 768px (tablet), and 1024px+ (desktop): (a) identity card, financial section, navigation, and logout all render correctly at each breakpoint; (b) all touch targets are visually ≥44px tall; (c) FinancialProfileSheet opens when "Edit" is tapped; (d) app version label "Intent v1.0" is visible; (e) logout bottom sheet opens, Cancel dismisses it, Log out signs out and redirects to `/login`; (f) compare Profile page `PageHeader`, `Card` borders, and color tokens against Insights and Transactions pages to confirm visual consistency (SC-003); (g) **Accessibility** — tab through all interactive elements and confirm logical focus order; verify `aria-label` values are present in DOM on NavRow buttons; verify ghost logout button text contrast meets 4.5:1 against card background; verify `Progress` bars expose `role="progressbar"` and `aria-valuenow`; verify reduced-motion disables animations (toggle OS preference or use DevTools force-reduced-motion)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on other stories
- **US2 (Phase 4)**: Depends on Phase 2 — no dependency on US1
- **US4 (Phase 5)**: Depends on Phase 2 — no dependency on US1 or US2
- **US3 (Phase 6)**: Depends on Phase 2 — no dependency on other stories
- **US5 (Phase 7)**: Depends on Phase 2 (AnimatedSection helper) — no functional dependency on any story section, but all story sections must exist to verify stagger order
- **Polish (Phase 8)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no story dependencies
- **US2 (P2)**: Can start immediately after Phase 2 — no story dependencies
- **US4 (P2)**: Can start immediately after Phase 2 — no story dependencies
- **US3 (P3)**: Can start immediately after Phase 2 — no story dependencies
- **US5 (P3)**: Logically last — validates animation wiring across all sections

### Within Each Phase

- All tasks within a phase modify the same file (`profile-page.tsx`) and must be done sequentially
- Exception: T001 and T002 (Phase 1) are read-only and can run in parallel

---

## Parallel Opportunities

```bash
# Phase 1 — both are read-only verifications:
Task: T001 — Verify export availability across utility files
Task: T002 — Review current profile-page.tsx baseline

# Phase 2 → Phase 3+: once T006 (JSX scaffold) is done,
# US1/US2/US3/US4 sections are independent placeholders
# in the same file — a single developer fills them in order,
# but logically they have no data dependency on each other.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational scaffold (T003–T006)
3. Complete Phase 3: US1 identity section (T007–T008)
4. Run `pnpm lint` + `pnpm build` to verify no regressions
5. **STOP and VALIDATE**: Profile page top section looks polished and consistent

### Full Incremental Delivery

1. Phase 1 + 2 → Scaffold ready
2. Phase 3 (US1) → Identity card ✅
3. Phase 4 (US2) → Financial profile with bars ✅
4. Phase 5 (US4) → Refined logout ✅
5. Phase 6 (US3) → Correct nav icons ✅
6. Phase 7 (US5) → Animations wired ✅
7. Phase 8 → Lint + build + manual verify ✅
