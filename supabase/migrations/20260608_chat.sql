-- ─── Chat / Announcements Module ─────────────────────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- Internal chat with a single general channel, realtime via Supabase Realtime.
-- The full schema (5 tables) is created up front; server actions / UI ship by phase.

-- 0. updated_at helper (does not exist yet in this project)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_channels (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  slug        TEXT UNIQUE NOT NULL,        -- 'general', 'warehouse', etc.
  is_default  BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id           BIGSERIAL PRIMARY KEY,
  channel_id   BIGINT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,              -- Tiptap HTML
  content_text TEXT,                       -- plain text for search / notifications / mentions
  reply_to_id  BIGINT REFERENCES chat_messages(id) ON DELETE SET NULL,
  is_pinned    BOOLEAN DEFAULT false,
  is_deleted   BOOLEAN DEFAULT false,
  deleted_at   TIMESTAMPTZ,
  edited_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_reactions (
  id         BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)       -- one user can't react twice with same emoji
);

CREATE TABLE IF NOT EXISTS chat_mentions (
  id                BIGSERIAL PRIMARY KEY,
  message_id        BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read           BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_read_status (
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id           BIGINT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  last_read_message_id BIGINT REFERENCES chat_messages(id) ON DELETE SET NULL,
  last_read_at         TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, channel_id)
);

-- 2. Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel
  ON chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply
  ON chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message
  ON chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_user
  ON chat_mentions(mentioned_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_chat_read_status_user
  ON chat_read_status(user_id);

-- 3. updated_at trigger ──────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Seed — general channel ──────────────────────────────────────────────────────
INSERT INTO chat_channels (name, description, slug, is_default)
VALUES ('General', 'Canal general para todos', 'general', true)
ON CONFLICT (slug) DO NOTHING;

-- 5. RLS ─────────────────────────────────────────────────────────────────────────

-- chat_channels: any authenticated user can read
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_channels_select" ON chat_channels;
CREATE POLICY "chat_channels_select"
  ON chat_channels FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- chat_messages: all can read/send; author can edit; author or ADMIN can soft-delete
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select"
  ON chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Author edits/deletes own message, OR ADMIN updates any (covers soft-delete + pin via admin path)
DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;
CREATE POLICY "chat_messages_update"
  ON chat_messages FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- chat_reactions
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_reactions_select" ON chat_reactions;
CREATE POLICY "chat_reactions_select"
  ON chat_reactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "chat_reactions_insert" ON chat_reactions;
CREATE POLICY "chat_reactions_insert"
  ON chat_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_reactions_delete" ON chat_reactions;
CREATE POLICY "chat_reactions_delete"
  ON chat_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- chat_mentions
ALTER TABLE chat_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_mentions_select" ON chat_mentions;
CREATE POLICY "chat_mentions_select"
  ON chat_mentions FOR SELECT
  USING (auth.uid() = mentioned_user_id);

DROP POLICY IF EXISTS "chat_mentions_insert" ON chat_mentions;
CREATE POLICY "chat_mentions_insert"
  ON chat_mentions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "chat_mentions_update" ON chat_mentions;
CREATE POLICY "chat_mentions_update"
  ON chat_mentions FOR UPDATE
  USING (auth.uid() = mentioned_user_id);

-- chat_read_status
ALTER TABLE chat_read_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_read_status_all" ON chat_read_status;
CREATE POLICY "chat_read_status_all"
  ON chat_read_status FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Realtime — expose tables to supabase_realtime (idempotent) ────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['chat_messages', 'chat_reactions', 'chat_mentions'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END;
$$;
