# Data Model: Financial Profile Sheet Redesign

**Phase**: 1  
**Date**: 2026-03-27

---

## Overview

This feature introduces no new persisted entities and requires no database schema changes. All additions are client-side UI state derived from existing `FinancialProfile` data. This document captures the component-level state model and the derived values that drive the new UI elements.

---

## Existing Persisted Entity (unchanged)

### `FinancialProfile` (from `types/index.ts`)

| Field | Type | Description |
|-------|------|-------------|
| `monthlyIncomeTarget` | `number` | User's target monthly income in USD |
| `needsPercentage` | `number \| string` | Percentage allocated to Needs (0–100) |
| `wantsPercentage` | `number \| string` | Percentage allocated to Wants (0–100) |
| `futurePercentage` | `number \| string` | Percentage allocated to Future (0–100) |

No fields added. No migration required.

---

## Component UI State (client-side only)

These values live in React `useState` hooks inside `FinancialProfileSheet`. Nothing is persisted unless the user saves.

| State variable | Type | Initial value | Description |
|----------------|------|---------------|-------------|
| `income` | `string` | `profile.monthlyIncomeTarget.toString()` | Raw string from the income input field |
| `buckets.needs` | `number` | `Number(profile.needsPercentage)` | Current slider value for Needs (0–100) |
| `buckets.wants` | `number` | `Number(profile.wantsPercentage)` | Current slider value for Wants (0–100) |
| `buckets.future` | `number` | `Number(profile.futurePercentage)` | Current slider value for Future (0–100) |
| `error` | `string` | `""` | Server-side error message from `updateFinancialProfile` |
| `loading` | `boolean` | `false` | True while save server action is in-flight |

---

## Derived Values (computed, no state)

These are computed inline from the state variables on every render. They drive all new visual elements.

| Derived value | Formula | Used by |
|---------------|---------|---------|
| `total` | `buckets.needs + buckets.wants + buckets.future` | Allocation bar remainder, counter label, `isValid` |
| `isValid` | `total === 100 && parseFloat(income) > 0` | Save button `disabled` prop |
| `incomeNum` | `parseFloat(income) \|\| 0` | Annual preview, bucket chip amounts |
| `annualIncome` | `incomeNum * 12` | Annual income preview label |
| `remainder` | `100 - total` (clamped display use only) | Allocation bar unfilled segment width |
| Per-bucket dollar amount | `(incomeNum * buckets[key]) / 100` | Bucket chip label (hidden when `incomeNum <= 0`) |

---

## New UI Elements and Their Data Sources

### Allocation Bar Segments

Each segment is a `div` whose `width` is `${buckets[key]}%` and `backgroundColor` is the bucket colour from `BUCKET_DEFINITIONS`. A fourth `div` for the remainder has `width: ${Math.max(0, 100 - total)}%` and is only rendered when `total < 100`. When `total > 100`, no remainder div is shown (overflow hidden by container).

### Validation Counter Label

| Condition | Text displayed | CSS colour class |
|-----------|---------------|-----------------|
| `total === 100` | `"100%"` | `text-income` |
| `total < 100` | `"−${100 - total}% remaining"` | `text-destructive` |
| `total > 100` | `"+${total - 100}% over"` | `text-destructive` |

### Bucket Chip

Rendered below each slider only when `incomeNum > 0`. Content: `formatCurrency((incomeNum * buckets[key]) / 100) + " / mo"`. Styled as a pill with `backgroundColor: ${color}18` and `color: color`.

### Annual Income Preview

Rendered below the income input only when `incomeNum > 0`. Content: `"= " + formatCurrency(incomeNum * 12) + " / year"`.

---

## Validation Rules (unchanged from existing)

| Rule | Condition | Effect |
|------|-----------|--------|
| Income required | `parseFloat(income) > 0` | Save disabled if false |
| Allocation must balance | `total === 100` | Save disabled if false |
| Sliders bounded | `min={0} max={100}` on each `<input type="range">` | Enforced by browser natively |
