-- Fix: record_id was BIGINT but users table uses UUID as primary key.
-- Change to TEXT to support both BIGINT and UUID ids across all audited tables.

ALTER TABLE audit_log ALTER COLUMN record_id TYPE TEXT;

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id        UUID;
  v_user_name      TEXT;
  v_old_data       JSONB;
  v_new_data       JSONB;
  v_changed_fields TEXT[];
  v_record_id      TEXT;
BEGIN
  -- Resolve user from set_config or auth.uid() fallback
  BEGIN
    v_user_id := COALESCE(
      NULLIF(current_setting('app.current_user_id', true), '')::UUID,
      auth.uid()
    );
  EXCEPTION WHEN OTHERS THEN
    v_user_id := auth.uid();
  END;

  -- Resolve display name
  IF v_user_id IS NOT NULL THEN
    SELECT (first_name || ' ' || last_name) INTO v_user_name
    FROM users
    WHERE id = v_user_id;
  END IF;

  -- Prepare data per operation
  IF TG_OP = 'INSERT' THEN
    v_new_data  := to_jsonb(NEW);
    v_old_data  := NULL;
    v_record_id := to_jsonb(NEW)->>'id';

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data  := to_jsonb(OLD);
    v_new_data  := to_jsonb(NEW);
    v_record_id := to_jsonb(NEW)->>'id';

    -- Only fields that actually changed
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW)) n
    WHERE n.value IS DISTINCT FROM (to_jsonb(OLD)->n.key);

    -- Skip noisy-only timestamp updates
    IF v_changed_fields = ARRAY['updated_at'] THEN
      RETURN NEW;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_old_data  := to_jsonb(OLD);
    v_new_data  := NULL;
    v_record_id := to_jsonb(OLD)->>'id';
  END IF;

  -- Write audit entry
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
