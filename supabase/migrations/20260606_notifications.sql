-- ─── Notifications Module ────────────────────────────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- In-app notification feed. Rows are written by the server (service_role) from
-- the notify() helper; each user reads/updates only their own rows via RLS.

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,        -- pending_requisitions | quality_pending | low_stock | order_overdue | requisition_approved | requisition_rejected
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,                 -- in-app path to open on click (e.g. /dashboard/requisitions/12)
  metadata    JSONB DEFAULT '{}',   -- arbitrary payload (item_id, requisition_id, etc.)
  read_at     TIMESTAMPTZ,          -- NULL = unread
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user        ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON notifications(created_at DESC);

-- 2. RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Each user reads only their own notifications
CREATE POLICY "users_read_own_notifications" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Each user can mark their own notifications as read (UPDATE)
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT is performed only by service_role (notify() helper) which bypasses RLS.
-- No INSERT policy is defined on purpose, so clients cannot forge notifications.

-- 2b. Dedup column for the daily overdue-order cron, so a given order only
-- triggers one order_overdue notification (not one per cron run).
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS overdue_notified_at TIMESTAMPTZ;

-- 3. Realtime (optional): expose table to Supabase Realtime so the bell can
-- subscribe to live inserts. Safe to run repeatedly.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END;
$$;
