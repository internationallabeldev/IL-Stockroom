-- ─── Chat — IA assistant bot (Groq) ─────────────────────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- Adds the per-user private "Asistente IA" DM channel, the per-user daily query
-- counter, and the global bot configuration in app_settings.
--
-- MANUAL SETUP (do this BEFORE running the app's bot):
--   1. Dashboard → Authentication → Add user:
--        Email:    claude-bot@internal.il
--        Password: (cualquiera, aleatoria; nunca se usa para login)
--      Copy the generated UUID.
--   2. Insert the bot's profile in public.users (replace UUID-DEL-BOT):
--        INSERT INTO users (id, email, first_name, last_name, nickname, role, enabled)
--        VALUES ('UUID-DEL-BOT', 'claude-bot@internal.il', 'Asistente', 'IA',
--                'Claude', 'USER', true);
--   3. Add to .env.local:
--        GROQ_API_KEY=gsk_...                  (console.groq.com)
--        NEXT_PUBLIC_BOT_USER_ID=UUID-DEL-BOT  (same UUID as above)

-- 1. chat_channels — per-user bot DM channel ────────────────────────────────────
-- A bot DM is a private channel whose members are exactly {user, bot}. `is_bot_dm`
-- lets the UI group it under "Asistente IA"; `bot_owner_id` scopes it to one user.
ALTER TABLE chat_channels
  ADD COLUMN IF NOT EXISTS is_bot_dm    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- One bot DM per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_channels_bot_owner
  ON chat_channels(bot_owner_id)
  WHERE is_bot_dm = true;

-- 2. users — daily query quota ───────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bot_queries_today    INT  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bot_queries_reset_at DATE DEFAULT CURRENT_DATE;

-- 3. app_settings — global bot config ─────────────────────────────────────────────
INSERT INTO app_settings (key, value, description) VALUES
  ('claude_bot.enabled',            'true',                    'Habilitar/deshabilitar el bot de IA globalmente'),
  ('claude_bot.max_queries_per_day','50',                      'Máximo de consultas por usuario por día'),
  ('claude_bot.model',              '"llama-3.1-8b-instant"',  'Modelo de Groq a usar (debe soportar tool use)'),
  ('claude_bot.context_messages',   '10',                      'Mensajes anteriores incluidos como contexto en el canal privado')
ON CONFLICT (key) DO NOTHING;
