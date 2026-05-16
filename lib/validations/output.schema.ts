import { z } from 'zod'

export const createInkOutputSchema = z.object({
  requisition_id:   z.number().int().positive(),
  ink_inventory_id: z.number().int().positive('Selecciona un lote'),
  kg_delivered:     z.number().positive('Kg a entregar debe ser mayor a 0'),
  notes:            z.string().optional(),
})

const splitLotSchema = z.object({
  internal_batch: z.string().min(1, 'El lote es requerido'),
  location:       z.string().optional(),
})

export const createPaperOutputSchema = z.object({
  requisition_id:      z.number().int().positive(),
  paper_inventory_id:  z.number().int().positive('Selecciona una bobina'),
  length_m_delivered:  z.number().positive('Largo debe ser mayor a 0'),
  width_m_delivered:   z.number().positive('Ancho debe ser mayor a 0'),
  generates_split:     z.boolean(),
  split_lot_a:         splitLotSchema.optional(),
  split_lot_b:         splitLotSchema.optional(),
  notes:               z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.generates_split) {
    if (!val.split_lot_a?.internal_batch) {
      ctx.addIssue({ code: 'custom', path: ['split_lot_a', 'internal_batch'], message: 'Requerido' })
    }
    if (!val.split_lot_b?.internal_batch) {
      ctx.addIssue({ code: 'custom', path: ['split_lot_b', 'internal_batch'], message: 'Requerido' })
    }
  }
})

export const registerInkReturnSchema = z.object({
  output_id:   z.number().int().positive(),
  kg_returned: z.number().positive('Debe ser mayor a 0'),
})

export const registerPaperReturnSchema = z.object({
  output_id:         z.number().int().positive(),
  length_m_returned: z.number().min(0),
  width_m_returned:  z.number().min(0),
})

export type CreateInkOutputValues   = z.infer<typeof createInkOutputSchema>
export type CreatePaperOutputValues = z.infer<typeof createPaperOutputSchema>
export type RegisterInkReturnValues   = z.infer<typeof registerInkReturnSchema>
export type RegisterPaperReturnValues = z.infer<typeof registerPaperReturnSchema>
