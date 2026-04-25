# Phase 3: Data Layer Integration - Research

**Researched:** 2026-04-22
**Domain:** Next.js Server Actions + React client form state + multi-currency transaction persistence
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The hardcoded `$` prefix in the amount area is replaced by a tappable currency badge. The badge shows the currency code (`USD` or `COP`), not a localized symbol. Tapping the badge opens a **popover** (same pattern as the existing date picker in the form).
- **D-02:** The currency list is **USD + COP only** (hardcoded). No scrollable 30-currency list.
- **D-03:** New transactions always default to the **user's base currency** (read from `financialProfile.currency`, typically `USD`). The form does NOT remember the last-used currency across sessions.
- **D-04:** `createTransaction` accepts a `currency` field. The action calls `getOrFetchExchangeRate(currency, baseCurrency, date)` to get the rate, then computes:
  - `original_amount` = the amount the user entered (in `currency`)
  - `exchange_rate` = the fetched rate
  - `amount` = `original_amount * exchange_rate` (base-currency value)
- **D-05:** `updateTransaction` re-fetches the exchange rate whenever `currency` **or** `date` changes. If neither changes, the stored rate is preserved as-is.
- **D-06:** For same-currency transactions (`currency === baseCurrency`), `getOrFetchExchangeRate` returns `1.0` immediately — `original_amount = amount`, `exchange_rate = 1.0`. No API call or DB lookup.

### Claude's Discretion

- **Conversion preview (ENTRY-03):** Rate is fetched **once on currency selection** (not debounced per keystroke). Preview updates **on amount blur** using the already-fetched rate for client-side multiplication. Loading state shown during the initial rate fetch on currency selection.
- **Edit form pre-fill:** Pre-fill with `originalAmount` (the amount the user originally typed in `currency`), not the converted base-currency `amount`.
- **Rate fetch failure:** If `getOrFetchExchangeRate` throws, surface an error message and block the save. Do NOT silently fall back to rate 1.0. Error message: `"Couldn't fetch exchange rate — please try again."`
- **COP amount formatting (ENTRY-04):** COP amounts have no decimal places; USD uses 2. Extend or wrap existing `parseAmountInput` / `formatAmountDisplay`.
- **Zod schema updates:** `createTransactionSchema` and `updateTransactionSchema` need a `currency` field — planner decides between `z.string().length(3)` or `z.enum(["USD", "COP"])`.

### Deferred Ideas (OUT OF SCOPE)

- "Remember last-used currency" across sessions
- Full 30-currency list in the transaction selector
- User-configurable pinned currencies
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | `createTransaction` server action accepts `currency` and stores `original_amount`, `exchange_rate`, and base-currency `amount` (converted) | Schema columns confirmed present in `web/lib/schema.ts`; `getOrFetchExchangeRate` confirmed implemented in `web/lib/exchange-rates.ts` |
| DATA-02 | `updateTransaction` re-fetches exchange rate and recomputes `amount` if `currency` or `date` changes | Current `updateTransaction` uses partial update dict; conditional re-fetch logic is the key addition |
| DATA-03 | All existing dashboard, bucket, and aggregation queries remain unchanged (they read `amount` which is always in base currency) | Confirmed: `amount` column is the base-currency store; no query files need to change |
| ENTRY-01 | Transaction form includes a currency selector alongside the amount field, defaulting to the user's base currency | `CurrencyProvider` already exposes `currency`; `TransactionSheet` needs `baseCurrency` prop passed through `AppShell` |
| ENTRY-02 | Amount is entered in the selected transaction currency; the system auto-fetches the rate and computes the base-currency amount before saving | Server action computes conversion; form sends `currency` + `amount` in original currency |
| ENTRY-03 | Transaction form shows a real-time preview of the converted amount while the user types (e.g., "≈ $12.50 USD" while entering 50,000 COP) | Server Action fetches rate on currency selection; client multiplies locally on blur |
| ENTRY-04 | Amount input formats intelligently per currency (COP: no decimals; USD: 2 decimal places) | `formatAmountDisplay` / `parseAmountInput` exist and need extension for COP |
</phase_requirements>

