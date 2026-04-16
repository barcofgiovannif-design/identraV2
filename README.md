# Identra

Vite + React frontend with a standalone Node/Express + Prisma + MySQL backend.

## Structure
- `src/` — Vite + React frontend. Talks to the backend via `/api` (proxied in dev).
- `server/` — Express + Prisma + MySQL. Auth (magic link + JWT cookie), cards, companies, purchases, plans, uploads, Stripe, email (Resend).

## Getting started

### 1. Backend
```
cd server
cp .env.example .env           # fill DATABASE_URL, RESEND_API_KEY, JWT_SECRET, STRIPE_* …
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev                    # http://localhost:3000
```

### 2. Frontend
```
npm install
npm run dev                    # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to `http://localhost:3000`.
