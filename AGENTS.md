# Agent Guidelines - Expense Tracker

## Project Overview

Turborepo monorepo for a serverless expense tracking app with intentional spending (50/30/20 budget allocation).

**Tech Stack:**

- Frontend: Next.js 16 (App Router), React 19, shadcn/ui, Tailwind CSS
- Backend: Cloudflare Workers, Hono framework, Better Auth
- Database: Neon Postgres (serverless), Drizzle ORM
- Validation: Zod (shared schemas)
- Deployment: Cloudflare Pages (frontend), Cloudflare Workers (API)

## Commands

### Root-level Commands

```bash
# Install dependencies
pnpm install

# Development (all apps)
pnpm dev

# Build all apps
pnpm build

# Lint all packages
pnpm lint

# Type checking all packages
pnpm check-types

# Format all files
pnpm format
```

### App-specific Commands

```bash
# Frontend (apps/web)
cd apps/web
pnpm dev              # Start dev server on :3000
pnpm build            # Build for production
pnpm lint             # Lint Next.js app
pnpm check-types      # Type check

# Backend API (apps/api)
cd apps/api
pnpm dev              # Start Wrangler dev server
pnpm deploy           # Deploy to Cloudflare
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push migrations to database
pnpm db:studio        # Open Drizzle Studio
pnpm cf-types         # Generate Cloudflare bindings types

# Shared Package (packages/shared)
cd packages/shared
pnpm lint             # Lint Zod schemas
pnpm check-types      # Type check
```

### Turbo Filters

```bash
# Run command for specific package
turbo build --filter=web
turbo dev --filter=api
turbo lint --filter=@repo/shared
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled**: All TypeScript must pass strict type checking
- **No implicit any**: Always specify types explicitly
- **Array access**: Use optional chaining for array/object access (enforced by `noUncheckedIndexedAccess`)
- **Module system**: ESM only (`type: "module"` in all package.json files)
- **File extensions**: Use `.ts` for modules, `.tsx` for React components

### Imports

- **Style**: Named imports preferred over default imports
- **Zod**: Always use `import { z } from 'zod'` (not `import * as z`)
- **Order**: External packages → Internal workspace packages → Relative imports
- **Workspace packages**: Use `@repo/shared`, `@repo/eslint-config`, etc.

```typescript
// ✅ Good
import { z } from "zod";
import { createCategorySchema } from "@repo/shared";
import { db } from "../lib/db";

// ❌ Bad
import * as z from "zod"; // Don't use namespace imports for zod
```

### Formatting

- **Quotes**: Double quotes for strings in Zod schemas and JSX, single quotes acceptable elsewhere
- **Semicolons**: Required (enforced by Prettier)
- **Indentation**: 2 spaces
- **Line length**: 100 characters (soft limit)
- **Trailing commas**: Required in multi-line objects/arrays

### Naming Conventions

- **Files**: kebab-case for files (`financial-profile.ts`, `transaction-form.tsx`)
- **Components**: PascalCase for React components (`TransactionList`, `AllocationCard`)
- **Variables/Functions**: camelCase (`userId`, `calculateIncome`, `allocationBucket`)
- **Types/Interfaces**: PascalCase (`CreateTransaction`, `AllocationBucket`)
- **Constants**: SCREAMING_SNAKE_CASE for true constants (`DEFAULT_CATEGORIES`)
- **Zod Schemas**: camelCase ending in `Schema` (`createTransactionSchema`)
- **Enums**: camelCase ending in `Enum` (`allocationBucketEnum`)

### Zod Schemas (packages/shared)

- **Export schemas AND types**: Always export both the schema and inferred type
- **Error messages**: Provide user-friendly error messages in validators
- **Enums**: Use `z.enum()` for string unions, export as separate const
- **Validation**: Use `.refine()` for complex validation logic with clear error messages

```typescript
// ✅ Good
export const allocationBucketEnum = z.enum(["needs", "wants", "future"]);
export const createCategorySchema = z
  .object({
    name: z.string().min(1, "Name is required").max(50),
    type: categoryTypeEnum,
    allocationBucket: allocationBucketEnum.nullable(),
  })
  .refine(
    (data) => {
      if (data.type === "income" && data.allocationBucket !== null) {
        return false;
      }
      return true;
    },
    {
      message: "Income categories cannot have an allocation bucket",
      path: ["allocationBucket"],
    },
  );
export type CreateCategory = z.infer<typeof createCategorySchema>;
```

### Error Handling

- **API errors**: Return proper HTTP status codes (400, 401, 404, 500)
- **User-facing errors**: Provide clear, actionable error messages
- **Validation**: Use Zod for all input validation on both frontend and backend
- **Database errors**: Never expose raw database errors to users
- **Async/await**: Prefer async/await over .then() chains
- **Try-catch**: Wrap async operations in try-catch blocks

### Database (Drizzle ORM)

- **Money amounts**: Always use `numeric` type (not float/integer)
- **UUIDs**: Use `uuid` for all primary keys
- **Timestamps**: Use `timestamp` with `.defaultNow()` for created_at/updated_at
- **User scoping**: ALL queries must filter by `userId` for multi-tenant data
- **Migrations**: Never edit applied migrations, always create new ones

### React/Next.js

- **'use client'**: Mark client components explicitly
- **Server components**: Default to server components, use client only when needed
- **File structure**: Colocate components with pages when page-specific
- **shadcn/ui**: Use shadcn components for all UI elements
- **Mobile-first**: Write CSS mobile-first, use Tailwind breakpoints (sm:, md:, lg:)
- **Accessibility**: Minimum 44px touch targets, proper ARIA labels

## Critical Constraints

### Security

- ❌ Never commit secrets to git (.env files are gitignored)
- ❌ Never connect frontend directly to database (always via API)
- ❌ Never expose database connection strings to client
- ✅ All data access scoped by authenticated user ID
- ✅ Validate all inputs with Zod on both frontend and backend

### Data Integrity

- ❌ Never use floats for money (use Postgres NUMERIC type)
- ❌ Never edit already-applied database migrations
- ✅ Percentages must sum to exactly 100% (financial profiles)
- ✅ Apply migrations in order: dev → preview → prod

### Architecture

- ❌ No VPS or long-lived servers (serverless only)
- ❌ No direct database access from frontend
- ❌ No state in Cloudflare Workers (stateless functions)
- ✅ Keep Workers stateless and fast
- ✅ Use Neon HTTP driver for Cloudflare Workers compatibility

## Testing

- No test framework currently configured (MVP stage)
- Manual testing via dev servers and Drizzle Studio
- Future: Consider Vitest for unit tests, Playwright for E2E

## Environment Variables

Required for local development:

```bash
# apps/api/.env.local
DATABASE_URL=postgres://...@neon.tech/db?sslmode=require
BETTER_AUTH_SECRET=<min-32-chars-random-string>
BETTER_AUTH_URL=http://localhost:8787

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Deployment

- Frontend: Cloudflare Pages (automatic via git push)
- API: Cloudflare Workers (via `wrangler deploy`)
- Environments: dev (local), preview (PR previews), prod (production)
- Each environment has separate Neon database

## Notes for Agents

- This is an active development project implementing intentional spending (50/30/20 rule)
- Follow the implementation plan in planning conversations before making changes
- When in doubt, prefer simplicity and follow existing patterns
- Always test locally before suggesting deployment
- Mobile-first UI is critical - test on 375px viewport
