# Implementation Plan - Expense Tracker

**Project Status:** Backend 100% (MVP) | Frontend ~0% complete  
**Created:** January 26, 2026  
**Updated:** January 29, 2026
**Tech Stack:** Next.js 16, React 19, Cloudflare Workers, Hono, Neon Postgres, Drizzle ORM, Better Auth

---

## Current Implementation Status

### ✅ Completed (Backend - API)

#### Database Schema & Migrations

- [x] Auth tables (user, session, account, verification) - Better Auth integration
- [x] Category table with allocation bucket support (needs/wants/future)
- [x] Transaction table with proper numeric type for amounts
- [x] Budget table with period support (monthly/weekly)
- [x] Financial Profile table for 50/30/20 rule configuration
- [x] Two migrations applied: auth setup + core tables

#### API Modules (v1)

- [x] **API Versioning** (`/api/v1/*`) implemented for all routes
- [x] **Auth Module** (`/api/v1/auth/*`) - Better Auth integration
- [x] **Categories Module** (`/api/v1/categories`) - Full CRUD with allocation buckets
- [x] **Transactions Module** (`/api/v1/transactions`) - Full CRUD with filtering
- [x] **Budgets Module** (`/api/v1/budgets`) - Full CRUD with category validation
- [x] **Insights Module** (`/api/v1/insights`) - Spending, Budget Status, Allocation Summary
- [x] **Financial Profile Module** (`/api/v1/financial-profile`) - CRUD for 50/30/20 config

#### Infrastructure & Reliability

- [x] Hono app with middleware (CORS, logging, request ID)
- [x] Lazy initialization for DB and Auth (Cloudflare Workers compatibility)
- [x] Auto-seeding of default categories on user registration
- [x] Improved validation error reporting (multiple Zod issues)
- [x] Shared package ESM compatibility fixed
- [x] Workspace-wide type checking passing

#### Shared Package

- [x] Auth, Category, Transaction, Budget, Financial Profile, and Insights schemas
- [x] ESM module support with proper file extensions
- [x] Exported inferred types for all schemas

### ❌ Not Yet Implemented

#### Frontend (Web App)

**Status:** Only default Next.js boilerplate exists. No custom implementation yet.

- [ ] **shadcn/ui Setup**
  - Initialize shadcn/ui
  - Install required components (Button, Card, Sheet, Dialog, Form, Input, Select, etc.)
  - Configure theme (CSS variables)

- [ ] **Authentication UI**
  - Login page (`/login`)
  - Register page (`/register`)
  - Better Auth client integration
  - Protected route middleware

- [ ] **Core Layout**
  - App layout with navigation (Bottom nav for mobile, Sidebar for desktop)
  - Responsive breakpoints (mobile-first)

- [ ] **Financial Profile Setup**
  - Onboarding flow for new users
  - Form to set monthly income target & 50/30/20 percentages

- [ ] **Categories Management**
  - Categories list, Create/Edit/Delete dialogs
  - Category icon picker

- [ ] **Transactions**
  - Transactions list page with date grouping
  - Add/Edit transaction sheets
  - Transaction filters (date range, type, category)

- [ ] **Budgets Management**
  - Budgets list page
  - Create/Edit/Delete budget dialogs
  - Budget progress visualization

- [ ] **Insights Dashboard**
  - 50/30/20 allocation summary cards
  - Budget status progress bars
  - Spending by category chart (recharts)

- [ ] **API Integration**
  - HTTP client setup (fetch wrapper)
  - Loading states & Skeleton components
  - Toast notifications (shadcn/ui toast)

#### Deployment & DevOps

- [ ] Production Neon database setup
- [ ] Cloudflare Workers deployment (`wrangler deploy`)
- [ ] Cloudflare Pages configuration for frontend
- [ ] Environment variables setup in Cloudflare Dashboard

---

## Implementation Order (Remaining)

### Phase 2: Frontend Setup (Est: 3-4 hours)

#### 2.1 shadcn/ui Installation & Configuration (1 hour)

**Priority:** HIGH - Required for all UI components

#### 2.2 API Client & Better Auth Client Setup (1.5 hours)

- Create type-safe fetch wrapper pointing to `/api/v1`
- Initialize Better Auth client

#### 2.3 Environment Variables (30 min)

- Setup `.env.local` for local development

### Phase 3: Authentication UI (Est: 4-5 hours)

- Login/Register pages
- Auth middleware & Protected routes

### Phase 4: Core Layout & Navigation (Est: 3-4 hours)

- Responsive App Layout
- Mobile Bottom Nav / Desktop Sidebar

### Phase 5: Financial Profile & Onboarding (Est: 2-3 hours)

- Onboarding flow
- Profile settings page

### Phase 6: Core Features (Est: 15-20 hours)

- Categories, Transactions, Budgets, and Insights implementation

---

## Technical Adjustments & Decisions

### API Versioning

All routes moved to `/api/v1`. Main entry point is `apps/api/src/app.ts` which mounts `v1Routes` from `apps/api/src/routes/v1.ts`.

### Lazy Initialization

To support Cloudflare Workers' lifecycle, `getDb()` and `getAuth()` functions are used instead of static instances. This ensures environment variables are available when accessed.

### Data Seeding

Default categories are automatically created via Better Auth's `after` user creation hook. A manual seed script is also available in `apps/api/src/db/seed.ts`.

---

## Next Immediate Steps

1. **Frontend:** Initialize shadcn/ui in `apps/web`.
2. **Frontend:** Create API client wrapper in `apps/web/lib/api-client.ts`.
3. **Frontend:** Implement Login and Register pages.
4. **Frontend:** Set up Next.js middleware for route protection.
