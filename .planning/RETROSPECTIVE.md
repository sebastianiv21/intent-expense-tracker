# Retrospective

Living retrospective document. One section per shipped milestone.

---

## Milestone: v1.0 — Multi-Currency

**Shipped:** 2026-04-23
**Phases:** 4 | **Plans:** 7 | **Tasks:** 11
**Timeline:** 15 days (2026-04-08 → 2026-04-23) | **Commits:** ~95

### What Was Built

1. **Schema + provider validation** — fawazahmed0 CDN confirmed for COP support; `currency`, `original_amount`, `exchange_rate` columns added to `transactions`; `exchange_rate_cache` table created with 24h-scoped UNIQUE index; existing rows backfilled to USD @ 1.0
2. **Exchange rate service** — `getOrFetchExchangeRate(from, to, date)` with cache-first lookup, CDN fallback, same-currency shortcut, and race-safe upsert
3. **Data layer** — `createTransaction` / `updateTransaction` extended to accept currency, fetch historical rate, persist all 5 multi-currency fields; Zod schemas updated; existing dashboard queries untouched
4. **Transaction entry UI** — tappable currency badge (COP/USD popover), live conversion preview, per-currency decimal input handling, edit-mode `originalAmount` pre-fill
5. **Display layer** — `getCurrencyDecimals` hoisted and wired into formatter (0 decimals for COP); `TransactionItem` shows original COP amounts with accent chevron that expands to reveal base amount + rate + date

### What Worked

- **Strict sequential phase dependencies** — each phase built on a proven foundation; no rework from phase 1 failures rippling forward
- **Wave-based parallel execution** — Wave 1 and Wave 2 within phases ran in isolated worktrees; no merge conflicts across any wave
- **Code review gate catching real bugs** — WR-01 (division-by-zero on `invertedRate`), WR-02 (incomplete zero-decimal currency set), WR-03 (compact formatter inconsistency) were all real issues caught before human verification
- **Plan-level acceptance criteria** — precise grep-verifiable criteria in each PLAN.md made executor agents reliable and verification deterministic
- **`isForeign` as single control boolean** — all conditional display logic flows from one derived value; easy to reason about and test

### What Was Inefficient

- **ROADMAP.md progress table not auto-updating** — the progress table showed "Not started" for all phases even after completion; required manual fix at milestone close
- **`pnpm build` DATABASE_URL error** — executors couldn't run a true build check in the worktree environment (missing env vars); TypeScript `tsc --noEmit` was a reliable substitute but not identical
- **Phase 1 one-liners missing** — `summary-extract` couldn't parse phases 01-01 and 01-02 SUMMARY.md (different section structure); accomplishments had "One-liner:" blanks in the milestone CLI output

### Patterns Established

- `formatCurrency as formatCurrencyRaw` alias pattern for avoiding name collision with `useCurrency().formatCurrency`
- `ZERO_DECIMAL_CURRENCIES` Set as the single source of truth for ISO zero-decimal currencies (not single-currency `=== "COP"` checks)
- `isForeign = transaction.currency !== baseCurrency` as the canonical foreign-currency guard throughout UI components
- Chevron button isolated from outer card — no `onClick` on the card `div`; only the `Button` handles interaction
- `pl-[52px]` as a documented layout exception (40px icon + 12px gap) for aligning detail rows with description column

### Key Lessons

- **Verify env-dependent build checks early** — if the build requires `DATABASE_URL`, set up a `.env.test` stub in the worktree so executors can run `pnpm build` instead of falling back to `tsc --noEmit`
- **Zero-decimal currency handling is a set, not a comparison** — the moment you add a second zero-decimal currency, `=== "COP"` becomes a latent bug; start with a Set
- **UI acceptance criteria must be grep-verifiable** — "chevron renders correctly" is unverifiable; "file contains `aria-expanded={expanded}`" is atomic and deterministic

### Cost Observations

- Model: claude-sonnet-4-6 throughout
- Sessions: multiple across 15 days
- Notable: wave-based worktree isolation added overhead per wave but prevented all merge conflicts

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 4 |
| Plans | 7 |
| Timeline (days) | 15 |
| Commits | ~95 |
| Code review issues caught | 5 (0 critical, 3 warning, 2 info) |
| Verification gaps (human) | 4 (all approved) |
| Rework cycles | 0 |
