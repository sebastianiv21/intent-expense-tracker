# Expense Tracker - Implementation Spec

## What to Build
A serverless expense tracking web app where users can:
- Add/edit/delete expenses and income
- Categorize transactions
- Set budgets by category
- View spending insights

## Tech Stack (Non-Negotiable)

**Frontend:**
- Next.js 14+ (App Router)
- Deploy to Cloudflare Pages
- shadcn/ui (Tailwind CSS + Radix UI)
- Mobile as primary target (320px+)
- Progressive enhancement for tablet/desktop

**Backend:**
- Cloudflare Workers
- Hono framework
- TypeScript

**Database:**
- Neon Postgres (serverless)
- Drizzle ORM
- Migrations via `drizzle-kit`

**Auth:**
- Better Auth (Cloudflare Workers adapter)

**Validation:**
- Zod (shared between frontend/backend)

**Monorepo:**
- Turborepo

## Project Structure

```
apps/
├── web/              # Next.js frontend
│   ├── app/
│   └── components/
│       ├── ui/       # shadcn/ui components
│       └── ...       # custom components
└── api/              # Cloudflare Worker
    └── src/
        ├── modules/
        │   ├── expenses/
        │   ├── budgets/
        │   ├── categories/
        │   └── insights/
        ├── lib/
        │   ├── db.ts
        │   └── auth.ts
        ├── app.ts    # Hono app
        └── worker.ts # Entry point

packages/
└── shared/          # Zod schemas, types
```

## Data Model (Core Entities)

**users**
- id (uuid, primary key)
- email (unique)
- password_hash
- created_at

**categories**
- id (uuid, primary key)
- user_id (foreign key)
- name
- type (enum: expense | income)

**transactions**
- id (uuid, primary key)
- user_id (foreign key)
- category_id (foreign key, nullable)
- amount (numeric/decimal - use Postgres NUMERIC)
- type (enum: expense | income)
- description
- date
- created_at

**budgets**
- id (uuid, primary key)
- user_id (foreign key)
- category_id (foreign key)
- amount (numeric)
- period (enum: monthly | weekly)
- start_date

## UI/UX Design (Mobile-First)

### Responsive Strategy
- **Primary target**: Mobile (320px - 767px)
- **Secondary**: Tablet (768px - 1023px)
- **Tertiary**: Desktop (1024px+)

### Design Principles
1. **Touch-first**: Minimum 44px tap targets
2. **Thumb-friendly**: Key actions in bottom half of screen
3. **Single column** on mobile, multi-column on tablet+
4. **Bottom navigation** on mobile (add transaction, view list, insights, settings)
5. **Progressive disclosure**: Hide advanced features behind taps/swipes

### Required Responsive Patterns

**Mobile (< 768px):**
- Stack all content vertically
- Full-width cards
- Bottom sheet for forms/modals
- Swipe gestures for delete/edit actions
- Collapsible filters
- Sticky bottom navigation bar

**Tablet (768px - 1023px):**
- 2-column layouts where appropriate
- Side drawer navigation
- Modal dialogs (not bottom sheets)
- Larger transaction cards

**Desktop (1024px+):**
- Sidebar navigation (always visible)
- Multi-column dashboard
- Inline editing
- Hover states

### Key UI Components

**Use shadcn/ui components** for consistency and accessibility:
- `Button` - All CTAs and actions
- `Card` - Transaction items, category cards, budget cards
- `Sheet` - Bottom sheets on mobile, side drawers on tablet+
- `Dialog` - Modals on tablet/desktop
- `Form` - All input forms with react-hook-form
- `Input` - Text inputs
- `Select` - Dropdowns (categories, date ranges)
- `Drawer` - Mobile navigation drawer
- `Tabs` - Switching between expenses/income views
- `Badge` - Category tags, status indicators
- `Separator` - Visual dividers
- `ScrollArea` - Long lists
- `Toast` - Success/error notifications

**Transaction List** (Mobile):
```
┌─────────────────────────────┐
│ ☰ Expenses      [+] Add    │
├─────────────────────────────┤
│ Today                       │
│ ┌─────────────────────────┐│
│ │ 🍔 Lunch                ││
│ │ Food & Dining           ││
│ │            -$12.50 →   ││
│ └─────────────────────────┘│ ← Card component
│ ┌─────────────────────────┐│
│ │ ☕ Coffee               ││
│ │ Food & Dining           ││
│ │             -$4.25 →   ││
│ └─────────────────────────┘│
├─────────────────────────────┤
│ [List] [Insights] [Profile]│ ← Custom bottom nav
└─────────────────────────────┘
```

**Add Transaction** (Sheet component on Mobile):
- Use `Sheet` component (slides up from bottom)
- `Form` with `Input` for amount (large text, number type)
- `Select` for category selection
- Date picker using `Popover` + `Calendar`
- `Textarea` for optional description
- `Button` for submit

**Insights** (Mobile):
- `Tabs` for switching time periods
- `Card` components for category spending
- `Progress` bars for budget tracking
- Custom chart component or recharts integration

