# Research: Redesign Transaction Entry Sheet UI

**Date**: 2026-03-25  
**Branch**: `002-transaction-sheet-redesign`

## Decision Log

### 1. Horizontal Scroll for Category Pills

**Decision**: Use a plain `flex overflow-x-auto gap-2` row with `scrollbar-hide` (via Tailwind's `[&::-webkit-scrollbar]:hidden`) — no `ScrollArea` component.

**Rationale**: `ScrollArea` is not installed in the project. Installing it adds a dependency for something achievable with two Tailwind utility classes. The existing codebase already uses `overflow-y-auto` for the category list in the current sheet; the same pattern applies horizontally.

**Alternatives considered**: `npx shadcn add scroll-area` — rejected because it adds overhead for a trivial use case, and Constitution principle V (Simplicity) mandates using existing stack capabilities first.

---

### 2. Intent Bucket Buttons

**Decision**: Custom `<button>` elements styled with Tailwind, using `aria-pressed` for selection state. Not using the existing `Toggle` or `Tabs` shadcn components.

**Rationale**: The design reference shows three large square-ish buttons with an icon on top and a text label underneath — a layout that `Tabs` (horizontal pill row) and `Toggle` (icon-only or text-only) do not naturally produce. Custom buttons with `aria-pressed` is the accessible, WCAG 2.1 AA-compliant pattern for this control type and requires no new components.

**Alternatives considered**:
- `Tabs` — rejected; renders as a horizontal pill strip, not icon-above-label cards.
- `Toggle` from shadcn — rejected; single-axis, no label-below-icon layout.
- `RadioGroup` (not installed) — rejected; not in project, would require adding.

---

### 3. Lucide Icons for Buckets

**Decision**:
- NEEDS → `Home` (house icon)
- WANTS → `Coffee` (cup icon)
- FUTURE → `PiggyBank`

**Rationale**: All three are confirmed present in `lucide-react ^0.577.0` and visually match the reference design. They are semantically appropriate (home = essentials, coffee = discretionary enjoyment, piggy bank = savings).

**Alternatives considered**: `Landmark` for NEEDS, `TrendingUp` for FUTURE — both available but less immediately recognizable to a general audience.

---

### 4. Large Amount Input Display

**Decision**: Use the existing `<Input>` component with `text-4xl font-bold text-center` classes and `inputMode="decimal"`. Display a `$` prefix via an absolutely-positioned `<span>`.

**Rationale**: Matches the reference design (large centered number, dollar sign to the left). The existing sheet already uses an `<Input>` with a `$` prefix span — this is an extension of that same pattern, not a new one. No custom numeric keypad needed; mobile browsers open the decimal keyboard automatically with `inputMode="decimal"`.

**Alternatives considered**: A custom display-only `<div>` that opens a native numeric input on tap — rejected as unnecessarily complex.

---

### 5. Category Filtering Logic

**Decision**: Client-side filtering using `useMemo`. For `expense` type: filter `categories` where `cat.allocationBucket === selectedBucket`. For `income` type: filter where `cat.type === "income"`.

**Rationale**: All categories are already fetched and passed as a prop to `TransactionSheet`. No additional Server Action or query is needed. The `allocationBucket` field is already present on every `Category` object. Client-side filtering is instantaneous for the expected dataset size (<100 categories per user).

**Alternatives considered**: Fetching categories per bucket on demand via a Server Action — rejected; unnecessary round-trip, over-engineering for the data volume.

---

### 6. Pre-selection on Open

**Decision**: When the sheet opens in "create" mode, default `selectedBucket` to `"needs"` and `categoryId` to the first category in the Needs-scoped list (if any). When switching buckets, reset `categoryId` to the first category of the new bucket.

**Rationale**: Confirmed by clarification Q2. Matches the reference design. Reduces required taps from 3 (bucket + category + amount) down to 1 (amount only for the most common flow).

---

### 7. Income Mode — Hidden Intent Bucket

**Decision**: When `type === "income"`, render the intent bucket row with `hidden` (or conditional JSX). The bucket state resets to `"needs"` when switching back to `"expense"`.

**Rationale**: Confirmed by clarification Q4. Income transactions in this 50/30/20 model represent money coming in, not spending decisions. Forcing bucket selection on income entries would be semantically incorrect.

---

### 8. No Schema Changes Required

**Decision**: The existing Drizzle schema supports all requirements without modification.

**Rationale**:
- `categories.allocationBucket: allocationBucketEnum | null` already encodes the Needs/Wants/Future membership.
- `categories.type: transactionTypeEnum` already distinguishes expense vs income categories.
- `transactions` table fields (amount, type, categoryId, date, description) already match all form fields.
- The `createTransaction` and `updateTransaction` Server Actions and their Zod validation schemas require no changes.
