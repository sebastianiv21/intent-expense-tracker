---
phase: 4
slug: ui-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no test infrastructure (per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `pnpm lint && pnpm build` |
| **Full suite command** | `pnpm lint && pnpm build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm lint && pnpm build`
- **After every plan wave:** Run `pnpm lint && pnpm build`
- **Before `/gsd-verify-work`:** Full build must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | DISP-03 | — | N/A | manual | `pnpm build` | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | DISP-01 | — | N/A | manual | `pnpm build` | ✅ | ⬜ pending |
| 4-01-03 | 01 | 1 | DISP-02 | — | N/A | manual | `pnpm build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework install needed — CLAUDE.md explicitly forbids adding test infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| COP transaction shows COL$50.000 in list | DISP-01 | No test framework | Add COP transaction, check transaction list |
| Detail shows dual display with rate and date | DISP-02 | No test framework | Open COP transaction detail, verify full display |
| COP shows 0 decimal places throughout | DISP-03 | No test framework | Check all currency displays with COP amounts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
