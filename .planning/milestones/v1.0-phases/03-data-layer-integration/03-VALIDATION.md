---
phase: 3
slug: data-layer-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no test infrastructure in this project |
| **Config file** | none |
| **Quick run command** | `cd web && pnpm build` |
| **Full suite command** | `cd web && pnpm build && pnpm lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd web && pnpm build`
- **After every plan wave:** Run `cd web && pnpm build && pnpm lint`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | DATA-01 | — | N/A | build | `cd web && pnpm build` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | DATA-02 | — | N/A | build | `cd web && pnpm build` | ✅ | ⬜ pending |
| 3-01-03 | 01 | 1 | DATA-03 | — | Rate fetched only for non-base-currency | build | `cd web && pnpm build` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 1 | ENTRY-01 | — | N/A | build | `cd web && pnpm build` | ✅ | ⬜ pending |
| 3-02-02 | 02 | 1 | ENTRY-02 | — | N/A | build | `cd web && pnpm build` | ✅ | ⬜ pending |
| 3-02-03 | 02 | 2 | ENTRY-03 | — | Rate fetched on currency/date change only | build | `cd web && pnpm build` | ✅ | ⬜ pending |
| 3-02-04 | 02 | 2 | ENTRY-04 | — | N/A | build | `cd web && pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — project has no test infrastructure by design (see CLAUDE.md constraint).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| COP transaction saves correct USD equivalent | DATA-01 | No test framework; requires live DB + exchange rate API | Submit 50,000 COP transaction; verify `amount` field = 50000 / exchange_rate in DB |
| Editing currency/date re-fetches rate | DATA-02 | Requires live exchange rate service | Edit a transaction, change currency or date; verify `exchange_rate` and `amount` updated in DB |
| Base-currency transaction skips API call | DATA-03 | Requires observing API call suppression | Submit USD transaction; verify `exchange_rate = 1.0` and no external API request logged |
| Currency selector defaults to base currency | ENTRY-01 | UI behavior — requires browser | Open transaction form; verify currency dropdown shows user's base currency |
| Live conversion preview updates on amount blur | ENTRY-02 | UI behavior — requires browser | Type amount, blur field; verify conversion preview updates |
| Edit mode pre-populates currency/amount | ENTRY-03 | UI behavior — requires browser | Open edit sheet; verify currency field and original amount are pre-populated |
| Amount formatting per currency | ENTRY-04 | UI behavior — requires browser | Select COP, type amount; verify no decimal places shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
