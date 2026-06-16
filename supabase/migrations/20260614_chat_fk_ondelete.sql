-- Align chat_messages child FKs with their intended ON DELETE behavior.
-- The original chat schema used CREATE TABLE IF NOT EXISTS, so deployments where
-- these tables already existed kept plain (NO ACTION) FKs. Deleting messages
-- (e.g. clearing a bot DM) then failed with:
--   violates foreign key constraint "chat_read_status_last_read_message_id_fkey"
-- Recreate the constraints idempotently with the correct ON DELETE actions.

ALTER TABLE chat_read_status
  DROP CONSTRAINT IF EXISTS chat_read_status_last_read_message_id_fkey;
ALTER TABLE chat_read_status
  ADD CONSTRAINT chat_read_status_last_read_message_id_fkey
    FOREIGN KEY (last_read_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_reply_to_id_fkey;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_reply_to_id_fkey
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

ALTER TABLE chat_reactions
  DROP CONSTRAINT IF EXISTS chat_reactions_message_id_fkey;
ALTER TABLE chat_reactions
  ADD CONSTRAINT chat_reactions_message_id_fkey
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

ALTER TABLE chat_mentions
  DROP CONSTRAINT IF EXISTS chat_mentions_message_id_fkey;
ALTER TABLE chat_mentions
  ADD CONSTRAINT chat_mentions_message_id_fkey
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;
