# Phase 3: Data Layer Integration - Pattern Map

**Mapped:** 2026-04-22
**Files analyzed:** 5 files to modify (no new files)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `web/types/index.ts` | type definition | — | `web/types/index.ts` (self — extend existing `Transaction` type) | exact |
| `web/lib/validations/transactions.ts` | validation schema | request-response | `web/lib/validations/transactions.ts` (self — extend existing schemas) | exact |
| `web/lib/actions/transactions.ts` | server action | request-response + CRUD | `web/lib/actions/transactions.ts` (self — extend `createTransaction`, `updateTransaction`, add `getExchangeRateForPreview`) | exact |
| `web/lib/finance-utils.ts` | utility | transform | `web/lib/finance-utils.ts` (self — extend `parseAmountInput` / `formatAmountDisplay`) | exact |
| `web/components/transaction-sheet.tsx` | client component | request-response + event-driven | `web/components/transaction-sheet.tsx` (self — extend `FormState`, currency badge + popover, preview) | exact |

All files are modifications to existing files. No new files are created.

---

## Pattern Assignments

### `web/types/index.ts` (type definition)

**Analog:** self — existing `Transaction` type at lines 29–39

**Existing `Transaction` type** (lines 29–39):
```typescript
export type Transaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  type: TransactionType;
  description: string | null;
  date: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Change required — add three fields matching schema columns** (`web/lib/schema.ts` lines 177–181):
```typescript
export type Transaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;           // base-currency value — existing; all dashboard queries read this
  type: TransactionType;
  description: string | null;
  date: string;
  currency: string;         // NEW — ISO 4217 code (e.g. "USD", "COP")
  originalAmount: string;   // NEW — amount as entered in transaction currency (numeric → string at runtime)
  exchangeRate: string;     // NEW — full-precision rate (numeric(20,10) → string at runtime)
  createdAt: Date;
  updatedAt: Date;
};
```

**Note on Drizzle numeric → string:** `amount`, `originalAmount`, and `exchangeRate` are all `numeric` columns. Drizzle maps them to TypeScript `string` at runtime. Always wrap with `Number()` before arithmetic. This is the established pattern from the Phase 2 exchange rate service (see `web/lib/exchange-rates.ts` line 34: `return Number(cached[0].rate)`).

**Also update `EditableTransaction` in `transaction-sheet.tsx`** to include `currency` and `originalAmount` so edit-mode pre-fill works correctly.

---

### `web/lib/validations/transactions.ts` (validation schema)

**Analog:** self — existing schemas at lines 7–24

**Existing `createTransactionSchema`** (lines 7–13):
```typescript
export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  date: dateSchema,
  categoryId: z.string().uuid().optional(),
});
```

**Existing `z.enum` pattern to copy** (line 9 — use same approach for `currency`):
```typescript
type: z.enum(["expense", "income"]),
```

**Change required — add `currency` and `baseCurrency` to both schemas:**
```typescript
const SUPPORTED_CURRENCIES = ["USD", "COP"] as const;

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  date: dateSchema,
  categoryId: z.string().uuid().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).default("USD"),      // NEW
  baseCurrency: z.enum(SUPPORTED_CURRENCIES).default("USD"),  // NEW — from CurrencyProvider
});

export const updateTransactionSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  type: z.enum(["expense", "income"]).optional(),
  description: z.string().max(255).optional(),
  date: dateSchema.optional(),
  categoryId: z.string().uuid().nullable().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),          // NEW
  baseCurrency: z.enum(SUPPORTED_CURRENCIES).optional(),      // NEW
});
```

**Rationale for `z.enum` over `z.string().length(3)`:** Exhaustive type narrowing catches invalid codes at the Zod boundary (e.g. rejects `"XXX"`). Widens to more currencies in a future pass without DB changes. Matches the `z.enum(["expense", "income"])` precedent already in both schemas.

**Also export updated inferred types:**
```typescript
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
```

---

### `web/lib/actions/transactions.ts` (server action — three changes)

**Analog:** self — existing `createTransaction` (lines 22–59) and `updateTransaction` (lines 61–113)

#### Change 1: Add import for `getOrFetchExchangeRate`

**Existing import block** (lines 1–20):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/lib/schema";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import { getTransactions } from "@/lib/queries/transactions";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/lib/validations/transactions";
import type {
  ActionResult,
  FilterState,
  Transaction,
  TransactionBatch,
  TransactionType,
  TransactionWithCategory,
} from "@/types";
```

