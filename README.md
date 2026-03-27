# Intent

A mindful expense tracker web application implementing the **50/30/20 budgeting rule** (Needs/Wants/Savings).

## Overview

Intent helps users gain awareness of their spending habits through a warm, zen-like aesthetic with a dark theme and terracotta accents. The app encourages financial mindfulness rather than anxiety, helping users feel calm and in control of their finances.

### The 50/30/20 Rule

| Bucket | Default | Purpose |
|--------|---------|---------|
| **Needs** | 50% | Essential expenses (rent, groceries, utilities, insurance) |
| **Wants** | 30% | Non-essential spending (dining, entertainment, shopping) |
| **Future** | 20% | Savings and investments |

## Features

- **Dashboard** - Balance overview, 50/30/20 progress cards, recent transactions
- **Transactions** - Full transaction management with search, filters, and swipe actions
- **Budgets** - Category-based budgets grouped by allocation bucket
- **Categories** - Customizable income/expense categories
- **Recurring** - Scheduled recurring transactions with configurable frequency
- **Insights** - Analytics with spending breakdown and compliance visualization

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| Charts | Recharts 3 |
| Auth | Better Auth (email/password + Google OAuth) |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Validation | Zod 4 |

## Project Structure

```
intent/
├── web/                    # Next.js application
│   ├── app/                # App Router routes
│   ├── components/         # React components
│   ├── lib/                # Utilities and configuration
│   └── types/              # TypeScript interfaces
├── docs/                   # Project documentation
│   ├── PRD.md              # Product requirements
│   ├── TECH_STACK.md       # Architecture details
│   ├── DATA_MODEL.md       # Database schema
│   └── API_SPECIFICATION.md # API endpoints
└── specs/                  # Feature specifications
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (Neon recommended)

### Installation

```bash
cd web
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=your_neon_postgres_connection_string
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Database Setup

```bash
pnpm db:push
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
| `pnpm db:studio` | Open Drizzle Studio |

## Documentation

- [Product Requirements (PRD)](./docs/PRD.md)
- [Tech Stack & Architecture](./docs/TECH_STACK.md)
- [Data Model](./docs/DATA_MODEL.md)
- [API Specification](./docs/API_SPECIFICATION.md)
- [UI Views Specification](./docs/UI_VIEWS_SPECIFICATION.md)

## License

MIT