---

## Summary

Phase 3 wires multi-currency support into two existing surfaces: the `TransactionSheet` client component (form UI) and the `createTransaction`/`updateTransaction` server actions (data persistence). The schema columns (`currency`, `originalAmount`, `exchangeRate`) and the exchange rate service (`getOrFetchExchangeRate`) were completed in Phases 1 and 2 — this phase is purely integration.

The work splits into three independent tracks: (1) the **server actions** — add `currency` field to Zod schemas, call `getOrFetchExchangeRate`, compute the three stored values; (2) the **form UI** — replace the hardcoded `$` span with a currency badge + popover, add `currency` to `FormState`, pass `baseCurrency` down, handle COP-specific input formatting; (3) the **conversion preview** — fetch rate on currency selection via a dedicated server action, multiply client-side on blur. All existing dashboard queries read only `amount` and require no changes (DATA-03 is a non-modification requirement).

The biggest implementation risk is the edit-mode flow: `updateTransaction` must detect whether `currency` or `date` actually changed compared to the stored transaction in order to decide whether to re-fetch the rate. The current action only knows what the caller sends — it needs access to the previously stored values or the caller must send explicit "changed" signals.

**Primary recommendation:** Implement in three sequenced tasks — (1) Zod + server actions, (2) form state + currency UI, (3) conversion preview. Each task is self-contained and testable independently.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Currency selector UI + popover | Browser / Client | — | Pure form interaction state; `TransactionSheet` is already `"use client"` |
| Conversion preview rendering | Browser / Client | — | Calculated client-side from already-fetched rate × typed amount; no server round-trip during typing |
| Rate fetch for conversion preview | API / Backend (Server Action) | — | `getOrFetchExchangeRate` is server-only (DB + external fetch); expose via a thin "get rate" server action |
| `createTransaction` persistence | API / Backend (Server Action) | — | `"use server"` action; calls `getOrFetchExchangeRate` and writes to Neon |
| `updateTransaction` persistence | API / Backend (Server Action) | — | Same; conditional re-fetch based on changed fields |
| Dashboard / bucket queries | Database / Storage | — | Unchanged — read `amount` column only (DATA-03) |
| `baseCurrency` propagation | Frontend Server (RSC layout) | Browser / Client (CurrencyProvider) | Layout reads `financialProfile.currency`; already in `CurrencyProvider`; `TransactionSheet` can consume via `useCurrency()` hook |

---

## Standard Stack

### Core — all already installed, zero new dependencies

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Next.js App Router | 16.1.6 | Server Actions, RSC | `"use server"` directive on action files |
| Drizzle ORM | ^0.45.1 | DB queries and inserts | Used in all existing actions |
| Zod | ^4.3.6 | Schema validation | Used in `lib/validations/transactions.ts` |
| React | 19.2.3 | Client component state | `useState`, `useEffect` in `TransactionSheet` |
| shadcn/ui Popover | already installed | Currency picker popover | Same import as date picker |

[VERIFIED: codebase grep — web/package.json and web/lib/exchange-rates.ts confirm all dependencies are present]

**Installation:** No new packages required for this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
User types amount + selects currency
        │
        ▼
TransactionSheet (client, "use client")
  ├── currency badge (Popover trigger)
  │       └── on select currency → call getExchangeRateForPreview(currency, baseCurrency, date)
  │                                  [Server Action — thin wrapper over getOrFetchExchangeRate]
  │                                  → stores rate in useState<number | null>(previewRate)
  │
  ├── amount input
  │       └── on blur → if previewRate + amount + currency ≠ baseCurrency
  │                       → compute preview = parseStoredAmount(amount) * previewRate
  │                       → render "≈ $XX.XX USD"
  │
  └── handleSubmit()
        └── calls createTransaction(payload) / updateTransaction(id, payload)
              [Server Action — "use server"]
              │
              ├── Zod.safeParse({ ..., currency })
              ├── getOrFetchExchangeRate(currency, baseCurrency, date)  ← throws on failure
              ├── compute: originalAmount = enteredAmount
              │           exchangeRate = fetched rate
              │           amount = originalAmount * exchangeRate
              └── db.insert / db.update → Neon (amount, originalAmount, exchangeRate, currency)
                        │
                        └── revalidatePath("/") + revalidatePath("/transactions")
                                  │
                                  └── Dashboard queries read `amount` only — unchanged ✓
