# Quickstart: Dashboard Hero Card and List Pattern Consistency

**Feature**: 013-dashboard-hero-redesign
**Date**: 2026-03-28

## Overview

This is a UI-only redesign of the dashboard page (`web/app/(app)/page.tsx`). No backend changes, migrations, or new dependencies required.

## Prerequisites

- Node.js 24
- pnpm
- Existing development environment setup

## Implementation Order

1. **Create HeroBalanceCard component** (`web/components/hero-balance-card.tsx`)
   - Primary color background with gradient overlay
   - Balance amount (large, prominent)
   - Income/expenses as supporting text
   - Quick stats row (border-top separator)

2. **Update dashboard page** (`web/app/(app)/page.tsx`)
   - Replace plain Card with HeroBalanceCard
   - Add date grouping to recent transactions
   - Apply rounded-xl card styling to recurring items

3. **Verify**
   - Run `pnpm lint`
   - Run `pnpm build`
   - Visual test on mobile (375px) and desktop viewports

## Files Modified

| File | Change |
|------|--------|
| `web/components/hero-balance-card.tsx` | Created |
| `web/app/(app)/page.tsx` | Updated |

## Rollback

Single commit revert: `git revert HEAD` after implementation.
