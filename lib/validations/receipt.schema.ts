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

// ─── Admin edit schemas (NO quality_certificate) ───────────────────────────────

export const updateInkReceiptAdminSchema = z.object({
  receipt_date:      z.string().min(1, 'La fecha es requerida'),
  invoice_remission: z.string().min(1, 'Remisión/factura requerida'),
  provider_batch:    z.string().min(1, 'Lote proveedor requerido'),
  quality_notes:     z.string().nullable().optional(),
  certificate_url:   z.string().nullable().optional(),
  // Solo editables cuando quality_certificate = PENDING
  internal_batch:    z.string().min(1, 'Lote interno requerido').optional(),
  kg_received:       z.number().positive('Debe ser mayor a 0').optional(),
  units_received:    z.number().int().min(1, 'Mínimo 1 unidad').optional(),
})

export const updatePaperReceiptAdminSchema = z.object({
  receipt_date:      z.string().min(1, 'La fecha es requerida'),
  invoice_remission: z.string().min(1, 'Remisión/factura requerida'),
  provider_batch:    z.string().min(1, 'Lote proveedor requerido'),
  quality_notes:     z.string().nullable().optional(),
  certificate_url:   z.string().nullable().optional(),
  // Solo editables cuando quality_certificate = PENDING
  internal_batch:    z.string().min(1, 'Lote interno requerido').optional(),
  length_m:          z.number().positive('Debe ser mayor a 0').optional(),
  width_m:           z.number().positive('Debe ser mayor a 0').optional(),
  units_received:    z.number().int().min(1, 'Mínimo 1 unidad').optional(),
})

// ─── Correction schemas (solo ADMIN, cuando ya hay lote en inventario) ─────────

export const correctInkLotSchema = z.object({
  new_kg:     z.number().positive('Debe ser mayor a 0'),
  audit_note: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
})

export const correctPaperLotSchema = z.object({
  new_length_m: z.number().positive('Debe ser mayor a 0'),
  new_width_m:  z.number().positive('Debe ser mayor a 0'),
  audit_note:   z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
})

export type CreateInkReceiptValues        = z.infer<typeof createInkReceiptSchema>
export type CreatePaperReceiptValues      = z.infer<typeof createPaperReceiptSchema>
export type UpdateQualityValues           = z.infer<typeof updateQualitySchema>
export type UpdateInkReceiptAdminValues   = z.infer<typeof updateInkReceiptAdminSchema>
export type UpdatePaperReceiptAdminValues = z.infer<typeof updatePaperReceiptAdminSchema>
export type CorrectInkLotValues           = z.infer<typeof correctInkLotSchema>
export type CorrectPaperLotValues         = z.infer<typeof correctPaperLotSchema>
