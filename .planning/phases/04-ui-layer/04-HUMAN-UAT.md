---
status: partial
phase: 04-ui-layer
source: [04-VERIFICATION.md]
started: 2026-04-23T12:00:00Z
updated: 2026-04-23T12:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. COP amount display in transaction list
expected: Amount displays as e.g. -COL$50,000 (0 decimal places, original COP amount) rather than -$12.50 USD
result: [pending]

### 2. Inline expansion toggle behavior
expected: Clicking accent-colored chevron on COP row reveals detail row showing e.g. '→ $12.50 USD · 4,098 COP/USD · Apr 19, 2026'; clicking again collapses it
result: [pending]

### 3. USD transaction regression check
expected: No chevron icon appears on USD rows; amount shows -$12.50 (2 decimal places); card appearance identical to pre-phase behavior
result: [pending]

### 4. DropdownMenu isolation from chevron
expected: Three-dot menu opens Edit/Delete correctly; chevron click does NOT open dropdown; dropdown click does NOT toggle expansion
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
