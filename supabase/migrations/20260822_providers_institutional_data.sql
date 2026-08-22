-- ─── Proveedores · datos institucionales, fiscales y comerciales ─────────────
-- Run this entire file in Supabase SQL Editor.
--
-- TODAS las columnas nuevas son NULLABLE a propósito: los proveedores ya
-- capturados (incluido el seed de 20) no tienen estos datos y deben poder
-- editarse sin obligar a llenarlos. La validación de FORMATO vive tanto aquí
-- (CHECK) como en lib/validations/provider.schema.ts, y en ambos casos solo
-- aplica cuando el campo trae valor.
--
-- Para volver obligatorio alguno más adelante: llenar el dato en los registros
-- existentes y recién entonces agregar el NOT NULL.

ALTER TABLE public.providers
  -- ── P1 · Fiscal (requisitos CFDI 4.0) ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS rfc                     TEXT,
  ADD COLUMN IF NOT EXISTS legal_name              TEXT,
  ADD COLUMN IF NOT EXISTS tax_regime              TEXT,
  ADD COLUMN IF NOT EXISTS postal_code             TEXT,
  ADD COLUMN IF NOT EXISTS city                    TEXT,
  ADD COLUMN IF NOT EXISTS state                   TEXT,
  ADD COLUMN IF NOT EXISTS country                 TEXT DEFAULT 'MX',
  -- ── P2 · Comercial y pagos ─────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS payment_terms_days      INTEGER,
  ADD COLUMN IF NOT EXISTS currency                TEXT DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS credit_limit            NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS bank                    TEXT,
  ADD COLUMN IF NOT EXISTS clabe                   TEXT,
  ADD COLUMN IF NOT EXISTS account_number          TEXT,
  ADD COLUMN IF NOT EXISTS customer_number         TEXT,
  -- ── P3 · Operativo y cumplimiento ──────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS billing_email           TEXT,
  ADD COLUMN IF NOT EXISTS website                 TEXT,
  ADD COLUMN IF NOT EXISTS notes                   TEXT,
  ADD COLUMN IF NOT EXISTS csf_url                 TEXT,
  ADD COLUMN IF NOT EXISTS compliance_opinion_date DATE,
  ADD COLUMN IF NOT EXISTS deleted_at              TIMESTAMPTZ;

COMMENT ON COLUMN public.providers.rfc                     IS 'RFC del proveedor. 12 caracteres (moral) o 13 (física). Siempre en mayúsculas.';
COMMENT ON COLUMN public.providers.legal_name              IS 'Razón social como aparece en el CFDI. `name` sigue siendo el nombre comercial.';
COMMENT ON COLUMN public.providers.tax_regime              IS 'Clave del catálogo SAT c_RegimenFiscal (601, 612, 626, ...).';
COMMENT ON COLUMN public.providers.postal_code             IS 'CP del domicilio fiscal. Obligatorio para timbrar CFDI 4.0.';
COMMENT ON COLUMN public.providers.payment_terms_days      IS 'Días de crédito acordados. 0 = pago de contado.';
COMMENT ON COLUMN public.providers.customer_number         IS 'Nuestro número de cliente con ese proveedor (va en la orden de compra).';
COMMENT ON COLUMN public.providers.csf_url                 IS 'URL de la Constancia de Situación Fiscal en storage.';
COMMENT ON COLUMN public.providers.compliance_opinion_date IS 'Fecha de la última opinión de cumplimiento 32-D en sentido positivo.';
COMMENT ON COLUMN public.providers.deleted_at              IS 'Baja definitiva (soft delete). Distinto de `enabled`, que es baja temporal. Aún no hay UI que lo escriba.';

-- ── Constraints de formato ───────────────────────────────────────────────────
-- Postgres no soporta ADD CONSTRAINT IF NOT EXISTS, de ahí el DO block.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_rfc_format') THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_rfc_format
      CHECK (rfc IS NULL OR rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_postal_code_format') THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_postal_code_format
      CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{5}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_clabe_format') THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_clabe_format
      CHECK (clabe IS NULL OR clabe ~ '^[0-9]{18}$');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_currency_valid') THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_currency_valid
      CHECK (currency IS NULL OR currency IN ('MXN', 'USD', 'EUR'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_payment_terms_nonneg') THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_payment_terms_nonneg
      CHECK (payment_terms_days IS NULL OR payment_terms_days >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'providers_credit_limit_nonneg') THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_credit_limit_nonneg
      CHECK (credit_limit IS NULL OR credit_limit >= 0);
  END IF;
END $$;

-- El RFC es la clave natural del proveedor: parcial para no chocar con los
-- registros que todavía no lo tienen capturado.
CREATE UNIQUE INDEX IF NOT EXISTS providers_rfc_unique
  ON public.providers (rfc)
  WHERE rfc IS NOT NULL;
