# Quickstart: Core MVP

**Branch**: `001-core-mvp` | **Date**: 2026-03-15

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL database (Neon Serverless account)
- Google OAuth credentials (for social login)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> intent-expense-tracker
cd intent-expense-tracker
pnpm install
```

### 2. Environment variables

Create `.env.local` at project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
BETTER_AUTH_SECRET=<generate-a-random-secret>
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### 3. Database setup

```bash
pnpm db:generate   # Generate migrations from lib/schema.ts
pnpm db:push       # Push schema to database
```

To inspect the database visually:

```bash
pnpm db:studio     # Opens Drizzle Studio
```

### 4. Run development server

```bash
pnpm dev
```

App available at `http://localhost:3000`.

## User Flow Verification

### Auth flow

1. Navigate to `http://localhost:3000/login`
2. Click "Create account" → register with email/password
3. Verify redirect to `/onboarding`
4. Enter monthly income and allocation percentages
5. Verify redirect to dashboard (`/`)

### Transaction flow

1. Tap the FAB (+ button) on the dashboard
2. Enter amount, select type, pick category, set date
3. Save → verify transaction appears in list
4. Navigate to `/transactions` → verify search and filters work

### Budget flow

1. Navigate to `/budgets`
2. Create a budget for a category
3. Add transactions for that category
4. Verify spending progress updates

### Insights flow

1. Navigate to `/insights`
2. Verify donut chart shows 50/30/20 allocation
3. Toggle date ranges → verify data updates

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build (also type-checks) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |

## Project Entry Points

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/onboarding/page.tsx` | Onboarding page |
| `app/(app)/page.tsx` | Dashboard (home) |
| `lib/schema.ts` | Database schema (source of truth) |
| `lib/auth.ts` | Better Auth server config |
| `lib/api-client.ts` | Typed API client |
| `lib/api-utils.ts` | Auth/validation middleware |

## Validation Checklist

- [ ] Registration with email/password works
- [ ] Google OAuth login works
- [ ] Onboarding saves financial profile
- [ ] Onboarding guard redirects users without profile
- [ ] Default categories seeded on registration (18 total)
- [ ] Transaction CRUD works via bottom sheet
- [ ] Transaction list shows search, filters, infinite scroll
- [ ] Dashboard shows balance, harmony cards, recent transactions
- [ ] Category CRUD works with bucket assignment
- [ ] Budget creation and spending tracking works
- [ ] Recurring transactions create/pause/resume works
- [ ] Insights charts render with correct data
- [ ] All pages responsive (mobile/tablet/desktop)
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
