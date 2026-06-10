-- ─── Fix: "Database error saving new user" al crear usuarios ────────────────────────
-- Run this entire file in Supabase SQL Editor.
--
-- Causa: handle_new_user() y audit_trigger_function() son SECURITY DEFINER pero NO
-- fijaban search_path. Cuando GoTrue (rol supabase_auth_admin, cuyo search_path no
-- incluye `public`) dispara el trigger al dar de alta un usuario, el cast `::user_role`
-- y las referencias sin esquema (`users`, `audit_log`) no resuelven → falla el alta.
-- En el SQL Editor corre como `postgres` (con public en el path), por eso ahí sí
-- funciona. La solución es fijar `SET search_path = public` en ambas funciones.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
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

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id        UUID;
  v_user_name      TEXT;
  v_old_data       JSONB;
  v_new_data       JSONB;
  v_changed_fields TEXT[];
  v_record_id      TEXT;
BEGIN
  BEGIN
    v_user_id := COALESCE(
      NULLIF(current_setting('app.current_user_id', true), '')::UUID,
      auth.uid()
    );
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF v_user_id IS NOT NULL THEN
    SELECT (first_name || ' ' || last_name) INTO v_user_name
    FROM users
    WHERE id = v_user_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_new_data  := to_jsonb(NEW);
    v_old_data  := NULL;
    v_record_id := to_jsonb(NEW)->>'id';

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data  := to_jsonb(OLD);
    v_new_data  := to_jsonb(NEW);
    v_record_id := to_jsonb(NEW)->>'id';

    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW)) n
    WHERE n.value IS DISTINCT FROM (to_jsonb(OLD)->n.key);

    IF v_changed_fields = ARRAY['updated_at'] THEN
      RETURN NEW;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_data  := to_jsonb(OLD);
    v_new_data  := NULL;
    v_record_id := to_jsonb(OLD)->>'id';
  END IF;

  INSERT INTO audit_log (
    table_name, operation, record_id,
    old_data, new_data, changed_fields,
    performed_by, performed_by_name
  ) VALUES (
    TG_TABLE_NAME, TG_OP, v_record_id,
    v_old_data, v_new_data, v_changed_fields,
    v_user_id, v_user_name
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;
