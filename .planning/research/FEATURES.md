# Feature Landscape: Multi-Currency Support

**Domain:** Personal expense tracker — multi-currency milestone
**Researched:** 2026-04-19
**Context:** Existing single-currency app (USD or COP base) adding per-transaction currency entry with
automatic historical rate conversion. User transacts in COP and USD. One user, no collaboration.

---

## Table Stakes

Features users expect. Missing = multi-currency feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-transaction currency selector | Every multi-currency app requires this — without it users cannot record what they actually spent | Low | Dropdown or inline selector adjacent to amount field |
| Currency selector defaults to base currency | The overwhelming majority of transactions are in base — friction if user must re-select every time | Low | Confirmed by Expenses.cash: "last used currency" also works, discussed below |
| Historical rate fetched for transaction date | Apps like Toshl and Lunch Money strongly distinguish this from "today's rate"; users trust it more | Medium | Rate must reflect the actual day of purchase, especially for backdated entries |
| Converted amount shown in transaction list | Users expect the list to be scannable in one currency — mixing raw foreign amounts breaks comprehension | Low | Show converted amount in base currency; original currency noted secondary |
| Original + converted amounts in transaction detail | Standard in every app surveyed (Toshl, Lunch Money, PocketSmith, Expenses.cash) | Low | Format: COL$50,000 → $12.50 USD — users expect both values visible |
| Exchange rate displayed in transaction detail | Needed for trust and auditability — "why did this convert to X?" | Low | Show rate as a single line: @ 4,000 COP/USD |
| Dashboard/budget totals in base currency only | All charting and summaries must collapse to one number — anything else confuses budget math | Low | No mixed-currency totals anywhere in the UI |
| Rate fetched automatically (no manual lookup) | Users will not copy-paste from Google; if they have to, the feature is broken | Medium | ExchangeRate-API historical endpoint covers this |

---

## Differentiators

Features that set the product apart. Not expected for v1, but add meaningful value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Last used currency" memory | If a user buys in COP regularly, defaulting to COP after the first COP entry saves taps and reduces friction — Expenses.cash does this | Low | Simple: store last-used currency in localStorage or user session; fall back to base currency on first use |
| Inline rate preview during entry | Show the converted amount live as user types the foreign amount (e.g., "50,000 COP = $12.50 USD") — Toshl shows this during entry | Medium | Requires rate to be available before form submit; works well if rate is cached |
| Rate freshness indicator | A subtle "rate from Apr 18, 2026" label in transaction detail tells the user the rate is historical, not today's — builds trust for backdated entries | Low | A single date-stamped label on the rate line; no extra fetch needed |
| Budget bucket impact shown during entry | "This will use $12.50 of your $200 Wants budget" — gives intent context at the moment of entry | Medium | Requires converting the amount before submit; needs cached rate |

---

## Anti-Features

Features to explicitly NOT build in this milestone. Not because they are bad ideas generally,
but because they add complexity that this single-user, historical-rate-focused app does not need yet.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Manual rate override per transaction | PROJECT.md explicitly out-of-scope; adds a reconciliation surface area, complicates data model, and is rarely used by personal trackers | Trust the automatic historical rate; Lunch Money's research confirms users accept auto rates when they are genuinely historical (not today's rate applied retroactively) |
| Real-time / sub-24h rate refresh | 1,500 req/month API budget makes this dangerous; daily rates are accurate enough for personal spending, not FX trading | 24h cache with DB storage — already decided in PROJECT.md |
| Per-currency reports or breakdowns | "How much did I spend in COP vs USD?" is an interesting question but not what this tracker is for — it tracks intent (needs/wants/future), not currency geography | All reporting stays in base currency only |
| Multi-currency account balances | This is a transaction tracker, not a net-worth tool. Accounts in foreign currencies add a separate data model (accounts, balances, reconciliation) | Keep the model: transactions only, each with a stored rate |
| Currency trend charts / rate history | Adds complexity with no direct budgeting value for this user's case | Not in scope; Pocketsmith offers this for users who need it |
| Retroactive rate correction | Rewriting historical conversions invalidates past reports and makes the data model harder to reason about | Existing transactions stay at rate 1.0 (base currency); new ones get accurate rates going forward |
| Crypto or non-ISO-4217 currencies | Non-standard codes break the ExchangeRate-API free tier and add edge-case handling | Standard fiat only (COP, USD, EUR etc.) |
| Currency auto-detection by location | Requires location permission, adds device API complexity, and the user pattern is known (COP in Colombia, USD otherwise) — not worth the infrastructure | Simple explicit selector; "last used" memory covers the common case |

---

## Feature Dependencies

