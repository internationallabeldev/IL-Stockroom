-- ─── Chat — Private channels (per-user membership) ──────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- Extends 20260611_chat_channels.sql. Adds an `is_private` flag and a
-- `chat_channel_members` table so an ADMIN can restrict a channel to a chosen set
-- of users. Public channels keep the previous behaviour (everyone). Role-based
-- restriction is intentionally left out (do it manually later if needed).

-- 1. chat_channels.is_private ──────────────────────────────────────────────────────
ALTER TABLE chat_channels
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- The general channel can never be private.
UPDATE chat_channels SET is_private = false WHERE is_default = true;

-- 2. Membership table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_channel_members (
  channel_id BIGINT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id    UUID   NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  added_by   UUID   REFERENCES users(id)                  ON DELETE SET NULL,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_channel_members_user
  ON chat_channel_members(user_id);

-- 3. Access helpers (SECURITY DEFINER → bypass RLS to avoid policy recursion) ────────
-- These centralise the visibility rules and let the RLS policies below reference
-- membership without the chat_channels ↔ chat_channel_members policies recursing.
CREATE OR REPLACE FUNCTION chat_is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION chat_is_member(cid BIGINT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_channel_members
    WHERE channel_id = cid AND user_id = auth.uid()
  );
$$;

-- Full message-access rule: honours archival (ADMIN-only) AND privacy (member/ADMIN).
CREATE OR REPLACE FUNCTION chat_can_access_channel(cid BIGINT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_channels cc
    WHERE cc.id = cid
      AND (cc.is_archived = false OR chat_is_admin())
      AND (cc.is_private = false OR chat_is_member(cid) OR chat_is_admin())
  );
$$;

-- 4. RLS — chat_channel_members ─────────────────────────────────────────────────────
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;

-- A user sees their own membership rows and (if they belong) their co-members;
-- ADMINs see everything.
DROP POLICY IF EXISTS "chat_channel_members_select" ON chat_channel_members;
CREATE POLICY "chat_channel_members_select"
  ON chat_channel_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR chat_is_admin()
    OR chat_is_member(channel_id)
  );

-- Only ADMINs manage membership (the server action further restricts to the creator).
DROP POLICY IF EXISTS "chat_channel_members_insert" ON chat_channel_members;
CREATE POLICY "chat_channel_members_insert"
  ON chat_channel_members FOR INSERT
  WITH CHECK (chat_is_admin());

DROP POLICY IF EXISTS "chat_channel_members_delete" ON chat_channel_members;
CREATE POLICY "chat_channel_members_delete"
  ON chat_channel_members FOR DELETE
  USING (chat_is_admin());

-- 5. RLS — chat_channels SELECT honours privacy ─────────────────────────────────────
-- Private channels are hidden from non-members (archived stays visible; the server
-- action filters archived out for non-ADMINs, as before).
DROP POLICY IF EXISTS "chat_channels_select" ON chat_channels;
CREATE POLICY "chat_channels_select"
  ON chat_channels FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_private = false
      OR chat_is_member(id)
      OR chat_is_admin()
    )
  );

-- 6. RLS — chat_messages honours privacy + archival ─────────────────────────────────
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select"
  ON chat_messages FOR SELECT
  USING (auth.uid() IS NOT NULL AND chat_can_access_channel(channel_id));

-- Can't post to a channel you can't access (e.g. a private channel you're not in).
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND chat_can_access_channel(channel_id));