```

### Recommended File Changes

```
web/
├── lib/
│   ├── validations/
│   │   └── transactions.ts          # add currency field to both schemas
│   ├── actions/
│   │   └── transactions.ts          # extend createTransaction + updateTransaction
│   │                                # add getExchangeRateForPreview (new thin action)
│   └── finance-utils.ts             # extend formatAmountDisplay / parseAmountInput for COP
├── components/
│   └── transaction-sheet.tsx        # currency badge, popover, preview, FormState.currency
└── types/
    └── index.ts                     # add currency, originalAmount, exchangeRate to Transaction
```

### Pattern 1: Zod Schema Extension — `z.enum` for two-currency v1

**What:** Add `currency` to both transaction schemas using `z.enum` rather than `z.string().length(3)`.
**When to use:** When the valid values are known at compile time and hardcoded (D-02: USD + COP only).
**Rationale:** `z.enum` provides exhaustive type narrowing and catches invalid currency codes at the Zod boundary. `z.string().length(3)` would accept `"XXX"`. For future expansion (Phase 4+), the enum can be widened without any DB changes.

```typescript
// Source: web/lib/validations/transactions.ts (existing pattern, extended)
const TRANSACTION_CURRENCIES = ["USD", "COP"] as const;

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["expense", "income"]),
  description: z.string().max(255).optional(),
  date: dateSchema,
  categoryId: z.string().uuid().optional(),
  currency: z.enum(TRANSACTION_CURRENCIES).default("USD"),
});
```

[VERIFIED: codebase — existing `z.enum(["expense", "income"])` pattern in `transactions.ts` line 9]

### Pattern 2: Server Action Currency Computation

**What:** After Zod parse, call `getOrFetchExchangeRate`, compute three values, and insert all of them.
**Throw path:** If `getOrFetchExchangeRate` throws, catch it in the action's `try/catch` and return `ActionResult { success: false, error: "Couldn't fetch exchange rate — please try again." }`.

```typescript
// Source: web/lib/actions/transactions.ts (existing pattern, extended)
// In createTransaction:
const { amount, type, description, date, categoryId, currency } = parsed.data;
const baseCurrency = "USD"; // read from financial profile (see note below)

let exchangeRate: number;
try {
  exchangeRate = await getOrFetchExchangeRate(currency, baseCurrency, date);
} catch {
  return { success: false, error: "Couldn't fetch exchange rate — please try again." };
}

const originalAmount = amount;
const convertedAmount = originalAmount * exchangeRate;

const result = await db
  .insert(transactions)
  .values({
    userId,
    amount: convertedAmount.toFixed(2),      // base-currency store
    originalAmount: originalAmount.toFixed(2), // as entered
    exchangeRate: exchangeRate.toString(),     // full precision string
    currency,
    type,
    description: description ?? null,
    date,
    categoryId: categoryId ?? null,
  })
  .returning();
