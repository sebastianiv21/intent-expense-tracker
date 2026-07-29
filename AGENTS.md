# Intent Expense Tracker

A personal finance tracker built around the 50/30/20 budgeting rule (Needs / Wants / Future).
Users log income and expenses, assign categories to allocation buckets, and track budgets,
recurring transactions, and insights against per-user bucket percentages.

## Layout

The entire application lives in `web/` — a single Next.js App Router project. **There is no root
`package.json`**; run every command from `web/`.

`docs/` holds hand-written product documentation (PRD, tech stack, data model, API spec, UI
views). `README.md` covers setup, environment variables, and the project tree. Prefer reading
those over duplicating their contents here.

## Running it

Node 20, pnpm.

```bash
cd web
pnpm install
pnpm dev      # dev server
pnpm build    # production build
pnpm lint     # eslint
pnpm test     # vitest, single run
```

Database scripts (`db:push`, `db:migrate`, `db:generate`, `db:studio`) and the full script list
are in `web/package.json`. `DATABASE_URL` is validated at startup in `web/lib/db.ts`, so most
commands need a configured `.env.local`.

## Conventions

- Component and module files are `kebab-case.tsx` / `kebab-case.ts`; components themselves are
  `PascalCase`.
- **Named exports only**, except page/layout files in `app/`, which use `export default`.
- `@/` is the path alias for the `web/` root. Internal imports always use it — no relative
  imports.
- `"use client"` on any interactive component; `"use server"` as the first line of every file in
  `lib/actions/`. Never mix the two in one file.

### Server actions and queries

- Every server action returns `ActionResult<T>` (`types/index.ts`) — a discriminated union of
  `{ success: true, data?: T }` and `{ success: false, error: string, issues?: ZodIssue[] }`.
  Actions never throw to the client.
- Validate input with a Zod `safeParse` (schemas in `lib/validations/`) before any DB write, and
  return early on failure.
- `getAuthenticatedUser()` from `lib/queries/auth.ts` is called at the top of every query and
  action; it redirects to `/login` when there is no session.
- Reads live in `lib/queries/` and are called directly from Server Components — there is no API
  layer for reads. Writes go through `lib/actions/` and call `revalidatePath()` only after a
  confirmed successful write.

### Tests

Vitest, in `web/tests/`, one `*.test.ts` per module under test. Node environment, no DOM and
no database — anything that needs `lib/db.ts` either gets the pure part extracted (see
`lib/recurring-schedule.ts`) or mocks `@/lib/db`. CI runs `pnpm test` between typecheck and
build.

### Code style

No Prettier config; ESLint (`web/eslint.config.mjs`) is the only formatter of record. Keep
comments lean — document intent or a deliberate hack, not what the code already says.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
