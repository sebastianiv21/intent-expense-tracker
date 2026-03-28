# Quickstart: Category Sheet Redesign

**Branch**: `009-category-sheet-redesign`

## Prerequisites

- Node.js 24, pnpm installed
- `.env` file present in `web/` with `DATABASE_URL` and auth secrets (copy from `.env.example`)

## Run Locally

```bash
cd web
pnpm install
pnpm dev
```

Navigate to **http://localhost:3000/categories** after logging in.

## Verify the Redesigned Sheet

1. Tap **"Add category"** — the bottom sheet should slide up with:
   - A bold title ("New Category") and an X button in the header
   - A live preview card below the header
   - Name input field
   - 5-column emoji grid (30 emojis, scrollable)
   - Type tabs (Expense / Income)
   - Bucket pills (Needs / Wants / Future) — visible for Expense only
   - A gradient "Create" button pinned to the footer

2. Type a name → confirm the preview card updates immediately.

3. Tap an emoji → confirm it highlights and the preview icon updates. Tap again → confirm it deselects.

4. Switch type to **Income** → confirm bucket pills disappear and preview label shows "Income".

5. Tap **X** → confirm sheet closes with no changes saved.

6. Fill all fields and tap **Create** → confirm category appears in the list.

7. Tap **Edit** on an existing category → confirm sheet opens pre-populated with current values and button reads "Update".

## Lint & Type Check

```bash
cd web
pnpm lint
npx tsc --noEmit
```

Both must exit with code 0 before merging.

## Build Verification

```bash
cd web
pnpm build
```

Must succeed with no errors.

## No Database Migrations Required

This feature has no schema changes. `pnpm db:generate` and `pnpm db:push` are not needed.
