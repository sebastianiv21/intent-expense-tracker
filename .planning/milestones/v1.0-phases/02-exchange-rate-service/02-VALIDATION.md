---
phase: 2
slug: exchange-rate-service
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — CLAUDE.md explicitly prohibits adding test infrastructure in this milestone |
| **Config file** | none |
| **Quick run command** | `node -e "require('./lib/exchange-rates').getOrFetchExchangeRate('USD','USD','2026-04-15').then(console.log)"` (from `web/`) |
| **Full suite command** | Manual REPL script — see Code Examples in RESEARCH.md |
| **Estimated runtime** | ~5 seconds (includes one live API call) |

---

## Sampling Rate

- **After every task commit:** Run the quick run command above to confirm the module loads without errors
- **After every plan wave:** Run the full four-scenario REPL script from RESEARCH.md
- **Before `/gsd-verify-work`:** All four success criteria must produce PASS output
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | INFRA-03, INFRA-04 | — | Currency codes normalized to uppercase before URL construction and DB key; rate validated as `number` before storage | manual | `node -e "..."` (full 4-scenario script) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure to create. CLAUDE.md prohibits adding test infrastructure in this milestone. All verification is manual REPL execution of the four success criteria.

*Existing infrastructure covers all phase requirements (manual-only).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SC-1: COP→USD returns ~0.000244 (not ~4100) | INFRA-03 | No test framework; project constraint | `node -e "require('./lib/exchange-rates').getOrFetchExchangeRate('COP','USD','2026-04-15').then(r => console.log(r, r < 0.001 ? 'PASS' : 'FAIL'))"` from `web/` |
| SC-2: Second call for same triple hits cache (no API call) | INFRA-04 | No test framework | Run SC-1, then run again and confirm same value returns immediately; check no new row inserted in DB |
| SC-3: New date inserts a row into `exchange_rate_cache` | INFRA-03 | No test framework; requires live DB | `node -e "require('./lib/exchange-rates').getOrFetchExchangeRate('COP','USD','2026-04-10').then(r => console.log(r, r > 0 ? 'PASS' : 'FAIL'))"` then verify row in Neon |
| SC-4: Same-currency returns 1.0 without I/O | INFRA-04 | No test framework | `node -e "require('./lib/exchange-rates').getOrFetchExchangeRate('USD','USD','2026-04-15').then(r => console.log(r, r === 1.0 ? 'PASS' : 'FAIL'))"` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
