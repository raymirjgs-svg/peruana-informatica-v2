# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peruana Informática is an e-commerce platform for technology products built with Next.js 15 frontend and Node.js/Express backend. The codebase is a monorepo with separate `frontend/` and `backend/` directories inside `peruana-informatica/`.

## Commands

### Backend (`peruana-informatica/backend/`)
```bash
npm run dev          # Development with nodemon
npm run build        # Compile TypeScript
npm start            # Production server
npm run init-db      # Initialize database
npm test             # Run Jest tests
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage
```

### Frontend (`peruana-informatica/frontend/`)
```bash
npm run dev          # Development with Turbopack
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
```

### Docker
```bash
docker-compose -f docker-compose.local.yml up -d    # Local development
docker-compose -f docker-compose.prod.yml up -d     # Production
docker-compose -f docker-compose.staging.yml up -d  # Staging
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, NextAuth
- **Backend**: Express.js 5, TypeScript, Sequelize ORM, MySQL 8, Redis
- **Infrastructure**: Docker, Nginx reverse proxy

### API Structure
- Public API: `/api/public/*` - Products, categories, brands, blog
- Admin API: `/api/admin/*` - CRUD operations, dashboard, orders

### Response Format
All API responses follow: `{ success: boolean, data: any, message?: string, errors?: array }`

### Key Directories
```
peruana-informatica/
├── backend/src/
│   ├── models/       # 35+ Sequelize models
│   ├── routes/       # Public endpoints
│   ├── routes/admin/ # Admin endpoints
│   ├── middleware/   # Auth, security, error handling
│   └── config/       # Redis, logger, Swagger
├── frontend/src/
│   ├── app/          # Next.js App Router pages
│   ├── app/admin/    # Admin dashboard
│   ├── components/   # React components
│   ├── services/     # API client services
│   ├── hooks/        # Custom hooks (useCart, useWishlist)
│   └── types/        # TypeScript definitions
```

### Deployment Architecture
```
Nginx (80/443) → Frontend (3000) → Backend (3001) → MySQL/Redis
```

## Path Aliases

Both frontend and backend use `@/*` → `src/*` path aliases (configured in tsconfig.json).

## Environment Setup

- Backend: Copy `.env.docker.example` to `.env`
- Frontend: Copy `.env.example` to `.env.local`
- API URLs: Backend runs on port 3001, Frontend on port 3000

## Testing

- **Backend**: Jest with ts-jest, tests in `src/__tests__/` or `*.spec.ts`
- **Frontend**: Playwright E2E in `e2e/` directory

## Key Patterns

- JWT authentication with refresh token rotation
- Rate limiting per endpoint (login: 5/15min, search: 500/15min, general: 1000/15min)
- File uploads: 5MB max, stored in `backend/public/uploads`
- State management: React hooks + Context (useCart, useWishlist, useCompare)
- Centralized error handling: `backend/middleware/errorHandler.ts`

## Database

MySQL 8 with Sequelize. Key models: Product, Order, User, Category, SubCategory, Brand, Quotation, BlogPost, Review, Coupon, Inventory.

## External Integrations

- Mercado Pago (payments)
- Google Generative AI / OpenAI (content generation)
- Nodemailer (email notifications)
