# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastQuizParty is a fullstack SaaS boilerplate built as a **Turborepo monorepo** with:
- **Backend**: Fastify + Prisma (PostgreSQL) + Redis + BullMQ
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS + shadcn/ui
- **Features**: JWT auth, Stripe subscriptions, GDPR compliance, email verification, RBAC

**Future Vision**: Multiplayer real-time quiz game with Socket.IO, AI-generated quizzes (OpenAI), and multiple game modes. See `planning/` directory for architecture docs (not yet implemented).

## Development Commands

### Initial Setup

```bash
# Install dependencies (root installs all workspaces)
npm install

# Backend environment setup
cd apps/backend
cp .env.example .env
# Edit .env - generate JWT secrets with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Database setup
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # (Optional) Seed test data
```

### Development Workflow

```bash
# Run all services (backend + frontend) from root
npm run dev

# Or run individually
cd apps/backend && npm run dev    # Starts on port 3001
cd apps/frontend && npm run dev   # Starts on port 3000

# Database management
cd apps/backend
npm run db:studio    # Open Prisma Studio (visual DB editor)
npm run db:migrate   # Create migration after schema changes
```

### Testing

```bash
# From root - runs all tests
npm run test
npm run test:api     # Integration API tests (multi-platform)

# Backend tests (apps/backend)
npm test                  # Run all with coverage
npm run test:watch       # Watch mode
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests (sequential)

# Frontend tests (apps/frontend)
npm test                 # Run all with coverage
npm run test:watch      # Watch mode
```

### Code Quality

```bash
# From root
npm run lint          # Lint all packages
npm run type-check    # TypeScript validation across all apps
npm run build         # Build all apps
```

### Cleanup

```bash
npm run clean         # Remove dist/, .next/, .turbo/
npm run clean:full    # Also remove node_modules/
```

## Architecture & Structure

### Monorepo Organization

```
FastQuizParty/
├── apps/
│   ├── backend/      # Fastify API (port 3001)
│   └── frontend/     # Next.js App (port 3000)
├── packages/
│   ├── eslint-config/  # Shared ESLint rules
│   └── tsconfig/       # Shared TypeScript configs (base, node, nextjs)
└── planning/         # Architecture docs (future features, gitignored)
```

### Backend Architecture (apps/backend)

**Clean Architecture Layers**:
- `controllers/` - HTTP request/response handling (thin layer)
- `services/` - Business logic (reusable, testable)
- `routes/` - API endpoint definitions
- `middlewares/` - Cross-cutting concerns (auth, CSRF, RBAC, security)
- `config/` - Environment, database, Redis setup
- `utils/` - Helper functions
- `types/` - TypeScript type definitions
- `schemas/` - Zod validation schemas
- `queues/` - BullMQ async job workers (Stripe webhooks)

**Key Services**:
- `auth.service.ts` - Registration, login, JWT token management
- `stripe.service.ts` - Subscriptions, payments, webhook handling
- `email.service.ts` - Email via Resend
- `verification.service.ts` - Email verification tokens
- `password-reset.service.ts` - Password reset flows
- `gdpr.service.ts` - Data export, deletion, anonymization
- `csrf.service.ts` - CSRF token management (Redis-backed)
- `cache.service.ts` - Redis caching
- `distributed-lock.service.ts` - Concurrency control

**API Routes**:
- `/api/auth` - register, login, refresh, logout, /me
- `/api/verification` - send, verify
- `/api/password-reset` - forgot-password, reset-password
- `/api/stripe` - checkout, billing portal, webhooks
- `/api/premium` - Premium feature endpoints
- `/api/admin` - User management (ADMIN role required)
- `/api/gdpr` - Data export, deletion (GDPR compliance)
- `/health` - Health checks

**Database (Prisma)**:
- Models: User, RefreshToken, VerificationToken, PasswordResetToken, CsrfToken, Subscription
- Enums: Role (USER, ADMIN, MODERATOR), SubscriptionStatus, PlanType
- Path: `apps/backend/prisma/schema.prisma`

**Testing Strategy**:
- Jest with ts-jest preset
- `maxWorkers: 1` for sequential execution (prevents DB race conditions)
- Test database isolation using `__tests__/helpers/test-db.ts`
- Coverage thresholds: 5-7% minimum
- Unit tests: `__tests__/unit/`
- Integration tests: `__tests__/integration/`

### Frontend Architecture (apps/frontend)

**Next.js App Router Structure**:
- `app/(auth)/` - Public auth pages (login, register, forgot-password, etc.)
- `app/(dashboard)/` - Protected routes (dashboard, profile, pricing, settings)
- `app/(admin)/` - Admin dashboard (users, subscriptions)

**Key Directories**:
- `components/` - React components
  - `components/auth/` - Auth-related components (protected-route, admin-route)
  - `components/ui/` - shadcn/ui components
  - `components/layouts/` - Shared layouts
  - `components/pricing/` - Pricing cards, Stripe checkout
- `lib/` - Utilities and hooks
  - `lib/api/` - API client (axios), auth, admin endpoints
  - `lib/hooks/` - Custom React hooks
  - `lib/validators/` - Zod schemas for forms
  - `lib/stripe/` - Stripe utilities and hooks
  - `lib/utils.ts` - cn() utility and helpers
