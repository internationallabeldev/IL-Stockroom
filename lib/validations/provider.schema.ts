import { z } from 'zod'

export const SUPPLY_TYPES = ['INK', 'PAPER', 'SUPPLIES'] as const
export type SupplyType = typeof SUPPLY_TYPES[number]

export const CURRENCIES = ['MXN', 'USD', 'EUR'] as const
export type Currency = typeof CURRENCIES[number]

/** Subconjunto del catálogo SAT c_RegimenFiscal relevante para proveedores. */
export const TAX_REGIMES = [
  { value: '601', label: '601 · General de Ley Personas Morales' },
  { value: '603', label: '603 · Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 · Sueldos y Salarios' },
  { value: '606', label: '606 · Arrendamiento' },
  { value: '610', label: '610 · Residentes en el Extranjero' },
  { value: '612', label: '612 · Personas Físicas con Actividades Empresariales' },
  { value: '616', label: '616 · Sin obligaciones fiscales' },
  { value: '620', label: '620 · Sociedades Cooperativas de Producción' },
  { value: '621', label: '621 · Incorporación Fiscal' },
  { value: '622', label: '622 · Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', label: '623 · Opcional para Grupos de Sociedades' },
  { value: '624', label: '624 · Coordinados' },
  { value: '625', label: '625 · Actividades Empresariales vía Plataformas Tecnológicas' },
  { value: '626', label: '626 · Régimen Simplificado de Confianza' },
] as const

const TAX_REGIME_VALUES = TAX_REGIMES.map(r => r.value) as [string, ...string[]]

/**
 * Campo opcional. Un `<input>` vacío llega como '' desde react-hook-form (no
 * como null), así que primero se normaliza a null y recién después se corre la
 * validación real vía `.pipe()` — así el mensaje de error del schema interno se
 * conserva, cosa que un `z.union` con el validador dentro sí perdería.
 */
const optional = <T extends z.ZodType<unknown, string>>(inner: T) =>
  z.union([z.string(), z.null(), z.undefined()])
    .transform(v => (v === '' || v === undefined ? null : v))
    .pipe(inner.nullable())

/** Igual que `optional`, pero los inputs numéricos llegan como string. */
const optionalNumber = (inner: z.ZodNumber) =>
  z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(v => (v === '' || v === null || v === undefined ? null : Number(v)))
    .pipe(inner.nullable())

const RFC_REGEX   = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/
const CLABE_REGEX = /^[0-9]{18}$/
const CP_REGEX    = /^[0-9]{5}$/

export const providerSchema = z.object({
  // ── Identificación y contacto (sin cambios) ────────────────────────────────
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  whatsapp: optional(z.string().min(7, 'WhatsApp inválido')),
  address: z.string().min(5, 'La dirección es requerida'),
  contact_person: optional(z.string()),
  provider_type: z.enum(['INK_SUPPLIER', 'PAPER_SUPPLIER', 'SUPPLY_SUPPLIER', 'BOTH']),
  logo_url: optional(z.string().url('URL de logo inválida')),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  supply_types: z.array(z.enum(SUPPLY_TYPES)).nullable().optional(),

  // ── P1 · Fiscal ────────────────────────────────────────────────────────────
  rfc: optional(
    z.string()
      .transform(v => v.trim().toUpperCase())
      .refine(v => RFC_REGEX.test(v), 'RFC inválido (12 caracteres para persona moral, 13 para física)'),
  ),
  legal_name: optional(z.string().min(2, 'Razón social demasiado corta')),
  tax_regime: optional(z.enum(TAX_REGIME_VALUES)),
  postal_code: optional(z.string().regex(CP_REGEX, 'El código postal debe tener 5 dígitos')),
  city: optional(z.string()),
  state: optional(z.string()),
  country: optional(z.string()),

  // ── P2 · Comercial y pagos ─────────────────────────────────────────────────
  payment_terms_days: optionalNumber(
    z.number().int('Los días de crédito deben ser un entero').min(0, 'No puede ser negativo'),
  ),
  currency: optional(z.enum(CURRENCIES)),
  credit_limit: optionalNumber(z.number().min(0, 'El límite de crédito no puede ser negativo')),
  bank: optional(z.string()),
  clabe: optional(z.string().regex(CLABE_REGEX, 'La CLABE debe tener 18 dígitos')),
  account_number: optional(z.string()),
  customer_number: optional(z.string()),

  // ── P3 · Operativo y cumplimiento ──────────────────────────────────────────
  billing_email: optional(z.string().email('Email de facturación inválido')),
  website: optional(z.string().url('URL de sitio web inválida')),
  notes: optional(z.string()),
  csf_url: optional(z.string().url('URL de constancia inválida')),
  compliance_opinion_date: optional(z.string()),
}).refine(
  (data) => data.provider_type !== 'BOTH' || (Array.isArray(data.supply_types) && data.supply_types.length >= 2),
  { message: 'Selecciona al menos 2 tipos para proveedor múltiple', path: ['supply_types'] }
)

/** Lo que viven los campos del form (antes del transform). */
export type ProviderFormInput = z.input<typeof providerSchema>
/** Lo que recibe `onSubmit` y lo que se manda a la BD (después del transform). */
export type ProviderFormValues = z.output<typeof providerSchema>
