# MileSmith

MileSmith is a full-stack hybrid training planner that generates personalized race + lifting programs from a short onboarding quiz.

## Live App

**Production URL:** https://milesmith.pages.dev/

## What It Does

MileSmith helps runners who also lift train for race goals without manually piecing together mileage progression, pacing, and strength structure.

- Supports 5K, 10K, Half Marathon, and Marathon plans.
- Uses a guided quiz to collect timeline, background, schedule, mileage, and lifting preferences.
- Generates week-by-week run + lift programming with build, deload, and taper phases.
- Saves plans for authenticated users and supports local fallback for guest users.

## Engineering Highlights

- Built a full-stack TypeScript app with a React/Vite frontend and Express API.
- Implemented rule-based plan generation logic for race-specific training progression.
- Added secure auth with cookie-based sessions and persisted training plans in PostgreSQL.
- Validated request payloads with Zod to harden API inputs.
- Deployed production stack on Cloudflare Pages (frontend), Render (API), and Neon (database).

## Tech Stack

### Client (`/client`)

- React 18 + TypeScript
- Vite
- React Router
- CSS modules/pages

### API (`/server`)

- Node.js + Express 5 + TypeScript
- Zod for payload validation
- PostgreSQL (`pg`) for users and plans
- `jsonwebtoken` + `cookie-parser` for auth/session handling
- `bcryptjs`, `cors`, `dotenv`

## API Surface

- Auth: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Plan generation: `POST /race-plan/5k`, `POST /race-plan/10k`, `POST /race-plan/half`, `POST /race-plan/marathon`
- Saved plans (auth): `POST /plans`, `GET /plans/current`, `GET /plans/history`

## Architecture Flow

1. User completes quiz in the React app.
2. Client posts profile data to race-plan API endpoint.
3. Server validates payload with `FitnessProfileSchema`.
4. Plan generators build weekly structure + workout details.
5. Client renders full plan and stores it:
   - in DB when authenticated, or
   - in local cache when unauthenticated.

## Optional: Run Locally

If needed, install dependencies in `server` and `client`, create env files, run `server/sql/001_auth_and_plans.sql`, then start both apps with `npm run dev`.

## Deployment Notes

Current production architecture:

- Frontend: Cloudflare Pages
- API: Render Web Service
- Database: Neon Postgres

`render.yaml` is included for Render Blueprint-based setup.

Required API env vars:

- `NODE_ENV=production`
- `JWT_SECRET=<secure-random-secret>`
- `CLIENT_ORIGIN=https://milesmith.pages.dev`
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- `PGSSLMODE=require`

Required frontend env var:

- `VITE_API_BASE_URL=<your-render-api-url>`
