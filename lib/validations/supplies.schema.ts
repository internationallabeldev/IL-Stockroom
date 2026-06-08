import { z } from 'zod'

export const createCategorySchema = z.object({
  name:        z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres'),
  description: z.string().optional().nullable(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional().nullable(),
})

export const createItemSchema = z.object({
  category_id:      z.number({ required_error: 'La categoría es requerida' }).int().positive(),
  name:             z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description:      z.string().optional().nullable(),
  unit:             z.string().min(1, 'La unidad es requerida').default('piezas'),
  quantity_minimum: z.number({ required_error: 'El mínimo es requerido' }).int().positive('Debe ser positivo'),
  quantity_warning: z.number().int().positive('Debe ser positivo').optional().nullable(),
  provider_id:      z.number().int().positive().optional().nullable(),
})

export const registerMovementSchema = z.object({
  item_id:       z.number().int().positive(),
  movement_type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity:      z.number().int().positive('La cantidad debe ser positiva'),
  notes:         z.string().optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.movement_type === 'ADJUSTMENT' && !val.notes?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Las notas son requeridas para ajustes',
      path: ['notes'],
    })
  }
})

export type CreateCategoryValues = z.infer<typeof createCategorySchema>
export type CreateItemValues     = z.infer<typeof createItemSchema>
export type RegisterMovementValues = z.infer<typeof registerMovementSchema>