### Accessibility Requirements
- ARIA labels on all interactive elements (shadcn/ui handles most of this)
- Keyboard navigation support (built into Radix primitives)
- High contrast mode support
- Text scaling (up to 200%)
- Screen reader tested
- Focus visible states on all interactive elements

### Performance Targets
- **Mobile LCP**: < 2.5s
- **Mobile FID**: < 100ms
- **Mobile CLS**: < 0.1
- Works offline (show cached data with indicator)

## Environment Setup

You need **3 separate environments**, each with its own Neon database:

1. **dev** - local development
2. **preview** - PR previews
3. **prod** - production

### Required Environment Variables

```bash
DATABASE_URL=postgres://user:pass@neon-host/db?sslmode=require
BETTER_AUTH_SECRET=<min-32-chars-random-string>
BETTER_AUTH_URL=https://your-app.pages.dev
```

⚠️ **Critical Rules:**
- Never commit secrets
- Each environment has its own DATABASE_URL
- No shared databases across environments

## Key API Endpoints (Minimum Required)

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/session`

### Transactions
- GET `/api/transactions` (with pagination, filters)
- POST `/api/transactions`
- PATCH `/api/transactions/:id`
- DELETE `/api/transactions/:id`

### Categories
- GET `/api/categories`
- POST `/api/categories`
- PATCH `/api/categories/:id`
- DELETE `/api/categories/:id`

### Budgets
- GET `/api/budgets`
- POST `/api/budgets`
- PATCH `/api/budgets/:id`
- DELETE `/api/budgets/:id`

### Insights
- GET `/api/insights/spending` (grouped by category, time period)
- GET `/api/insights/budget-status`

## Database Migration Rules (Critical)

1. **Generate migrations**: `drizzle-kit generate`
2. **Review the SQL** before applying
3. **Never edit** already-applied migrations
4. **Apply order**: dev → preview → prod
5. **Migrations must be idempotent**

```bash
# Generate
pnpm drizzle-kit generate

# Apply to dev
pnpm drizzle-kit push

# Commit migration files
git add drizzle/
```

## Deployment Checklist

### First-Time Setup
1. Create Neon databases (dev, preview, prod)
2. Create Cloudflare Pages project
3. Set environment variables in Cloudflare dashboard
4. Link Worker to Pages

### Every Deploy
1. Run type-check: `pnpm typecheck`
2. Run lint: `pnpm lint`
3. Check migrations: `drizzle-kit check`
4. Deploy Worker: `wrangler deploy`
5. Deploy Pages: automatic on git push

## Hard Constraints (Don't Violate)

❌ **Do NOT:**
- Connect frontend directly to database
- Store money as floats/integers (use NUMERIC)
- Share database credentials across environments
- Edit applied migrations
- Use VPS or long-lived servers
- Add caching layers prematurely
- Implement cron jobs or background workers
- Design desktop-first (mobile is primary)
- Use small tap targets (< 44px)

✅ **Do:**
- All data access through API Worker
- Scope all queries by authenticated user
- Use Postgres NUMERIC for money
- Fail fast on missing environment variables
- Log errors clearly (but don't expose DB errors to users)
- Keep Workers stateless
- Design mobile-first with Tailwind breakpoints
- Test on real mobile devices (or Chrome DevTools mobile view)
- Use touch-friendly UI patterns

## Acceptance Criteria

You're done when:
- [ ] App deploys to all 3 environments
- [ ] Auth works (register, login, logout)
- [ ] Users can CRUD transactions
- [ ] Users can CRUD categories
- [ ] Users can set budgets
- [ ] Basic insights show spending by category
- [ ] Migrations run automatically
- [ ] No secrets in code
- [ ] App can be torn down and recreated from code alone
- [ ] **Mobile UI works perfectly on iPhone SE (375px) and Android phones**
- [ ] **Touch targets are minimum 44px**
- [ ] **Bottom navigation works on mobile**
- [ ] **App is usable on tablet and desktop (responsive)**
- [ ] **Core Web Vitals pass on mobile**

## Getting Started

1. Initialize Turborepo monorepo
2. Set up Next.js app in `apps/web`
3. Install and configure shadcn/ui:
   ```bash
   npx shadcn@latest init
   ```
   - Choose "Default" style
   - Use CSS variables for theming
   - Install core components:
     ```bash
     npx shadcn@latest add button card sheet dialog form input select drawer tabs badge separator scroll-area toast
     ```
4. Set up Hono Worker in `apps/api`
5. Create shared package for Zod schemas
6. Set up Drizzle with Neon
7. Implement auth with Better Auth
8. Build API endpoints module by module
9. Build frontend pages with shadcn/ui components
10. Deploy to Cloudflare

## Notes

- Start simple, iterate
- Focus on core features first (transactions, categories)
- Add budgets and insights after basics work
- Test locally before deploying
- Use Neon's HTTP driver for Workers compatibility
