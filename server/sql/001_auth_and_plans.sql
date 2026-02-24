CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL CHECK (goal IN ('5k', '10k', 'half-marathon', 'marathon')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('race', 'weekly')),
  profile_snapshot JSONB NOT NULL,
  plan_json JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_user_created ON plans (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plans_user_goal_created ON plans (user_id, goal, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_active_per_goal
  ON plans (user_id, goal)
  WHERE is_active = TRUE;