**Add one import:**
```typescript
import { getOrFetchExchangeRate } from "@/lib/exchange-rates";
```

#### Change 2: Extend `createTransaction`

**Existing core pattern** (lines 36–59):
```typescript
const { amount, type, description, date, categoryId } = parsed.data;

try {
  const result = await db
    .insert(transactions)
    .values({
      userId,
      amount: amount.toFixed(2),
      type,
      description: description ?? null,
      date,
      categoryId: categoryId ?? null,
    })
    .returning();

  revalidatePath("/transactions");
  revalidatePath("/");

  return { success: true, data: result[0] as Transaction };
} catch (err) {
  console.error("Failed to create transaction:", err);
  return { success: false, error: "Failed to create transaction" };
}
```

**Change required — insert rate-fetch block between safeParse and db.insert:**
```typescript
const { amount, type, description, date, categoryId, currency, baseCurrency } = parsed.data;

let exchangeRate: number;
try {
  exchangeRate = await getOrFetchExchangeRate(currency, baseCurrency, date);
} catch {
  return { success: false, error: "Couldn't fetch exchange rate — please try again." };
}

const originalAmount = amount;
const convertedAmount = originalAmount * exchangeRate;

try {
  const result = await db
    .insert(transactions)
    .values({
      userId,
      amount: convertedAmount.toFixed(2),       // base-currency value
      originalAmount: originalAmount.toFixed(2), // as-entered value
      exchangeRate: exchangeRate.toString(),      // full precision — never toFixed() for rates
      currency,
      type,
      description: description ?? null,
      date,
      categoryId: categoryId ?? null,
    })
    .returning();

  revalidatePath("/transactions");
  revalidatePath("/");

  return { success: true, data: result[0] as Transaction };
} catch (err) {
  console.error("Failed to create transaction:", err);
  return { success: false, error: "Failed to create transaction" };
}
```

**Error handling pattern to copy from `deleteTransaction`** (lines 115–136) — same try/catch + `console.error` + user-safe message structure. The rate-fetch error is returned *before* the outer try block, matching the pattern that validation errors are returned early.

#### Change 3: Extend `updateTransaction` with conditional rate re-fetch

**Existing partial update pattern** (lines 76–113):
```typescript
const updateValues: Record<string, string | null> = {};

if (parsed.data.amount !== undefined) {
  updateValues.amount = parsed.data.amount.toFixed(2);
}
// ... other fields ...

try {
  const result = await db
    .update(transactions)
    .set(updateValues)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();

  if (!result[0]) {
    return { success: false, error: "Transaction not found" };
  }
  // ...
```

**Pre-read pattern to copy from `web/lib/queries/financial-profile.ts`** (lines 7–17 — single-row select with userId guard):
```typescript
const result = await db
  .select()
  .from(financialProfile)
  .where(eq(financialProfile.userId, userId))
  .limit(1);
```