```
Currency selector (per transaction)
  → Rate fetch (ExchangeRate-API, keyed on currency + date)
      → DB rate cache (24h TTL, prevents API overuse)
          → Converted amount stored on transaction row
              → Transaction list (shows converted amount)
              → Transaction detail (shows original + converted + rate + rate date)
              → Dashboard totals (sums converted amounts in base currency)
              → Budget bucket progress (sums converted amounts per bucket)
```

Inline rate preview during entry (differentiator) depends on rate cache being populated
before form submit — requires an on-change API call or pre-fetching today's rate on mount.

---

## Currency Selector Default: Last-Used vs Base Currency

This is the one UX decision with meaningful tradeoffs. Research findings:

**Base currency default:**
- Safe for most users — the majority of transactions are in base
- No state to maintain; always predictable
- Recommended when: user rarely transacts in foreign currency

**Last-used currency default:**
- Reduces tap count when batching foreign-currency entries (e.g., entering a week of COP receipts)
- Confirmed pattern in Expenses.cash
- Risk: user forgets the default is COP and enters a USD amount in COP by accident

**Recommendation for this project:** Default to base currency always. The user's pattern is
primarily USD (or COP as base), with COP (or USD) as the occasional exception. A stale
"last used" default introduces silent data entry errors that are hard to catch. The currency
selector must be visible and prominent enough that switching to COP is fast but deliberate.
If user feedback after launch shows repeated friction from re-selecting COP, add last-used
memory at that point.

---

## Exchange Rate Display: How Much to Show in Transaction Detail

Consensus from surveyed apps (Toshl, Lunch Money, Expenses.cash, Splitwise):

Minimum viable: `COL$50,000 → $12.50 USD @ 4,000`
Full transparency: `COL$50,000 → $12.50 USD @ 4,000 COP/USD (rate from Apr 18, 2026)`

The "rate from [date]" addition is low-cost and high-trust value, especially for backdated
entries where the rate used was genuinely historical. Include it. It also distinguishes
this app from tools that silently apply today's rate to old transactions — a known frustration
in Splitwise and early YNAB workarounds.

---

## Dashboard and Budget Totals: Display Rules

Across all apps surveyed, the consensus is unambiguous:

1. All aggregate numbers (budget bucket totals, remaining budgets, category totals, income vs
   expense summary) MUST display in base currency only.
2. Individual transaction rows in a list may show the original currency amount as a secondary
   label (smaller, muted) alongside the converted amount.
3. Never mix raw foreign amounts into totals — this is described as a known failure mode in
   apps like Monarch Money (which adds 1,000 JPY + $1,000 USD as if they are the same).

For the transaction list specifically, the recommended pattern is:
- Primary: converted amount in base currency (prominent)
- Secondary: original amount in foreign currency if different from base (smaller, right-aligned
  or below the primary, only shown when currency != base currency)

---

## MVP Recommendation

Prioritize (table stakes only for v1 of this milestone):

1. Schema: add `currency_code` and `exchange_rate` columns to transactions table
2. Currency selector in transaction form (defaults to base currency)
3. Rate fetch + 24h DB cache (ExchangeRate-API historical endpoint)
4. Store original currency + rate at transaction creation time
5. Transaction list: display converted amount in base currency (existing display unchanged
   for base-currency transactions; foreign transactions show converted primary)
6. Transaction detail: show original amount, arrow, converted amount, rate, rate date
7. Dashboard/budget totals: sum converted amounts (existing math unchanged for rate=1.0 rows)

Defer to post-launch:
- Inline rate preview during entry (nice, but requires extra fetch on-change)
- "Last used currency" memory (revisit after usage data)
- Rate freshness indicator in detail (low cost, could include in v1 if capacity allows)
- Budget bucket impact preview during entry (meaningful but adds round-trip complexity)

---

## Sources

- [Toshl Finance multi-currency features](https://toshl.com/currencies/) — historical rates, inline preview, dual display
- [Expenses.cash multi-currency FAQ](https://expenses.cash/faq/multi-currency) — last-used currency default behavior
- [PocketSmith multi-currency tour](https://www.pocketsmith.com/tour/multi-currency/) — native vs converted balance patterns
- [ClearSpent multi-currency features](https://www.clearspent.com/features/multi-currency) — base-currency-only aggregates
- [Lunch Money multi-currency](https://lunchmoney.app/features/multicurrency/) — historical rate storage per transaction
- [Wise Design: Money Input](https://wise.design/components/money-input) — currency selector component patterns
- [Monarch Money currency limitations](https://help.monarch.com/hc/en-us/articles/360048393552-International-Accounts-and-Currency) — cautionary tale on mixing currencies in totals
- [Workday: UX of Currency Display](https://medium.com/workday-design/the-ux-of-currency-display-whats-in-a-sign-6447cbc4fb88) — currency code clarity requirements
