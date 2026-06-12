-- ─── Dashboard Widgets ───────────────────────────────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- Extends dashboard_layouts so the user owns the *set* of widgets, not just
-- their positions. `widgets` holds the ordered list of widget instances:
--   [{ "id": "uuid", "type": "kpi-metric", "params": { "metricId": "pending_reqs" } }, ...]
-- The instance `id` is the key that links each widget to its rect in `layouts`.

ALTER TABLE dashboard_layouts
  ADD COLUMN IF NOT EXISTS widgets JSONB NOT NULL DEFAULT '[]'::jsonb;