**Change required — add pre-read + conditional rate logic before `updateValues` build:**
```typescript
// Pre-read required to detect currency/date change (D-05)
const existing = await db
  .select()
  .from(transactions)
  .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  .limit(1);

if (!existing[0]) {
  return { success: false, error: "Transaction not found" };
}

const newCurrency = parsed.data.currency ?? existing[0].currency;
const newDate = parsed.data.date ?? existing[0].date;
const currencyChanged = newCurrency !== existing[0].currency;
const dateChanged = newDate !== existing[0].date;

const updateValues: Record<string, string | null | number> = {};

// Re-fetch rate only when currency or date changes (D-05)
if (currencyChanged || dateChanged) {
  const baseCurrency = parsed.data.baseCurrency ?? existing[0].currency; // fallback: use stored
  let exchangeRate: number;
  try {
    exchangeRate = await getOrFetchExchangeRate(newCurrency, baseCurrency, newDate);
  } catch {
    return { success: false, error: "Couldn't fetch exchange rate — please try again." };
  }
  const originalAmount = parsed.data.amount ?? Number(existing[0].originalAmount);
  updateValues.currency = newCurrency;
  updateValues.exchangeRate = exchangeRate.toString();
  updateValues.originalAmount = originalAmount.toFixed(2);
  updateValues.amount = (originalAmount * exchangeRate).toFixed(2);
} else if (parsed.data.amount !== undefined) {
  // Amount changed but not currency/date — preserve existing rate, recompute base amount
  const rate = Number(existing[0].exchangeRate);
  updateValues.originalAmount = parsed.data.amount.toFixed(2);
  updateValues.amount = (parsed.data.amount * rate).toFixed(2);
}

// Remaining fields follow existing pattern:
if (parsed.data.type !== undefined) updateValues.type = parsed.data.type;
if (parsed.data.description !== undefined) updateValues.description = parsed.data.description ?? null;
if (parsed.data.date !== undefined) updateValues.date = parsed.data.date;
if (parsed.data.categoryId !== undefined) updateValues.categoryId = parsed.data.categoryId;
```

**Note on `updateValues` type:** Change from `Record<string, string | null>` to `Record<string, string | null | number>` or use Drizzle's typed set object to accommodate numeric fields.

#### Change 4: Add `getExchangeRateForPreview` (new export in same file)

**Pattern to copy:** auth check from `createTransaction` (line 25) + try/catch returning union type:
```typescript
export async function getExchangeRateForPreview(
  from: string,
  to: string,
  date: string,
): Promise<{ rate: number } | { error: string }> {
  await getAuthenticatedUser(); // consistent with all existing actions
  try {
    const rate = await getOrFetchExchangeRate(from, to, date);
    return { rate };
  } catch {
    return { error: "Couldn't fetch exchange rate" };
  }
}
```

---

### `web/lib/finance-utils.ts` (utility — extend for COP)

**Analog:** self — `parseAmountInput` (lines 161–195) and `formatAmountDisplay` (lines 142–154)

**Existing `parseAmountInput` structure** (lines 161–195) — copy the guard pattern at lines 168–170:
```typescript
const clean = display.replace(/[^0-9.,]/g, "");
if (!clean) {
  return { normalizedValue: "", decimalSeparator: null };
}
```

**Existing `formatAmountDisplay` structure** (lines 142–154) — the `[intPart, ...decParts]` split pattern:
```typescript
export function formatAmountDisplay(
  raw: string,
  decimalSeparator: AmountDecimalSeparator = null,
): string {
  if (!raw) return "";
  const [intPart, ...decParts] = raw.split(".");
  const hasDot = raw.includes(".");
  const formatted = intPart ? Number(intPart).toLocaleString("en-US") : "";
  if (hasDot) {
    return formatted + (decimalSeparator ?? ".") + (decParts[0] ?? "");
  }
  return formatted;
}
```

**Change required — add `getCurrencyDecimals` helper and extend both functions:**
```typescript
// New helper — add before parseAmountInput
export function getCurrencyDecimals(currency: string): number {
  return currency === "COP" ? 0 : 2;
}
```

**Usage in `TransactionSheet`:** When `currency === "COP"`, strip any decimal part from `normalizedValue` after `parseAmountInput` returns, and use `inputMode="numeric"` instead of `"decimal"` on the `<Input>`. The existing `parseAmountInput` function does not need modification — the stripping happens at the call site in the component.

---

### `web/components/transaction-sheet.tsx` (client component — four changes)

**Analog:** self — existing component (lines 1–516)

#### Change 1: New imports