```

[VERIFIED: codebase — `web/lib/actions/transactions.ts` existing insert pattern; `web/lib/schema.ts` column names `originalAmount`, `exchangeRate`, `currency` confirmed present]

### Pattern 3: Accessing baseCurrency in a Server Action

**What:** The server action needs to know the user's base currency to call `getOrFetchExchangeRate(from, to, date)`.
**Options:**
- **Option A (recommended):** Pass `baseCurrency` from the client form as part of the payload (validated by Zod). The form already knows it via `useCurrency()` hook. Simple, no extra DB query in the action.
- **Option B:** Re-query `getFinancialProfile()` inside the action. Adds a DB round-trip per save.

**Recommendation:** Option A — the form has `baseCurrency` from `CurrencyProvider`; include it in the Zod schema as a validated field (`z.enum(["USD", "COP"])`). This avoids an extra query and is consistent with the existing data-down pattern.

[ASSUMED] — Option A vs B is a design choice; both are valid. This recommendation aligns with the "no extra DB calls" constraint from CLAUDE.md but was not explicitly decided in CONTEXT.md.

### Pattern 4: Thin Server Action for Conversion Preview

**What:** ENTRY-03 requires a preview before save. The form needs the exchange rate client-side. Expose a thin server action that wraps `getOrFetchExchangeRate` and returns the rate (or null on failure).
**Why a server action:** `getOrFetchExchangeRate` imports Drizzle `db` — it cannot run in a browser. A thin `"use server"` wrapper is the correct bridge.

```typescript
// New export in web/lib/actions/transactions.ts
export async function getExchangeRateForPreview(
  from: string,
  to: string,
  date: string,
): Promise<{ rate: number } | { error: string }> {
  try {
    const rate = await getOrFetchExchangeRate(from, to, date);
    return { rate };
  } catch {
    return { error: "Couldn't fetch exchange rate" };
  }
}
```

[VERIFIED: codebase — `web/lib/exchange-rates.ts` is server-only; `"use server"` wrapper pattern matches existing `actions/` module structure]

### Pattern 5: FormState Extension + Currency Pre-fill in Edit Mode

**What:** Add `currency: string` to `FormState`. In `buildInitialState`, pre-fill from `transaction.currency` (for edit) or `baseCurrency` (for create).
**Edit pre-fill note:** Also use `transaction.originalAmount` (not `transaction.amount`) for the amount field in edit mode.

```typescript
// web/components/transaction-sheet.tsx — extend FormState
interface FormState {
  amount: string;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  description: string;
  selectedBucket: AllocationBucket;
  currency: string;  // NEW
}

// buildInitialState — edit path
if (mode === "edit" && transaction) {
  return {
    amount: transaction.originalAmount ?? transaction.amount ?? "",  // pre-fill original
    currency: transaction.currency ?? baseCurrency,  // pre-fill transaction currency
    // ... rest unchanged
  };
}
// create path
return {
  // ...
  currency: baseCurrency,  // default to user's base currency (D-03)
};
```

[VERIFIED: codebase — `transaction-sheet.tsx` `buildInitialState` pattern lines 131-154; `Transaction` type in `types/index.ts` currently missing `currency`/`originalAmount`/`exchangeRate` — must be added]

### Pattern 6: COP Amount Formatting

**What:** COP has 0 decimal places. The existing `formatAmountDisplay` and `parseAmountInput` in `finance-utils.ts` handle decimal separators but do not strip decimals for specific currencies.
**Approach:** Wrap both functions with a currency-aware variant, or add a `maxDecimals` parameter. The simplest approach matching the existing style:

```typescript
// Extend web/lib/finance-utils.ts
export function getCurrencyDecimals(currency: string): number {
  // COP and other zero-decimal currencies
  return currency === "COP" ? 0 : 2;
}

// In TransactionSheet — when currency is COP, strip decimal from amount state
// and use inputMode="numeric" instead of "decimal"
```

The existing `parseAmountInput` already strips non-numeric characters. For COP, additionally strip any fractional part from `normalizedValue` before storing.

[VERIFIED: codebase — `finance-utils.ts` `parseAmountInput` lines 161-195; `formatAmountDisplay` lines 142-154]

### Pattern 7: updateTransaction — Conditional Rate Re-fetch

**What:** D-05 requires re-fetching rate only if `currency` or `date` changed. The current `updateTransaction` receives only the fields the caller wants to change (partial update dict). It does not know the previously stored values.
**Problem:** The action must compare new currency/date against stored values to decide whether to re-fetch.
**Recommended approach:** Query the existing transaction at the top of `updateTransaction` before updating. This is a single row lookup by `id + userId` (already guarded by auth). If neither `currency` nor `date` is being changed in the payload, skip the query and preserve stored rate.

```typescript
// In updateTransaction — if currency or date present in payload:
const existing = await db
  .select()
  .from(transactions)
  .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  .limit(1);

