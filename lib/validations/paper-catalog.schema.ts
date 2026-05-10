import { z } from 'zod'

export const SUBSTRATE_CATEGORIES = ['PAPER', 'FILM', 'LAMINATED', 'SYNTHETIC'] as const
export type SubstrateCategory = typeof SUBSTRATE_CATEGORIES[number]
export const SUBSTRATE_CATEGORY_LABELS: Record<SubstrateCategory, string> = {
  PAPER:     'Papel',
  FILM:      'Film',
  LAMINATED: 'Laminado',
  SYNTHETIC: 'Sintético',
}

export const INK_COMPAT_OPTIONS = ['UV', 'WATER_BASED', 'SOLVENT'] as const
export type InkCompat = typeof INK_COMPAT_OPTIONS[number]
export const INK_COMPAT_LABELS: Record<InkCompat, string> = {
  UV:          'UV',
  WATER_BASED: 'Base agua',
  SOLVENT:     'Solvente',
}

export const STOCK_UNITS = ['m2', 'm', 'kg'] as const
export type StockUnit = typeof STOCK_UNITS[number]
export const STOCK_UNIT_LABELS: Record<StockUnit, string> = {
  m2: 'm²',
  m:  'm',
  kg: 'kg',
}

export const paperCatalogSchema = z.object({
  code:               z.string().min(1, 'El código es requerido'),
  name:               z.string().min(2, 'El nombre es requerido'),
  description:        z.string().nullable().optional(),
  provider_id:        z.number().int().positive().nullable().optional(),
  // Material
  substrate_category: z.enum(SUBSTRATE_CATEGORIES).nullable().optional(),
  material:           z.string().nullable().optional(),
  // Propiedades físicas — thickness_mm col almacena µm
  weight_gsm:         z.number().positive('Debe ser positivo').nullable().optional(),
  thickness_mm:       z.number().positive('Debe ser positivo').nullable().optional(),
  standard_width_m:   z.number().positive('Debe ser positivo').nullable().optional(),
  // Técnicas
  ink_compatibility:  z.array(z.enum(INK_COMPAT_OPTIONS)).nullable().optional(),
  bulk_cm3g:          z.number().positive('Debe ser positivo').nullable().optional(),
  // Inventario
  min_stock_m2:       z.number().min(0, 'No puede ser negativo').nullable().optional(),
  stock_unit:         z.enum(STOCK_UNITS),
  // Producción
  reel_diameter_mm:   z.number().positive('Debe ser positivo').nullable().optional(),
  core_mm:            z.number().positive('Debe ser positivo').nullable().optional(),
})

export type PaperCatalogFormValues = z.infer<typeof paperCatalogSchema>
