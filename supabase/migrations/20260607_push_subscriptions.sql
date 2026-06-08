-- ─── Web Push Subscriptions ──────────────────────────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- Stores one row per browser/device that opted into push notifications.
-- The server (service_role) reads every subscription to fan out pushes; each
-- user can manage only their own rows via RLS.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,        -- unique per browser push endpoint
  p256dh      TEXT NOT NULL,               -- client public key (from PushSubscription)
  auth        TEXT NOT NULL,               -- client auth secret
  user_agent  TEXT,                        -- best-effort device label
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS: users manage only their own subscriptions; the server uses service_role
-- (bypasses RLS) to read all subscriptions when sending.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_push_subs"   ON push_subscriptions;
DROP POLICY IF EXISTS "users_insert_own_push_subs" ON push_subscriptions;
DROP POLICY IF EXISTS "users_delete_own_push_subs" ON push_subscriptions;

CREATE POLICY "users_read_own_push_subs" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_push_subs" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_push_subs" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());
