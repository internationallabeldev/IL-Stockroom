'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }    from './auth.actions'
import { revalidatePath }    from 'next/cache'
import { setAuditUser }      from '@/lib/supabase/audit'
import { notifyRoles }       from './notifications.actions'
import {
  createInkReceiptSchema,
  createPaperReceiptSchema,
  updateQualitySchema,
  updateInkReceiptAdminSchema,
  updatePaperReceiptAdminSchema,
  correctInkLotSchema,
  correctPaperLotSchema,
} from '@/lib/validations/receipt.schema'
import type { Database } from '@/types/database.types'
import { logger } from '@/lib/logger'

type QualityCertificate = Database['public']['Enums']['quality_certificate']

// ─── Types ─────────────────────────────────────────────────────────────────────

export type InkReceiptRow   = Database['public']['Tables']['ink_receipts']['Row']
export type PaperReceiptRow = Database['public']['Tables']['paper_receipts']['Row']

export type InkReceiptWithContext = InkReceiptRow & {
  purchase_order_item: {
    id: number
    purchase_order_id: number
    ink_catalog: { id: number; code: string; name: string } | null
    purchase_order: {
      id: number
      order_number: number
      providers: { name: string } | null
    } | null
  } | null
}

export type PaperReceiptWithContext = PaperReceiptRow & {
  purchase_order_item: {
    id: number
    purchase_order_id: number
    paper_catalog: { id: number; code: string; name: string } | null
    purchase_order: {
      id: number
      order_number: number
      providers: { name: string } | null
    } | null
  } | null
}

export type InkReceiptWithInventory   = InkReceiptRow   & { inventory_id: number | null }
export type PaperReceiptWithInventory = PaperReceiptRow & { inventory_id: number | null }

export type OrderWithReceipts = {
  id: number
  order_number: number
  material_type: 'INK' | 'PAPER'
  status: string | null
  providers: { id: number; name: string } | null
  ink_items: Array<{
    id: number
    ink_catalog_id: number
    units_ordered: number
    units_received: number | null
    kg_per_unit: number
    total_kg_ordered: number | null
    total_kg_received: number | null
    is_complete: boolean | null
    item_notes: string | null
    ink_catalog: { id: number; code: string; name: string; color_code: string | null } | null
    ink_receipts: InkReceiptWithInventory[]
  }>
  paper_items: Array<{
    id: number
    paper_catalog_id: number
    units_ordered: number
    units_received: number | null
    length_m_per_unit: number
    width_m: number
    total_m2_ordered: number | null
    total_m2_received: number | null
    is_complete: boolean | null
    item_notes: string | null
    paper_catalog: { id: number; code: string; name: string; material: string | null; weight_gsm: number | null } | null
    paper_receipts: PaperReceiptWithInventory[]
  }>
}

export type ReceivableOrder = {
  id: number
  order_number: number
  material_type: 'INK' | 'PAPER'
  status: string | null
  expected_delivery_date: string | null
  providers: { id: number; name: string } | null
  ink_items:   { id: number; units_ordered: number; units_received: number | null; is_complete: boolean | null }[]
  paper_items: { id: number; units_ordered: number; units_received: number | null; is_complete: boolean | null }[]
}

const CAN_RECEIVE   = ['ADMIN', 'WAREHOUSE_MANAGER']
const CERT_BUCKET   = 'quality-certificates'
const CERT_EXTS     = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const PATHS        = ['/dashboard/receipts', '/dashboard/orders/ink', '/dashboard/orders/paper']

// ─── Certificate upload ────────────────────────────────────────────────────────