if (!existing[0]) return { success: false, error: "Transaction not found" };

const newCurrency = parsed.data.currency ?? existing[0].currency;
const newDate = parsed.data.date ?? existing[0].date;
const currencyChanged = newCurrency !== existing[0].currency;
const dateChanged = newDate !== existing[0].date;

if (currencyChanged || dateChanged) {
  // re-fetch rate and recompute amount
} else {
  // preserve existing rate; update only the non-currency fields
}
```

[VERIFIED: codebase — `updateTransaction` lines 61-113; existing select pattern from `web/lib/queries/financial-profile.ts`]

### Anti-Patterns to Avoid

- **Silently falling back to rate 1.0 on API failure:** CONTEXT.md discretion is explicit — block and show error. The dashboard would show wrong totals if a 1.0 fallback were silently used for a COP transaction.
- **Debouncing a server action per keystroke for the preview:** The UI-SPEC confirmed fetch-on-currency-selection + calculate-on-blur. Per-keystroke server calls would consume the 1,500 req/month budget rapidly.
- **Calling `getOrFetchExchangeRate` inside a client component:** It imports Drizzle `db` — cannot run in the browser. Must stay on the server.
- **Using `amount` (base-currency) for edit pre-fill:** Must use `originalAmount` — the COP value the user originally entered. Pre-filling with the USD-equivalent would confuse the user.
- **Modifying dashboard queries:** DATA-03 explicitly forbids touching existing queries. The `amount` column contract must be honored.
- **Forgetting to update `Transaction` type in `types/index.ts`:** The type currently lacks `currency`, `originalAmount`, and `exchangeRate`. All components that destructure `Transaction` will get TypeScript errors if this is skipped.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exchange rate fetch + cache | Custom fetch utility | `getOrFetchExchangeRate` from `web/lib/exchange-rates.ts` | Already implemented in Phase 2 with cache, error handling, and conflict guard |
| Currency popover | Custom dropdown/select | shadcn `Popover` + `PopoverContent` (already installed) | Same component used by date picker; consistent interaction pattern |
| Amount formatting | Currency-specific formatter | Extend existing `formatAmountDisplay` / `parseAmountInput` in `finance-utils.ts` | Already handles thousand separators and decimal separator inference |
| Rate formatting for DB insert | Custom precision handler | `rate.toString()` (existing pattern from Phase 2 PATTERNS.md) | `numeric(20,10)` column accepts string; `toFixed()` would truncate COP rate |

**Key insight:** Phases 1 and 2 built all the infrastructure this phase consumes. The correct approach is integration, not new construction.

---

## Common Pitfalls

### Pitfall 1: `Transaction` Type Mismatch

**What goes wrong:** `types/index.ts` `Transaction` type does not yet include `currency`, `originalAmount`, or `exchangeRate`. Any component that tries to read `transaction.currency` will fail TypeScript compilation.
**Why it happens:** Schema was updated in Phase 1 but the TypeScript domain type was not synchronized.
**How to avoid:** Update `Transaction` type as the FIRST task of the phase, before touching actions or components.
**Warning signs:** TypeScript error `Property 'currency' does not exist on type 'Transaction'`.

### Pitfall 2: Drizzle `numeric` Column Returns String at Runtime

**What goes wrong:** `exchangeRate`, `originalAmount`, and `amount` are `numeric` Drizzle columns. TypeScript may type them as `string`, but arithmetic on `"0.000277"` produces `NaN`.
**Why it happens:** Drizzle maps `numeric` to TypeScript `string` for precision. JavaScript `+` on two strings concatenates instead of adding.
**How to avoid:** Always wrap with `Number()` before arithmetic. `Number(row.exchangeRate) * Number(row.originalAmount)` — as already established in Phase 2 PATTERNS.md.
**Warning signs:** Preview shows `NaN`, stored `amount` is `NaN`.

### Pitfall 3: `updateTransaction` Rate Logic Requires a Pre-read

**What goes wrong:** The action receives only changed fields. Without querying the existing row, it cannot determine whether currency or date actually changed.
**Why it happens:** The partial update pattern (`updateValues` dict) doesn't carry prior state.
**How to avoid:** Query the existing transaction at the start of `updateTransaction` when `currency` or `date` appears in the payload (Pattern 7 above). Early-return with "not found" if missing.
**Warning signs:** Rate always re-fetched (unnecessary API calls) or rate never re-fetched when currency changes.

### Pitfall 4: `baseCurrency` Not Available in `TransactionSheet`

**What goes wrong:** `TransactionSheet` currently receives only `categories` as a prop (from `AppShell`). It needs `baseCurrency` to default the currency selector (D-03) and to display the conversion preview.
**Why it happens:** `AppShell` passes `categories` but not `currency` to `TransactionSheet`.
**How to avoid:** Either (a) have `TransactionSheet` call `useCurrency()` hook (already available via `CurrencyProvider` context) — preferred, no prop drilling needed; or (b) add `baseCurrency` prop. Option (a) is cleaner given the existing context.
**Warning signs:** Currency defaults to `"USD"` hardcoded instead of reading from financial profile.

### Pitfall 5: COP Amounts Stored with Decimal Places

**What goes wrong:** User enters `50000` COP; form submits `50000.00`; `amount` stored as `50000.00 * 0.000277 = 13.85`. This is correct. But if the decimal stripping is skipped and user somehow enters `500.50` COP, the conversion will be wrong.
**Why it happens:** `parseAmountInput` doesn't strip decimals for zero-decimal currencies by default.
**How to avoid:** When `currency === "COP"`, strip the fractional part from `normalizedValue` before setting form state. Use `inputMode="numeric"` on mobile to prevent decimal keyboard.

### Pitfall 6: Edit Mode Sends Stale Rate on No-Change Update

**What goes wrong:** User opens an old COP transaction, changes only the description, and saves. The action re-fetches the rate for the original date and may get a different rate than what was stored (rates can differ by fractions depending on API data). The `amount` gets silently recomputed.
**Why it happens:** Naive implementation always re-fetches if `currency` is present in the payload.
**How to avoid:** D-05 specifies "re-fetch only if `currency` OR `date` changes". Only include `currency` in the update payload when the user actually changes it. Or compare incoming values to stored values (Pattern 7).

---

## Code Examples

### Complete `createTransaction` with currency (condensed)

```typescript
// Source: web/lib/actions/transactions.ts (to be modified)
// "use server" already present at top of file

