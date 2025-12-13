# 🎮 FastQuizParty

> Multiplayer real-time quiz game built with Next.js, Fastify, and Socket.IO

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Create and join quiz rooms, compete with friends in real-time, and climb the leaderboard!

## ✨ Features

### 🎯 Core Game Features
- Real-time multiplayer quiz rooms (2-50 players)
- Public & private rooms with unique codes
- Live scoring with speed-based points
- Multiple game modes (Classic, Survival, Battle Royale, Teams)
- AI-powered quiz generation (Premium)
- Custom quiz creation
- Global leaderboards & player stats

### 🔐 Authentication & Payments
- JWT + refresh tokens authentication
- OAuth (Google, Discord)
- Email verification
- Stripe subscriptions (Free, Premium)
- RBAC (USER, PREMIUM, ADMIN)

### 🛡️ Security & Performance
- CSRF protection
- Rate limiting
- WebSocket optimization
- Anti-cheat system
- GDPR compliant

## 🏗️ Tech Stack

**Backend**
- Fastify 5.x + Socket.IO
- Prisma (PostgreSQL 16)
- Redis (sessions, cache, pub/sub)
- BullMQ (async jobs)
- OpenAI (quiz generation)

**Frontend**
- Next.js 15 + React 19
- TanStack Query
- Socket.IO Client
- Zustand (game state)
- Tailwind CSS + shadcn/ui

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone & install
git clone https://github.com/vincentsi/FastQuizParty.git
cd FastQuizParty
npm install

# Backend setup
cd apps/backend
cp .env.example .env
# Edit .env (generate JWT secrets, add Stripe/OpenAI keys)

# Database
npm run db:generate
npm run db:push
npm run db:seed

# Start all services
cd ../..
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🎮 How to Play

1. **Create an account** or login
2. **Create a room** or join with a code
3. **Wait for players** in the lobby
4. **Host starts** the game
5. **Answer questions** as fast as possible
6. **Win** and climb the leaderboard!

## 📁 Project Structure

```
FastQuizParty/
├── apps/
│   ├── backend/           # Fastify API + Socket.IO
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── quiz/      # Quiz CRUD
│   │   │   │   ├── game/      # Game logic
│   │   │   │   ├── realtime/  # WebSocket handlers
│   │   │   │   ├── ai/        # OpenAI integration
│   │   │   │   └── stats/     # Player statistics
│   │   │   └── ...
│   │   └── prisma/        # Database schema
│   └── frontend/          # Next.js App
│       ├── app/
│       │   ├── (game)/    # Game routes
│       │   ├── (auth)/    # Auth pages
│       │   └── (dashboard)/ # User dashboard
│       ├── components/    # UI components
│       └── lib/          # Utils, hooks, stores
└── packages/             # Shared configs
```

## 🔧 Development Commands

```bash
npm run dev          # Start all services
npm run build        # Build for production
npm run lint         # Lint code
npm run type-check   # TypeScript validation
npm test             # Run tests

# Backend specific
cd apps/backend
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create migration

# Frontend specific
cd apps/frontend
npm run build        # Production build
```

## 🌍 Environment Variables

**Backend** (`.env`):
```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
OPENAI_API_KEY="sk-..."
STRIPE_SECRET_KEY="sk_..."
RESEND_API_KEY="re_..."
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

## 🎯 Roadmap

- [x] Authentication system
- [x] Stripe payments
- [ ] Socket.IO real-time multiplayer
- [ ] AI quiz generation
- [ ] Game modes (Survival, Battle Royale)
- [ ] Leaderboards & achievements
- [ ] Social features (friends, chat)

See `planning/` directory for detailed architecture.

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 💬 Contact

- 📧 Email: vincent.si.dev@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/vincentsi/FastQuizParty/issues)

---

**Made by Vincent SI**

⭐ Star this repo if you find it useful!
