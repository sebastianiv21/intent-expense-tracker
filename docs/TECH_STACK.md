# Intent - Tech Stack & Architecture

## Overview

Intent is a full-stack web application built with Next.js 16 (App Router), React 19, and PostgreSQL. It follows a mobile-first design approach with a dark theme.

---

## Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1.6 | App Router, SSR, API routes, routing |
| **React** | 19.2.3 | UI components, hooks |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **tw-animate-css** | 1.4.0 | Tailwind animation utilities |
| **Radix UI** | 1.4.3 | Accessible headless primitives |
| **shadcn/ui** | 3.8.4 | Pre-built component library (via CLI) |
| **Lucide React** | 0.563.0 | Icon library |
| **Recharts** | 3.7.0 | Data visualization / charts |
| **React Day Picker** | 9.13.2 | Date picker component |
| **class-variance-authority** | 0.7.1 | Variant-based component styling |
| **clsx** | 2.1.1 | Conditional classnames |
| **tailwind-merge** | 3.4.0 | Merge Tailwind classes |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js API Routes** | 16.1.6 | REST API endpoints under `/api/v1/` |
| **Drizzle ORM** | 0.45.1 | Type-safe SQL query builder |
| **Drizzle Kit** | 0.31.9 | Schema migrations and Studio |
| **Neon Serverless** | 1.0.2 | PostgreSQL serverless driver |
| **Zod** | 4.3.6 | Runtime schema validation |
| **Better Auth** | 1.4.18 | Authentication (email/password + OAuth) |
| **date-fns** | 4.1.0 | Date manipulation |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **PostgreSQL** (Neon) | Primary database (serverless) |
| **pnpm** | Package manager |
| **ESLint** | Code linting (eslint-config-next) |
| **PostCSS** | CSS processing (Tailwind integration) |

---

## Project Structure

```
intent/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated app routes (layout with nav)
│   │   ├── page.tsx              # Dashboard (/)
│   │   ├── budgets/page.tsx      # Budgets view
│   │   ├── categories/page.tsx   # Categories view
│   │   ├── insights/page.tsx     # Insights/analytics view
│   │   ├── profile/page.tsx      # Profile view
│   │   ├── recurring/page.tsx    # Recurring transactions view
│   │   └── transactions/page.tsx # Transactions list view
│   ├── (auth)/                   # Auth routes (no app nav)
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Register page
│   │   └── onboarding/page.tsx   # Financial profile setup
│   ├── api/
│   │   ├── auth/                 # Better Auth handler
│   │   └── v1/                   # REST API endpoints
│   │       ├── transactions/     # CRUD + list
│   │       ├── categories/       # CRUD + list
│   │       ├── budgets/          # CRUD + list
│   │       ├── recurring/        # CRUD + list
│   │       ├── financial-profile/# GET, POST, PATCH (singleton)
│   │       └── insights/         # GET + allocation-summary
│   ├── globals.css               # Global styles and Tailwind config
│   ├── layout.tsx                # Root layout
│   └── favicon.ico
├── components/                   # Shared React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── app-shell.tsx             # App layout wrapper
│   ├── bottom-nav.tsx            # Mobile bottom tab bar
│   ├── side-nav.tsx              # Desktop sidebar navigation
│   ├── floating-action-button.tsx# FAB for adding transactions
│   ├── page-header.tsx           # Reusable page header
│   ├── transaction-sheet.tsx     # Add/edit transaction bottom sheet
│   ├── transaction-sheet-context.tsx # Sheet state context provider
│   ├── transaction-item.tsx      # Transaction list item
│   ├── financial-profile-sheet.tsx # Financial profile form
│   └── icons.tsx                 # Custom icon components
├── lib/                          # Core utilities and configuration
│   ├── schema.ts                 # Drizzle ORM schema (all tables + relations)
│   ├── db.ts                     # Database connection (Neon)
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Client-side auth helpers
│   ├── api-client.ts             # Typed API client for all endpoints
│   ├── api-utils.ts              # Auth/validation middleware helpers
│   ├── finance-utils.ts          # Budget bucket definitions and formatters
│   ├── seed-data.ts              # Default categories for new users
│   └── utils.ts                  # General utilities (cn, etc.)
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── drizzle/                      # Database migrations
│   ├── 0000_*.sql                # Initial migration
│   ├── 0001_*.sql                # Second migration
│   └── meta/                     # Drizzle Kit metadata
├── docs/                         # Project documentation
│   ├── PRD.md                    # Product Requirements Document
│   ├── UI_VIEWS_SPECIFICATION.md # UI/UX specification
│   ├── DATA_MODEL.md             # Database schema docs
│   ├── API_SPECIFICATION.md      # API endpoint docs
│   ├── TECH_STACK.md             # This file
│   └── reference/                # Feature implementation guides
├── public/                       # Static assets
├── drizzle.config.ts             # Drizzle Kit configuration
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS configuration
├── components.json               # shadcn/ui configuration
└── package.json
```

---

## Route Groups

### `(app)` - Authenticated Routes
- Wrapped with app shell (bottom nav on mobile, sidebar on desktop)
- Requires authenticated session
- Requires completed financial profile (onboarding guard)
- Contains the FAB for quick transaction creation

### `(auth)` - Authentication Routes
- Minimal layout without app navigation
- Login, register, and onboarding flows
- Public access (login/register) or auth-required (onboarding)

---

## Key Architectural Patterns

### API Layer
- REST API under `/api/v1/` with Next.js route handlers
- `withAuth()` middleware for session validation
- `withAuthAndValidation()` for authenticated + Zod-validated routes
- Typed API client (`lib/api-client.ts`) for frontend consumption

### Database
- Drizzle ORM with PostgreSQL (Neon Serverless)
- Schema-first approach with TypeScript type inference
- Migrations via `drizzle-kit generate` + `drizzle-kit push`

### Authentication
- Better Auth with Drizzle adapter
- Email/password + Google OAuth
- Account linking for trusted providers
- Database hooks for post-registration category seeding

### Component Architecture
- shadcn/ui as the component foundation (Radix UI + Tailwind)
- Bottom sheets as primary modal pattern on mobile
- Context providers for shared state (transaction sheet)
- Mobile-first responsive design

### Styling
- Tailwind CSS 4 with custom design tokens in `globals.css`
- Dark theme with warm color palette
- CVA (class-variance-authority) for component variants
- `cn()` utility combining clsx + tailwind-merge

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Better Auth base URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

---

_Document Version: 1.0_
_Last Updated: 2026-03-15_
