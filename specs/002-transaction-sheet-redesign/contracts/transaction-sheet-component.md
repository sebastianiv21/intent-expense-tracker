# Contract: TransactionSheet Component

**Date**: 2026-03-25  
**Branch**: `002-transaction-sheet-redesign`

## Overview

`TransactionSheet` is a bottom sheet modal for creating and editing transactions. It is opened and closed via the `TransactionSheetContext` (no prop-based open/close). Its sole external prop is the pre-fetched category list.

---

## Component Props

```ts
type TransactionSheetProps = {
  categories: Category[];  // all user categories, pre-fetched by parent Server Component
};
```

**No changes to this interface.** The parent (`AppShell`) continues to pass all categories; the component handles filtering internally.

---

## Context API (unchanged)

Consumed via `useTransactionSheet()` from `TransactionSheetContext`:

| Method / Property | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Whether the sheet is currently open |
| `mode` | `"create" \| "edit"` | Determines form initial state |
| `transaction` | `TransactionWithCategory \| null` | Populated in edit mode |
| `openCreate()` | `() => void` | Opens in create mode |
| `openEdit(tx)` | `(tx: TransactionWithCategory) => void` | Opens in edit mode with pre-filled data |
| `close()` | `() => void` | Closes the sheet |

---

## Server Action Interface (unchanged)

### `createTransaction(payload)`

```ts
// lib/actions/transactions.ts
createTransaction(formData: unknown): Promise<ActionResult<Transaction>>

// Accepted payload shape (validated by Zod):
{
  amount: number;       // > 0
  type: "expense" | "income";
  description?: string; // max 255 chars
  date: string;         // "yyyy-MM-dd"
  categoryId?: string;  // valid UUID
}
```

**Success**: `{ success: true, data: Transaction }` → sheet closes  
**Failure**: `{ success: false, error: string }` → sheet stays open, error displayed inline

### `updateTransaction(id, payload)`

Same payload shape as `createTransaction` (all fields optional). Same success/failure behavior.

---

## Behavioral Contract

| Scenario | Expected behavior |
|---|---|
| Sheet opens (create mode) | `type = "expense"`, `selectedBucket = "needs"`, `categoryId` = first Needs category id (or null if none) |
| Sheet opens (edit mode) | All fields pre-filled from `transaction` prop; `selectedBucket` derived from `transaction.category.allocationBucket` |
| User selects a bucket | `selectedBucket` updates; `filteredCategories` recalculates; `categoryId` resets to first in new bucket |
| User switches to Income | Intent bucket row hidden; `filteredCategories` = all income categories; `categoryId` = first income category |
| User switches back to Expense | Bucket row reappears; `selectedBucket` = `"needs"`; `categoryId` = first Needs category |
| Amount is empty or zero | Submit button disabled; no Server Action called |
| Submit succeeds | Sheet closes; `revalidatePath("/")` and `revalidatePath("/transactions")` triggered by action |
| Submit fails | Sheet stays open; `error` state set; displayed inline above submit button with `role="alert"` |
| User taps X / swipes down | Sheet closes; all state discarded |

---

## Accessibility Contract

| Element | Required attributes |
|---|---|
| Bucket buttons | `aria-pressed={bucket === selectedBucket}`, `aria-label="{bucket label}"` |
| Category pills | `aria-pressed={cat.id === categoryId}`, `aria-label="Select {cat.name}"` |
| Amount input | `id="amount"` with associated `<label htmlFor="amount">` |
| Error message | `role="alert"` so screen readers announce it immediately |
| Sheet close button | Provided by Radix `SheetContent` (`aria-label="Close"`) |
