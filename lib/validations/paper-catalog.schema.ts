import { z } from 'zod'

export const paperCatalogSchema = z.object({
  code:             z.string().min(1, 'El código es requerido'),
  name:             z.string().min(2, 'El nombre es requerido'),
  description:      z.string().nullable().optional(),
  provider_id:      z.number().int().positive().nullable().optional(),
  weight_gsm:       z.number().positive('Debe ser positivo').nullable().optional(),
  thickness_mm:     z.number().positive('Debe ser positivo').nullable().optional(),
  density:          z.number().positive('Debe ser positivo').nullable().optional(),
  standard_width_m: z.number().positive('Debe ser positivo').nullable().optional(),
  min_stock_m2:     z.number().min(0, 'No puede ser negativo').nullable().optional(),
})

export type PaperCatalogFormValues = z.infer<typeof paperCatalogSchema>
