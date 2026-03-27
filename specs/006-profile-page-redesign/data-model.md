# Data Model: Profile Page Redesign

**Feature**: 006-profile-page-redesign  
**Date**: 2026-03-27

---

## Schema Changes

**None.** This feature is a pure UI/presentation redesign. No new database tables, columns, or migrations are required. No Drizzle schema changes. No `pnpm db:generate` or `pnpm db:push` needed.

---

## Existing Types Used (read-only)

All types are defined in `web/types/index.ts` and remain unchanged.

### `FinancialProfile`

```ts
type FinancialProfile = {
  userId: string;
  monthlyIncomeTarget: string;   // stored as string; parse with parseFloat() before formatCurrency()
  needsPercentage: string;       // "50", "30", etc. — parse with Number()
  wantsPercentage: string;
  futurePercentage: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Display notes for the redesign**:
- `monthlyIncomeTarget`: pass to `formatCurrency()` from `lib/finance-utils.ts`. The function accepts `string | number`.
- `needsPercentage` / `wantsPercentage` / `futurePercentage`: pass to `Number()` before using as `Progress value` prop (which expects `number`).

### `User` (from Better Auth session)

Passed as a plain object prop, not a Drizzle type:

```ts
type UserProp = {
  name: string;           // display name; use .split(" ") for initials
  email: string;
  image?: string | null;  // if null/undefined → show initials Avatar fallback
  createdAt?: string;     // ISO string; format with date-fns format(new Date(createdAt), "MMM yyyy")
};
```

**Display notes for the redesign**:
- `name`: split on `" "` for initials; take first char of each part; slice to 2 max; uppercase.
- `createdAt`: conditionally render "Member since" only when truthy (edge case: may be undefined).
- `image`: use `<AvatarImage src={image}>` when present; `<AvatarFallback>` with initials otherwise.

---

## Derived Display Values (computed in component, not stored)

| Value | Source | Derivation |
|-------|--------|------------|
| Formatted income | `profile.monthlyIncomeTarget` | `formatCurrency(profile.monthlyIncomeTarget)` |
| Initials | `user.name` | `name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()` |
| Member since | `user.createdAt` | `format(new Date(createdAt), "MMM yyyy")` via date-fns |
| Bucket color | `AllocationBucket` key | `getBucketColor(bucket)` from `lib/finance-utils.ts` |
| Bucket percentage (number) | `profile.needsPercentage` etc. | `Number(profile.needsPercentage)` |

---

## No New Server Actions or Query Functions

The existing `updateFinancialProfile` Server Action (`lib/actions/financial-profile.ts`) is used by `FinancialProfileSheet` and is unchanged. No new `lib/queries/` or `lib/actions/` files are needed for this feature.
