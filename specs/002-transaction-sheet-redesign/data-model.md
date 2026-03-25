# Data Model: Redesign Transaction Entry Sheet UI

**Date**: 2026-03-25  
**Branch**: `002-transaction-sheet-redesign`

## Schema Changes

**None.** The existing schema fully supports all requirements. No migrations required.

---

## Relevant Existing Entities

### `categories` table (`lib/schema.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Auto-generated |
| `userId` | `varchar(255)` | Scopes to authenticated user |
| `name` | `varchar(100)` | Display label in pill |
| `type` | `transactionTypeEnum` | `"expense"` or `"income"` — determines which categories appear in Income mode |
| `allocationBucket` | `allocationBucketEnum \| null` | `"needs"`, `"wants"`, `"future"`, or `null` for income categories — drives bucket filtering in Expense mode |
| `icon` | `varchar(10) \| null` | Emoji displayed on category pill |

**Filtering rules used by the redesigned sheet:**

- Expense mode: `category.type === "expense" && category.allocationBucket === selectedBucket`
- Income mode: `category.type === "income"` (allocationBucket ignored)

---

### `transactions` table (`lib/schema.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Auto-generated |
| `userId` | `varchar(255)` | Set by Server Action from auth session |
| `categoryId` | `uuid \| null` FK → categories | Selected category pill; nullable (no category required by DB, but UI pre-selects one) |
| `amount` | `numeric(12,2)` | Parsed from amount input string, must be > 0 |
| `type` | `transactionTypeEnum` | `"expense"` or `"income"` from toggle |
| `description` | `text \| null` | Optional notes field |
| `date` | `date` | Formatted `"yyyy-MM-dd"` from date picker |
| `createdAt` | `timestamp` | Set by DB default |

---

## TypeScript Types (unchanged, `types/index.ts`)

```ts
// Key types consumed by TransactionSheet — no changes needed
type AllocationBucket = "needs" | "wants" | "future";
type TransactionType = "expense" | "income";

type Category = {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  allocationBucket: AllocationBucket | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

---

## Component State Shape

The redesigned `TransactionSheet` manages the following local state:

| State variable | Type | Initial value (create mode) |
|---|---|---|
| `amount` | `string` | `""` |
| `type` | `TransactionType` | `"expense"` |
| `selectedBucket` | `AllocationBucket` | `"needs"` |
| `categoryId` | `string \| null` | first category in Needs bucket, or `null` |
| `date` | `Date` | `new Date()` |
| `description` | `string` | `""` |
| `error` | `string` | `""` |
| `loading` | `boolean` | `false` |

**Derived state (via `useMemo`):**

- `filteredCategories`: categories scoped to `type` + `selectedBucket`
- `selectedCategory`: the full `Category` object for the current `categoryId`

---

## Validation (unchanged, `lib/validations/transactions.ts`)

```ts
// No changes — existing schema already covers all fields
createTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().uuid().optional(),
});
```