**Existing import block** (lines 1–41) — copy the pattern for new additions:
```typescript
"use client";

import { useEffect, useMemo, useState } from "react";
// ... existing imports ...
import { useCurrency } from "@/components/currency-provider";      // NEW
import {
  createTransaction,
  updateTransaction,
  getExchangeRateForPreview,                                       // NEW
} from "@/lib/actions/transactions";
import { getCurrencyDecimals } from "@/lib/finance-utils";         // NEW
```

#### Change 2: Extend `FormState` and `EditableTransaction`

**Existing `FormState`** (lines 113–120):
```typescript
interface FormState {
  amount: string;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  description: string;
  selectedBucket: AllocationBucket;
}
```

**Change required:**
```typescript
interface FormState {
  amount: string;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  description: string;
  selectedBucket: AllocationBucket;
  currency: string;  // NEW
}
```

**Existing `EditableTransaction`** (lines 122–129):
```typescript
type EditableTransaction = {
  amount: string;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  description: string | null;
  category?: { allocationBucket: AllocationBucket | null } | null;
};
```

**Change required — add `currency` and `originalAmount`:**
```typescript
type EditableTransaction = {
  amount: string;
  originalAmount: string | null;  // NEW — pre-fill edit mode with this, not amount
  currency: string | null;        // NEW
  type: TransactionType;
  categoryId: string | null;
  date: string;
  description: string | null;
  category?: { allocationBucket: AllocationBucket | null } | null;
};
```

#### Change 3: Extend `buildInitialState` — edit pre-fill and currency default

**Existing `buildInitialState` edit path** (lines 136–144):
```typescript
if (mode === "edit" && transaction) {
  return {
    amount: transaction.amount ?? "",
    type: transaction.type ?? "expense",
    categoryId: transaction.categoryId ?? null,
    date: transaction.date?.slice(0, 10) ?? today(),
    description: transaction.description ?? "",
    selectedBucket: transaction.category?.allocationBucket ?? "needs",
  };
}
```

**Change required — use `originalAmount` for edit pre-fill; add `currency` to both paths:**
```typescript
function buildInitialState(
  mode: "create" | "edit",
  transaction: EditableTransaction | null | undefined,
  categories: Category[],
  baseCurrency: string,  // NEW parameter
): FormState {
  if (mode === "edit" && transaction) {
    return {
      amount: transaction.originalAmount ?? transaction.amount ?? "",  // pre-fill original COP amount
      currency: transaction.currency ?? baseCurrency,
      type: transaction.type ?? "expense",
      categoryId: transaction.categoryId ?? null,
      date: transaction.date?.slice(0, 10) ?? today(),
      description: transaction.description ?? "",
      selectedBucket: transaction.category?.allocationBucket ?? "needs",
    };
  }
  return {
    amount: "",
    currency: baseCurrency,  // D-03: default to user's base currency
    type: "expense",
    categoryId: firstCategoryId(categories, "expense", "needs"),
    date: today(),
    description: "",
    selectedBucket: "needs",
  };
}
```

#### Change 4: Component body — currency badge, popover, preview state, and payload

**Existing component opening** (lines 162–170):
```typescript
export function TransactionSheet({ categories }: TransactionSheetProps) {
  const router = useRouter();
  const { isOpen, mode, transaction, close } = useTransactionSheet();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(mode, transaction, categories),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
```

**Change required — add `useCurrency`, preview state, and currency popover state:**
```typescript
export function TransactionSheet({ categories }: TransactionSheetProps) {
  const router = useRouter();
  const { currency: baseCurrency } = useCurrency();  // NEW — reads from CurrencyProvider
  const { isOpen, mode, transaction, close } = useTransactionSheet();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(mode, transaction, categories, baseCurrency),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);  // NEW
  const [previewRate, setPreviewRate] = useState<number | null>(null);  // NEW
  const [previewLoading, setPreviewLoading] = useState(false);          // NEW
```

