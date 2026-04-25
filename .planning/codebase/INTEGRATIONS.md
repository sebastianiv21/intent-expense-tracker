# External Integrations

**Analysis Date:** 2026-04-23

## APIs & External Services

**Authentication - Social Providers:**
- Google OAuth 2.0 - Social sign-in via better-auth `socialProviders.google`
  - SDK/Client: `better-auth` 1.5.5 (built-in Google provider)
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` env vars
  - Config: `web/lib/auth.ts`
  - Account linking enabled; Google is a trusted provider (email-verified accounts can link)

**Fonts:**
- Google Fonts (via Next.js font optimization) - Plus Jakarta Sans and Geist Mono loaded at build time
  - Implementation: `next/font/google` in `web/app/layout.tsx`
  - No API key required; fonts downloaded at build time

## Data Storage

**Databases:**
- Neon PostgreSQL (serverless)
  - Connection: `DATABASE_URL` env var (Neon connection string)
  - Client: `@neondatabase/serverless` 1.0.2 — Pool-based connection via `web/lib/db.ts`
  - ORM: Drizzle ORM 0.45.1 with `drizzle-orm/neon-serverless` adapter
  - WebSocket: `ws` package polyfills WebSocket in Node.js environments; edge runtimes use native WebSocket
  - Schema: `web/lib/schema.ts`
  - Migrations: `web/drizzle/` (3 migration files; managed via `drizzle-kit`)

**File Storage:**
- Not detected — no S3, GCS, or similar integration present

**Caching:**
- None — no Redis, Upstash, or cache layer detected

## Authentication & Identity

**Auth Provider:**
- better-auth 1.5.5 — Self-hosted auth framework (no third-party auth SaaS)
  - Config: `web/lib/auth.ts`
  - Client: `web/lib/auth-client.ts` (React client using `better-auth/react`)
  - API route: `web/app/api/auth/[...all]/route.ts` — catches all auth requests via `toNextJsHandler`
  - Strategies: Email/password (enabled), Google OAuth
  - Database adapter: Drizzle adapter (`better-auth/adapters/drizzle`) with `pg` provider
  - Auth tables: `user`, `session`, `account`, `verification` (defined in `web/lib/schema.ts`)
  - Post-signup hook: Seeds default expense/income categories for new users (`web/lib/auth.ts` → `web/lib/seed-data.ts`)

**Session Management:**
- better-auth session tokens stored in the `session` table in Neon PostgreSQL
- Client-side session access via `useSession` hook exported from `web/lib/auth-client.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Datadog, or similar integration

**Logs:**
- `console.error` used for server-side errors (e.g., category seeding failures in `web/lib/auth.ts`)
- No structured logging framework

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured — no `vercel.json`, `netlify.toml`, or Dockerfile detected
- `@neondatabase/serverless` with WebSocket polyfill pattern strongly suggests Vercel (serverless functions)
- `terraform/` directory exists but contains no `.tf` files (empty placeholder)

**CI Pipeline:**
- None detected — no GitHub Actions, CircleCI, or similar configuration

## Environment Configuration

**Required env vars (see `web/.env.example`):**
- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — Session signing secret for better-auth
- `BETTER_AUTH_URL` — Server-side base URL (e.g., `http://localhost:3000`)
- `NEXT_PUBLIC_BETTER_AUTH_URL` — Client-side base URL (same value, exposed to browser)
- `GOOGLE_CLIENT_ID` — Google OAuth app client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth app client secret

**Secrets location:**
- `web/.env` file (gitignored); `web/.env.example` committed as template

## Webhooks & Callbacks

**Incoming:**
- None detected — no webhook endpoint routes beyond the auth catch-all

**Outgoing:**
- None detected — no outbound HTTP calls to third-party webhook URLs

---

*Integration audit: 2026-04-23*
