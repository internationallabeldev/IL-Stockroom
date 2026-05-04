import { z } from 'zod'

export const inkRequisitionItemSchema = z.object({
  ink_catalog_id: z.number().int().positive('Selecciona una tinta'),
  kg_requested:   z.number().positive('Ingresa una cantidad mayor a 0'),
})

export const paperRequisitionItemSchema = z.object({
  paper_catalog_id:    z.number().int().positive('Selecciona un papel'),
  length_m_requested:  z.number().positive('Largo debe ser mayor a 0'),
  width_m_requested:   z.number().positive('Ancho debe ser mayor a 0'),
})

export const createInkRequisitionSchema = z.object({
  production_order: z.string().min(1, 'Orden de producción requerida'),
  notes:            z.string().optional(),
  items:            z.array(inkRequisitionItemSchema).min(1, 'Agrega al menos un ítem'),
})

export const createPaperRequisitionSchema = z.object({
  production_order: z.string().min(1, 'Orden de producción requerida'),
  notes:            z.string().optional(),
  items:            z.array(paperRequisitionItemSchema).min(1, 'Agrega al menos un ítem'),
})

export const rejectRequisitionSchema = z.object({
  reason: z.string().min(1, 'El motivo de rechazo es requerido'),
})

export const fulfillInkOutputSchema = z.object({
  inventory_id: z.number().int().positive(),
  kg_delivered: z.number().positive('Kg a entregar debe ser mayor a 0'),
})

export const fulfillPaperOutputSchema = z.object({
  inventory_id: z.number().int().positive(),
  length_m:     z.number().positive('Largo debe ser mayor a 0'),
  width_m:      z.number().positive('Ancho debe ser mayor a 0'),
})

export type CreateInkRequisitionValues   = z.infer<typeof createInkRequisitionSchema>
export type CreatePaperRequisitionValues = z.infer<typeof createPaperRequisitionSchema>
export type RejectRequisitionValues      = z.infer<typeof rejectRequisitionSchema>
export type FulfillInkOutput             = z.infer<typeof fulfillInkOutputSchema>
export type FulfillPaperOutput           = z.infer<typeof fulfillPaperOutputSchema>
