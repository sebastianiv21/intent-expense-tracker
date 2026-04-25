---
phase: 1
slug: provider-validation-and-schema-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — CLAUDE.md: "No existing test framework — don't add test infrastructure as part of this milestone" |
| **Config file** | n/a |
| **Quick run command** | Manual SQL queries via Neon console or psql |
| **Full suite command** | All 5 success criteria SQL queries from phase definition |
| **Estimated runtime** | ~2 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Run the relevant manual SQL check listed in the Per-Task Verification Map
- **After every plan wave:** Run all 5 success-criteria queries from the phase definition
- **Before `/gsd-verify-work`:** All 5 queries must pass
- **Max feedback latency:** ~120 seconds (manual SQL)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | INFRA-01 | — | N/A | manual | `node -e "fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/cop.json').then(r=>r.json()).then(d=>console.log('COP/USD:',d.cop.usd))"` | n/a | ⬜ pending |
| 1-01-02 | 01 | 1 | INFRA-02, SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05 | — | N/A | manual-SQL | `SELECT currency, original_amount, exchange_rate FROM transactions LIMIT 1` | n/a | ⬜ pending |
| 1-01-03 | 01 | 1 | INFRA-02 | — | N/A | manual-SQL | `SELECT from_currency, to_currency, rate_date, rate, fetched_at FROM exchange_rate_cache LIMIT 1` | n/a | ⬜ pending |
| 1-01-04 | 01 | 1 | SCHEMA-05 | — | N/A | manual-SQL | `SELECT COUNT(*) FROM transactions WHERE exchange_rate IS NULL` (expect 0) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test infrastructure needed or permitted per CLAUDE.md. All validation is manual SQL.

*Existing infrastructure (none) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Frankfurter rejects COP; fawazahmed0 returns valid rate | INFRA-01 | One-time probe script, no test framework | Run: `node -e "fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/cop.json').then(r=>r.json()).then(d=>console.log('COP/USD:',d.cop.usd))"` — expect a number like 0.000244 |
| exchange_rate_cache table + UNIQUE index exist | INFRA-02 | DDL verification, no test framework | `SELECT * FROM exchange_rate_cache LIMIT 1` — expect empty result (no error) |
| currency column exists on transactions | SCHEMA-01 | DDL verification | `SELECT currency FROM transactions LIMIT 1` |
| original_amount column exists and not null | SCHEMA-02, SCHEMA-03 | DDL + data verification | `SELECT original_amount, exchange_rate FROM transactions LIMIT 1` |
| exchange_rate stores 0.000244 without truncation | SCHEMA-05 | Numeric precision check | `SELECT COUNT(*) FROM transactions WHERE exchange_rate IS NULL` (expect 0); also verify column type is numeric(20,10) |

---

## Validation Sign-Off

- [ ] All tasks have manual verify commands listed
- [ ] Sampling continuity: each task has a SQL command to run after commit
- [ ] Wave 0: no test infrastructure needed (project constraint)
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
