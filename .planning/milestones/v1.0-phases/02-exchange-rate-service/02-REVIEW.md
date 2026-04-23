---
phase: 02-exchange-rate-service
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - web/lib/exchange-rates.ts
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-22
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `web/lib/exchange-rates.ts`, the new exchange rate cache-and-fetch service. The overall structure is sound: same-currency shortcut is correct, cache lookup is properly keyed, `onConflictDoNothing` handles concurrent inserts, and the `Number()` coercion of the numeric column is correctly noted. Three warnings were found: an unvalidated `date` parameter that is interpolated into an external URL, a missing fetch timeout that can block a serverless function indefinitely, and a missing object-type guard on the parsed JSON before the nested property access. One info item covers a minor naming inconsistency.

---

## Warnings

### WR-01: Unvalidated `date` string interpolated into CDN URL

**File:** `web/lib/exchange-rates.ts:39`
**Issue:** The `date` parameter is accepted as `string` and interpolated directly into the fetch URL with no format validation. If a caller passes an empty string, a value like `"@latest"`, or any string that does not match `YYYY-MM-DD`, the resulting URL either silently fetches the wrong (non-historical) data or produces a 404 that is surfaced as a generic HTTP error. The comment on line 38 says "never @latest" but there is no enforcement. The same unvalidated value is also stored as the cache key, meaning one bad call can permanently poison a cache row for that currency pair.

**Fix:** Validate the format at the top of the function, alongside the same-currency shortcut:

```typescript
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function getOrFetchExchangeRate(
  from: string,
  to: string,
  date: string,
): Promise<number> {
  if (!ISO_DATE_RE.test(date)) {
    throw new Error(`Invalid date format: expected YYYY-MM-DD, got "${date}"`);
  }
  // ... rest of function
}
```

---

### WR-02: No timeout on external `fetch` call

**File:** `web/lib/exchange-rates.ts:40`
**Issue:** The `fetch` to the fawazahmed0 CDN has no `AbortController` / `signal` timeout. On Vercel (or any serverless host), a hung CDN response will hold the function open until the platform's hard timeout fires. Since this function is called from the rendering path, a stalled external request will stall the entire page render for the maximum execution duration.

**Fix:** Add a `signal` with an appropriate timeout:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

let res: Response;
try {
  res = await fetch(url, { signal: controller.signal });
} catch (err) {
  if ((err as Error).name === "AbortError") {
    throw new Error(
      `Exchange rate fetch timed out for ${normalizedFrom}/${normalizedTo} on ${date}`,
    );
  }
  throw err;
} finally {
  clearTimeout(timeoutId);
}
```

---

### WR-03: Missing runtime object-type guard before nested property access

**File:** `web/lib/exchange-rates.ts:51-53`
**Issue:** `data[fromKey]` is cast to `Record<string, number> | undefined` on line 51 without first verifying that it is actually a plain object. If the CDN returns a value for `fromKey` that is not an object (e.g., a `null`, a number, or an array), the cast silently succeeds at compile time. The `typeof ratesForFrom[toKey] !== "number"` guard on line 53 will catch the eventual `undefined` lookup, but accessing `.property` on a `null` would throw a `TypeError` instead of the descriptive error message at line 54-57.

**Fix:** Add an explicit object check before the cast:

```typescript
const rawRatesForFrom = data[fromKey];
if (
  rawRatesForFrom === null ||
  typeof rawRatesForFrom !== "object" ||
  Array.isArray(rawRatesForFrom)
) {
  throw new Error(
    `Unexpected API response shape for ${normalizedFrom} on ${date}`,
  );
}
const ratesForFrom = rawRatesForFrom as Record<string, number>;

if (typeof ratesForFrom[toKey] !== "number") {
  throw new Error(
    `Rate not found in API response for ${normalizedFrom}/${normalizedTo} on ${date}`,
  );
}
```

---

## Info

### IN-01: Function lives in `lib/` but behaves as a query — consider `lib/queries/`

**File:** `web/lib/exchange-rates.ts:9`
**Issue:** Per project conventions, async functions that read data from a data source (DB or external API) are located in `lib/queries/`. `getOrFetchExchangeRate` performs both a DB read and a DB write, making it slightly hybrid, but its primary purpose is data retrieval. Keeping it in `lib/` is not wrong, but a location like `lib/queries/exchange-rates.ts` would be more consistent with the codebase conventions and easier to discover.

**Fix:** Move the file to `web/lib/queries/exchange-rates.ts` and update the import path in any callers. No logic change required.

---

_Reviewed: 2026-04-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