**Existing `useEffect` reset** (lines 176–184) — also reset new state:
```typescript
useEffect(() => {
  if (isOpen) {
    setForm(buildInitialState(mode, transaction, categories, baseCurrency));
    setError(null);
    setDatePickerOpen(false);
    setCurrencyPickerOpen(false);  // NEW
    setPreviewRate(null);          // NEW
    setPreviewLoading(false);      // NEW
    setAmountDecimalSeparator(null);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen]);
```

**Currency select handler — pattern after existing `selectType` / `selectBucket`** (lines 193–208):
```typescript
async function handleCurrencySelect(newCurrency: string): Promise<void> {
  updateField("currency", newCurrency);
  setCurrencyPickerOpen(false);
  setPreviewRate(null);
  if (newCurrency === baseCurrency) return;
  setPreviewLoading(true);
  const result = await getExchangeRateForPreview(newCurrency, baseCurrency, form.date);
  setPreviewLoading(false);
  if ("rate" in result) {
    setPreviewRate(result.rate);
  } else {
    setError("Couldn't fetch exchange rate — please try again.");
  }
}
```

**Existing `handleSubmit` payload** (lines 226–237) — extend to include `currency` and `baseCurrency`:
```typescript
const payload = {
  amount: amountNum,
  type: form.type,
  description: form.description.trim() || undefined,
  date: form.date,
  categoryId: form.categoryId ?? undefined,
  currency: form.currency,    // NEW
  baseCurrency,               // NEW — from useCurrency()
};
```

**Currency badge + popover — replace hardcoded `$` span** (lines 297–306):

Existing (lines 297–306):
```typescript
<span
  className={cn(
    "mr-2 font-mono font-extrabold transition-all duration-200",
    fontSizeClass,
    isIncome ? "text-income" : "text-primary",
  )}
>
  $
</span>
```

Replace with (copy `Popover` + `PopoverContent` structure from date picker lines 443–477):
```tsx
<Popover open={currencyPickerOpen} onOpenChange={setCurrencyPickerOpen}>
  <PopoverTrigger asChild>
    <button
      type="button"
      aria-label={`Currency: ${form.currency}`}
      className={cn(
        "mr-2 rounded-lg px-2 py-0.5 font-mono font-extrabold transition-all duration-200 hover:bg-border active:scale-95",
        fontSizeClass,
        isIncome ? "text-income" : "text-primary",
      )}
    >
      {form.currency}
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-32 p-1" align="start">
    {["USD", "COP"].map((c) => (
      <button
        key={c}
        type="button"
        onClick={() => handleCurrencySelect(c)}
        className={cn(
          "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-border",
          c === form.currency && "text-primary",
        )}
      >
        {c}
      </button>
    ))}
  </PopoverContent>
</Popover>
```

**Conversion preview — add below the amount input area, pattern after the existing error alert:**

Copy the `role="alert"` + conditional render pattern from error display (lines 487–494):
```tsx
{form.currency !== baseCurrency && (
  <p
    aria-live="polite"
    className="text-sm text-muted-foreground tabular-nums text-center mt-2"
  >
    {previewLoading
      ? "Fetching rate…"
      : previewRate !== null && parseStoredAmount(form.amount) > 0
        ? `≈ ${formatCurrency(parseStoredAmount(form.amount) * previewRate, baseCurrency)}`
        : null}
  </p>
)}
```

**COP decimal handling — at the `onChange` call site** (lines 323–329):
```typescript
onChange={(e) => {
  const parsed = parseAmountInput(e.target.value, amountDecimalSeparator);
  let normalizedValue = parsed.normalizedValue;
  // Strip decimals for zero-decimal currencies (ENTRY-04)
  if (getCurrencyDecimals(form.currency) === 0 && normalizedValue.includes(".")) {
    normalizedValue = normalizedValue.split(".")[0];
  }
  updateField("amount", normalizedValue);
  setAmountDecimalSeparator(parsed.decimalSeparator);
}}
```

Also set `inputMode` conditionally (line 310):
```tsx
inputMode={getCurrencyDecimals(form.currency) === 0 ? "numeric" : "decimal"}
```

---

## Shared Patterns

