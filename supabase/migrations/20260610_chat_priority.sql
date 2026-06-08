-- ─── Chat message priority ───────────────────────────────────────────────────
-- Optional severity flag set by the author when sending: important | warning | urgent.
-- NULL = normal message. Run in Supabase SQL Editor, then regenerate types.

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS priority TEXT
  CHECK (priority IN ('important', 'warning', 'urgent'));
