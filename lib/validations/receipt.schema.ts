import { z } from 'zod'

export const createInkReceiptSchema = z.object({
  purchase_order_item_id: z.number().int().positive(),
  receipt_date:           z.string().min(1, 'La fecha es requerida'),
  invoice_remission:      z.string().min(1, 'Remisión/factura requerida'),
  provider_batch:         z.string().min(1, 'Lote proveedor requerido'),
  internal_batch:         z.string().min(1, 'Lote interno requerido'),
  units_received:         z.number().int().min(1, 'Mínimo 1 unidad'),
  kg_received:            z.number().positive('Debe ser mayor a 0'),
  quality_certificate:    z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL']).default('PENDING'),
  quality_notes:          z.string().nullable().optional(),
  certificate_url:        z.string().nullable().optional(),
})

export const createPaperReceiptSchema = z.object({
  purchase_order_item_id: z.number().int().positive(),
  receipt_date:           z.string().min(1, 'La fecha es requerida'),
  invoice_remission:      z.string().min(1, 'Remisión/factura requerida'),
  provider_batch:         z.string().min(1, 'Lote proveedor requerido'),
  internal_batch:         z.string().min(1, 'Lote interno requerido'),
  units_received:         z.number().int().min(1, 'Mínimo 1 unidad'),
  length_m:               z.number().positive('Debe ser mayor a 0'),
  width_m:                z.number().positive('Debe ser mayor a 0'),
  quality_certificate:    z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL']).default('PENDING'),
  quality_notes:          z.string().nullable().optional(),
  certificate_url:        z.string().nullable().optional(),
})

export const updateQualitySchema = z.object({
  quality_certificate: z.enum(['APPROVED', 'REJECTED', 'CONDITIONAL']),
  quality_notes:       z.string().nullable().optional(),
  certificate_url:     z.string().nullable().optional(),
})

export type CreateInkReceiptValues   = z.infer<typeof createInkReceiptSchema>
export type CreatePaperReceiptValues = z.infer<typeof createPaperReceiptSchema>
export type UpdateQualityValues      = z.infer<typeof updateQualitySchema>
