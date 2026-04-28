import { z } from 'zod'

export const INK_TYPES = ['UV', 'WATER_BASED', 'SOLVENT'] as const
export type InkType = typeof INK_TYPES[number]

export const INK_TYPE_LABELS: Record<InkType, string> = {
  UV:          'UV',
  WATER_BASED: 'Base agua',
  SOLVENT:     'Solvente',
}

export const inkCatalogSchema = z.object({
  code:            z.string().min(1, 'El código es requerido'),
  name:            z.string().min(2, 'El nombre es requerido'),
  description:     z.string().nullable().optional(),
  provider_id:     z.number().int().positive().nullable().optional(),
  // density col → Volumen de anilox (cm³/m²)
  density:         z.number().positive('Debe ser positivo').nullable().optional(),
  viscosity:       z.number().positive('Debe ser positivo').nullable().optional(),
  ink_type:        z.enum(INK_TYPES).nullable().optional(),
  prepress_pct:    z.number().min(0, 'Mínimo 0').max(100, 'Máximo 100').nullable().optional(),
  optical_density: z.number().positive('Debe ser positivo').nullable().optional(),
  color_code:      z.string().nullable().optional(),
  min_stock_kg:    z.number().min(0, 'No puede ser negativo'),
})

export type InkCatalogFormValues = z.infer<typeof inkCatalogSchema>
