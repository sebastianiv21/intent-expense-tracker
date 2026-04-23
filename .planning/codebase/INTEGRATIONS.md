# External Integrations

**Analysis Date:** 2026-04-19

## APIs & External Services

**Google OAuth:**
- Service: Google Identity (OAuth 2.0)
- Purpose: Social sign-in provider for user authentication
- SDK/Client: `better-auth` built-in `socialProviders.google` — configured in `web/lib/auth.ts`
- Auth env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Account linking enabled; Google is a trusted provider (auto-links accounts with same email)

## Data Storage

**Database:**
- Type: PostgreSQL (serverless)
- Provider: Neon (`@neondatabase/serverless ^1.0.2`)
- Connection: `DATABASE_URL` environment variable (required; throws at startup if missing — see `web/lib/db.ts`)
- Client: Drizzle ORM (`drizzle-orm/neon-serverless`), connection pooling via `Pool` from `@neondatabase/serverless`
- WebSocket support: `ws ^8.20.0` polyfill injected when `WebSocket` global is absent (Node.js environments); not needed on edge runtimes
- Schema file: `web/lib/schema.ts`
- Migration output directory: `web/drizzle/`

**File Storage:**
- None detected — no S3, GCS, or Cloudinary integration present

**Caching:**
- None detected — no Redis, Upstash, or in-memory cache layer present

## Authentication & Identity

**Auth Provider:**
- Library: `better-auth ^1.5.5`
- Server config: `web/lib/auth.ts`
- Client config: `web/lib/auth-client.ts` (browser-side React hooks/utilities)
- API route handler: `web/app/api/auth/[...all]/route.ts` (catches all auth requests via `toNextJsHandler`)
- Database adapter: `drizzleAdapter` with `pg` provider
- Strategies supported:
  - Email + password (enabled)
  - Google OAuth (enabled via `socialProviders.google`)
- Session model stored in PostgreSQL `session` table with user-agent and IP address fields
- Post-registration hook: seeds default expense/income categories for every new user (`web/lib/seed-data.ts`)
- Base URL env var: `NEXT_PUBLIC_BETTER_AUTH_URL` (used by client to resolve auth API base path)

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Datadog, or equivalent integration present

**Logs:**
- `console.error` used for auth hook failures (e.g., category seeding errors in `web/lib/auth.ts`)
- No structured logging framework detected

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in repository; Next.js + Neon serverless is compatible with Vercel, Cloudflare Pages, or any Node 20+ host

**CI Pipeline:**
- No CI configuration files detected (no `.github/workflows/`, no `Makefile`)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` — Neon PostgreSQL connection string (server-side only); validated at startup in `web/lib/db.ts`
- `GOOGLE_CLIENT_ID` — Google OAuth client ID (server-side only); used in `web/lib/auth.ts`
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret (server-side only); used in `web/lib/auth.ts`
- `NEXT_PUBLIC_BETTER_AUTH_URL` — Public base URL for the auth API (exposed to browser); used in `web/lib/auth-client.ts`

**Secrets location:**
- `.env` file at `web/` root (not committed; no `.env.example` present in repository)

## Webhooks & Callbacks

**Incoming:**
- `GET /api/auth/[...all]` and `POST /api/auth/[...all]` — better-auth wildcard handler at `web/app/api/auth/[...all]/route.ts`; handles login, logout, session refresh, OAuth callbacks, and email verification flows

**Outgoing:**
- Google OAuth callback is handled internally by better-auth; no custom outgoing webhook endpoints detected

---

*Integration audit: 2026-04-19*
