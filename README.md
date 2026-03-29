# Intent

A mindful expense tracker web application implementing the **50/30/20 budgeting rule** (Needs/Wants/Future).

## Overview

Intent helps users gain awareness of their spending habits through a warm, zen-like aesthetic with a dark theme and terracotta accents. The app encourages financial mindfulness rather than anxiety, helping users feel calm and in control of their finances.

### The 50/30/20 Rule

| Bucket | Default | Purpose |
|--------|---------|---------|
| **Needs** | 50% | Essential expenses (rent, groceries, utilities, insurance) |
| **Wants** | 30% | Non-essential spending (dining, entertainment, shopping) |
| **Future** | 20% | Savings and investments |

> Percentages are fully customizable per user in their financial profile.

## Features

- **Dashboard** — Balance overview, 50/30/20 bucket progress cards, and upcoming recurring transactions
- **Transactions** — Full transaction management with search, filters, and swipe actions
- **Budgets** — Category-based budgets grouped by allocation bucket with period tracking
- **Categories** — Customizable income/expense categories with emoji icons and bucket assignment
- **Recurring** — Scheduled recurring transactions with configurable frequency (daily → yearly)
- **Insights** — Analytics with spending breakdown and 50/30/20 compliance visualization
- **Profile** — Financial profile management with currency selection and bucket percentage tuning
- **Auth** — Email/password and Google OAuth via Better Auth, with an onboarding flow

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| Icons | Lucide React |
| Charts | Recharts 3 |
| Fonts | Plus Jakarta Sans (`@fontsource`) |
| Toasts | Sonner |
| Date handling | date-fns 4, react-day-picker 9 |
| Auth | Better Auth 1.5 (email/password + Google OAuth) |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Validation | Zod 4 |

## Project Structure

```
intent-expense-tracker/
├── web/                          # Next.js application
│   ├── app/
│   │   ├── (app)/                # Authenticated app routes
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── transactions/     # Transactions page
│   │   │   ├── budgets/          # Budgets page
│   │   │   ├── categories/       # Categories page
│   │   │   ├── recurring/        # Recurring transactions page
│   │   │   ├── insights/         # Insights & analytics page
│   │   │   └── profile/          # User profile page
│   │   ├── (auth)/               # Unauthenticated routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── onboarding/
│   │   └── api/auth/             # Better Auth API handler
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── skeletons/            # Loading skeleton components
│   │   └── *.tsx                 # Feature components
│   ├── lib/
│   │   ├── actions/              # Server Actions (mutations)
│   │   │   ├── budgets.ts
│   │   │   ├── categories.ts
│   │   │   ├── financial-profile.ts
│   │   │   ├── recurring.ts
│   │   │   └── transactions.ts
│   │   ├── queries/              # Data fetching functions
│   │   │   ├── dashboard.ts
│   │   │   ├── insights.ts
│   │   │   ├── transactions.ts
│   │   │   └── ...
│   │   ├── validations/          # Zod schemas per domain
│   │   ├── schema.ts             # Drizzle DB schema
│   │   ├── db.ts                 # Neon DB client
│   │   ├── auth.ts               # Better Auth server config
│   │   ├── auth-client.ts        # Better Auth browser client
│   │   ├── currencies.ts         # Supported currencies list
│   │   ├── finance-utils.ts      # Budget/bucket helpers
│   │   └── utils.ts              # General utilities
│   ├── types/
│   │   └── index.ts              # Shared TypeScript interfaces
│   └── drizzle/                  # Migration files
├── docs/                         # Project documentation
│   ├── PRD.md
│   ├── TECH_STACK.md
│   ├── DATA_MODEL.md
│   ├── API_SPECIFICATION.md
│   └── UI_VIEWS_SPECIFICATION.md
└── specs/                        # Feature specifications
```

## Database Schema

Core tables managed by Drizzle ORM:

| Table | Description |
|-------|-------------|
| `user` | Auth users (managed by Better Auth) |
| `session` | Active user sessions |
| `account` | OAuth provider accounts |
| `financial_profile` | Per-user income target, bucket percentages, currency |
| `categories` | User-defined income/expense categories with bucket assignment |
| `transactions` | Individual income and expense records |
| `budgets` | Category budgets with weekly/monthly periods |
| `recurring_transactions` | Scheduled transactions with recurrence tracking |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Google OAuth credentials (optional, for Google sign-in)

### Installation

```bash
cd web
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL=your_neon_postgres_connection_string
BETTER_AUTH_SECRET=your_random_secret
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Database Setup

Push the schema to your database:

```bash
pnpm db:push
```

Or run migrations:

```bash
pnpm db:migrate
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:push` | Push schema directly to the database |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |

## Documentation

- [Product Requirements (PRD)](./docs/PRD.md)
- [Tech Stack & Architecture](./docs/TECH_STACK.md)
- [Data Model](./docs/DATA_MODEL.md)
- [API Specification](./docs/API_SPECIFICATION.md)
- [UI Views Specification](./docs/UI_VIEWS_SPECIFICATION.md)

## License

MIT