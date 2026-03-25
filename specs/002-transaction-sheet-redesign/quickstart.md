# Quickstart: Redesign Transaction Entry Sheet UI

**Date**: 2026-03-25  
**Branch**: `002-transaction-sheet-redesign`

## Prerequisites

- Node.js 24, pnpm installed
- `.env` file present at `web/.env` with `DATABASE_URL` and `BETTER_AUTH_SECRET`

## Run the Dev Server

```bash
cd web
pnpm dev
```

Open http://localhost:3000, sign in, and tap the "+" floating action button or the "+" in the bottom nav to open the transaction sheet.

## Validate the Redesign

Work through each acceptance scenario manually:

**Expense flow (happy path):**
1. Open the sheet — verify "Needs" bucket is pre-selected and a category pill is already selected.
2. Tap the amount field — verify the mobile keyboard opens and the amount is displayed large and centered.
3. Tap "Wants" — verify the category list refreshes and the previous category selection is cleared.
4. Tap a category pill — verify it becomes visually highlighted.
5. Tap "Add" — verify the sheet closes and the transaction appears in the list.

**Income flow:**
1. Open the sheet and tap "Income" — verify the intent bucket row disappears.
2. Verify the category list now shows income categories only.
3. Submit — verify the transaction is saved with type "income" and no intent bucket.

**Validation:**
1. Clear the amount field and tap "Add" — verify submission is blocked with an inline error.

**Edit flow:**
1. Tap an existing transaction — verify the sheet opens pre-filled with the correct bucket and category selected.

## Lint & Build Check

```bash
cd web
pnpm lint
pnpm build
```

Both must pass before merging to `main`.