- `providers/` - React Context providers
  - `auth.provider.tsx` - Auth state management
  - `query.provider.tsx` - TanStack Query setup
  - `theme.provider.tsx` - Dark mode (next-themes)
- `types/` - TypeScript type definitions

**State Management**:
- TanStack React Query for server state caching
- Context API for auth state
- No Zustand/Redux in current implementation

**Testing Setup**:
- Jest with next/jest preset
- jsdom environment for React component testing
- React Testing Library utilities
- Test files: `__tests__/` or `*.test.tsx`

### Security Implementation

**Authentication Flow**:
1. User registers/logs in → JWT access token (15min) + refresh token (7 days)
2. Access token stored in httpOnly cookie (XSS protection)
3. Refresh token rotation on use
4. `auth.middleware.ts` verifies JWT on protected routes
5. `rbac.middleware.ts` enforces role-based permissions

**CSRF Protection**:
- Redis-backed CSRF tokens
- `csrf.middleware.ts` validates tokens on state-changing requests
- Double-submit cookie pattern

**Rate Limiting**:
- `@fastify/rate-limit` with Redis storage
- Per-route limits defined in route files
- Default: 100 req/min per IP

**Input Validation**:
- All request bodies validated with Zod schemas
- Schemas in `apps/backend/src/schemas/`
- Frontend also validates with matching Zod schemas

**Role-Based Access Control (RBAC)**:
- Roles: USER, ADMIN, MODERATOR
- Middleware: `rbac.middleware.ts` - `requireRoles(['ADMIN'])`
- Subscription-based gating: `subscription.middleware.ts`

### Important Patterns

**Error Handling**:
- Backend: Global error handler in `middlewares/error-handler.middleware.ts`
- Frontend: Error boundaries (`app/global-error.tsx`)
- Structured error responses with codes

**Environment Variables**:
- Backend: `apps/backend/.env` (gitignored, use `.env.example` as template)
- Frontend: `apps/frontend/.env.local` (gitignored)
- Validation: `apps/backend/src/config/env.ts` ensures required vars
- Frontend validation: `apps/frontend/lib/env.ts`

**Database Migrations**:
```bash
cd apps/backend

# After schema.prisma changes:
npm run db:migrate              # Create migration
npm run db:generate            # Regenerate Prisma client
npm run db:push                # Push without migration (dev only)

# Production:
npx prisma migrate deploy      # Apply pending migrations
```

**Stripe Integration**:
- Webhooks processed via BullMQ queue (`queues/stripe-webhook.queue.ts`)
- Graceful fallback to sync processing if Redis unavailable
- Subscription status synced to database
- Billing portal for subscription management

**GDPR Compliance**:
- Data export: Full user data as JSON
- Data anonymization: Replaces PII with hashed values
- Data deletion: Soft delete with `deletedAt` timestamp
- Endpoints: `/api/gdpr/export`, `/api/gdpr/anonymize`, `/api/gdpr/delete`

## Path Aliases

**Backend** (`apps/backend/tsconfig.json`):
```typescript
import { something } from '@/services/auth.service';
// Maps to: apps/backend/src/services/auth.service.ts
```

**Frontend** (`apps/frontend/tsconfig.json`):
```typescript
import { Button } from '@/components/ui/button';
// Maps to: apps/frontend/components/ui/button.tsx
```

## Common Gotchas

1. **Backend Tests**: Always run with `maxWorkers: 1` to prevent database race conditions
2. **Prisma Client**: Regenerate after schema changes: `npm run db:generate`
3. **JWT Secrets**: Must be cryptographically random 64-char hex strings
4. **Redis Optional**: Backend gracefully degrades if Redis unavailable (CSRF, cache, queues)
5. **CORS**: Backend `FRONTEND_URL` env var must match frontend origin
6. **Stripe Webhooks**: Requires webhook secret from Stripe dashboard
7. **Email Service**: Requires Resend API key for verification/password reset emails
8. **Turbo Cache**: Use `npm run clean` if experiencing stale build issues

## Turborepo Tasks

Defined in `turbo.json`:
- `dev` - Start development servers (persistent, no cache)
- `build` - Production builds (outputs cached)
- `lint` - ESLint validation
- `type-check` - TypeScript validation
- `test` - Jest tests
- `db:generate`, `db:push`, `db:studio` - Prisma commands

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`):
1. **Lint** - ESLint on all packages
2. **Type Check** - TypeScript validation (generates Prisma client first)
3. **Backend Tests** - Jest with PostgreSQL 16 service container
4. **Frontend Tests** - Jest with jsdom environment

Runs on: push to main/master, pull requests

## Port Configuration

- **Backend**: 3001 (configurable via `PORT` env var)
- **Frontend**: 3000 (Next.js default)
- **PostgreSQL**: 5432 (standard)
- **Redis**: 6379 (standard)

## Future Features (Not Yet Implemented)

See `planning/` directory for detailed architecture docs:
- **Socket.IO real-time multiplayer** game rooms
- **AI quiz generation** via OpenAI
- **Game modes**: Survival, Battle Royale, Teams
- **Achievements & leaderboards**
- **Social features**: Friends, chat

The current codebase is a solid SaaS foundation; game features are planned but not coded yet.
