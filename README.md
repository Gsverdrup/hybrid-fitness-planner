# Hybrid Fitness Planner

A full-stack web app that generates personalized hybrid training plans
(running + lifting + mobility) based on a user's goals, abilities, and schedule.

## 🚀 Features
- Custom weekly training plans
- Hybrid programming (running + strength)
- Rule-based plan generation
- Clean, responsive UI

## 🧠 How It Works
Users input:
- Running and strength goals
- Current fitness level
- Available training days

The backend applies deterministic training rules to generate a safe,
balanced 7-day plan.

## 🛠 Tech Stack
**Frontend**
- React
- TypeScript
- Tailwind CSS

**Backend**
- Node.js
- Express
- TypeScript

## 📸 Screenshots
_(Add later)_

## 🧪 Running Locally

```bash
git clone https://github.com/yourname/hybrid-fitness-planner
cd hybrid-fitness-planner

# Server
cd server
npm install
npm run dev

# Client
cd ../client
npm install
npm run dev
```

## 🔐 Auth + Plan Persistence Setup

Create `server/.env` with:

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

Run the SQL migration in `server/sql/001_auth_and_plans.sql` against your Postgres database.

Optional client env (`client/.env`):

```bash
VITE_API_BASE_URL=http://localhost:3001
```
