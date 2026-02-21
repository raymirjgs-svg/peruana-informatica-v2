# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peruana Informática is an e-commerce platform for technology products built with Next.js 15 frontend and Node.js/Express backend. The codebase is a monorepo with separate `frontend/` and `backend/` directories inside `peruana-informatica/`.

## Commands

### Backend (`peruana-informatica/backend/`)
```bash
npm run dev           # Development with nodemon
npm run dev-manual    # Development with ts-node directly (fallback)
npm run build         # Compile TypeScript
npm start             # Production server
npm run init-db       # Initialize database
npm run lint          # ESLint
npm run lint:fix      # Auto-fix lint issues
npm run format        # Prettier on src/**/*.ts
npm test              # Run all Jest tests
npm run test:watch    # Tests in watch mode
npm run test:coverage # Tests with coverage
npx jest src/__tests__/auth.spec.ts  # Run a single test file
```

### Frontend (`peruana-informatica/frontend/`)
```bash
npm run dev    # Development with Turbopack
npm run build  # Production build
npm start      # Production server
npm run lint   # ESLint
```

### Docker
```bash
docker-compose -f docker-compose.local.yml up -d    # Local development
docker-compose -f docker-compose.prod.yml up -d     # Production
docker-compose -f docker-compose.staging.yml up -d  # Staging
```

Requires Node.js 20+ and npm 10+.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router, standalone output), React 19, TypeScript, Tailwind CSS, NextAuth v4
- **Backend**: Express.js 5, TypeScript, Sequelize ORM, MySQL 8, Redis, Winston logging
- **Infrastructure**: Docker, Nginx reverse proxy

### Deployment Architecture
```
Nginx (80/443) → Frontend (3000) → Backend (3001) → MySQL/Redis
```

### API Structure
- Public API: `/api/public/*` — products, categories, brands, blog, cart, quotations, payments
- Admin API: `/api/admin/*` — 25+ CRUD endpoints; admin auth routes MUST be registered before other admin routes
- Health checks: `GET /health` (text) and `GET /api/health` (JSON)

### Response Format
All API responses follow: `{ success: boolean, data: any, message?: string, errors?: array }`

## Key Directories

```
peruana-informatica/
├── backend/src/
│   ├── server.ts       # App bootstrap and middleware order
│   ├── models/         # 38+ Sequelize models
│   ├── routes/         # Public route handlers
│   ├── routes/admin/   # Admin route handlers
│   ├── middleware/      # Auth, rate-limiting, sanitization, error handling
│   └── config/         # Redis, logger (Winston), Swagger
├── frontend/src/
│   ├── app/            # Next.js App Router pages
│   ├── app/admin/      # Admin dashboard (25+ pages)
│   ├── components/     # React components
│   ├── services/       # 24 domain-specific API service classes
│   ├── hooks/          # useCart, useWishlist, useCompare
│   ├── config/api.ts   # Central API URL configuration
│   └── types/          # TypeScript definitions
```

## Path Aliases

- Backend: `@/*` → `src/*`
- Frontend: `@/*` → `./src/*` (baseUrl is `./src`)

## Environment Setup

- Backend: Copy `.env.docker.example` to `.env`
- Frontend: Copy `.env.example` to `.env.local`

### Critical API URL Rule
`NEXT_PUBLIC_API_URL` must **never** include `/api`. Each service endpoint already includes its own `/api` prefix. The frontend uses `INTERNAL_API_URL` for server-side rendering and `NEXT_PUBLIC_API_URL` for client-side calls.

### Key Environment Variables

**Backend:**
- `DB_HOST/PORT/NAME/USER/PASSWORD`, `DB_SYNC_ALTER`
- `JWT_SECRET`, `JWT_EXPIRES_IN` (7d), `JWT_REFRESH_EXPIRES_IN` (30d)
- `REDIS_ENABLED`, `REDIS_URL`, `CACHE_TTL`
- `CORS_ORIGIN`, `FRONTEND_URL`
- `MP_ACCESS_TOKEN` (Mercado Pago), `GEMINI_API_KEY`
- `EMAIL_HOST/PORT/USER/PASS/FROM` (Nodemailer)

**Frontend:**
- `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Key Patterns

### Authentication
- **Backend admin**: Custom JWT-based middleware with refresh token rotation
- **Backend customer**: JWT (access 7d + refresh 30d)
- **Frontend**: NextAuth v4 with two providers:
  - `Credentials` — differentiates admin vs. customer via `type` parameter
  - `Google` — social login synced with backend
  - JWT strategy, 24-hour session max age

### Backend Middleware Order (`server.ts`)
Helmet → Compression → CORS → Security headers → Rate limiting → Input sanitization (strips `<script>` from req.body) → JSON/urlencoded (10MB) → Request logging → Static files → Routes → 404 handler → Error handler

### Database
MySQL 8 with Sequelize. Charset: `utf8mb4` / `utf8mb4_unicode_ci` (enforced per connection for Spanish character support). Connection pool: max 10, acquire 30s, idle 10s.

Key models: Product, Category, SubCategory, Brand, Inventory, Order, OrderItem, Cart, CartItem, Quotation, Payment, Review, Wishlist, Coupon, BlogPost, PromoBanner, Announcement, User, Role, Permission, Setting, CompanySettings, Attribute, ComponentCompatibility.

### Frontend Service Pattern
Each of the 24 service classes in `src/services/` follows:
- `baseUrl` from `src/config/api.ts`
- 5-second fetch timeout
- Graceful degradation — returns empty/default values instead of throwing
- Cache-busting via `?t=${Date.now()}` on GET requests
- Handles multiple API response shapes (array vs. object)

### Image URL Handling
`src/utils/images.ts` normalizes image paths across multiple formats (raw filenames, localhost URLs, encoded URLs). Special characters in filenames are encoded. Missing images fall back to `/images/no-image.svg`.

### State Management
React Context + custom hooks: `useCart`, `useWishlist`, `useCompare`. No external state library.

### File Uploads
5MB max, stored in `backend/public/uploads`. Backend also serves `/images` as static files.

## Testing

- **Backend**: Jest with ts-jest. Test files: `src/__tests__/*.spec.ts` or `*.test.ts`
- **Frontend**: Playwright E2E in `e2e/` directory

## Tailwind Brand Tokens

Custom colors defined in `tailwind.config.js`:
- `red-*`: `dc2626` principal brand red (shades 50–900)
- `black-*`: `0a0a0a` authority black
- Custom gradients: `brand`, `dark`, `header`, `subtle`
- Custom shadows: `brand-sm/md/lg/xl`, `brand-red`

## External Integrations

- **Mercado Pago**: Payment processing (`MP_ACCESS_TOKEN`)
- **Google Generative AI / OpenAI**: Content generation (`GEMINI_API_KEY`)
- **Nodemailer**: Email notifications (SMTP config)
- **Unsplash**: Remote image source (allowed in Next.js image config)
