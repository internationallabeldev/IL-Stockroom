-- ─── Chat — Multiple channels + retention/archival ──────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- Extends the chat module from 20260608_chat.sql so ADMINs can create, edit,
-- archive and delete channels, with automatic time-based message cleanup.

-- 1. chat_channels columns ───────────────────────────────────────────────────────
ALTER TABLE chat_channels
  ADD COLUMN IF NOT EXISTS is_archived    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_days INT DEFAULT 90,   -- NULL = keep forever
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

-- updated_at trigger (helper fn already created in 20260608_chat.sql)
DROP TRIGGER IF EXISTS update_chat_channels_updated_at ON chat_channels;
CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON chat_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_chat_channels_archived
  ON chat_channels(is_archived);

-- 2. RLS — channel management (ADMIN). SELECT stays open to all authenticated;
--    the server action filters archived channels out for non-ADMINs. ────────────────
DROP POLICY IF EXISTS "chat_channels_insert" ON chat_channels;
CREATE POLICY "chat_channels_insert"
  ON chat_channels FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "chat_channels_update" ON chat_channels;
CREATE POLICY "chat_channels_update"
  ON chat_channels FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "chat_channels_delete" ON chat_channels;
CREATE POLICY "chat_channels_delete"
  ON chat_channels FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 3. RLS — message visibility honours archival ─────────────────────────────────────
-- Non-archived channels: any authenticated user. Archived channels: ADMIN only.
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
DROP POLICY IF EXISTS "Todos pueden ver mensajes" ON chat_messages;
DROP POLICY IF EXISTS "Ver mensajes según canal" ON chat_messages;
CREATE POLICY "chat_messages_select"
  ON chat_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM chat_channels
        WHERE id = channel_id AND is_archived = false
      )
      OR EXISTS (
        SELECT 1 FROM chat_channels cc
        JOIN users u ON u.id = auth.uid()
        WHERE cc.id = channel_id AND cc.is_archived = true AND u.role = 'ADMIN'
      )
    )
  );

-- 4. Automatic cleanup (pg_cron) ───────────────────────────────────────────────────
-- Enable pg_cron in Dashboard → Database → Extensions first. If it isn't
-- available on the plan, run the DELETE below from an Edge Function on a schedule.
-- Pinned messages (is_pinned = true) and channels with retention_days = NULL are
-- never touched.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-chat-messages')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-chat-messages');
    PERFORM cron.schedule(
      'cleanup-chat-messages',
      '0 3 * * *',
      $cron$
        DELETE FROM chat_messages cm
        USING chat_channels cc
        WHERE cm.channel_id = cc.id
          AND cm.is_pinned = false
          AND cc.retention_days IS NOT NULL
          AND cm.created_at < NOW() - (cc.retention_days || ' days')::INTERVAL;
      $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron not installed — schedule chat cleanup via an Edge Function instead.';
  END IF;
END;
$$;