export async function createTransaction(
  formData: unknown,
): Promise<ActionResult<Transaction>> {
  const { userId } = await getAuthenticatedUser();

  const parsed = createTransactionSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", issues: parsed.error.issues };
  }

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
        amount: convertedAmount.toFixed(2),
        originalAmount: originalAmount.toFixed(2),
        exchangeRate: exchangeRate.toString(),
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
}
```

### Updated `Transaction` type

```typescript
// Source: web/types/index.ts (to be modified)
export type Transaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;           // base-currency value (existing)
  type: TransactionType;
  description: string | null;
  date: string;
  currency: string;         // NEW — ISO 4217 code (e.g. "USD", "COP")
  originalAmount: string;   // NEW — amount as entered in transaction currency
  exchangeRate: string;     // NEW — Drizzle numeric → string at runtime
  createdAt: Date;
  updatedAt: Date;
};
```

### `getExchangeRateForPreview` server action

```typescript
// Source: new export in web/lib/actions/transactions.ts
export async function getExchangeRateForPreview(
  from: string,
  to: string,
  date: string,
): Promise<{ rate: number } | { error: string }> {
  // Auth check not strictly required — rate is not user-specific — but consistent with pattern
  await getAuthenticatedUser();
  try {
    const rate = await getOrFetchExchangeRate(from, to, date);
    return { rate };
  } catch {
    return { error: "Couldn't fetch exchange rate" };
  }
}
```

### Conversion preview in TransactionSheet (client-side)

```typescript
// In TransactionSheet (client component)
const [previewRate, setPreviewRate] = useState<number | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);

