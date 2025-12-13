# 🚀 Fullstack SaaS Boilerplate

> Minimal boilerplate for building SaaS applications with authentication and Stripe payments

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Launch your SaaS quickly with auth + Stripe integration. Simplified for rapid prototyping.

## ✨ Features

### 🔐 Authentication & Authorization

- Complete auth system with JWT + refresh tokens
- Email verification with Resend
- Password reset flow
- RBAC with roles (USER, ADMIN, MODERATOR)
- Enhanced password security with validation

### 💳 Payments & Subscriptions

- Stripe integration with 3 plans (FREE, PRO, BUSINESS)
- Subscription management with billing portal
- Webhook handling with async queue (BullMQ)
- Plan-based feature gating

### 🛡️ Security

- CSRF protection with Redis
- Rate limiting per endpoint
- SQL injection protection (Prisma ORM)
- XSS protection with httpOnly cookies
- Helmet.js security headers
- Input validation with Zod

### 🔧 GDPR Compliance

- User data export
- Account deletion
- Data anonymization

## 🏗️ Tech Stack

### Backend

- **[Fastify](https://fastify.dev/)** 5.x - Fast Node.js framework
- **[Prisma](https://www.prisma.io/)** 6.x - TypeScript ORM
- **[PostgreSQL](https://www.postgresql.org/)** 16 - SQL database
- **[Redis](https://redis.io/)** 7 - Caching & queues
- **[BullMQ](https://docs.bullmq.io/)** - Job queues
- **[Zod](https://zod.dev/)** - Schema validation

### Frontend

- **[Next.js](https://nextjs.org/)** 15 - React framework
- **[React](https://react.dev/)** 19 - UI library
- **[TanStack Query](https://tanstack.com/query)** - State management
- **[Tailwind CSS](https://tailwindcss.com/)** 4 - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - React components

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd fullstack-boilerplate

# Install dependencies
npm install

# Setup backend environment
cd apps/backend
cp .env.example .env
# Edit .env with your configuration

# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Add to .env as JWT_SECRET and JWT_REFRESH_SECRET

# Setup database
npm run db:generate
npm run db:push

# Start development servers
cd ../..
npm run dev
```

### Servers

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/docs

## 🗂️ Project Structure

```
fullstack-boilerplate/
├── apps/
│   ├── backend/              # Fastify API
│   │   ├── src/
│   │   │   ├── config/       # Environment, database, Redis
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── routes/       # API routes
│   │   │   ├── middlewares/  # Auth, CSRF, RBAC
│   │   │   └── __tests__/    # Unit tests
│   │   └── prisma/           # Database schema
│   └── frontend/             # Next.js app
│       ├── app/              # App Router pages
│       ├── components/       # React components
│       └── lib/              # API client, utilities
└── packages/
    ├── eslint-config/        # Shared ESLint
    └── tsconfig/             # Shared TypeScript configs
```

## 🔧 Available Scripts

### Root Commands

```bash
npm run dev          # Start all apps
npm run build        # Build all apps
npm run lint         # Lint all packages
npm run type-check   # TypeScript check
npm run test         # Run tests
```

### Backend Commands

```bash
cd apps/backend
npm run dev          # Start dev server (port 3001)
npm test             # Run unit tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
```

### Frontend Commands

```bash
cd apps/frontend
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm test             # Run Jest tests
```

## 🌍 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET="your-64-char-secret"
JWT_REFRESH_SECRET="your-64-char-refresh-secret"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Email Verification

- `POST /api/verification/send` - Send verification email
- `POST /api/verification/verify` - Verify email

### Stripe Payments

- `POST /api/stripe/create-checkout-session` - Create payment
- `POST /api/stripe/create-portal-session` - Billing portal
- `GET /api/stripe/subscription` - Get subscription
- `POST /api/stripe/webhook` - Stripe webhook

### Admin (ADMIN role required)

- `GET /api/admin/users` - List users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - User statistics

### GDPR

- `GET /api/gdpr/export-data` - Export user data
- `DELETE /api/gdpr/delete-data` - Delete account
- `POST /api/gdpr/anonymize-data` - Anonymize data

Full API docs: http://localhost:3001/docs

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend unit tests
cd apps/backend
npm run test:unit

# Frontend tests
cd apps/frontend
npm test

## 🤝 Customization

1. Update branding (logo, colors, company name)
2. Add your features and routes
3. Customize email templates in `apps/backend/src/services/email.service.ts`
4. Add database models in `apps/backend/prisma/schema.prisma`

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 💬 Support

- 📧 Email: vincent.si.dev@gmail.com
- 🐛 Issues: Open an issue on GitHub

---

**Made by Vincent SI**

⭐ Star this repo if you find it useful!
```
