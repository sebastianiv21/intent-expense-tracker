# Phase 3: Data Layer Integration - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire multi-currency support into the existing transaction form (`TransactionSheet`) and the
`createTransaction` / `updateTransaction` server actions. A currency selector is added to the
form, the server actions accept a `currency` field, fetch the historical rate via
`getOrFetchExchangeRate`, and persist all five currency-related columns correctly. Existing
dashboard, bucket, and aggregation queries are **not touched** — they read `amount` which
always stores the base-currency value.

**Phase 4 owns display:** transaction list and detail views showing original vs. converted
amounts. This phase only handles entry and persistence.

</domain>

<decisions>
## Implementation Decisions

### Currency Selector — Form UI

- **D-01:** The hardcoded `$` prefix in the amount area is replaced by a tappable currency
  badge. The badge shows the currency code (`USD` or `COP`), not a localized symbol
  (e.g. not `$` / `COL$`). Tapping the badge opens a **popover** (same pattern as the
  existing date picker in the form).
- **D-02:** The currency list is **USD + COP only** (hardcoded). No scrollable 30-currency
  list — the app is used exclusively in these two currencies. This can be expanded later
  without schema changes.
- **D-03:** New transactions always default to the **user's base currency** (read from
  `financialProfile.currency`, typically `USD`). The form does NOT remember the last-used
  currency across sessions.

### Server Actions

- **D-04:** `createTransaction` accepts a `currency` field. The action calls
  `getOrFetchExchangeRate(currency, baseCurrency, date)` to get the rate, then computes:
  - `original_amount` = the amount the user entered (in `currency`)
  - `exchange_rate` = the fetched rate
  - `amount` = `original_amount * exchange_rate` (base-currency value, stored in the
    existing `amount` column — all dashboard queries continue to read this unchanged)
- **D-05:** `updateTransaction` re-fetches the exchange rate whenever `currency` **or**
  `date` changes. If neither changes, the stored rate is preserved as-is (no unnecessary
  API calls).
- **D-06:** For same-currency transactions (`currency === baseCurrency`),
  `getOrFetchExchangeRate` returns `1.0` immediately (Phase 2 D-06) — `original_amount =
  amount`, `exchange_rate = 1.0`. No API call or DB lookup.

### Claude's Discretion

- **Conversion preview (ENTRY-03):** "≈ $12.50 USD" preview while typing COP amounts.
  Timing (debounced vs. on-blur), loading state, and whether to use a server action or
  client-side calculation are left to the planner. Preference: keep it simple — a
  server-side rate lookup triggered on currency selection + amount blur is acceptable;
  real-time debounce while typing is a nice-to-have.
- **Edit form pre-fill:** When editing a saved COP transaction, pre-fill the form with
  `original_amount` (the amount the user originally typed in COP), not the converted
  base-currency `amount`. This is the semantically correct default — planner confirms.
- **Rate fetch failure:** If `getOrFetchExchangeRate` throws (CDN unreachable), surface an
  error message in the form and block the save. Do NOT silently fall back to rate 1.0.
  Error message: "Couldn't fetch exchange rate — please try again." Same error-handling
  pattern already used in the form (`setError`).
- **COP amount formatting (ENTRY-04):** COP amounts have no decimal places; USD uses 2.
  The existing `parseAmountInput` / `formatAmountDisplay` utilities in `finance-utils.ts`
  already handle decimal separators — extend or wrap them for per-currency decimal rules.
- **Zod schema updates:** `createTransactionSchema` and `updateTransactionSchema` in
  `lib/validations/transactions.ts` need a `currency` field — `z.string().length(3)` or
  `z.enum(["USD", "COP"])`. Planner decides which is more future-proof.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements

- `.planning/REQUIREMENTS.md` §ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04 — form requirements
- `.planning/REQUIREMENTS.md` §DATA-01, DATA-02, DATA-03 — server action requirements
- `.planning/PROJECT.md` §Key Decisions — constraints (no infra changes, 24h cache mandatory)

### Existing Code (integration points)

- `web/lib/actions/transactions.ts` — `createTransaction` and `updateTransaction` to extend
- `web/lib/validations/transactions.ts` — schemas to extend with `currency` field
- `web/lib/exchange-rates.ts` — `getOrFetchExchangeRate(from, to, date)` — call from actions
- `web/components/transaction-sheet.tsx` — form to extend with currency badge + popover
- `web/lib/finance-utils.ts` — `parseAmountInput`, `formatAmountDisplay` — extend for COP
- `web/lib/schema.ts` — `transactions` table: `currency`, `originalAmount`, `exchangeRate`
  columns added in Phase 1; confirm column names before writing action code
- `web/lib/queries/financial-profile.ts` — read user's `financialProfile.currency` for default

### Prior Phase Context

- `.planning/phases/01-provider-validation-and-schema-foundation/01-CONTEXT.md` — D-06:
  `amount` column stays as base-currency store; column name is `original_amount`
- `.planning/phases/02-exchange-rate-service/02-CONTEXT.md` — D-01: throws on failure;
  D-06: same-currency returns 1.0 with no I/O

### No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `TransactionSheet` (`web/components/transaction-sheet.tsx`): the form to extend. The
  amount area uses a large centered input with a hardcoded `$` span — this span becomes
  the tappable currency badge. The `Popover` + `PopoverContent` pattern for the date
  picker can be reused exactly for the currency picker.
- `useTransactionSheet` context (`transaction-sheet-context.tsx`): already exposes the
  open transaction for edit mode — pre-fill currency from `transaction.currency`.
- `financialProfile.currency` query (`lib/queries/financial-profile.ts`): read in layout —
  pass down as a prop to `TransactionSheet` so it knows the base currency for defaulting
  and for computing the preview.
- `getOrFetchExchangeRate` (`web/lib/exchange-rates.ts`): call directly from server actions.
  No new dependencies needed.

### Established Patterns

- Server actions use `createTransactionSchema.safeParse(formData)` → return `ActionResult<T>`.
  Extend the schema, not the action signature.
- Client-side state: `form` object with `useState<FormState>`. Add `currency: string` to
  `FormState` and `buildInitialState`.
- Error handling: `setError(null)` before submit, display via `<p role="alert">`.

### Integration Points

- `web/lib/actions/transactions.ts` — add `currency` input, `getOrFetchExchangeRate` call,
  persist `originalAmount`, `exchangeRate`, and recomputed `amount`.
- `web/components/transaction-sheet.tsx` — replace `$` span with currency badge + popover.
- `web/lib/validations/transactions.ts` — add `currency` to both schemas.
- `web/types/index.ts` — `Transaction` type needs `currency`, `originalAmount`,
  `exchangeRate` fields added to match the Phase 1 schema columns.

</code_context>

<specifics>
## Specific Ideas

- The currency badge replaces the `<span>` currently rendering `$` in the amount area.
  It should look like the existing category pills or a small rounded button — tappable on
  mobile without being visually heavy.
- The popover for currency selection can be as simple as two buttons: `USD` and `COP`,
  styled like the existing type toggle (Expense / Income) but smaller.

</specifics>

<deferred>
## Deferred Ideas

- **"Remember last-used currency"** — considered and declined. User's base currency is
  always the safe default. Can add per-session memory in a future iteration.
- **Full 30-currency list** — the financial profile supports 30 currencies. Expanding the
  transaction selector to match is a future enhancement, not v1.
- **User-configurable pinned currencies** — would require a settings screen addition;
  out of scope for this milestone.

</deferred>

---

*Phase: 03-data-layer-integration*
*Context gathered: 2026-04-22*
