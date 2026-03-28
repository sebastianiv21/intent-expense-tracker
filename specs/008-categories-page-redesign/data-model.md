# Data Model: Categories Page Redesign

**Feature**: `008-categories-page-redesign`  
**Date**: 2026-03-27

## Scope

No database schema changes. No new Drizzle entities or Zod validation schemas. This document captures only the **UI state model** introduced by the redesign — the local React component state additions in `categories-page.tsx`.

---

## Existing Domain Entities (unchanged)

These types are defined in `web/types/index.ts` and are consumed as-is by the redesigned component.

### `Category`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Unique identifier, used as key for delete state tracking |
| `userId` | `string` | Scoped by auth; not rendered |
| `name` | `string` | Displayed as card title |
| `type` | `"expense" \| "income"` | Determines bucket visibility and color treatment |
| `allocationBucket` | `"needs" \| "wants" \| "future" \| null` | `null` for income categories |
| `icon` | `string \| null` | Emoji character; falls back to `"•"` when null |
| `createdAt` | `Date` | Not rendered |
| `updatedAt` | `Date` | Not rendered |

### `AllocationBucket`

`"needs" | "wants" | "future"` — maps to color tokens via `getBucketColor()` in `lib/finance-utils.ts`:

| Bucket | Color | CSS Token |
|--------|-------|-----------|
| `needs` | `#8b9a7e` | `--bucket-needs` |
| `wants` | `#c97a5a` | `--bucket-wants` |
| `future` | `#a89562` | `--bucket-future` |

Income color: `#7aaa7a` (`--income`). Used when `category.type === "income"`.

---

## UI State Model (new additions)

The following state additions are confined to `CategoriesPage` (client component). All existing state (`type`, `bucket`, `sheetOpen`, `editingCategory`, `formState`, `loading`, `error`) is preserved unchanged.

### Delete Confirmation State

```
confirmingDeleteId: string | null
  Purpose: tracks which category card is showing the inline confirmation prompt
  Default: null
  Transitions:
    null → id         user taps Delete on a card (also clears any prior confirmation)
    id → null         user taps Cancel, or opens edit sheet, or delete succeeds/fails

deletingId: string | null
  Purpose: tracks which category is being deleted (server request in-flight)
  Default: null
  Transitions:
    null → id         user taps Confirm on the inline confirmation
    id → null         server responds (success or error)

deleteError: { id: string; message: string } | null
  Purpose: tracks a failed delete for inline error display on the specific card
  Default: null
  Transitions:
    null → { id, message }   server action returns failure
    { ... } → null           user taps Delete again on same card (retry), or Cancel
```

### State Transition Rules

| User Action | `confirmingDeleteId` | `deletingId` | `deleteError` | Card Visible? |
|-------------|---------------------|--------------|---------------|---------------|
| Tap Delete on card X | `X` | `null` | `null` (cleared) | Yes |
| Tap Delete on card Y (while X confirming) | `Y` | `null` | `null` | Yes (X restores normal) |
| Tap Cancel on card X | `null` | `null` | unchanged | Yes |
| Tap Confirm on card X | `null` | `X` | `null` | Yes (loading/disabled) |
| Server returns success | `null` | `null` | `null` | No (removed via router.refresh()) |
| Server returns error | `null` | `null` | `{ id: X, message }` | Yes (shows error) |
| Open edit sheet | `null` | unchanged | unchanged | Yes (confirmation dismissed) |

### `CategoryFormState` (unchanged)

```
name: string
icon: string
type: TransactionType
allocationBucket: AllocationBucket | ""
```

The emoji preview is a **derived value** from `formState.icon` — no additional state needed.

---

## Derived Values (computed from existing state, no new state)

| Derived Value | Source | Usage |
|---------------|--------|-------|
| Emoji preview display | `formState.icon \|\| "•"` | Live preview in create/edit sheet |
| Card accent color | `getBucketColor(category.allocationBucket)` for expense, `"#7aaa7a"` for income | Left border stripe + emoji circle tint |
| Emoji circle background | `accentColor + "26"` (15% opacity hex alpha) | `backgroundColor` inline style on emoji circle |
| Left border style | `{ borderLeftColor: accentColor, borderLeftWidth: "3px" }` | Inline style on card container |
| Bucket pill active color | `getBucketColor(bucket)` | Text, border, and tinted background on active pill |
| Card disabled state | `deletingId === category.id` | Disables all card buttons while deleting |
| Card error message | `deleteError?.id === category.id ? deleteError.message : null` | Inline error below card actions |
