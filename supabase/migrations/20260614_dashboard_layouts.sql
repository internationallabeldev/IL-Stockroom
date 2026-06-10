-- ─── Dashboard Layouts ───────────────────────────────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- Stores the per-user dashboard grid arrangement (Grafana-style drag & resize).
-- One row per user × dashboard variant (each role sees a different dashboard).
-- `layouts` holds the serialized grid per responsive breakpoint:
--   { "lg": [{ "i": "kpi-ink", "x": 0, "y": 0, "w": 3, "h": 2 }, ...], "md": [...], "xs": [...] }

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dashboard_key TEXT NOT NULL CHECK (dashboard_key IN ('admin', 'purchaser', 'warehouse', 'producer', 'user')),
  layouts       JSONB NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, dashboard_key)
);

-- RLS: each user manages only their own layout rows. Server actions use
-- service_role (bypasses RLS) but always scope queries by the session user id.
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_dashboard_layouts" ON dashboard_layouts;
DROP POLICY IF EXISTS "users_insert_own_dashboard_layouts" ON dashboard_layouts;
DROP POLICY IF EXISTS "users_update_own_dashboard_layouts" ON dashboard_layouts;
DROP POLICY IF EXISTS "users_delete_own_dashboard_layouts" ON dashboard_layouts;

CREATE POLICY "users_select_own_dashboard_layouts" ON dashboard_layouts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_dashboard_layouts" ON dashboard_layouts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_dashboard_layouts" ON dashboard_layouts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_dashboard_layouts" ON dashboard_layouts
  FOR DELETE USING (user_id = auth.uid());