export async function uploadCertificate(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File)) return { error: 'No se proporcionó archivo' }

  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  if (!CERT_EXTS.includes(ext)) return { error: 'Solo se permiten PDF, JPG o PNG' }

  const supabase = createAdminClient()
  const path     = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(CERT_BUCKET)
    .upload(path, file, { contentType: file.type })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage
    .from(CERT_BUCKET)
    .getPublicUrl(data.path)

  return { url: publicUrl }
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getPendingQualityReceipts(): Promise<{
  inkReceipts: InkReceiptWithContext[]
  paperReceipts: PaperReceiptWithContext[]
}> {
  const supabase = createAdminClient()

  const [inkRes, paperRes] = await Promise.all([
    supabase
      .from('ink_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_ink_items (
          id, purchase_order_id,
          ink_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .eq('quality_certificate', 'PENDING')
      .order('receipt_date', { ascending: true }),

    supabase
      .from('paper_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_paper_items (
          id, purchase_order_id,
          paper_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .eq('quality_certificate', 'PENDING')
      .order('receipt_date', { ascending: true }),
  ])

  return {
    inkReceipts:   (inkRes.data   ?? []) as unknown as InkReceiptWithContext[],
    paperReceipts: (paperRes.data ?? []) as unknown as PaperReceiptWithContext[],
  }
}

export async function getAllReceipts(): Promise<{
  inkReceipts: InkReceiptWithContext[]
  paperReceipts: PaperReceiptWithContext[]
}> {
  const supabase = createAdminClient()

  const [inkRes, paperRes] = await Promise.all([
    supabase
      .from('ink_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_ink_items (
          id, purchase_order_id,
          ink_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .order('receipt_date', { ascending: false })
      .limit(500),

    supabase
      .from('paper_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_paper_items (
          id, purchase_order_id,
          paper_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .order('receipt_date', { ascending: false })
      .limit(500),
  ])

  return {
    inkReceipts:   (inkRes.data   ?? []) as unknown as InkReceiptWithContext[],
    paperReceipts: (paperRes.data ?? []) as unknown as PaperReceiptWithContext[],
  }
}

export async function getOrderWithReceipts(orderId: number): Promise<OrderWithReceipts | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id, order_number, material_type, status,
      providers:provider_id ( id, name ),
      ink_items:purchase_order_ink_items (
        id, ink_catalog_id, units_ordered, units_received, kg_per_unit,
        total_kg_ordered, total_kg_received, is_complete, item_notes,
        ink_catalog ( id, code, name, color_code ),
        ink_receipts (*, ink_inventory:ink_inventory!ink_inventory_receipt_id_fkey(id))
      ),
      paper_items:purchase_order_paper_items (
        id, paper_catalog_id, units_ordered, units_received, length_m_per_unit, width_m,
        total_m2_ordered, total_m2_received, is_complete, item_notes,
        paper_catalog ( id, code, name, material, weight_gsm ),
        paper_receipts (*, paper_inventory:paper_inventory!paper_inventory_receipt_id_fkey(id))
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as unknown as OrderWithReceipts
}

export async function getReceivableOrders(): Promise<{
  inkOrders: ReceivableOrder[]
  paperOrders: ReceivableOrder[]
}> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('purchase_orders')
    .select(`
      id, order_number, material_type, status, expected_delivery_date,
      providers:provider_id ( id, name ),
      ink_items:purchase_order_ink_items ( id, units_ordered, units_received, is_complete ),
      paper_items:purchase_order_paper_items ( id, units_ordered, units_received, is_complete )
    `)
    .in('status', ['PENDING', 'PARTIAL'])
    .order('order_number', { ascending: false })

  const orders = (data ?? []) as unknown as ReceivableOrder[]

  return {
    inkOrders:   orders.filter(o => o.material_type === 'INK'),
    paperOrders: orders.filter(o => o.material_type === 'PAPER'),
  }
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function createInkReceipt(
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createInkReceiptSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const d = parsed.data

  // Check internal_batch uniqueness
  const { data: existing } = await supabase
    .from('ink_receipts')
    .select('id')
    .eq('internal_batch', d.internal_batch)
    .maybeSingle()

  if (existing) return { error: `El lote interno "${d.internal_batch}" ya existe` }

  // Fetch current item state
  const { data: item } = await supabase
    .from('purchase_order_ink_items')
    .select('units_ordered, units_received, purchase_order_id')
    .eq('id', d.purchase_order_item_id)
    .single()

  if (!item) return { error: 'Artículo de orden no encontrado' }

  const { error: receiptError } = await supabase
    .from('ink_receipts')
    .insert({
      purchase_order_item_id: d.purchase_order_item_id,
      receipt_date:           d.receipt_date,
      invoice_remission:      d.invoice_remission,
      provider_batch:         d.provider_batch,
      internal_batch:         d.internal_batch,
      units_received:         d.units_received,
      kg_received:            d.kg_received,
      quality_certificate:    d.quality_certificate as QualityCertificate,
      quality_notes:          d.quality_notes ?? null,
      certificate_url:        d.certificate_url ?? null,
      received_by:            user.id,
    } as any)

  if (receiptError) return { error: receiptError.message }

  await _updateOrderItemAndStatus(supabase, item.purchase_order_id, d.purchase_order_item_id, d.units_received, item.units_ordered, item.units_received ?? 0, 'INK')

  if (d.quality_certificate === 'PENDING') {
    await notifyRoles(['ADMIN', 'WAREHOUSE_MANAGER'], {
      type:  'quality_pending',
      title: `Recepción de tinta pendiente de calidad`,
      body:  `Lote ${d.internal_batch} requiere revisión de calidad.`,
      link:  `/dashboard/receipts/ink`,
      metadata: { internal_batch: d.internal_batch, purchase_order_id: item.purchase_order_id },
      email: { badge: '🔬 Calidad pendiente', subtitle: `Lote ${d.internal_batch}` },
    })
  }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/receipts/${item.purchase_order_id}`)
  return { success: true }
}

export async function createPaperReceipt(
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createPaperReceiptSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const d = parsed.data

  // Check internal_batch uniqueness
  const { data: existing } = await supabase
    .from('paper_receipts')
    .select('id')
    .eq('internal_batch', d.internal_batch)
    .maybeSingle()

  if (existing) return { error: `El lote interno "${d.internal_batch}" ya existe` }

  const { data: item } = await supabase
    .from('purchase_order_paper_items')
    .select('units_ordered, units_received, purchase_order_id')
    .eq('id', d.purchase_order_item_id)
    .single()

  if (!item) return { error: 'Artículo de orden no encontrado' }

  const { error: receiptError } = await supabase
    .from('paper_receipts')
    .insert({
      purchase_order_item_id: d.purchase_order_item_id,
      receipt_date:           d.receipt_date,
      invoice_remission:      d.invoice_remission,
      provider_batch:         d.provider_batch,
      internal_batch:         d.internal_batch,
      units_received:         d.units_received,
      length_m:               d.length_m,
      width_m:                d.width_m,
      quality_certificate:    d.quality_certificate as QualityCertificate,
      quality_notes:          d.quality_notes ?? null,
      certificate_url:        d.certificate_url ?? null,
      received_by:            user.id,
    } as any)

  if (receiptError) return { error: receiptError.message }

  await _updateOrderItemAndStatus(supabase, item.purchase_order_id, d.purchase_order_item_id, d.units_received, item.units_ordered, item.units_received ?? 0, 'PAPER')

  if (d.quality_certificate === 'PENDING') {
    await notifyRoles(['ADMIN', 'WAREHOUSE_MANAGER'], {
      type:  'quality_pending',
      title: `Recepción de papel pendiente de calidad`,
      body:  `Lote ${d.internal_batch} requiere revisión de calidad.`,
      link:  `/dashboard/receipts/paper`,
      metadata: { internal_batch: d.internal_batch, purchase_order_id: item.purchase_order_id },
      email: { badge: '🔬 Calidad pendiente', subtitle: `Lote ${d.internal_batch}` },
    })
  }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/receipts/${item.purchase_order_id}`)
  return { success: true }
}

export async function updateInkReceiptQuality(
  receiptId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = updateQualitySchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('ink_receipts')
    .select('quality_certificate, internal_batch')
    .eq('id', receiptId)
    .single()

  if (current?.quality_certificate !== 'PENDING') {
    return { error: 'Esta recepción ya fue procesada. No se puede cambiar la decisión de calidad.' }
  }

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('ink_receipts')
    .update({
      quality_certificate: parsed.data.quality_certificate as QualityCertificate,
      quality_notes:       parsed.data.quality_notes ?? null,
      certificate_url:     parsed.data.certificate_url ?? null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', receiptId)

  if (error) {
    logger.error('updateInkReceiptQuality', { receiptId, msg: error.message })
    return { error: error.message }
  }

  await alertQualityResult(parsed.data.quality_certificate, current.internal_batch, '/dashboard/receipts/ink', parsed.data.quality_notes, receiptId)

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath('/dashboard/inventory/inks')
  return { success: true }
}

/** Notify purchasing + admin when a quality decision is REJECTED or CONDITIONAL. */
async function alertQualityResult(
  decision: string,
  batch: string,
  link: string,
  notes: string | null | undefined,
  receiptId: number,
): Promise<void> {
  if (decision !== 'REJECTED' && decision !== 'CONDITIONAL') return
  const rejected = decision === 'REJECTED'
  await notifyRoles(['ADMIN', 'PURCHASER'], {
    type:  'quality_result',
    title: `${rejected ? 'Calidad rechazada' : 'Calidad condicional'}: lote ${batch}`,
    body:  notes
      ? `Nota: ${notes}`
      : `El lote ${batch} ${rejected ? 'fue rechazado' : 'quedó condicional'} y requiere atención de compras.`,
    link,
    metadata: { receipt_id: receiptId, decision },
    email: { badge: rejected ? '⛔ Calidad rechazada' : '⚠️ Calidad condicional', subtitle: `Lote ${batch}` },
  })
}

export async function updatePaperReceiptQuality(
  receiptId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = updateQualitySchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('paper_receipts')
    .select('quality_certificate, internal_batch')
    .eq('id', receiptId)
    .single()

  if (current?.quality_certificate !== 'PENDING') {
    return { error: 'Esta recepción ya fue procesada. No se puede cambiar la decisión de calidad.' }
  }

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('paper_receipts')
    .update({
      quality_certificate: parsed.data.quality_certificate as QualityCertificate,
      quality_notes:       parsed.data.quality_notes ?? null,
      certificate_url:     parsed.data.certificate_url ?? null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', receiptId)

  if (error) {
    logger.error('updatePaperReceiptQuality', { receiptId, msg: error.message })
    return { error: error.message }
  }

  await alertQualityResult(parsed.data.quality_certificate, current.internal_batch, '/dashboard/receipts/paper', parsed.data.quality_notes, receiptId)

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath('/dashboard/inventory/papers')
  return { success: true }
}

export async function updateInkReceiptAdmin(
  receiptId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = updateInkReceiptAdminSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('ink_receipts')
    .select('quality_certificate')
    .eq('id', receiptId)
    .single()

  if (!current) return { error: 'Recepción no encontrada' }

  const isPending = current.quality_certificate === 'PENDING'

  const updatePayload: Record<string, unknown> = {
    receipt_date:      parsed.data.receipt_date,
    invoice_remission: parsed.data.invoice_remission,
    provider_batch:    parsed.data.provider_batch,
    quality_notes:     parsed.data.quality_notes ?? null,
    certificate_url:   parsed.data.certificate_url ?? null,
    updated_at:        new Date().toISOString(),
  }

  if (isPending) {
    if (parsed.data.internal_batch  !== undefined) updatePayload.internal_batch  = parsed.data.internal_batch
    if (parsed.data.kg_received     !== undefined) updatePayload.kg_received     = parsed.data.kg_received
    if (parsed.data.units_received  !== undefined) updatePayload.units_received  = parsed.data.units_received
  }

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('ink_receipts')
    .update(updatePayload as any)
    .eq('id', receiptId)

  if (error) return { error: error.message }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath('/dashboard/inventory/inks')
  return { success: true }
}

export async function updatePaperReceiptAdmin(
  receiptId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = updatePaperReceiptAdminSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  const { data: current } = await supabase
    .from('paper_receipts')
    .select('quality_certificate')
    .eq('id', receiptId)
    .single()

  if (!current) return { error: 'Recepción no encontrada' }

  const isPending = current.quality_certificate === 'PENDING'

  const updatePayload: Record<string, unknown> = {
    receipt_date:      parsed.data.receipt_date,
    invoice_remission: parsed.data.invoice_remission,
    provider_batch:    parsed.data.provider_batch,
    quality_notes:     parsed.data.quality_notes ?? null,
    certificate_url:   parsed.data.certificate_url ?? null,
    updated_at:        new Date().toISOString(),
  }

  if (isPending) {
    if (parsed.data.internal_batch !== undefined) updatePayload.internal_batch = parsed.data.internal_batch
    if (parsed.data.length_m       !== undefined) updatePayload.length_m       = parsed.data.length_m
    if (parsed.data.width_m        !== undefined) updatePayload.width_m        = parsed.data.width_m
    if (parsed.data.units_received !== undefined) updatePayload.units_received = parsed.data.units_received
  }

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('paper_receipts')
    .update(updatePayload as any)
    .eq('id', receiptId)

  if (error) return { error: error.message }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath('/dashboard/inventory/papers')
  return { success: true }
}

// ─── Lot quantity corrections (solo ADMIN) ────────────────────────────────────

export async function correctInkLotQuantity(
  inventoryId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return { error: 'Solo administradores pueden corregir lotes' }

  const parsed = correctInkLotSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  const { data: lot } = await supabase
    .from('ink_inventory')
    .select('initial_kg, used_kg')
    .eq('id', inventoryId)
    .single()

  if (!lot) return { error: 'Lote no encontrado' }

  const used_kg      = lot.used_kg ?? 0
  const remaining_kg = parsed.data.new_kg - used_kg

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('ink_inventory')
    .update({
      initial_kg:   parsed.data.new_kg,
      remaining_kg: remaining_kg > 0 ? remaining_kg : 0,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', inventoryId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/inks')
  return { success: true }
}

export async function correctPaperLotQuantity(
  inventoryId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return { error: 'Solo administradores pueden corregir lotes' }

  const parsed = correctPaperLotSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  const { data: lot } = await supabase
    .from('paper_inventory')
    .select('initial_length_m, initial_width_m, used_m2')
    .eq('id', inventoryId)
    .single()

  if (!lot) return { error: 'Lote no encontrado' }

  const new_m2       = parsed.data.new_length_m * parsed.data.new_width_m
  const used_m2      = lot.used_m2 ?? 0
  const remaining_m2 = new_m2 - used_m2

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('paper_inventory')
    .update({
      initial_length_m:   parsed.data.new_length_m,
      initial_width_m:    parsed.data.new_width_m,
      initial_m2:         new_m2,
      remaining_m2:       remaining_m2 > 0 ? remaining_m2 : 0,
      remaining_length_m: parsed.data.new_length_m,
      remaining_width_m:  parsed.data.new_width_m,
      updated_at:         new Date().toISOString(),
    })
    .eq('id', inventoryId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/inventory/papers')
  return { success: true }
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function _updateOrderItemAndStatus(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: number,
  itemId: number,
  newUnitsInReceipt: number,
  unitsOrdered: number,
  prevUnitsReceived: number,
  materialType: 'INK' | 'PAPER'
) {
  const newUnitsReceived = prevUnitsReceived + newUnitsInReceipt
  const isComplete       = newUnitsReceived >= unitsOrdered

  const itemTable = materialType === 'INK'
    ? 'purchase_order_ink_items'
    : 'purchase_order_paper_items'

  await supabase
    .from(itemTable as 'purchase_order_ink_items')
    .update({ units_received: newUnitsReceived, is_complete: isComplete } as any)
    .eq('id', itemId)

  // Re-read all items to determine order status
  const { data: allItems } = await supabase
    .from(itemTable as 'purchase_order_ink_items')
    .select('is_complete, units_received')
    .eq('purchase_order_id', orderId) as any

  const items = (allItems ?? []) as Array<{ is_complete: boolean | null; units_received: number | null }>

  const allComplete  = items.every(i => i.is_complete || (i.units_received ?? 0) >= unitsOrdered)
  const anyReceived  = items.some(i => (i.units_received ?? 0) > 0)

  type PurchaseOrderStatus = Database['public']['Enums']['purchase_order_status']
  const newStatus = (allComplete ? 'COMPLETED' : anyReceived ? 'PARTIAL' : 'PENDING') as PurchaseOrderStatus

  const { error: statusError } = await supabase
    .from('purchase_orders')
    .update({
      status: newStatus,
      actual_delivery_date: newStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', orderId)

  if (statusError) console.error('[receipts] order status update failed:', statusError.message)
}
