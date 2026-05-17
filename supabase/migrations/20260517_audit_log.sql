-- ─── Audit Log Module ────────────────────────────────────────────────────────
-- Run this entire file in Supabase SQL Editor.
-- After running: configure RLS in the Supabase Dashboard:
--   audit_log → only SELECT for ADMIN (via users table role check)
--   audit_log → INSERT only for service_role / postgres (trigger uses SECURITY DEFINER)

-- 1. Drop obsolete table
DROP TABLE IF EXISTS inventory_corrections;

-- 2. Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id               BIGSERIAL PRIMARY KEY,
  table_name       TEXT NOT NULL,
  operation        TEXT NOT NULL,        -- INSERT | UPDATE | DELETE
  record_id        BIGINT,               -- id of the affected record
  old_data         JSONB,                -- previous values (UPDATE/DELETE)
  new_data         JSONB,                -- new values (INSERT/UPDATE)
  changed_fields   TEXT[],              -- only changed fields (UPDATE)
  performed_by     UUID,                 -- auth.uid() or set_config
  performed_by_name TEXT,               -- user display name for fast queries
  ip_address       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_table        ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation    ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at   ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record       ON audit_log(table_name, record_id);

-- 3. Helper function: set current user from Server Action before mutation
CREATE OR REPLACE FUNCTION set_current_user_id(user_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::TEXT, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id       UUID;
  v_user_name     TEXT;
  v_old_data      JSONB;
  v_new_data      JSONB;
  v_changed_fields TEXT[];
  v_record_id     BIGINT;
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
    v_new_data   := to_jsonb(NEW);
    v_old_data   := NULL;
    v_record_id  := (to_jsonb(NEW)->>'id')::BIGINT;

  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data  := to_jsonb(OLD);
    v_new_data  := to_jsonb(NEW);
    v_record_id := (to_jsonb(NEW)->>'id')::BIGINT;

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
    v_record_id := (to_jsonb(OLD)->>'id')::BIGINT;
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

-- 5. Apply trigger to all relevant tables
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'providers',
    'ink_catalog',
    'paper_catalog',
    'purchase_orders',
    'purchase_order_ink_items',
    'purchase_order_paper_items',
    'ink_receipts',
    'paper_receipts',
    'ink_inventory',
    'paper_inventory',
    'ink_outputs',
    'paper_outputs',
    'production_requisitions',
    'requisition_ink_items',
    'requisition_paper_items',
    'users'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS audit_%I ON %I;
      CREATE TRIGGER audit_%I
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- 6. RLS policy for audit_log
-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only ADMIN users can read audit_log
CREATE POLICY "admin_read_audit_log" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
    )
  );

-- INSERT is only allowed by service_role (SECURITY DEFINER triggers use it implicitly)
-- No INSERT policy needed — service_role bypasses RLS.
