# Phase 1: Provider Validation and Schema Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 01-provider-validation-and-schema-foundation
**Areas discussed:** Validation Artifact, original_amount Nullability

---

## Validation Artifact

| Option | Description | Selected |
|--------|-------------|----------|
| Script + STATE.md note | One-off Node.js/curl script hitting both APIs; outcome documented in STATE.md Key Decisions. Script disposable. | ✓ |
| Inline comment in exchange-rates.ts | Validation runs manually; documented as a comment in lib/exchange-rates.ts (Phase 2 file). | |
| Markdown ADR file | Architecture Decision Record in .planning/decisions/. Permanent artifact. | |

**User's choice:** Script + STATE.md note
**Notes:** Script is disposable — just needs to run and confirm. Outcome goes in STATE.md Key Decisions.

---

## Validation Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Frankfurter only — stop if it works | Test Frankfurter first; only test fawazahmed0 if Frankfurter fails. | ✓ |
| Both in one pass | Script hits both APIs side by side for comparison. | |

**User's choice:** Frankfurter only — stop if it works
**Notes:** Preference is Frankfurter; fawazahmed0 is only tested if needed.

---

## original_amount Nullability

| Option | Description | Selected |
|--------|-------------|----------|
| Copy from amount — NOT NULL | DEFAULT original_amount = amount for existing rows. All rows clean and non-null. | ✓ |
| Nullable — NULL for old rows | original_amount allows NULL. Old rows stay NULL; app code must handle NULLs. | |

**User's choice:** Copy from amount — NOT NULL
**Notes:** Semantically correct — for pre-migration USD transactions, original and converted amounts are the same value.

---

## Claude's Discretion

- Migration structure (single vs split file) — not discussed; planner defaults to single file
- Primary key design for `exchange_rate_cache`
- Script format (Node.js vs curl)

## Deferred Ideas

None.
