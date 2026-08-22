-- ─── Fix: login con Google autoregistraba cuentas sin invitación ────────────────
-- Run this entire file in Supabase SQL Editor.
--
-- Causa: handle_new_user() (trigger AFTER INSERT ON auth.users) crea la fila en
-- public.users para CUALQUIER alta en auth.users, sin distinguir su origen.
-- signInWithOAuth crea una fila en auth.users para CUALQUIER cuenta de Google la
-- primera vez que inicia sesión — el trigger entonces le creaba un perfil
-- (role USER, enabled true) aunque nadie la hubiera invitado, dándole acceso
-- completo pese al chequeo de invitación en app/auth/callback/route.ts (ese
-- chequeo ya encontraba el perfil, porque el trigger lo acababa de crear).
--
-- Fix: el trigger solo crea el perfil cuando el alta viene del flujo de
-- invitación del admin (inviteUser → generateLink, que deja
-- raw_app_meta_data.provider = 'email'). Las altas por OAuth (provider
-- 'google', etc.) ya no generan perfil — quedan sin fila en public.users y el
-- chequeo de invitación en el callback las bloquea como corresponde.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' != 'email' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, email, first_name, last_name, role, enabled)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER')::user_role,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