// Called when user selects a currency from the popover
async function handleCurrencySelect(newCurrency: string): Promise<void> {
  updateField("currency", newCurrency);
  if (newCurrency === baseCurrency) {
    setPreviewRate(null);
    return;
  }
  setPreviewLoading(true);
  const result = await getExchangeRateForPreview(newCurrency, baseCurrency, form.date);
  setPreviewLoading(false);
  if ("rate" in result) {
    setPreviewRate(result.rate);
  } else {
    setPreviewRate(null);
    setError("Couldn't fetch exchange rate — please try again.");
  }
}

// Preview calculation (called on amount blur, no server call)
const previewAmount =
  previewRate !== null && parseStoredAmount(form.amount) > 0
    ? parseStoredAmount(form.amount) * previewRate
    : null;

// Render
{form.currency !== baseCurrency && (
  <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums text-center mt-2">
    {previewLoading
      ? "Fetching rate…"
      : previewAmount !== null
        ? `≈ ${formatCurrency(previewAmount, baseCurrency)}`
        : null}
  </p>
)}
```

---

## State of the Art

| Old Approach | Current Approach | Impact for This Phase |
|--------------|------------------|----------------------|
| Hardcoded `$` prefix in amount area | Tappable currency badge replacing `<span>$</span>` | Replace line 299-305 in `transaction-sheet.tsx` |
| `amount` only — single stored value | `amount` (base) + `originalAmount` + `exchangeRate` + `currency` | Schema already updated in Phase 1; actions need to write all four |
| `createTransaction` accepts `amount` | Now accepts `amount` (original) + `currency` + `baseCurrency` | Zod schema + action logic change |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Passing `baseCurrency` as part of the form payload (Option A, Pattern 3) is preferred over re-querying financial profile in the server action | Architecture Patterns — Pattern 3 | If wrong: add a `getFinancialProfile()` call inside both `createTransaction` and `updateTransaction` — low risk, adds one DB round-trip per save |
| A2 | `useCurrency()` hook is the right way to get `baseCurrency` inside `TransactionSheet` (rather than adding a new prop) | Common Pitfalls — Pitfall 4 | If wrong: add `baseCurrency: string` prop to `TransactionSheetProps` and thread it through `AppShell` — minor refactor |

---

## Open Questions (RESOLVED)

1. **How to expose `baseCurrency` to the form payload for the server action**
   - What we know: `CurrencyProvider` context already has `currency` (the user's base currency); `TransactionSheet` is `"use client"` so it can call `useCurrency()`.
   - What's unclear: Whether to include `baseCurrency` in the Zod schema + payload (readable by the server action) or always re-query it in the action.
   - RESOLVED: Include as a validated field in the Zod payload (Option A). Simple, no extra query. `z.enum(SUPPORTED_CURRENCIES)` at the server boundary ensures the server never trusts a spoofed value.

2. **Edit mode: when does the form know that currency or date changed?**
   - What we know: `updateTransaction` needs to detect changes (D-05). The client knows both old and new values.
   - What's unclear: Whether the action should do the comparison (requires a DB pre-read) or the client should only send `currency`/`date` when they actually changed.
   - RESOLVED: Action does the pre-read for safety — client-side "change detection" is unreliable if the sheet re-opens with stale state. Single `db.select().where(id + userId).limit(1)` before update.

---

## Environment Availability

Step 2.6 SKIPPED — this phase is code/config changes only. All external dependencies (`getOrFetchExchangeRate`, Neon DB, fawazahmed0 CDN) were validated in Phases 1 and 2. No new external dependencies introduced.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — CLAUDE.md: "No tests: No existing test framework — don't add test infrastructure as part of this milestone" |
| Config file | — |
| Quick run command | `pnpm lint && pnpm build` (type-check gate) |
| Full suite command | `pnpm lint && pnpm build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| DATA-01 | createTransaction stores all 4 currency fields | manual-only | `pnpm build` (type check) | No test framework per CLAUDE.md |
| DATA-02 | updateTransaction re-fetches on currency/date change | manual-only | `pnpm build` | Requires live DB + API |
| DATA-03 | Dashboard queries return same values | manual-only | — | Existing behavior preserved by design |
| ENTRY-01 | Currency selector defaults to base currency | manual-only | `pnpm build` | UI verification |
| ENTRY-02 | Rate fetched and amount computed before save | manual-only | `pnpm build` | Integration test |
| ENTRY-03 | Conversion preview shown while typing | manual-only | `pnpm build` | UI verification |
| ENTRY-04 | COP: no decimals, USD: 2 decimals | manual-only | `pnpm build` | Input formatting |

