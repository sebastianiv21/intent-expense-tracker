# Requirements: Intent Expense Tracker — Multi-Currency Milestone

**Defined:** 2026-04-19
**Core Value:** Every transaction is recorded in the currency it was actually made in, with accurate historical conversion, so totals always reflect true spending in the user's preferred currency.

## v1 Requirements

### Infrastructure & API

- [ ] **INFRA-01**: System validates that the selected exchange rate provider (Frankfurter) supports COP before any other code is written; fallback to fawazahmed0/exchange-api if not
- [ ] **INFRA-02**: Exchange rate cache table exists in DB with `(from_currency, to_currency, rate_date)` as unique key
- [ ] **INFRA-03**: Exchange rate service fetches from Frankfurter API for the exact date of the transaction and stores result in cache
- [ ] **INFRA-04**: Rate cache lookup returns cached rate if it exists for that `(from, to, date)` triple; only calls external API on miss

### Schema

- [ ] **SCHEMA-01**: `transactions` table has `currency varchar(3) NOT NULL DEFAULT 'USD'` (existing rows default to base currency)
- [ ] **SCHEMA-02**: `transactions` table has `original_amount numeric(12,2)` (the amount as entered by the user in the transaction's currency)
- [ ] **SCHEMA-03**: `transactions` table has `exchange_rate numeric(20,10)` (1 unit of transaction currency in base currency units; existing rows default to 1.0)
- [ ] **SCHEMA-04**: `exchange_rate_cache` table exists with columns: `from_currency`, `to_currency`, `rate_date`, `rate numeric(20,10)`, `fetched_at`
- [ ] **SCHEMA-05**: Drizzle migration includes DEFAULT values for new columns so existing transactions are treated as base-currency at 1:1 rate

### Transaction Entry

- [ ] **ENTRY-01**: Transaction form includes a currency selector alongside the amount field, defaulting to the user's configured base currency
- [ ] **ENTRY-02**: Amount is entered in the selected transaction currency; the system auto-fetches the rate and computes the base-currency amount before saving
- [ ] **ENTRY-03**: Transaction form shows a real-time preview of the converted amount while the user types (e.g., "≈ $12.50 USD" while entering 50,000 COP)
- [ ] **ENTRY-04**: Amount input formats intelligently per currency (COP: no decimals, whole numbers; USD: 2 decimal places)

### Data Layer

- [ ] **DATA-01**: `createTransaction` server action accepts `currency` and stores `original_amount`, `exchange_rate`, and base-currency `amount` (converted)
- [ ] **DATA-02**: `updateTransaction` server action re-fetches exchange rate and recomputes `amount` if `currency` or `date` changes
- [ ] **DATA-03**: All existing dashboard, bucket, and aggregation queries remain unchanged (they read the `amount` column which is always in base currency)

### Display

- [ ] **DISP-01**: Transaction list shows the original-currency amount for transactions where `currency ≠ base_currency` (e.g., COL$50.000 instead of $12.50)
- [ ] **DISP-02**: Transaction detail view shows: original amount, converted base-currency amount, exchange rate, and rate date (e.g., COL$50.000 → $12.50 USD @ 4,000 COP/USD · 2026-04-19)
- [ ] **DISP-03**: Currency formatters respect each currency's conventions: COP displays with 0 decimal places and correct compact thresholds; USD displays with 2 decimal places

## v2 Requirements

### Advanced Display

- **ADV-01**: Transaction list always shows both original amount and base-currency equivalent side by side
- **ADV-02**: Per-currency subtotals in reports/dashboard (e.g., "COP spending this month: COL$850,000 = $207.31 USD")

### Rate Management

- **RATE-01**: Manual exchange rate override per transaction (user can correct the auto-fetched rate)
- **RATE-02**: Retroactive rate correction on existing transactions (re-fetch and update stored rates)
- **RATE-03**: Rate history view showing rate trends for COP/USD over time

## Out of Scope

| Feature | Reason |
|---------|--------|
| Manual exchange rate override | Adds form complexity; historical automatic rates are accurate enough |
| Retroactive rate correction | Old data is out-of-scope to change; existing rows stay as-is |
| Per-currency dashboard breakdowns | Single converted view is sufficient for v1 |
| Real-time rate feeds (sub-24h) | Personal tracking doesn't need intraday precision |
| Crypto currency support | Non-standard fiat codes only (ISO 4217) |
| Multi-user / shared expense currency handling | App is single-user |

## Traceability

*Populated during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| SCHEMA-01 | — | Pending |
| SCHEMA-02 | — | Pending |
| SCHEMA-03 | — | Pending |
| SCHEMA-04 | — | Pending |
| SCHEMA-05 | — | Pending |
| ENTRY-01 | — | Pending |
| ENTRY-02 | — | Pending |
| ENTRY-03 | — | Pending |
| ENTRY-04 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| DISP-01 | — | Pending |
| DISP-02 | — | Pending |
| DISP-03 | — | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 19 ⚠️ (will be resolved by roadmapper)

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 after initial definition*
