# Phase 2: Exchange Rate Service - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 02-exchange-rate-service
**Areas discussed:** API failure behavior

---

## API Failure Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Throw an error | Propagate failure to caller — transaction creation fails with clear error, no silent bad data | ✓ |
| Return null | Caller checks for null and decides; more flexible but adds null-handling in Phase 3 | |
| Fall back to stale cache | Return newest cached rate for same currency pair — silently degrades with approximate rate | |

**User's choice:** Throw an error

---

## Retry Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fail immediately | Simple, predictable — no retry logic | ✓ |
| Retry once with fallback CDN | Try jsDelivr then Cloudflare on failure; only throw if both fail | |

**User's choice:** Fail immediately — no retries

---

## Claude's Discretion

- CDN fallback strategy — user chose not to discuss; planner defaults to single endpoint (jsDelivr primary only)
- Rate direction handling — deferred; assume native from→to direction only
- Verification approach — deferred; planner to include manual REPL check for success criteria

## Deferred Ideas

- CDN retry/fallback: considered and deferred — fail immediately chosen
- Return null: considered and rejected in favor of throwing
- Stale cache fallback: considered and rejected to avoid silent bad data
- Reverse direction (USD→COP via 1/rate): not discussed — Phase 3 to clarify if needed