### Sampling Rate

- **Per task commit:** `pnpm lint` — catch TypeScript and ESLint errors early
- **Per wave merge:** `pnpm build` — full type-check and Next.js compilation
- **Phase gate:** `pnpm build` green + manual walkthrough of create/edit/preview flows before `/gsd-verify-work`

### Wave 0 Gaps

None — no test infrastructure to create (per CLAUDE.md constraint).

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `getAuthenticatedUser()` called at top of every action — existing pattern |
| V3 Session Management | no | Handled by better-auth globally |
| V4 Access Control | yes | `eq(transactions.userId, userId)` in all DB queries — existing pattern |
| V5 Input Validation | yes | Zod `safeParse` on all action inputs; `currency` validated as enum |
| V6 Cryptography | no | Not applicable to currency/amount fields |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Spoofed `baseCurrency` in payload | Tampering | Validate `baseCurrency` via `z.enum(["USD", "COP"])` in Zod schema; server re-validates even if client sends unexpected value |
| Arbitrary `currency` code passed to `getOrFetchExchangeRate` | Tampering | Zod enum validation at action boundary rejects non-whitelisted codes before rate fetch |
| Transaction belonging to different user modified | Elevation of Privilege | `eq(transactions.userId, userId)` guard in all DB writes — existing pattern, carry forward |
| Rate fetch failure silently storing wrong amount | Information Disclosure | `getOrFetchExchangeRate` throws → action returns error → no DB write — D-01 / CONTEXT.md discretion |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase] `web/lib/schema.ts` — confirmed `currency`, `originalAmount`, `exchangeRate` columns present in `transactions` table
- [VERIFIED: codebase] `web/lib/exchange-rates.ts` — confirmed `getOrFetchExchangeRate(from, to, date): Promise<number>` signature and throw-on-failure behavior
- [VERIFIED: codebase] `web/lib/actions/transactions.ts` — confirmed existing `createTransaction` / `updateTransaction` pattern
- [VERIFIED: codebase] `web/lib/validations/transactions.ts` — confirmed existing Zod schema structure
- [VERIFIED: codebase] `web/components/transaction-sheet.tsx` — confirmed `FormState`, `buildInitialState`, `handleSubmit`, and hardcoded `$` span at lines 299-305
- [VERIFIED: codebase] `web/types/index.ts` — confirmed `Transaction` type currently missing `currency`, `originalAmount`, `exchangeRate`
- [VERIFIED: codebase] `web/components/currency-provider.tsx` — confirmed `useCurrency()` hook available in all client components under `(app)` layout
- [VERIFIED: codebase] `web/app/(app)/layout.tsx` — confirmed `financialProfile.currency` is read and passed to `CurrencyProvider`

### Secondary (MEDIUM confidence)

- [CITED: .planning/phases/03-data-layer-integration/03-CONTEXT.md] — all locked decisions D-01 through D-06
- [CITED: .planning/phases/03-data-layer-integration/03-UI-SPEC.md] — interaction contract, copywriting, component inventory
- [CITED: .planning/phases/02-exchange-rate-service/02-PATTERNS.md] — confirmed numeric-to-string patterns and error handling conventions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in codebase; no new dependencies
- Architecture: HIGH — all integration points verified by reading source files
- Pitfalls: HIGH — derived from actual code analysis, not speculation
- Patterns: HIGH — derived from existing project patterns (PATTERNS.md + source files)

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable codebase; no external library changes needed)
