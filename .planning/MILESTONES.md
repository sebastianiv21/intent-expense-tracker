# Milestones

## v1.0 Multi-Currency (Shipped: 2026-04-23)

**Phases completed:** 4 phases, 7 plans, 11 tasks

**Key accomplishments:**

- One-liner:
- One-liner:
- Cache-first exchange rate lookup against Neon's exchange_rate_cache table, falling back to fawazahmed0 CDN on miss, with same-currency shortcut and race-safe insert
- Multi-currency persistence wired: createTransaction fetches live exchange rates and stores originalAmount, exchangeRate, currency, and base-converted amount; updateTransaction conditionally re-fetches on currency/date change
- Multi-currency UI wired into TransactionSheet: tappable currency badge (USD/COP popover), live conversion preview, per-currency decimal handling, edit-mode originalAmount pre-fill, and currency+baseCurrency in submit payload
- `getCurrencyFormatter` now delegates decimal places to `getCurrencyDecimals(currency)`, making COP format as `COL$50,000` (0 decimals) while USD remains `$1.00` (2 decimals)
- TransactionItem now shows COP transactions in original pesos (e.g., -COL$50,000) with an accent-colored chevron that expands to reveal base-amount, inverted rate, and date; USD transactions are visually unchanged

---
