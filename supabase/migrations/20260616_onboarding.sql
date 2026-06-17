-- Onboarding / welcome flow for newly invited users.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Existing users have already been using the system — mark them as onboarded so
-- that only genuinely new invited users are routed through the welcome flow.
UPDATE users SET onboarding_completed = true WHERE onboarding_completed IS NOT TRUE;

-- Admin-editable welcome message shown to new users on their first entry.
INSERT INTO app_settings (key, value, description) VALUES
(
  'onboarding.welcome_message',
  '"Bienvenido al sistema de gestión de inventario de International Label. Si tienes dudas, escríbenos en el canal general del chat."',
  'Mensaje de bienvenida personalizado del administrador para nuevos usuarios'
)
ON CONFLICT (key) DO NOTHING;
