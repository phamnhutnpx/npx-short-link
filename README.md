# tiny-url

> 📖 **Hướng dẫn sử dụng**: Đọc [docs/01-HUONG-DAN-SU-DUNG.md](./docs/01-HUONG-DAN-SU-DUNG.md)
> 
> 🚀 **Hướng dẫn deploy**: Đọc [docs/02-DEPLOY.md](./docs/02-DEPLOY.md) - Tất cả trong 1 file!

Minimal example (authenticated):

```
curl -X POST https://url.npxofficial.com/api/links \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{
    "destination": "https://example.com",
    "slug": "example",
    "utmSource": "newsletter"
  }'
```

## Overview

`tiny-url` is a production-ready URL shortener built with Next.js (App Router) + Prisma + PostgreSQL. It includes:

- Public form to create branded short links with optional custom slugs, expiration, and UTM tagging
- Token-protected REST API & admin UI for managing links and viewing analytics
- Redirect endpoint that logs click metadata (timestamp, IP, user-agent, referrer, country placeholder)
- Rate limiting (memory by default, Redis-ready) and security headers
- Prisma migrations + seed script creating an admin user and sample links
- Docker & docker-compose setups for local dev and production deployment

## Tech Stack

- Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Prisma ORM with PostgreSQL
- Jest unit tests
- Docker / docker-compose for runtime orchestration

## Prerequisites

- Node.js 20+
- npm 10+ (or pnpm/yarn if preferred)
- Docker Desktop (for containerized workflows)

## Environment Variables

Copy `.env.example` to `.env` and update values:

```
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://user:password@host:5432/db?schema=public`) |
| `NEXT_PUBLIC_DOMAIN` | Base URL for redirects (dev: `http://localhost:3000`, prod: `https://url.npxofficial.com`) |
| `ADMIN_TOKEN` | Shared secret for admin API/UI (rotate frequently) |
| `JWT_SECRET` | Reserved for future user auth features (set a random 32+ char string) |
| `REDIS_URL` | Optional Redis connection string for distributed rate limiting |
| `GEOIP_DB_PATH` | Optional path to a GeoIP database if you wire country lookup |

> ⚠️ Requests are rate-limited (60/hour/IP). With `REDIS_URL` configured, limits are enforced cluster-wide; otherwise a per-instance in-memory store is used (documented limitation).

## Local Development

### 1. Start services with docker-compose

```
docker compose up --build
```

This launches:

- PostgreSQL (`localhost:5432`)
- Adminer database UI (`http://localhost:8080`)
- Next.js dev server (`http://localhost:3000`)

> The `web` service runs `npm install` automatically before `npm run dev`. Alternatively install dependencies on the host (`npm install`) and run `npm run dev` locally.

### 2. Install dependencies (if running locally)

```
npm install # or pnpm install / yarn install
```

### 3. Run Prisma migrations & seed data

```
npm run prisma:migrate
npm run prisma:seed
```

Seeds create:

- Admin user: `admin@tiny-url.local` (temporary password `ChangeMe123!`)
- Example links: `/r/docs`, `/r/launch`

### 4. Launch the dev server

```
npm run dev
```

Visit `http://localhost:3000` for the public form and `http://localhost:3000/admin` for the admin UI (enter `ADMIN_TOKEN`).

### 5. Run tests

```
npm test
```

### 6. Helpful Makefile targets

```
make dev
make migrate
make seed
make test
make docker-up
make docker-down
```

## API Reference

All management endpoints require `x-admin-token: $ADMIN_TOKEN`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/links` | Create a short link (rate limited) |
| `GET` | `/api/links` | List links with metadata |
| `GET` | `/api/links/{slug}` | Retrieve a single link + recent clicks |
| `GET` | `/api/links/{slug}/analytics` | List recent click events (latest 50) |
| `DELETE` | `/api/links/{slug}` | Delete link and associated analytics |

Redirect endpoint (public): `GET /r/{slug}` → 301 to destination.

Example redirect test:

```
curl -I http://localhost:3000/r/docs
```

## Admin UI Usage

1. Navigate to `/admin`
2. Enter the `ADMIN_TOKEN`
3. View, refresh, delete links, and inspect analytics (last 50 clicks)

Token is stored in `localStorage` only.

## Production Deployment

### 1. Build Docker image

```
docker build -t tiny-url:latest .
```

### 2. Sample production compose file

`docker-compose.prod.yml` is included. To run:

```
ADMIN_TOKEN="super-secret" \
JWT_SECRET="another-long-secret" \
NEXT_PUBLIC_DOMAIN="https://url.npxofficial.com" \
DATABASE_URL="postgresql://postgres:postgres@db:5432/tiny_url?schema=public" \
docker compose -f docker-compose.prod.yml up -d --build
```

Adjust secrets and database credentials appropriately. Consider using managed PostgreSQL and Redis; if so, remove the bundled `db` service and point `DATABASE_URL`/`REDIS_URL` to external services.

### 3. Prisma migration lifecycle

On first deploy:

```
npx prisma migrate deploy
node --loader ts-node/esm prisma/seed.ts   # or npm run prisma:seed (ensure env vars set)
```

Run `prisma migrate deploy` on every release to apply new migrations.

### 4. DNS setup

- Create an `A` record for `url.npxofficial.com` pointing to the server IP (or a `CNAME` to your load balancer).
- Ensure HTTPS termination (e.g., via reverse proxy + Let’s Encrypt or managed certificates).
- Update `NEXT_PUBLIC_DOMAIN` to `https://url.npxofficial.com`.

### 5. Hardening & Scaling Notes

- Rotate `ADMIN_TOKEN` and temporary seed password immediately after deploy.
- Configure HTTPS redirects at your proxy/CDN layer.
- Attach Redis or another distributed store for consistent rate limiting in multi-instance setups.
- For high-volume analytics, move click logging to a background queue + batch inserts.
- Plug in GeoIP provider (`lib/geo.ts`) for country detection if needed.

## Project Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run prisma:migrate` | Run `prisma migrate dev` |
| `npm run prisma:seed` | Execute `prisma/seed.ts` via `tsx` |
| `npm run docker:up` | `docker-compose up --build` |
| `npm run docker:down` | `docker-compose down` |

## Testing Recap

- `__tests__/slug.test.ts` verifies slug generator constraints
- `__tests__/create-link-api.test.ts` validates duplicate slug handling in the API

Run tests with `npm test`. Extend Jest or swap to Vitest as desired.

## Directory Structure

```
app/
  actions/
  admin/
  api/
  r/
components/
lib/
prisma/
public/
__tests__/
```

`app/actions/createLink.ts` powers the public form, while admin functionality lives in `components/AdminDashboard.tsx` and REST handlers under `app/api/links`.

## Deployment Checklist

- [ ] Set environment variables (`DATABASE_URL`, `NEXT_PUBLIC_DOMAIN`, `ADMIN_TOKEN`, `JWT_SECRET`, optional `REDIS_URL`)
- [ ] Run `npm install`, `npm run build`, `prisma migrate deploy`, `npm run prisma:seed`
- [ ] Configure HTTPS + DNS for `url.npxofficial.com`
- [ ] Start services (`docker compose -f docker-compose.prod.yml up -d` or custom infra)
- [ ] Verify `POST /api/links`, `/r/{slug}`, and `/admin`
- [ ] Rotate seed credentials

Happy shortening! 🛠️
