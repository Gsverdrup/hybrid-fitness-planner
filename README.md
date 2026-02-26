# MileSmith

MileSmith is a full-stack app that builds personalized race training plans with integrated lifting. It supports 5K, 10K, Half Marathon, and Marathon plans, with account-based plan saving and profile-aware generation.

## Features
- Multi-step quiz for race goal, timeline, fitness background, weekly mileage, schedule, and lifting preferences.
- Race-specific plan generation for `5k`, `10k`, `half-marathon`, and `marathon`.
- Structured periodization using build, deload, and taper week patterns.
- Pace-aware run workouts (easy, workout, long run) with segment-level guidance.
- Strength programming integration (push / pull / legs / upper) with selectable exercise preferences.
- Plan rendering UI with weekly cards, print/save support, and rebuild flow.
- Authentication (sign up, log in, log out, current session) using secure cookie-based sessions.
- Persistence of plans for signed-in users in PostgreSQL.
- Local fallback caching for users not signed in (`hf_last_plan` in `localStorage`).
- Profile page that shows user details and most recent plan status.

## How It Works
1. User completes the quiz on the client.
2. Client submits a validated profile payload to a race endpoint (`/race-plan/:goal`).
3. Server validates input with Zod (`FitnessProfileSchema`).
4. Rule-based generators create multi-week plans by:
	- selecting a build/deload/taper pattern by race + plan length,
	- scaling weekly mileage progression from starting mileage,
	- calculating long run progression and taper reduction,
	- generating run workout details and paces,
	- generating lift sessions from exercise libraries or user-selected preferences.
5. Client renders the full plan and:
	- saves to DB if authenticated (`/plans`), or
	- keeps a local cached version until user signs in.

## Tech Stack
**Client**
- React 18 + TypeScript
- Vite
- React Router
- CSS (component/page stylesheets)

**Server**
- Node.js + Express 5 + TypeScript
- Zod (request validation)
- PostgreSQL (`pg`) for users + saved plans
- `jsonwebtoken` + `cookie-parser` for session auth
- `bcryptjs` for password hashing
- `cors` + `dotenv`

**Tooling**
- ESLint
- `tsx` (server dev runtime)

## API Overview
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /race-plan/5k`
- `POST /race-plan/10k`
- `POST /race-plan/half`
- `POST /race-plan/marathon`
- `POST /plans` (auth required)
- `GET /plans/current` (auth required)
- `GET /plans/history` (auth required)

## Local Development

### 1) Install dependencies
```bash
cd server
npm install

cd ../client
npm install
```

### 2) Configure environment
Create `server/.env`:
```bash
PGUSER=postgres
PGHOST=localhost
PGDATABASE=hybrid_fitness_planner
PGPASSWORD=your_password
PGPORT=5432
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Optional `client/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### 3) Run DB migration
Run `server/sql/001_auth_and_plans.sql` against your Postgres database.

### 4) Start the apps
In one terminal:
```bash
cd server
npm run dev
```

In a second terminal:
```bash
cd client
npm run dev
```

Client default: `http://localhost:5173`  
Server default: `http://localhost:3001`