### Authentication (applies to all server actions)

**Source:** `web/lib/actions/transactions.ts` line 25; `web/lib/queries/auth.ts`

Every action — including the new `getExchangeRateForPreview` — must call `getAuthenticatedUser()` as the first line.

```typescript
const { userId } = await getAuthenticatedUser();
```

### ActionResult discriminated union (applies to all server actions)

**Source:** `web/types/index.ts` lines 99–101

```typescript
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; issues?: ZodIssue[] };
```

All actions return this union. `getExchangeRateForPreview` returns its own narrower union `{ rate: number } | { error: string }` — not `ActionResult` — because it is a query helper, not a mutation.

### Error handling in server actions

**Source:** `web/lib/actions/transactions.ts` lines 55–58, 109–112, 132–135

Pattern: validation errors returned early (before try/catch), then the outer try/catch for DB errors:
```typescript
// Early return for validation failures:
if (!parsed.success) {
  return { success: false, error: "Validation failed", issues: parsed.error.issues };
}

// Early return for rate fetch failure (new pattern — same structure):
try {
  exchangeRate = await getOrFetchExchangeRate(currency, baseCurrency, date);
} catch {
  return { success: false, error: "Couldn't fetch exchange rate — please try again." };
}

// Outer try/catch for DB errors:
try {
  // db operation
} catch (err) {
  console.error("Failed to create transaction:", err);
  return { success: false, error: "Failed to create transaction" };
}
```

### Error display in client form

**Source:** `web/components/transaction-sheet.tsx` lines 169, 179, 223, 239, 246–248, 487–494

```typescript
// State:
const [error, setError] = useState<string | null>(null);

// Clear before submit:
setError(null);

// Set on action failure:
if (!result.success) {
  setError(result.error);
  return;
}

// Catch unexpected errors:
} catch {
  setError("Something went wrong. Please try again.");
}

// Render:
{error && (
  <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive">
    {error}
  </p>
)}
```

### Drizzle numeric → JavaScript number conversion

**Source:** `web/lib/exchange-rates.ts` line 34

All `numeric` columns return `string` at runtime. Always wrap with `Number()` before arithmetic:
```typescript
return Number(cached[0].rate);
// Equivalent for amount fields:
const rate = Number(existing[0].exchangeRate);
const originalAmt = Number(existing[0].originalAmount);
```

### Popover (currency picker copies date picker pattern exactly)

**Source:** `web/components/transaction-sheet.tsx` lines 443–477

The date picker uses:
```typescript
const [datePickerOpen, setDatePickerOpen] = useState(false);
// ...
<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" ...>...</Button>
  </PopoverTrigger>
  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
    ...
  </PopoverContent>
</Popover>
```

The currency picker follows the same `open`/`onOpenChange` pattern with a smaller `PopoverContent` (`w-32 p-1`).

### `revalidatePath` after mutations

**Source:** `web/lib/actions/transactions.ts` lines 51–52, 105–106

Always revalidate both paths after a successful mutation:
```typescript
revalidatePath("/transactions");
revalidatePath("/");
```

---

## No Analog Found

None — all modified files are extensions of existing files. No entirely new files are created in this phase.

---

## Metadata

**Analog search scope:** `web/lib/actions/`, `web/lib/validations/`, `web/components/`, `web/types/`, `web/lib/`
**Files scanned:** 8 source files read directly
**Pattern extraction date:** 2026-04-22

**Key pitfalls encoded in patterns above:**
- `Transaction` type in `types/index.ts` must be updated FIRST (before touching actions or components) — TypeScript will fail to compile otherwise
- `originalAmount` (not `amount`) pre-fills the edit form — see `buildInitialState` change
- `getOrFetchExchangeRate` throws on failure — never silently catch and fall back to 1.0
- Drizzle `numeric` → `string` at runtime — always `Number()` before arithmetic
- `updateTransaction` requires a pre-read to detect currency/date change (D-05)
- `baseCurrency` comes from `useCurrency()` in the component; sent as validated field in the payload
